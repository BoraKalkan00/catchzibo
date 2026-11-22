import asyncio, subprocess, time, base64, json
from playwright.async_api import async_playwright
srv=subprocess.Popen(['python3','-m','http.server','8765'],cwd=__import__('os').path.abspath(__import__('os').path.join(__import__('os').path.dirname(__file__),'..','..')),stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=await b.new_page(viewport={'width':412,'height':900}); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(3000)
    await pg.evaluate("""()=>{const d=CZ.state.data; const n=new Date(); d.login={last:n.getFullYear()*10000+(n.getMonth()+1)*100+n.getDate(),n:1}; d.introDone=true; d.tutV=5; d.tutVer=2; d.tutorialDone=true; d.tipsOff=true; CZ.state.save(); location.reload();}""")
    await pg.wait_for_timeout(10000)
    res=await pg.evaluate("""()=>{const V=CZ.screens.valley.debug; const out=[]; const P=['wood','miner','cook','hunter','builder','healer'];
      P.forEach((pr,pi)=>['m','f'].forEach(g=>[0,1].forEach(ty=>{ const k=V.debug.vLook({g,prof:pr,ty,hair:(pi*3+ty*2+(g==='f'?1:0))%7}); out.push([pr,g,ty,CZ.kk.portrait(k,'front')]); }))); return out;}""")
    for pr,g,ty,u in res: open(f'/home/claude/por/v_{pr}_{g}{ty}.png','wb').write(base64.b64decode(u.split(',')[1]))
    print(len(res), errs[:3]); await b.close()
asyncio.run(main()); srv.kill()
