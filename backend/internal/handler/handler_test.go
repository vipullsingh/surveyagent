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
