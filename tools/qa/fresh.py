import asyncio, subprocess, time
from playwright.async_api import async_playwright
srv=subprocess.Popen(['python3','-m','http.server','8765'],cwd='/home/claude/catchzibo',stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=await b.new_page(viewport={'width':412,'height':860},locale='tr-TR',has_touch=True); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
    await pg.goto('http://localhost:8765/index.html'); 
    for k in range(6):
      await pg.wait_for_timeout(2500); await pg.screenshot(path='/tmp/fr/a%d.png'%k)
    # prologue: tap through like a player
    for k in range(10):
      await pg.mouse.click(206,700); await pg.wait_for_timeout(2500); await pg.screenshot(path='/tmp/fr/b%d.png'%k)
      if await pg.evaluate("()=>CZ.screens.valley&&CZ.screens.valley.debug&&!CZ.screens.valley.debug.cine&&CZ.state.data.introDone"): break
    gt=0
    for i in range(16):
      r=await pg.evaluate("""()=>{const V=CZ.screens.valley.debug, d=CZ.state.data; if(!V) return 'noV';
        const up=document.querySelector('.upg-wrap'); if(up){ const bb=[...up.querySelectorAll('.btn')].find(b=>/İnşa|Yükselt|Eksik/.test(b.textContent)); if(bb) bb.click(); }
        V.debug.sim(4, ()=>{ const tg=V.tut.target(); const J=V.debug.joy;
          if(tg){ const dx=tg.x-V.P.x, dz=tg.z-V.P.z, L=Math.hypot(dx,dz)||1; if(L>1.6){J.id=1;J.dx=dx/L;J.dy=dz/L;} else {J.id=null;J.dx=J.dy=0;} } else { J.id=null; J.dx=J.dy=0; }
          V.debug.autoFire(); });
        return JSON.stringify({tut:d.tutV||0,ph:V.phase,phT:Math.round(V.phT),q:(document.querySelector('.quest')||{}).textContent||'-',modal:[...document.querySelectorAll('.modal-wrap,.upg-wrap,.pause-menu')].map(e=>e.className).join(',')});}""")
      gt+=4; print(gt,r)
      await pg.screenshot(path='/tmp/fr/c%02d.png'%i)
      pass
    print(errs[:5]); await b.close()
asyncio.run(main()); srv.kill()
