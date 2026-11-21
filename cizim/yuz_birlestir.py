import numpy as np,sys
from PIL import Image
def ears(a,top_frac):
  A=np.array(a.getchannel('A'))>60;ys,xs=np.nonzero(A);top=ys.min();h=ys.max()-top
  best=(0,0,0,0)
  for y in range(top,top+int(h*top_frac)):
    r=np.nonzero(A[y])[0]
    if len(r) and r.max()-r.min()>best[0]: best=(r.max()-r.min(),y,r.min(),r.max())
  return top,best
def comp(body_p,bust_p,out,cut=0.80):
  b=Image.open(body_p).convert('RGBA');f=Image.open(bust_p).convert('RGBA')
  bt,(bw,by,bx0,bx1)=ears(b,0.35);ft,(fw,fy,fx0,fx1)=ears(f,0.75)
  s=bw/fw;f=f.resize((int(f.width*s),int(f.height*s)),Image.LANCZOS)
  fy=fy*s;fx0=fx0*s;ft=ft*s
  # cut bust below chin: keep rows down to 'cut' of bust height (above scarf)
  keep=int(f.height*cut);m=Image.new('L',f.size,0);mk=np.zeros((f.height,f.width),np.uint8);fade=int(f.height*0.06)
  for y in range(f.height):
    mk[y]=255 if y<keep-fade else max(0,int(255*(keep-y)/fade)) if y<keep else 0
  a=np.array(f.getchannel('A')).astype(int)*mk//255;f.putalpha(Image.fromarray(a.astype(np.uint8)))
  ox=int(bx0-fx0);oy=int(by-fy)
  c=b.copy();c.alpha_composite(f,(max(0,ox),max(0,oy)) if ox>=0 and oy>=0 else (0,0))
  if ox<0 or oy<0:
    c=Image.new('RGBA',b.size);c.alpha_composite(b);c.paste(f,(ox,oy),f)
  c.save(out)
for n in sys.argv[2:]: comp(sys.argv[1],n+'.png','c_'+n+'.png')

def comp_full(body_p,bust_p,out):
  # büstün tamamı (kollar dahil) + gövde render'ının yalnız alt kısmı (bacaklar), yan sarkan kollar silinir
  b=Image.open(body_p).convert('RGBA');f=Image.open(bust_p).convert('RGBA')
  bt,(bw,by,bx0,bx1)=ears(b,0.35);ft,(fw,fy,fx0,fx1)=ears(f,0.75)
  s=bw/fw;f=f.resize((int(f.width*s),int(f.height*s)),Image.LANCZOS)
  ox=int(bx0-fx0*s);oy=int(by-fy*s)
  B=np.array(b);AB=B[:,:,3]>60;ys=np.nonzero(AB.any(1))[0];yl=int(ys.min()+(ys.max()-ys.min())*0.9)
  r=np.nonzero(AB[yl])[0];c=(r.min()+r.max())/2;hw=(r.max()-r.min())/2*1.12
  B[:,:int(c-hw),3]=0;B[:,int(c+hw):,3]=0;R_,G_,Bb=[B[:,:,k].astype(int) for k in range(3)];gr=(G_>R_*1.08)&(G_>Bb*1.3);yk=int(ys.min()+(ys.max()-ys.min())*0.87);gm=np.zeros_like(gr);gm[:yk]=gr[:yk];B[gm,3]=0;B[:by+int((bx1-bx0)*0.25),:,3]=0
  c=Image.new('RGBA',b.size);c.alpha_composite(Image.fromarray(B));c.paste(f,(ox,oy),f);c.save(out)
