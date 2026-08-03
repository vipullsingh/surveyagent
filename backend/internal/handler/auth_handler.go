package handler

import (
	"net/http"
	"time"

	"surveyagent-backend/internal/config"
	"surveyagent-backend/internal/db"
	"surveyagent-backend/internal/domain"
	"surveyagent-backend/internal/middleware"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	cfg   *config.Config
	store *db.Store
	repo  db.Repository
}

func NewAuthHandler(cfg *config.Config, store *db.Store) *AuthHandler {
	return &AuthHandler{
		cfg:   cfg,
		store: store,
		repo:  db.GlobalRepo,
	}
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token string       `json:"token"`
	User  *domain.User `json:"user"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid login payload: " + err.Error()})
		return
	}

	var user *domain.User
	var err error
	if h.repo != nil {
		user, err = h.repo.GetUserByEmail(c.Request.Context(), req.Email)
	}

	if user == nil || err != nil {
		uStore, found := h.store.GetUserByEmail(req.Email)
		if !found {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
			return
		}
		user = uStore
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	if !user.IsActive {
		c.JSON(http.StatusForbidden, gin.H{"error": "User account is disabled"})
		return
	}

	token, err := middleware.GenerateToken(user, h.cfg.JWTSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate authentication token"})
		return
	}

	c.JSON(http.StatusOK, LoginResponse{
		Token: token,
		User:  user,
	})
}

func (h *AuthHandler) Profile(c *gin.Context) {
	userIDStr := c.MustGet("userID").(uuid.UUID).String()

	var user *domain.User
	var err error
	if h.repo != nil {
		user, err = h.repo.GetUserByID(c.Request.Context(), userIDStr)
	}

	if user == nil || err != nil {
		uid := uuid.MustParse(userIDStr)
		uStore, exists := h.store.Users[uid]
		if !exists {
			c.JSON(http.StatusNotFound, gin.H{"error": "User profile not found"})
			return
		}
		user = uStore
	}

	c.JSON(http.StatusOK, gin.H{"user": user})
}

type CreateUserRequest struct {
	Email    string      `json:"email" binding:"required,email"`
	Password string      `json:"password" binding:"required,min=8"`
	FullName string      `json:"full_name" binding:"required"`
	Phone    string      `json:"phone"`
	Role     domain.Role `json:"role" binding:"required"`
}

func (h *AuthHandler) CreateUser(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	orgID := c.MustGet("organizationID").(uuid.UUID)

	if h.repo != nil {
		existing, _ := h.repo.GetUserByEmail(c.Request.Context(), req.Email)
		if existing != nil {
			c.JSON(http.StatusConflict, gin.H{"error": "User with this email already exists"})
			return
		}
	} else if _, exists := h.store.GetUserByEmail(req.Email); exists {
		c.JSON(http.StatusConflict, gin.H{"error": "User with this email already exists"})
		return
	}

	hashedPw, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Password hashing error"})
		return
	}

	newUser := &domain.User{
		ID:             uuid.New(),
		OrganizationID: orgID,
		Email:          req.Email,
		PasswordHash:   string(hashedPw),
		FullName:       req.FullName,
		Phone:          req.Phone,
		Role:           req.Role,
		IsActive:       true,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	if h.repo != nil {
		_ = h.repo.CreateUser(c.Request.Context(), newUser)
	}
	h.store.Users[newUser.ID] = newUser

	c.JSON(http.StatusCreated, gin.H{"message": "User created successfully", "user": newUser})
}
