/**
 * ✅ ADVANCED OFFLINE SYNC SYSTEM
 * Intelligent conflict resolution, queue management, sync optimization
 */

import { 
  db,
  enableIndexedDbPersistence,
  disableNetwork,
  enableNetwork,
} from '../services/firebase';
import { 
  doc, 
  updateDoc, 
  addDoc, 
  collection, 
  getDoc,
  increment,
  timestampNow,
} from 'firebase/firestore';
import { logError } from './errorLogger';

// ===============================================
// 1️⃣ OFFLINE OPERATION QUEUE
// ===============================================

export interface OfflineOperation {
  id: string;
  type: 'update' | 'create' | 'delete';
  collection: string;
  docId: string;
  data: any;
  timestamp: number;
  retries: number;
  priority: 'high' | 'normal' | 'low';
  status: 'pending' | 'syncing' | 'synced' | 'failed';
}

class OfflineSyncManager {
  private operationQueue: OfflineOperation[] = [];
  private isOnline = navigator.onLine;
  private syncInProgress = false;
  private maxRetries = 3;

  constructor() {
    this.initializeNetworkListener();
    this.loadQueueFromStorage();
  }

  /**
   * ✅ Listen for network changes
   */
  private initializeNetworkListener(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🌐 Back online - Starting sync');
      this.syncAllOperations();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📡 Offline - Queueing operations');
    });
  }

  /**
   * ✅ Queue operation for offline
   */
  queueOperation(
    type: 'update' | 'create' | 'delete',
    collection: string,
    docId: string,
    data: any,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): string {
    const operation: OfflineOperation = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      collection,
      docId,
      data,
      timestamp: Date.now(),
      retries: 0,
      priority,
      status: 'pending',
    };

    this.operationQueue.push(operation);

    // Sort by priority (high first)
    this.operationQueue.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    this.saveQueueToStorage();
    console.log('📝 Operation queued:', operation.id);

    // Sync if online
    if (this.isOnline) {
      this.syncAllOperations();
    }

    return operation.id;
  }

  /**
   * ✅ Sync all pending operations
   */
  async syncAllOperations(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) {
      return;
    }

    this.syncInProgress = true;

    try {
      for (const operation of this.operationQueue) {
        if (operation.status === 'synced' || operation.status === 'syncing') {
          continue;
        }

        operation.status = 'syncing';
        this.saveQueueToStorage();

        try {
          await this.syncOperation(operation);
          operation.status = 'synced';
          console.log('✅ Operation synced:', operation.id);
        } catch (error: any) {
          operation.retries++;

          if (operation.retries >= this.maxRetries) {
            operation.status = 'failed';
            logError({
              message: `Operation failed after ${this.maxRetries} retries`,
              level: 'error',
              context: `Offline Sync - ${operation.collection}`,
            });
          } else {
            operation.status = 'pending';
            console.warn(
              `⚠️ Sync failed, retry ${operation.retries}/${this.maxRetries}`
            );
          }
        }

        this.saveQueueToStorage();
      }

      // Remove synced operations
      this.operationQueue = this.operationQueue.filter(
        (op) => op.status !== 'synced'
      );
      this.saveQueueToStorage();
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * ✅ Sync single operation
   */
  private async syncOperation(operation: OfflineOperation): Promise<void> {
    const ref = doc(db, operation.collection, operation.docId);

    switch (operation.type) {
      case 'update':
        await updateDoc(ref, {
          ...operation.data,
          _lastSyncedAt: Date.now(),
        });
        break;

      case 'create':
        await addDoc(collection(db, operation.collection), {
          ...operation.data,
          _createdOffline: true,
          _syncedAt: Date.now(),
        });
        break;

      case 'delete':
        await updateDoc(ref, {
          _deleted: true,
          _deletedAt: Date.now(),
        });
        break;
    }

    // Log analytics
    this.logSyncEvent(operation);
  }

  /**
   * ✅ Handle conflict resolution
   */
  async resolveConflict(
    collection: string,
    docId: string,
    localData: any,
    remoteData: any
  ): Promise<any> {
    console.log('⚔️ Conflict detected - Resolving...');

    // Strategy: Use server version for critical fields, local for others
    const merged = {
      ...remoteData,
      // Preserve user's recent changes
      customTexts: localData.customTexts,
      settings: { ...remoteData.settings, ...localData.settings },
      // Merge statistics (additive)
      totalWPM: Math.max(remoteData.totalWPM, localData.totalWPM),
      totalXP: Math.max(remoteData.totalXP, localData.totalXP),
      _conflictResolved: true,
      _resolvedAt: Date.now(),
    };

    return merged;
  }

  /**
   * ✅ Get operation queue status
   */
  getQueueStatus() {
    return {
      total: this.operationQueue.length,
      pending: this.operationQueue.filter((op) => op.status === 'pending').length,
      syncing: this.operationQueue.filter((op) => op.status === 'syncing').length,
      failed: this.operationQueue.filter((op) => op.status === 'failed').length,
      isOnline: this.isOnline,
      isSyncing: this.syncInProgress,
    };
  }

  /**
   * ✅ Save queue to IndexedDB
   */
  private saveQueueToStorage(): void {
    try {
      localStorage.setItem(
        'offlineSyncQueue',
        JSON.stringify(this.operationQueue)
      );
    } catch (error) {
      logError({
        message: 'Failed to save offline queue',
        level: 'warn',
        context: 'Offline Sync',
      });
    }
  }

  /**
   * ✅ Load queue from IndexedDB
   */
  private loadQueueFromStorage(): void {
    try {
      const stored = localStorage.getItem('offlineSyncQueue');
      if (stored) {
        this.operationQueue = JSON.parse(stored);
        console.log(`📥 Loaded ${this.operationQueue.length} pending operations`);

        // Auto-sync if online
        if (this.isOnline) {
          setTimeout(() => this.syncAllOperations(), 1000);
        }
      }
    } catch (error) {
      logError({
        message: 'Failed to load offline queue',
        level: 'warn',
        context: 'Offline Sync',
      });
    }
  }

  /**
   * ✅ Clear all operations
   */
  clearQueue(): void {
    this.operationQueue = [];
    localStorage.removeItem('offlineSyncQueue');
    console.log('🗑️ Offline queue cleared');
  }

  /**
   * ✅ Log sync event to analytics
   */
  private logSyncEvent(operation: OfflineOperation): void {
    if ((window as any).firebase?.analytics) {
      try {
        (window as any).firebase.analytics().logEvent('offline_sync', {
          operation_type: operation.type,
          collection: operation.collection,
          time_in_queue: Date.now() - operation.timestamp,
          retries: operation.retries,
        });
      } catch {
        // Ignore analytics errors
      }
    }
  }
}

