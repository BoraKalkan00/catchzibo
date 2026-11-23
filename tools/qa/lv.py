import asyncio, subprocess, time, sys
from playwright.async_api import async_playwright
srv=subprocess.Popen(['python3','-m','http.server','8765'],cwd='/home/claude/catchzibo',stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
TAG=sys.argv[1]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=await b.new_page(viewport={'width':412,'height':860})
    await pg.add_init_script('window.CZ_NOADAPT=1'); await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(2500)
    await pg.evaluate("""()=>{const d=CZ.state.data; const n=new Date(); d.login={last:n.getFullYear()*10000+(n.getMonth()+1)*100+n.getDate(),n:1}; d.lang='tr'; d.introDone=true; d.tutV=5; d.tutVer=2; d.tutorialDone=true; d.tipsOff=true; d.gfx='hi'; d.seenAt=Date.now(); d.bestNight=6; d.achv={}; ['NIGHT_1','NIGHT_5','KILL_100','RICH'].forEach(k=>d.achv[k]=1);
      const v=CZ.village.ensure(); ['hall','canteen','house','mine','bakery','goldmine','tower','forge','stable','vault','gate','cookie','elf','jail','lookout'].forEach((k,i)=>v.lv[k]=2+(i%3)); v.def=v.def||{}; v.def.t=[0,1,2,3,4,5,6,7].map(i=>({type:i%2?'cannon':'snow',lv:2})); v.def.f=[0,1,2,3,4,5,6,7].map(i=>({type:'fence',lv:2})); CZ.state.save(); location.reload();}""")
    await pg.wait_for_timeout(14000)
    hide="()=>document.querySelectorAll('.vl-coach,.toast,.achv-pop,.vl-ui').forEach(e=>e.style.visibility='hidden')"
    await pg.evaluate("()=>{const v=CZ.screens.valley.debug; v.P.x=4; v.P.z=12; v.debug.sim(3); v.debug.lvfx(5.5,14.5,4.5); v.debug.sim(0.25);}"); await pg.evaluate(hide); await pg.screenshot(path='/tmp/lv_%s_day.png'%TAG)
    await pg.evaluate("()=>{const v=CZ.screens.valley.debug; v.wave=2; v.phT=0.05; v.debug.sim(6,()=>{v.P.hp=v.P.maxHp;});}"); await pg.evaluate(hide); await pg.screenshot(path='/tmp/lv_%s_night.png'%TAG)
    await b.close()
asyncio.run(main()); srv.kill()
