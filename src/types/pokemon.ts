/**
 * Definições de Tipos para o App PokéSave Dex (Geração 1)
 */

/** Tipos de Pokémon disponíveis na Gen 1 */
export type PokemonType =
  | "Normal"
  | "Fire"
  | "Water"
  | "Grass"
  | "Electric"
  | "Ice"
  | "Fighting"
  | "Poison"
  | "Ground"
  | "Flying"
  | "Psychic"
  | "Bug"
  | "Rock"
  | "Ghost"
  | "Dragon";

/** Estado de captura/visualização de um Pokémon na Pokédex */
export interface PokedexStatus {
  isSeen: boolean;
  isOwned: boolean;
}

/** Dados estáticos de um Pokémon (carregados do JSON local de Kanto) */
export interface StaticPokemonData {
  id: number; // ID na Pokédex (1 a 151)
  name: string;
  types: PokemonType[];
  spriteUrl: string;
}

/** Item retornado para exibição no Grid da Pokédex */
export interface PokedexEntry extends StaticPokemonData, PokedexStatus {}

/** Golpes conhecidos por um Pokémon na Party */
export interface PokemonMove {
  id: number;
  name: string;
  pp: number;
  maxPp: number;
}

/** Atributos/Stats do Pokémon */
export interface PokemonStats {
  attack: number;
  defense: number;
  speed: number;
  special: number;
}

/** Dados estruturados de um Pokémon presente na Party (44 bytes no save) */
export interface PartyPokemon {
  speciesId: number;
  name: string;
  nickname: string;
  otName: string;
  otId: number;
  level: number;
  currentHp: number;
  maxHp: number;
  stats: PokemonStats;
  moves: PokemonMove[];
  statusCondition: number; // 0 = Normal, Bitmask para Poison/Sleep/Burn/etc.
}

/** Resumo numérico da Pokédex */
export interface PokedexSummary {
  seenCount: number;
  ownedCount: number;
  totalCount: number; // Sempre 151 para Gen 1
}

/** Resultado consolidado da leitura do arquivo .sav */
export interface SaveFileParseResult {
  trainerName: string;
  trainerId: number;
  coins: number;
  playTimeHours: number;
  playTimeMinutes: number;
  pokedexSummary: PokedexSummary;
  pokedexEntries: PokedexEntry[];
  party: PartyPokemon[];
}
