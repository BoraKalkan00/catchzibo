import asyncio, subprocess, time, sys
from playwright.async_api import async_playwright
srv=subprocess.Popen(['python3','-m','http.server','8765'],cwd='/home/claude/catchzibo',stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
LANG=sys.argv[1]
SETUP="""(L)=>{const d=CZ.state.data; const n=new Date(); d.login={last:n.getFullYear()*10000+(n.getMonth()+1)*100+n.getDate(),n:1}; d.lang=L; d.introDone=true; d.tutV=5; d.tutVer=2; d.tutorialDone=true; d.tipsOff=true; d.gfx='hi'; d.seenAt=Date.now(); d.wood=1840; d.stone=960; d.gold=12450; d.emeralds=85;
 const v=CZ.village.ensure(); ['hall','canteen','house','mine','bakery','goldmine','tower','forge','stable','vault'].forEach((k,i)=>v.lv[k]=3+(i%3)); v.furn={canteen:[3,3,2],hall:[3,2,2],mine:[2,3,1]};
 d.ch={n:1,i:2,b:0}; CZ.state.save(); location.reload();}"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=await b.new_page(viewport={'width':360,'height':640}, device_scale_factor=3); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
    await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(2500)
    await pg.evaluate(SETUP, LANG); await pg.wait_for_timeout(16000)
    V="CZ.screens.valley.debug"
    async def shot(n): await pg.evaluate("()=>document.querySelectorAll('.vl-coach,.toast,.def-panel,.achv-pop').forEach(e=>e.style.display='none'); document.querySelectorAll('.kbd').forEach(e=>e.classList.remove('kbd'))"); await pg.screenshot(path=f'/home/claude/qa/st_{LANG}_{n}.png')
    # 1 köy gündüz
    await pg.evaluate(f"()=>{{const v={V}; CZ.state.data.camZ='far'; v.P.x=3; v.P.z=11; v.P.riding=false; v.debug.sim(4);}}"); await pg.wait_for_timeout(600); await shot(1); await pg.evaluate("()=>{CZ.state.data.camZ='normal';}")
    # 2 gece sürüsü + kombo
    await pg.evaluate(f"()=>{{const v={V}; v.wave=2; v.phase='day'; v.phT=0.05; v.P.x=0; v.P.z=-24; v.debug.sim(9);}}")
    await pg.evaluate(f"()=>{{const v={V}; v.goblins.filter(o=>!o.dead).forEach((o,k)=>{{o.x=v.P.x+Math.cos(k)*4; o.z=v.P.z+Math.sin(k)*4;}}); v.debug.sim(1.2, ()=>v.debug.autoFire());}}"); await pg.wait_for_timeout(500); await shot(2); print(await pg.evaluate("()=>[...document.querySelectorAll('.valley-wrap *')].filter(x=>{const r=x.getBoundingClientRect(); return r.width>20 && r.left<225 && r.right>215 && r.top<460 && r.bottom>450 && getComputedStyle(x).display!=='none';}).map(x=>x.className+':'+x.textContent.slice(0,15)).join(' ; ')"))
    # 3 bina içi
    await pg.evaluate("()=>document.querySelectorAll('.modal-wrap').forEach(e=>e.remove())")
    await pg.evaluate(f"()=>{{const v={V}; v.phase='day'; v.phT=100; v.goblins.forEach(o=>{{o.hp=0;}}); v.debug.sim(1); v.debug.openPadV('canteen');}}"); await pg.wait_for_timeout(7000); await shot(3)
    await pg.evaluate("()=>{const c=document.querySelector('.upg-wrap'); c&&c.click();}"); await pg.wait_for_timeout(1500)
    # 4 Zibo patron
    await pg.evaluate(f"()=>{{const v={V}; v.debug.zibo(); v.debug.sim(4); if(v.zibo){{v.zibo.x=v.P.x+4; v.zibo.z=v.P.z-2;}} v.debug.sim(0.4, ()=>v.debug.autoFire());}}"); await pg.wait_for_timeout(600); await shot(4)
    # 5 orman binek
    await pg.evaluate("()=>document.querySelectorAll('.modal-wrap').forEach(e=>e.remove())")
    await pg.evaluate(f"()=>{{const v={V}; v.phase='day'; v.phT=100; v.goblins.forEach(o=>{{o.hp=0;}}); v.P.x=22; v.P.z=-22; v.P.riding=true; v.P.down=0; document.querySelectorAll('.def-down').forEach(e=>e.remove()); v.debug.sim(6,()=>{{v.P.hp=v.P.maxHp;}});}}"); await pg.wait_for_timeout(600); await shot(5)
    print(LANG, errs[:3]); await b.close()
asyncio.run(main()); srv.kill()
