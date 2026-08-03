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
}

func NewSyncHandler(store *db.Store) *SyncHandler {
	return &SyncHandler{store: store}
}

func (h *SyncHandler) ProcessSync(c *gin.Context) {
	var req domain.SyncRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid sync payload format: " + err.Error()})
		return
	}

	orgID := c.MustGet("organizationID").(uuid.UUID)
	userID := c.MustGet("userID").(uuid.UUID)

	var failed []domain.SyncError
	processedCount := 0

	for _, delta := range req.Deltas {
		switch delta.EntityName {
		case "case":
			err := h.processCaseDelta(orgID, userID, delta)
			if err != nil {
				failed = append(failed, domain.SyncError{
					EntityID: delta.EntityID,
					Reason:   err.Error(),
				})
			} else {
				processedCount++
			}
		case "media":
			err := h.processMediaDelta(delta)
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

	// Fetch updates modified on server since last_synced_at
	var serverUpdates []domain.SyncDelta
	for _, item := range h.store.ListCases(orgID) {
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

func (h *SyncHandler) processCaseDelta(orgID, userID uuid.UUID, delta domain.SyncDelta) error {
	var c domain.Case
	if err := json.Unmarshal([]byte(delta.Data), &c); err != nil {
		return err
	}

	c.OrganizationID = orgID
	if c.AssignedTo == nil {
		c.AssignedTo = &userID
	}
	c.UpdatedAt = time.Now()

	h.store.SaveCase(&c)
	return nil
}

func (h *SyncHandler) processMediaDelta(delta domain.SyncDelta) error {
	var m domain.Media
	if err := json.Unmarshal([]byte(delta.Data), &m); err != nil {
		return err
	}

	h.store.Medias[m.ID] = &m
	return nil
}
