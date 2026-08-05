import React, { forwardRef } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { Annotation } from '../types';
import { AnnotationCanvas } from './AnnotationCanvas';

export interface EvidenceStamp {
  caseNumber: string;
  angleLabel?: string;
  caption?: string;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  gpsAccuracy?: number;
  timestamp: string;
  surveyor?: string;
}

interface Props {
  uri: string;
  width: number;
  height: number;
  annotations: Annotation[];
  stamp: EvidenceStamp;
  onImageLoad?: () => void;
}

const formatCoordinate = (value: number | undefined, positive: string, negative: string): string => {
  if (value === undefined || Number.isNaN(value)) return '—';
  return `${Math.abs(value).toFixed(6)}° ${value >= 0 ? positive : negative}`;
};

/**
 * Immutable evidence watermark: GPS fix, altitude, accuracy and capture time.
 * Rendered as part of the composed view so {@link flattenEvidence} bakes it into
 * the exported JPEG rather than leaving it as removable overlay metadata.
 */
const GeoWatermark: React.FC<{ stamp: EvidenceStamp }> = ({ stamp }) => {
  const captured = new Date(stamp.timestamp);
  const hasFix = stamp.latitude !== undefined && stamp.longitude !== undefined;

  return (
    <View style={styles.watermark}>
      <View style={styles.watermarkRow}>
        <Text style={styles.watermarkPrimary} numberOfLines={1}>
          {hasFix
            ? `${formatCoordinate(stamp.latitude, 'N', 'S')}  ${formatCoordinate(stamp.longitude, 'E', 'W')}`
            : 'GPS FIX UNAVAILABLE'}
        </Text>
        <Text style={styles.watermarkSecondary}>
          {stamp.altitude !== undefined ? `ALT ${Math.round(stamp.altitude)}m` : ''}
          {stamp.gpsAccuracy !== undefined ? `  ±${Math.round(stamp.gpsAccuracy)}m` : ''}
        </Text>
      </View>
      <View style={styles.watermarkRow}>
        <Text style={styles.watermarkSecondary} numberOfLines={1}>
          {captured.toISOString().replace('T', ' ').substring(0, 19)} UTC
        </Text>
        <Text style={styles.watermarkSecondary} numberOfLines={1}>
          {stamp.caseNumber}
        </Text>
      </View>
      {(stamp.angleLabel || stamp.caption) && (
        <Text style={styles.watermarkCaption} numberOfLines={2}>
          {[stamp.angleLabel, stamp.caption].filter(Boolean).join(' — ')}
        </Text>
      )}
    </View>
  );
};

/**
 * The exact pixel arrangement that gets written to disk: photograph, vector
 * annotations, then the geotag watermark on top.
 */
export const EvidenceComposer = forwardRef<View, Props>(
  ({ uri, width, height, annotations, stamp, onImageLoad }, ref) => (
    <View ref={ref} collapsable={false} style={[styles.frame, { width, height }]}>
      <Image source={{ uri }} style={{ width, height }} resizeMode="cover" onLoadEnd={onImageLoad} />
      <AnnotationCanvas width={width} height={height} annotations={annotations} readOnly />
      <GeoWatermark stamp={stamp} />
    </View>
  )
);

EvidenceComposer.displayName = 'EvidenceComposer';

/**
 * Rasterises a composed evidence view to a JPEG on disk.
 * Only call this once the underlying `Image` has reported `onLoadEnd`, otherwise the
 * snapshot can catch an empty frame.
 */
export const flattenEvidence = async (
  ref: React.RefObject<View | null>,
  outputWidth = 1440,
  aspectRatio = 4 / 3
): Promise<string> =>
  captureRef(ref, {
    format: 'jpg',
    quality: 0.9,
    result: 'tmpfile',
    width: outputWidth,
    height: Math.round(outputWidth / aspectRatio),
  });

const styles = StyleSheet.create({
  frame: {
    backgroundColor: '#000000',
    overflow: 'hidden',
    position: 'relative',
  },
  watermark: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(2,6,23,0.72)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  watermarkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  watermarkPrimary: {
    color: '#7dd3fc',
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    flexShrink: 1,
  },
  watermarkSecondary: {
    color: '#e2e8f0',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  watermarkCaption: {
    color: '#fde68a',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});
