import asyncio, subprocess, time
from playwright.async_api import async_playwright
srv=subprocess.Popen(['python3','-m','http.server','8765'],cwd='/home/claude/catchzibo',stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=await b.new_page(viewport={'width':412,'height':860},has_touch=True); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
    await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(2500)
    await pg.evaluate("""()=>{const d=CZ.state.data; const n=new Date(Date.now()-86400000); d.login={last:n.getFullYear()*10000+(n.getMonth()+1)*100+n.getDate(),n:1}; d.lang='tr'; d.introDone=true; d.tutV=5; d.tutVer=2; d.tutorialDone=true; d.gfx='lo'; d.seenAt=Date.now()-20*3600000; d.bestNight=3; d.chc={night:3,kill:40};
      d.tips={build:1,night:1,skill:1,quest:1,rush:1,surv:1,mail:1,vills:1};
      const V=CZ.village.ensure(); V.lv.mine=1; V.lv.goldmine=1; V.lv.bakery=1; V.at=Date.now()-20*3600000; V.def=V.def||{}; V.def.t=[{type:'snow',lv:1},{type:'cannon',lv:1},null,null,null,null,null,null]; CZ.state.save(); location.reload();}""")
    taps=0
    for i in range(16):
      await pg.wait_for_timeout(2000 if i else 9000)
      st=await pg.evaluate("""()=>[...document.querySelectorAll('.modal-wrap,.upg-wrap,.vl-coach.on,.achv-pop,.mila-bubble,.toast')].map(e=>e.className.split(' ').slice(0,2).join('.')+':'+e.textContent.slice(0,50))""")
      await pg.screenshot(path='/tmp/rt/r%02d.png'%i); print(i,st)
      c=await pg.evaluate("""()=>{const w=document.querySelector('.modal-wrap'); if(!w) return null; const bs=[...w.querySelectorAll('.btn')].filter(b=>!b.querySelector('.ic-play')&&!/Reklam|x2|2x|Paylaş/.test(b.textContent)); const bb=bs[bs.length-1]; if(bb){bb.click(); return bb.textContent;} return 'NOBTN';}""")
      if c: taps+=1; print('  tap:',c)
    print('taps',taps,errs[:3]); await b.close()
asyncio.run(main()); srv.kill()
