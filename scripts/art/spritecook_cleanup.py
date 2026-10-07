#!/usr/bin/env python3
"""Finish a SpriteCook result so it matches Kamigotchi's pixel-perfect art.

SpriteCook returns images at a guessed size, with thousands of colours, and
gpt-image-2 repaints the whole picture on every edit. This script applies the
steps from spritecook-assets.json -> postprocess:

  1. resize to native size (nearest neighbour)
  2. snap every pixel to a palette (taken from the original image, or a hex list)
  3. optionally make the solid background around a sprite transparent
  4. optionally keep the original everywhere except the edited regions
  5. recolour new pure-black pixels to the game's outline purple

Requires Pillow (pip install pillow).

Examples:
  # snap a raw result to the original's size and colours
  python3 scripts/art/spritecook_cleanup.py raw.png out.png --original playtest-b.png

  # same, but only keep the edit inside two boxes (x0,y0,x1,y1)
  python3 scripts/art/spritecook_cleanup.py raw.png out.png --original playtest-b.png \
      --keep-box 0,0,31,48 --keep-box 36,58,82,108

  # new item with a palette from spritecook-assets.json, background made transparent
  python3 scripts/art/spritecook_cleanup.py raw.png out.png --size 24x24 --palette items --remove-bg

  # carry an edited Evenfall room background over to Daylight (playtest-b -> playtest-a)
  python3 scripts/art/spritecook_cleanup.py playtest-b-edited.png playtest-a-edited.png \
      --phase-from playtest-b.png --phase-to playtest-a.png

  # make an 8x nearest-neighbour copy to upload as an edit source
  python3 scripts/art/spritecook_cleanup.py playtest-b.png upload_x8.png --upscale 8

Fix mode (finished, native-size images; nothing is resized or snapped):
  # in this rock box (kept clear of trees and grass) only the Daylight rock colours are allowed
  python3 scripts/art/spritecook_cleanup.py day.png day.png --original playtest-a.png \\
      --restrict 24,0,67,36=#825b70,#573359,#bd9d9d
  # or allow whatever the original uses in a reference area (careful: it may include moss etc.)
  python3 scripts/art/spritecook_cleanup.py day.png day.png --original playtest-a.png \\
      --restrict 24,0,67,36=original@112,0,128,40
  # remove stray single pixels from the edit, and mark anything suspicious for review
  python3 scripts/art/spritecook_cleanup.py day.png day.png --original playtest-a.png \\
      --despeckle --audit day-audit.png
"""
import argparse
import json
import sys
from collections import Counter, deque
from pathlib import Path

from PIL import Image

OUTLINE = (0x57, 0x33, 0x59)  # #573359, used instead of black for new lines and outlines
BLACK = (0x30, 0x11, 0x1C)    # #30111c, the palette's darkest colour
MANIFEST = Path(__file__).resolve().parents[2] / 'spritecook-assets.json'


def hex_to_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def pixels(img):
    # Pillow 12 renamed getdata(); support both
    return (getattr(img, 'get_flattened_data', None) or img.getdata)()


def palette_of(img):
    return sorted({p[:3] for p in pixels(img.convert('RGBA')) if p[3] == 255})


def snap(img, palette):
    """Map every opaque pixel to the closest palette colour (weighted RGB)."""
    src = img.convert('RGBA')
    out = Image.new('RGBA', src.size)
    s, o = src.load(), out.load()
    cache = {}
    for y in range(src.height):
        for x in range(src.width):
            r, g, b, a = s[x, y]
            if a < 128:
                o[x, y] = (0, 0, 0, 0)
                continue
            key = (r, g, b)
            if key not in cache:
                cache[key] = min(palette, key=lambda c: 2 * (c[0] - r) ** 2 + 4 * (c[1] - g) ** 2 + 3 * (c[2] - b) ** 2)
            o[x, y] = cache[key] + (255,)
    return out


def load_palette(category, manifest):
    palettes = json.loads(Path(manifest).read_text())['palettes']
    if category not in palettes or not isinstance(palettes[category], list):
        names = ', '.join(k for k, v in palettes.items() if isinstance(v, list))
        raise SystemExit(f'unknown palette {category!r}; available: {names}')
    return [hex_to_rgb(c) for c in palettes[category]]


