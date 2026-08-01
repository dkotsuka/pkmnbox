import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";

import {
  base64ToUint8Array,
  parseSaveFile,
  parseSaveMetadata,
  type PokemonStatus,
} from "@/utils/saveParser";

export type SyncState = "idle" | "syncing" | "error";
export type SyncDetectionStrategy = "watch" | "polling";

export interface DetectedSaveFile {
  uri: string;
  name: string;
  size: number | null;
  modifiedAt: number | null;
  generationLabel: string | null;
  trainerName: string | null;
  trainerId: number | null;
  money: number | null;
  rivalName: string | null;
  badgeCount: number | null;
  playTimeHours: number | null;
  playTimeMinutes: number | null;
  seenCount: number | null;
  ownedCount: number | null;
  pokemonCount: number | null;
  pokedexStatuses: PokemonStatus[];
}

export interface SaveSyncSnapshot {
  state: SyncState;
  folderUri: string | null;
  folderRoute: string | null;
  strategy: SyncDetectionStrategy;
  saves: DetectedSaveFile[];
  errorMessage: string | null;
  lastSyncAt: number | null;
}

export interface SaveSyncServiceOptions {
  pollingIntervalMs?: number;
  preferredStrategy?: "auto" | SyncDetectionStrategy;
}

type SaveSyncListener = (snapshot: SaveSyncSnapshot) => void;

type WatchSubscription = {
  remove: () => void;
};

const PERSISTED_CONFIG_FILE = "save-sync-config.json";
const DEFAULT_POLLING_INTERVAL_MS = 3000;
const WEB_FOLDER_URI = "web://selected-folder";

type FileSystemCompat = {
  documentDirectory: string | null;
  writeAsStringAsync: (fileUri: string, contents: string) => Promise<void>;
  readAsStringAsync: (
    fileUri: string,
    options?: { encoding?: string },
  ) => Promise<string>;
  getInfoAsync: (fileUri: string) => Promise<{
    exists: boolean;
    size?: number;
    modificationTime?: number;
  }>;
  deleteAsync: (
    fileUri: string,
    options?: { idempotent?: boolean },
  ) => Promise<void>;
  readDirectoryAsync: (fileUri: string) => Promise<string[]>;
  StorageAccessFramework?: {
    requestDirectoryPermissionsAsync: () => Promise<{
      granted: boolean;
      directoryUri?: string;
    }>;
    readDirectoryAsync: (fileUri: string) => Promise<string[]>;
  };
  EncodingType?: {
    Base64: string;
  };
};

const fileSystemCompat = FileSystem as unknown as FileSystemCompat;

interface PersistedConfig {
  folderUri: string;
  folderRoute: string | null;
}

function getConfigFileUri(): string | null {
  if (!fileSystemCompat.documentDirectory) {
    return null;
  }

  return `${fileSystemCompat.documentDirectory}${PERSISTED_CONFIG_FILE}`;
}

async function persistFolderUri(folderUri: string): Promise<void> {
  const configUri = getConfigFileUri();
  if (!configUri) {
    return;
  }

  await fileSystemCompat.writeAsStringAsync(
    configUri,
    JSON.stringify({
      folderUri,
      folderRoute: folderUri,
    } satisfies PersistedConfig),
  );
}

async function persistFolderSelection(
  folderUri: string,
  folderRoute: string | null,
): Promise<void> {
  const configUri = getConfigFileUri();
  if (!configUri) {
    return;
  }

  await fileSystemCompat.writeAsStringAsync(
    configUri,
    JSON.stringify({ folderUri, folderRoute } satisfies PersistedConfig),
  );
}

async function readPersistedFolderUri(): Promise<string | null> {
  const configUri = getConfigFileUri();
  if (!configUri) {
    return null;
  }

  const info = await fileSystemCompat.getInfoAsync(configUri);
  if (!info.exists) {
    return null;
  }

  const raw = await fileSystemCompat.readAsStringAsync(configUri);
  try {
    const parsed = JSON.parse(raw) as PersistedConfig;
    return typeof parsed.folderUri === "string" ? parsed.folderUri : null;
  } catch {
    return null;
  }
}

