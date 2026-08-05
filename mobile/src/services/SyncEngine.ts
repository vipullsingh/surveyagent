import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { realmManager } from '../database/RealmManager';

export interface SyncEngineStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingItemsCount: number;
  lastSyncTime?: string;
  error?: string;
}

export const getBackendSyncUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return `${process.env.EXPO_PUBLIC_API_URL}/api/v1/sync`;
  }

  // Web Browser environment
  if (Platform.OS === 'web') {
    return 'http://localhost:8080/api/v1/sync';
  }

  // Dynamic host IP resolution for physical device / Expo Go via Metro bundle URL
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip) {
      return `http://${ip}:8080/api/v1/sync`;
    }
  }

  // Fallback for Android Emulator vs iOS Simulator / default
  const defaultHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  return `http://${defaultHost}:8080/api/v1/sync`;
};

class SyncEngine {
  private isOnline = true;
  private isSyncing = false;
  private authToken = '';
  private lastSyncTime?: string;

  private get backendUrl(): string {
    return getBackendSyncUrl();
  }

  public setAuthToken(token: string) {
    this.authToken = token;
  }

  public setOnlineStatus(status: boolean) {
    this.isOnline = status;
  }

  public getStatus(): SyncEngineStatus {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingItemsCount: realmManager.getSyncQueue().length,
      lastSyncTime: this.lastSyncTime,
    };
  }

  /**
   * Flush local mutations to Golang server
   */
  public async syncNow(): Promise<{ success: boolean; processed: number; error?: string }> {
    if (!this.isOnline) {
      return { success: false, processed: 0, error: 'Device is offline. Connection required for sync.' };
    }

    const queue = realmManager.getSyncQueue();
    if (queue.length === 0) {
      this.lastSyncTime = new Date().toISOString();
      return { success: true, processed: 0 };
    }

    this.isSyncing = true;
    try {
      const deltas = queue.map(q => ({
        entity_name: q.entityName,
        entity_id: q.entityId,
        action: q.action,
        data: q.payloadJson,
        client_time: q.createdAt,
      }));

      const payload = {
        last_synced_at: this.lastSyncTime || new Date(0).toISOString(),
        deltas,
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      const response = await fetch(this.backendUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Sync HTTP error ${response.status}`);
      }

      const resData = await response.json();
      realmManager.clearSyncQueue();
      this.lastSyncTime = new Date().toISOString();

      // Update sync status on local cases
      const cases = await realmManager.getCases();
      for (const c of cases) {
        if (c.syncStatus === 'OFFLINE_ONLY' || c.syncStatus === 'PENDING') {
          c.syncStatus = 'SYNCED';
          await realmManager.saveCase(c);
        }
      }

      this.isSyncing = false;
      return { success: true, processed: resData.processed_deltas || queue.length };
    } catch (err: any) {
      this.isSyncing = false;
      return { success: false, processed: 0, error: err.message || 'Sync failed' };
    }
  }
}

export const syncEngine = new SyncEngine();
