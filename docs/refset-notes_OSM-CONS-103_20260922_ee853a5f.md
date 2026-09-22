**For whom:** Benji and Commander Ben. Notes for the 12 charts.

# 📋 Reference-set notes — 12 charts

**Goal:** File the 12-chart set with notes. Prove tier cover and SHA list.
**Steps:** (1) File list. (2) Notes. (3) Diffs. (4) Only-we-do. **Verify:** list in §1. Fixes in §4.
**BLUF:** 12 files on disk, SHA-verified. Tier guard met. Benji corrections 1–3 accepted.

## 📁 1. File list

| #. Pick. File. Bytes. SHA256. Source. |
|---|---|---|---|---|---|
- R1 Minard march: `t1-minard-march.png` (687027 B).
- R3 Marey schedule: `t3-marey-schedule.png` (663872 B).
- R6 Beck Tube map: `t6-beck-tube-map.jpg` (114646 B).
- R8 NYC night map: `08-nyc-mta-night-map.png` (544515 B).
- R11 IKEA assembly: `11-ikea-assembly-sektion.jpg` (4337780 B).
- R13 Feynman vertices: `13-feynman-diagrams.svg` (147165 B).
- R14 Gray505 plate: `14-anatomical-plate-gray505.png` (99250 B).
- R16 HIG anatomy: `16-apple-hig-charts-anatomy.png` (30423 B).
- R17 737 PFD: `17-flight-deck-pfd-boeing737.jpg` (104043 B).
- R19 Hospital monitor: `19-hospital-monitor.jpg` (3531480 B).
- R21 Little Nemo grid: `21-comic-panel-grid-little-nemo-1908.jpg` (542976 B).
- R22 Baltimore 1912 front: `22-newspaper-front-page-baltimore-american-1912.png` (795807 B).

Tier cover: T1x2 (1, 3). T2x2 (6, 8). T3x3 (11, 13, 14). T4x3 (16, 17, 19). T5x2 (21, 22). Guard met.

## 📝 2. Per-chart notes

1. Minard: flow width = army size. Build width-mapped wires.
2. Marey: slope = speed. Crossings = meetings. Build slope-as-speed lanes.
3. Beck: 45-degree snap. Geography bent. Build schematic-snap switch.
4. NYC night: one drawing, two states. Build state-variants.
5. IKEA: one arrow, one job. Build one-verb-per-wire.
6. Feynman: small joint alphabet. Build fixed node-kind alphabet.
7. Gray505: labels exiled. Leaders never cross art. Build label-exile rule.
8. HIG: parts named by reader job. Build reader-job E-aliases. Benji fix 2.
9. PFD: ranked signal, fixed estate per rank. Build signal-rank rule. Benji fix 1.
10. Monitor: big numbers, small traces, red for alarms. Build distance-type rule.
11. Nemo: frames set order. Broken grid = emphasis. Build frames-that-mean.
12. Baltimore: headline size = news value. Dense but apart. Build rank-by-size.

## ⚖️ 3. Difference list

Copy: width-number. Slope-speed. Snap. State variants. One-verb wires. Kind alphabet. Label exile. Reader-job names. Ranked estate. Distance type. Frames-that-mean. Rank-by-size. See §2.

Skip these faults: Minard overlaps (fail A16). Tube fake geography. Night small print (fail type floors). IKEA perspective (we stay flat). Newsprint density (risks A15).

## 🏆 4. Only we do

Benji fix 3 applied. Claim (a): no chart here runs geometry checks in CI. HIG and aviation check other things.

Kept: (b) corridor-vs-container split with NA verdicts (A17). (c) UNUSED tracking — defined-but-undrawn entries named.

## 🚪 5. Step 3 gate input

Candidates for 0.1.2: signal-rank estate, reader-job E-aliases, width-mapped wires. Decision lands in the Step 3 gate report.

## 🔑 Hash appendix

- R1 `t1-minard-march.png` sha `8d48041171daa9d9a29bb97a7c69855f863b286d55f752779fd2bf3c25b41da6` src `https://upload.wikimedia.org/wikipedia/commons/2/29/Minard.png. ..`
- R3 `t3-marey-schedule.png` sha `9e572967549b536224a3491ddce275d70f3bcedc7846283758bfc0ed6faaa6d0` src `https://upload.wikimedia.org/wikipedia/commons/d/da/Ibry%27s_Visual_Train_Schedule.png. ..`
- R6 `t6-beck-tube-map.jpg` sha `4ebc1bd013bc5db7fb609a371c5f86514165179f5f94747aed0e5d8c960326c9` src `https://upload.wikimedia.org/wikipedia/commons/3/3e/Beckmap1.jpg. ..`
- R8 `08-nyc-mta-night-map.png` sha `0a6c8700c5666a4c92b861856cdcdbb9ee7b1b0a22ca078c1ac3d5cab42739e2` src `https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/NYC_subway_late_night_map.svg/1280px-NYC_subway_late_night_map.svg.png. ..`
- R11 `11-ikea-assembly-sektion.jpg` sha `b9a225da2a31b9b1e800f06a756e9f21cc67055f71fe78e73399108fbbd47274` src `https://upload.wikimedia.org/wikipedia/commons/e/e0/Ikea_Sektion_Cabinet_Frame_Assembly_2.jpg. ..`
- R13 `13-feynman-diagrams.svg` sha `b78b3fcf174d5a873cad237937411719744f1c05a5929f3d4ee507a0f943ed9f` src `https://upload.wikimedia.org/wikipedia/commons/9/9f/Standard_Model_%E2%80%93_All_Feynman_diagram_vertices.svg. ..`
- R14 `14-anatomical-plate-gray505.png` sha `3fc85a134f4098cdcf2b931f706c5f6e4a3805c1504e8cc56cf67ce97072fe2d` src `https://upload.wikimedia.org/wikipedia/commons/3/3c/Gray505.png. ..`
- R16 `16-apple-hig-charts-anatomy.png` sha `259d18770b9f9de5cadf0494454fd7c7a2f01054192fa064adac4b4a8db2f36e` src `https://developer.apple.com/tutorials/images/com.apple.HIG/charts-anatomy@2x.png. ..`
- R17 `17-flight-deck-pfd-boeing737.jpg` sha `1ec3dd6101a80b9e97e2139c6a98ac69bb0c4f851ef5f991c5391f02bc044c25` src `https://upload.wikimedia.org/wikipedia/commons/c/c5/Primary_Flight_Display_of_Boeing_737-800_aircraft.jpg. ..`
- R19 `19-hospital-monitor.jpg` sha `9391f9e974e9a9d7a78d3e6ed78fef9c138d007dfa395d3bac5da6fcecffdbe3` src `https://upload.wikimedia.org/wikipedia/commons/1/10/Hospital_Patient_Monitor_%2817239884329%29.jpg. ..`
- R21 `21-comic-panel-grid-little-nemo-1908.jpg` sha `9fe8eb837bcacdb1c9ce5f1d2acf089da423a37f8691645c834829e77b8d26bf` src `https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e5/Little_Nemo_1908-08-23.jpg/960px-Little_Nemo_1908-08-23.jpg. ..`
- R22 `22-newspaper-front-page-baltimore-american-1912.png` sha `33ac7b57727c7d057ecabeb68eccf21bde15f85c1012861241f45548394a6807` src `https://commons.wikimedia.org/wiki/Special:FilePath/Baltimore%20American%2C%20April%2016%2C%201912%2C%20front%20page.png?width=800. ..`
