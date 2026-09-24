"""
Cute PeachiView-style QR code for the fan site.

    pip install segno
    python scripts/make_qr.py [url] [out.svg]

Writes a self-contained SVG (fonts embedded) to public/qr/peachiview-qr.svg by default.
Design: a PeachiOS window with cat ears, rounded gradient dots, rounded finder "eyes",
the peach mascot (with Peachi's cat-ear headphones) in the middle, pixel hearts & sparkles.
Error correction is H (30%) so the mascot in the centre never breaks scanning.
"""
from __future__ import annotations

import base64
import sys
from pathlib import Path

import segno

ROOT = Path(__file__).resolve().parent.parent
URL = sys.argv[1] if len(sys.argv) > 1 else 'https://peachi-view-fanart-website.vercel.app/'
OUT = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / 'public' / 'qr' / 'peachiview-qr.svg'
FONTS = ROOT / 'node_modules' / '@fontsource'

W, H = 1000, 1360


def font_face(family: str, weight: int, file: Path, unicode_range: str = '') -> str:
    data = base64.b64encode(file.read_bytes()).decode()
    ur = f'unicode-range:{unicode_range};' if unicode_range else ''
    return f"@font-face{{font-family:'{family}';font-weight:{weight};src:url(data:font/woff2;base64,{data}) format('woff2');{ur}}}"


def pixel_heart(x: float, y: float, px: float, rot: float = 0) -> str:
    rows = ['.XX...XX.', 'XWWX.XWWX', 'XWWWXWWWX', 'XWWWWWWWX', '.XWWWWWX.', '..XWWWX..', '...XWX...', '....X....']
    rects = []
    for r, row in enumerate(rows):
        for c, ch in enumerate(row):
            if ch != '.':
                fill = '#f569c0' if ch == 'X' else '#ffffff'
                rects.append(f'<rect x="{c}" y="{r}" width="1.04" height="1.04" fill="{fill}"/>')
    return (f'<g transform="translate({x} {y}) rotate({rot}) scale({px}) translate(-4.5 -4)" shape-rendering="crispEdges" '
            f'filter="url(#soft)">{"".join(rects)}</g>')


def sparkle(x: float, y: float, s: float, fill: str = '#ffffff', opacity: float = 1) -> str:
    return (f'<path transform="translate({x} {y}) scale({s})" opacity="{opacity}" fill="{fill}" '
            'd="M0-10C1.2-3.5 3.5-1.2 10 0 3.5 1.2 1.2 3.5 0 10-1.2 3.5-3.5 1.2-10 0-3.5-1.2-1.2-3.5 0-10Z"/>')


def tiny_heart(x: float, y: float, s: float, fill: str) -> str:
    return (f'<path transform="translate({x} {y}) scale({s})" fill="{fill}" '
            'd="M0 3.5C-11-3.5-4.5-11.5 0-4.5 4.5-11.5 11-3.5 0 3.5Z"/>')


