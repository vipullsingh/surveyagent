package db

import (
	"context"
	"errors"
	"fmt"
	"os"
	"sync"
	"time"

	"surveyagent-backend/internal/domain"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Store provides legacy thread-safe in-memory storage for SurveyAgent
type Store struct {
	mu            sync.RWMutex
	Organizations map[uuid.UUID]*domain.Organization
	Users         map[uuid.UUID]*domain.User
	Cases         map[uuid.UUID]*domain.Case
	Medias        map[uuid.UUID]*domain.Media
	VoiceNotes    map[uuid.UUID]*domain.VoiceNote
	AuditLogs     map[uuid.UUID]*domain.AuditLog
}

var GlobalStore *Store

// GormRepository implements the Repository interface using GORM.
type GormRepository struct {
	db *gorm.DB
}

var GlobalRepo Repository

func InitStore() *Store {
	store := &Store{
		Organizations: make(map[uuid.UUID]*domain.Organization),
		Users:         make(map[uuid.UUID]*domain.User),
		Cases:         make(map[uuid.UUID]*domain.Case),
		Medias:        make(map[uuid.UUID]*domain.Media),
		VoiceNotes:    make(map[uuid.UUID]*domain.VoiceNote),
		AuditLogs:     make(map[uuid.UUID]*domain.AuditLog),
	}

	// Seed default firm & admin user
	orgID := uuid.MustParse("00000000-0000-0000-0000-000000000001")
	org := &domain.Organization{
		ID:        orgID,
		Name:      "Apex Loss Adjusters Ltd",
		Code:      "APEX01",
		IsActive:  true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	store.Organizations[orgID] = org

	hashedPw, _ := bcrypt.GenerateFromPassword([]byte("Password123!"), bcrypt.DefaultCost)

	adminUser := &domain.User{
		ID:             uuid.MustParse("00000000-0000-0000-0000-000000000002"),
		OrganizationID: orgID,
		Email:          "admin@apexadjusters.com",
		PasswordHash:   string(hashedPw),
		FullName:       "Sarah Connor",
		Phone:          "+1234567890",
		Role:           domain.RoleFirmAdmin,
		IsActive:       true,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}
	store.Users[adminUser.ID] = adminUser

	surveyorUser := &domain.User{
		ID:             uuid.MustParse("00000000-0000-0000-0000-000000000003"),
		OrganizationID: orgID,
		Email:          "surveyor@apexadjusters.com",
		PasswordHash:   string(hashedPw),
		FullName:       "John LossInspector",
		Phone:          "+1987654321",
		Role:           domain.RoleSurveyor,
		IsActive:       true,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}
	store.Users[surveyorUser.ID] = surveyorUser

	caseID := uuid.MustParse("00000000-0000-0000-0000-000000000100")
	lat := 37.7749
	lng := -122.4194
	sampleCase := &domain.Case{
		ID:             caseID,
		OrganizationID: orgID,
		CaseNumber:     "CAS-2026-MOTOR-0891",
		ClaimType:      domain.ClaimTypeMotor,
		PolicyNumber:   "POL-9923812",
		InsuredName:    "Robert Davis",
		InsuredContact: "+1 (555) 234-5678",
		Location:       "Market St & 4th St, San Francisco, CA",
		Latitude:       &lat,
		Longitude:      &lng,
		DateOfLoss:     time.Now().Add(-48 * time.Hour),
		AssignedDate:   time.Now().Add(-24 * time.Hour),
		AssignedTo:     &surveyorUser.ID,
		Priority:       "HIGH",
		Status:         domain.StatusInProgress,
		ChecklistData:  `{"odometer": "45,210 miles", "point_of_impact": "Front bumper & radiator grill", "airbags_deployed": true}`,
		Notes:          "Vehicle involved in head-on collision at low speed.",
		AISummary:      "Frontal collision with radiator compromise. Moderate severity.",
		IsArchived:     false,
		CreatedAt:      time.Now().Add(-24 * time.Hour),
		UpdatedAt:      time.Now().Add(-2 * time.Hour),
	}
	store.Cases[caseID] = sampleCase

	GlobalStore = store

	// Also initialize GORM repository (SQLite or Postgres)
	var gormDB *gorm.DB
	var err error

	dsn := os.Getenv("POSTGRES_DSN")
	if dsn != "" {
		gormDB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})
		if err != nil {
			fmt.Printf("Warning: Failed to connect to Postgres, falling back to SQLite: %v\n", err)
			gormDB, _ = gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
		}
	} else {
		gormDB, err = gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Silent),
		})
		if err != nil {
			panic("Failed to open SQLite database")
		}
	}

	// Auto-Migrate Schemas
	_ = gormDB.AutoMigrate(
		&domain.Organization{},
		&domain.User{},
		&domain.Case{},
		&domain.Media{},
		&domain.VoiceNote{},
		&domain.SyncDelta{},
	)

	// Seed GORM DB
	var existingOrg domain.Organization
	if err := gormDB.First(&existingOrg, "id = ?", orgID).Error; err != nil {
		gormDB.Create(org)
		gormDB.Create(adminUser)
		gormDB.Create(surveyorUser)
		gormDB.Create(sampleCase)
	}

	GlobalRepo = &GormRepository{db: gormDB}
	return store
}