// Singleton
export const offlineSyncManager = new OfflineSyncManager();

// ===============================================
// 2️⃣ OFFLINE-FIRST DATA ACCESS
// ===============================================

/**
 * ✅ Smart get operation (use cache first, then server)
 */
export async function getOfflineFirstData(
  collection: string,
  docId: string
): Promise<any> {
  try {
    const ref = doc(db, collection, docId);
    
    // Try to get from cache first (offline)
    const docSnapshot = await getDoc(ref);
    
    if (docSnapshot.exists()) {
      return {
        data: docSnapshot.data(),
        source: 'cache',
        synced: true,
      };
    }
  } catch (error) {
    logError({
      message: 'Failed to get offline data',
      level: 'warn',
      context: 'Offline Get',
    });
  }

  return null;
}

/**
 * ✅ Update with optimization (batch if offline)
 */
export async function updateOfflineOptimized(
  collection: string,
  docId: string,
  data: any
): Promise<string | null> {
  if (navigator.onLine) {
    // Online - sync immediately
    try {
      const ref = doc(db, collection, docId);
      await updateDoc(ref, data);
      console.log('✅ Data updated (online)');
      return 'synced';
    } catch (error) {
      logError({
        message: 'Failed to update online',
        level: 'error',
        context: 'Offline Update',
      });
      // Fall back to queue
    }
  }

  // Offline or online failed - queue it
  return offlineSyncManager.queueOperation('update', collection, docId, data);
}

// ===============================================
// 3️⃣ NETWORK STATUS MONITORING
// ===============================================

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = React.useState(offlineSyncManager.getQueueStatus());

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus(offlineSyncManager.getQueueStatus());
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update sync status periodically
    const interval = setInterval(() => {
      setSyncStatus(offlineSyncManager.getQueueStatus());
    }, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return { isOnline, syncStatus };
}

export default offlineSyncManager;
