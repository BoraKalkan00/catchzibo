# animpack.py out.glb rig.glb name=file.glb ...  -> one glb: rig skeleton nodes (no mesh) + named clips (rotations + hips pos scaled)
import json,struct,sys,numpy as np
def rd(f):
  b=open(f,'rb').read();l=struct.unpack('<I',b[12:16])[0];return json.loads(b[20:20+l]),b[20+l+8:]
CT={5126:np.float32};NC={'SCALAR':1,'VEC3':3,'VEC4':4}
def acc(j,b,i):
  a=j['accessors'][i];v=j['bufferViews'][a['bufferView']];o=v.get('byteOffset',0)+a.get('byteOffset',0);n=NC[a['type']]
  d=np.frombuffer(b,np.float32,a['count']*n,o);return d.reshape(a['count'],n) if n>1 else d.copy()
rj,_=rd(sys.argv[2]);names={n['name'] for n in rj['nodes'] if n['name'].startswith('mixamorig')}
rh=1.0 if '--unit' in sys.argv else [n for n in rj['nodes'] if n['name']=='mixamorig:Hips'][0]['translation'][1]
blobs=[];views=[];accs=[]
def add(arr,typ,mm=False):
  data=np.ascontiguousarray(arr,np.float32).tobytes();off=sum(len(x) for x in blobs);blobs.append(data)
  views.append({'buffer':0,'byteOffset':off,'byteLength':len(data)})
  a={'bufferView':len(views)-1,'componentType':5126,'count':len(arr),'type':typ}
  if mm:a['min']=[float(arr.min())];a['max']=[float(arr.max())]
  accs.append(a);return len(accs)-1
# nodes: flat list of bones with names only (three binds tracks by name)
nodes=[{'name':n} for n in sorted(names)];idx={n['name']:i for i,n in enumerate(nodes)}
anims=[]
for arg in [a for a in sys.argv[3:] if a!='--unit']:
  nm,f=arg.split('=',1);opts=f.split(':')[1:];f=f.split(':')[0];j,b=rd(f);A=j['animations'][0]
  MIR='mirror' in opts;IP='ip' in opts
  TR=[tuple(map(float,o[2:].split('-'))) for o in opts if o.startswith('t=')];TR=TR[0] if TR else None
  ah=[n for n in j['nodes'] if n['name']=='mixamorig:Hips'][0]['translation'][1];sc=rh/ah
  ch=[];sm=[];tcache={}
  for c in A['channels']:
    s=A['samplers'][c['sampler']];node=j['nodes'][c['target']['node']]['name'];p=c['target']['path']
    if MIR: node=node.replace('Left','#').replace('Right','Left').replace('#','Right')
    if node not in idx: continue
    if p=='scale' or (p=='translation' and node!='mixamorig:Hips'): continue
    T=acc(j,b,s['input']);V=acc(j,b,s['output'])
    if TR and len(T)>1:
      k=(T>=TR[0]-1e-4)&(T<=TR[1]+1e-4);T=T[k]-TR[0];V=V[k]
    if p=='translation':
      V=V*sc
      if IP: V=V.copy();V[:,0]=V[0,0];V[:,2]=V[0,2]
      if MIR: V=V.copy();V[:,0]*=-1
    if p=='rotation' and MIR: V=V.copy();V[:,1]*=-1;V[:,2]*=-1
    if p=='rotation' and np.abs(V-V[0]).max()<1e-4: T=T[:1];V=V[:1]
    key=(len(T),float(T[0]),float(T[-1]))
    if key not in tcache: tcache[key]=add(T,'SCALAR',True)
    sm.append({'input':tcache[key],'output':add(V,'VEC4' if p=='rotation' else 'VEC3'),'interpolation':'LINEAR'})
    ch.append({'sampler':len(sm)-1,'target':{'node':idx[node],'path':p}})
  anims.append({'name':nm,'channels':ch,'samplers':sm})
B=b''.join(blobs)
g={'asset':{'version':'2.0'},'scene':0,'scenes':[{'nodes':list(range(len(nodes)))}],'nodes':nodes,'animations':anims,'accessors':accs,'bufferViews':views,'buffers':[{'byteLength':len(B)}]}
js=json.dumps(g,separators=(',',':')).encode();js+=b' '*((-len(js))%4)
open(sys.argv[1],'wb').write(struct.pack('<III',0x46546C67,2,28+len(js)+len(B))+struct.pack('<II',len(js),0x4E4F534A)+js+struct.pack('<II',len(B),0x004E4942)+B)
print('ok',len(B))
