package domain

import (
	"time"

	"github.com/google/uuid"
)

// Role types for Organizational RBAC
type Role string

const (
	RoleSuperAdmin     Role = "SUPER_ADMIN"
	RoleFirmAdmin      Role = "FIRM_ADMIN"
	RoleSeniorSurveyor Role = "SENIOR_SURVEYOR"
	RoleSurveyor       Role = "SURVEYOR"
)

// ClaimType types
type ClaimType string

const (
	ClaimTypeMotor       ClaimType = "MOTOR"
	ClaimTypeFire        ClaimType = "FIRE"
	ClaimTypeMarine      ClaimType = "MARINE"
	ClaimTypeEngineering ClaimType = "ENGINEERING"
	ClaimTypeProperty    ClaimType = "PROPERTY"
	ClaimTypeOther       ClaimType = "OTHER"
)

// CaseStatus types
type CaseStatus string

const (
	StatusDraft          CaseStatus = "DRAFT"
	StatusInProgress     CaseStatus = "IN_PROGRESS"
	StatusReviewPending  CaseStatus = "REVIEW_PENDING"
	StatusCompleted      CaseStatus = "COMPLETED"
	StatusSubmitted      CaseStatus = "SUBMITTED"
	StatusClosed         CaseStatus = "CLOSED"
)

// Organization (Firm)
type Organization struct {
	ID        uuid.UUID `json:"id" db:"id"`
	Name      string    `json:"name" db:"name"`
	Code      string    `json:"code" db:"code"`
	LogoURL   string    `json:"logo_url" db:"logo_url"`
	IsActive  bool      `json:"is_active" db:"is_active"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// User
type User struct {
	ID             uuid.UUID `json:"id" db:"id"`
	OrganizationID uuid.UUID `json:"organization_id" db:"organization_id"`
	Email          string    `json:"email" db:"email"`
	PasswordHash   string    `json:"-" db:"password_hash"`
	FullName       string    `json:"full_name" db:"full_name"`
	Phone          string    `json:"phone" db:"phone"`
	Role           Role      `json:"role" db:"role"`
	IsActive       bool      `json:"is_active" db:"is_active"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time `json:"updated_at" db:"updated_at"`
}

// Case (Claim)
type Case struct {
	ID             uuid.UUID  `json:"id" db:"id"`
	OrganizationID uuid.UUID  `json:"organization_id" db:"organization_id"`
	CaseNumber     string     `json:"case_number" db:"case_number"`
	ClaimType      ClaimType  `json:"claim_type" db:"claim_type"`
	PolicyNumber   string     `json:"policy_number" db:"policy_number"`
	InsuredName    string     `json:"insured_name" db:"insured_name"`
	InsuredContact string     `json:"insured_contact" db:"insured_contact"`
	Location       string     `json:"location" db:"location"`
	Latitude       *float64   `json:"latitude,omitempty" db:"latitude"`
	Longitude      *float64   `json:"longitude,omitempty" db:"longitude"`
	DateOfLoss     time.Time  `json:"date_of_loss" db:"date_of_loss"`
	AssignedDate   time.Time  `json:"assigned_date" db:"assigned_date"`
	AssignedTo     *uuid.UUID `json:"assigned_to,omitempty" db:"assigned_to"`
	Priority       string     `json:"priority" db:"priority"` // LOW, MEDIUM, HIGH, URGENT
	Status         CaseStatus `json:"status" db:"status"`
	ChecklistData  string     `json:"checklist_data" db:"checklist_data"` // JSON Payload
	Notes          string     `json:"notes" db:"notes"`
	AISummary      string     `json:"ai_summary" db:"ai_summary"`
	IsArchived     bool       `json:"is_archived" db:"is_archived"`
	CreatedAt      time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at" db:"updated_at"`

	Medias     []Media     `json:"medias,omitempty"`
	VoiceNotes []VoiceNote `json:"voice_notes,omitempty"`
}

// Media evidence
type Media struct {
	ID          uuid.UUID `json:"id" db:"id"`
	CaseID      uuid.UUID `json:"case_id" db:"case_id"`
	FileType    string    `json:"file_type" db:"file_type"` // PHOTO, VIDEO, SKETCH, DOCUMENT
	StorageURL  string    `json:"storage_url" db:"storage_url"`
	FileName    string    `json:"file_name" db:"file_name"`
	FileSize    int64     `json:"file_size" db:"file_size"`
	Latitude    *float64  `json:"latitude,omitempty" db:"latitude"`
	Longitude   *float64  `json:"longitude,omitempty" db:"longitude"`
	Timestamp   time.Time `json:"timestamp" db:"timestamp"`
	Annotations string    `json:"annotations" db:"annotations"` // JSON vector drawing path
	AITags      []string  `json:"ai_tags" db:"ai_tags"`
	Caption     string    `json:"caption" db:"caption"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

// VoiceNote evidence
type VoiceNote struct {
	ID              uuid.UUID `json:"id" db:"id"`
	CaseID          uuid.UUID `json:"case_id" db:"case_id"`
	AudioURL        string    `json:"audio_url" db:"audio_url"`
	DurationSeconds int       `json:"duration_seconds" db:"duration_seconds"`
	Transcript      string    `json:"transcript" db:"transcript"`
	IsTranscribed   bool      `json:"is_transcribed" db:"is_transcribed"`
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
}

// AuditLog
type AuditLog struct {
	ID             uuid.UUID `json:"id" db:"id"`
	OrganizationID uuid.UUID `json:"organization_id" db:"organization_id"`
	UserID         uuid.UUID `json:"user_id" db:"user_id"`
	Action         string    `json:"action" db:"action"`
	Entity         string    `json:"entity" db:"entity"`
	EntityID       uuid.UUID `json:"entity_id" db:"entity_id"`
	Details        string    `json:"details" db:"details"`
	IPAddress      string    `json:"ip_address" db:"ip_address"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
}

// SyncDelta payload for offline engine
type SyncDelta struct {
	EntityName string    `json:"entity_name"` // "case", "media", "voice_note"
	EntityID   uuid.UUID `json:"entity_id"`
	Action     string    `json:"action"` // "CREATE", "UPDATE", "DELETE"
	Data       string    `json:"data"`   // JSON serialized payload
	ClientTime time.Time `json:"client_time"`
}

type SyncRequest struct {
	LastSyncedAt time.Time   `json:"last_synced_at"`
	Deltas       []SyncDelta `json:"deltas"`
}

type SyncResponse struct {
	SyncedAt         time.Time   `json:"synced_at"`
	ProcessedDeltas  int         `json:"processed_deltas"`
	FailedDeltas     []SyncError `json:"failed_deltas,omitempty"`
	ServerUpdates    []SyncDelta `json:"server_updates,omitempty"`
}

type SyncError struct {
	EntityID uuid.UUID `json:"entity_id"`
	Reason   string    `json:"reason"`
}