async function readPersistedFolderRoute(): Promise<string | null> {
  const configUri = getConfigFileUri();
  if (!configUri) {
    return null;
  }

  const info = await fileSystemCompat.getInfoAsync(configUri);
  if (!info.exists) {
    return null;
  }

  const raw = await fileSystemCompat.readAsStringAsync(configUri);
  try {
    const parsed = JSON.parse(raw) as PersistedConfig;
    return typeof parsed.folderRoute === "string" ? parsed.folderRoute : null;
  } catch {
    return null;
  }
}

async function clearPersistedFolderUri(): Promise<void> {
  const configUri = getConfigFileUri();
  if (!configUri) {
    return;
  }

  const info = await fileSystemCompat.getInfoAsync(configUri);
  if (!info.exists) {
    return;
  }

  await fileSystemCompat.deleteAsync(configUri, { idempotent: true });
}

function fileNameFromUri(uri: string): string {
  const segments = uri.split("/");
  return segments[segments.length - 1] ?? uri;
}

function isSaveFile(uri: string): boolean {
  return fileNameFromUri(uri).toLowerCase().endsWith(".sav");
}

async function listSaveUris(folderUri: string): Promise<string[]> {
  const isAndroidContentUri =
    Platform.OS === "android" && folderUri.startsWith("content://");

  if (isAndroidContentUri) {
    return (
      fileSystemCompat.StorageAccessFramework?.readDirectoryAsync(folderUri) ??
      Promise.resolve([])
    );
  }

  return fileSystemCompat.readDirectoryAsync(folderUri);
}

async function resolveSaveEntry(uri: string): Promise<DetectedSaveFile> {
  const info = await fileSystemCompat.getInfoAsync(uri);
  const metadata = await resolveSaveMetadataFromUri(uri);

  return {
    uri,
    name: fileNameFromUri(uri),
    size: typeof info.size === "number" ? info.size : null,
    modifiedAt:
      typeof info.modificationTime === "number"
        ? info.modificationTime * 1000
        : null,
    generationLabel: metadata.generationLabel,
    trainerName: metadata.trainerName,
    trainerId: metadata.trainerId,
    money: metadata.money,
    rivalName: metadata.rivalName,
    badgeCount: metadata.badgeCount,
    playTimeHours: metadata.playTimeHours,
    playTimeMinutes: metadata.playTimeMinutes,
    seenCount: metadata.seenCount,
    ownedCount: metadata.ownedCount,
    pokemonCount: metadata.pokemonCount,
  };
}

function resolveWebFolderRoute(files: File[]): string | null {
  const firstFile = files[0];
  if (!firstFile) {
    return null;
  }

  const relativePath = firstFile.webkitRelativePath || firstFile.name;
  const folderName = relativePath.split("/")[0];

  return folderName || null;
}

async function selectWebDirectoryFiles(): Promise<File[] | null> {
  if (typeof document === "undefined") {
    return null;
  }

  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.setAttribute("webkitdirectory", "");
    input.setAttribute("directory", "");

    input.onchange = () => {
      const files = input.files ? Array.from(input.files) : [];
      resolve(files.length > 0 ? files : null);
    };

    input.oncancel = () => {
      resolve(null);
    };

    input.click();
  });
}

function emptySaveMetadata(): {
  generationLabel: string | null;
  trainerName: string | null;
  trainerId: number | null;
  money: number | null;
  rivalName: string | null;
  badgeCount: number | null;
  playTimeHours: number | null;
  playTimeMinutes: number | null;
  seenCount: number | null;
  ownedCount: number | null;
  pokemonCount: number | null;
  pokedexStatuses: PokemonStatus[];
} {
  return {
    generationLabel: null,
    trainerName: null,
    trainerId: null,
    money: null,
    rivalName: null,
    badgeCount: null,
    playTimeHours: null,
    playTimeMinutes: null,
    seenCount: null,
    ownedCount: null,
    pokemonCount: null,
    pokedexStatuses: [],
  };
}

