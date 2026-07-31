/** Offsets estáticos de memória do save de Pokémon Gen 1 (Red/Blue/Yellow) */
export const GEN1_SAVE_MAP = {
  FILE_SIZE_BYTES: 32768,
  TRAINER_NAME: { OFFSET: 0x2598, LENGTH: 11 },
  POKEDEX_OWNED: { OFFSET: 0x25a3, LENGTH: 19 },
  POKEDEX_SEEN: { OFFSET: 0x25b6, LENGTH: 19 },
  PARTY_COUNT: { OFFSET: 0x2f2f, LENGTH: 1 },
  PARTY_SPECIES: { OFFSET: 0x2f30, LENGTH: 6 },
  PARTY_DATA_START: { OFFSET: 0x2f38, STRUCT_SIZE: 44 },
} as const;
