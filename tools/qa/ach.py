import asyncio, subprocess, time
from playwright.async_api import async_playwright
srv=subprocess.Popen(['python3','-m','http.server','8765'],cwd='/home/claude/catchzibo',stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=await b.new_page(viewport={'width':412,'height':860}); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(2500)
    await pg.evaluate("""()=>{const d=CZ.state.data; const n=new Date(); d.login={last:n.getFullYear()*10000+(n.getMonth()+1)*100+n.getDate(),n:1}; d.lang='tr'; d.introDone=true; d.tutV=5; d.tutVer=2; d.tutorialDone=true; d.tipsOff=true; d.gfx='lo'; d.seenAt=Date.now(); d.bestNight=1; d.chc={kill:60,tree:120}; CZ.state.save(); location.reload();}""")
    await pg.wait_for_timeout(12000)
    print(await pg.evaluate("()=>{const V=CZ.screens.valley.debug; V.debug.sim(2.5); return [CZ.state.data.achv, CZ.state.data.emeralds]}"))
    await pg.wait_for_timeout(600); await pg.screenshot(path='ach1.png')
    await pg.evaluate("()=>{CZ.state.data.chc.kill=100; CZ.state.data.ziboJail=1; CZ.state.data.bestNight=5; CZ.screens.valley.debug.debug.sim(2.5);}")
    await pg.wait_for_timeout(600); await pg.screenshot(path='ach2.png')
    await pg.evaluate("()=>{CZ.screens.valley.debug.pause();}"); await pg.wait_for_timeout(800); await pg.screenshot(path='ach3.png')
    await pg.evaluate("()=>{[...document.querySelectorAll('.pause-card .btn')].find(b=>b.textContent.includes('🏆')).click();}"); await pg.wait_for_timeout(800); await pg.screenshot(path='ach4.png')
    print(errs[:3]); await b.close()
asyncio.run(main()); srv.kill()
