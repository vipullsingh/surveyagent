import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { Media } from '../types';
import { realmManager } from '../database/RealmManager';

interface Props {
  route: any;
  navigation: any;
}

export const CameraEvidenceScreen: React.FC<Props> = ({ route, navigation }) => {
  const { caseId } = route.params;
  const [medias, setMedias] = useState<Media[]>([]);
  const [caption, setCaption] = useState('');
  const [capturing, setCapturing] = useState(false);

  React.useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    const list = await realmManager.getMediaForCase(caseId);
    setMedias(list);
  };

  const handleSimulateCapture = async () => {
    setCapturing(true);

    const newMedia: Media = {
      id: `media-${Date.now()}`,
      caseId,
      localPath: `file:///storage/emulated/0/SurveyAgent/photos/img_${Date.now()}.jpg`,
      fileType: 'PHOTO',
      latitude: 37.7749 + (Math.random() - 0.5) * 0.01,
      longitude: -122.4194 + (Math.random() - 0.5) * 0.01,
      timestamp: new Date().toISOString(),
      aiTags: ['damage_detected', 'geotagged_verified'],
      caption: caption || 'Compulsory Angle Photo',
      isSynced: false,
    };

    await realmManager.saveMedia(newMedia);
    setCaption('');
    setCapturing(false);
    await loadMedia();
    Alert.alert('Photo Saved Offline', 'Photo saved locally with GPS Geotag & Timestamp!');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Evidence Capture</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Simulated Viewfinder */}
      <View style={styles.viewfinder}>
        <Text style={styles.watermarkText}>
          📍 GPS: 37.7749° N, 122.4194° W • {new Date().toLocaleString()}
        </Text>
        <View style={styles.targetReticle} />
        <Text style={styles.guidedAngleText}>GUIDED WIZARD: CAPTURE FRONT ANGLE DAMAGE</Text>
      </View>

      {/* Caption Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.captionInput}
          placeholder="Enter photo caption / damage tag..."
          placeholderTextColor="#94a3b8"
          value={caption}
          onChangeText={setCaption}
        />
        <TouchableOpacity style={styles.captureBtn} onPress={handleSimulateCapture} disabled={capturing}>
          <Text style={styles.captureBtnText}>{capturing ? 'Saving...' : '📸 Snap'}</Text>
        </TouchableOpacity>
      </View>

      {/* Media Gallery */}
      <Text style={styles.sectionTitle}>Captured Case Evidence ({medias.length})</Text>
      <FlatList
        data={medias}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.mediaItem}>
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderText}>📷 PHOTO #{index + 1}</Text>
            </View>
            <View style={styles.mediaDetails}>
              <Text style={styles.captionText}>{item.caption || 'No caption'}</Text>
              <Text style={styles.geoText}>
                📍 Lat: {item.latitude?.toFixed(4)}°, Lng: {item.longitude?.toFixed(4)}°
              </Text>
              <Text style={styles.timeText}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
            </View>
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
    marginBottom: 16,
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
  viewfinder: {
    backgroundColor: '#020617',
    height: 220,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#38bdf8',
    justifyContent: 'space-between',
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  watermarkText: {
    color: '#38bdf8',
    fontSize: 11,
    fontFamily: 'monospace',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  targetReticle: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 30,
    borderStyle: 'dashed',
  },
  guidedAngleText: {
    color: '#fef08a',
    fontSize: 11,
    fontWeight: 'bold',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  captionInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  captureBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 18,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  mediaItem: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  photoPlaceholder: {
    width: 70,
    height: 60,
    backgroundColor: '#334155',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: 'bold',
  },
  mediaDetails: {
    marginLeft: 12,
    flex: 1,
  },
  captionText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
  },
  geoText: {
    color: '#38bdf8',
    fontSize: 11,
    marginTop: 2,
  },
  timeText: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 2,
  },
});
