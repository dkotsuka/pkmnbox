export interface PokedexState {
  isSeen: boolean;
  isOwned: boolean;
}

export interface PokemonStatus {
  id: number;
  isSeen: boolean;
  isOwned: boolean;
}

const OFFSET_OWNED = 0x25a3;
const OFFSET_SEEN = 0x25b6;
const TOTAL_POKEMON = 151;

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
