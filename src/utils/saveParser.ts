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

export interface PokemonStorageSlot {
  speciesIndex: number | null;
  pokedexId: number | null;
}

export interface ParsedStorageData {
  currentBoxNumber: number | null;
  party: PokemonStorageSlot[];
  boxes: PokemonStorageSlot[][];
}

const OFFSET_OWNED = 0x25a3;
const OFFSET_SEEN = 0x25b6;
const TOTAL_POKEMON = 151;

const DEX_NAME_LIST: string[] = [
  "BULBASAUR",
  "IVYSAUR",
  "VENUSAUR",
  "CHARMANDER",
  "CHARMELEON",
  "CHARIZARD",
  "SQUIRTLE",
  "WARTORTLE",
  "BLASTOISE",
  "CATERPIE",
  "METAPOD",
  "BUTTERFREE",
  "WEEDLE",
  "KAKUNA",
  "BEEDRILL",
  "PIDGEY",
  "PIDGEOTTO",
  "PIDGEOT",
  "RATTATA",
  "RATICATE",
  "SPEAROW",
  "FEAROW",
  "EKANS",
  "ARBOK",
  "PIKACHU",
  "RAICHU",
  "SANDSHREW",
  "SANDSLASH",
  "NIDORAN_F",
  "NIDORINA",
  "NIDOQUEEN",
  "NIDORAN_M",
  "NIDORINO",
  "NIDOKING",
  "CLEFAIRY",
  "CLEFABLE",
  "VULPIX",
  "NINETALES",
  "JIGGLYPUFF",
  "WIGGLYTUFF",
  "ZUBAT",
  "GOLBAT",
  "ODDISH",
  "GLOOM",
  "VILEPLUME",
  "PARAS",
  "PARASECT",
  "VENONAT",
  "VENOMOTH",
  "DIGLETT",
  "DUGTRIO",
  "MEOWTH",
  "PERSIAN",
  "PSYDUCK",
  "GOLDUCK",
  "MANKEY",
  "PRIMEAPE",
  "GROWLITHE",
  "ARCANINE",
  "POLIWAG",
  "POLIWHIRL",
  "POLIWRATH",
  "ABRA",
  "KADABRA",
  "ALAKAZAM",
  "MACHOP",
  "MACHOKE",
  "MACHAMP",
  "BELLSPROUT",
  "WEEPINBELL",
  "VICTREEBEL",
  "TENTACOOL",
  "TENTACRUEL",
  "GEODUDE",
  "GRAVELER",
  "GOLEM",
  "PONYTA",
  "RAPIDASH",
  "SLOWPOKE",
  "SLOWBRO",
  "MAGNEMITE",
  "MAGNETON",
  "FARFETCHD",
  "DODUO",
  "DODRIO",
  "SEEL",
  "DEWGONG",
  "GRIMER",
  "MUK",
  "SHELLDER",
  "CLOYSTER",
  "GASTLY",
  "HAUNTER",
  "GENGAR",
  "ONIX",
  "DROWZEE",
  "HYPNO",
  "KRABBY",
  "KINGLER",
  "VOLTORB",
  "ELECTRODE",
  "EXEGGCUTE",
  "EXEGGUTOR",
  "CUBONE",
  "MAROWAK",
  "HITMONLEE",
  "HITMONCHAN",
  "LICKITUNG",
  "KOFFING",
  "WEEZING",
  "RHYHORN",
  "RHYDON",
  "CHANSEY",
  "TANGELA",
  "KANGASKHAN",
  "HORSEA",
  "SEADRA",
  "GOLDEEN",
  "SEAKING",
  "STARYU",
  "STARMIE",
  "MR_MIME",
  "SCYTHER",
  "JYNX",
  "ELECTABUZZ",
  "MAGMAR",
  "PINSIR",
  "TAUROS",
  "MAGIKARP",
  "GYARADOS",
  "LAPRAS",
  "DITTO",
  "EEVEE",
  "VAPOREON",
  "JOLTEON",
  "FLAREON",
  "PORYGON",
  "OMANYTE",
  "OMASTAR",
  "KABUTO",
  "KABUTOPS",
  "AERODACTYL",
  "SNORLAX",
  "ARTICUNO",
  "ZAPDOS",
  "MOLTRES",
  "DRATINI",
  "DRAGONAIR",
  "DRAGONITE",
  "MEWTWO",
  "MEW",
];

