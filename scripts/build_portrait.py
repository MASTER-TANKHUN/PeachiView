"""Build the hero 'drawing' assets from a cut-out character image.
Outputs: <out>/lines.webp (ink lines w/ alpha), <out>/color.webp, <out>/strokes.json
Usage: python build_portrait.py <cutout.png> <out_dir> [height]
"""
import sys, os, json, math
import numpy as np, cv2
from PIL import Image
from skimage.morphology import skeletonize

src, out_dir = sys.argv[1], sys.argv[2]
H = int(sys.argv[3]) if len(sys.argv) > 3 else 1400
os.makedirs(out_dir, exist_ok=True)
im = Image.open(src).convert('RGBA')
im = im.crop(im.getbbox())
s = H / im.height
im = im.resize((round(im.width * s), H), Image.LANCZOS)
W = im.width
arr = np.array(im).astype(np.float32)
alpha = arr[:, :, 3] / 255.0
rgb = (arr[:, :, :3] * alpha[..., None] + 255 * (1 - alpha[..., None])).astype(np.uint8)
gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255.0
k = H / 1000.0

def xdog(img, sigma, kk=1.6, tau=0.99, eps=-0.005, phi=150):
    g1 = cv2.GaussianBlur(img, (0, 0), sigma)
    g2 = cv2.GaussianBlur(img, (0, 0), sigma * kk)
    d = g1 - tau * g2
    return np.where(d >= eps, 1.0, 1.0 + np.tanh(phi * (d - eps)))

e = xdog(gray, 1.0 * k)
ink = np.clip(1.0 - e, 0, 1)
mask = (alpha > 0.5).astype(np.uint8)
cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
outline = np.zeros(mask.shape, np.float32)
cv2.drawContours(outline, cnts, -1, 1.0, max(2, round(2.2 * k)), lineType=cv2.LINE_AA)
ink = np.maximum(ink, outline)
ink *= (cv2.dilate(mask, np.ones((5, 5), np.uint8)) > 0)
# ink colour: deep berry-brown
lines = np.zeros((H, W, 4), np.uint8)
lines[..., 0], lines[..., 1], lines[..., 2] = 0x4A, 0x1F, 0x2E
lines[..., 3] = (ink * 255).astype(np.uint8)
Image.fromarray(lines).save(os.path.join(out_dir, 'lines.webp'), quality=88, method=6)
im.save(os.path.join(out_dir, 'color.webp'), quality=90, method=6)
Image.fromarray(lines).save(os.path.join(out_dir, 'lines_preview.png'))

# --- skeleton → polylines (drawing order for the reveal) ---
binary = ink > 0.45
binary = cv2.morphologyEx(binary.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8)) > 0
sk = skeletonize(binary)
ys, xs = np.nonzero(sk)
pix = set(zip(ys.tolist(), xs.tolist()))
N8 = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]
def nb(p):
    y, x = p
    return [(y + dy, x + dx) for dy, dx in N8 if (y + dy, x + dx) in pix]
deg = {p: len(nb(p)) for p in pix}
seen = set()
key = lambda a, b: (a, b) if a < b else (b, a)
chains = []
def walk(a, b):
    ch = [a, b]; seen.add(key(a, b)); prev, cur = a, b
    while deg[cur] == 2:
        c = [n for n in nb(cur) if n != prev and key(cur, n) not in seen]
        if not c: break
        seen.add(key(cur, c[0])); ch.append(c[0]); prev, cur = cur, c[0]
    return ch
for p in [p for p in pix if deg[p] != 2]:
    for n in nb(p):
        if key(p, n) not in seen: chains.append(walk(p, n))
for p in pix:
    for n in nb(p):
        if key(p, n) not in seen: chains.append(walk(p, n))

def rdp(pts, eps):
    if len(pts) < 3: return pts
    a, b = np.array(pts[0], float), np.array(pts[-1], float)
    P = np.array(pts, float); ab = b - a; L = math.hypot(*ab)
    d = np.hypot(*(P - a).T) if L == 0 else np.abs(ab[0] * (P[:, 1] - a[1]) - ab[1] * (P[:, 0] - a[0])) / L
    i = int(np.argmax(d))
    return rdp(pts[:i + 1], eps)[:-1] + rdp(pts[i:], eps) if d[i] > eps else [pts[0], pts[-1]]

res = []
for c in chains:
    pts = [(x, y) for y, x in c]
    L = sum(math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) for i in range(len(pts) - 1))
    if L < 3 * k: continue
    sp = rdp(pts, 0.9 * k)
    cx = sum(p[0] for p in pts) / len(pts); cy = sum(p[1] for p in pts) / len(pts)
    res.append((sp, L, cx, cy))

# order: face first (eyes ~ 52%,30%), spiralling outward; slight jitter so it feels hand-made
fx, fy = W * 0.5, H * 0.33
rng = np.random.default_rng(7)
def order(r):
    sp, L, cx, cy = r
    return math.hypot(cx - fx, (cy - fy) * 1.15) + rng.uniform(-40, 40) * k
res.sort(key=order)
# encode: [[x0,y0,dx1,dy1,...], ...] integers at 1/2px precision (×2)
enc = []
for sp, L, cx, cy in res:
    flat = []; px = py = 0
    for i, (x, y) in enumerate(sp):
        X, Y = round(x * 2), round(y * 2)
        flat += [X - px, Y - py] if i else [X, Y]
        px, py = X, Y
    enc.append(flat)
json.dump({'w': W, 'h': H, 'scale': 0.5, 'paths': enc}, open(os.path.join(out_dir, 'strokes.json'), 'w'), separators=(',', ':'))
print('size', W, H, 'chains', len(chains), 'paths', len(enc),
      'json bytes', os.path.getsize(os.path.join(out_dir, 'strokes.json')),
      'lines.webp', os.path.getsize(os.path.join(out_dir, 'lines.webp')),
      'color.webp', os.path.getsize(os.path.join(out_dir, 'color.webp')))
