import asyncio, subprocess, time, json
from playwright.async_api import async_playwright
srv=subprocess.Popen(['python3','-m','http.server','8765'],cwd='/home/claude/catchzibo',stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=await b.new_page(viewport={'width':412,'height':860}); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(2500)
    await pg.evaluate("""()=>{const d=CZ.state.data; const n=new Date(); d.login={last:n.getFullYear()*10000+(n.getMonth()+1)*100+n.getDate(),n:1}; d.lang='tr'; d.introDone=true; d.tutV=5; d.tutVer=2; d.tutorialDone=true; d.tipsOff=true; d.gfx='lo'; d.seenAt=Date.now(); d.food=12; d.gold=500;d.wood=300;d.stone=300;
      const P=['wood','miner','cook','hunter','healer','builder','wood','miner'];
      d.surv={n:8,list:P.map((pr,i)=>({id:'t'+i,name:'N'+i,g:i%2?'f':'m',ty:i%2,prof:pr,job:pr,rar:i%4,st:{loy:5,str:6,spd:6,int:5,fit:5},room:1,days:0,happy:60,ate:true,story:0,joined:true})),mail:[]}; CZ.state.save(); location.reload();}""")
    await pg.wait_for_timeout(12000)
    for day in range(3):
      r=await pg.evaluate("""()=>{const V=CZ.screens.valley.debug, d=CZ.state.data, N=V.debug.npcs; const log={st:{},stuck:[],nan:0,phases:[]}; const last=N.map(n=>({x:n.x,z:n.z,st:n.st,t:0}));
        const step=(k)=>{ V.debug.sim(1,()=>{V.P.hp=V.P.maxHp; V.debug.autoFire();}); document.querySelectorAll('.modal-wrap').forEach(e=>{ const b=[...e.querySelectorAll('.btn')].find(b=>/Devam|Sabah|Continue/.test(b.textContent)); if(b) b.click(); else e.remove(); }); V.paused=false;
          N.forEach((n,i)=>{ if(!isFinite(n.x)||!isFinite(n.z)) log.nan++; const L=last[i]||(last[i]={x:n.x,z:n.z,st:n.st,t:0}); const mv=Math.hypot(n.x-L.x,n.z-L.z); if(n.st===L.st && mv<0.05 && /go|back|home|eat$/.test(n.st)) L.t++; else L.t=0; if(L.t===15) log.stuck.push([i,n.s.job,n.st,n.x.toFixed(1),n.z.toFixed(1),n.tx&&n.tx.toFixed(1),n.tz&&n.tz.toFixed(1)]); L.x=n.x;L.z=n.z;L.st=n.st; const key=V.phase+':'+n.st; log.st[key]=(log.st[key]||0)+1; }); };
        const f0=d.food, w0=d.wood, s0=d.stone;
        for(let k=0;k<70;k++) step(k);
        V.phT=Math.min(V.phT,20); let n=0; while(n<260){ step(n); n++; if(n>5&&V.phase==='day') break; }
        const leak=(V.debug.trees||[]).concat(V.debug.rocks||[]).filter(o=>o.npc && !N.some(q=>q.task===o)).length;
        return JSON.stringify({w:V.wave, food:[f0,d.food], wood:d.wood-w0, stone:d.stone-s0, happy:d.surv.list.map(s=>s.happy), ate:d.surv.list.map(s=>s.ate?1:0).join(''), leak, nan:log.nan, stuck:log.stuck, st:log.st});}""")
      print(r)
    await pg.screenshot(path='lr.png')
    print(errs[:3]); await b.close()
asyncio.run(main()); srv.kill()
