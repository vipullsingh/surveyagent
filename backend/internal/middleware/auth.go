package middleware

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"surveyagent-backend/internal/domain"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type Claims struct {
	UserID         uuid.UUID   `json:"user_id"`
	OrganizationID uuid.UUID   `json:"organization_id"`
	Role           domain.Role `json:"role"`
	Email          string      `json:"email"`
	jwt.RegisteredClaims
}

func GenerateToken(user *domain.User, secret string) (string, error) {
	expirationTime := time.Now().Add(24 * 7 * time.Hour)
	claims := &Claims{
		UserID:         user.ID,
		OrganizationID: user.OrganizationID,
		Role:           user.Role,
		Email:          user.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func AuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization format"})
			c.Abort()
			return
		}

		tokenStr := parts[1]
		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, errors.New("unexpected signing method")
			}
			return []byte(jwtSecret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		c.Set("userID", claims.UserID)
		c.Set("organizationID", claims.OrganizationID)
		c.Set("role", claims.Role)
		c.Set("email", claims.Email)
		c.Next()
	}
}

// RequireRole enforces Organizational RBAC rules
func RequireRole(allowedRoles ...domain.Role) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleVal, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "Role context missing"})
			c.Abort()
			return
		}

		userRole := roleVal.(domain.Role)

		// SuperAdmin bypasses standard firm role checks
		if userRole == domain.RoleSuperAdmin {
			c.Next()
			return
		}

		allowed := false
		for _, r := range allowedRoles {
			if userRole == r {
				allowed = true
				break
			}
		}

		if !allowed {
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions for this resource"})
			c.Abort()
			return
		}

		c.Next()
	}
}
