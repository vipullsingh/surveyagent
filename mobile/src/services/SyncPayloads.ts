import { Media } from '../types';

/**
 * RFC 4122 v4 identifier. Entity ids must be UUIDs because the Golang domain models
 * parse them as `uuid.UUID`; anything else is rejected by the sync handler.
 */
export const createUuid = (): string =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });

const fileNameFromPath = (path?: string): string => {
  if (!path) return '';
  const segments = path.split('/');
  return segments[segments.length - 1] || '';
};

/**
 * Translates a local {@link Media} record into the snake_case shape the Golang
 * `domain.Media` model unmarshals. The mobile app is camelCase throughout, so the
 * conversion happens once, here, at the wire boundary.
 *
 * `storage_url` is intentionally left empty: the binary itself is still only on the
 * device. It is populated by the backend once object-storage upload lands.
 */
export const toMediaDeltaPayload = (media: Media): Record<string, unknown> => ({
  id: media.id,
  case_id: media.caseId,
  file_type: media.fileType,
  storage_url: media.remoteUrl ?? '',
  file_name: fileNameFromPath(media.localPath),
  file_size: media.fileSize ?? 0,
  local_path: media.localPath,
  latitude: media.latitude ?? null,
  longitude: media.longitude ?? null,
  altitude: media.altitude ?? null,
  gps_accuracy: media.gpsAccuracy ?? null,
  heading: media.heading ?? null,
  timestamp: media.timestamp,
  angle_id: media.angleId ?? '',
  angle_label: media.angleLabel ?? '',
  annotations: media.annotations ?? '',
  quality: media.quality ?? '',
  ai_tags: media.aiTags ?? [],
  caption: media.caption ?? '',
  is_deleted: media.isDeleted ?? false,
  created_at: media.timestamp,
});

export const toMediaDeletePayload = (mediaId: string, caseId: string): Record<string, unknown> => ({
  id: mediaId,
  case_id: caseId,
  is_deleted: true,
});
