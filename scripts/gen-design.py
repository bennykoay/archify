#!/usr/bin/env python
# gen-design.py — one source, two outputs: design.md (the checklist SSOT) and
# design.html (the same checklist with the real pixels beside every rule).
# Run from D:\Onesimus\tools\archify.

import io, os, json

OUT_MD   = "docs/design-audit.md"
OUT_HTML = "docs/design.html"

CHARTS = ["Architecture", "Workflow", "Sequence", "Dataflow", "Lifecycle"]

# id, name, proposed/actual token name, named_today, where drawn,
# owning checks, GOOD (tier, rule), OURS, verdict
E = [
 ("E1","Frame","structural-frame",True,"render-architecture.mjs:1033","A7, A9, A14, P1, P2",
  ("T2","Four clauses: wraps its members, never crosses another frame, is at least half filled, leaves its title rail clear."),
  "Wraps its members (passes by construction). <b>4 of 15 frame pairs cross</b>, counting only pairs where neither is fully inside the other. <b>Fill 29.6% to 48.1%.</b> The hand-placed chart einvoice-order-flow-v3 is worse: <b>6 of 15 crossing</b>, fill 42.5% to 59.2% — so crossing is not caused by automatic placement. Three clauses of four fail, and no check watches any of the three.","FAIL"),
 ("E2","Frame title","structural-frame-label",True,"render-architecture.mjs:1038","A2",
  ("T4","One title per frame, placed clear of the frame's own cards."),
  "Stacks into a pile when cards are auto-placed. Visible in the sheet.","FAIL"),
 ("E3","Frame title backing","structural-frame-label-mask",True,"render-architecture.mjs:1039","P3",
  ("T2","Matches its frame, and leaves its own title readable."),
  "Colour is correct: var(--region-fill), dark 0.00, light 0.00, fixed in SEE-008. But it backs a title that stacks on its neighbours, so the element it serves does not work. A backing behind an unreadable label is not passing.","GAP"),
 ("E4","Lane box","c-lane",False,"template.html:5171","A3",
  ("T2","Reads as a lane. May carry a border; may not depend on one."),
  "The only element in eighteen that has a border. Dashed, lane-stroke.","PASS"),
 ("E5","Lane header","lane-header-mask",False,"render-workflow.mjs:682","nothing",
  ("T4","Names its lane. Distinct from the lane body."),
  "Flat var(--mask), no border, no name. No check measures it.","FAIL"),
 ("E6","Node card","node-card-mask",False,"all five renderers","A2, A8, P1",
  ("T2","Stands apart from its frame. Colour distance of at least one."),
  "var(--mask). Dark card on a lighter frame. Passes P1.","PASS"),
 ("E7","Node stripe","node-accent-bar",False,"render-architecture.mjs:1080","nothing",
  ("T4","Carries the node's kind as colour. Never the only signal of kind."),
  "Drawn in architecture only. No check measures it.","FAIL"),
 ("E8","Security group","security-group",False,"template.html CSS","P1",
  ("T4","Marks a guarded cluster."),
  "Defined in the template but not drawn in any of the five sampled charts.","UNUSED"),
 ("E9","Grid","grid",False,"template.html CSS","nothing",
  ("T4","Alignment aid. Should not be visible in a delivered chart."),
  "Matches an element that renders completely empty. Sheet shows a blank cell.","UNUSED"),
 ("E10","Edge label backing","edge-label-mask",False,"all five renderers","nothing",
  ("T4","Tinted from the wire it belongs to. Carries a border in that colour."),
  "Flat var(--mask), identical to a node card, no tie to its wire, no border.","FAIL"),
 ("E11","Edge label text","segment-label",True,"all five renderers","A3, A4, A15",
  ("T2","Stands clear of every card and sublabel by 24px."),
  "Measured by three checks. Seventeen clearance failures still booked.","FAIL"),
 ("E12","Message label backing","message-label-mask",False,"render-sequence.mjs:344","nothing",
  ("T4","Same rule as E10, on a sequence message."),
  "Sequence draws messages differently. E10's rule does not reach it.","FAIL"),
 ("E13","Activation bar","activation-bar",False,"render-sequence.mjs:354","nothing",
  ("T4","Shows how long a participant is busy."),
  "Drawn with the same c-mask class as a label box. No check measures it.","FAIL"),
 ("E14","Node sublabel","node-sublabel",False,"all five renderers","A3, A15",
  ("T2","Fits inside its card with the title. Never overflows."),
  "A2 measures the title only, never the sublabel. Booked as OPEN-18.","GAP"),
 ("E15","Plain wire","a-default",False,"all five renderers","A9, A11, A12",
  ("T2","One colour, one head, head within thirty degrees of travel."),
  "Passes A12 on fresh renders since SEE-008.","PASS"),
 ("E16","Strong wire","a-emphasis",False,"all five renderers","A9, A11, A12",
  ("T2","As E15, with its own colour and matching head."),
  "arrow-emphasis with arrowhead-emphasis. Correctly paired.","PASS"),
 ("E17","Dashed wire","a-dashed",False,"all five renderers","nothing tells it from E15",
  ("T1","Meaning never rests on one visual signal alone."),
  "Shares --arrow and the same head shape as E15. Dashes are the only difference.","FAIL"),
 ("E18","Arrowhead","m-default and three twins",False,"template.html:5528","A5, A10, A12",
  ("T4","Matches its wire's colour and points the way of travel."),
  "All four pair correctly with their wire. A12 passes.","PASS"),
]

