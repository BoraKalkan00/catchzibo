import sys,trimesh
sys.path.insert(0,'/home/claude/tools');import texpaint
for ad in sys.argv[1:]:
  texpaint.run(f'/mnt/user-data/uploads/Zibo3D/cikti/{ad}_0.glb',f'/home/claude/n2/{ad}_front.png',f'/home/claude/n2/{ad}_back.png',f'/home/claude/n2/{ad}_tex.glb',faces=12000)
  m=trimesh.load(f'/home/claude/n2/{ad}_tex.glb',force='mesh');m=trimesh.Trimesh(m.vertices*170,m.faces);m.merge_vertices()
  v=m.voxelized(1.6).fill();w=v.marching_cubes;w.apply_transform(v.transform);trimesh.smoothing.filter_taubin(w,iterations=10)
  w.export(f'/mnt/user-data/outputs/n2/{ad}_px.obj');print(ad,w.is_watertight,len(w.split(only_watertight=False)))
