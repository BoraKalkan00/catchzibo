import asyncio, subprocess, time, sys
from playwright.async_api import async_playwright
srv=subprocess.Popen(['python3','-m','http.server','8765'],cwd=__import__('os').path.abspath(__import__('os').path.join(__import__('os').path.dirname(__file__),'..','..')),stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
async def shot(p,mode):
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=await b.new_page(viewport={'width':412,'height':860}); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(2500)
    await pg.evaluate("""(m)=>{const d=CZ.state.data; const n=new Date(); d.login={last:n.getFullYear()*10000+(n.getMonth()+1)*100+n.getDate(),n:1}; d.introDone=true; d.tutV=5; d.tutVer=2; d.tutorialDone=true; d.tipsOff=true; d.gfx=m; d.camZ='normal'; CZ.state.save(); location.reload();}""",mode)
    await pg.wait_for_timeout(14000)
    await pg.evaluate("()=>{document.querySelectorAll('.lg-modal,.vl-coach,.modal').forEach(e=>e.remove())}")
    await pg.screenshot(path=f'/tmp/qa/gfx_{mode}.png'); print(mode,errs[:3]); await b.close()
async def main():
  async with async_playwright() as p:
    for m in sys.argv[1:]: await shot(p,m)
asyncio.run(main()); srv.kill()