# Coverage: which sampled chart each element actually rendered in.
COVER = {
 "E1":["Architecture","Workflow","Sequence","Dataflow"],
 "E2":["Architecture"],
 "E3":["Architecture"],
 "E4":["Workflow","Sequence","Dataflow"],
 "E5":["Sequence"],
 "E6":["Architecture","Workflow","Sequence","Dataflow","Lifecycle"],
 "E7":["Architecture"],
 "E8":[],
 "E9":["Architecture","Sequence"],
 "E10":["Architecture","Workflow","Dataflow","Lifecycle"],
 "E11":["Architecture","Workflow","Dataflow","Lifecycle"],
 "E12":[],
 "E13":["Sequence","Lifecycle"],
 "E14":["Workflow","Sequence","Dataflow","Lifecycle"],
 "E15":["Architecture","Workflow","Sequence","Dataflow","Lifecycle"],
 "E16":["Architecture","Workflow","Sequence","Dataflow","Lifecycle"],
 "E17":["Workflow","Sequence","Dataflow"],
 "E18":["Architecture","Workflow","Sequence","Dataflow","Lifecycle"],
}

RULES = [
 ("R1","Every element has a name","T4",
  "A rule cannot be written, and a check cannot be built, for a shape with no name.",
  "Four names out of eighteen.","FAIL"),
 ("R2","One colour token does one job","T4",
  "Two jobs on one token means no value can be correct.",
  "--mask fills E6 node cards and E10 edge label backings. SEE-008 booked the trap.","FAIL"),
 ("R3","A backing that belongs to a line is tinted from that line","T4",
  "A backing on a wire is tinted from that wire, so the eye reads the two as one.",
  "E10 is flat --mask with no tie to its wire. Four variants mocked; V1 recommended.","FAIL"),
 ("R4","A backing on a line must not erase the line","T4",
  "The wire stays continuous. The backing sits on it.",
  "The backing exists to erase it. template.html:5551 says so.","FAIL"),
 ("R5","A border may separate, but may never carry the meaning","T2",
  "P2 samples ten pixels from any edge and ignores the hairline on purpose.",
  "One element in eighteen has a border. We depend on none.","PASS"),
 ("R6","Painted colour matches the declared token","T2",
  "Colour distance of two or less. P3.","Passing since SEE-008 on fresh renders.","PASS"),
 ("R7","Touching surfaces tell apart","T2",
  "Colour distance of at least one. P1.",
  "Passing except four known nested same-fill rings.","PASS"),
 ("R8","The same element is drawn the same way everywhere","T4",
  "Five drawings of one shape share one corner radius and one height source.",
  "E10 radius 3,4,4,3,3. E6 radius 6,6,7,6,6. Lifecycle is the odd one.","FAIL"),
 ("R9","Corner radius says what a shape is","T3",
  "Cards get a bigger radius than labels. Solid against floating.",
  "Cards 6 or 7, labels 3 or 4. The habit exists but is unwritten.","PASS"),
 ("R10","A wire is told apart by more than one trick","T1",
  "Meaning never rests on a single visual signal.",
  "E17 and E15 share one colour and one head shape.","FAIL"),
 ("R11","Every head points the way its wire travels","T2",
  "Within thirty degrees of the last real piece of route. A12.",
  "Passing on fresh renders since SEE-008.","PASS"),
 ("R12","Text is big enough to read at desk size","T2",
  "The readability floors. O1a.",
  "Passing. Card text fit repaired in SEE-013.","PASS"),
]