def remove_background(img, tolerance):
    """Make the solid background connected to the image border transparent.

    The background colour is the most common border colour; only pixels close to
    it and connected to the border are cleared, so the sprite's inside is safe.
    """
    img = img.convert('RGBA')
    w, h = img.size
    px = img.load()
    border = [(x, y) for x in range(w) for y in (0, h - 1)] + [(x, y) for y in range(h) for x in (0, w - 1)]
    if sum(1 for p in border if px[p][3] < 128) * 2 >= len(border):
        return img, 0  # already has a transparent background; don't eat sprite pixels touching the edge
    bg = Counter(px[p][:3] for p in border if px[p][3] >= 128).most_common(1)
    if not bg:
        return img, 0
    bg = bg[0][0]
    near = lambda c: sum((a - b) ** 2 for a, b in zip(c[:3], bg)) <= tolerance ** 2
    seen, q = set(), deque(p for p in border if px[p][3] >= 128 and near(px[p]))
    seen.update(q)
    while q:
        x, y = q.popleft()
        px[x, y] = (0, 0, 0, 0)
        for n in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= n[0] < w and 0 <= n[1] < h and n not in seen and px[n][3] >= 128 and near(px[n]):
                seen.add(n)
                q.append(n)
    return img, len(seen)


def _neighbour_keys(img, x, y, colour, w, h):
    """Context of a pixel: the most common other colours in its 3x3 neighbourhood."""
    cnt = Counter(img[i, j] for j in range(max(0, y - 1), min(h, y + 2))
                  for i in range(max(0, x - 1), min(w, x + 2)) if img[i, j] != colour)
    top = [k for k, _ in cnt.most_common(2)]
    return (colour, tuple(sorted(top))), (colour, top[0] if top else colour)


def phase_convert(edited, src_orig, dst_orig, radius=6, samples=8):
    """Recolour an edited phase image into another phase (e.g. Evenfall -> Daylight).

    Rooms ship the same drawing in three palettes (playtest-a/b/c), but one colour
    in a phase can mean different things (an orange that is a leaf highlight and
    also a lake ripple) and split into different colours in another phase. So:
      - unedited pixels take the target phase's original pixel exactly;
      - a thin edited detail (highlight, roof tile, speck: not part of a solid 3x3
        block of its colour) is matched by context, i.e. how the same colour next to
        the same neighbouring colours is drawn in the original pair (used when the
        originals agree strongly);
      - otherwise it follows the unedited pixels it is connected to through the same
        colour, then the same colour nearby, then the most common mapping overall.
    """
    e1, e0, t0 = (im.convert('RGBA') for im in (edited, src_orig, dst_orig))
    if not (e1.size == e0.size == t0.size):
        raise SystemExit(f'size mismatch: edited {e1.size}, from {e0.size}, to {t0.size}')
    a, b, c = e1.load(), e0.load(), t0.load()
    w, h = e1.size
    glob, ctx2, ctx1 = {}, {}, {}
    for y in range(h):
        for x in range(w):
            glob.setdefault(b[x, y], Counter())[c[x, y]] += 1
            k2, k1 = _neighbour_keys(b, x, y, b[x, y], w, h)
            ctx2.setdefault(k2, Counter())[c[x, y]] += 1
            ctx1.setdefault(k1, Counter())[c[x, y]] += 1
    src_palette = list(glob)
    strong = lambda cn: cn and sum(cn.values()) >= 3 and cn.most_common(1)[0][1] * 5 >= sum(cn.values()) * 3
    # a pixel counts as edited if it changed, or if most of its 5x5 neighbourhood changed
    # (inside an edit, a pixel can keep its old colour by coincidence but mean something else)
    diff = [[a[x, y] != b[x, y] for x in range(w)] for y in range(h)]
    def is_edited(x, y):
        if diff[y][x]:
            return True
        near = [diff[j][i] for j in range(max(0, y - 2), min(h, y + 3)) for i in range(max(0, x - 2), min(w, x + 3))]
        return sum(near) * 2 > len(near)
    edited_px = [[is_edited(x, y) for x in range(w)] for y in range(h)]
    thick = [[False] * w for _ in range(h)]
    for y in range(1, h - 1):
        for x in range(1, w - 1):
            if all(a[x + i, y + j] == a[x, y] for i in (-1, 0, 1) for j in (-1, 0, 1)):
                for i in (-1, 0, 1):
                    for j in (-1, 0, 1):
                        thick[y + j][x + i] = True
    def near_thick(x, y):
        # part of, or touching, a solid block of its own colour
        return any(thick[j][i] and a[i, j] == a[x, y] for j in range(max(0, y - 1), min(h, y + 2))
                   for i in range(max(0, x - 1), min(w, x + 2)))
    out = t0.copy()
    o = out.load()
    changed = 0
    for y in range(h):
        for x in range(w):
            if not edited_px[y][x]:
                continue  # unedited: keep the target phase's original pixel
            changed += 1
            px = a[x, y]
            key = px if px in glob else min(src_palette, key=lambda q: sum((i - j) ** 2 for i, j in zip(q, px)))
            # 1) context: same colour with the same neighbours in the originals. Only for
            #    thin details (highlights, roof tiles, specks); pixels of a thick area of
            #    one colour (lake, big fills) are better judged by the area they belong to.
            pick = None
            if not near_thick(x, y):
                k2, k1 = _neighbour_keys(a, x, y, px, w, h)
                k2, k1 = (key, k2[1]), (key, k1[1])
                pick = ctx2.get(k2) if strong(ctx2.get(k2)) else ctx1.get(k1) if strong(ctx1.get(k1)) else None
            if not pick:
                # 2) unedited pixels reachable through the same colour
                found, seen, q = Counter(), {(x, y)}, deque([(x, y)])
                while q and sum(found.values()) < samples and len(seen) < 2000:
                    i, j = q.popleft()
                    for n in ((i + 1, j), (i - 1, j), (i, j + 1), (i, j - 1)):
                        if 0 <= n[0] < w and 0 <= n[1] < h and n not in seen and a[n] == px:
                            seen.add(n)
                            if not edited_px[n[1]][n[0]]:
                                found[c[n]] += 1
                            q.append(n)
                # 3) same colour nearby, 4) most common mapping overall
                pick = found or Counter(c[i, j] for j in range(max(0, y - radius), min(h, y + radius + 1))
                                        for i in range(max(0, x - radius), min(w, x + radius + 1))
                                        if b[i, j] == key and not edited_px[j][i]) or glob[key]
            o[x, y] = pick.most_common(1)[0][0]
    return out, changed


