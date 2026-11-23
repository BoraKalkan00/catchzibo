import asyncio, subprocess, time, sys
from playwright.async_api import async_playwright
srv=subprocess.Popen(['python3','-m','http.server','8765'],cwd='/home/claude/catchzibo',stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
SKILL=float(sys.argv[1]) if len(sys.argv)>1 else 0.5
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=await b.new_page(viewport={'width':412,'height':860},has_touch=True); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
    await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(2500)
    await pg.evaluate("""()=>{const d=CZ.state.data; const n=new Date(); d.login={last:n.getFullYear()*10000+(n.getMonth()+1)*100+n.getDate(),n:1}; d.lang='tr'; d.introDone=true; d.tutV=5; d.tutVer=2; d.tutorialDone=true; d.tipsOff=true; d.gfx='lo'; d.seenAt=Date.now(); d.gold=380; d.wood=70; d.stone=60;
      const V=CZ.village.ensure(); V.def=V.def||{}; V.def.t=[{type:'snow',lv:1},null,null,null,null,null,null,null]; V.def.f=[null,null,null,null,null,null,null,null]; CZ.state.save(); location.reload();}""")
    await pg.wait_for_timeout(12000)
    await pg.evaluate("""()=>{window.__bot=(V,skill,mode)=>{ const J=V.debug.joy, P=V.P; const alive=V.goblins.filter(g=>!g.dead);
      if(V.phase==='night'){ let o=null,bd=1e9; alive.forEach(g=>{const dd=Math.hypot(g.x-P.x,g.z-P.z); if(dd<bd){bd=dd;o=g;}});
        const home=Math.hypot(P.x,P.z); if(o&&bd>7&&home<30){J.id=1;J.dx=(o.x-P.x)/bd;J.dy=(o.z-P.z)/bd;} else if(home>=30){J.id=1;J.dx=-P.x/home;J.dy=-P.z/home;} else {J.id=null;J.dx=J.dy=0;}
        if(Math.random()<skill) V.debug.autoFire(); return; }
      const near=(arr)=>{let b=null,bd=1e9; arr.forEach(o=>{ if(!o.alive) return; const dd=Math.hypot(o.x-P.x,o.z-P.z); if(dd<bd){bd=dd;b=o;} }); return b;};
      const tg=near(mode?V.debug.trees:V.debug.rocks); if(tg){ const dx=tg.x-P.x, dz=tg.z-P.z, L=Math.hypot(dx,dz)||1; if(L>1.8){J.id=1;J.dx=dx/L;J.dy=dz/L;} else {J.id=null;J.dx=J.dy=0;} } V.debug.autoFire(); };}""")
    await pg.evaluate("()=>{const V=CZ.screens.valley.debug; const d=CZ.state.data; d.vil.def.t=d.vil.def.t.map((x,i)=>({type:i%2?'cannon':'snow',lv:1})); V.wave=4; V.phT=0.05;}")
    for i in range(14):
      r=await pg.evaluate("""(sk)=>{const V=CZ.screens.valley.debug; let fm=0; V.debug.sim(5,()=>{__bot(V,sk,0); fm=Math.max(fm,V.debug.fires());}); return JSON.stringify({ph:V.phase,w:V.wave,hp:Math.round(V.P.hp),zibo:!!V.zibo,zhp:V.zibo&&Math.round(V.zibo.hp),fires:fm,alive:V.goblins.filter(g=>!g.dead).length})}""", SKILL)
      print(i,r); await pg.screenshot(path='/tmp/zb/z%02d.png'%i)
      if '"ph":"day"' in r and i>2: break
    print(errs[:4]); await b.close()
asyncio.run(main()); srv.kill()
