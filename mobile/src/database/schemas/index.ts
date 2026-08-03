// Realm Object Schema Definitions for Offline-First Storage

export const CaseSchema = {
  name: 'Case',
  primaryKey: 'id',
  properties: {
    id: 'string',
    organizationId: 'string',
    caseNumber: 'string',
    claimType: 'string',
    policyNumber: 'string',
    insuredName: 'string',
    insuredContact: 'string?',
    location: 'string?',
    latitude: 'double?',
    longitude: 'double?',
    dateOfLoss: 'string',
    assignedDate: 'string',
    priority: 'string',
    status: 'string',
    syncStatus: 'string',
    checklistData: 'string?',
    notes: 'string?',
    aiSummary: 'string?',
    createdAt: 'string',
    updatedAt: 'string',
  },
};

export const MediaSchema = {
  name: 'Media',
  primaryKey: 'id',
  properties: {
    id: 'string',
    caseId: 'string',
    localPath: 'string',
    remoteUrl: 'string?',
    fileType: 'string',
    latitude: 'double?',
    longitude: 'double?',
    timestamp: 'string',
    annotations: 'string?',
    aiTags: 'string[]',
    caption: 'string?',
    isSynced: 'bool',
  },
};

export const VoiceNoteSchema = {
  name: 'VoiceNote',
  primaryKey: 'id',
  properties: {
    id: 'string',
    caseId: 'string',
    localAudioPath: 'string',
    durationSeconds: 'int',
    transcript: 'string?',
    isTranscribed: 'bool',
    createdAt: 'string',
  },
};

export const SyncQueueSchema = {
  name: 'SyncQueue',
  primaryKey: 'id',
  properties: {
    id: 'string',
    entityName: 'string',
    entityId: 'string',
    action: 'string',
    payloadJson: 'string',
    createdAt: 'string',
    retryCount: 'int',
    lastError: 'string?',
  },
};