# the peach mascot (same drawing as src/components/svg/PeachMascot.astro), as a reusable symbol
BODY = 'M100 54C86 36 57 31 38 46 18 62 14 97 23 128c10 36 42 58 77 58s67-22 77-58c9-31 5-66-15-82-19-15-48-10-62 8Z'
PEACH = f'''
<symbol id="peach" viewBox="0 -4 200 204" overflow="visible">
  <ellipse cx="100" cy="194" rx="56" ry="6.5" fill="#4a1f2e" opacity=".14"/>
  <path d="{BODY}" fill="url(#p-body)"/>
  <path d="{BODY}" fill="url(#p-rim)"/>
  <path d="{BODY}" fill="none" stroke="#e65a8d" stroke-width="3.4" stroke-linejoin="round"/>
  <path d="M100 57c-8 20-8 42 4 64" fill="none" stroke="#ea6c96" stroke-width="3.2" stroke-linecap="round" opacity=".45"/>
  <ellipse cx="58" cy="80" rx="16" ry="9.5" transform="rotate(-34 58 80)" fill="#fff" opacity=".75"/>
  <path d="M100 54c0-5 1-10 3-14" fill="none" stroke="#8a5a3c" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M99 51C88 31 64 20 41 25c6 20 31 32 58 26Z" fill="url(#p-leaf)" stroke="#358a4c" stroke-width="3" stroke-linejoin="round"/>
  <path d="M102 50c7-24 32-39 58-34-6 23-31 38-58 34Z" fill="url(#p-leaf)" stroke="#358a4c" stroke-width="3" stroke-linejoin="round"/>
  <path d="M26 120C24 52 176 52 174 120" fill="none" stroke="#fff" stroke-width="15" stroke-linecap="round"/>
  <path d="M26 120C24 52 176 52 174 120" fill="none" stroke="#fa93d2" stroke-width="9" stroke-linecap="round"/>
  <path d="M34 84 36 44l30 22Z" fill="#fa93d2" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>
  <path d="M40 72 41 55l12 9Z" fill="#ffd9ec"/>
  <path d="M166 84 164 44l-30 22Z" fill="#fa93d2" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>
  <path d="M160 72 159 55l-12 9Z" fill="#ffd9ec"/>
  <rect x="8" y="98" width="30" height="46" rx="14" fill="url(#p-cup)" stroke="#fff" stroke-width="4"/>
  <rect x="162" y="98" width="30" height="46" rx="14" fill="url(#p-cup)" stroke="#fff" stroke-width="4"/>
  <ellipse cx="73" cy="122" rx="11.5" ry="13.5" fill="url(#p-eye)"/>
  <ellipse cx="127" cy="122" rx="11.5" ry="13.5" fill="url(#p-eye)"/>
  <circle cx="68.5" cy="116" r="5.2" fill="#fff"/><circle cx="122.5" cy="116" r="5.2" fill="#fff"/>
  <circle cx="77.5" cy="126" r="2.2" fill="#fff"/><circle cx="131.5" cy="126" r="2.2" fill="#fff"/>
  <path d="M89 139q5.5 6.5 11 0q5.5 6.5 11 0" fill="none" stroke="#4a2020" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M96 141.5q4 5.5 8 0" fill="#ff6f9c" opacity=".85"/>
  <ellipse cx="50" cy="141" rx="13" ry="7.5" fill="#ff5f98" opacity=".34"/>
  <ellipse cx="150" cy="141" rx="13" ry="7.5" fill="#ff5f98" opacity=".34"/>
  <path d="M44 58l2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" fill="#fff"/>
</symbol>'''


def qr_modules(url: str):
    qr = segno.make(url, error='h', micro=False, boost_error=False)
    matrix = [list(row) for row in qr.matrix]
    return qr, matrix


