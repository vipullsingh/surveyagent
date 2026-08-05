export type Role = 'SUPER_ADMIN' | 'FIRM_ADMIN' | 'SENIOR_SURVEYOR' | 'SURVEYOR';

export type ClaimType = 'MOTOR' | 'FIRE' | 'MARINE' | 'ENGINEERING' | 'PROPERTY' | 'OTHER';

export type CaseStatus = 'DRAFT' | 'IN_PROGRESS' | 'REVIEW_PENDING' | 'COMPLETED' | 'SUBMITTED' | 'CLOSED';

export type SyncStatus = 'SYNCED' | 'PENDING' | 'OFFLINE_ONLY' | 'ERROR';

export interface User {
  id: string;
  organizationId: string;
  email: string;
  fullName: string;
  phone: string;
  role: Role;
}

export interface Case {
  id: string;
  organizationId: string;
  caseNumber: string;
  claimType: ClaimType;
  policyNumber: string;
  insuredName: string;
  insuredContact?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  dateOfLoss: string;
  assignedDate: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: CaseStatus;
  syncStatus: SyncStatus;
  checklistData?: string;
  notes?: string;
  aiSummary?: string;
  createdAt: string;
  updatedAt: string;
}

/** Verdict produced by the on-device photo quality checker. */
export type PhotoQualityVerdict = 'GOOD' | 'WARN' | 'POOR';

export interface PhotoQualityReport {
  verdict: PhotoQualityVerdict;
  /** Aggregate 0-100 score derived from sharpness, exposure and contrast. */
  score: number;
  /** Variance of the Laplacian. Low values indicate a blurry frame. */
  sharpness: number;
  /** Mean luminance, 0-255. */
  brightness: number;
  /** Luminance standard deviation, 0-255. */
  contrast: number;
  /** Fraction of pixels crushed to black (0-1). */
  underexposedRatio: number;
  /** Fraction of pixels clipped to white (0-1). */
  overexposedRatio: number;
  issues: string[];
  analyzedAt: string;
}

/** A compulsory camera angle prompted by the guided photo wizard. */
export interface GuidedAngle {
  id: string;
  label: string;
  hint: string;
  required: boolean;
}

export interface AngleCoverage {
  angle: GuidedAngle;
  captured: number;
}

export interface WizardCompleteness {
  coverage: AngleCoverage[];
  missingRequired: GuidedAngle[];
  requiredTotal: number;
  requiredCaptured: number;
  percent: number;
  isComplete: boolean;
}

export type AnnotationTool = 'ARROW' | 'CIRCLE' | 'RECT' | 'MEASURE' | 'FREEHAND' | 'TEXT';

export interface AnnotationPoint {
  /** Normalised 0-1 coordinate so annotations survive any render size. */
  x: number;
  y: number;
}

export interface Annotation {
  id: string;
  tool: AnnotationTool;
  color: string;
  strokeWidth: number;
  points: AnnotationPoint[];
  /** Callout text, or the measurement value for MEASURE strokes. */
  label?: string;
  createdAt: string;
}

export interface Media {
  id: string;
  caseId: string;
  /** Current best rendition: geotag watermark and annotations already burnt in. */
  localPath: string;
  /** Untouched frame straight off the sensor, retained for evidence integrity. */
  originalPath?: string;
  thumbnailPath?: string;
  remoteUrl?: string;
  fileType: 'PHOTO' | 'VIDEO' | 'SKETCH' | 'DOCUMENT';
  latitude?: number;
  longitude?: number;
  altitude?: number;
  gpsAccuracy?: number;
  heading?: number;
  timestamp: string;
  width?: number;
  height?: number;
  fileSize?: number;
  /** Guided wizard slot this frame satisfies. */
  angleId?: string;
  angleLabel?: string;
  /** JSON-encoded Annotation[]. */
  annotations?: string;
  /** JSON-encoded PhotoQualityReport. */
  quality?: string;
  aiTags: string[];
  caption?: string;
  isSynced: boolean;
  isDeleted?: boolean;
  updatedAt?: string;
}

export interface VoiceNote {
  id: string;
  caseId: string;
  localAudioPath: string;
  durationSeconds: number;
  transcript?: string;
  isTranscribed: boolean;
  createdAt: string;
}

export interface SyncQueueItem {
  id: string;
  entityName: 'case' | 'media' | 'voice_note';
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payloadJson: string;
  createdAt: string;
  retryCount: number;
  lastError?: string;
}

export interface ChecklistQuestion {
  id: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'choice' | 'photo_required';
  options?: string[];
  required: boolean;
  value?: any;
}

export interface ChecklistTemplate {
  claimType: ClaimType;
  title: string;
  sections: {
    title: string;
    questions: ChecklistQuestion[];
  }[];
}
