# T1 — Transcription (OROM sandbox PNG → architecture JSON)

Source image: the OROM-sandbox PNG (Image #1 in the objective; 1484×966).
Reference answer (read-only, never modified):
`tools/archify/design-explore/chart2-orom-architecture-apple-hig.json`
(frozen at the run date; chart2 JSON read live this session).

## Input to the runner

"Reproduce the attached OROM-sandbox PNG as archify architecture type.
Phase-1 table (§Table-T1) lists every element. Write chart JSON
(visual_preset apple-hig, quality showcase), validate 9/9, deliver HTML,
screenshot same-viewport, paste receipts verbatim."

## Table-T1 (pre-registered — digit-against-digit ground truth)

Components (10): orom1 backend "OROM 1"; orom2 security "OROM 2";
orom3 security "OROM 3"; sandbox messagebus "OROM Sandbox Driver";
uefi_nonsandboxed backend "Nonsandboxed UEFI Drivers"; uefi_core backend
"Core UEFI Firmware"; cpu frontend "x86 CPU"; pcie1 backend "PCIe Card 1";
pcie2 security "PCIe Card 2"; pcie3 security "PCIe Card 3".

Boundaries (6): region "Virtual memory space 1" wraps [orom1]; region
"Virtual memory space 2" wraps [orom2]; region "Virtual memory space 3"
wraps [orom3]; security-group "Ring 3 (less privileged)" wraps
[orom1,orom2,orom3]; security-group "Ring 0 (more privileged)" wraps
[sandbox,uefi_nonsandboxed,uefi_core]; security-group "Hardware (more
privileged)" wraps [cpu,pcie1,pcie2,pcie3].

Connections (3): orom1→sandbox "storage driver: allowed" emphasis;
orom2→sandbox "network driver: blocked" security; orom3→sandbox
"secure boot driver: blocked" security. PNG ✓/✗ icons have no schema
field → encoded in label + variant (007 finding, frozen in chart cards).

## PASS-T1

Topology exact-match vs Table-T1: all 10 components (id+type+label),
all 6 boundaries (kind+label+wraps), all 3 connections (from/to/variant);
no extra or missing elements.
