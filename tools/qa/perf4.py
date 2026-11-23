import asyncio, subprocess, time
from playwright.async_api import async_playwright
srv=subprocess.Popen(['python3','-m','http.server','8765'],cwd='/home/claude/catchzibo',stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=await b.new_page(viewport={'width':412,'height':860})
    await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(2500)
    await pg.evaluate("""()=>{const d=CZ.state.data; const n=new Date(); d.login={last:n.getFullYear()*10000+(n.getMonth()+1)*100+n.getDate(),n:1}; d.lang='tr'; d.introDone=true; d.tutV=5; d.tutVer=2; d.tutorialDone=true; d.tipsOff=true; d.gfx='lo'; d.seenAt=Date.now(); d.bestNight=6;
        const V=CZ.village.ensure(); Object.keys(V.lv).forEach(k=>V.lv[k]=Math.max(V.lv[k],2)); V.def=V.def||{}; V.def.t=[0,1,2,3,4,5,6,7].map(i=>({type:i%2?'cannon':'snow',lv:2})); V.def.f=[0,1,2,3,4,5,6,7].map(i=>({type:'fence',lv:2})); CZ.state.save(); location.reload();}""")
    await pg.wait_for_timeout(13000)
    print(await pg.evaluate("""()=>{const V=CZ.screens.valley.debug; V.debug.sim(3); const sc=V.scene; let small=0; sc.traverse(o=>{ if(o.isMesh&&o.castShadow&&!o.isSkinnedMesh){ const g=o.geometry; if(!g.boundingSphere) g.computeBoundingSphere(); const s2=o.getWorldScale(new THREE.Vector3()); if(g.boundingSphere.radius*Math.max(s2.x,s2.y,s2.z)<0.35) small++; } }); const a=V.debug.info(); a.small=small; V.renderer.shadowMap.enabled=false; const b=V.debug.info(); V.renderer.shadowMap.enabled=true;
      let cast=0, all=0, vis=0; const fr=new THREE.Frustum(); fr.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(V.camera.projectionMatrix,V.camera.matrixWorldInverse));
      V.scene.traverseVisible(o=>{ if(o.isMesh){ all++; if(o.castShadow) cast++; if(o.geometry){ if(!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); if(fr.intersectsObject(o)) vis++; } } });
      const tops=V.scene.children.map(c=>{ let n=0,cs=0; c.traverseVisible(o=>{ if(o.isMesh){ n++; if(o.castShadow) cs++; } }); const pd=V.pads.find(q=>q.g===c); let first=null; c.traverse(o=>{ if(!first&&o.isMesh) first=o.material.type+'|'+o.geometry.type+'|'+(o.name||''); }); const wp=new THREE.Vector3(); let fm=null; c.traverse(o=>{ if(!fm&&o.isMesh) fm=o; }); if(fm) fm.getWorldPosition(wp); return [n,cs,first,[wp.x|0,wp.y|0,wp.z|0], c.position.toArray().map(v=>v|0), (c.children[0]||{children:[]}).children.map(x=>x.type+(x.geometry?x.geometry.type:'')).slice(0,6).join(',')]; }).sort((a,b)=>b[0]-a[0]).slice(0,14); const dm={}; V.scene.children.forEach(c=>{ if(c.isMesh&&c.visible){ const k=c.geometry.type+'|'+(c.castShadow?'S':'')+'|'+c.material.type; dm[k]=(dm[k]||0)+1; } }); const bt={}; V.scene.traverseVisible(o=>{ if(o.isMesh&&o.castShadow){ const k=o.material.type+(o.material.side===1?'-back':'')+(o.isInstancedMesh?'-inst':'')+(o.isSkinnedMesh?'-skin':''); bt[k]=(bt[k]||0)+1; } }); return JSON.stringify({dm,tops, withShadow:a.calls, small:a.small, noShadow:b.calls, meshes:all, casters:cast, inView:vis});}"""))
    await b.close()
asyncio.run(main()); srv.kill()