function parseSaveMetadataSafe(saveBytes: Uint8Array): {
  generationLabel: string | null;
  trainerName: string | null;
  trainerId: number | null;
  money: number | null;
  rivalName: string | null;
  badgeCount: number | null;
  playTimeHours: number | null;
  playTimeMinutes: number | null;
  seenCount: number | null;
  ownedCount: number | null;
  pokemonCount: number | null;
  pokedexStatuses: PokemonStatus[];
} {
  try {
    const metadata = parseSaveMetadata(saveBytes);
    const pokedexStatuses = parseSaveFile(saveBytes);
    const pokemonCount = pokedexStatuses.filter(
      (pokemon) => pokemon.isOwned,
    ).length;

    return {
      generationLabel: metadata.trainerId > 0 ? "GEN 1" : null,
      trainerName: metadata.trainerName,
      trainerId: metadata.trainerId,
      money: metadata.money,
      rivalName: metadata.rivalName,
      badgeCount: metadata.badgeCount,
      playTimeHours: metadata.playTimeHours,
      playTimeMinutes: metadata.playTimeMinutes,
      seenCount: metadata.seenCount,
      ownedCount: metadata.ownedCount,
      pokemonCount,
      pokedexStatuses,
    };
  } catch {
    return emptySaveMetadata();
  }
}

async function resolveSaveMetadataFromUri(uri: string): Promise<{
  generationLabel: string | null;
  trainerName: string | null;
  trainerId: number | null;
  money: number | null;
  rivalName: string | null;
  badgeCount: number | null;
  playTimeHours: number | null;
  playTimeMinutes: number | null;
  seenCount: number | null;
  ownedCount: number | null;
  pokemonCount: number | null;
  pokedexStatuses: PokemonStatus[];
}> {
  try {
    const base64 = await fileSystemCompat.readAsStringAsync(uri, {
      encoding: fileSystemCompat.EncodingType?.Base64 ?? "base64",
    });

    return parseSaveMetadataSafe(base64ToUint8Array(base64));
  } catch {
    return emptySaveMetadata();
  }
}

async function resolveWebSaveEntry(
  file: File,
  index: number,
): Promise<DetectedSaveFile> {
  let metadata = emptySaveMetadata();

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    metadata = parseSaveMetadataSafe(bytes);
  } catch {
    metadata = emptySaveMetadata();
  }

  return {
    uri: `${WEB_FOLDER_URI}/${encodeURIComponent(file.name)}#${index}`,
    name: file.name,
    size: typeof file.size === "number" ? file.size : null,
    modifiedAt:
      typeof file.lastModified === "number" && file.lastModified > 0
        ? file.lastModified
        : null,
    generationLabel: metadata.generationLabel,
    trainerName: metadata.trainerName,
    trainerId: metadata.trainerId,
    money: metadata.money,
    rivalName: metadata.rivalName,
    badgeCount: metadata.badgeCount,
    playTimeHours: metadata.playTimeHours,
    playTimeMinutes: metadata.playTimeMinutes,
    seenCount: metadata.seenCount,
    ownedCount: metadata.ownedCount,
    pokemonCount: metadata.pokemonCount,
    pokedexStatuses: metadata.pokedexStatuses,
  };
}

function hasPokedexStatusChanged(
  previous: PokemonStatus[],
  next: PokemonStatus[],
): boolean {
  if (previous.length !== next.length) {
    return true;
  }

  for (let i = 0; i < previous.length; i++) {
    const a = previous[i];
    const b = next[i];

    if (
      !a ||
      !b ||
      a.id !== b.id ||
      a.isSeen !== b.isSeen ||
      a.isOwned !== b.isOwned
    ) {
      return true;
    }
  }

  return false;
}

function hasSnapshotChanged(
  previous: DetectedSaveFile[],
  next: DetectedSaveFile[],
): boolean {
  if (previous.length !== next.length) {
    return true;
  }

  for (let i = 0; i < previous.length; i++) {
    const a = previous[i];
    const b = next[i];

    if (
      a.uri !== b.uri ||
      a.size !== b.size ||
      a.modifiedAt !== b.modifiedAt ||
      a.name !== b.name ||
      a.generationLabel !== b.generationLabel ||
      a.trainerName !== b.trainerName ||
      a.trainerId !== b.trainerId ||
      a.money !== b.money ||
      a.rivalName !== b.rivalName ||
      a.badgeCount !== b.badgeCount ||
      a.playTimeHours !== b.playTimeHours ||
      a.playTimeMinutes !== b.playTimeMinutes ||
      a.seenCount !== b.seenCount ||
      a.ownedCount !== b.ownedCount ||
      a.pokemonCount !== b.pokemonCount ||
      hasPokedexStatusChanged(a.pokedexStatuses, b.pokedexStatuses)
    ) {
      return true;
    }
  }

  return false;
}

