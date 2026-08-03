import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Case, ClaimType, CaseStatus } from '../types';
import { realmManager } from '../database/RealmManager';
import { syncEngine, SyncEngineStatus } from '../services/SyncEngine';

interface Props {
  navigation: any;
}

export const CaseListScreen: React.FC<Props> = ({ navigation }) => {
  const [cases, setCases] = useState<Case[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClaimType, setSelectedClaimType] = useState<ClaimType | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<CaseStatus | 'ALL'>('ALL');
  const [syncStatus, setSyncStatus] = useState<SyncEngineStatus>(syncEngine.getStatus());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    const list = await realmManager.getCases();
    setCases(list);
    setSyncStatus(syncEngine.getStatus());
  };

  const handleSync = async () => {
    setRefreshing(true);
    await syncEngine.syncNow();
    await loadCases();
    setRefreshing(false);
  };

  const filteredCases = cases.filter(c => {
    if (selectedClaimType !== 'ALL' && c.claimType !== selectedClaimType) return false;
    if (selectedStatus !== 'ALL' && c.status !== selectedStatus) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchNum = c.caseNumber.toLowerCase().includes(q);
      const matchName = c.insuredName.toLowerCase().includes(q);
      const matchPolicy = c.policyNumber.toLowerCase().includes(q);
      if (!matchNum && !matchName && !matchPolicy) return false;
    }
    return true;
  });

  const getSyncBadgeColor = (status: string) => {
    switch (status) {
      case 'SYNCED':
        return '#10b981'; // emerald
      case 'PENDING':
        return '#f59e0b'; // amber
      case 'OFFLINE_ONLY':
        return '#6366f1'; // indigo
      default:
        return '#ef4444'; // red
    }
  };

  const renderCaseCard = ({ item }: { item: Case }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('CaseDetail', { caseId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.claimTypeBadge}>
          <Text style={styles.claimTypeText}>{item.claimType}</Text>
        </View>
        <View style={[styles.syncBadge, { backgroundColor: getSyncBadgeColor(item.syncStatus) }]}>
          <Text style={styles.syncBadgeText}>{item.syncStatus.replace('_', ' ')}</Text>
        </View>
      </View>

      <Text style={styles.caseNumber}>{item.caseNumber}</Text>
      <Text style={styles.insuredName}>Insured: {item.insuredName}</Text>
      <Text style={styles.policyNumber}>Policy: {item.policyNumber}</Text>

      {item.location && (
        <View style={styles.locationContainer}>
          <Text style={styles.locationText} numberOfLines={1}>
            📍 {item.location}
          </Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        <Text style={styles.statusText}>Status: {item.status.replace('_', ' ')}</Text>
        <Text style={styles.priorityText}>Priority: {item.priority}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* App Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>SurveyAgent Field</Text>
          <Text style={styles.headerSubtitle}>
            {syncStatus.isOnline ? '🟢 Online Mode' : '⚡ Offline Mode (Local AI Active)'}
          </Text>
        </View>
        <TouchableOpacity style={styles.syncButton} onPress={handleSync} disabled={refreshing}>
          <Text style={styles.syncButtonText}>{refreshing ? 'Syncing...' : 'Sync Now'}</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by case #, insured name, policy..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['ALL', 'MOTOR', 'FIRE', 'MARINE', 'PROPERTY'] as (ClaimType | 'ALL')[]}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.chip,
                selectedClaimType === item && styles.chipActive,
              ]}
              onPress={() => setSelectedClaimType(item)}
            >
              <Text style={[styles.chipText, selectedClaimType === item && styles.chipTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Cases List */}
      <FlatList
        data={filteredCases}
        keyExtractor={item => item.id}
        renderItem={renderCaseCard}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleSync} colors={['#2563eb']} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No cases match your filters.</Text>
          </View>
        }
      />

      {/* Create Case Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateCase')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#38bdf8',
    marginTop: 2,
  },
  syncButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  syncButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  searchInput: {
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterRow: {
    paddingVertical: 12,
    paddingLeft: 20,
  },
  chip: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#3b82f6',
  },
  chipText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  claimTypeBadge: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  claimTypeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  syncBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  syncBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  caseNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 4,
  },
  insuredName: {
    fontSize: 14,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  policyNumber: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  locationContainer: {
    marginTop: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#38bdf8',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  statusText: {
    fontSize: 12,
    color: '#a7f3d0',
    fontWeight: '600',
  },
  priorityText: {
    fontSize: 12,
    color: '#fca5a5',
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#2563eb',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabIcon: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: -2,
  },
});