def build_svg() -> str:
    qr, m = qr_modules(URL)
    n = len(m)                      # modules per side (without quiet zone)
    quiet = 4
    size = 640                      # QR area incl. quiet zone
    mod = size / (n + 2 * quiet)
    win_x, win_y, win_w = 150, 330, 700
    bar_h = 58
    body_y = win_y + bar_h
    qr_x = win_x + (win_w - size) / 2
    qr_y = body_y + (win_w - size) / 2
    win_h = bar_h + win_w

    # finder patterns (7×7 at three corners) are drawn as rounded "eyes"; the centre is cleared for the mascot
    finders = [(0, 0), (n - 7, 0), (0, n - 7)]

    def in_finder(r: int, c: int) -> bool:
        return any(fr <= r < fr + 7 and fc <= c < fc + 7 for fc, fr in finders)

    clear = 11 if n >= 37 else 9
    c0 = (n - clear) // 2

    def in_logo(r: int, c: int) -> bool:
        return c0 <= r < c0 + clear and c0 <= c < c0 + clear

    dots = []
    for r in range(n):
        for c in range(n):
            if m[r][c] and not in_finder(r, c) and not in_logo(r, c):
                cx = qr_x + (quiet + c + 0.5) * mod
                cy = qr_y + (quiet + r + 0.5) * mod
                dots.append(f'<circle cx="{cx:.2f}" cy="{cy:.2f}" r="{mod * 0.47:.2f}"/>')

    eye_colors = ['#d6337c', '#8b3fd1', '#c2185b']
    eyes = []
    for (fc, fr), col in zip(finders, eye_colors):
        x = qr_x + (quiet + fc) * mod
        y = qr_y + (quiet + fr) * mod
        eyes.append(
            f'<rect x="{x + mod * 0.5:.2f}" y="{y + mod * 0.5:.2f}" width="{mod * 6:.2f}" height="{mod * 6:.2f}" rx="{mod * 2.1:.2f}" '
            f'fill="none" stroke="{col}" stroke-width="{mod:.2f}"/>'
            f'<rect x="{x + mod * 2:.2f}" y="{y + mod * 2:.2f}" width="{mod * 3:.2f}" height="{mod * 3:.2f}" rx="{mod * 1.1:.2f}" fill="{col}"/>'
            f'<circle cx="{x + mod * 2.75:.2f}" cy="{y + mod * 2.75:.2f}" r="{mod * 0.34:.2f}" fill="#fff" opacity=".85"/>'
        )

    logo_s = clear * mod
    lx = qr_x + (quiet + c0) * mod
    ly = qr_y + (quiet + c0) * mod

    fonts = ''.join([
        font_face('Pixelify Sans', 700, FONTS / 'pixelify-sans' / 'files' / 'pixelify-sans-latin-700-normal.woff2'),
        font_face('Mali', 700, FONTS / 'mali' / 'files' / 'mali-latin-700-normal.woff2'),
        font_face('Mali', 700, FONTS / 'mali' / 'files' / 'mali-thai-700-normal.woff2', 'U+0E01-0E5B,U+200C-200D,U+25CC'),
    ])

    # win buttons
    bx = win_x + win_w - 30
    btns = []
    for i, sym in enumerate(['M-5-5l10 10M5-5l-10 10', 'M-5-5h10v10h-10Z', 'M-5 0h10']):  # close · max · min, right to left
        cx = bx - i * 44
        btns.append(f'<g transform="translate({cx} {win_y + bar_h / 2})"><rect x="-17" y="-15" width="34" height="30" rx="8" fill="#fff" stroke="#f569c0" stroke-width="3.5"/>'
                    f'<path d="{sym}" fill="none" stroke="#e8479f" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></g>')

    title = 'Peachiview'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<title>PeachiView fan site QR — {URL}</title>
<defs>
  <style>{fonts}</style>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#ffe0f1"/><stop offset=".45" stop-color="#efe0ff"/><stop offset=".75" stop-color="#dcebff"/><stop offset="1" stop-color="#ffe3f2"/>
  </linearGradient>
  <radialGradient id="glow" cx=".5" cy=".42" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="11" cy="11" r="1.6" fill="#f569c0" opacity=".22"/></pattern>
  <pattern id="stripes" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="2" height="14" fill="#fff" opacity=".35"/></pattern>
  <linearGradient id="logo" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff3fa4"/><stop offset=".55" stop-color="#d47bf0"/><stop offset="1" stop-color="#a9b3ff"/></linearGradient>
  <linearGradient id="dotgrad" gradientUnits="userSpaceOnUse" x1="{qr_x}" y1="{qr_y}" x2="{qr_x + size}" y2="{qr_y + size}">
    <stop offset="0" stop-color="#d6337c"/><stop offset=".5" stop-color="#b8338f"/><stop offset="1" stop-color="#7b3fd0"/>
  </linearGradient>
  <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd3ec"/><stop offset="1" stop-color="#fa9fd6"/></linearGradient>
  <radialGradient id="p-body" cx="34%" cy="30%" r="80%"><stop offset="0" stop-color="#fff3df"/><stop offset=".3" stop-color="#ffcfae"/><stop offset=".68" stop-color="#ff9db0"/><stop offset="1" stop-color="#f26b96"/></radialGradient>
  <radialGradient id="p-rim" cx="78%" cy="82%" r="40%"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <linearGradient id="p-leaf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b6f0a6"/><stop offset=".55" stop-color="#6fcf73"/><stop offset="1" stop-color="#3f9e58"/></linearGradient>
  <linearGradient id="p-eye" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2e1414"/><stop offset=".7" stop-color="#5a2a24"/><stop offset="1" stop-color="#8a4636"/></linearGradient>
  <linearGradient id="p-cup" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc2e3"/><stop offset="1" stop-color="#f77fbf"/></linearGradient>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#c92d82" flood-opacity=".28"/></filter>
  <filter id="lift" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#8a1d55" flood-opacity=".28"/></filter>
  {PEACH}
