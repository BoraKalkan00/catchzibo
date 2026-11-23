import asyncio, subprocess, time
from playwright.async_api import async_playwright
srv=subprocess.Popen(['python3','-m','http.server','8765'],cwd='/home/claude/catchzibo',stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=await b.new_page(viewport={'width':412,'height':860},has_touch=True); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(2500)
    await pg.evaluate("""()=>{const d=CZ.state.data; const n=new Date(); d.login={last:n.getFullYear()*10000+(n.getMonth()+1)*100+n.getDate(),n:1}; d.lang='tr'; d.introDone=true; d.tutV=5; d.tutVer=2; d.tutorialDone=true; d.tipsOff=true; d.gfx='hi'; d.seenAt=Date.now(); d.gold=4000; d.wood=2000; d.stone=1500; d.bestNight=2; d.chc={night:2}; d.achv={NIGHT_1:1};
      const V=CZ.village.ensure(); V.def=V.def||{}; V.def.t=[{type:'snow',lv:1},{type:'cannon',lv:1},null,null,null,null,null,null]; V.def.f=[null,null,null,null,null,null,null,null]; CZ.state.save(); location.reload();}""")
    await pg.wait_for_timeout(13000)
    await pg.evaluate("()=>{const V=CZ.screens.valley.debug; V.debug.sim(2.5);}")
    await pg.screenshot(path='sg1.png')
    # binaya dokun: kule 0'ın ekran konumu
    xy=await pg.evaluate("()=>{const V=CZ.screens.valley.debug; const p=V.pads? V.pads.find(q=>q.kind==='t'&&q.i===0):null; const P=CZ.screens.valley.debug.pads||[]; const r=document.querySelector('canvas').getBoundingClientRect(); for(const q of P){ if(q.kind!=='t'||!q.g) continue; const v=new (q.g.position.constructor)(q.g.position.x,1.5,q.g.position.z); v.project(V.camera); const xy=[r.left+(v.x+1)/2*r.width, r.top+(1-v.y)/2*r.height]; if(xy[0]>20&&xy[0]<390&&xy[1]>150&&xy[1]<700) return xy;} return null}")
    print('tower xy',xy)
    xy2=await pg.evaluate("()=>{const V=CZ.screens.valley.debug; const q=V.pads.find(q=>q.kind==='t'&&q.i===1); V.P.x=q.x-2; V.P.z=q.z+4; V.debug.sim(1.5); const v=new (q.g.position.constructor)(q.x,1.6,q.z); v.project(V.camera); const r=document.querySelector('canvas').getBoundingClientRect(); return [r.left+(v.x+1)/2*r.width, r.top+(1-v.y)/2*r.height]}")
    print(xy2, await pg.evaluate('([x,y])=>{const V=CZ.screens.valley.debug; return [V.debug.padAt(x,y), document.elementFromPoint(x,y).className]}', xy2))
    await pg.screenshot(path='sg3.png')
    for xy in [[300,480],xy2]:
      await pg.mouse.click(xy[0],xy[1]); await pg.wait_for_timeout(900); await pg.screenshot(path='sg2_%d.png'%int(xy[0]))
      print(await pg.evaluate("()=>{const e=document.querySelector('.upg-wrap, .modal-wrap, .upg-sheet, .upg-card'); const r=e&&e.textContent.slice(0,60); if(e) e.remove(); const V=CZ.screens.valley.debug; V.paused=false; return r}"))
    print(await pg.evaluate("()=>{const V=CZ.screens.valley.debug; return V.pads.filter(q=>q.kind==='t'&&q.g).map(q=>[q.i, !!q.mark, q.mark&&q.mark.position.y, q.mk])}"))
    print(errs[:3]); await b.close()
asyncio.run(main()); srv.kill()
