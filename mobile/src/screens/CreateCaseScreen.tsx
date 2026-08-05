import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Case, ClaimType, CaseStatus } from '../types';
import { realmManager } from '../database/RealmManager';
import { createUuid } from '../services/SyncPayloads';

interface Props {
  navigation: any;
}

const CLAIM_TYPES: ClaimType[] = ['MOTOR', 'FIRE', 'MARINE', 'ENGINEERING', 'PROPERTY', 'OTHER'];
const PRIORITIES: ('LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const STATUSES: CaseStatus[] = ['DRAFT', 'IN_PROGRESS'];

export const CreateCaseScreen: React.FC<Props> = ({ navigation }) => {
  const [claimType, setClaimType] = useState<ClaimType>('MOTOR');
  const [caseNumber, setCaseNumber] = useState(`CAS-${new Date().getFullYear()}-MOTOR-${Math.floor(1000 + Math.random() * 9000)}`);
  const [policyNumber, setPolicyNumber] = useState('');
  const [insuredName, setInsuredName] = useState('');
  const [insuredContact, setInsuredContact] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [dateOfLoss, setDateOfLoss] = useState(new Date().toISOString().split('T')[0]);
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [status, setStatus] = useState<CaseStatus>('DRAFT');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gpsFetching, setGpsFetching] = useState(false);

  const handleSelectClaimType = (type: ClaimType) => {
    setClaimType(type);
    const rand = Math.floor(1000 + Math.random() * 9000);
    setCaseNumber(`CAS-${new Date().getFullYear()}-${type}-${rand}`);
  };

  const handleFetchGPS = () => {
    setGpsFetching(true);
    setTimeout(() => {
      // Simulated high-precision field GPS fix
      setLatitude(37.7749);
      setLongitude(-122.4194);
      if (!location) {
        setLocation('Market St & 4th St, San Francisco, CA');
      }
      setGpsFetching(false);
    }, 600);
  };

  const handleCreateCase = async () => {
    if (!caseNumber.trim()) {
      Alert.alert('Validation Error', 'Case Reference Number is required.');
      return;
    }
    if (!policyNumber.trim()) {
      Alert.alert('Validation Error', 'Policy Number is required.');
      return;
    }
    if (!insuredName.trim()) {
      Alert.alert('Validation Error', 'Insured Name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newCase: Case = {
        // Must be a UUID: evidence deltas carry this as `case_id`, which the Golang
        // sync handler parses as uuid.UUID.
        id: createUuid(),
        organizationId: '00000000-0000-0000-0000-000000000001',
        caseNumber: caseNumber.trim(),
        claimType,
        policyNumber: policyNumber.trim(),
        insuredName: insuredName.trim(),
        insuredContact: insuredContact.trim(),
        location: location.trim(),
        latitude,
        longitude,
        dateOfLoss: new Date(dateOfLoss).toISOString(),
        assignedDate: new Date().toISOString(),
        priority,
        status,
        syncStatus: 'OFFLINE_ONLY',
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await realmManager.saveCase(newCase);
      setIsSubmitting(false);

      Alert.alert('Success', 'Offline claim case created successfully!', [
        {
          text: 'Open Case Details',
          onPress: () => navigation.replace('CaseDetail', { caseId: newCase.id }),
        },
      ]);
    } catch (error) {
      setIsSubmitting(false);
      Alert.alert('Error', 'Failed to save case locally. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Claim Case</Text>
        <TouchableOpacity
          style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
          onPress={handleCreateCase}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.saveButtonText}>Create</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Claim Type Selector */}
        <Text style={styles.sectionHeading}>Claim Type *</Text>
        <View style={styles.chipGrid}>
          {CLAIM_TYPES.map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, claimType === t && styles.chipActive]}
              onPress={() => handleSelectClaimType(t)}
            >
              <Text style={[styles.chipText, claimType === t && styles.chipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Claim Identification */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Claim Details</Text>

          <Text style={styles.label}>Case Reference Number *</Text>
          <TextInput
            style={styles.input}
            value={caseNumber}
            onChangeText={setCaseNumber}
            placeholder="e.g. CAS-2026-MOTOR-1001"
            placeholderTextColor="#64748b"
          />

          <Text style={styles.label}>Policy Number *</Text>
          <TextInput
            style={styles.input}
            value={policyNumber}
            onChangeText={setPolicyNumber}
            placeholder="e.g. POL-9948102"
            placeholderTextColor="#64748b"
          />

          <Text style={styles.label}>Insured Name *</Text>
          <TextInput
            style={styles.input}
            value={insuredName}
            onChangeText={setInsuredName}
            placeholder="e.g. John Doe / ACME Corp"
            placeholderTextColor="#64748b"
          />

          <Text style={styles.label}>Insured Contact Phone / Email</Text>
          <TextInput
            style={styles.input}
            value={insuredContact}
            onChangeText={setInsuredContact}
            placeholder="e.g. +1 (555) 019-2831"
            placeholderTextColor="#64748b"
          />

          <Text style={styles.label}>Date of Loss (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={dateOfLoss}
            onChangeText={setDateOfLoss}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#64748b"
          />
        </View>

        {/* Site Location & GPS */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeading}>Site Location & Evidence GPS</Text>
            <TouchableOpacity
              style={styles.gpsButton}
              onPress={handleFetchGPS}
              disabled={gpsFetching}
            >
              <Text style={styles.gpsButtonText}>
                {gpsFetching ? 'Getting GPS...' : '📍 Auto-GPS'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Inspection Site Address</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Address or location details..."
            placeholderTextColor="#64748b"
          />

          <View style={styles.gpsDisplayRow}>
            <View style={styles.gpsBox}>
              <Text style={styles.gpsLabel}>Latitude</Text>
              <Text style={styles.gpsVal}>{latitude !== undefined ? latitude.toFixed(6) : 'Not set'}</Text>
            </View>
            <View style={styles.gpsBox}>
              <Text style={styles.gpsLabel}>Longitude</Text>
              <Text style={styles.gpsVal}>{longitude !== undefined ? longitude.toFixed(6) : 'Not set'}</Text>
            </View>
          </View>
        </View>

        {/* Priority & Status */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Priority & Status</Text>

          <Text style={styles.label}>Priority</Text>
          <View style={styles.pillsRow}>
            {PRIORITIES.map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.pill, priority === p && styles.pillActive]}
                onPress={() => setPriority(p)}
              >
                <Text style={[styles.pillText, priority === p && styles.pillTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Initial Status</Text>
          <View style={styles.pillsRow}>
            {STATUSES.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.pill, status === s && styles.pillActive]}
                onPress={() => setStatus(s)}
              >
                <Text style={[styles.pillText, status === s && styles.pillTextActive]}>{s.replace('_', ' ')}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Initial Notes */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Initial Loss Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Enter initial field observations, loss summary, or surveyor notes..."
            placeholderTextColor="#64748b"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.saveButtonDisabled]}
          onPress={handleCreateCase}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>Create Claim Case (Save Offline)</Text>
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backButtonText: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  saveButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  chip: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  chipText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 6,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  gpsButton: {
    backgroundColor: '#0369a1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  gpsButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  gpsDisplayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  gpsBox: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 10,
    width: '48%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  gpsLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  gpsVal: {
    fontSize: 13,
    color: '#38bdf8',
    fontWeight: '600',
    marginTop: 2,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  pill: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  pillActive: {
    backgroundColor: '#2563eb',
    borderColor: '#3b82f6',
  },
  pillText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