const DEX_NAME_TO_ID: Record<string, number> = DEX_NAME_LIST.reduce(
  (accumulator, speciesName, index) => {
    accumulator[speciesName] = index + 1;
    return accumulator;
  },
  {} as Record<string, number>,
);

const GEN1_INDEX_TO_DEX_NAME: (string | null)[] = [
  null,
  "RHYDON",
  "KANGASKHAN",
  "NIDORAN_M",
  "CLEFAIRY",
  "SPEAROW",
  "VOLTORB",
  "NIDOKING",
  "SLOWBRO",
  "IVYSAUR",
  "EXEGGUTOR",
  "LICKITUNG",
  "EXEGGCUTE",
  "GRIMER",
  "GENGAR",
  "NIDORAN_F",
  "NIDOQUEEN",
  "CUBONE",
  "RHYHORN",
  "LAPRAS",
  "ARCANINE",
  "MEW",
  "GYARADOS",
  "SHELLDER",
  "TENTACOOL",
  "GASTLY",
  "SCYTHER",
  "STARYU",
  "BLASTOISE",
  "PINSIR",
  "TANGELA",
  null,
  null,
  "GROWLITHE",
  "ONIX",
  "FEAROW",
  "PIDGEY",
  "SLOWPOKE",
  "KADABRA",
  "GRAVELER",
  "CHANSEY",
  "MACHOKE",
  "MR_MIME",
  "HITMONLEE",
  "HITMONCHAN",
  "ARBOK",
  "PARASECT",
  "PSYDUCK",
  "DROWZEE",
  "GOLEM",
  null,
  "MAGMAR",
  null,
  "ELECTABUZZ",
  "MAGNETON",
  "KOFFING",
  null,
  "MANKEY",
  "SEEL",
  "DIGLETT",
  "TAUROS",
  null,
  null,
  null,
  "FARFETCHD",
  "VENONAT",
  "DRAGONITE",
  null,
  null,
  null,
  "DODUO",
  "POLIWAG",
  "JYNX",
  "MOLTRES",
  "ARTICUNO",
  "ZAPDOS",
  "DITTO",
  "MEOWTH",
  "KRABBY",
  null,
  null,
  null,
  "VULPIX",
  "NINETALES",
  "PIKACHU",
  "RAICHU",
  null,
  null,
  "DRATINI",
  "DRAGONAIR",
  "KABUTO",
  "KABUTOPS",
  "HORSEA",
  "SEADRA",
  null,
  null,
  "SANDSHREW",
  "SANDSLASH",
  "OMANYTE",
  "OMASTAR",
  "JIGGLYPUFF",
  "WIGGLYTUFF",
  "EEVEE",
  "FLAREON",
  "JOLTEON",
  "VAPOREON",
  "MACHOP",
  "ZUBAT",
  "EKANS",
  "PARAS",
  "POLIWHIRL",
  "POLIWRATH",
  "WEEDLE",
  "KAKUNA",
  "BEEDRILL",
  null,
  "DODRIO",
  "PRIMEAPE",
  "DUGTRIO",
  "VENOMOTH",
  "DEWGONG",
  null,
  null,
  "CATERPIE",
  "METAPOD",
  "BUTTERFREE",
  "MACHAMP",
  null,
  "GOLDUCK",
  "HYPNO",
  "GOLBAT",
  "MEWTWO",
  "SNORLAX",
  "MAGIKARP",
  null,
  null,
  "MUK",
  null,
  "KINGLER",
  "CLOYSTER",
  null,
  "ELECTRODE",
  "CLEFABLE",
  "WEEZING",
  "PERSIAN",
  "MAROWAK",
  null,
  "HAUNTER",
  "ABRA",
  "ALAKAZAM",
  "PIDGEOTTO",
  "PIDGEOT",
  "STARMIE",
  "BULBASAUR",
  "VENUSAUR",
  "TENTACRUEL",
  null,
  "GOLDEEN",
  "SEAKING",
  null,
  null,
  null,
  null,
  "PONYTA",
  "RAPIDASH",
  "RATTATA",
  "RATICATE",
  "NIDORINO",
  "NIDORINA",
  "GEODUDE",
  "PORYGON",
  "AERODACTYL",
  null,
  "MAGNEMITE",
  null,
  null,
  "CHARMANDER",
  "SQUIRTLE",
  "CHARMELEON",
  "WARTORTLE",
  "CHARIZARD",
  null,
  null,
  null,
  null,
  "ODDISH",
  "GLOOM",
  "VILEPLUME",
  "BELLSPROUT",
  "WEEPINBELL",
  "VICTREEBEL",
];

