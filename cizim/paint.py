import sys, numpy as np, trimesh
from PIL import Image
def run(glb, png, out, faces=4000):
    s = trimesh.load(glb); m = trimesh.util.concatenate(list(s.geometry.values()))
    # en büyük parça kalsın (yüzen kırıntılar gitsin)
    parts = m.split(only_watertight=False); m = max(parts, key=lambda p: len(p.faces)) if len(parts) > 1 else m
    if len(m.faces) > faces: m = m.simplify_quadric_decimation(face_count=faces)
    v = m.vertices.copy()
    v -= [(v[:,0].min()+v[:,0].max())/2, v[:,1].min(), (v[:,2].min()+v[:,2].max())/2]; v /= v[:,1].max()
    m.vertices = v
    im = np.asarray(Image.open(png).convert('RGBA')).astype(float)
    a = im[:,:,3] > 128; ys, xs = np.where(a); x0,x1,y0,y1 = xs.min(), xs.max(), ys.min(), ys.max()
    H = v[:,1].max(); W0, W1 = v[:,0].min(), v[:,0].max()
    # görüntü sığdırma: yükseklik eşleşir, x merkezden
    sc = (y1 - y0) / H; cx = (x0 + x1) / 2
    px = np.clip((cx + v[:,0] * sc).round().astype(int), 0, im.shape[1]-1)
    py = np.clip((y1 - v[:,1] * sc).round().astype(int), 0, im.shape[0]-1)
    # şeffaf piksele düşerse en yakın opak piksel
    from scipy.ndimage import distance_transform_edt
    _, (iy, ix) = distance_transform_edt(~a, return_indices=True)
    qy, qx = iy[py, px], ix[py, px]
    col = im[qy, qx, :3]
    n = m.vertex_normals; back = n[:,2] < -0.3
    col[back] *= 0.82
    rgba = np.concatenate([col, np.full((len(col),1),255)], 1).astype(np.uint8)
    m.visual = trimesh.visual.ColorVisuals(m, vertex_colors=rgba)
    m.export(out); print(out, len(m.faces))
if __name__ == '__main__': run(*sys.argv[1:4])
