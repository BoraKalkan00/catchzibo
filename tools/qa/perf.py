import asyncio, subprocess, time
from playwright.async_api import async_playwright
srv=subprocess.Popen(['python3','-m','http.server','8765'],cwd='/home/claude/catchzibo',stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    for gfx in ['lo','hi']:
      pg=await b.new_page(viewport={'width':412,'height':860})
      await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(2500)
      await pg.evaluate("""(g)=>{const d=CZ.state.data; const n=new Date(); d.login={last:n.getFullYear()*10000+(n.getMonth()+1)*100+n.getDate(),n:1}; d.lang='tr'; d.introDone=true; d.tutV=5; d.tutVer=2; d.tutorialDone=true; d.tipsOff=true; d.gfx=g; d.seenAt=Date.now(); d.bestNight=6;
        const V=CZ.village.ensure(); Object.keys(V.lv).forEach(k=>V.lv[k]=Math.max(V.lv[k],2)); V.def=V.def||{}; V.def.t=[0,1,2,3,4,5,6,7].map(i=>({type:i%2?'cannon':'snow',lv:2})); V.def.f=[0,1,2,3,4,5,6,7].map(i=>({type:'fence',lv:2})); CZ.state.save(); location.reload();}""", gfx)
      await pg.wait_for_timeout(13000)
      day=await pg.evaluate("()=>{const V=CZ.screens.valley.debug; V.debug.sim(1); return V.debug.info()}")
      ngt=await pg.evaluate("()=>{const V=CZ.screens.valley.debug; V.wave=8; V.phT=0.05; V.debug.sim(25,()=>{V.P.hp=V.P.maxHp;}); return Object.assign(V.debug.info(),{gob:V.goblins.filter(g=>!g.dead).length})}")
      far=await pg.evaluate("()=>{const V=CZ.screens.valley.debug; V.P.x=40; V.P.z=30; V.debug.sim(2,()=>{V.P.hp=V.P.maxHp;}); return V.debug.info()}")
      print(gfx,'DAY',day); print(gfx,'NIGHT',ngt); print(gfx,'FOREST',far)
      await pg.screenshot(path='/tmp/perf_%s.png'%gfx); await pg.close()
    await b.close()
asyncio.run(main()); srv.kill()
