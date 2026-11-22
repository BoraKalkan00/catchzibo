import asyncio, subprocess, time, sys
from playwright.async_api import async_playwright
srv=subprocess.Popen(['python3','-m','http.server','8765'],cwd=__import__('os').path.abspath(__import__('os').path.join(__import__('os').path.dirname(__file__),'..','..')),stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
B=sys.argv[1:] or ['canteen']
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=await b.new_page(viewport={'width':412,'height':860}); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: errs.append('C:'+m.text) if m.type=='error' else None)
    await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(2500)
    await pg.evaluate("""()=>{const d=CZ.state.data; const n=new Date(); d.login={last:n.getFullYear()*10000+(n.getMonth()+1)*100+n.getDate(),n:1}; d.introDone=true; d.tutV=5; d.tutVer=2; d.tutorialDone=true; d.tipsOff=true; d.gfx='hi'; d.seenAt=Date.now(); d.wood=5000; d.stone=5000; d.gold=9000;
      const v=CZ.village.ensure(); v.furn=v.furn||{}; Object.keys(CZ.village.FX).forEach(k=>{v.lv[k]=5; v.furn[k]=[3,2,4];}); v.furn.hall=[4,3,0]; v.furn.jail=[2,3,1]; CZ.state.save(); location.reload();}""")
    await pg.wait_for_timeout(13000)
    for i,id in enumerate(B):
      await pg.evaluate(f"()=>CZ.screens.valley.debug.debug.openPadV('{id}')"); await pg.wait_for_timeout(7000)
      await pg.screenshot(path=f'/tmp/qa/ins_{id}.png'); print(await pg.evaluate("()=>{const V=CZ.screens.valley.debug; const c=V.camera.position; return JSON.stringify([c.x,c.y,c.z, V.debug.ins(), V.P.x, V.P.z])}"))
      await pg.evaluate("()=>{const c=document.querySelector('.upg-wrap'); c && c.click();}"); await pg.wait_for_timeout(1200)
    await pg.screenshot(path='/tmp/qa/ins_after.png')
    print(errs[:4]); await b.close()
asyncio.run(main()); srv.kill()
