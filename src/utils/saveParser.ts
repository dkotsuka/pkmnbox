import { GEN1_SAVE_MAP } from "@/constants/memoryMap";
import { decodeGBString } from "@/utils/gbEncoding";

export interface PokedexState {
  isSeen: boolean;
  isOwned: boolean;
}

export interface PokemonStatus {
  id: number;
  isSeen: boolean;
  isOwned: boolean;
}

export interface SaveMetadata {
  trainerName: string;
  trainerId: number;
  money: number;
  rivalName: string;
  badgeCount: number;
  playTimeHours: number;
  playTimeMinutes: number;
  seenCount: number;
  ownedCount: number;
  pokemonCount: number;
}

const OFFSET_OWNED = 0x25a3;
const OFFSET_SEEN = 0x25b6;
const TOTAL_POKEMON = 151;

function countSetBits(byteValue: number): number {
  let count = 0;
  let value = byteValue & 0xff;

  while (value > 0) {
    count += value & 1;
    value >>= 1;
  }

  return count;
}

function decodeBCD(bytes: Uint8Array, offset: number, length: number): number {
  let digits = "";

  for (let index = 0; index < length; index++) {
    const byteValue = bytes[offset + index] ?? 0;
    digits += String(byteValue >> 4);
    digits += String(byteValue & 0x0f);
  }

  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Processa um Uint8Array do arquivo .sav e retorna o status de cada Pokémon (1 a 151).
 */
export const parseSaveFile = (saveBytes: Uint8Array): PokemonStatus[] => {
  const result: PokemonStatus[] = [];

  for (let id = 1; id <= TOTAL_POKEMON; id++) {
    const bitIndex = id - 1;
    const byteOffset = Math.floor(bitIndex / 8);
    const bitPosition = bitIndex % 8;

    const ownedByte = saveBytes[OFFSET_OWNED + byteOffset];
    const seenByte = saveBytes[OFFSET_SEEN + byteOffset];

    const isOwned = (ownedByte & (1 << bitPosition)) !== 0;
    const isSeen = (seenByte & (1 << bitPosition)) !== 0 || isOwned;

    result.push({
      id,
      isSeen,
      isOwned,
    });
  }

  return result;
};

export const parseSaveMetadata = (saveBytes: Uint8Array): SaveMetadata => {
  if (saveBytes.length < GEN1_SAVE_MAP.FILE_SIZE_BYTES) {
    throw new Error("Invalid save size for Gen1 parser.");
  }

  const trainerName = decodeGBString(
    saveBytes,
    GEN1_SAVE_MAP.TRAINER_NAME.OFFSET,
    GEN1_SAVE_MAP.TRAINER_NAME.LENGTH,
  );
  const trainerId =
    (saveBytes[GEN1_SAVE_MAP.TRAINER_ID.OFFSET] ?? 0) |
    ((saveBytes[GEN1_SAVE_MAP.TRAINER_ID.OFFSET + 1] ?? 0) << 8);
  const money = decodeBCD(
    saveBytes,
    GEN1_SAVE_MAP.MONEY.OFFSET,
    GEN1_SAVE_MAP.MONEY.LENGTH,
  );
  const rivalName = decodeGBString(
    saveBytes,
    GEN1_SAVE_MAP.RIVAL_NAME.OFFSET,
    GEN1_SAVE_MAP.RIVAL_NAME.LENGTH,
  );
  const badgeCount = countSetBits(saveBytes[GEN1_SAVE_MAP.BADGES.OFFSET] ?? 0);
  const playTimeHours = saveBytes[GEN1_SAVE_MAP.PLAY_TIME_HOURS.OFFSET] ?? 0;
  const rawMinutes = saveBytes[GEN1_SAVE_MAP.PLAY_TIME_MINUTES.OFFSET] ?? 0;
  const playTimeMinutes = Math.max(0, Math.min(59, rawMinutes));
  const pokedexStatuses = parseSaveFile(saveBytes);
  const seenCount = pokedexStatuses.filter((pokemon) => pokemon.isSeen).length;
  const ownedCount = pokedexStatuses.filter(
    (pokemon) => pokemon.isOwned,
  ).length;

  return {
    trainerName,
    trainerId,
    money,
    rivalName,
    badgeCount,
    playTimeHours,
    playTimeMinutes,
    seenCount,
    ownedCount,
    pokemonCount: ownedCount,
  };
};

/**
 * Utilitário para converter string Base64 lida pelo Expo FileSystem em Uint8Array
 */
export const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};
