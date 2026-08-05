import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Case, GuidedAngle, Media, PhotoQualityReport } from '../types';
import { realmManager } from '../database/RealmManager';
import { AD_HOC_ANGLE, computeCompleteness, getGuidedAngles, nextPendingAngle } from '../evidence/guidedAngles';
import { analyzePhoto, parseQualityReport, qualityColor } from '../evidence/PhotoQualityAnalyzer';
import { deleteStoredFile, persistImage, persistThumbnail } from '../evidence/EvidenceStore';
import { describeGeoStatus, useGeoFix } from '../evidence/useGeoFix';
import { EvidenceComposer, flattenEvidence } from '../components/EvidenceComposer';
import { createUuid } from '../services/SyncPayloads';

interface Props {
  route: any;
  navigation: any;
}

interface PendingShot {
  uri: string;
  width: number;
  height: number;
  angle: GuidedAngle;
  capturedAt: string;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  gpsAccuracy?: number;
  heading?: number;
}

/** Longest edge of the flattened evidence JPEG written to disk. */
const EXPORT_WIDTH = 1440;

export const CameraEvidenceScreen: React.FC<Props> = ({ route, navigation }) => {
  const { caseId } = route.params;
  const { width: screenWidth } = useWindowDimensions();

  const [caseItem, setCaseItem] = useState<Case | undefined>();
  const [medias, setMedias] = useState<Media[]>([]);
  const [permission, requestPermission] = useCameraPermissions();
  const { fix, status: geoStatus, error: geoError, retry: retryGeo } = useGeoFix();

  const [activeAngle, setActiveAngle] = useState<GuidedAngle>(AD_HOC_ANGLE);
  const [angleTouched, setAngleTouched] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [torch, setTorch] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const [pendingShot, setPendingShot] = useState<PendingShot | null>(null);
  const [quality, setQuality] = useState<PhotoQualityReport | null | undefined>(undefined);
  const [caption, setCaption] = useState('');
  const [saving, setSaving] = useState(false);
  const [composerLoaded, setComposerLoaded] = useState(false);

  const cameraRef = useRef<CameraView | null>(null);
  const composerRef = useRef<View | null>(null);

  const angles = useMemo(
    () => (caseItem ? getGuidedAngles(caseItem.claimType) : []),
    [caseItem]
  );
  const completeness = useMemo(
    () => (caseItem ? computeCompleteness(caseItem.claimType, medias) : undefined),
    [caseItem, medias]
  );

  const loadData = useCallback(async () => {
    const item = await realmManager.getCaseById(caseId);
    setCaseItem(item);
    setMedias(await realmManager.getMediaForCase(caseId));
  }, [caseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Advance the wizard automatically until the surveyor overrides the slot by hand.
  useEffect(() => {
    if (!caseItem || angleTouched) return;
    setActiveAngle(nextPendingAngle(caseItem.claimType, medias) ?? AD_HOC_ANGLE);
  }, [caseItem, medias, angleTouched]);

  const previewSize = useMemo(() => {
    if (!pendingShot) return { width: screenWidth - 32, height: (screenWidth - 32) * (4 / 3) };
    const width = screenWidth - 32;
    const aspect = pendingShot.width / pendingShot.height;
    return { width, height: Math.round(width / aspect) };
  }, [pendingShot, screenWidth]);

  const handleCapture = async () => {
    if (!cameraRef.current || !cameraReady || pendingShot) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9, skipProcessing: false });
      if (!photo?.uri) return;

      const shot: PendingShot = {
        uri: photo.uri,
        width: photo.width,
        height: photo.height,
        angle: activeAngle,
        capturedAt: new Date().toISOString(),
        latitude: fix?.latitude,
        longitude: fix?.longitude,
        altitude: fix?.altitude,
        gpsAccuracy: fix?.accuracy,
        heading: fix?.heading,
      };

      setComposerLoaded(false);
      setCaption('');
      setQuality(undefined);
      setPendingShot(shot);

      // Blur/exposure verification runs off the untouched frame, before any re-encode.
      setQuality(await analyzePhoto(photo.uri));
    } catch (err: any) {
      Alert.alert('Capture Failed', err?.message ?? 'The camera could not take a picture.');
    }
  };

  const discardShot = () => {
    setPendingShot(null);
    setQuality(undefined);
    setCaption('');
    setComposerLoaded(false);
  };

  const handleSaveEvidence = async () => {
    if (!pendingShot || !caseItem || saving) return;
    setSaving(true);

    try {
      const aspect = pendingShot.width / pendingShot.height;

      // Bake the geotag watermark into the pixels so the stamp cannot be stripped later.
      let flattenedUri = pendingShot.uri;
      if (composerLoaded) {
        try {
          flattenedUri = await flattenEvidence(composerRef, EXPORT_WIDTH, aspect);
        } catch {
          // Fall back to the raw frame rather than losing the capture entirely.
          flattenedUri = pendingShot.uri;
        }
      }

      const [stamped, original, thumbnail] = await Promise.all([
        persistImage(caseId, flattenedUri, 'evidence'),
        persistImage(caseId, pendingShot.uri, 'original'),
        persistThumbnail(caseId, flattenedUri),
      ]);

      const media: Media = {
        id: createUuid(),
        caseId,
        localPath: stamped.uri,
        originalPath: original.uri,
        thumbnailPath: thumbnail.uri,
        fileType: 'PHOTO',
        latitude: pendingShot.latitude,
        longitude: pendingShot.longitude,
        altitude: pendingShot.altitude,
        gpsAccuracy: pendingShot.gpsAccuracy,
        heading: pendingShot.heading,
        timestamp: pendingShot.capturedAt,
        width: stamped.width,
        height: stamped.height,
        fileSize: stamped.size,
        angleId: pendingShot.angle.id,
        angleLabel: pendingShot.angle.label,
        quality: quality ? JSON.stringify(quality) : undefined,
        aiTags: [pendingShot.angle.id, pendingShot.latitude !== undefined ? 'geotagged' : 'no_gps'],
        caption: caption.trim() || undefined,
        isSynced: false,
      };

      await realmManager.saveMedia(media);
      discardShot();
      setAngleTouched(false);
      await loadData();
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message ?? 'Evidence could not be written to device storage.');
    } finally {
      setSaving(false);
    }
  };

  const confirmSave = () => {
    if (quality && quality.verdict === 'POOR') {
      Alert.alert(
        'Photo Quality Warning',
        `${quality.issues.join('\n\n')}\n\nSave this frame anyway?`,
        [
          { text: 'Retake', style: 'cancel', onPress: discardShot },
          { text: 'Save Anyway', style: 'destructive', onPress: handleSaveEvidence },
        ]
      );
      return;
    }
    handleSaveEvidence();
  };

  const handleDelete = (media: Media) => {
    Alert.alert('Remove Evidence', `Delete "${media.angleLabel ?? 'this photo'}" from the case file?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await realmManager.deleteMedia(caseId, media.id);
          deleteStoredFile(media.localPath);
          deleteStoredFile(media.originalPath);
          deleteStoredFile(media.thumbnailPath);
          await loadData();
        },
      },
    ]);
  };

  const selectAngle = (angle: GuidedAngle) => {
    setAngleTouched(true);
    setActiveAngle(angle);
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionBody}>
          SurveyAgent needs the camera to capture geotagged loss evidence. Nothing leaves the device
          until you sync.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.linkText}>Back to case</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Evidence Capture</Text>
        <TouchableOpacity onPress={() => setFacing(f => (f === 'back' ? 'front' : 'back'))}>
          <Text style={styles.headerAction}>⟳ Flip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Live viewfinder with the GPS/timestamp overlay the capture will inherit */}
        <View style={styles.viewfinder}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing={facing}
            enableTorch={torch}
            onCameraReady={() => setCameraReady(true)}
          />

          <View style={styles.viewfinderOverlay} pointerEvents="box-none">
            <View style={styles.overlayTop}>
              <View style={[styles.gpsPill, geoStatus !== 'READY' && styles.gpsPillWarning]}>
                <Text style={styles.gpsPillText}>{describeGeoStatus(geoStatus, fix)}</Text>
              </View>
              <TouchableOpacity style={styles.torchButton} onPress={() => setTorch(t => !t)}>
                <Text style={styles.torchButtonText}>{torch ? '🔦 On' : '🔦 Off'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.reticle} pointerEvents="none" />

            <View style={styles.overlayBottom} pointerEvents="none">
              <Text style={styles.stampText}>
                {fix
                  ? `${fix.latitude.toFixed(6)}°, ${fix.longitude.toFixed(6)}°${
                      fix.altitude !== undefined ? `  ALT ${Math.round(fix.altitude)}m` : ''
                    }`
                  : 'Awaiting GPS fix — photo will be flagged as ungeotagged'}
              </Text>
              <Text style={styles.stampText}>{new Date().toISOString().substring(0, 10)} • {caseItem?.caseNumber ?? ''}</Text>
              <Text style={styles.wizardPrompt}>{activeAngle.label.toUpperCase()}</Text>
              <Text style={styles.wizardHint}>{activeAngle.hint}</Text>
            </View>
          </View>
        </View>

        {(geoStatus === 'DENIED' || geoStatus === 'DISABLED' || geoStatus === 'ERROR') && (
          <TouchableOpacity style={styles.geoBanner} onPress={retryGeo}>
            <Text style={styles.geoBannerText}>⚠️ {geoError} Tap to retry.</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.shutter, (!cameraReady || !!pendingShot) && styles.shutterDisabled]}
          onPress={handleCapture}
          disabled={!cameraReady || !!pendingShot}
        >
          <Text style={styles.shutterText}>{cameraReady ? '📸  Capture Evidence' : 'Starting camera…'}</Text>
        </TouchableOpacity>

        {/* Guided photo wizard */}
        {completeness && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Guided Photo Wizard</Text>
              <Text style={[styles.progressText, completeness.isComplete && styles.progressComplete]}>
                {completeness.requiredCaptured}/{completeness.requiredTotal} required
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${completeness.percent}%` }]} />
            </View>

            <View style={styles.angleGrid}>
              {angles.map(angle => {
                const captured = completeness.coverage.find(c => c.angle.id === angle.id)?.captured ?? 0;
                const isActive = activeAngle.id === angle.id;
                return (
                  <TouchableOpacity
                    key={angle.id}
                    style={[
                      styles.angleChip,
                      captured > 0 && styles.angleChipDone,
                      isActive && styles.angleChipActive,
                    ]}
                    onPress={() => selectAngle(angle)}
                  >
                    <Text style={styles.angleChipText}>
                      {captured > 0 ? '✓ ' : angle.required ? '• ' : '○ '}
                      {angle.label}
                      {captured > 1 ? ` ×${captured}` : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                style={[styles.angleChip, activeAngle.id === AD_HOC_ANGLE.id && styles.angleChipActive]}
                onPress={() => selectAngle(AD_HOC_ANGLE)}
              >
                <Text style={styles.angleChipText}>+ {AD_HOC_ANGLE.label}</Text>
              </TouchableOpacity>
            </View>

            {completeness.missingRequired.length > 0 && (
              <Text style={styles.missingText}>
                Outstanding: {completeness.missingRequired.map(a => a.label).join(', ')}
              </Text>
            )}
          </View>
        )}

        {/* Media manager */}
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Case Evidence ({medias.length})</Text>
        </View>

        {medias.length === 0 ? (
          <Text style={styles.emptyText}>
            No evidence captured yet. Follow the wizard prompts above to build a complete photo set.
          </Text>
        ) : (
          <FlatList
            data={medias}
            keyExtractor={item => item.id}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={styles.galleryRow}
            renderItem={({ item }) => {
              const report = parseQualityReport(item.quality);
              return (
                <TouchableOpacity
                  style={styles.galleryTile}
                  onPress={() =>
                    navigation.navigate('PhotoAnnotation', { caseId, mediaId: item.id })
                  }
                  onLongPress={() => handleDelete(item)}
                >
                  <Image
                    source={{ uri: item.thumbnailPath ?? item.localPath }}
                    style={styles.galleryImage}
                    resizeMode="cover"
                  />
                  {report && (
                    <View style={[styles.qualityBadge, { backgroundColor: qualityColor(report.verdict) }]}>
                      <Text style={styles.qualityBadgeText}>{report.score}</Text>
                    </View>
                  )}
                  <View style={styles.galleryMeta}>
                    <Text style={styles.galleryLabel} numberOfLines={1}>
                      {item.angleLabel ?? 'Evidence'}
                    </Text>
                    <Text style={styles.galleryGeo} numberOfLines={1}>
                      {item.latitude !== undefined
                        ? `📍 ${item.latitude.toFixed(4)}, ${item.longitude?.toFixed(4)}`
                        : '📍 No GPS fix'}
                    </Text>
                    <Text style={styles.galleryTime}>
                      {new Date(item.timestamp).toLocaleTimeString()}
                      {item.annotations ? '  ✏️' : ''}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </ScrollView>

      {/* Review sheet: quality verdict, slot assignment and caption before commit */}
      <Modal visible={!!pendingShot} animationType="slide" transparent={false} onRequestClose={discardShot}>
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.reviewTitle}>Review Capture</Text>

            {pendingShot && caseItem && (
              <EvidenceComposer
                ref={composerRef}
                uri={pendingShot.uri}
                width={previewSize.width}
                height={previewSize.height}
                annotations={[]}
                onImageLoad={() => setComposerLoaded(true)}
                stamp={{
                  caseNumber: caseItem.caseNumber,
                  angleLabel: pendingShot.angle.label,
                  caption: caption.trim() || undefined,
                  latitude: pendingShot.latitude,
                  longitude: pendingShot.longitude,
                  altitude: pendingShot.altitude,
                  gpsAccuracy: pendingShot.gpsAccuracy,
                  timestamp: pendingShot.capturedAt,
                }}
              />
            )}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Quality Check</Text>
              {quality === undefined ? (
                <View style={styles.inlineRow}>
                  <ActivityIndicator size="small" color="#38bdf8" />
                  <Text style={styles.qualityPending}>Analysing sharpness and exposure on-device…</Text>
                </View>
              ) : quality === null ? (
                <Text style={styles.qualityPending}>
                  Quality analysis unavailable for this frame — review the preview manually.
                </Text>
              ) : (
                <>
                  <View style={styles.inlineRow}>
                    <View style={[styles.verdictPill, { backgroundColor: qualityColor(quality.verdict) }]}>
                      <Text style={styles.verdictPillText}>{quality.verdict}</Text>
                    </View>
                    <Text style={styles.qualityScore}>Score {quality.score}/100</Text>
                  </View>
                  <Text style={styles.qualityMetrics}>
                    Sharpness {quality.sharpness} • Brightness {quality.brightness} • Contrast {quality.contrast}
                  </Text>
                  {quality.issues.map((issue, idx) => (
                    <Text key={idx} style={styles.qualityIssue}>
                      ⚠️ {issue}
                    </Text>
                  ))}
                  {quality.issues.length === 0 && (
                    <Text style={styles.qualityOk}>✓ Sharp, well exposed and usable as evidence.</Text>
                  )}
                </>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Evidence Slot</Text>
              <View style={styles.angleGrid}>
                {[...angles, AD_HOC_ANGLE].map(angle => (
                  <TouchableOpacity
                    key={angle.id}
                    style={[
                      styles.angleChip,
                      pendingShot?.angle.id === angle.id && styles.angleChipActive,
                    ]}
                    onPress={() =>
                      setPendingShot(shot => (shot ? { ...shot, angle } : shot))
                    }
                  >
                    <Text style={styles.angleChipText}>{angle.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Caption / damage tag</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Radiator support crushed, coolant on ground"
                placeholderTextColor="#64748b"
                value={caption}
                onChangeText={setCaption}
                multiline
              />
            </View>

            <View style={styles.reviewActions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={discardShot} disabled={saving}>
                <Text style={styles.secondaryButtonText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButtonWide} onPress={confirmSave} disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Save Evidence Offline</Text>
                )}
              </TouchableOpacity>
            </View>

            {Platform.OS === 'web' && (
              <Text style={styles.webNote}>
                Running in a browser: frames are held in memory rather than the device evidence folder.
              </Text>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  centered: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  headerAction: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '600',
  },
  viewfinder: {
    height: 380,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#1e293b',
    marginBottom: 12,
  },
  viewfinderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 10,
  },
  overlayTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  gpsPill: {
    backgroundColor: 'rgba(22,101,52,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gpsPillWarning: {
    backgroundColor: 'rgba(146,64,14,0.85)',
  },
  gpsPillText: {
    color: '#f0fdf4',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  torchButton: {
    backgroundColor: 'rgba(15,23,42,0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  torchButtonText: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '600',
  },
  reticle: {
    alignSelf: 'center',
    width: 90,
    height: 90,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.8)',
    borderRadius: 45,
    borderStyle: 'dashed',
  },
  overlayBottom: {
    backgroundColor: 'rgba(2,6,23,0.7)',
    borderRadius: 8,
    padding: 8,
  },
  stampText: {
    color: '#7dd3fc',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  wizardPrompt: {
    color: '#fef08a',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 4,
  },
  wizardHint: {
    color: '#cbd5e1',
    fontSize: 11,
  },
  geoBanner: {
    backgroundColor: '#7f1d1d',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  geoBannerText: {
    color: '#fecaca',
    fontSize: 12,
  },
  shutter: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  shutterDisabled: {
    backgroundColor: '#1e3a8a',
    opacity: 0.6,
  },
  shutterText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: 'bold',
  },
  progressText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressComplete: {
    color: '#22c55e',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#0f172a',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: 6,
    backgroundColor: '#22c55e',
  },
  angleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  angleChip: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  angleChipDone: {
    borderColor: '#22c55e',
  },
  angleChipActive: {
    backgroundColor: '#1d4ed8',
    borderColor: '#60a5fa',
  },
  angleChipText: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '600',
  },
  missingText: {
    color: '#fca5a5',
    fontSize: 11,
    marginTop: 2,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 20,
  },
  galleryRow: {
    justifyContent: 'space-between',
  },
  galleryTile: {
    width: '48.5%',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  galleryImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#020617',
  },
  qualityBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 26,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    alignItems: 'center',
  },
  qualityBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  galleryMeta: {
    padding: 8,
  },
  galleryLabel: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: 'bold',
  },
  galleryGeo: {
    color: '#38bdf8',
    fontSize: 10,
    marginTop: 2,
  },
  galleryTime: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 1,
  },
  reviewTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verdictPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 5,
    marginRight: 10,
  },
  verdictPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  qualityScore: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '600',
  },
  qualityMetrics: {
    color: '#94a3b8',
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 8,
  },
  qualityIssue: {
    color: '#fca5a5',
    fontSize: 12,
    marginTop: 6,
    lineHeight: 16,
  },
  qualityOk: {
    color: '#86efac',
    fontSize: 12,
    marginTop: 6,
  },
  qualityPending: {
    color: '#94a3b8',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  inputLabel: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    minHeight: 60,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#334155',
  },
  reviewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 10,
  },
  secondaryButtonText: {
    color: '#e2e8f0',
    fontWeight: 'bold',
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonWide: {
    flex: 2,
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  permissionTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionBody: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 22,
  },
  linkText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '600',
  },
  webNote: {
    color: '#64748b',
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 14,
    textAlign: 'center',
  },
});