</defs>

<!-- card -->
<rect width="{W}" height="{H}" rx="64" fill="url(#bg)"/>
<rect width="{W}" height="{H}" rx="64" fill="url(#stripes)"/>
<rect width="{W}" height="{H}" rx="64" fill="url(#dots)"/>
<rect width="{W}" height="{H}" rx="64" fill="url(#glow)"/>
<rect x="10" y="10" width="{W - 20}" height="{H - 20}" rx="56" fill="none" stroke="#fff" stroke-width="6" opacity=".9"/>

<!-- logo -->
<g transform="translate({W / 2} 176) skewX(-8)" font-family="'Pixelify Sans', monospace" font-weight="700" font-size="132" text-anchor="middle">
  <text y="10" fill="#f569c0" stroke="#f569c0" stroke-width="30" stroke-linejoin="round">{title}</text>
  <text fill="#fff" stroke="#fff" stroke-width="18" stroke-linejoin="round">{title}</text>
  <text fill="url(#logo)">{title}</text>
</g>
<text x="{W / 2}" y="262" text-anchor="middle" font-family="Mali, sans-serif" font-weight="700" font-size="44" fill="#e8479f">ยินดีต้อนรับกลับมานะ พีชชี่</text>

<!-- a peach peeking out from behind the window -->
<use href="#peach" x="62" y="238" width="134" height="134" transform="rotate(-12 129 305)"/>

<!-- window with cat ears -->
<g filter="url(#lift)">
  <path d="M{win_x + 70} {win_y + 8} L{win_x + 96} {win_y - 52} L{win_x + 150} {win_y + 8} Z" fill="#fa93d2" stroke="#fff" stroke-width="7" stroke-linejoin="round"/>
  <path d="M{win_x + 92} {win_y + 2} L{win_x + 100} {win_y - 26} L{win_x + 124} {win_y + 2} Z" fill="#ffd9ec"/>
  <path d="M{win_x + win_w - 70} {win_y + 8} L{win_x + win_w - 96} {win_y - 52} L{win_x + win_w - 150} {win_y + 8} Z" fill="#fa93d2" stroke="#fff" stroke-width="7" stroke-linejoin="round"/>
  <path d="M{win_x + win_w - 92} {win_y + 2} L{win_x + win_w - 100} {win_y - 26} L{win_x + win_w - 124} {win_y + 2} Z" fill="#ffd9ec"/>
  <rect x="{win_x}" y="{win_y + 10}" width="{win_w}" height="{win_h}" rx="38" fill="#f7bee4"/>
  <rect x="{win_x}" y="{win_y}" width="{win_w}" height="{win_h}" rx="38" fill="#fff" stroke="#fa93d2" stroke-width="7"/>
  <path d="M{win_x + 3.5} {win_y + bar_h} V{win_y + 38} A34.5 34.5 0 0 1 {win_x + 38} {win_y + 3.5} H{win_x + win_w - 38} A34.5 34.5 0 0 1 {win_x + win_w - 3.5} {win_y + 38} V{win_y + bar_h} Z" fill="url(#bar)"/>
  <line x1="{win_x + 3.5}" y1="{win_y + bar_h}" x2="{win_x + win_w - 3.5}" y2="{win_y + bar_h}" stroke="#fa93d2" stroke-width="5"/>
  <g transform="translate({win_x + 44} {win_y + bar_h / 2 + 1})"><use href="#peach" x="-18" y="-19" width="36" height="36"/></g>
  <text x="{win_x + 72}" y="{win_y + bar_h / 2 + 11}" font-family="'Pixelify Sans', monospace" font-weight="700" font-size="30" fill="#4a1f2e" letter-spacing="1">scan_me.exe</text>
  {''.join(btns)}
