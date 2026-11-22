import asyncio, subprocess, time
from playwright.async_api import async_playwright
srv=subprocess.Popen(['python3','-m','http.server','8765'],cwd=__import__('os').path.abspath(__import__('os').path.join(__import__('os').path.dirname(__file__),'..','..')),stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=await b.new_page(viewport={'width':412,'height':860}); errs=[]; pg.on('pageerror',lambda e:errs.append('P:'+str(e)[:300])); pg.on('console',lambda m: errs.append('C:'+m.text[:300]) if m.type=='error' else None)
    await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(5000)
    await pg.screenshot(path='/tmp/qa/s0.png')
    print('first screen:', await pg.evaluate("()=>document.querySelector('.screen')&&document.querySelector('.screen').className"))
    await pg.evaluate("""()=>{const d=CZ.state.data; const n=new Date(); d.login={last:n.getFullYear()*10000+(n.getMonth()+1)*100+n.getDate(),n:1}; d.introDone=true; d.tutV=5; d.tutVer=2; d.tutorialDone=true; d.tipsOff=true; d.gfx='lo'; d.seenAt=Date.now(); d.wood=3000; d.stone=3000; d.gold=5000; CZ.state.save(); location.reload();}""")
    await pg.wait_for_timeout(11000)
    # 6 dakikalık oyun: rastgele yürü, sürekli ateş, binaya dokun, gündüz/gece geç
    for i in range(16):
      r=await pg.evaluate("""(i)=>{const V=CZ.screens.valley.debug; if(!V) return 'noV';
        const rb=document.querySelector('.raid-rep .btn.small'); if(rb) rb.click(); document.querySelectorAll('.modal-wrap .btn').forEach(b=>{ if(/Devam|Continue|Topla|Collect|Close|Kapat/i.test(b.textContent)) b.click(); }); if(V.phase==='day' && V.phT>20) V.phT=20;
        const a=i*1.3; V.debug.sim(30, ()=>{ const J=V.debug.joy; J.id=1; J.dx=Math.cos(a)*40; J.dy=Math.sin(a)*40; V.debug.autoFire(); });
        return JSON.stringify({ph:V.phase,w:V.wave,g:V.goblins.length,hp:Math.round(V.P.hp),k:V.kills,paused:V.paused});}""", i)
      print(i, r)
    await pg.screenshot(path='/tmp/qa/s1.png')
    print('\n'.join(sorted(set(errs))[:15])); await b.close()
asyncio.run(main()); srv.kill()
