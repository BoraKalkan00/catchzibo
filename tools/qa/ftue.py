import asyncio, subprocess, time
from playwright.async_api import async_playwright
srv=subprocess.Popen(['python3','-m','http.server','8765'],cwd=__import__('os').path.abspath(__import__('os').path.join(__import__('os').path.dirname(__file__),'..','..')),stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=await b.new_page(viewport={'width':412,'height':860}); errs=[]; pg.on('pageerror',lambda e:errs.append('P:'+str(e)[:200])); pg.on('console',lambda m: errs.append('C:'+m.text[:200]) if m.type=='error' else None)
    await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(4000)
    shots=[]
    async def snap(n):
      await pg.screenshot(path=f'/tmp/qa/t{n}.png'); shots.append(n)
      txt=await pg.evaluate("()=>[...document.querySelectorAll('button,.btn')].filter(b=>b.offsetParent).map(b=>b.textContent.trim().slice(0,24)).slice(0,8).join(' | ')")
      print(n, await pg.evaluate("()=>document.querySelector('.screen')&&document.querySelector('.screen').className"), '::', txt)
    await snap(0)
    for i in range(1,9):
      # en büyük/ilk birincil düğmeye bas
      clicked=await pg.evaluate("""()=>{const b=[...document.querySelectorAll('.btn.primary,.btn-play,.title-play,button.primary')].find(x=>x.offsetParent); if(b){b.click(); return b.textContent.trim().slice(0,30);} return null;}""")
      if not clicked:
        await pg.mouse.click(206,600)
      await pg.wait_for_timeout(4500); await snap(i)
    print('\n'.join(sorted(set(errs))[:10])); await b.close()
asyncio.run(main()); srv.kill()
