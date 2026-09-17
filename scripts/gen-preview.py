#!/usr/bin/env python
# gen-preview.py — render DESIGN.md as a visual catalog, per the awesome-design-md
# convention: preview.html (light) and preview-dark.html (dark).
# Values come from system-tokens.mjs v1.2.0 and template.html. Run from tools/archify.

import io

THEMES = {
 "preview.html": ("light", {
    "page":"#f2f2f7", "frame":"#f5f5f7", "card":"#ffffff",
    "text":"#1c1c1e", "muted":"#3a3a3c", "dim":"#636366",
    "line":"#d1d1d6", "label":"#6e6e73",
 }),
 "preview-dark.html": ("dark", {
    "page":"#000000", "frame":"#2c2c2e", "card":"#1c1c1e",
    "text":"#f2f2f7", "muted":"#aeaeb2", "dim":"#636366",
    "line":"#2c2c2e", "label":"#a1a1a6",
 }),
}

SURFACES = [
 ("Page",  "--bg",           "#000000", "#f2f2f7", "Behind everything."),
 ("Frame", "--region-fill",  "#2c2c2e", "#f5f5f7", "A group of cards."),
 ("Card",  "--mask",         "#1c1c1e", "#ffffff", "A single thing."),
]
WIRES = [
 ("Plain flow",   "--arrow",           "#8e8e93", "1.5px"),
 ("Main flow",    "--arrow-emphasis",  "#0a84ff", "1.8px"),
 ("Guarded flow", "--security-stroke", "#ff453a", "1.5px"),
]
KINDS = [("Frontend","#0a84ff"),("Backend","#30d158"),("Database","#bf5af2"),
         ("Cloud","#ffd60a"),("Security","#ff453a"),("Message bus","#ff9f0a"),
         ("External","#8e8e93")]
TYPE = [("primary","Node title","15px","7.0 : 1"),
        ("boundary","Frame title","13px","4.5 : 1"),
        ("context","Node sublabel","11px","4.5 : 1"),
        ("edge","Wire label","11px","4.5 : 1")]
SPACE = [("Card","260 x 60"),("Empty gutter","40"),("Corridor","16"),
         ("Through-route","56"),("Frame padding","18"),("Title above members","34"),
         ("Title below frame top","14"),("Wire to frame","16"),
         ("Head tip to card","8"),("Label clearance","24")]
DOS = ["Grow a card to fit its words.",
       "Give every backing the colour of what it belongs to.",
       "Keep one job per token.",
       "Draw one element with one helper.",
       "Let a frame ask for its room first."]
DONTS = ["Shrink type to make words fit.",
         "Erase a wire to seat its own label.",
         "Use one token for two kinds of shape.",
         "Let meaning rest on a single signal.",
         "Hand-place cards to make a chart look right."]

