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

export interface Media {
  id: string;
  caseId: string;
  localPath: string;
  remoteUrl?: string;
  fileType: 'PHOTO' | 'VIDEO' | 'SKETCH' | 'DOCUMENT';
  latitude?: number;
  longitude?: number;
  timestamp: string;
  annotations?: string;
  aiTags: string[];
  caption?: string;
  isSynced: boolean;
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
