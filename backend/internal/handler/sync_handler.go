package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"surveyagent-backend/internal/db"
	"surveyagent-backend/internal/domain"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type SyncHandler struct {
	store *db.Store
	repo  db.Repository
}

func NewSyncHandler(store *db.Store) *SyncHandler {
	return &SyncHandler{
		store: store,
		repo:  db.GlobalRepo,
	}
}

func (h *SyncHandler) ProcessSync(c *gin.Context) {
	var req domain.SyncRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid sync payload format: " + err.Error()})
		return
	}

	var orgID uuid.UUID
	var userID uuid.UUID

	if orgIDVal, exists := c.Get("organizationID"); exists {
		orgID = orgIDVal.(uuid.UUID)
	} else {
		orgID = uuid.MustParse("00000000-0000-0000-0000-000000000001")
	}

	if userIDVal, exists := c.Get("userID"); exists {
		userID = userIDVal.(uuid.UUID)
	} else {
		userID = uuid.MustParse("00000000-0000-0000-0000-000000000002")
	}

	var failed []domain.SyncError
	processedCount := 0

	for _, delta := range req.Deltas {
		switch delta.EntityName {
		case "case":
			err := h.processCaseDelta(c, orgID, userID, delta)
			if err != nil {
				failed = append(failed, domain.SyncError{
					EntityID: delta.EntityID,
					Reason:   err.Error(),
				})
			} else {
				processedCount++
			}
		case "media":
			err := h.processMediaDelta(c, delta)
			if err != nil {
				failed = append(failed, domain.SyncError{
					EntityID: delta.EntityID,
					Reason:   err.Error(),
				})
			} else {
				processedCount++
			}
		default:
			failed = append(failed, domain.SyncError{
				EntityID: delta.EntityID,
				Reason:   "Unsupported entity type: " + delta.EntityName,
			})
		}
	}

	var serverUpdates []domain.SyncDelta
	var cases []*domain.Case

	if h.repo != nil {
		gCases, _ := h.repo.ListCases(c.Request.Context(), orgID.String(), "", "")
		for i := range gCases {
			cases = append(cases, &gCases[i])
		}
	}
	if len(cases) == 0 {
		cases = h.store.ListCases(orgID)
	}

	for _, item := range cases {
		if item.UpdatedAt.After(req.LastSyncedAt) {
			jsonBytes, _ := json.Marshal(item)
			serverUpdates = append(serverUpdates, domain.SyncDelta{
				EntityName: "case",
				EntityID:   item.ID,
				Action:     "UPDATE",
				Data:       string(jsonBytes),
				ClientTime: item.UpdatedAt,
			})
		}
	}

	c.JSON(http.StatusOK, domain.SyncResponse{
		SyncedAt:        time.Now(),
		ProcessedDeltas: processedCount,
		FailedDeltas:    failed,
		ServerUpdates:   serverUpdates,
	})
}

func (h *SyncHandler) processCaseDelta(c *gin.Context, orgID, userID uuid.UUID, delta domain.SyncDelta) error {
	var item domain.Case
	if err := json.Unmarshal([]byte(delta.Data), &item); err != nil {
		return err
	}

	item.OrganizationID = orgID
	if item.AssignedTo == nil {
		item.AssignedTo = &userID
	}
	item.UpdatedAt = time.Now()

	if h.repo != nil {
		_ = h.repo.CreateCase(c.Request.Context(), &item)
	}
	h.store.SaveCase(&item)
	return nil
}

func (h *SyncHandler) processMediaDelta(c *gin.Context, delta domain.SyncDelta) error {
	var m domain.Media
	if err := json.Unmarshal([]byte(delta.Data), &m); err != nil {
		return err
	}

	// A DELETE delta carries only identifiers, so merge it onto the stored record
	// rather than overwriting the evidence metadata with zero values.
	if delta.Action == "DELETE" {
		if existing, ok := h.store.Medias[m.ID]; ok {
			existing.IsDeleted = true
			if h.repo != nil {
				_ = h.repo.CreateMedia(c.Request.Context(), existing)
			}
			return nil
		}
		m.IsDeleted = true
	}

	if m.CreatedAt.IsZero() {
		m.CreatedAt = time.Now()
	}

	if h.repo != nil {
		_ = h.repo.CreateMedia(c.Request.Context(), &m)
	}
	h.store.Medias[m.ID] = &m
	return nil
}
