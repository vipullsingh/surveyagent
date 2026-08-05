import React, { useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Case, Media, VoiceNote } from '../types';
import { realmManager } from '../database/RealmManager';
import { localLLMEngine, LocalAIAnalysisResult } from '../ai/LLMEngine';
import { computeCompleteness } from '../evidence/guidedAngles';

interface Props {
  route: any;
  navigation: any;
}

export const CaseDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { caseId } = route.params;
  const [caseItem, setCaseItem] = useState<Case | undefined>();
  const [medias, setMedias] = useState<Media[]>([]);
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<LocalAIAnalysisResult | undefined>();
  const [analyzingAI, setAnalyzingAI] = useState(false);

  // Reloads on focus so evidence captured on the camera screen is reflected immediately.
  useFocusEffect(
    React.useCallback(() => {
      loadCaseData();
    }, [caseId])
  );

  const loadCaseData = async () => {
    const item = await realmManager.getCaseById(caseId);
    setCaseItem(item);

    const mList = await realmManager.getMediaForCase(caseId);
    setMedias(mList);

    const vList = await realmManager.getVoiceNotesForCase(caseId);
    setVoiceNotes(vList);
  };

  const evidenceCoverage = useMemo(
    () => (caseItem ? computeCompleteness(caseItem.claimType, medias) : undefined),
    [caseItem, medias]
  );

  const handleRunOfflineAI = async () => {
    if (!caseItem) return;
    setAnalyzingAI(true);
    const result = await localLLMEngine.analyzeCaseOffline(caseItem, medias, voiceNotes);
    setAiAnalysis(result);

    // Update case with AI summary
    const updated = { ...caseItem, aiSummary: result.summary };
    await realmManager.saveCase(updated);
    setCaseItem(updated);
    setAnalyzingAI(false);
  };

  if (!caseItem) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{caseItem.caseNumber}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{caseItem.claimType}</Text>
          </View>
        </View>

        {/* Claim Info Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Claim Identification</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Insured Name:</Text>
            <Text style={styles.infoValue}>{caseItem.insuredName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Policy Number:</Text>
            <Text style={styles.infoValue}>{caseItem.policyNumber}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date of Loss:</Text>
            <Text style={styles.infoValue}>{caseItem.dateOfLoss.substring(0, 10)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Site Location:</Text>
            <Text style={styles.infoValue}>{caseItem.location || 'N/A'}</Text>
          </View>
        </View>

        {/* Action Modules */}
        <Text style={styles.sectionHeading}>Field Modules</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('CameraEvidence', { caseId: caseItem.id })}
          >
            <Text style={styles.actionIcon}>📸</Text>
            <Text style={styles.actionTitle}>Camera & Evidence</Text>
            <Text style={styles.actionCount}>{medias.length} Captured</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('VoiceNotes', { caseId: caseItem.id })}
          >
            <Text style={styles.actionIcon}>🎙️</Text>
            <Text style={styles.actionTitle}>Voice Notes</Text>
            <Text style={styles.actionCount}>{voiceNotes.length} Audio Logs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('ChecklistForm', { caseId: caseItem.id, claimType: caseItem.claimType })}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionTitle}>Smart Checklist</Text>
            <Text style={styles.actionCount}>Progress 75%</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('ReportPreview', { caseId: caseItem.id })}
          >
            <Text style={styles.actionIcon}>📄</Text>
            <Text style={styles.actionTitle}>Export PDF</Text>
            <Text style={styles.actionCount}>Preview & Sign</Text>
          </TouchableOpacity>
        </View>

        {/* Evidence Completeness (Guided Photo Wizard coverage) */}
        {evidenceCoverage && (
          <TouchableOpacity
            style={styles.evidenceCard}
            onPress={() => navigation.navigate('CameraEvidence', { caseId: caseItem.id })}
          >
            <View style={styles.evidenceHeader}>
              <Text style={styles.evidenceTitle}>📷 Evidence Completeness</Text>
              <Text
                style={[
                  styles.evidencePercent,
                  evidenceCoverage.isComplete ? styles.evidenceComplete : styles.evidenceIncomplete,
                ]}
              >
                {evidenceCoverage.requiredCaptured}/{evidenceCoverage.requiredTotal}
              </Text>
            </View>
            <View style={styles.evidenceTrack}>
              <View style={[styles.evidenceFill, { width: `${evidenceCoverage.percent}%` }]} />
            </View>
            <Text style={styles.evidenceDetail}>
              {evidenceCoverage.isComplete
                ? 'All compulsory angles captured — ready for report sign-off.'
                : `Missing: ${evidenceCoverage.missingRequired.map(a => a.label).join(', ')}`}
            </Text>
          </TouchableOpacity>
        )}

        {/* Local AI Analysis Section */}
        <View style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <Text style={styles.aiTitle}>⚡ On-Device Local LLM Analysis</Text>
            <TouchableOpacity style={styles.runAiButton} onPress={handleRunOfflineAI} disabled={analyzingAI}>
              {analyzingAI ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.runAiButtonText}>Run AI Analysis</Text>
              )}
            </TouchableOpacity>
          </View>

          {caseItem.aiSummary ? (
            <View style={styles.aiContent}>
              <Text style={styles.aiSummaryText}>{caseItem.aiSummary}</Text>
              {aiAnalysis && (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.aiSubtitle}>Suggested Severity: {aiAnalysis.suggestedDamageSeverity}</Text>
                  {aiAnalysis.missingInformationWarnings.map((w, idx) => (
                    <Text key={idx} style={styles.warningText}>⚠️ {w}</Text>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.aiPlaceholder}>
              Tap "Run AI Analysis" to execute on-device LLM analysis offline (Speech-to-text + Damage Auto-tagging).
            </Text>
          )}
        </View>
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
    paddingBottom: 40,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  badge: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 12,
    marginTop: 10,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  infoLabel: {
    color: '#94a3b8',
    fontSize: 14,
  },
  infoValue: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionCard: {
    backgroundColor: '#1e293b',
    width: '48%',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionCount: {
    color: '#38bdf8',
    fontSize: 12,
  },
  evidenceCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  evidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  evidenceTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: 'bold',
  },
  evidencePercent: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  evidenceComplete: {
    color: '#22c55e',
  },
  evidenceIncomplete: {
    color: '#f59e0b',
  },
  evidenceTrack: {
    height: 6,
    backgroundColor: '#0f172a',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  evidenceFill: {
    height: 6,
    backgroundColor: '#22c55e',
  },
  evidenceDetail: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 16,
  },
  aiCard: {
    backgroundColor: '#1e1b4b',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#4338ca',
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiTitle: {
    color: '#e0e7ff',
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  runAiButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  runAiButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  aiContent: {
    marginTop: 6,
  },
  aiSummaryText: {
    color: '#c7d2fe',
    fontSize: 13,
    lineHeight: 18,
  },
  aiSubtitle: {
    color: '#818cf8',
    fontWeight: 'bold',
    fontSize: 12,
    marginTop: 4,
  },
  warningText: {
    color: '#fca5a5',
    fontSize: 12,
    marginTop: 2,
  },
  aiPlaceholder: {
    color: '#a5b4fc',
    fontSize: 12,
    fontStyle: 'italic',
  },
});
