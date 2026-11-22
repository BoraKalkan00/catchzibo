import asyncio, subprocess, time
from playwright.async_api import async_playwright
srv=subprocess.Popen(['python3','-m','http.server','8765'],cwd=__import__('os').path.abspath(__import__('os').path.join(__import__('os').path.dirname(__file__),'..','..')),stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=await b.new_page(viewport={'width':412,'height':860}); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: errs.append('C:'+m.text) if m.type=='error' else None)
    await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(2500)
    await pg.evaluate("""()=>{const d=CZ.state.data; const n=new Date(); d.login={last:n.getFullYear()*10000+(n.getMonth()+1)*100+n.getDate(),n:1}; d.introDone=true; d.tutV=5; d.tutVer=2; d.tutorialDone=true; d.tipsOff=true; d.gfx='lo'; d.seenAt=Date.now(); CZ.state.save(); location.reload();}""")
    await pg.wait_for_timeout(12000)
    print(await pg.evaluate("()=>{const V=CZ.screens.valley.debug; V.wave=3; V.phase='day'; V.phT=0.05; return Object.keys(V.debug).join(',')}"))
    await pg.wait_for_timeout(900); await pg.screenshot(path='/tmp/qa/n1.png')
    await pg.evaluate("()=>CZ.screens.valley.debug.debug.sim(4)"); await pg.wait_for_timeout(600); await pg.screenshot(path='/tmp/qa/n2.png'); print(await pg.evaluate("()=>{const e=document.querySelector('.vl-ncard'); if(!e) return 'none'; const cs=getComputedStyle(e); return [e.className, cs.display, cs.opacity, cs.zIndex, e.parentNode.className, e.getBoundingClientRect().top, e.textContent].join('|')}"))
    print(await pg.evaluate("()=>{const V=CZ.screens.valley.debug; return JSON.stringify({ph:V.phase,nTot:V.nTot,nSp:V.nSp,g:V.goblins.length})}"))
    await pg.evaluate("()=>{const e=document.querySelector('.vl-ncard'); e.style.animation='none'; e.classList.add('on');}"); await pg.wait_for_timeout(200); await pg.screenshot(path='/tmp/qa/n4.png'); await pg.evaluate("()=>{const e=document.querySelector('.vl-ncard'); e.classList.remove('on'); e.style.animation='';}")
    # goblinleri oyuncunun yanına getirip öldür
    for i in range(3):
      await pg.evaluate("()=>{const V=CZ.screens.valley.debug; V.goblins.filter(o=>!o.dead).slice(0,3).forEach((o,k)=>{o.x=V.P.x+1.5+k*0.3; o.z=V.P.z+0.5; o.hp=0.5;}); V.debug.sim(0.6, ()=>V.debug.autoFire && V.debug.autoFire());}")
      await pg.wait_for_timeout(300)
    await pg.screenshot(path='/tmp/qa/n3.png')
    print(await pg.evaluate("()=>{const V=CZ.screens.valley.debug; return JSON.stringify({cmb:V.cmb,kills:V.kills})}"))
    print(errs[:4]); await b.close()
asyncio.run(main()); srv.kill()
