import asyncio, subprocess, time
from playwright.async_api import async_playwright
srv=subprocess.Popen(['python3','-m','http.server','8765'],cwd=__import__('os').path.abspath(__import__('os').path.join(__import__('os').path.dirname(__file__),'..','..')),stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=await b.new_page(viewport={'width':412,'height':860}); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: errs.append('C:'+m.text) if m.type in ('error','warning') else None)
    await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(2500)
    await pg.evaluate("""()=>{const d=CZ.state.data; const n=new Date(); d.login={last:n.getFullYear()*10000+(n.getMonth()+1)*100+n.getDate(),n:1}; d.introDone=true; d.tutV=5; d.tutVer=2; d.tutorialDone=true; d.tipsOff=true; d.gfx='lo'; d.wood=2000; d.stone=2000; d.gold=5000; CZ.state.save(); location.reload();}""")
    await pg.wait_for_timeout(12000)
    await pg.screenshot(path="/tmp/qa/ch0.png"); print("E",errs[:3], await pg.evaluate("()=>document.querySelector(\".screen\") && document.querySelector(\".screen\").className")); V="CZ.screens.valley.debug"
    print(await pg.evaluate(f"()=>JSON.stringify({V}.debug.ch())"))
    await pg.evaluate(f"()=>{V}.debug.chTap()"); await pg.wait_for_timeout(1500)
    await pg.screenshot(path='/tmp/qa/ch1.png')
    await pg.evaluate(f"()=>{{CZ.state.data.chc.tree=(CZ.state.data.chc.tree||0)+5;}}"); await pg.wait_for_timeout(1200)
    await pg.screenshot(path='/tmp/qa/ch2.png')
    await pg.evaluate(f"()=>{V}.debug.chTap()"); await pg.wait_for_timeout(400)
    await pg.screenshot(path='/tmp/qa/ch3.png')
    print(await pg.evaluate(f"()=>JSON.stringify({V}.debug.ch())"))
    # bölüm sonu
    await pg.evaluate(f"()=>{{const C=CZ.state.data.ch; C.i=4; C.b=0; CZ.state.data.chc.night=99;}}"); await pg.wait_for_timeout(1000)
    await pg.evaluate(f"()=>{V}.debug.chTap()"); await pg.wait_for_timeout(700)
    await pg.screenshot(path='/tmp/qa/ch4.png')
    await pg.evaluate("()=>document.querySelectorAll('.modal-wrap').forEach(e=>e.remove())")
    # eşya paneli
    await pg.evaluate(f"()=>{{const v=CZ.village.ensure(); v.lv.mine=3; v.lv.canteen=2; {V}.debug.openPadV('mine');}}"); await pg.wait_for_timeout(800)
    await pg.screenshot(path='/tmp/qa/ch5.png')
    btn=pg.locator('.fu-row .btn.primary').first
    await btn.hover(); await pg.mouse.down(); await pg.wait_for_timeout(1500); await pg.mouse.up(); await pg.wait_for_timeout(500)
    print('furn', await pg.evaluate("()=>JSON.stringify(CZ.village.furn('mine'))"))
    await pg.screenshot(path='/tmp/qa/ch6.png')
    await pg.locator('.fu-tabs button').nth(1).click(); await pg.wait_for_timeout(300)
    await pg.screenshot(path='/tmp/qa/ch7.png')
    print(errs[:5]); await b.close()
asyncio.run(main()); srv.kill()
