import asyncio, subprocess, time
from playwright.async_api import async_playwright
srv=subprocess.Popen(['python3','-m','http.server','8765'],cwd='/home/claude/catchzibo',stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=await b.new_page(viewport={'width':412,'height':860}); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(2500)
    await pg.evaluate("""()=>{const d=CZ.state.data; const n=new Date(); d.login={last:n.getFullYear()*10000+(n.getMonth()+1)*100+n.getDate(),n:1}; d.lang='tr'; d.introDone=true; d.tutV=5; d.tutVer=2; d.tutorialDone=true; d.tipsOff=true; d.gfx='lo'; d.seenAt=Date.now(); d.gold=500;d.wood=900;d.stone=900;d.food=200;d.iron=50; CZ.state.save(); location.reload();}""")
    await pg.wait_for_timeout(12000)
    print(await pg.evaluate("()=>{const V=CZ.screens.valley.debug; V.ordTo=0; V.ordWas=false; const ot=CZ.ui.toast; CZ.ui.toast=x=>{window.__t=x; ot(x);}; V.debug.sim(3); CZ.state.data.wood+=1; for(let i=0;i<25;i++) V.debug.sim(0.05); for(let i=0;i<30;i++) V.debug.sim(0.1); const o=document.querySelector('.vl-orders'); const r=o.getBoundingClientRect(); return [V.ordTo, V.ordWas, window.__t, CZ.orders.ready(), o.style.display, getComputedStyle(o).display, r.x,r.y,r.width,r.height, o.parentElement.className]}"))
    await pg.screenshot(path='ord1.png')
    await b.close()
asyncio.run(main()); srv.kill()
