import asyncio, subprocess, time, sys
from playwright.async_api import async_playwright
srv=subprocess.Popen(['python3','-m','http.server','8765'],cwd='/home/claude/catchzibo',stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
SKILL=float(sys.argv[1]) if len(sys.argv)>1 else 0.5
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=await b.new_page(viewport={'width':412,'height':860},has_touch=True); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
    await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(2500)
    await pg.evaluate("""()=>{const d=CZ.state.data; const n=new Date(); d.login={last:n.getFullYear()*10000+(n.getMonth()+1)*100+n.getDate(),n:1}; d.lang='tr'; d.introDone=true; d.tutV=5; d.tutVer=2; d.tutorialDone=true; d.tipsOff=true; d.gfx='lo'; d.seenAt=Date.now(); d.gold=380; d.wood=70; d.stone=60;
      const V=CZ.village.ensure(); V.def=V.def||{}; V.def.t=[{type:'snow',lv:1},null,null,null,null,null,null,null]; V.def.f=[null,null,null,null,null,null,null,null]; CZ.state.save(); location.reload();}""")
    await pg.wait_for_timeout(12000)
    await pg.evaluate("""()=>{window.__bot=(V,skill,mode)=>{ const J=V.debug.joy, P=V.P; const alive=V.goblins.filter(g=>!g.dead);
      if(V.phase==='night'){ let o=null,bd=1e9; alive.forEach(g=>{const dd=Math.hypot(g.x-P.x,g.z-P.z); if(dd<bd){bd=dd;o=g;}});
        const home=Math.hypot(P.x,P.z); if(o&&bd>7&&home<30){J.id=1;J.dx=(o.x-P.x)/bd;J.dy=(o.z-P.z)/bd;} else if(home>=30){J.id=1;J.dx=-P.x/home;J.dy=-P.z/home;} else {J.id=null;J.dx=J.dy=0;}
        if(Math.random()<skill) V.debug.autoFire(); return; }
      const near=(arr)=>{let b=null,bd=1e9; arr.forEach(o=>{ if(!o.alive) return; const dd=Math.hypot(o.x-P.x,o.z-P.z); if(dd<bd){bd=dd;b=o;} }); return b;};
      const tg=near(mode?V.debug.trees:V.debug.rocks); if(tg){ const dx=tg.x-P.x, dz=tg.z-P.z, L=Math.hypot(dx,dz)||1; if(L>1.8){J.id=1;J.dx=dx/L;J.dy=dz/L;} else {J.id=null;J.dx=J.dy=0;} } V.debug.autoFire(); };}""")
    for night in range(1,9):
      # gündüz: 60 sn topla, sonra parası yeten en ucuz şeyi kur (oyuncu gibi kartla)
      r=await pg.evaluate("""(sk)=>{const V=CZ.screens.valley.debug, d=CZ.state.data; document.querySelectorAll('.modal-wrap').forEach(e=>{const b=[...e.querySelectorAll('.btn')].find(b=>/Gündüze|Devam/.test(b.textContent)); if(b) b.click(); else e.remove();}); V.paused=false;
        for(let k=0;k<60;k++) V.debug.sim(1,()=>__bot(V,sk,k%20<10));
        /* gerçek zaman: bir gün+gece ≈ 3.5 dk; testte Date.now ilerlemiyor → işleri o kadar öne al */
        ['t','f'].forEach(k=>(d.vil.def[k]||[]).forEach(it=>{ if(it&&it.job) it.job.end-=210000; })); try{ const VV=CZ.village.ensure(); if(VV.job) VV.job.end-=210000; }catch(e){}
        for(let k=0;k<3;k++) V.debug.sim(1,()=>__bot(V,sk,1));
        const built=[]; for(let rep=0;rep<6;rep++){ const pads=V.pads.filter(q=>q.mark); for(const q of pads){ const L=V.left(q)||[]; const TV={wood:0.4,stone:0.67,plank:2.5,brick:4,iron:9}; const mg=Math.ceil(L.reduce((a,x)=>x.r==='gold'?a:a+Math.max(0,x.n-(d[x.r]||0))*(TV[x.r]||1)*1.3,0)); const gN=(L.find(x=>x.r==='gold')||{}).n||0; if(L.length && (d.gold||0)>=mg+gN+150){ d.gold-=mg; L.forEach(x=>{ if(x.r!=='gold') d[x.r]=Math.max(d[x.r]||0,x.n); }); L.forEach(x=>{d[x.r]-=x.n;}); const pd=(d.vil.def.pp=d.vil.def.pp||{}); V.debug.complete(q); built.push(q.kind+(q.i!=null?q.i:q.id)); break; } } }
        const opts=V.pads.filter(q=>q.mark).map(q=>{const L=V.left(q)||[]; return q.kind+(q.i!=null?q.i:q.id)+':'+L.map(x=>x.n).join('/');}); return JSON.stringify({res:[d.wood|0,d.stone|0,d.gold|0],built,opts:opts.slice(0,8),hall:CZ.village.lv('hall'),tl:(d.vil.def.t||[]).map(x=>x?x.lv+(x.job?'*':''):0).join('')});}""", SKILL)
      print('DAY',night,r)
      r=await pg.evaluate("""(sk)=>{const V=CZ.screens.valley.debug, d=CZ.state.data; V.phT=0.05; let zb=0,fmax=0,n=0, hpMin=99, maxG=0, k0=V.kills; const g0=d.gold;
        while(n<300){ V.debug.sim(1,()=>{ __bot(V,sk,0); hpMin=Math.min(hpMin,V.P.hp); if(V.zibo) zb=1; fmax=Math.max(fmax,V.debug.fires?V.debug.fires():0); if(n%6===0&&V.wave===5) window.__shots=(window.__shots||0)+1; maxG=Math.max(maxG,V.goblins.filter(g=>!g.dead).length); }); n++; if(n>5&&V.phase==='day') break; }
        return JSON.stringify({wave:V.wave,secs:n,hpMin:Math.round(hpMin),hpMax:V.P.maxHp,maxAlive:maxG,kills:V.kills-k0,goldGain:(d.gold-g0)|0,fence:(d.vil.def.f||[]).filter(Boolean).length,tow:(d.vil.def.t||[]).filter(Boolean).length,zibo:zb,fires:fmax,jail:d.ziboJail||0,downs:V.lastDowns,ease:d.ease});}""", SKILL)
      print('NIGHT',night,r); await pg.screenshot(path='/tmp/n2/e%d.png'%night)
    print(errs[:4]); await b.close()
asyncio.run(main()); srv.kill()
