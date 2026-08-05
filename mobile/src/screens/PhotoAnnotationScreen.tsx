import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Annotation, AnnotationTool, Case, Media } from '../types';
import { realmManager } from '../database/RealmManager';
import { AnnotationCanvas } from '../components/AnnotationCanvas';
import { EvidenceComposer, flattenEvidence } from '../components/EvidenceComposer';
import {
  ANNOTATION_COLORS,
  ANNOTATION_TOOLS,
  normalizedLength,
  parseAnnotations,
  serializeAnnotations,
} from '../evidence/annotations';
import { parseQualityReport, qualityColor } from '../evidence/PhotoQualityAnalyzer';
import { deleteStoredFile, persistImage, persistThumbnail } from '../evidence/EvidenceStore';

interface Props {
  route: any;
  navigation: any;
}

const STROKE_WIDTHS = [2, 4, 7];
const EXPORT_WIDTH = 1440;

/** Tools that carry a text value the surveyor has to supply before the shape is committed. */
const LABELLED_TOOLS: AnnotationTool[] = ['TEXT', 'MEASURE'];

export const PhotoAnnotationScreen: React.FC<Props> = ({ route, navigation }) => {
  const { caseId, mediaId } = route.params;
  const { width: screenWidth } = useWindowDimensions();

  const [caseItem, setCaseItem] = useState<Case | undefined>();
  const [media, setMedia] = useState<Media | undefined>();
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [tool, setTool] = useState<AnnotationTool>('ARROW');
  const [color, setColor] = useState(ANNOTATION_COLORS[0]);
  const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTHS[1]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [composerLoaded, setComposerLoaded] = useState(false);

  /** Shape waiting on its label; committed once the surveyor confirms the prompt. */
  const [labelDraft, setLabelDraft] = useState<Annotation | null>(null);
  const [labelValue, setLabelValue] = useState('');

  const composerRef = useRef<View | null>(null);

  useEffect(() => {
    (async () => {
      setCaseItem(await realmManager.getCaseById(caseId));
      const found = await realmManager.getMediaById(caseId, mediaId);
      setMedia(found);
      setAnnotations(parseAnnotations(found?.annotations));
    })();
  }, [caseId, mediaId]);

  const canvasSize = useMemo(() => {
    const width = screenWidth - 24;
    const aspect = media?.width && media?.height ? media.width / media.height : 4 / 3;
    return { width, height: Math.round(width / aspect), aspect };
  }, [media, screenWidth]);

  const handleDraft = useCallback((annotation: Annotation) => {
    if (LABELLED_TOOLS.includes(annotation.tool)) {
      setLabelDraft(annotation);
      setLabelValue('');
      return;
    }
    setAnnotations(current => [...current, annotation]);
    setDirty(true);
  }, []);

  const commitLabel = () => {
    if (!labelDraft) return;
    const text = labelValue.trim();
    if (text) {
      setAnnotations(current => [...current, { ...labelDraft, label: text }]);
      setDirty(true);
    }
    setLabelDraft(null);
    setLabelValue('');
  };

  const undo = () => {
    setAnnotations(current => current.slice(0, -1));
    setDirty(true);
  };

  const clearAll = () => {
    if (annotations.length === 0) return;
    Alert.alert('Clear Annotations', 'Remove every mark from this photograph?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          setAnnotations([]);
          setDirty(true);
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!media || !caseItem || saving) return;
    if (!composerLoaded) {
      Alert.alert('Still Loading', 'Wait for the photograph to finish loading before saving.');
      return;
    }

    setSaving(true);
    try {
      const previousLocal = media.localPath;
      const previousThumb = media.thumbnailPath;

      let updated: Media = {
        ...media,
        annotations: serializeAnnotations(annotations),
        isSynced: false,
      };

      try {
        // Re-flatten from the pristine capture so repeated edits never compound JPEG artefacts.
        const flattened = await flattenEvidence(composerRef, EXPORT_WIDTH, canvasSize.aspect);
        const [stamped, thumbnail] = await Promise.all([
          persistImage(caseId, flattened, 'evidence'),
          persistThumbnail(caseId, flattened),
        ]);

        updated = {
          ...updated,
          localPath: stamped.uri,
          thumbnailPath: thumbnail.uri,
          width: stamped.width,
          height: stamped.height,
          fileSize: stamped.size,
        };

        await realmManager.saveMedia(updated);

        // Only unlink the superseded renditions once the new ones are safely recorded.
        if (previousLocal !== stamped.uri) deleteStoredFile(previousLocal);
        if (previousThumb !== thumbnail.uri) deleteStoredFile(previousThumb);
      } catch {
        // Rasterising can fail on constrained devices. The annotations are vector data,
        // so persist them anyway and keep rendering them as an overlay.
        await realmManager.saveMedia(updated);
      }

      setMedia(updated);
      setDirty(false);
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message ?? 'The annotated image could not be written.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (!dirty) {
      navigation.goBack();
      return;
    }
    Alert.alert('Discard Changes', 'Annotations on this photograph have not been saved.', [
      { text: 'Keep Editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  };

  if (!media || !caseItem) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </SafeAreaView>
    );
  }

  const report = parseQualityReport(media.quality);
  // Annotations are re-applied over the untouched frame, not over an already-stamped copy.
  const baseImage = media.originalPath ?? media.localPath;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {media.angleLabel ?? 'Evidence'}
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#38bdf8" />
          ) : (
            <Text style={[styles.headerAction, !dirty && styles.headerActionMuted]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={{ width: canvasSize.width, height: canvasSize.height, alignSelf: 'center' }}>
          <EvidenceComposer
            ref={composerRef}
            uri={baseImage}
            width={canvasSize.width}
            height={canvasSize.height}
            annotations={annotations}
            onImageLoad={() => setComposerLoaded(true)}
            stamp={{
              caseNumber: caseItem.caseNumber,
              angleLabel: media.angleLabel,
              caption: media.caption,
              latitude: media.latitude,
              longitude: media.longitude,
              altitude: media.altitude,
              gpsAccuracy: media.gpsAccuracy,
              timestamp: media.timestamp,
            }}
          />
          {/* Live input layer. It renders only the in-progress stroke; committed shapes
              belong to the composer so they are included in the flattened export. */}
          <AnnotationCanvas
            width={canvasSize.width}
            height={canvasSize.height}
            annotations={[]}
            tool={tool}
            color={color}
            strokeWidth={strokeWidth}
            onDraft={handleDraft}
          />
        </View>

        <View style={styles.toolbar}>
          <View style={styles.toolRow}>
            {ANNOTATION_TOOLS.map(entry => (
              <TouchableOpacity
                key={entry.tool}
                style={[styles.toolButton, tool === entry.tool && styles.toolButtonActive]}
                onPress={() => setTool(entry.tool)}
              >
                <Text style={styles.toolIcon}>{entry.icon}</Text>
                <Text style={styles.toolLabel}>{entry.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.toolRow}>
            {ANNOTATION_COLORS.map(c => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.swatch,
                  { backgroundColor: c },
                  color === c && styles.swatchActive,
                ]}
                onPress={() => setColor(c)}
              />
            ))}
            {STROKE_WIDTHS.map(w => (
              <TouchableOpacity
                key={w}
                style={[styles.strokeButton, strokeWidth === w && styles.strokeButtonActive]}
                onPress={() => setStrokeWidth(w)}
              >
                <View style={{ width: 20, height: w, backgroundColor: '#e2e8f0', borderRadius: w }} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.toolRow}>
            <TouchableOpacity style={styles.actionButton} onPress={undo} disabled={annotations.length === 0}>
              <Text style={styles.actionButtonText}>↶ Undo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={clearAll} disabled={annotations.length === 0}>
              <Text style={styles.actionButtonText}>✕ Clear</Text>
            </TouchableOpacity>
            <Text style={styles.markCount}>{annotations.length} mark(s)</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Evidence Metadata</Text>
          <Text style={styles.metaRow}>
            📍{' '}
            {media.latitude !== undefined
              ? `${media.latitude.toFixed(6)}°, ${media.longitude?.toFixed(6)}°${
                  media.altitude !== undefined ? ` • ALT ${Math.round(media.altitude)}m` : ''
                }${media.gpsAccuracy !== undefined ? ` • ±${Math.round(media.gpsAccuracy)}m` : ''}`
              : 'No GPS fix was available at capture time'}
          </Text>
          <Text style={styles.metaRow}>🕑 {new Date(media.timestamp).toLocaleString()}</Text>
          {!!media.caption && <Text style={styles.metaRow}>💬 {media.caption}</Text>}
          {report && (
            <View style={styles.inlineRow}>
              <View style={[styles.verdictPill, { backgroundColor: qualityColor(report.verdict) }]}>
                <Text style={styles.verdictPillText}>{report.verdict}</Text>
              </View>
              <Text style={styles.metaRow}>
                Score {report.score}/100 • Sharpness {report.sharpness}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Label prompt for callout text and measurement values */}
      <Modal visible={!!labelDraft} transparent animationType="fade" onRequestClose={() => setLabelDraft(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {labelDraft?.tool === 'MEASURE' ? 'Measurement Value' : 'Callout Text'}
            </Text>
            {labelDraft?.tool === 'MEASURE' && labelDraft.points.length > 1 && (
              <Text style={styles.modalHint}>
                Drawn span: {(normalizedLength(labelDraft.points[0], labelDraft.points[1]) * 100).toFixed(1)}% of
                the frame diagonal. Enter the measured real-world value.
              </Text>
            )}
            <TextInput
              style={styles.modalInput}
              autoFocus
              placeholder={labelDraft?.tool === 'MEASURE' ? 'e.g. 420 mm' : 'e.g. Impact point'}
              placeholderTextColor="#64748b"
              value={labelValue}
              onChangeText={setLabelValue}
              onSubmitEditing={commitLabel}
              returnKeyType="done"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setLabelDraft(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={commitLabel}>
                <Text style={styles.modalConfirmText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  },
  scrollContent: {
    padding: 12,
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
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerAction: {
    color: '#22c55e',
    fontSize: 15,
    fontWeight: 'bold',
  },
  headerActionMuted: {
    color: '#475569',
  },
  toolbar: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 10,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  toolButton: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    minWidth: 52,
  },
  toolButtonActive: {
    backgroundColor: '#1d4ed8',
    borderColor: '#60a5fa',
  },
  toolIcon: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toolLabel: {
    color: '#cbd5e1',
    fontSize: 9,
    marginTop: 2,
  },
  swatch: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#334155',
  },
  swatchActive: {
    borderColor: '#f8fafc',
  },
  strokeButton: {
    width: 32,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  strokeButtonActive: {
    borderColor: '#60a5fa',
  },
  actionButton: {
    backgroundColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
  },
  actionButtonText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
  },
  markCount: {
    color: '#94a3b8',
    fontSize: 11,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  metaRow: {
    color: '#cbd5e1',
    fontSize: 12,
    marginBottom: 4,
    flexShrink: 1,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  verdictPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  verdictPillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 18,
    width: '100%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalHint: {
    color: '#94a3b8',
    fontSize: 11,
    marginBottom: 10,
    lineHeight: 16,
  },
  modalInput: {
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 14,
  },
  modalCancel: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
  },
  modalCancelText: {
    color: '#94a3b8',
    fontWeight: '600',
  },
  modalConfirm: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  modalConfirmText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
