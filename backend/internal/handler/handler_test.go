package handler_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"surveyagent-backend/internal/config"
	"surveyagent-backend/internal/db"
	"surveyagent-backend/internal/domain"
	"surveyagent-backend/internal/handler"
	"surveyagent-backend/internal/middleware"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func setupTestRouter() (*gin.Engine, *db.Store, *config.Config) {
	gin.SetMode(gin.TestMode)
	cfg := &config.Config{
		Port:        "8080",
		JWTSecret:   "test-secret-key-12345",
		Environment: "test",
	}
	store := db.InitStore()

	router := gin.Default()
	authH := handler.NewAuthHandler(cfg, store)
	caseH := handler.NewCaseHandler(store)
	syncH := handler.NewSyncHandler(store)
	reportH := handler.NewReportHandler(store)

	v1 := router.Group("/api/v1")
	v1.POST("/auth/login", authH.Login)

	protected := v1.Group("")
	protected.Use(middleware.AuthMiddleware(cfg.JWTSecret))
	{
		protected.GET("/auth/me", authH.Profile)
		protected.GET("/cases", caseH.ListCases)
		protected.POST("/cases", caseH.CreateCase)
		protected.POST("/sync", syncH.ProcessSync)
		protected.POST("/reports/generate", reportH.GenerateReportPDF)
	}

	return router, store, cfg
}

func TestLoginSuccess(t *testing.T) {
	router, _, _ := setupTestRouter()

	body := map[string]string{
		"email":    "admin@apexadjusters.com",
		"password": "Password123!",
	}
	jsonBytes, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(jsonBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK, got %d. Response: %s", w.Code, w.Body.String())
	}

	var resp handler.LoginResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("Failed to parse login response: %v", err)
	}

	if resp.Token == "" {
		t.Fatal("Expected JWT token in login response")
	}
}

func TestListCasesProtected(t *testing.T) {
	router, store, cfg := setupTestRouter()

	// Get admin user
	adminUser := store.Users[uuid.MustParse("00000000-0000-0000-0000-000000000002")]
	token, _ := middleware.GenerateToken(adminUser, cfg.JWTSecret)

	req, _ := http.NewRequest("GET", "/api/v1/cases", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK, got %d. Response: %s", w.Code, w.Body.String())
	}
}

func TestProcessSyncDelta(t *testing.T) {
	router, store, cfg := setupTestRouter()

	surveyorUser := store.Users[uuid.MustParse("00000000-0000-0000-0000-000000000003")]
	token, _ := middleware.GenerateToken(surveyorUser, cfg.JWTSecret)

	newCaseID := uuid.New()
	casePayload := domain.Case{
		ID:           newCaseID,
		CaseNumber:   "CAS-OFFLINE-001",
		ClaimType:    domain.ClaimTypeFire,
		PolicyNumber: "POL-FIRE-771",
		InsuredName:  "Acme Warehouses",
		Status:       domain.StatusDraft,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
	dataBytes, _ := json.Marshal(casePayload)

	syncReq := domain.SyncRequest{
		LastSyncedAt: time.Now().Add(-1 * time.Hour),
		Deltas: []domain.SyncDelta{
			{
				EntityName: "case",
				EntityID:   newCaseID,
				Action:     "CREATE",
				Data:       string(dataBytes),
				ClientTime: time.Now(),
			},
		},
	}
	syncBytes, _ := json.Marshal(syncReq)

	req, _ := http.NewRequest("POST", "/api/v1/sync", bytes.NewBuffer(syncBytes))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for sync, got %d. Response: %s", w.Code, w.Body.String())
	}

	var syncResp domain.SyncResponse
	json.Unmarshal(w.Body.Bytes(), &syncResp)
	if syncResp.ProcessedDeltas != 1 {
		t.Fatalf("Expected 1 processed delta, got %d", syncResp.ProcessedDeltas)
	}

	// Verify case is now saved in store
	if _, exists := store.GetCase(newCaseID); !exists {
		t.Fatal("Expected offline synced case to exist in memory store")
	}
}

// postSyncDeltas is a helper for driving the sync endpoint as a field surveyor.
func postSyncDeltas(t *testing.T, router *gin.Engine, token string, deltas []domain.SyncDelta) domain.SyncResponse {
	t.Helper()

	syncBytes, _ := json.Marshal(domain.SyncRequest{
		LastSyncedAt: time.Now().Add(-1 * time.Hour),
		Deltas:       deltas,
	})

	req, _ := http.NewRequest("POST", "/api/v1/sync", bytes.NewBuffer(syncBytes))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for sync, got %d. Response: %s", w.Code, w.Body.String())
	}

	var resp domain.SyncResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("Failed to parse sync response: %v", err)
	}
	return resp
}

