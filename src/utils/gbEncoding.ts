/**
 * Mapeamento oficial de caracteres (Game Boy Character Encoding)
 * para Pokémon Geração 1 (English / Versões Ocidentais Red, Blue, Yellow).
 *
 * No Game Boy, textos e nomes não usam ASCII/UTF-8 padronizados.
 * Cada caractere corresponde a um byte específico na RAM/Save.
 */

export const GB_CHARACTER_MAP: Readonly<Record<number, string>> = {
  // Controle e Fim de String
  0x50: "", // String Terminator (Fim da string no save)
  0x7f: " ", // Espaço em branco

  // Maiúsculas (0x80 - 0x99)
  0x80: "A",
  0x81: "B",
  0x82: "C",
  0x83: "D",
  0x84: "E",
  0x85: "F",
  0x86: "G",
  0x87: "H",
  0x88: "I",
  0x89: "J",
  0x8a: "K",
  0x8b: "L",
  0x8c: "M",
  0x8d: "N",
  0x8e: "O",
  0x8f: "P",
  0x90: "Q",
  0x91: "R",
  0x92: "S",
  0x93: "T",
  0x94: "U",
  0x95: "V",
  0x96: "W",
  0x97: "X",
  0x98: "Y",
  0x99: "Z",

  // Pontuação e Símbolos (0x9A - 0x9F)
  0x9a: "(",
  0x9b: ")",
  0x9c: ":",
  0x9d: ";",
  0x9e: "[",
  0x9f: "]",

  // Minúsculas (0xA0 - 0xB9)
  0xa0: "a",
  0xa1: "b",
  0xa2: "c",
  0xa3: "d",
  0xa4: "e",
  0xa5: "f",
  0xa6: "g",
  0xa7: "h",
  0xa8: "i",
  0xa9: "j",
  0xaa: "k",
  0xab: "l",
  0xac: "m",
  0xad: "n",
  0xae: "o",
  0xaf: "p",
  0xb0: "q",
  0xb1: "r",
  0xb2: "s",
  0xb3: "t",
  0xb4: "u",
  0xb5: "v",
  0xb6: "w",
  0xb7: "x",
  0xb8: "y",
  0xb9: "z",

  // Símbolos Especiais e Pontuação Interna
  0xba: "é",
  0xbb: "'d",
  0xbc: "'l",
  0xbd: "'s",
  0xbe: "'t",
  0xbf: "'v",
  0xe0: "'",
  0xe1: "PK",
  0xe2: "MN",
  0xe3: "-",
  0xe4: "'r",
  0xe5: "'m",
  0xe6: "?",
  0xe7: "!",
  0xe8: ".",
  0xed: "→",
  0xee: "↓",
  0xef: "♂",
  0xf0: "¥",
  0xf1: "×",
  0xf2: ".",
  0xf3: "/",
  0xf4: ",",
  0xf5: "♀",

  // Números (0xF6 - 0xFF)
  0xf6: "0",
  0xf7: "1",
  0xf8: "2",
  0xf9: "3",
  0xfa: "4",
  0xfb: "5",
  0xfc: "6",
  0xfd: "7",
  0xfe: "8",
  0xff: "9",
};

/**
 * Decodifica um conjunto de bytes do Game Boy para uma string TypeScript.
 * Parando ao encontrar o caractere terminador 0x50 ou atingir o maxLength.
 *
 * @param bytes Buffer contendo os bytes lidos do arquivo .sav
 * @param offset Posição inicial no buffer
 * @param maxLength Tamanho máximo do campo (ex: 11 bytes para o nome do treinador)
 * @returns String decodificada limpa
 */
export function decodeGBString(
  bytes: Uint8Array,
  offset: number = 0,
  maxLength: number = bytes.length,
): string {
  let result = "";
  const end = Math.min(offset + maxLength, bytes.length);

  for (let i = offset; i < end; i++) {
    const byte = bytes[i];

    // 0x50 é o terminador oficial da string no Game Boy
    if (byte === 0x50) {
      break;
    }

    const char = GB_CHARACTER_MAP[byte];
    if (char !== undefined) {
      result += char;
    } else {
      // Caso encontre um byte não mapeado (padding ou caractere desconhecido)
      result += "?";
    }
  }

  return result.trim();
}

/**
 * Codifica uma string normal em Uint8Array no formato nativo do Game Boy Gen 1.
 * Adiciona o terminador 0x50 no final se houver espaço.
 *
 * @param str String a ser codificada (ex: "RED")
 * @param length Tamanho fixo do array de retorno (ex: 11 bytes)
 * @returns Uint8Array formatado para gravação no save
 */
export function encodeGBString(str: string, length: number = 11): Uint8Array {
  const result = new Uint8Array(length);
  // Preenche o buffer inicial com terminadores/padding 0x50
  result.fill(0x50);

  // Inverte o mapeamento para busca por caractere
  const reverseMap: Record<string, number> = {};
  for (const [byteStr, char] of Object.entries(GB_CHARACTER_MAP)) {
    if (char && char.length === 1) {
      reverseMap[char] = Number(byteStr);
    }
  }

  let resultIndex = 0;
  for (let i = 0; i < str.length && resultIndex < length - 1; i++) {
    const char = str[i];
    if (reverseMap[char] !== undefined) {
      result[resultIndex++] = reverseMap[char];
    } else {
      // Espaço como fallback para caracteres desconhecidos
      result[resultIndex++] = 0x7f;
    }
  }

  return result;
}
