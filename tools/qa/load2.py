import asyncio, subprocess, time, collections
from playwright.async_api import async_playwright
srv=subprocess.Popen(['python3','-m','http.server','8765'],cwd='/home/claude/catchzibo',stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    ctx=await b.new_context(viewport={'width':412,'height':860}); pg=await ctx.new_page()
    sizes=collections.Counter(); big=[]
    async def onresp(r):
      try:
        bd=await r.body(); u=r.url.split('8765/')[-1]; ext=u.split('?')[0].rsplit('.',1)[-1]; sizes[ext]+=len(bd); big.append((len(bd),u))
      except Exception: pass
    pg.on('response', lambda r: asyncio.ensure_future(onresp(r)))
    t0=time.time(); await pg.goto('http://localhost:8765/index.html')
    await pg.wait_for_function("()=>window.CZ&&CZ.screens&&CZ.screens.valley&&CZ.screens.valley.debug&&CZ.screens.valley.debug.running!==undefined", timeout=60000)
    t1=time.time(); await pg.wait_for_timeout(8000)
    print('valley ready s', round(t1-t0,1)); print({k:round(v/1e6,2) for k,v in sizes.most_common()}, 'total MB', round(sum(sizes.values())/1e6,2))
    for s,u in sorted(big,reverse=True)[:15]: print(round(s/1e3),'KB',u)
    await b.close()
asyncio.run(main()); srv.kill()