function resolvePokedexIdFromSpeciesIndex(speciesIndex: number): number | null {
  const dexName = GEN1_INDEX_TO_DEX_NAME[speciesIndex] ?? null;
  if (!dexName) {
    return null;
  }

  return DEX_NAME_TO_ID[dexName] ?? null;
}

function clampCount(rawCount: number | undefined, maxCount: number): number {
  if (typeof rawCount !== "number") {
    return 0;
  }

  return Math.max(0, Math.min(maxCount, rawCount));
}

function parseSpeciesSlots(
  saveBytes: Uint8Array,
  speciesOffset: number,
  count: number,
  slotCount: number,
): PokemonStorageSlot[] {
  const slots: PokemonStorageSlot[] = [];

  for (let slotIndex = 0; slotIndex < slotCount; slotIndex++) {
    if (slotIndex >= count) {
      slots.push({ speciesIndex: null, pokedexId: null });
      continue;
    }

    const rawSpecies = saveBytes[speciesOffset + slotIndex] ?? 0;
    if (rawSpecies <= 0 || rawSpecies === 0xff) {
      slots.push({ speciesIndex: null, pokedexId: null });
      continue;
    }

    slots.push({
      speciesIndex: rawSpecies,
      pokedexId: resolvePokedexIdFromSpeciesIndex(rawSpecies),
    });
  }

  return slots;
}

export const parsePartyAndBoxes = (
  saveBytes: Uint8Array,
): ParsedStorageData => {
  if (saveBytes.length < GEN1_SAVE_MAP.FILE_SIZE_BYTES) {
    throw new Error("Invalid save size for Gen1 parser.");
  }

  const partyCount = clampCount(
    saveBytes[GEN1_SAVE_MAP.PARTY_COUNT.OFFSET],
    GEN1_SAVE_MAP.PARTY_SPECIES.LENGTH,
  );
  const party = parseSpeciesSlots(
    saveBytes,
    GEN1_SAVE_MAP.PARTY_SPECIES.OFFSET,
    partyCount,
    GEN1_SAVE_MAP.PARTY_SPECIES.LENGTH,
  );

  const rawCurrentBox = saveBytes[GEN1_SAVE_MAP.CURRENT_BOX_NUMBER.OFFSET] ?? 0;
  const currentBoxNumber = rawCurrentBox & 0x7f;
  const hasValidCurrentBox = currentBoxNumber < GEN1_SAVE_MAP.BOX_COUNT;

  const boxes: PokemonStorageSlot[][] = [];

  for (let boxIndex = 0; boxIndex < GEN1_SAVE_MAP.BOX_COUNT; boxIndex++) {
    const shouldUseCurrentBoxData =
      hasValidCurrentBox && boxIndex === currentBoxNumber;
    const baseOffset = shouldUseCurrentBoxData
      ? GEN1_SAVE_MAP.CURRENT_BOX_DATA.OFFSET
      : boxIndex < 6
        ? GEN1_SAVE_MAP.SAVED_BOXES_BANK_1_START.OFFSET +
          boxIndex * GEN1_SAVE_MAP.BOX_STRUCT_SIZE
        : GEN1_SAVE_MAP.SAVED_BOXES_BANK_2_START.OFFSET +
          (boxIndex - 6) * GEN1_SAVE_MAP.BOX_STRUCT_SIZE;

    if (baseOffset + GEN1_SAVE_MAP.BOX_STRUCT_SIZE > saveBytes.length) {
      boxes.push(
        Array.from({ length: GEN1_SAVE_MAP.BOX_CAPACITY }, () => ({
          speciesIndex: null,
          pokedexId: null,
        })),
      );
      continue;
    }

    const boxCount = clampCount(
      saveBytes[baseOffset],
      GEN1_SAVE_MAP.BOX_CAPACITY,
    );
    boxes.push(
      parseSpeciesSlots(
        saveBytes,
        baseOffset + 1,
        boxCount,
        GEN1_SAVE_MAP.BOX_CAPACITY,
      ),
    );
  }

  return {
    currentBoxNumber: hasValidCurrentBox ? currentBoxNumber : null,
    party,
    boxes,
  };
};

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