def page(theme, c):
    dark = theme == "dark"
    si = 2 if dark else 3   # index into SURFACES for this theme's hex
    p, A = [], None
    o = []
    A = o.append
    A('<!doctype html><html lang="en"><head><meta charset="utf-8">')
    A('<meta name="viewport" content="width=device-width, initial-scale=1">')
    A('<title>Archify Design Preview &mdash; %s</title><style>' % theme)
    A('''
*{box-sizing:border-box}
body{margin:0;padding:26px 18px 70px;background:%(page)s;color:%(text)s;
font:15px/1.6 -apple-system,"Segoe UI",system-ui,sans-serif}
.wrap{max-width:1080px;margin:0 auto}
h1{font-size:25px;margin:0 0 4px;letter-spacing:-.01em}
.sub{color:%(label)s;margin:0 0 26px;font-size:14px}
h2{font-size:18px;margin:36px 0 14px;padding-top:12px;border-top:1px solid %(line)s}
.row{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}
.tile{background:%(card)s;border:1px solid %(line)s;border-radius:10px;padding:0;overflow:hidden}
.chip{height:76px}
.tile .meta{padding:10px 12px}
.tile b{display:block;font-size:14px}
.tile code{font-size:11.5px;color:%(label)s;display:block;margin-top:2px;word-break:break-all}
.tile span{display:block;font-size:12.5px;color:%(muted)s;margin-top:4px}
.stack{background:%(frame)s;border:1px solid %(line)s;border-radius:12px;padding:20px}
.stack .inner{background:%(card)s;border-radius:8px;padding:16px;margin-top:10px}
.stack em{font-style:normal;color:%(label)s;font-size:12.5px}
table{border-collapse:collapse;width:100%%;font-size:14px}
th,td{text-align:left;padding:9px 10px;border-bottom:1px solid %(line)s}
th{color:%(label)s;font-weight:600;font-size:13px}
.wire{display:flex;align-items:center;gap:12px;padding:10px 0}
.wire .ln{flex:1;height:0;border-top-style:solid}
.pill{display:inline-block;padding:2px 9px;border-radius:99px;font-size:11px;
border:1px solid;background:transparent}
.two{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(300px,1fr))}
.card-box{background:%(card)s;border:1px solid %(line)s;border-radius:10px;padding:14px}
.card-box h3{margin:0 0 8px;font-size:14px}
.card-box ul{margin:0;padding-left:18px;font-size:14px}
.card-box li{margin:5px 0}
.do h3{color:#30d158}.dont h3{color:#ff453a}
.swatchbar{display:flex;height:34px;border-radius:8px;overflow:hidden;border:1px solid %(line)s}
.swatchbar div{flex:1}
a{color:#0a84ff}
''' % c)
    A('</style></head><body><div class="wrap">')
    A('<h1>Archify Design Preview</h1>')
    A('<p class="sub">%s theme &middot; generated from <code>DESIGN.md</code> v0.1.0 and '
      '<code>system-tokens.mjs</code> v1.2.0. Companion: '
      '<a href="%s">the %s preview</a>.</p>'
      % (theme.capitalize(),
         "preview-dark.html" if theme=="light" else "preview.html",
         "dark" if theme=="light" else "light"))

    A('<h2>Surfaces &mdash; three tiers</h2>')
    A('<div class="stack"><em>Page</em><div class="stack" style="margin-top:10px">'
      '<em>Frame</em><div class="inner"><b>Card</b><br><span style="color:%s;font-size:13px">'
      'Depth is lightness. There are no shadows.</span></div></div></div>' % c["muted"])
    A('<div class="row" style="margin-top:14px">')
    for name, tok, hd, hl, why in SURFACES:
        hexv = hd if dark else hl
        A('<div class="tile"><div class="chip" style="background:%s"></div>'
          '<div class="meta"><b>%s</b><code>%s &nbsp;%s</code><span>%s</span></div></div>'
          % (hexv, name, tok, hexv, why))
    A('</div>')

    A('<h2>Wires</h2>')
    for name, tok, hexv, w in WIRES:
        A('<div class="wire"><span style="width:120px;font-size:13px">%s</span>'
          '<span class="ln" style="border-top-color:%s;border-top-width:%s"></span>'
          '<code style="font-size:11.5px;color:%s">%s %s</code></div>'
          % (name, hexv, w, c["label"], tok, hexv))
    A('<p class="sub" style="margin:6px 0 0">A dashed wire must differ from a plain wire '
      'by more than its dashes.</p>')

    A('<h2>Node kinds</h2><div class="row">')
    for name, hexv in KINDS:
        A('<div class="tile"><div class="chip" style="background:%s;opacity:.92"></div>'
          '<div class="meta"><b>%s</b><code>%s</code></div></div>' % (hexv, name, hexv))
    A('</div>')

    A('<h2>Type scale</h2><table><tr><th>Role</th><th>Used for</th><th>Floor</th>'
      '<th>Contrast</th><th>Sample</th></tr>')
    for role, use, size, contrast in TYPE:
        A('<tr><td><code>%s</code></td><td>%s</td><td>%s</td><td>%s</td>'
          '<td style="font-size:%s">Submit e-invoice</td></tr>'
          % (role, use, size, contrast, size))
    A('</table><p class="sub" style="margin:8px 0 0">Floors, not targets. Never shrink '
      'type to fit &mdash; grow the card.</p>')

    A('<h2>Label backings</h2><div class="two">')
    A('<div class="card-box"><h3>Today</h3>'
      '<span class="pill" style="border-color:transparent;background:%s;color:%s">'
      'mismatch retry cap 2</span>'
      '<p class="sub" style="margin:10px 0 0">Flat, no border, no tie to its wire.</p></div>'
      % (SURFACES[2][2] if dark else SURFACES[2][3], c["muted"]))
    A('<div class="card-box"><h3>The rule</h3>'
      '<span class="pill" style="border-color:#ff453a;color:%s;background:%s">'
      'mismatch retry cap 2</span>'
      '<p class="sub" style="margin:10px 0 0">Tinted from its wire, bordered in that '
      'wire\'s colour.</p></div>'
      % (c["text"], "rgba(255,69,58,0.22)"))
    A('</div>')

    A('<h2>Spacing and size</h2><table><tr><th>Value</th><th>Size</th></tr>')
    for name, val in SPACE:
        A('<tr><td>%s</td><td><code>%s</code></td></tr>' % (name, val))
    A('</table>')

    A('<h2>Corner radius</h2><div class="row">')
    for label, r, w, h in [("Card &mdash; 6", 6, 180, 54), ("Label &mdash; 3", 3, 180, 26)]:
        A('<div class="tile" style="border:none;background:transparent"><div style="padding:10px 0">'
          '<div style="width:%dpx;height:%dpx;border-radius:%dpx;background:%s;border:1px solid %s"></div>'
          '</div><div class="meta" style="padding:0"><b>%s</b>'
          '<span>Solid against floating.</span></div></div>'
          % (w, h, r, c["card"], c["line"], label))
    A('</div>')

    A('<h2>Do and don\'t</h2><div class="two">')
    A('<div class="card-box do"><h3>Do</h3><ul>%s</ul></div>'
      % "".join("<li>%s</li>" % d for d in DOS))
    A('<div class="card-box dont"><h3>Don\'t</h3><ul>%s</ul></div>'
      % "".join("<li>%s</li>" % d for d in DONTS))
    A('</div>')

    A('<h2>Full palette</h2><div class="swatchbar">')
    for _, _, hd, hl, _ in SURFACES:
        A('<div style="background:%s"></div>' % (hd if dark else hl))
    for _, _, hexv, _ in WIRES:
        A('<div style="background:%s"></div>' % hexv)
    for _, hexv in KINDS:
        A('<div style="background:%s"></div>' % hexv)
    A('</div>')

    A('<p class="sub" style="margin-top:30px">The law: <a href="../DESIGN.md">DESIGN.md</a>'
      ' &middot; how far we are from it: <a href="design.html">design.html</a>.</p>')
    A('</div></body></html>')
    return "\n".join(o)

for fname, (theme, colours) in THEMES.items():
    path = "docs/" + fname
    io.open(path, "w", encoding="utf-8").write(page(theme, colours))
    print("wrote", path)
