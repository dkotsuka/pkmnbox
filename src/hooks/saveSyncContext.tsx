import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  createSaveSyncService,
  type SaveSyncSnapshot,
} from "@/utils/saveSyncService";

interface SaveSyncContextValue {
  snapshot: SaveSyncSnapshot;
  selectFolder: () => Promise<void>;
  syncNow: () => Promise<void>;
  clearFolderSelection: () => Promise<void>;
  startAutoSync: () => Promise<void>;
  stopAutoSync: () => void;
}

const SaveSyncContext = createContext<SaveSyncContextValue | null>(null);

export function SaveSyncProvider({ children }: { children: React.ReactNode }) {
  const syncService = useMemo(() => createSaveSyncService(), []);
  const [snapshot, setSnapshot] = useState<SaveSyncSnapshot>(
    syncService.getSnapshot(),
  );

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      const restored = await syncService.restorePersistedFolderUri();
      if (!isMounted) {
        return;
      }

      setSnapshot(restored);

      if (restored.folderUri) {
        await syncService.startAutoSync((nextSnapshot) => {
          if (isMounted) {
            setSnapshot(nextSnapshot);
          }
        });
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
      syncService.stopAutoSync();
    };
  }, [syncService]);

  const value: SaveSyncContextValue = {
    snapshot,
    selectFolder: async () => {
      const selected = await syncService.selectFolder();
      setSnapshot(selected);

      if (selected.folderUri) {
        await syncService.startAutoSync(setSnapshot);
      }
    },
    syncNow: async () => {
      const next = await syncService.syncNow();
      setSnapshot(next);
    },
    clearFolderSelection: async () => {
      const next = await syncService.clearFolderSelection();
      setSnapshot(next);
    },
    startAutoSync: async () => {
      await syncService.startAutoSync(setSnapshot);
      setSnapshot(syncService.getSnapshot());
    },
    stopAutoSync: () => {
      syncService.stopAutoSync();
      setSnapshot(syncService.getSnapshot());
    },
  };

  return (
    <SaveSyncContext.Provider value={value}>
      {children}
    </SaveSyncContext.Provider>
  );
}

export function useSaveSync() {
  const context = useContext(SaveSyncContext);
  if (!context) {
    throw new Error("useSaveSync must be used within SaveSyncProvider");
  }

  return context;
}
