import asyncio, subprocess, time
from playwright.async_api import async_playwright
srv=subprocess.Popen(['python3','-m','http.server','8765'],cwd=__import__('os').path.abspath(__import__('os').path.join(__import__('os').path.dirname(__file__),'..','..')),stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=await b.new_page(viewport={'width':412,'height':860}); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)[:300])); pg.on('console',lambda m: errs.append('C:'+m.text[:200]) if m.type=='error' else None)
    await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(2500)
    await pg.evaluate("""()=>{const d=CZ.state.data; const n=new Date(); d.login={last:n.getFullYear()*10000+(n.getMonth()+1)*100+n.getDate(),n:1}; d.introDone=true; d.tutV=5; d.tutVer=2; d.tutorialDone=true; d.tipsOff=true; d.gfx='lo'; d.seenAt=Date.now(); d.gold=3000; CZ.state.save(); location.reload();}""")
    await pg.wait_for_timeout(11000)
    V="CZ.screens.valley.debug"
    await pg.evaluate(f"()=>{V}.debug.zibo()"); await pg.evaluate(f"()=>{V}.debug.sim(1)")
    print(await pg.evaluate(f"()=>{{const v={V}; return JSON.stringify({{z:!!v.zibo, hp:v.zibo&&v.zibo.hp, w:v.wave}})}}"))
    # Zibo yanına gelsin, zT bitince ateş at
    await pg.evaluate(f"()=>{{const v={V}; v.zibo.x=v.P.x+6; v.zibo.z=v.P.z; v.zibo.zT=0.1; v.debug.sim(2.5);}}")
    await pg.wait_for_timeout(300); await pg.screenshot(path='/tmp/qa/z1.png')
    print('fires', await pg.evaluate(f"()=>{V}.debug.fires()"))
    # yangına koş
    await pg.evaluate(f"()=>{{const v={V}; const s=CZ.VB.map(b=>b.id).find(id=>CZ.village.lv(id)>0); }}")
    await pg.evaluate(f"""()=>{{const v={V}; v.debug.sim(0.1); }}""")
    # Zibo'yu yen
    await pg.evaluate(f"()=>{{const v={V}; v.zibo.hp=1; v.zibo.x=v.P.x+1.5; v.zibo.z=v.P.z; v.debug.sim(1.5, ()=>v.debug.autoFire());}}")
    await pg.wait_for_timeout(400); await pg.screenshot(path='/tmp/qa/z2.png')
    print(await pg.evaluate("()=>JSON.stringify({jail:CZ.state.data.ziboJail})"), errs[:4])
    await b.close()
asyncio.run(main()); srv.kill()
