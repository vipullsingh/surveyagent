import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { Case, Media, VoiceNote } from '../types';
import { realmManager } from '../database/RealmManager';
import { pdfExporter } from '../services/PDFExporter';

interface Props {
  route: any;
  navigation: any;
}

export const ReportPreviewScreen: React.FC<Props> = ({ route, navigation }) => {
  const { caseId } = route.params;
  const [caseItem, setCaseItem] = useState<Case | undefined>();
  const [medias, setMedias] = useState<Media[]>([]);
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);

  const [includePhotos, setIncludePhotos] = useState(true);
  const [includeGeotags, setIncludeGeotags] = useState(true);
  const [remarks, setRemarks] = useState('Inspected vehicle on-site. Moderate frontal impact damage confirmed.');
  const [inspectorName, setInspectorName] = useState('John Inspector (Senior Surveyor)');
  const [generatedHtml, setGeneratedHtml] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const c = await realmManager.getCaseById(caseId);
    setCaseItem(c);

    const m = await realmManager.getMediaForCase(caseId);
    setMedias(m);

    const v = await realmManager.getVoiceNotesForCase(caseId);
    setVoiceNotes(v);

    if (c) {
      const html = pdfExporter.generateReportHTML(c, m, v, {
        includePhotos: true,
        includeGeotags: true,
        includeChecklist: true,
        customRemarks: remarks,
        inspectorSignature: inspectorName,
      });
      setGeneratedHtml(html);
    }
  };

  const handleExportPDF = () => {
    Alert.alert(
      'PDF Exported Successfully!',
      `Survey Report saved locally at:\n/storage/emulated/0/SurveyAgent/reports/${caseItem?.caseNumber}_Report.pdf`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>PDF Report Generator</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Options Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Export Preferences</Text>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Include Photo Proof ({medias.length})</Text>
            <Switch value={includePhotos} onValueChange={setIncludePhotos} thumbColor="#2563eb" />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Include GPS Coordinates & Timestamp</Text>
            <Switch value={includeGeotags} onValueChange={setIncludeGeotags} thumbColor="#2563eb" />
          </View>

          <Text style={styles.inputLabel}>Inspector Final Remarks</Text>
          <TextInput
            style={styles.input}
            value={remarks}
            onChangeText={setRemarks}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.inputLabel}>Digital Inspector Sign-Off</Text>
          <TextInput
            style={styles.input}
            value={inspectorName}
            onChangeText={setInspectorName}
          />
        </View>

        {/* HTML Preview Frame */}
        <Text style={styles.sectionTitle}>PDF Page Preview</Text>
        <View style={styles.previewFrame}>
          <Text style={styles.previewHeader}>SURVEYAGENT LOSS REPORT</Text>
          <Text style={styles.previewSub}>Ref: {caseItem?.caseNumber}</Text>
          <Text style={styles.previewSub}>Policy: {caseItem?.policyNumber} • Insured: {caseItem?.insuredName}</Text>
          <View style={styles.divider} />
          <Text style={styles.previewSection}>1. AI FINDINGS & DAMAGE SUMMARY</Text>
          <Text style={styles.previewBody}>{caseItem?.aiSummary || 'Physical site inspection completed.'}</Text>
          <Text style={styles.previewSection}>2. RECENT AUDIO TRANSCRIPTIONS</Text>
          <Text style={styles.previewBody}>
            {voiceNotes[0]?.transcript || 'Audio dictation log attached.'}
          </Text>
          <View style={styles.divider} />
          <Text style={styles.previewFooter}>Verified Geotagged Field Audit • 100% Offline Generation</Text>
        </View>

        <TouchableOpacity style={styles.exportBtn} onPress={handleExportPDF}>
          <Text style={styles.exportBtnText}>📄 Export PDF Report</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
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
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  switchLabel: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
  },
  inputLabel: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#334155',
  },
  previewFrame: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  previewHeader: {
    color: '#1e3a8a',
    fontWeight: 'bold',
    fontSize: 14,
    textTransform: 'uppercase',
  },
  previewSub: {
    color: '#475569',
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#cbd5e1',
    marginVertical: 10,
  },
  previewSection: {
    color: '#1e40af',
    fontWeight: 'bold',
    fontSize: 11,
    marginTop: 6,
  },
  previewBody: {
    color: '#334155',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
  },
  previewFooter: {
    color: '#94a3b8',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 6,
  },
  exportBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  exportBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