def parse_box(text):
    x0, y0, x1, y1 = (int(v) for v in text.split(','))
    return x0, y0, x1, y1


def parse_restrict(text):
    """'x0,y0,x1,y1=#hex,#hex' | 'x0,y0,x1,y1=original' | 'x0,y0,x1,y1=original@ox0,oy0,ox1,oy1'."""
    box, _, allowed = text.partition('=')
    if not allowed:
        raise argparse.ArgumentTypeError('expected BOX=COLOURS, BOX=original or BOX=original@BOX')
    if allowed.startswith('original'):
        src = allowed.partition('@')[2]
        return parse_box(box), ('original', parse_box(src) if src else parse_box(box))
    return parse_box(box), ('colours', {hex_to_rgb(c) for c in allowed.split(',')})


def restrict_colours(img, rules, orig):
    """Inside each box, recolour pixels whose colour is not allowed.

    A disallowed pixel takes the most common allowed colour around it (filled from
    the edges inwards); allowed colours come from a list or from a region of the
    original. This removes e.g. orange or green specks from rocks, or water
    colours from a roof.
    """
    img = img.convert('RGBA')
    px = img.load()
    total = 0
    for (x0, y0, x1, y1), (kind, spec) in rules:
        if kind == 'original':
            if orig is None:
                raise SystemExit('--restrict ...=original needs --original')
            ox0, oy0, ox1, oy1 = spec
            op = orig.load()
            allowed = {op[x, y][:3] for y in range(oy0, oy1) for x in range(ox0, ox1) if op[x, y][3] >= 128}
        else:
            allowed = spec
        todo = {(x, y) for y in range(y0, y1) for x in range(x0, x1)
                if px[x, y][3] >= 128 and px[x, y][:3] not in allowed}
        total += len(todo)
        for _ in range(max(x1 - x0, y1 - y0)):
            if not todo:
                break
            done = {}
            for x, y in todo:
                near = Counter(px[i, j][:3] for i in (x - 1, x, x + 1) for j in (y - 1, y, y + 1)
                               if (i, j) not in todo and 0 <= i < img.width and 0 <= j < img.height
                               and px[i, j][3] >= 128 and px[i, j][:3] in allowed)
                if near:
                    done[(x, y)] = near.most_common(1)[0][0]
            if not done:
                break
            for p, c in done.items():
                px[p] = c + (255,)
            todo -= set(done)
        if todo:  # isolated from any allowed colour: use the box's most common allowed colour
            fallback = Counter(px[x, y][:3] for y in range(y0, y1) for x in range(x0, x1) if px[x, y][:3] in allowed)
            c = fallback.most_common(1)[0][0] if fallback else sorted(allowed)[0]
            for p in todo:
                px[p] = c + (255,)
    return img, total


