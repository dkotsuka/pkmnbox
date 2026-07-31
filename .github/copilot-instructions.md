# PokéSave Dex - Copilot Instructions

## Tech Stack & Architecture

- React Native + Expo (SDK recente) + TypeScript.
- State: React Hooks / Context (KISS principle).
- Leitura de arquivo: `expo-document-picker` + `expo-file-system` (Base64 -> Uint8Array).
- Separar rigorosamente a camada de I/O (`saveParser.ts`) da camada de UI (Jetpack/Compose-style React Native components).

## Game Boy Gen 1 Save (.sav) Specifications

- Target: 32KB (32768 bytes) binary save files.
- Bitwise Logic: Bit 0 of Byte 0 = Pokemon #001 (Bulbasaur). Shift operations: `(byte & (1 << bitPosition)) !== 0`.

### Hex Memory Map (RAM Offsets)

- Trainer Name: `0x2598` (11 bytes, GB Encoding)
- Dex Owned (Captured): `0x25A3` (19 bytes, bit flags)
- Dex Seen: `0x25B6` (19 bytes, bit flags)
- Party Count: `0x2F2F` (1 byte, range 1-6)
- Party Species IDs: `0x2F30` - `0x2F35`
- Party Struct Start: `0x2F38` (44 bytes per Pokemon)

## Code Conventions

- Strict TypeScript: No `any`. Always use explicit Uint8Array byte offsets.
- Prefer functional components with `FlatList` for grids/lists.
- Keep constants in `src/constants/memoryMap.ts`.
