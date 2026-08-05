import { Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/** Longest edge kept for the archived evidence frame. Balances detail against device storage. */
const FULL_SIZE_WIDTH = 1920;
/** Longest edge for the gallery thumbnail. */
const THUMBNAIL_WIDTH = 320;

const ROOT_FOLDER = 'SurveyAgent';
const EVIDENCE_FOLDER = 'evidence';

export interface StoredImage {
  uri: string;
  width: number;
  height: number;
  size?: number;
}

/**
 * The new `expo-file-system` API is native-only; on web there is no persistent
 * sandbox to copy into, so blob/data URIs are used as-is.
 */
const hasFileSystem = Platform.OS !== 'web';

const caseDirectory = (caseId: string): Directory => {
  const dir = new Directory(Paths.document, ROOT_FOLDER, EVIDENCE_FOLDER, caseId);
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
  return dir;
};

const uniqueName = (prefix: string, extension = 'jpg'): string =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;

/**
 * Loads an image and shrinks it only if it exceeds `maxWidth`. Resizing unconditionally
 * would upscale already-small renditions and inflate them with no gain in detail.
 */
const renderBounded = async (sourceUri: string, maxWidth: number) => {
  const source = await ImageManipulator.manipulate(sourceUri).renderAsync();
  if (source.width <= maxWidth) return source;
  return ImageManipulator.manipulate(source).resize({ width: maxWidth }).renderAsync();
};

/**
 * Re-encodes an image to a bounded size and moves it into the case's permanent
 * evidence folder. The camera's own temp file lives in the cache directory and can
 * be evicted by the OS, so nothing is considered captured until this resolves.
 */
export const persistImage = async (
  caseId: string,
  sourceUri: string,
  prefix: string,
  maxWidth: number = FULL_SIZE_WIDTH,
  compress = 0.85
): Promise<StoredImage> => {
  const rendered = await renderBounded(sourceUri, maxWidth);
  const encoded = await rendered.saveAsync({ compress, format: SaveFormat.JPEG });

  if (!hasFileSystem) {
    return { uri: encoded.uri, width: encoded.width, height: encoded.height };
  }

  const destination = new File(caseDirectory(caseId), uniqueName(prefix));
  new File(encoded.uri).copy(destination);

  return {
    uri: destination.uri,
    width: encoded.width,
    height: encoded.height,
    size: destination.size,
  };
};

export const persistThumbnail = (caseId: string, sourceUri: string): Promise<StoredImage> =>
  persistImage(caseId, sourceUri, 'thumb', THUMBNAIL_WIDTH, 0.7);

/**
 * Deletes a file previously written by {@link persistImage}. Missing files are ignored
 * so evidence removal stays idempotent across retries.
 */
export const deleteStoredFile = (uri?: string): void => {
  if (!uri || !hasFileSystem || !uri.startsWith('file://')) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // A file that cannot be removed must not block the case-level delete.
  }
};

/** Removes every stored rendition for a case. Used when a case is purged locally. */
export const deleteCaseEvidence = (caseId: string): void => {
  if (!hasFileSystem) return;
  try {
    const dir = new Directory(Paths.document, ROOT_FOLDER, EVIDENCE_FOLDER, caseId);
    if (dir.exists) dir.delete();
  } catch {
    // Best-effort cleanup.
  }
};

/**
 * Tamper-evidence hash of a stored frame, embedded in the exported report so a
 * recipient can confirm the image was not swapped after sign-off.
 */
export const fileChecksum = (uri?: string): string | undefined => {
  if (!uri || !hasFileSystem || !uri.startsWith('file://')) return undefined;
  try {
    const file = new File(uri);
    return file.exists ? file.md5 ?? undefined : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Reads an image back as a `data:` URI. The PDF report is a self-contained HTML
 * document, so photos have to be inlined rather than referenced by path.
 */
export const toDataUri = async (uri?: string, maxWidth = 900): Promise<string | undefined> => {
  if (!uri) return undefined;
  try {
    const rendered = await renderBounded(uri, maxWidth);
    const encoded = await rendered.saveAsync({ base64: true, compress: 0.7, format: SaveFormat.JPEG });
    return encoded.base64 ? `data:image/jpeg;base64,${encoded.base64}` : undefined;
  } catch {
    return undefined;
  }
};
