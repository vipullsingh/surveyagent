package db

import (
	"sync"
	"time"

	"surveyagent-backend/internal/domain"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// Store provides persistence interface for SurveyAgent
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

	// Password: "Password123!"
	hashedPw, _ := bcrypt.GenerateFromPassword([]byte("Password123!"), bcrypt.DefaultCost)

	// Admin User
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

	// Field Surveyor User
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

	// Seed a sample Motor Claim Case
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
	return store
}

// Thread-safe helpers
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
