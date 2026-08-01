---
description: "Use when changing Pokemon save parsing, memory offsets, encoding, dex status, party extraction, or save validation."
name: "Parser Domain Guardrails"
applyTo: "src/utils/**, src/constants/**, src/types/**"
---

# Parser Domain Guardrails

- Keep parser I/O and UI layers separate.
- Use explicit byte offsets and typed fields; avoid any.
- Centralize Gen1 offsets in constants, not in UI components.
- Validate file size and structural expectations before parsing sections.
- Return deterministic parse output for identical inputs.
- Add or update regression tests for parser behavior changes.
- Preserve backward compatibility for existing snapshot fields unless intentionally versioned.
