import asyncio, subprocess, time, sys
from playwright.async_api import async_playwright
srv=subprocess.Popen(['python3','-m','http.server','8765'],cwd=__import__('os').path.abspath(__import__('os').path.join(__import__('os').path.dirname(__file__),'..','..')),stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
SP=[(20,-20)]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=await b.new_page(viewport={'width':412,'height':860}); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)[:200])); pg.on('console',lambda m: errs.append('C:'+m.text[:200]) if m.type in('error','warning') else None)
    await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(2500)
    await pg.evaluate("""()=>{const d=CZ.state.data; const n=new Date(); d.login={last:n.getFullYear()*10000+(n.getMonth()+1)*100+n.getDate(),n:1}; d.introDone=true; d.tutV=5; d.tutVer=2; d.tutorialDone=true; d.tipsOff=true; d.gfx='hi'; d.seenAt=Date.now(); d.camZ='far'; CZ.state.save(); location.reload();}""")
    await pg.wait_for_timeout(14000)
    for i,(x,z) in enumerate(SP):
      await pg.evaluate(f"()=>{{const V=CZ.screens.valley.debug; V.P.x={x}; V.P.z={z}; V.P.riding=true; V.debug.sim(1.2);}}"); await pg.wait_for_timeout(800)
      await pg.evaluate("()=>{document.querySelectorAll('.modal-wrap').forEach(e=>e.remove())}")
      await pg.screenshot(path=f'/tmp/qa/w{i}.png')
    print([e for e in errs if 'flatShading' not in e][:5]); await b.close()
asyncio.run(main()); srv.kill()