</g>

<!-- the code -->
<rect x="{qr_x}" y="{qr_y}" width="{size}" height="{size}" fill="#fff"/>
<g fill="url(#dotgrad)">{''.join(dots)}</g>
{''.join(eyes)}
<!-- mascot in the middle -->
<rect x="{lx + mod * 0.4:.2f}" y="{ly + mod * 0.4:.2f}" width="{logo_s - mod * 0.8:.2f}" height="{logo_s - mod * 0.8:.2f}" rx="{mod * 3:.2f}" fill="#fff" stroke="#fce1ef" stroke-width="{mod * 0.5:.2f}"/>
<use href="#peach" x="{lx + mod * 1.1:.2f}" y="{ly + mod * 1.0:.2f}" width="{logo_s - mod * 2.2:.2f}" height="{logo_s - mod * 2.2:.2f}"/>

<!-- washi tape on the window corners -->
<g opacity=".92">
  <rect x="{win_x - 62}" y="{win_y + win_h - 34}" width="124" height="34" rx="3" transform="rotate(-32 {win_x} {win_y + win_h - 17})" fill="#fa93d2" opacity=".78"/>
  <rect x="{win_x + win_w - 62}" y="{win_y + win_h - 34}" width="124" height="34" rx="3" transform="rotate(32 {win_x + win_w} {win_y + win_h - 17})" fill="#c8a7d5" opacity=".8"/>
</g>

<!-- hearts & sparkles -->
<use href="#peach" x="{win_x + win_w - 46}" y="{win_y + win_h - 118}" width="112" height="112" transform="rotate(10 {win_x + win_w + 10} {win_y + win_h - 62})"/>
{pixel_heart(88, 108, 7, -12)}
{pixel_heart(915, 520, 6, 10)}
{pixel_heart(84, 820, 5, -6)}
{pixel_heart(918, 1060, 4.5, 8)}
{sparkle(880, 300, 1.6)}{sparkle(905, 180, 1.1)}{sparkle(60, 560, 1.4, '#fa93d2', .8)}{sparkle(940, 760, 1.5)}{sparkle(84, 1215, 1.2, '#c8a7d5', .9)}{sparkle(905, 1262, 1.3)}

<!-- caption -->
<text x="{W / 2}" y="{win_y + win_h + 88}" text-anchor="middle" font-family="Mali, sans-serif" font-weight="700" font-size="40" fill="#4a1f2e">สแกนเลย! ไปเว็บต้อนรับพีชชี่กลับบ้าน</text>
<g transform="translate({W / 2} {win_y + win_h + 138})">
  <rect x="-330" y="-30" width="660" height="46" rx="23" fill="#fff" stroke="#f7bee4" stroke-width="3"/>
  <text y="3" text-anchor="middle" font-family="'Pixelify Sans', monospace" font-weight="700" font-size="25" fill="#c92d82">peachi-view-fanart-website.vercel.app</text>
</g>
<text x="{W / 2}" y="{H - 44}" text-anchor="middle" font-family="Mali, sans-serif" font-weight="700" font-size="22" fill="#b08a98">fan-made with love by Master Tankhun | Tankhun Gaming</text>
</svg>'''


if __name__ == '__main__':
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(build_svg(), encoding='utf-8')
    qr, _ = qr_modules(URL)
    print(f'wrote {OUT} (QR version {qr.version}, error correction {qr.error}, {len(qr.matrix)} modules)')
