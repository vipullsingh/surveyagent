package handler

import (
	"net/http"
	"strings"
	"time"

	"surveyagent-backend/internal/db"
	"surveyagent-backend/internal/domain"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CaseHandler struct {
	store *db.Store
	repo  db.Repository
}

func NewCaseHandler(store *db.Store) *CaseHandler {
	return &CaseHandler{
		store: store,
		repo:  db.GlobalRepo,
	}
}

func (h *CaseHandler) ListCases(c *gin.Context) {
	orgID := c.MustGet("organizationID").(uuid.UUID)
	role := c.MustGet("role").(domain.Role)
	userID := c.MustGet("userID").(uuid.UUID)

	querySearch := c.Query("search")
	queryStatus := c.Query("status")
	queryClaimType := c.Query("claim_type")

	var allCases []*domain.Case
	if h.repo != nil {
		gCases, err := h.repo.ListCases(c.Request.Context(), orgID.String(), queryStatus, queryClaimType)
		if err == nil && len(gCases) > 0 {
			for i := range gCases {
				allCases = append(allCases, &gCases[i])
			}
		}
	}

	if len(allCases) == 0 {
		allCases = h.store.ListCases(orgID)
	}

	var filtered []*domain.Case
	for _, item := range allCases {
		if role == domain.RoleSurveyor && item.AssignedTo != nil && *item.AssignedTo != userID {
			continue
		}

		if queryStatus != "" && string(item.Status) != queryStatus {
			continue
		}

		if queryClaimType != "" && string(item.ClaimType) != queryClaimType {
			continue
		}

		if querySearch != "" {
			s := strings.ToLower(querySearch)
			matchCaseNumber := strings.Contains(strings.ToLower(item.CaseNumber), s)
			matchInsured := strings.Contains(strings.ToLower(item.InsuredName), s)
			matchPolicy := strings.Contains(strings.ToLower(item.PolicyNumber), s)
			if !matchCaseNumber && !matchInsured && !matchPolicy {
				continue
			}
		}

		filtered = append(filtered, item)
	}

	c.JSON(http.StatusOK, gin.H{"cases": filtered, "count": len(filtered)})
}

func (h *CaseHandler) GetCase(c *gin.Context) {
	idStr := c.Param("id")
	caseID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid case ID format"})
		return
	}

	var item *domain.Case
	if h.repo != nil {
		item, _ = h.repo.GetCaseByID(c.Request.Context(), idStr)
	}

	if item == nil {
		cStore, exists := h.store.GetCase(caseID)
		if !exists {
			c.JSON(http.StatusNotFound, gin.H{"error": "Case not found"})
			return
		}
		item = cStore
	}

	orgID := c.MustGet("organizationID").(uuid.UUID)
	if item.OrganizationID != orgID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"case": item})
}

type CreateCaseRequest struct {
	CaseNumber     string           `json:"case_number" binding:"required"`
	ClaimType      domain.ClaimType `json:"claim_type" binding:"required"`
	PolicyNumber   string           `json:"policy_number" binding:"required"`
	InsuredName    string           `json:"insured_name" binding:"required"`
	InsuredContact string           `json:"insured_contact"`
	Location       string           `json:"location"`
	Latitude       *float64         `json:"latitude"`
	Longitude      *float64         `json:"longitude"`
	DateOfLoss     time.Time        `json:"date_of_loss"`
	Priority       string           `json:"priority"`
	Notes          string           `json:"notes"`
	ChecklistData  string           `json:"checklist_data"`
}

func (h *CaseHandler) CreateCase(c *gin.Context) {
	var req CreateCaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	orgID := c.MustGet("organizationID").(uuid.UUID)
	userID := c.MustGet("userID").(uuid.UUID)

	priority := req.Priority
	if priority == "" {
		priority = "MEDIUM"
	}

	newCase := &domain.Case{
		ID:             uuid.New(),
		OrganizationID: orgID,
		CaseNumber:     req.CaseNumber,
		ClaimType:      req.ClaimType,
		PolicyNumber:   req.PolicyNumber,
		InsuredName:    req.InsuredName,
		InsuredContact: req.InsuredContact,
		Location:       req.Location,
		Latitude:       req.Latitude,
		Longitude:      req.Longitude,
		DateOfLoss:     req.DateOfLoss,
		AssignedDate:   time.Now(),
		AssignedTo:     &userID,
		Priority:       priority,
		Status:         domain.StatusDraft,
		ChecklistData:  req.ChecklistData,
		Notes:          req.Notes,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	if h.repo != nil {
		_ = h.repo.CreateCase(c.Request.Context(), newCase)
	}
	h.store.SaveCase(newCase)

	c.JSON(http.StatusCreated, gin.H{"case": newCase})
}

func (h *CaseHandler) UpdateCaseStatus(c *gin.Context) {
	idStr := c.Param("id")
	caseID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid case ID"})
		return
	}

	var item *domain.Case
	if h.repo != nil {
		item, _ = h.repo.GetCaseByID(c.Request.Context(), idStr)
	}
	if item == nil {
		cStore, exists := h.store.GetCase(caseID)
		if !exists {
			c.JSON(http.StatusNotFound, gin.H{"error": "Case not found"})
			return
		}
		item = cStore
	}

	var req struct {
		Status    domain.CaseStatus `json:"status" binding:"required"`
		Notes     string            `json:"notes"`
		AISummary string            `json:"ai_summary"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	item.Status = req.Status
	if req.Notes != "" {
		item.Notes = req.Notes
	}
	if req.AISummary != "" {
		item.AISummary = req.AISummary
	}
	item.UpdatedAt = time.Now()

	if h.repo != nil {
		_ = h.repo.UpdateCase(c.Request.Context(), item)
	}
	h.store.SaveCase(item)

	c.JSON(http.StatusOK, gin.H{"message": "Status updated successfully", "case": item})
}
