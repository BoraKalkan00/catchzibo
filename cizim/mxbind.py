# usage: mxbind.py rig.glb textured.glb out.glb  -> textured mesh + mixamo skeleton, weights transferred
import json,struct,sys,numpy as np,trimesh
SM=int(sys.argv[4]) if len(sys.argv)>4 else 3
def rd(f):
  b=open(f,'rb').read();l=struct.unpack('<I',b[12:16])[0];j=json.loads(b[20:20+l]);bin_=b[20+l+8:];return j,bin_
CT={5126:np.float32,5123:np.uint16,5125:np.uint32,5121:np.uint8};NC={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
def acc(j,b,i):
  a=j['accessors'][i];v=j['bufferViews'][a['bufferView']];o=v.get('byteOffset',0)+a.get('byteOffset',0)
  n=NC[a['type']];d=np.frombuffer(b,CT[a['componentType']],a['count']*n,o);return d.reshape(a['count'],n) if n>1 else d
rj,rb=rd(sys.argv[1]);tj,tb=rd(sys.argv[2])
P=rj['meshes'][0]['primitives'][0];A=P['attributes']
RP=acc(rj,rb,A['POSITION']).astype(float);RJ=acc(rj,rb,A['JOINTS_0']);RW=acc(rj,rb,A['WEIGHTS_0']);RI=acc(rj,rb,P['indices']).reshape(-1,3)
T=tj['meshes'][0]['primitives'][0]
TP=acc(tj,tb,T['attributes']['POSITION']).astype(float);UV=acc(tj,tb,T['attributes']['TEXCOORD_0']);TI=acc(tj,tb,T['indices']).astype(np.uint32).reshape(-1,3)
# fit textured bbox -> rig bbox
rlo,rhi=RP.min(0),RP.max(0);tlo,thi=TP.min(0),TP.max(0)
s=(rhi[1]-rlo[1])/(thi[1]-tlo[1]);c=(rlo+rhi)/2;tc=(tlo+thi)/2
NP=(TP-tc)*s+c;NP[:,1]=(TP[:,1]-tlo[1])*s+rlo[1]
if len(sys.argv)>5: NP=TP*float(sys.argv[5])   # vekil kırpıldıysa (ör. şövalye tüyü) sabit ölçek
# dense weights per rig vertex
nb=len(rj['skins'][0]['joints']);DW=np.zeros((len(RP),nb))
for k in range(4): np.add.at(DW,(np.arange(len(RP)),RJ[:,k]),RW[:,k])
rm=trimesh.Trimesh(RP,RI,process=False)
# weld soup by position so seams share weights
key=np.round(NP,5);U,inv=np.unique(key,axis=0,return_inverse=True);inv=inv.reshape(-1)
cp,dist,tri=trimesh.proximity.closest_point(rm,U)
bc=trimesh.triangles.points_to_barycentric(rm.triangles[tri],cp)
WU=np.einsum('ij,ijk->ik',np.clip(bc,0,1),DW[RI[tri]])
wm=trimesh.Trimesh(U,inv[TI.reshape(-1)].reshape(-1,3),process=False);adj=wm.vertex_neighbors
for _ in range(SM):
  WU=np.array([0.5*WU[i]+0.5*WU[a].mean(0) if len(a) else WU[i] for i,a in enumerate(adj)])
W=WU[inv]
idx=np.argsort(-W,1)[:,:4];w=np.take_along_axis(W,idx,1);w/=w.sum(1,keepdims=True)
print('maxdist',dist.max(),'mean',dist.mean())
NRM=wm.vertex_normals[inv].astype(np.float32)
# build glb
img=tj['images'][0];iv=tj['bufferViews'][img['bufferView']];IMG=tb[iv.get('byteOffset',0):iv.get('byteOffset',0)+iv['byteLength']]
IBM=acc(rj,rb,rj['skins'][0]['inverseBindMatrices'])
blobs=[];views=[];accs=[]
def add(arr,ctype,typ,target=None,minmax=False):
  data=arr.tobytes();off=sum(len(x) for x in blobs);pad=(-len(data))%4
  blobs.append(data+b'\0'*pad);bv={'buffer':0,'byteOffset':off,'byteLength':len(data)}
  if target:bv['target']=target
  views.append(bv);a={'bufferView':len(views)-1,'componentType':ctype,'count':len(arr),'type':typ}
  if minmax:a['min']=arr.min(0).tolist();a['max']=arr.max(0).tolist()
  accs.append(a);return len(accs)-1
KEY=np.hstack([np.round(NP,5),np.round(UV,5)]);_,first,remap=np.unique(KEY,axis=0,return_index=True,return_inverse=True);remap=remap.reshape(-1)
NP,UV,NRM,idx,w=NP[first],np.asarray(UV)[first],NRM[first],idx[first],w[first];TI=remap[TI]
print('verts',len(NP))
iI=add(TI.reshape(-1).astype(np.uint16 if len(NP)<65535 else np.uint32),5123 if len(NP)<65535 else 5125,'SCALAR',34963)
iP=add(NP.astype(np.float32),5126,'VEC3',34962,True)
iN=add(NRM,5126,'VEC3',34962);iU=add(np.ascontiguousarray(UV,np.float32),5126,'VEC2',34962)
iJ=add(idx.astype(np.uint16),5123,'VEC4',34962);iW=add(w.astype(np.float32),5126,'VEC4',34962)
iB=add(np.ascontiguousarray(IBM,np.float32),5126,'MAT4')
off=sum(len(x) for x in blobs);blobs.append(IMG+b'\0'*((-len(IMG))%4));views.append({'buffer':0,'byteOffset':off,'byteLength':len(IMG)})
g={'asset':{'version':'2.0'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':rj['nodes'],
 'meshes':[{'name':'body','primitives':[{'attributes':{'POSITION':iP,'NORMAL':iN,'TEXCOORD_0':iU,'JOINTS_0':iJ,'WEIGHTS_0':iW},'indices':iI,'material':0}]}],
 'skins':[{'joints':rj['skins'][0]['joints'],'skeleton':rj['skins'][0].get('skeleton'),'inverseBindMatrices':iB}],
 'materials':[{'pbrMetallicRoughness':{'baseColorTexture':{'index':0},'metallicFactor':0,'roughnessFactor':1}}],
 'textures':[{'source':0}],'images':[{'bufferView':len(views)-1,'mimeType':img['mimeType']}],
 'accessors':accs,'bufferViews':views}
for n in g['nodes']:
  if 'mesh' in n:n['name']='body'
B=b''.join(blobs);g['buffers']=[{'byteLength':len(B)}]
js=json.dumps(g,separators=(',',':')).encode();js+=b' '*((-len(js))%4)
out=struct.pack('<III',0x46546C67,2,12+8+len(js)+8+len(B))+struct.pack('<II',len(js),0x4E4F534A)+js+struct.pack('<II',len(B),0x004E4942)+B
open(sys.argv[3],'wb').write(out);print('ok',len(out))
