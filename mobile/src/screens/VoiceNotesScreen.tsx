import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { VoiceNote } from '../types';
import { realmManager } from '../database/RealmManager';
import { whisperSTTEngine } from '../ai/WhisperSTT';

interface Props {
  route: any;
  navigation: any;
}

export const VoiceNotesScreen: React.FC<Props> = ({ route, navigation }) => {
  const { caseId } = route.params;
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  React.useEffect(() => {
    loadVoiceNotes();
  }, []);

  const loadVoiceNotes = async () => {
    const list = await realmManager.getVoiceNotesForCase(caseId);
    setVoiceNotes(list);
  };

  const handleToggleRecord = async () => {
    if (!recording) {
      setRecording(true);
    } else {
      setRecording(false);
      setTranscribing(true);

      const path = `file:///storage/emulated/0/SurveyAgent/audio/note_${Date.now()}.mp3`;
      const text = await whisperSTTEngine.transcribeAudio(path);

      const newNote: VoiceNote = {
        id: `vnote-${Date.now()}`,
        caseId,
        localAudioPath: path,
        durationSeconds: 18,
        transcript: text,
        isTranscribed: true,
        createdAt: new Date().toISOString(),
      };

      await realmManager.saveVoiceNote(newNote);
      setTranscribing(false);
      await loadVoiceNotes();
      Alert.alert('Dictation Transcribed', 'Offline STT transcription complete and saved to case!');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voice Notes & Dictation</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Record Action Panel */}
      <View style={styles.recordBox}>
        <Text style={styles.recordInstruction}>
          {recording
            ? '🔴 RECORDING... Speak findings clearly'
            : transcribing
            ? '⚡ Transcribing audio via Offline Whisper STT...'
            : 'Tap mic button to start voice dictation'}
        </Text>

        <TouchableOpacity
          style={[styles.recordBtn, recording && styles.recordBtnActive]}
          onPress={handleToggleRecord}
          disabled={transcribing}
        >
          {transcribing ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <Text style={styles.recordIcon}>{recording ? '⏹️' : '🎙️'}</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.whisperTag}>Powered by On-Device Whisper Model (Offline)</Text>
      </View>

      {/* Transcripts List */}
      <Text style={styles.sectionTitle}>Audio Logs & Transcripts ({voiceNotes.length})</Text>
      <FlatList
        data={voiceNotes}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.noteCard}>
            <View style={styles.noteHeader}>
              <Text style={styles.noteTitle}>Audio Note #{index + 1} ({item.durationSeconds}s)</Text>
              <Text style={styles.noteTime}>{new Date(item.createdAt).toLocaleTimeString()}</Text>
            </View>
            <Text style={styles.transcriptText}>{item.transcript || 'No transcript available'}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
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
  recordBox: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  recordInstruction: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  recordBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  recordBtnActive: {
    backgroundColor: '#ef4444',
  },
  recordIcon: {
    fontSize: 32,
  },
  whisperTag: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  noteCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  noteTitle: {
    color: '#38bdf8',
    fontWeight: 'bold',
    fontSize: 13,
  },
  noteTime: {
    color: '#94a3b8',
    fontSize: 11,
  },
  transcriptText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
  },
});
