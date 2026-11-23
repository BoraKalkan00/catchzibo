import asyncio, subprocess, time
from playwright.async_api import async_playwright
srv=subprocess.Popen(['python3','-m','http.server','8765'],cwd='/home/claude/catchzibo',stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=await b.new_page(viewport={'width':412,'height':860},has_touch=True); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
    await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(2500)
    await pg.evaluate("""()=>{const d=CZ.state.data; const n=new Date(); d.login={last:n.getFullYear()*10000+(n.getMonth()+1)*100+n.getDate(),n:1}; d.lang='tr'; d.introDone=true; d.tutV=5; d.tutVer=2; d.tutorialDone=true; d.tipsOff=true; d.gfx='lo'; d.seenAt=Date.now(); d.bestNight=1;
      const P=['wood']; d.surv={n:1,list:P.map((pr,i)=>({id:'t'+i,name:'Rudi',g:'m',ty:0,prof:pr,job:pr,rar:0,st:{loy:5,str:6,spd:6,int:5,fit:5},room:1,days:0,happy:60,ate:true,story:0,joined:true})),mail:[]};
      const V=CZ.village.ensure(); V.def=V.def||{}; V.def.t=[{type:'snow',lv:1},{type:'cannon',lv:1},null,null,null,null,null,null]; V.def.f=[{type:'fence',lv:1},{type:'fence',lv:1},null,null,null,null,null,null]; CZ.state.save(); location.reload();}""")
    await pg.wait_for_timeout(12000)
    for i in range(8):
      r=await pg.evaluate("""()=>{const V=CZ.screens.valley.debug, d=CZ.state.data; d.chc.night=(d.chc.night||0)+1; d.chc.kill=(d.chc.kill||0)+20; V.debug.sim(5); return JSON.stringify({ch:d.ch, gold:d.gold|0, modal:[...document.querySelectorAll('.modal-wrap')].map(e=>e.className).join(','), strip:document.querySelector('.vl-chap')&&document.querySelector('.vl-chap').textContent})}""")
      print(i,r); await pg.screenshot(path='/tmp/ch%d.png'%i)
      if 'modal-wrap' in r: break
    print(errs[:3]); await b.close()
asyncio.run(main()); srv.kill()
