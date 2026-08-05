import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import decodeJpeg from 'jpeg-js/lib/decoder';
import { PhotoQualityReport, PhotoQualityVerdict } from '../types';

/** Width the frame is downsampled to before pixel analysis. Keeps a check under ~50ms. */
const ANALYSIS_WIDTH = 200;

/**
 * Laplacian-variance thresholds, calibrated for a {@link ANALYSIS_WIDTH}px-wide luma plane.
 * Values scale with resolution, so they are only meaningful at that fixed size.
 */
const BLUR_POOR = 45;
const BLUR_WARN = 110;

const DARK_MEAN = 55;
const BRIGHT_MEAN = 205;
const FLAT_CONTRAST = 26;
const CLIPPING_RATIO = 0.22;

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Standalone base64 decoder — `atob` is not guaranteed on every React Native runtime
 * and this must work fully offline on device, in Expo Go and on web alike.
 */
const base64ToBytes = (base64: string): Uint8Array => {
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const byteLength = Math.floor((clean.length * 3) / 4);
  const bytes = new Uint8Array(byteLength);

  let bufferBits = 0;
  let bitCount = 0;
  let outIndex = 0;

  for (let i = 0; i < clean.length; i++) {
    const value = BASE64_ALPHABET.indexOf(clean[i]);
    if (value < 0) continue;
    bufferBits = (bufferBits << 6) | value;
    bitCount += 6;
    if (bitCount >= 8) {
      bitCount -= 8;
      bytes[outIndex++] = (bufferBits >> bitCount) & 0xff;
    }
  }

  return outIndex === byteLength ? bytes : bytes.subarray(0, outIndex);
};

const toLumaPlane = (rgba: Uint8Array, width: number, height: number): Float32Array => {
  const luma = new Float32Array(width * height);
  for (let i = 0, p = 0; i < luma.length; i++, p += 4) {
    luma[i] = 0.299 * rgba[p] + 0.587 * rgba[p + 1] + 0.114 * rgba[p + 2];
  }
  return luma;
};

/**
 * Variance of the 3x3 Laplacian response — the standard focus measure. A frame that is
 * out of focus has little high-frequency energy, so the response collapses toward zero.
 */
const laplacianVariance = (luma: Float32Array, width: number, height: number): number => {
  if (width < 3 || height < 3) return 0;

  let sum = 0;
  let sumSquares = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const response =
        4 * luma[i] - luma[i - 1] - luma[i + 1] - luma[i - width] - luma[i + width];
      sum += response;
      sumSquares += response * response;
      count++;
    }
  }

  if (count === 0) return 0;
  const mean = sum / count;
  return sumSquares / count - mean * mean;
};

const buildReport = (luma: Float32Array, width: number, height: number): PhotoQualityReport => {
  let sum = 0;
  let sumSquares = 0;
  let dark = 0;
  let bright = 0;

  for (let i = 0; i < luma.length; i++) {
    const v = luma[i];
    sum += v;
    sumSquares += v * v;
    if (v < 24) dark++;
    if (v > 240) bright++;
  }

  const brightness = sum / luma.length;
  const contrast = Math.sqrt(Math.max(0, sumSquares / luma.length - brightness * brightness));
  const underexposedRatio = dark / luma.length;
  const overexposedRatio = bright / luma.length;
  const sharpness = laplacianVariance(luma, width, height);

  const issues: string[] = [];
  if (sharpness < BLUR_POOR) {
    issues.push('Frame is out of focus — hold steady and retake.');
  } else if (sharpness < BLUR_WARN) {
    issues.push('Frame looks soft. Consider a sharper retake before sign-off.');
  }
  if (brightness < DARK_MEAN) {
    issues.push('Scene is underexposed — enable the torch or add lighting.');
  } else if (brightness > BRIGHT_MEAN) {
    issues.push('Scene is overexposed — step out of direct sunlight.');
  }
  if (underexposedRatio > CLIPPING_RATIO) {
    issues.push('Large areas crushed to black; detail in shadow is unrecoverable.');
  }
  if (overexposedRatio > CLIPPING_RATIO) {
    issues.push('Large areas blown out to white; detail in highlights is lost.');
  }
  if (contrast < FLAT_CONTRAST) {
    issues.push('Very low contrast — check the lens is clean and the subject is framed.');
  }

  // Sharpness dominates: a blurry photo is worthless as evidence regardless of exposure.
  const sharpnessScore = Math.min(1, sharpness / (BLUR_WARN * 2));
  const exposureScore = 1 - Math.min(1, Math.abs(brightness - 128) / 128);
  const clippingScore = 1 - Math.min(1, (underexposedRatio + overexposedRatio) / 0.5);
  const contrastScore = Math.min(1, contrast / 60);
  const score = Math.round(
    100 * (0.5 * sharpnessScore + 0.2 * exposureScore + 0.15 * clippingScore + 0.15 * contrastScore)
  );

  let verdict: PhotoQualityVerdict = 'GOOD';
  if (sharpness < BLUR_POOR || brightness < DARK_MEAN || brightness > BRIGHT_MEAN || score < 45) {
    verdict = 'POOR';
  } else if (issues.length > 0 || score < 65) {
    verdict = 'WARN';
  }

  return {
    verdict,
    score,
    sharpness: Math.round(sharpness * 10) / 10,
    brightness: Math.round(brightness * 10) / 10,
    contrast: Math.round(contrast * 10) / 10,
    underexposedRatio: Math.round(underexposedRatio * 1000) / 1000,
    overexposedRatio: Math.round(overexposedRatio * 1000) / 1000,
    issues,
    analyzedAt: new Date().toISOString(),
  };
};

/**
 * Runs a fully offline blur/exposure check on a captured frame.
 * Returns `null` when the frame could not be decoded, so callers can distinguish
 * "not analysed" from "analysed and acceptable".
 */
export const analyzePhoto = async (uri: string): Promise<PhotoQualityReport | null> => {
  try {
    const rendered = await ImageManipulator.manipulate(uri)
      .resize({ width: ANALYSIS_WIDTH })
      .renderAsync();
    const downscaled = await rendered.saveAsync({
      base64: true,
      compress: 0.92,
      format: SaveFormat.JPEG,
    });

    if (!downscaled.base64) return null;

    const decoded = decodeJpeg(base64ToBytes(downscaled.base64), {
      useTArray: true,
      tolerantDecoding: true,
    });
    if (!decoded?.width || !decoded?.height) return null;

    const luma = toLumaPlane(decoded.data, decoded.width, decoded.height);
    return buildReport(luma, decoded.width, decoded.height);
  } catch {
    return null;
  }
};

export const parseQualityReport = (raw?: string): PhotoQualityReport | undefined => {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as PhotoQualityReport;
  } catch {
    return undefined;
  }
};

export const qualityColor = (verdict: PhotoQualityVerdict): string =>
  verdict === 'GOOD' ? '#22c55e' : verdict === 'WARN' ? '#f59e0b' : '#ef4444';
