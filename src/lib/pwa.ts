import { AppDatabase } from '../types';
import { StorageService } from './storage';

export interface SyncQueueItem {
  id: string;
  action: string;       // e.g. 'Criou aula', 'Editou anotação', 'Criou tarefa'
  timestamp: string;
  description: string;  // e.g. "Aula 05 - Fisiologia"
}

export type SyncStatus = 'synced' | 'offline' | 'syncing' | 'error' | 'conflict';

export class PwaService {
  private static queue: SyncQueueItem[] = [];
  private static isOnline: boolean = navigator.onLine;
  private static syncStatus: SyncStatus = navigator.onLine ? 'synced' : 'offline';
  private static deferredPrompt: any = null;
  private static updateAvailable: boolean = false;
  private static waitingWorker: ServiceWorker | null = null;
  private static listeners: Array<(state: {
    isOnline: boolean;
    queue: SyncQueueItem[];
    status: SyncStatus;
    deferredPrompt: any;
    updateAvailable: boolean;
    serverDatabase?: any;
  }) => void> = [];

  public static initialize() {
    // Load queue from localStorage to ensure it survives reboots
    try {
      const savedQueue = localStorage.getItem('caderno_sync_queue');
      if (savedQueue) {
        this.queue = JSON.parse(savedQueue);
      }
    } catch (e) {
      console.warn('Erro ao carregar fila de sincronização:', e);
    }

    // Update status based on actual connection
    this.isOnline = navigator.onLine;
    this.syncStatus = this.isOnline ? 'synced' : 'offline';

    // Set up listeners
    window.addEventListener('online', () => this.handleNetworkChange(true));
    window.addEventListener('offline', () => this.handleNetworkChange(false));

    // Listen for BeforeInstallPrompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.notify();
    });

    // Set up service worker update detection
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) return;

        // Check for updates every 5 minutes
        setInterval(() => {
          reg.update().catch((e) => console.log('Erro ao atualizar SW:', e));
        }, 5 * 60 * 1000);

        const onUpdateFound = () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.updateAvailable = true;
                this.waitingWorker = installingWorker;
                this.notify();
              }
            });
          }
        };

        // If there's already a waiting worker
        if (reg.waiting) {
          this.updateAvailable = true;
          this.waitingWorker = reg.waiting;
          this.notify();
        }

        reg.addEventListener('updatefound', onUpdateFound);
      });

      // Reload when the controller changes (new sw takes over)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }

    // Handle initial auto-sync if online
    if (this.isOnline) {
      this.syncWithServer();
    }
  }

  private static handleNetworkChange(online: boolean) {
    this.isOnline = online;
    this.syncStatus = online ? 'syncing' : 'offline';
    this.notify();

    if (online) {
      // Small delay to let network stabilize
      setTimeout(() => {
        this.syncWithServer();
      }, 1500);
    }
  }

  // Add an item to the sync queue
  public static logAction(action: string, description: string) {
    const newItem: SyncQueueItem = {
      id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      action,
      timestamp: new Date().toISOString(),
      description,
    };

    this.queue.push(newItem);
    this.saveQueue();

    if (!this.isOnline) {
      this.syncStatus = 'offline';
      this.notify();
    } else {
      this.syncWithServer();
    }
  }

  private static saveQueue() {
    try {
      localStorage.setItem('caderno_sync_queue', JSON.stringify(this.queue));
    } catch (e) {
      console.error('Falha ao salvar fila de sincronização:', e);
    }
  }

  public static clearQueue() {
    this.queue = [];
    this.saveQueue();
    this.notify();
  }

  public static getSyncState() {
    return {
      isOnline: this.isOnline,
      queue: this.queue,
      status: this.syncStatus,
      deferredPrompt: this.deferredPrompt,
      updateAvailable: this.updateAvailable,
    };
  }

  // Core synchronization logic with real API endpoint
  public static async syncWithServer(force: boolean = false, overrideServerDatabase?: AppDatabase) {
    if (!this.isOnline) {
      this.syncStatus = 'offline';
      this.notify();
      return;
    }

    this.syncStatus = 'syncing';
    this.notify();

    try {
      const database = overrideServerDatabase || StorageService.getDatabase();
      const payload = {
        database,
        queue: this.queue,
        clientLastSavedAt: database.lastSavedAt || new Date().toISOString(),
        force,
      };

      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Servidor retornou erro na sincronização');
      }

      const result = await response.json();

      if (result.conflict && !force) {
        // Conflict detected! Do not overwrite. Wait for user input.
        this.syncStatus = 'conflict';
        this.notify(result.serverDatabase);
        return;
      }

      // Successful sync!
      this.queue = [];
      this.saveQueue();
      this.syncStatus = 'synced';
      
      if (result.serverDatabase && !force) {
        // If server provided an updated database, merge/apply it
        StorageService.saveDatabase(result.serverDatabase);
      }

      this.notify();
    } catch (error) {
      console.error('Erro ao sincronizar com o servidor:', error);
      this.syncStatus = 'error';
      this.notify();
    }
  }

  // Resolve conflict: choose to overwrite server or replace local
  public static async resolveConflict(choice: 'keep_local' | 'use_server', serverDatabase?: AppDatabase) {
    if (choice === 'keep_local') {
      // Force sync local database to server
      await this.syncWithServer(true);
    } else if (choice === 'use_server' && serverDatabase) {
      // Overwrite local database with server version
      StorageService.saveDatabase(serverDatabase);
      this.queue = [];
      this.saveQueue();
      this.syncStatus = 'synced';
      this.notify();
    }
  }

  // Trigger PWA Installation
  public static async installApp(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        this.deferredPrompt = null;
        this.notify();
        return true;
      }
    } catch (err) {
      console.error('Erro no prompt de instalação:', err);
    }
    return false;
  }

  // Force-activate waiting service worker to apply updates immediately
  public static updateApp() {
    if (this.waitingWorker) {
      this.waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      this.waitingWorker.postMessage('skipWaiting');
    } else {
      window.location.reload();
    }
  }

  // Subscribe to changes
  public static subscribe(listener: (state: any) => void): () => void {
    this.listeners.push(listener);
    // Initial call
    listener(this.getSyncState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private static notify(serverDatabase?: any) {
    this.listeners.forEach((l) => {
      try {
        l({
          isOnline: this.isOnline,
          queue: this.queue,
          status: this.syncStatus,
          deferredPrompt: this.deferredPrompt,
          updateAvailable: this.updateAvailable,
          serverDatabase,
        });
      } catch (err) {
        console.error('Listener error in PwaService:', err);
      }
    });
  }
}
