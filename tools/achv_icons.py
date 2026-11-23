# Steam başarım ikonları: store/achv/<ID>.jpg (açık) ve <ID>_gray.jpg (kilitli), 256x256
import re, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps, ImageEnhance
src = open('js/core/achv.js', encoding='utf8').read()
L = re.findall(r"\['([A-Z_0-9]+)', '([^']+)'", src)
F = ImageFont.truetype('/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf', 109)
PAL = {'NIGHT': ((40, 48, 110), (110, 80, 200)), 'KILL': ((120, 30, 30), (220, 80, 60)), 'ZIBO': ((20, 90, 60), (60, 190, 120)),
       'COMBO': ((130, 60, 10), (250, 160, 40)), 'TREE': ((70, 45, 20), (170, 110, 50)), 'ROCK': ((50, 60, 75), (130, 145, 165)),
       'BUILD': ((90, 60, 20), (210, 150, 60)), 'VILL': ((30, 90, 110), (70, 180, 200)), 'HALL': ((70, 30, 100), (180, 100, 230)),
       'LOOT': ((110, 40, 90), (230, 90, 170)), 'RUSH': ((120, 90, 0), (255, 210, 50)), 'HERO': ((20, 60, 130), (70, 140, 250)),
       'ORDER': ((100, 60, 30), (220, 160, 90)), 'PHOTO': ((30, 30, 40), (110, 120, 140)), 'RICH': ((120, 80, 0), (255, 200, 40))}
S = 256
def badge(c0, c1):
    im = Image.new('RGB', (S, S), c0); px = im.load()
    for y in range(S):
        for x in range(S):
            r = math.hypot(x - S * 0.5, y - S * 0.38) / (S * 0.75); r = min(1, r)
            px[x, y] = tuple(int(c1[i] * (1 - r) + c0[i] * r) for i in range(3))
    d = ImageDraw.Draw(im)
    # yıldız ışınları (çerçevenin içinde kalır)
    for k in range(12):
        a = k / 12 * math.tau; d.line([S / 2, S / 2, S / 2 + math.cos(a) * 110, S / 2 + math.sin(a) * 110], fill=tuple(min(255, v + 14) for v in c1), width=3)
    m = Image.new('L', (S, S), 0); ImageDraw.Draw(m).rounded_rectangle([6, 6, S - 7, S - 7], 38, fill=255)
    out = Image.new('RGB', (S, S), (20, 16, 30)); out.paste(im, (0, 0), m); d = ImageDraw.Draw(out)
    d.rounded_rectangle([6, 6, S - 7, S - 7], 38, outline=(255, 214, 90), width=10)
    return out
for id_, ic in L:
    cat = id_.split('_')[0]; c0, c1 = PAL.get(cat, ((40, 40, 60), (120, 120, 160)))
    im = badge(c0, c1)
    e = Image.new('RGBA', (160, 140), (0, 0, 0, 0)); ImageDraw.Draw(e).text((6, 6), ic, font=F, embedded_color=True)
    bb = e.getbbox(); e = e.crop(bb); sc = 150 / max(e.size); e = e.resize((int(e.size[0] * sc), int(e.size[1] * sc)), Image.LANCZOS)
    sh = Image.new('RGBA', e.size, (0, 0, 0, 0)); sh.putalpha(e.split()[3].point(lambda a: int(a * 0.55))); sh = sh.filter(ImageFilter.GaussianBlur(6))
    ox, oy = (S - e.size[0]) // 2, (S - e.size[1]) // 2
    im.paste((0, 0, 0), (ox + 4, oy + 8), sh); im.paste(e, (ox, oy), e)
    im.save('store/achv/%s.jpg' % id_, quality=92)
    g = ImageEnhance.Brightness(ImageOps.grayscale(im).convert('RGB')).enhance(0.55); g.save('store/achv/%s_gray.jpg' % id_, quality=92)
print(len(L))
