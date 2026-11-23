import asyncio, subprocess, time, base64
from playwright.async_api import async_playwright
s1=subprocess.Popen(['python3','-m','http.server','8765'],cwd='/home/claude/catchzibo',stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
s2=subprocess.Popen(['python3','-m','http.server','8766'],cwd='/tmp/cz',stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
K=['goblin','zibo','mila','girl','santa','hero_rudi','knight','elf']
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    for port,tag in [(8765,'a'),(8766,'b')]:
      pg=await b.new_page(viewport={'width':412,'height':860})
      await pg.goto('http://localhost:%d/index.html'%port); await pg.wait_for_timeout(9000)
      await pg.evaluate("(K)=>CZ.kk.needMX(K)", K); await pg.wait_for_timeout(4000)
      for k in K:
        u=await pg.evaluate("(k)=>{const r=CZ.kk.portrait(k,'front'); return typeof r==='string'?r:(r&&r.src)||null}", k)
        if u: open('/tmp/pc/%s_%s.png'%(k,tag),'wb').write(base64.b64decode(u.split(',')[1]))
      await pg.close()
    await b.close()
asyncio.run(main()); s1.kill(); s2.kill()
