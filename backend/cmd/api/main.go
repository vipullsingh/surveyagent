package main

import (
	"fmt"
	"log"
	"net/http"

	"surveyagent-backend/internal/config"
	"surveyagent-backend/internal/db"
	"surveyagent-backend/internal/domain"
	"surveyagent-backend/internal/handler"
	"surveyagent-backend/internal/middleware"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.LoadConfig()
	store := db.InitStore()

	router := gin.Default()

	// CORS Middleware
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Handlers
	authH := handler.NewAuthHandler(cfg, store)
	caseH := handler.NewCaseHandler(store)
	syncH := handler.NewSyncHandler(store)
	reportH := handler.NewReportHandler(store)

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "healthy",
			"service": "SurveyAgent Backend API",
			"version": "1.0.0",
		})
	})

	// Public Auth Routes
	v1 := router.Group("/api/v1")
	{
		v1.POST("/auth/login", authH.Login)

		// Protected Routes
		protected := v1.Group("")
		protected.Use(middleware.AuthMiddleware(cfg.JWTSecret))
		{
			// Auth Profile
			protected.GET("/auth/me", authH.Profile)

			// Admin Users API (RBAC: Firm Admin)
			protected.POST("/users", middleware.RequireRole(domain.RoleFirmAdmin, domain.RoleSuperAdmin), authH.CreateUser)

			// Cases API
			protected.GET("/cases", caseH.ListCases)
			protected.GET("/cases/:id", caseH.GetCase)
			protected.POST("/cases", caseH.CreateCase)
			protected.PATCH("/cases/:id/status", caseH.UpdateCaseStatus)

			// Offline Delta Sync API
			protected.POST("/sync", syncH.ProcessSync)

			// PDF Reports API
			protected.POST("/reports/generate", reportH.GenerateReportPDF)
		}
	}

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("🚀 SurveyAgent Backend Server starting on %s...", addr)
	if err := router.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
