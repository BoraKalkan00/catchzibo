import asyncio, subprocess, time
from playwright.async_api import async_playwright
srv=subprocess.Popen(['python3','-m','http.server','8765'],cwd=__import__('os').path.abspath(__import__('os').path.join(__import__('os').path.dirname(__file__),'..','..')),stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=await b.new_page(viewport={'width':412,'height':860}); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
    await pg.goto('http://localhost:8765/index.html')
    for i,ms in enumerate([1500,3000,9000]):
      await pg.wait_for_timeout(ms); await pg.screenshot(path=f'/tmp/qa/b{i}.png')
      print(i, await pg.evaluate("()=>document.querySelector('.screen')&&document.querySelector('.screen').className"), bool(await pg.evaluate("()=>document.querySelector('.loading-screen')")))
    print(errs[:3]); await b.close()
asyncio.run(main()); srv.kill()