def despeckle(img, orig):
    """Edited pixels completely surrounded by one other colour take that colour.

    Only pixels that differ from the original are touched, so deliberate single-pixel
    details of the original art are safe.
    """
    img = img.convert('RGBA')
    px, op = img.load(), orig.load()
    w, h = img.size
    fixed = 0
    for _ in range(2):
        changes = {}
        for y in range(1, h - 1):
            for x in range(1, w - 1):
                c = px[x, y]
                if c == op[x, y] or c[3] < 128:
                    continue
                nb = {px[x + i, y + j] for i in (-1, 0, 1) for j in (-1, 0, 1) if i or j}
                if len(nb) == 1 and c not in nb:
                    changes[(x, y)] = nb.pop()
        for p, c in changes.items():
            px[p] = c
        fixed += len(changes)
        if not changes:
            break
    return img, fixed


def audit(img, orig):
    """Mark (yellow) edited pixels that sit in unusual colour combinations.

    A pixel is flagged when at least two of its neighbouring colours are (almost)
    never next to its colour anywhere in the original, and similar pixels are close
    by (clusters, not single edge pixels). This is a review hint, not a check:
    wrong colours that the original also uses next to each other elsewhere (green
    moss on a rock, an orange leaf in a daylight tree) are not caught, so always
    review close-ups of every edited object as well.
    """
    img = img.convert('RGBA')
    px, op = img.load(), orig.load()
    w, h = img.size
    def nbs(src, x, y):
        return {src[x + i, y + j][:3] for i in (-1, 0, 1) for j in (-1, 0, 1)
                if (i or j) and 0 <= x + i < w and 0 <= y + j < h}
    pairs = Counter()
    for y in range(h):
        for x in range(w):
            c = op[x, y][:3]
            for n in nbs(op, x, y):
                if n != c:
                    pairs[(c, n)] += 1
    flag = set()
    for y in range(h):
        for x in range(w):
            c = px[x, y]
            if c[3] < 128 or c == op[x, y]:
                continue
            if sum(1 for n in nbs(px, x, y) if n != c[:3] and pairs[(c[:3], n)] < 2) >= 2:
                flag.add((x, y))
    flag = {p for p in flag if sum((p[0] + i, p[1] + j) in flag for i in range(-2, 3) for j in range(-2, 3)) >= 3}
    marked = img.convert('RGB').copy()
    mp = marked.load()
    for p in flag:
        mp[p] = (255, 255, 0)
    return marked, len(flag)


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('input', help='raw SpriteCook PNG (or any PNG with --upscale)')
    ap.add_argument('output', help='where to write the cleaned PNG')
    ap.add_argument('--original', help='original sprite: gives native size, palette and the pixels to keep')
    ap.add_argument('--size', help='native size WxH when there is no --original, e.g. 24x24')
    ap.add_argument('--colors', nargs='+', help='palette as hex colours when there is no --original')
    ap.add_argument('--palette', help='palette name from spritecook-assets.json (items, skills, npcs) instead of --colors')
    ap.add_argument('--manifest', default=str(MANIFEST), help='path to spritecook-assets.json (default: repo root)')
    ap.add_argument('--remove-bg', action='store_true',
                    help='make the solid background around the sprite transparent (gpt-image-2 has no real transparency)')
    ap.add_argument('--bg-tolerance', type=int, default=48, help='how far a colour may be from the background colour (default 48)')
    ap.add_argument('--keep-box', action='append', type=parse_box, default=[],
                    help='x0,y0,x1,y1 region to take from the edit; everything else stays original (repeatable)')
    ap.add_argument('--keep-black', action='store_true', help='do not recolour new black pixels to #573359')
    ap.add_argument('--upscale', type=int, help='only make an Nx nearest-neighbour copy (for uploading) and exit')
    ap.add_argument('--phase-from', help='original background of the phase that was edited (e.g. playtest-b.png)')
    ap.add_argument('--phase-to', help='original background of the phase to produce (e.g. playtest-a.png); input = the finished edit')
    ap.add_argument('--restrict', action='append', type=parse_restrict, default=[],
                    help='fix mode: x0,y0,x1,y1=#hex,#hex (or =original, or =original@x0,y0,x1,y1): inside the box only '
                         'these colours are allowed; other pixels take the surrounding allowed colour (repeatable)')
    ap.add_argument('--despeckle', action='store_true',
                    help='fix mode: edited pixels surrounded by one other colour take that colour (needs --original)')
    ap.add_argument('--audit', metavar='MARKED.png',
                    help='fix mode: write a copy with unusual colour combinations marked in yellow and print how many '
                         '(needs --original). A review hint only: always also check close-ups of each edited object')
    args = ap.parse_args(argv)

    img = Image.open(args.input)
    if args.restrict or args.despeckle or args.audit:
        # fix mode: works on a finished, native-size image; nothing is resized or snapped
        orig = Image.open(args.original).convert('RGBA') if args.original else None
        if (args.despeckle or args.audit) and orig is None:
            ap.error('--despeckle and --audit need --original')
        if orig is not None and orig.size != img.size:
            ap.error(f'size mismatch: input {img.size}, original {orig.size}')
        out = img.convert('RGBA')
        if args.restrict:
            out, n = restrict_colours(out, args.restrict, orig)
            print(f'restrict: {n} off-palette pixels recoloured')
        if args.despeckle:
            out, n = despeckle(out, orig)
            print(f'despeckle: {n} stray pixels removed')
        out.save(args.output)
        if args.audit:
            marked, n = audit(out, orig)
            marked.save(args.audit)
            print(f'audit: {n} suspicious pixels marked in {args.audit}')
        return 0
    if args.phase_from or args.phase_to:
        if not (args.phase_from and args.phase_to):
            ap.error('--phase-from and --phase-to go together')
        out, changed = phase_convert(img, Image.open(args.phase_from), Image.open(args.phase_to))
        out.save(args.output)
        used = len({p[:3] for p in pixels(out) if p[3] == 255})
        print(f'{args.output}: {out.width}x{out.height}, {used} colours, {changed} edited pixels recoloured')
        return 0
    if args.upscale:
        img.resize((img.width * args.upscale, img.height * args.upscale), Image.NEAREST).save(args.output)
        return 0

    orig = Image.open(args.original).convert('RGBA') if args.original else None
    if orig is not None:
        size, palette = orig.size, palette_of(orig)
    elif args.size and (args.colors or args.palette):
        size = tuple(int(v) for v in args.size.lower().split('x'))
        palette = [hex_to_rgb(c) for c in args.colors] if args.colors else load_palette(args.palette, args.manifest)
    else:
        ap.error('give --original, or --size with --colors or --palette')
    if args.keep_box and orig is None:
        ap.error('--keep-box needs --original')

    work = img.convert('RGBA')
    work = work.resize(size, Image.NEAREST) if work.size != size else work
    if args.remove_bg:
        work, cleared = remove_background(work, args.bg_tolerance)
        print(f'background: {cleared} pixels made transparent')
    out = snap(work, palette)

    if orig is not None and not args.remove_bg and not args.keep_box:
        orig_clear = sum(1 for p in pixels(orig) if p[3] == 0)
        out_clear = sum(1 for p in pixels(out) if p[3] == 0)
        if orig_clear and not out_clear:
            print('warning: the original has a transparent background but the result has none; add --remove-bg', file=sys.stderr)

    if args.keep_box:
        merged = orig.copy()
        for x0, y0, x1, y1 in args.keep_box:
            merged.paste(out.crop((x0, y0, x1, y1)), (x0, y0))
        out = merged

    if not args.keep_black and BLACK in palette:
        o = out.load()
        ref = orig.load() if orig is not None else None
        for y in range(out.height):
            for x in range(out.width):
                if o[x, y][:3] == BLACK and (ref is None or ref[x, y][:3] != BLACK):
                    o[x, y] = OUTLINE + (255,)

    out.save(args.output)
    used = len({p[:3] for p in pixels(out) if p[3] == 255})
    print(f'{args.output}: {out.width}x{out.height}, {used} colours')
    return 0


if __name__ == '__main__':
    sys.exit(main())
