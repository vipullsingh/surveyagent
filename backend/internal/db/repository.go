package db

import (
	"context"
	"surveyagent-backend/internal/domain"
)

// Repository defines the persistence interface for SurveyAgent domain models.
type Repository interface {
	// User / Auth
	CreateUser(ctx context.Context, user *domain.User) error
	GetUserByEmail(ctx context.Context, email string) (*domain.User, error)
	GetUserByID(ctx context.Context, id string) (*domain.User, error)

	// Cases
	CreateCase(ctx context.Context, c *domain.Case) error
	GetCaseByID(ctx context.Context, id string) (*domain.Case, error)
	ListCases(ctx context.Context, orgID string, status string, claimType string) ([]domain.Case, error)
	UpdateCase(ctx context.Context, c *domain.Case) error
	DeleteCase(ctx context.Context, id string) error

	// Media
	CreateMedia(ctx context.Context, media *domain.Media) error
	GetMediaForCase(ctx context.Context, caseID string) ([]domain.Media, error)

	// Voice Notes
	CreateVoiceNote(ctx context.Context, vn *domain.VoiceNote) error
	GetVoiceNotesForCase(ctx context.Context, caseID string) ([]domain.VoiceNote, error)

	// Sync Deltas
	CreateSyncDelta(ctx context.Context, delta *domain.SyncDelta) error
	ProcessBatchDeltas(ctx context.Context, orgID string, deltas []domain.SyncDelta) (int, error)
}
