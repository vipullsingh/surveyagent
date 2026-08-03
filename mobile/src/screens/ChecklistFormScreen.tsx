import React, { useState } from 'react';
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
import { ClaimType } from '../types';
import { realmManager } from '../database/RealmManager';

interface Props {
  route: any;
  navigation: any;
}

export const ChecklistFormScreen: React.FC<Props> = ({ route, navigation }) => {
  const { caseId, claimType } = route.params as { caseId: string; claimType: ClaimType };

  const [odometer, setOdometer] = useState('45,210 miles');
  const [pointOfImpact, setPointOfImpact] = useState('Front bumper & radiator grill');
  const [airbagsDeployed, setAirbagsDeployed] = useState(true);
  const [drivable, setDrivable] = useState(false);
  const [fluidLeak, setFluidLeak] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSaveChecklist = async () => {
    setSaving(true);
    const caseItem = await realmManager.getCaseById(caseId);
    if (caseItem) {
      const data = {
        odometer,
        point_of_impact: pointOfImpact,
        airbags_deployed: airbagsDeployed,
        drivable,
        fluid_leak: fluidLeak,
        updated_at: new Date().toISOString(),
      };
      caseItem.checklistData = JSON.stringify(data);
      await realmManager.saveCase(caseItem);
    }
    setSaving(false);
    Alert.alert('Checklist Saved', 'Smart checklist responses saved locally!');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{claimType} Inspection Checklist</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.progressCard}>
          <Text style={styles.progressText}>Checklist Progress: 5 / 5 Fields Completed (100%)</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '100%' }]} />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Odometer Reading / Machine Hours *</Text>
          <TextInput
            style={styles.input}
            value={odometer}
            onChangeText={setOdometer}
            placeholder="e.g. 45,000 miles"
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Primary Point of Impact / Damage Origin *</Text>
          <TextInput
            style={styles.input}
            value={pointOfImpact}
            onChangeText={setPointOfImpact}
            placeholder="e.g. Frontal, Roof, Left Flank"
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View style={styles.switchGroup}>
          <View style={styles.switchTextContainer}>
            <Text style={styles.switchLabel}>Airbags / Safety Systems Deployed?</Text>
            <Text style={styles.switchSublabel}>Compulsory check for motor accident claims</Text>
          </View>
          <Switch value={airbagsDeployed} onValueChange={setAirbagsDeployed} thumbColor="#2563eb" />
        </View>

        <View style={styles.switchGroup}>
          <View style={styles.switchTextContainer}>
            <Text style={styles.switchLabel}>Is Asset Drivable / Operation Ready?</Text>
            <Text style={styles.switchSublabel}>Determines towing or emergency site securing requirement</Text>
          </View>
          <Switch value={drivable} onValueChange={setDrivable} thumbColor="#2563eb" />
        </View>

        <View style={styles.switchGroup}>
          <View style={styles.switchTextContainer}>
            <Text style={styles.switchLabel}>Active Coolant / Oil / Fluid Leak Observed?</Text>
            <Text style={styles.switchSublabel}>Environmental & engine damage hazard tag</Text>
          </View>
          <Switch value={fluidLeak} onValueChange={setFluidLeak} thumbColor="#2563eb" />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveChecklist} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : '💾 Save Checklist'}</Text>
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
  progressCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  progressText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#334155',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  switchTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  switchLabel: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
  },
  switchSublabel: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  saveBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