// Mirrors the snake_case payload emitted by the mobile client's toMediaDeltaPayload.
func TestProcessMediaEvidenceDelta(t *testing.T) {
	router, store, cfg := setupTestRouter()

	surveyorUser := store.Users[uuid.MustParse("00000000-0000-0000-0000-000000000003")]
	token, _ := middleware.GenerateToken(surveyorUser, cfg.JWTSecret)

	mediaID := uuid.New()
	caseID := uuid.New()
	payload := map[string]any{
		"id":           mediaID,
		"case_id":      caseID,
		"file_type":    "PHOTO",
		"file_name":    "evidence_1.jpg",
		"file_size":    481203,
		"local_path":   "file:///data/SurveyAgent/evidence/evidence_1.jpg",
		"latitude":     12.971599,
		"longitude":    77.594566,
		"altitude":     912.4,
		"gps_accuracy": 4.5,
		"timestamp":    time.Now(),
		"angle_id":     "front_bumper",
		"angle_label":  "Front Bumper",
		"annotations":  `[{"id":"ann-1","tool":"ARROW","color":"#ef4444","strokeWidth":4,"points":[{"x":0.2,"y":0.3},{"x":0.6,"y":0.5}],"createdAt":"2026-08-04T10:00:00.000Z"}]`,
		"quality":      `{"verdict":"GOOD","score":88,"sharpness":412.5}`,
		"ai_tags":      []string{"front_bumper", "geotagged"},
		"caption":      "Radiator support crushed",
		"is_deleted":   false,
	}
	dataBytes, _ := json.Marshal(payload)

	resp := postSyncDeltas(t, router, token, []domain.SyncDelta{{
		EntityName: "media",
		EntityID:   mediaID,
		Action:     "CREATE",
		Data:       string(dataBytes),
		ClientTime: time.Now(),
	}})

	if resp.ProcessedDeltas != 1 {
		t.Fatalf("Expected 1 processed media delta, got %d (failures: %+v)", resp.ProcessedDeltas, resp.FailedDeltas)
	}

	stored, exists := store.Medias[mediaID]
	if !exists {
		t.Fatal("Expected synced evidence to exist in memory store")
	}
	if stored.AngleLabel != "Front Bumper" {
		t.Errorf("Expected guided wizard angle to round-trip, got %q", stored.AngleLabel)
	}
	if stored.Altitude == nil || *stored.Altitude != 912.4 {
		t.Errorf("Expected altitude geotag to round-trip, got %v", stored.Altitude)
	}
	if stored.GPSAccuracy == nil || *stored.GPSAccuracy != 4.5 {
		t.Errorf("Expected GPS accuracy to round-trip, got %v", stored.GPSAccuracy)
	}
	if stored.Annotations == "" {
		t.Error("Expected vector annotations to round-trip")
	}
	if stored.Quality == "" {
		t.Error("Expected on-device quality report to round-trip")
	}
	if stored.CreatedAt.IsZero() {
		t.Error("Expected CreatedAt to be backfilled by the sync handler")
	}
}

// A DELETE delta carries identifiers only; it must soft-delete without wiping metadata.
func TestProcessMediaDeleteDeltaPreservesMetadata(t *testing.T) {
	router, store, cfg := setupTestRouter()

	surveyorUser := store.Users[uuid.MustParse("00000000-0000-0000-0000-000000000003")]
	token, _ := middleware.GenerateToken(surveyorUser, cfg.JWTSecret)

	mediaID := uuid.New()
	caseID := uuid.New()
	createBytes, _ := json.Marshal(map[string]any{
		"id":          mediaID,
		"case_id":     caseID,
		"file_type":   "PHOTO",
		"angle_label": "Chassis VIN Plate",
		"caption":     "VIN legible",
		"timestamp":   time.Now(),
	})
	postSyncDeltas(t, router, token, []domain.SyncDelta{{
		EntityName: "media",
		EntityID:   mediaID,
		Action:     "CREATE",
		Data:       string(createBytes),
		ClientTime: time.Now(),
	}})

	deleteBytes, _ := json.Marshal(map[string]any{
		"id":         mediaID,
		"case_id":    caseID,
		"is_deleted": true,
	})
	resp := postSyncDeltas(t, router, token, []domain.SyncDelta{{
		EntityName: "media",
		EntityID:   mediaID,
		Action:     "DELETE",
		Data:       string(deleteBytes),
		ClientTime: time.Now(),
	}})

	if resp.ProcessedDeltas != 1 {
		t.Fatalf("Expected 1 processed delete delta, got %d (failures: %+v)", resp.ProcessedDeltas, resp.FailedDeltas)
	}

	stored, exists := store.Medias[mediaID]
	if !exists {
		t.Fatal("Soft-deleted evidence must remain in the store for the audit trail")
	}
	if !stored.IsDeleted {
		t.Error("Expected evidence to be flagged as deleted")
	}
	if stored.AngleLabel != "Chassis VIN Plate" || stored.Caption != "VIN legible" {
		t.Errorf("DELETE delta overwrote evidence metadata: %+v", stored)
	}
}
