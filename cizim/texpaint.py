# Gemini ön/arka görünüşünü 3D modele doku olarak kaplar (önden izdüşüm).
# Ön yüzler (normal z>=0) ön resimden, arka yüzler aynalanmış arka resimden renk alır.
# Çıktı: boy=1, taban y=0, ortalanmış, dokulu GLB.
import sys, numpy as np, trimesh
from PIL import Image
from scipy.ndimage import distance_transform_edt

def prep(path, size=512):
    im = Image.open(path).convert('RGBA')
    a = np.asarray(im)
    bb = Image.fromarray(a[:, :, 3]).point(lambda v: 255 if v > 100 else 0).getbbox()
    im = im.crop(bb)
    arr = np.asarray(im).astype(np.float32)
    opaque = arr[:, :, 3] > 100
    from scipy.ndimage import binary_erosion
    opaque = binary_erosion(opaque, iterations=max(2, im.size[0] // 60))   # kenardaki koyu gölge şeridini at, yanlar temiz renk alsın
    _, (iy, ix) = distance_transform_edt(~opaque, return_indices=True)   # boş pikselleri en yakın renkle doldur
    rgb = arr[iy, ix, :3]
    return Image.fromarray(rgb.astype(np.uint8)).resize((size, size), Image.LANCZOS)

def run(glb, front, back, out, faces=6000):
    s = trimesh.load(glb); m = trimesh.util.concatenate(list(s.geometry.values())) if hasattr(s, 'geometry') else s
    parts = m.split(only_watertight=False)
    if len(parts) > 1: m = max(parts, key=lambda p: len(p.faces))
    if len(m.faces) > faces: m = m.simplify_quadric_decimation(face_count=faces)
    v = m.vertices.copy()
    v -= [(v[:, 0].min() + v[:, 0].max()) / 2, v[:, 1].min(), (v[:, 2].min() + v[:, 2].max()) / 2]
    v /= v[:, 1].max()
    m.vertices = v
    F = prep(front); B = prep(back)
    atlas = Image.new('RGB', (1024, 512)); atlas.paste(F, (0, 0)); atlas.paste(B, (512, 0))
    import io; bio = io.BytesIO(); atlas.save(bio, 'JPEG', quality=86); bio.seek(0); atlas = Image.open(bio)
    x0, x1 = v[:, 0].min(), v[:, 0].max()
    tri = v[m.faces]                      # (n,3,3)
    fn = m.face_normals
    isFront = fn[:, 2] >= 0
    u = (tri[:, :, 0] - x0) / (x1 - x0)   # 0..1 soldan sağa (önden bakış)
    vv = tri[:, :, 1]                      # 0..1 aşağıdan yukarı
    uf = u * 0.5
    ub = 0.5 + (1 - u) * 0.5               # arkadan bakınca sol-sağ ters
    U = np.where(isFront[:, None], uf, ub)
    uv = np.stack([U, vv], -1).reshape(-1, 2)
    uv[:, 0] = np.clip(uv[:, 0], 0.001, 0.999); uv[:, 1] = np.clip(uv[:, 1], 0.001, 0.999)
    verts = tri.reshape(-1, 3); fcs = np.arange(len(verts)).reshape(-1, 3)
    mat = trimesh.visual.material.PBRMaterial(baseColorTexture=atlas, metallicFactor=0, roughnessFactor=1)
    out_m = trimesh.Trimesh(verts, fcs, visual=trimesh.visual.TextureVisuals(uv=uv, material=mat), process=False)
    out_m.export(out, include_normals=False)
    print(out, len(fcs))

if __name__ == '__main__':
    run(*sys.argv[1:5])