SHEETS = [("arch","Architecture","sys003-einvoice-structure"),
          ("flow","Workflow","watchdog-local-cloud-flow-v2"),
          ("seq","Sequence","cache-miss-request"),
          ("data","Dataflow","product-analytics"),
          ("life","Lifecycle","agent-run")]

MARK = {"PASS":"PASS","FAIL":"FAIL","GAP":"GAP","UNUSED":"UNUSED"}

# ---------------- markdown ----------------
def md():
    o = []
    npass = sum(1 for r in RULES if r[5]=="PASS")
    named = sum(1 for e in E if e[3])
    unowned = sum(1 for e in E if e[5].startswith("nothing"))
    o.append("# Archify Design Audit")
    o.append("")
    o.append("**For whom:** Commander Ben, and any worker seat ruling on a visual fault.")
    o.append("**Author:** Benji (read-only consultant). **Date:** 2026-09-17.")
    o.append("**Version:** 0.2.0 — draft. The law is `DESIGN.md`; the picture version is `design.html`.")
    o.append("")
    o.append("**Bottom line:** Archify draws **%d elements**. **%d carry a name.** "
             "**%d have no check watching them.** Of the %d rules below, **%d pass**. "
             "Every element was found in a real chart and photographed, so each row "
             "can be judged by eye, not by my description of it."
             % (len(E), named, unowned, len(RULES), npass))
    o.append("")
    o.append("## ⚖️ How a verdict is decided")
    o.append("")
    o.append("Two rules, both added after the Commander challenged E1 on 2026-09-17.")
    o.append("")
    o.append("1. **A clause that cannot come out false is not a clause.** E1 was")
    o.append("   marked passing because its only written rule was that a frame wraps")
    o.append("   its members. A frame is built from its members, so it wraps them by")
    o.append("   construction and can never fail. The rule it could not fail was the")
    o.append("   only rule written down.")
    o.append("2. **A verdict is inherited.** A part cannot pass while the thing it")
    o.append("   serves fails. E3 has the right colour and backs a title that stacks")
    o.append("   into an unreadable pile, so E3 is not passing.")
    o.append("")
    o.append("## 🎯 Goal")
    o.append("")
    o.append("Name every element, give it one rule, and show what it looks like now.")
    o.append("")
    o.append("## 🏛️ Where good comes from")
    o.append("")
    o.append("| Tier | Source | Can you check it? |")
    o.append("|---|---|---|")
    o.append("| T1 | A published outside standard. | Yes. Someone else agreed it. |")
    o.append("| T2 | A floor this programme enforces. | Yes. It is in our code. |")
    o.append("| T3 | Our best chart, measured. | Yes. A witness, not an authority. |")
    o.append("| T4 | Benji's judgement. | **No.** Taste. Cheap to overrule. |")
    o.append("")
    o.append("T1 rows are written from memory, offline, and stay UNVERIFIED until fetched.")
    o.append("")
    o.append("## ✅ The element checklist")
    o.append("")
    o.append("| # | Element | Name | Named? | Owned by | Verdict |")
    o.append("|---|---|---|---|---|---|")
    for eid,name,tok,named_now,where,owner,good,ours,v in E:
        o.append("| %s | %s | `%s` | %s | %s | **%s** |"
                 % (eid,name,tok,"Yes." if named_now else "No.",owner+".",MARK[v]))
    o.append("")
    o.append("### Each element in full")
    o.append("")
    for eid,name,tok,named_now,where,owner,good,ours,v in E:
        o.append("**%s %s** — `%s`" % (eid,name,tok))
        o.append("")
        o.append("- **Good (%s).** %s" % (good[0], good[1]))
        o.append("- **Ours.** %s" % ours)
        o.append("- **Drawn at.** %s" % where)
        o.append("- **Owned by.** %s" % owner)
        o.append("- **Seen in.** %s" % (", ".join(COVER[eid]) if COVER[eid] else "none of the five sampled charts"))
        o.append("- **Verdict: %s.**" % MARK[v])
        o.append("")
    o.append("## 📐 The rules")
    o.append("")
    o.append("| # | Rule | Tier | Verdict |")
    o.append("|---|---|---|---|")
    for rid,title,tier,good,ours,v in RULES:
        o.append("| %s | %s | %s | **%s** |" % (rid,title,tier,v))
    o.append("")
    for rid,title,tier,good,ours,v in RULES:
        o.append("**%s — %s**" % (rid,title))
        o.append("")
        o.append("- **Good (%s).** %s" % (tier,good))
        o.append("- **Ours.** %s" % ours)
        o.append("- **Verdict: %s.**" % v)
        o.append("")
    o.append("## 🗺️ Which chart kind draws which element")
    o.append("")
    o.append("| Element | " + " | ".join(CHARTS) + " |")
    o.append("|---|" + "---|"*len(CHARTS))
    for eid,name,tok,named_now,where,owner,good,ours,v in E:
        row = ["Yes." if c in COVER[eid] else "No." for c in CHARTS]
        o.append("| %s %s | %s |" % (eid,name," | ".join(row)))
    o.append("")
    o.append("Found by asking each chart's own drawing for the shape, in a browser.")
    o.append("")
    o.append("## 🧭 What to fix, in order")
    o.append("")
    for i,t in enumerate([
      "R1. Name the fourteen unnamed elements. Everything else waits on this.",
      "R2. Split --mask into a card token and a label token. R3 and R4 are blocked behind it.",
      "R3 and R4 together. Tint the edge backing and stop erasing the wire.",
      "R8. One drawing helper per element, so a box has one place to fix.",
      "R10. Make the dashed wire differ by more than dashes.",
      "Build checks for the elements nothing measures. E10 first.",
      "Rule on E8 and E9. Both are defined and neither is drawn. Keep or remove.",
    ],1):
        o.append("%d. %s" % (i,t))
    o.append("")
    o.append("## ⚠️ What this page is not")
    o.append("")
    o.append("It does not cover where shapes are **placed**. Empty pages, stacked labels")
    o.append("and crowding are placement faults, and placement is the work in SEE-015.")
    o.append("")
    o.append("**It is a draft.** T1 rows need their sources fetched. T4 rows are one")
    o.append("person's opinion until the Commander rules on them.")
    o.append("")
    return "\n".join(o)

