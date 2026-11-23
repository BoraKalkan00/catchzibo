import asyncio, subprocess, time
from playwright.async_api import async_playwright
srv=subprocess.Popen(['python3','-m','http.server','8765'],cwd='/home/claude/catchzibo',stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=await b.new_page(viewport={'width':412,'height':860},has_touch=True); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
    await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(2500)
    await pg.evaluate("""()=>{const d=CZ.state.data; const n=new Date(); d.login={last:n.getFullYear()*10000+(n.getMonth()+1)*100+n.getDate(),n:1}; d.lang='tr'; d.introDone=true; d.tutV=5; d.tutVer=2; d.tutorialDone=true; d.gfx='lo'; d.seenAt=Date.now(); d.bestNight=2;
      const V=CZ.village.ensure(); V.def=V.def||{}; V.def.t=[{type:'snow',lv:1},{type:'cannon',lv:1},null,null,null,null,null,null]; CZ.state.save(); location.reload();}""")
    await pg.wait_for_timeout(12000)
    await pg.evaluate("()=>{const V=CZ.screens.valley.debug; V.wave=2; V.phT=0.05; let n=0; while(n<200){ V.debug.sim(1,()=>{V.P.hp=V.P.maxHp; V.debug.autoFire();}); n++; if(n>5&&V.phase==='day') break; }}")
    taps=0
    for i in range(14):
      st=await pg.evaluate("""()=>{const V=CZ.screens.valley.debug; V.debug.sim(0.5); const m=[...document.querySelectorAll('.modal-wrap,.upg-wrap,.pause-menu,.vl-coach.on,.achv-pop,.mila-bubble,.toast')].map(e=>e.className.split(' ').slice(0,2).join('.')+':'+e.textContent.slice(0,40)); return m;}""")
      await pg.screenshot(path='/tmp/ne/e%02d.png'%i)
      print(i, st)
      clicked=await pg.evaluate("""()=>{const w=document.querySelector('.modal-wrap'); if(!w) { const c=document.querySelector('.vl-coach.on .btn'); if(c){c.click(); return 'coach';} return null;} const bs=[...w.querySelectorAll('.btn')].filter(b=>!b.querySelector('.ic-play')&&!/Reklam|x2|Paylaş/.test(b.textContent)); const bb=bs[bs.length-1]||w.querySelector('.btn'); if(bb){ bb.click(); return bb.textContent;} return null;}""")
      if clicked: taps+=1; print('  tap:',clicked)
      await pg.wait_for_timeout(700)
    print('taps',taps, errs[:3]); await b.close()
asyncio.run(main()); srv.kill()
