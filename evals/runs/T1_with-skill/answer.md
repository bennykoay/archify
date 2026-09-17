# Run T1 — with-skill (prompt included SKILL.md fast-authoring path + invariants)

Condition: SKILL.md consulted (topology exact-match rules, variant guarantee
011-note, quality_profile showcase bar). Input: OROM PNG + brief Table-T1.

## Answer (transcribed topology)

Components (10): orom1 backend "OROM 1"; orom2 security "OROM 2";
orom3 security "OROM 3"; sandbox messagebus "OROM Sandbox Driver";
uefi_nonsandboxed backend "Nonsandboxed UEFI Drivers"; uefi_core backend
"Core UEFI Firmware"; cpu frontend "x86 CPU"; pcie1 backend "PCIe Card 1";
pcie2 security "PCIe Card 2"; pcie3 security "PCIe Card 3".
Boundaries (6): 3× region "Virtual memory space 1/2/3" wrapping
orom1/orom2/orom3; security-group "Ring 3 (less privileged)" wrapping the 3
OROMs; security-group "Ring 0 (more privileged)" wrapping
sandbox+uefi_nonsandboxed+uefi_core; security-group "Hardware (more
privileged)" wrapping cpu+pcie1+pcie2+pcie3.
Connections (3): orom1→sandbox emphasis "storage driver: allowed";
orom2→sandbox security "network driver: blocked"; orom3→sandbox security
"secure boot driver: blocked". PNG ✓/✗ icons → label+variant, no icon field.
meta: quality_profile showcase, visual_preset apple-hig (explicitly requested
in this task prompt).

## Receipts (verbatim tails)

`validate architecture chart2…json --quality showcase --json` → exit 0,
`ok: true`, 9 checks, `composition.status: pass`,
`summary: errors 0, warnings 0`. Full JSON: `validate.receipt.json` (same dir).
Reference file untouched (read-only): validated in place, no bytes changed.

Leakage-note: none (with-skill condition; full consultation allowed).
No PASS/FAIL claimed — Benji grades vs Table-T1.
