package handler

import (
	"fmt"
	"net/http"
	"time"

	"surveyagent-backend/internal/db"
	"surveyagent-backend/internal/domain"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ReportHandler struct {
	store *db.Store
	repo  db.Repository
}

func NewReportHandler(store *db.Store) *ReportHandler {
	return &ReportHandler{
		store: store,
		repo:  db.GlobalRepo,
	}
}

type GenerateReportRequest struct {
	CaseID           uuid.UUID `json:"case_id" binding:"required"`
	TemplateType     string    `json:"template_type"`
	IncludePhotos    bool      `json:"include_photos"`
	IncludeGeotags   bool      `json:"include_geotags"`
	CustomRemarks    string    `json:"custom_remarks"`
	InspectorSignOff string    `json:"inspector_sign_off"`
}

func (h *ReportHandler) GenerateReportPDF(c *gin.Context) {
	var req GenerateReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var caseItem *domain.Case
	if h.repo != nil {
		caseItem, _ = h.repo.GetCaseByID(c.Request.Context(), req.CaseID.String())
	}
	if caseItem == nil {
		cStore, exists := h.store.GetCase(req.CaseID)
		if !exists {
			c.JSON(http.StatusNotFound, gin.H{"error": "Case not found"})
			return
		}
		caseItem = cStore
	}

	orgID := c.MustGet("organizationID").(uuid.UUID)
	org := h.store.Organizations[orgID]
	orgName := "SurveyAgent Adjusting Firm"
	if org != nil {
		orgName = org.Name
	}

	htmlReport := fmt.Sprintf(`<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<title>Survey Report - %s</title>
	<style>
		body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; margin: 40px; line-height: 1.5; }
		.header { border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; }
		.title { font-size: 24px; font-weight: bold; color: #1e3a8a; margin: 0; }
		.subtitle { font-size: 14px; color: #64748b; margin-top: 5px; }
		.section-title { font-size: 16px; font-weight: bold; color: #1e40af; background: #eff6ff; padding: 6px 12px; border-left: 4px solid #2563eb; margin-top: 25px; margin-bottom: 12px; }
		table { width: 100%%; border-collapse: collapse; margin-bottom: 15px; }
		th, td { border: 1px solid #cbd5e1; padding: 8px 12px; font-size: 13px; text-align: left; }
		th { background: #f8fafc; font-weight: 600; color: #334155; }
		.badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; background: #e0e7ff; color: #3730a3; }
		.footer { margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 12px; color: #94a3b8; text-align: center; }
	</style>
</head>
<body>
	<div class="header">
		<div>
			<div class="title">%s</div>
			<div class="subtitle">CONFIDENTIAL INSURANCE SURVEY & LOSS ADJUSTMENT REPORT</div>
		</div>
		<div style="text-align: right;">
			<div><strong>Ref:</strong> %s</div>
			<div><strong>Date:</strong> %s</div>
		</div>
	</div>

	<div class="section-title">1. CLAIM & POLICY IDENTIFICATION</div>
	<table>
		<tr>
			<th>Policy Number</th><td>%s</td>
			<th>Claim Type</th><td><span class="badge">%s</span></td>
		</tr>
		<tr>
			<th>Insured Name</th><td>%s</td>
			<th>Contact</th><td>%s</td>
		</tr>
		<tr>
			<th>Date of Loss</th><td>%s</td>
			<th>Status</th><td>%s</td>
		</tr>
		<tr>
			<th>Location</th><td colspan="3">%s</td>
		</tr>
	</table>

	<div class="section-title">2. AI FINDINGS & DAMAGE ASSESSMENT</div>
	<p><strong>Overview:</strong> %s</p>
	<p><strong>Surveyor Remarks:</strong> %s</p>

	<div class="section-title">3. CHECKLIST SUMMARY</div>
	<pre style="background:#f1f5f9; padding:10px; border-radius:4px; font-size:12px;">%s</pre>

	<div class="section-title">4. SIGN-OFF & CERTIFICATION</div>
	<p>I hereby certify that I conducted an independent on-site inspection of the subject claim asset.</p>
	<div style="margin-top: 30px; display: flex; justify-content: space-between;">
		<div>
			<p><strong>Inspector Signature:</strong> %s</p>
			<p>Date: %s</p>
		</div>
	</div>

	<div class="footer">
		Generated via SurveyAgent Mobile Platform • Official Geotagged Audit Record
	</div>
</body>
</html>`,
		caseItem.CaseNumber,
		orgName,
		caseItem.CaseNumber,
		time.Now().Format("02 Jan 2006"),
		caseItem.PolicyNumber,
		caseItem.ClaimType,
		caseItem.InsuredName,
		caseItem.InsuredContact,
		caseItem.DateOfLoss.Format("02 Jan 2006"),
		caseItem.Status,
		caseItem.Location,
		caseItem.AISummary,
		req.CustomRemarks,
		caseItem.ChecklistData,
		req.InspectorSignOff,
		time.Now().Format("02 Jan 2006 15:04 MST"),
	)

	c.JSON(http.StatusOK, gin.H{
		"message":      "Report HTML/PDF layout compiled successfully",
		"case_id":      caseItem.ID,
		"report_html":  htmlReport,
		"generated_at": time.Now(),
	})
}