export class SaveSyncService {
  private readonly pollingIntervalMs: number;
  private readonly preferredStrategy: "auto" | SyncDetectionStrategy;

  private snapshot: SaveSyncSnapshot = {
    state: "idle",
    folderUri: null,
    folderRoute: null,
    strategy: "polling",
    saves: [],
    errorMessage: null,
    lastSyncAt: null,
  };

  private intervalId: ReturnType<typeof setInterval> | null = null;
  private watchSubscription: WatchSubscription | null = null;
  private webSelectedFiles: File[] = [];

  constructor(options?: SaveSyncServiceOptions) {
    this.pollingIntervalMs =
      options?.pollingIntervalMs ?? DEFAULT_POLLING_INTERVAL_MS;
    this.preferredStrategy = options?.preferredStrategy ?? "auto";
  }

  getSnapshot(): SaveSyncSnapshot {
    return this.snapshot;
  }

  async restorePersistedFolderUri(): Promise<SaveSyncSnapshot> {
    const folderUri = await readPersistedFolderUri();
    const folderRoute = await readPersistedFolderRoute();

    const webNeedsReselection =
      Platform.OS === "web" && folderUri === WEB_FOLDER_URI;
    const nextFolderUri = webNeedsReselection ? null : folderUri;

    this.snapshot = {
      ...this.snapshot,
      folderUri: nextFolderUri,
      folderRoute,
      state: "idle",
      errorMessage: webNeedsReselection
        ? "Re-select the folder on Web to restore browser access."
        : null,
      saves: [],
    };

    return this.snapshot;
  }

  async selectFolder(): Promise<SaveSyncSnapshot> {
    if (Platform.OS === "web") {
      const selectedFiles = await selectWebDirectoryFiles();

      if (!selectedFiles) {
        this.snapshot = {
          ...this.snapshot,
          state: "error",
          errorMessage: "No folder was selected.",
        };
        return this.snapshot;
      }

      this.webSelectedFiles = selectedFiles;
      await persistFolderSelection(
        WEB_FOLDER_URI,
        resolveWebFolderRoute(selectedFiles),
      );

      this.snapshot = {
        ...this.snapshot,
        folderUri: WEB_FOLDER_URI,
        folderRoute: resolveWebFolderRoute(selectedFiles),
        state: "idle",
        errorMessage: null,
      };

      return this.syncNow();
    }

    if (Platform.OS !== "android") {
      this.snapshot = {
        ...this.snapshot,
        state: "error",
        errorMessage:
          "Directory selection is currently implemented only for Android in this technical spike.",
      };
      return this.snapshot;
    }

    const permissionResult =
      await fileSystemCompat.StorageAccessFramework?.requestDirectoryPermissionsAsync();

    if (!permissionResult) {
      this.snapshot = {
        ...this.snapshot,
        state: "error",
        errorMessage:
          "Storage Access Framework is unavailable in this runtime.",
      };
      return this.snapshot;
    }

    if (!permissionResult.granted || !permissionResult.directoryUri) {
      this.snapshot = {
        ...this.snapshot,
        state: "error",
        errorMessage: "Directory permission was not granted.",
      };
      return this.snapshot;
    }

    await persistFolderUri(permissionResult.directoryUri);

    this.snapshot = {
      ...this.snapshot,
      folderUri: permissionResult.directoryUri,
      folderRoute: permissionResult.directoryUri,
      state: "idle",
      errorMessage: null,
    };

    return this.snapshot;
  }