// Thread-safe Store helpers
func (s *Store) GetUserByEmail(email string) (*domain.User, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, u := range s.Users {
		if u.Email == email {
			return u, true
		}
	}
	return nil, false
}

func (s *Store) SaveCase(c *domain.Case) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.Cases[c.ID] = c
}

func (s *Store) GetCase(id uuid.UUID) (*domain.Case, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	c, exists := s.Cases[id]
	return c, exists
}

func (s *Store) ListCases(orgID uuid.UUID) []*domain.Case {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var list []*domain.Case
	for _, c := range s.Cases {
		if c.OrganizationID == orgID && !c.IsArchived {
			list = append(list, c)
		}
	}
	return list
}

// --- GormRepository Method Implementations ---

func (r *GormRepository) CreateUser(ctx context.Context, u *domain.User) error {
	return r.db.WithContext(ctx).Create(u).Error
}

func (r *GormRepository) GetUserByEmail(ctx context.Context, email string) (*domain.User, error) {
	var u domain.User
	if err := r.db.WithContext(ctx).Where("email = ?", email).First(&u).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &u, nil
}

func (r *GormRepository) GetUserByID(ctx context.Context, id string) (*domain.User, error) {
	var u domain.User
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}
	if err := r.db.WithContext(ctx).Where("id = ?", uid).First(&u).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &u, nil
}

func (r *GormRepository) CreateCase(ctx context.Context, c *domain.Case) error {
	return r.db.WithContext(ctx).Create(c).Error
}

func (r *GormRepository) GetCaseByID(ctx context.Context, id string) (*domain.Case, error) {
	var c domain.Case
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}
	if err := r.db.WithContext(ctx).Where("id = ?", uid).First(&c).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &c, nil
}

func (r *GormRepository) ListCases(ctx context.Context, orgID string, status string, claimType string) ([]domain.Case, error) {
	var cases []domain.Case
	oid, err := uuid.Parse(orgID)
	if err != nil {
		return nil, err
	}
	query := r.db.WithContext(ctx).Where("organization_id = ? AND is_archived = ?", oid, false)
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if claimType != "" {
		query = query.Where("claim_type = ?", claimType)
	}
	if err := query.Find(&cases).Error; err != nil {
		return nil, err
	}
	return cases, nil
}

func (r *GormRepository) UpdateCase(ctx context.Context, c *domain.Case) error {
	return r.db.WithContext(ctx).Save(c).Error
}

func (r *GormRepository) DeleteCase(ctx context.Context, id string) error {
	uid, err := uuid.Parse(id)
	if err != nil {
		return err
	}
	return r.db.WithContext(ctx).Model(&domain.Case{}).Where("id = ?", uid).Update("is_archived", true).Error
}

func (r *GormRepository) CreateMedia(ctx context.Context, media *domain.Media) error {
	return r.db.WithContext(ctx).Create(media).Error
}

func (r *GormRepository) GetMediaForCase(ctx context.Context, caseID string) ([]domain.Media, error) {
	var medias []domain.Media
	cid, err := uuid.Parse(caseID)
	if err != nil {
		return nil, err
	}
	if err := r.db.WithContext(ctx).Where("case_id = ?", cid).Find(&medias).Error; err != nil {
		return nil, err
	}
	return medias, nil
}

func (r *GormRepository) CreateVoiceNote(ctx context.Context, vn *domain.VoiceNote) error {
	return r.db.WithContext(ctx).Create(vn).Error
}

func (r *GormRepository) GetVoiceNotesForCase(ctx context.Context, caseID string) ([]domain.VoiceNote, error) {
	var vns []domain.VoiceNote
	cid, err := uuid.Parse(caseID)
	if err != nil {
		return nil, err
	}
	if err := r.db.WithContext(ctx).Where("case_id = ?", cid).Find(&vns).Error; err != nil {
		return nil, err
	}
	return vns, nil
}

func (r *GormRepository) CreateSyncDelta(ctx context.Context, delta *domain.SyncDelta) error {
	return r.db.WithContext(ctx).Create(delta).Error
}

func (r *GormRepository) ProcessBatchDeltas(ctx context.Context, orgID string, deltas []domain.SyncDelta) (int, error) {
	applied := 0
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for _, delta := range deltas {
			if err := tx.Create(&delta).Error; err != nil {
				return err
			}
			applied++
		}
		return nil
	})

	return applied, err
}
