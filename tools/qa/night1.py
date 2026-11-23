import asyncio, subprocess, time
from playwright.async_api import async_playwright
srv=subprocess.Popen(['python3','-m','http.server','8765'],cwd='/home/claude/catchzibo',stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=await b.new_page(viewport={'width':412,'height':860},has_touch=True); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
    await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(2500)
    await pg.evaluate("""()=>{const d=CZ.state.data; const n=new Date(); d.login={last:n.getFullYear()*10000+(n.getMonth()+1)*100+n.getDate(),n:1}; d.lang='tr'; d.introDone=true; d.tutV=5; d.tutVer=2; d.tutorialDone=true; d.tipsOff=true; d.gfx='hi'; d.seenAt=Date.now(); d.gold=380; d.wood=70; d.stone=60;
      const V=CZ.village.ensure(); V.def=V.def||{}; V.def.t=[{type:'snow',lv:1},null,null,null,null,null,null,null]; V.def.f=[null,null,null,null,null,null,null,null]; CZ.state.save(); location.reload();}""")
    await pg.wait_for_timeout(12000)
    await pg.evaluate("()=>{const V=CZ.screens.valley.debug; V.phT=0.05; V.debug.sim(0.5);}")
    for i in range(24):
      r=await pg.evaluate("""()=>{const V=CZ.screens.valley.debug; const J=V.debug.joy; V.debug.sim(4,()=>{ let o=null,bd=1e9; V.goblins.forEach(g=>{ if(g.dead) return; const dd=Math.hypot(g.x-V.P.x,g.z-V.P.z); if(dd<bd){bd=dd;o=g;} }); if(o&&bd>6){J.id=1;J.dx=(o.x-V.P.x)/bd;J.dy=(o.z-V.P.z)/bd;} else {J.id=null;J.dx=J.dy=0;} V.debug.autoFire(); });
        return JSON.stringify({ph:V.phase,w:V.wave,g:V.goblins.filter(g=>!g.dead).length,hp:Math.round(V.P.hp),k:V.kills,modal:[...document.querySelectorAll('.modal-wrap,.pause-menu')].map(e=>e.className).join(',')})}""")
      print(i,r); await pg.screenshot(path='/tmp/n1/n%02d.png'%i)
      if 'modal-wrap' in r: break
    print(errs[:4]); await b.close()
asyncio.run(main()); srv.kill()