  async clearFolderSelection(): Promise<SaveSyncSnapshot> {
    this.stopAutoSync();
    await clearPersistedFolderUri();
    this.webSelectedFiles = [];

    this.snapshot = {
      ...this.snapshot,
      state: "idle",
      folderUri: null,
      folderRoute: null,
      saves: [],
      errorMessage: null,
      lastSyncAt: null,
      strategy: "polling",
    };

    return this.snapshot;
  }

  async syncNow(): Promise<SaveSyncSnapshot> {
    const folderUri = this.snapshot.folderUri;
    if (!folderUri) {
      this.snapshot = {
        ...this.snapshot,
        state: "error",
        errorMessage: "No folder selected.",
      };
      return this.snapshot;
    }

    this.snapshot = {
      ...this.snapshot,
      state: "syncing",
      errorMessage: null,
    };

    if (Platform.OS === "web" && folderUri === WEB_FOLDER_URI) {
      if (this.webSelectedFiles.length === 0) {
        this.snapshot = {
          ...this.snapshot,
          state: "error",
          strategy: "polling",
          errorMessage:
            "Re-select the folder on Web to restore browser access.",
        };

        return this.snapshot;
      }

      const webSaveFiles = this.webSelectedFiles
        .filter((file) => file.name.toLowerCase().endsWith(".sav"))
        .sort((a, b) => a.name.localeCompare(b.name));

      this.snapshot = {
        ...this.snapshot,
        state: "idle",
        strategy: "polling",
        saves: await Promise.all(
          webSaveFiles.map((file, index) => resolveWebSaveEntry(file, index)),
        ),
        errorMessage: null,
        lastSyncAt: Date.now(),
      };

      return this.snapshot;
    }

    try {
      const entries = await listSaveUris(folderUri);
      const saveUris = entries.filter(isSaveFile).sort();
      const saveDetails = await Promise.all(saveUris.map(resolveSaveEntry));

      this.snapshot = {
        ...this.snapshot,
        state: "idle",
        saves: saveDetails,
        errorMessage: null,
        lastSyncAt: Date.now(),
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown sync error.";

      this.snapshot = {
        ...this.snapshot,
        state: "error",
        errorMessage: message,
      };
    }

    return this.snapshot;
  }

  async startAutoSync(listener: SaveSyncListener): Promise<void> {
    this.stopAutoSync();

    await this.syncNow();
    listener(this.snapshot);

    if (Platform.OS === "web") {
      this.snapshot = {
        ...this.snapshot,
        strategy: "polling",
      };
      listener(this.snapshot);
      return;
    }

    if (!this.snapshot.folderUri) {
      return;
    }

    const watchStarted = this.tryStartWatchStrategy(listener);
    if (watchStarted) {
      return;
    }

    this.snapshot = {
      ...this.snapshot,
      strategy: "polling",
    };

    this.intervalId = setInterval(async () => {
      const previous = this.snapshot.saves;
      await this.syncNow();

      if (hasSnapshotChanged(previous, this.snapshot.saves)) {
        listener(this.snapshot);
      }
    }, this.pollingIntervalMs);
  }

  stopAutoSync(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
    }
  }

  private tryStartWatchStrategy(listener: SaveSyncListener): boolean {
    if (this.preferredStrategy === "polling") {
      return false;
    }

    const fsLike = FileSystem as unknown as Record<string, unknown>;
    const watchDirectoryAsync = fsLike.watchDirectoryAsync;

    if (typeof watchDirectoryAsync !== "function") {
      return false;
    }

    const folderUri = this.snapshot.folderUri;
    if (!folderUri) {
      return false;
    }

    const handler = async (): Promise<void> => {
      const previous = this.snapshot.saves;
      await this.syncNow();

      if (hasSnapshotChanged(previous, this.snapshot.saves)) {
        listener(this.snapshot);
      }
    };

    const maybeSubscription = watchDirectoryAsync(folderUri, handler) as
      | WatchSubscription
      | null
      | undefined;

    if (!maybeSubscription || typeof maybeSubscription.remove !== "function") {
      return false;
    }

    this.watchSubscription = maybeSubscription;
    this.snapshot = {
      ...this.snapshot,
      strategy: "watch",
    };

    return true;
  }
}

export function createSaveSyncService(
  options?: SaveSyncServiceOptions,
): SaveSyncService {
  return new SaveSyncService(options);
}
