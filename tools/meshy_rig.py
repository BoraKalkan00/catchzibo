import bpy, numpy as np, mathutils
from PIL import Image, ImageDraw
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath='/home/claude/catchzibo/assets/3d/mx/girl.glb')
old=bpy.data.objects['body']; arm=bpy.data.objects['RootNode']
bpy.ops.import_scene.gltf(filepath='/tmp/mg/girl_lite.glb')
new=[o for o in bpy.context.selected_objects if o.type=='MESH'][0]
# bake new transform, align to old bbox
bpy.ops.object.select_all(action='DESELECT'); new.select_set(True); bpy.context.view_layer.objects.active=new
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
dg=bpy.context.evaluated_depsgraph_get()
def V(o):
    e=o.evaluated_get(dg); m=e.to_mesh(); M=np.array(o.matrix_world); a=np.array([v.co for v in m.vertices]); return (np.c_[a,np.ones(len(a))]@M.T)[:,:3]
vo=V(old); vn=V(new)
s=(vo[:,2].max()-vo[:,2].min())/(vn[:,2].max()-vn[:,2].min())
c0=np.array([(vn[:,0].max()+vn[:,0].min())/2,(vn[:,1].max()+vn[:,1].min())/2,vn[:,2].min()])
c1=np.array([(vo[:,0].max()+vo[:,0].min())/2,(vo[:,1].max()+vo[:,1].min())/2,vo[:,2].min()])
for p in new.data.vertices: p.co=mathutils.Vector((np.array(p.co)-c0)*s+c1)
vn=np.array([p.co for p in new.data.vertices])
np.save('/tmp/bl/vn.npy',vn)
# arm landmarks (left = +x)
def armfit(sg):
    A=vn[(sg*vn[:,0]>0.27)&(vn[:,2]>0.35)&(vn[:,2]<0.95)]
    m=A.mean(0); u,sv,vt=np.linalg.svd(A-m); ax=vt[0]
    if ax[2]>0: ax=-ax   # downwards
    t=(A-m)@ax; tip=m+ax*t.max(); top=m+ax*t.min()
    return top,tip,ax
for sg,n in((1,'Left'),(-1,'Right')):
    top,tip,ax=armfit(sg); print(n,'top',top.round(3),'tip',tip.round(3),'ax',ax.round(3))
# ---- edit bones
bpy.ops.object.select_all(action='DESELECT'); arm.select_set(True); bpy.context.view_layer.objects.active=arm
bpy.ops.object.mode_set(mode='EDIT')
eb=arm.data.edit_bones; MW=arm.matrix_world; MI=MW.inverted()
W2L=lambda p: MI@mathutils.Vector(p)
for sg,n in((1,'Left'),(-1,'Right')):
    top,tip,ax=armfit(sg)
    S=top+ax*0.09; L=np.linalg.norm(tip-S); d=(tip-S)/L
    E=S+d*L*0.40; Wr=S+d*L*0.74; T=tip-d*0.02
    A=eb['mixamorig:'+n+'Arm']; F=eb['mixamorig:'+n+'ForeArm']; H=eb['mixamorig:'+n+'Hand']; SH=eb['mixamorig:'+n+'Shoulder']
    oldW=H.head.copy(); oldDir=(H.tail-H.head).normalized()
    newW=W2L(Wr); newDir=(W2L(T)-newW).normalized()
    q=oldDir.rotation_difference(newDir)
    kids=[b for b in eb if b.parent and (b.parent==H or H in b.parent_recursive)]
    for b in kids:
        b.use_connect=False
    for b in kids:
        b.head=newW+q@(b.head-oldW); b.tail=newW+q@(b.tail-oldW)
    for b in (A,F,H): b.use_connect=False
    A.head=W2L(S); A.tail=W2L(E); F.head=W2L(E); F.tail=newW; H.head=newW; H.tail=W2L(T)
    SH.tail=W2L(S)
bpy.ops.object.mode_set(mode='OBJECT')
# ---- replace mesh
bpy.data.objects.remove(old, do_unlink=True)
for o in list(bpy.data.objects):
    if o.type=='MESH' and o!=new: bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.object.select_all(action='DESELECT'); new.select_set(True); bpy.context.view_layer.objects.active=new
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.remove_doubles(threshold=0.0005); bpy.ops.object.mode_set(mode='OBJECT')
dm=new.modifiers.new('dec','DECIMATE'); dm.ratio=9500/len(new.data.polygons); bpy.ops.object.modifier_apply(modifier='dec')
print('faces',len(new.data.polygons))
new.name='body'; new.data.name='body'
new.select_set(True); arm.select_set(True); bpy.context.view_layer.objects.active=arm
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
print('groups',len(new.vertex_groups), 'unweighted', sum(1 for v in new.data.vertices if not v.groups))
bpy.ops.object.select_all(action='DESELECT'); new.select_set(True); arm.select_set(True)
bpy.ops.export_scene.gltf(filepath='/tmp/bl/girl_new.glb', export_format='GLB', use_selection=True, export_animations=False, export_skins=True, export_image_format='JPEG', export_jpeg_quality=85)
print('done')