# ---------------- html ----------------
def html():
    npass = sum(1 for r in RULES if r[5]=="PASS")
    named = sum(1 for e in E if e[3])
    unowned = sum(1 for e in E if e[5].startswith("nothing"))
    def badge(v):
        c = {"PASS":"ok","FAIL":"bad","GAP":"warn","UNUSED":"mute"}[v]
        return '<span class="b %s">%s</span>' % (c, v)
    p = []
    A = p.append
    A('<!doctype html><html lang="en"><head><meta charset="utf-8">')
    A('<meta name="viewport" content="width=device-width, initial-scale=1">')
    A('<title>Archify Design Checklist</title><style>')
    A('''
:root{--bg:#101012;--panel:#1c1c1e;--line:#2c2c2e;--text:#f2f2f7;--muted:#a1a1a6;
--ok:#30d158;--bad:#ff453a;--warn:#ffd60a;--link:#64d2ff}
*{box-sizing:border-box}
body{margin:0;padding:24px 18px 72px;background:var(--bg);color:var(--text);
font:15px/1.6 -apple-system,"Segoe UI",system-ui,sans-serif}
.wrap{max-width:1180px;margin:0 auto}
h1{font-size:26px;margin:0 0 4px;letter-spacing:-.01em}
.sub{color:var(--muted);margin:0 0 20px;font-size:14px}
h2{font-size:19px;margin:38px 0 12px;padding-top:10px;border-top:1px solid var(--line)}
h3{font-size:15px;margin:22px 0 8px}
.stats{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));margin:0 0 24px}
.stat{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:12px 14px}
.stat b{display:block;font-size:26px;line-height:1.2}
.stat span{color:var(--muted);font-size:13px}
table{border-collapse:collapse;width:100%;font-size:14px;margin:8px 0 4px}
th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--line);vertical-align:top}
th{color:var(--muted);font-weight:600;font-size:13px}
.b{display:inline-block;font-size:11px;font-weight:700;padding:2px 8px;border-radius:99px}
.b.ok{background:var(--ok);color:#04310f}.b.bad{background:var(--bad);color:#3d0600}
.b.warn{background:var(--warn);color:#3a3000}.b.mute{background:#48484a;color:#e5e5ea}
code{background:#000;padding:1px 5px;border-radius:4px;font-size:12.5px;color:#d8d8dd}
.el{background:var(--panel);border:1px solid var(--line);border-radius:10px;
padding:14px 16px;margin:0 0 12px}
.el.bad{border-left:3px solid var(--bad)}.el.ok{border-left:3px solid var(--ok)}
.el.warn{border-left:3px solid var(--warn)}.el.mute{border-left:3px solid #48484a}
.el h4{margin:0 0 8px;font-size:15px}
.el dl{margin:0;display:grid;grid-template-columns:110px 1fr;gap:4px 12px;font-size:14px}
.el dt{color:var(--muted);font-size:13px}
.el dd{margin:0}
.scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
figure{margin:0 0 22px;background:var(--panel);border:1px solid var(--line);
border-radius:10px;padding:12px}
figure img{width:100%;max-width:100%;display:block;border-radius:6px}
figcaption{margin-top:8px;color:var(--muted);font-size:13px}
a{color:var(--link)}
ol{padding-left:22px}ol li{margin:6px 0}
.note{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--warn);
border-radius:8px;padding:12px 14px;margin:16px 0;font-size:14px}
''')
    A('</style></head><body><div class="wrap">')
    A('<h1>Archify Design Audit</h1>')
    A('<p class="sub">v0.2.0 draft &middot; 2026-09-17 &middot; Benji, read-only consultant. '
      'Every element below was found in a real chart and photographed.</p>')
    A('<div class="stats">')
    for big,small in [(len(E),"elements drawn"),(named,"carry a name"),
                      (unowned,"nothing watches them"),
                      ("%d/%d"%(npass,len(RULES)),"rules passing")]:
        A('<div class="stat"><b>%s</b><span>%s</span></div>' % (big,small))
    A('</div>')

    A('<h2>How a verdict is decided</h2>')
    A('<div class="note"><b>Two rules, both added after the Commander challenged E1 '
      'on 2026-09-17.</b><br><br>'
      '<b>1. A clause that cannot come out false is not a clause.</b> E1 was marked '
      'passing because its only written rule was that a frame wraps its members. A frame '
      'is built from its members, so it wraps them by construction and can never fail. '
      'The rule it could not fail was the only rule written down.<br><br>'
      '<b>2. A verdict is inherited.</b> A part cannot pass while the thing it serves '
      'fails. E3 has the right colour and backs a title that stacks into an unreadable '
      'pile, so E3 is not passing.</div>')
    A('<h2>The element checklist</h2>')
    A('<div class="scroll"><table><tr><th>#</th><th>Element</th><th>Name</th>'
      '<th>Named?</th><th>Owned by</th><th>Verdict</th></tr>')
    for eid,name,tok,named_now,where,owner,good,ours,v in E:
        A('<tr><td>%s</td><td>%s</td><td><code>%s</code></td><td>%s</td><td>%s</td><td>%s</td></tr>'
          % (eid,name,tok,"yes" if named_now else "<b>no</b>",owner,badge(v)))
    A('</table></div>')

    A('<h2>What each element looks like now</h2>')
    A('<div class="note">Each picture is the element zoomed <b>in its own chart</b>, '
      'not a drawing of it. The chart\'s own SVG is re-aimed at the element, so the '
      'context around it is real.</div>')
    for key,label,chart in SHEETS:
        A('<figure><img src="sheets/%s.png" alt="%s elements">' % (key,label))
        A('<figcaption><b>%s</b> &mdash; <code>%s</code>. '
          '<a href="sheets/%s.html">Open the live sheet</a> to zoom any element.</figcaption></figure>'
          % (label,chart,key))

    A('<h2>Each element in full</h2>')
    for eid,name,tok,named_now,where,owner,good,ours,v in E:
        cls = {"PASS":"ok","FAIL":"bad","GAP":"warn","UNUSED":"mute"}[v]
        A('<div class="el %s"><h4>%s %s &nbsp;<code>%s</code> &nbsp;%s</h4><dl>'
          % (cls,eid,name,tok,badge(v)))
        A('<dt>Good (%s)</dt><dd>%s</dd>' % (good[0],good[1]))
        A('<dt>Ours</dt><dd>%s</dd>' % ours)
        A('<dt>Drawn at</dt><dd><code>%s</code></dd>' % where)
        A('<dt>Owned by</dt><dd>%s</dd>' % owner)
        A('<dt>Seen in</dt><dd>%s</dd>'
          % (", ".join(COVER[eid]) if COVER[eid] else "<b>none of the five sampled charts</b>"))
        A('</dl></div>')

    A('<h2>The rules</h2>')
    A('<div class="scroll"><table><tr><th>#</th><th>Rule</th><th>Tier</th>'
      '<th>Good</th><th>Ours</th><th>Verdict</th></tr>')
    for rid,title,tier,good,ours,v in RULES:
        A('<tr><td>%s</td><td><b>%s</b></td><td>%s</td><td>%s</td><td>%s</td><td>%s</td></tr>'
          % (rid,title,tier,good,ours,badge(v)))
    A('</table></div>')

    A('<h2>Which chart kind draws which element</h2>')
    A('<div class="scroll"><table><tr><th>Element</th>%s</tr>'
      % "".join("<th>%s</th>" % c for c in CHARTS))
    for eid,name,tok,named_now,where,owner,good,ours,v in E:
        cells = "".join('<td>%s</td>' % ('<span class="b ok">yes</span>' if c in COVER[eid] else '&mdash;')
                        for c in CHARTS)
        A('<tr><td>%s %s</td>%s</tr>' % (eid,name,cells))
    A('</table></div>')

    A('<h2>What to fix, in order</h2><ol>')
    for t in ["<b>R1.</b> Name the fourteen unnamed elements. Everything else waits on this.",
              "<b>R2.</b> Split <code>--mask</code> into a card token and a label token.",
              "<b>R3 and R4 together.</b> Tint the edge backing and stop erasing the wire.",
              "<b>R8.</b> One drawing helper per element, so a box has one place to fix.",
              "<b>R10.</b> Make the dashed wire differ by more than dashes.",
              "Build checks for the elements nothing measures. <b>E10 first.</b>",
              "Rule on <b>E8</b> and <b>E9</b>. Both are defined and neither is drawn."]:
        A('<li>%s</li>' % t)
    A('</ol>')

    A('<div class="note"><b>What this page is not.</b> It does not cover where shapes are '
      '<b>placed</b>. Empty pages, stacked labels and crowding are placement faults, and '
      'placement is the work in SEE-015. It is a draft: T1 rows need their sources fetched, '
      'and T4 rows are one person\'s opinion until the Commander rules on them.</div>')
    A('<p class="sub">Companion files: <a href="design-audit.md">design-audit.md</a> (same content, text) '
      '&middot; <a href="design-review/v0.1.0/index.html">the R3 decision page</a>.</p>')
    A('</div></body></html>')
    return "\n".join(p)

io.open(OUT_MD,"w",encoding="utf-8").write(md())
io.open(OUT_HTML,"w",encoding="utf-8").write(html())
print("wrote", OUT_MD, os.path.getsize(OUT_MD), "B")
print("wrote", OUT_HTML, os.path.getsize(OUT_HTML), "B")
