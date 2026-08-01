# PokeSave Dex - Global Copilot Instructions

## Scope

These are global and always-on rules. Keep this file short to avoid unnecessary context cost.
Detailed parser guidance and token-efficiency rules are in scoped instruction files under .github/instructions.

## Core Rules

- Use TypeScript strict style and avoid any.
- Keep save parsing logic out of UI components.
- Treat parser behavior as deterministic for the same input bytes.
- Prefer incremental changes with validation over broad rewrites.

## Architecture Baseline

- Stack: React Native + Expo + TypeScript.
- Keep byte-offset constants centralized in src/constants.
- Keep save decoding/parsing in src/utils.
