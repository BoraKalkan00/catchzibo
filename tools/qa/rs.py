import asyncio, subprocess, time
from playwright.async_api import async_playwright
srv=subprocess.Popen(['python3','-m','http.server','8765'],cwd='/home/claude/catchzibo',stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=await b.new_page(viewport={'width':412,'height':760},has_touch=True); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(2500)
    await pg.evaluate("""()=>{window.CZ_NOADAPT=1;const d=CZ.state.data; const n=new Date(); d.login={last:n.getFullYear()*10000+(n.getMonth()+1)*100+n.getDate(),n:1}; d.lang='tr'; d.introDone=false; d.introSeen=true; d.tutV=0; d.tutVer=2; d.tutorialDone=true; d.tipsOff=true; d.gfx='hi'; d.seenAt=Date.now(); d.gold=7500; d.wood=1400; d.stone=900; d.gems=49; d.bestNight=0; d.achv={NIGHT_1:1};
      const V=CZ.village.ensure();  CZ.state.save(); location.reload();}""")
    await pg.wait_for_timeout(13000)
    print(await pg.evaluate('()=>[CZ.state.data.introDone, !!document.querySelector(".cine-bars"), document.querySelector(".vl-time").textContent]'))
    import math
    for i,(x,z) in enumerate([(math.cos(.3)*70,math.sin(.3)*70),(math.cos(.3+.628)*74,math.sin(.3+.628)*74),(math.cos(.3+1.256)*76,math.sin(.3+1.256)*76)]):
      await pg.evaluate("([x,z])=>{const V=CZ.screens.valley.debug; const r=Math.hypot(x,z); V.P.x=x; V.P.z=z; V.debug.sim(0.3); const j=V.debug.joy; j.id=99; V.debug.sim(0.1,()=>{j.id=99; j.dx=Math.sign(x)*.8; j.dy=Math.sign(z)*.8;}); j.id=null; j.dx=j.dy=0;}",[x,z])
      await pg.wait_for_timeout(400); await pg.screenshot(path='/tmp/rs%d.png'%i)
    print(errs[:3]); await b.close()
asyncio.run(main()); srv.kill()
