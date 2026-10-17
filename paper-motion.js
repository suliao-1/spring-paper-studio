/* Original DOM/CSS3D adaptation of the scroll-tube interaction described by
 * Mat Danilowicz: https://github.com/matdn/helmet and Codrops (2026-02-17).
 * No photographs, helmet model, React code or shaders are redistributed. */
window.PaperMotion = (() => {
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  let dispose = () => {};
  function stop(){ dispose(); dispose=()=>{}; }
  function windowScene(root, svg, next){
    stop();
    root.innerHTML=`<div class="paper-window"><div class="window-beyond"><span>一扇窗里的春天</span><div class="beyond-paper">${svg.replaceAll('story-cut','beyond-cut')}</div><small>推开窗，把祝愿带到纸上</small></div><div class="window-leaf left"><div class="window-pattern">${svg}</div><i></i></div><div class="window-leaf right"><div class="window-pattern">${svg.replaceAll('story-cut','right-cut')}</div><i></i></div></div><p class="window-caption">向两侧拖动窗扇，或点击「推开这扇窗」</p>`;
    const leaves=root.querySelectorAll('.window-leaf'),frame=root.querySelector('.paper-window');
    let progress=0,start=null,done=false,raf=0,disposed=false,dragged=false;
    frame.setAttribute('role','button');frame.tabIndex=0;frame.setAttribute('aria-label','推开这扇窗，进入下一幕');
    const paint=p=>{progress=p;leaves[0].style.transform=`rotateY(${-112*p}deg)`;leaves[1].style.transform=`rotateY(${112*p}deg)`;frame.style.setProperty('--light',p)};
    const open=()=>{if(done||disposed)return;done=true;frame.setAttribute('aria-disabled','true');const initial=progress,began=performance.now(),duration=reduced()?180:1250;const paper=root.querySelector('.beyond-paper');
      const tick=now=>{if(disposed||!root.isConnected)return;const t=Math.min(1,(now-began)/duration),ease=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;paint(initial+(1-initial)*ease);if(!reduced())paper.style.scale=String(1+.18*ease);if(t<1)raf=requestAnimationFrame(tick);else{const hold=performance.now();const finish=now=>{if(disposed||!root.isConnected)return;if(now-hold<(reduced()?0:320))raf=requestAnimationFrame(finish);else next()};raf=requestAnimationFrame(finish)}};raf=requestAnimationFrame(tick);};
    frame.onpointerdown=e=>{if(done||e.button!==0)return;start=e.clientX;dragged=false;frame.setPointerCapture(e.pointerId)};
    frame.onpointermove=e=>{if(start!==null&&!done){dragged=dragged||Math.abs(e.clientX-start)>6;paint(Math.min(1,Math.abs(e.clientX-start)/Math.max(100,frame.clientWidth*.32)))}};
    frame.onpointerup=()=>{if(start===null)return;start=null;if(!dragged||progress>.25)open();else paint(0)};
    frame.onpointercancel=()=>{start=null;if(!done)paint(0)};
    frame.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}};
    root.querySelector('.window-caption').textContent='点击窗户、向两侧拖动，或点击「推开这扇窗」';
    dispose=()=>{disposed=true;cancelAnimationFrame(raf);frame.onpointerdown=frame.onpointermove=frame.onpointerup=frame.onpointercancel=frame.onkeydown=null};return open;
  }
  function tube(root, entries, onSelect){
    stop();let raf=0,paused=reduced(),hover=false,scroll=0,target=0,angle=0,spin=0,last=performance.now(),drag=null,moved=false,idle=1.5;
    root.innerHTML=`<div class="tube-toolbar"><span>你的剪纸，与十二枚纹样一起流转</span><button class="tube-pause">${paused?'播放环绕':'暂停环绕'}</button><button class="tube-list">平面浏览</button></div><div class="tube-viewport" aria-label="剪纸环绕展廊，可拖动或滚动浏览"><div class="tube-world"></div></div><p class="tube-help">滚动上下穿行 · 拖动转动展廊 · 点击剪纸查看作品</p>`;
    const viewport=root.querySelector('.tube-viewport'),world=root.querySelector('.tube-world'),pause=root.querySelector('.tube-pause');
    let flat=reduced();const count=60;
    const tiles=Array.from({length:count},(_,i)=>{const entry=entries[i%entries.length],b=document.createElement('button');b.className='tube-tile'+(i%entries.length===0?' mine':'')+' tube-variant-'+(i%entries.length);b.innerHTML=entry.svg.replaceAll(/(id=")(.*?)(")/g,(_,a,id,z)=>a+id+'-tile'+i+z).replaceAll(/url\(#([^)]*)\)/g,(_,id)=>`url(#${id}-tile${i})`)+`<span>${entry.name}</span><small>${i%entries.length===0?'我的剪刻作品':'纸间纹样'}</small>`;b.setAttribute('aria-label',entry.name+'，查看详情');b.onclick=()=>{if(!moved)onSelect(entry)};b.onpointerenter=()=>hover=true;b.onpointerleave=()=>hover=false;b.onfocus=()=>hover=true;b.onblur=()=>hover=false;world.append(b);return b});
    function mode(){viewport.classList.toggle('flat',flat);tiles.forEach((b,i)=>{b.hidden=flat&&i>=entries.length;b.tabIndex=flat?0:-1});root.querySelector('.tube-list').textContent=flat?'环绕浏览':'平面浏览';root.querySelector('.tube-help').textContent=flat?'点击作品查看；平面浏览支持键盘逐项选择。':'滚动上下穿行 · 拖动转动展廊 · 点击剪纸查看作品'}
    mode();root.querySelector('.tube-list').onclick=()=>{flat=!flat;mode()};pause.onclick=()=>{paused=!paused;pause.textContent=paused?'播放环绕':'暂停环绕'};
    viewport.addEventListener('wheel',e=>{if(flat)return;e.preventDefault();idle=0;const dy=Math.max(-120,Math.min(120,e.deltaY));target+=dy*.55;spin+=dy*.045},{passive:false});
    viewport.onpointerdown=e=>{if(flat)return;idle=0;drag={x:e.clientX,y:e.clientY};moved=false};
    viewport.onpointermove=e=>{if(!drag||flat)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>3){idle=0;moved=true;viewport.setPointerCapture(e.pointerId)}angle+=dx*.25;target-=dy;spin=dx*.4;drag={x:e.clientX,y:e.clientY}};
    viewport.onpointerup=()=>drag=null;viewport.onpointercancel=()=>{drag=null;moved=false};
    function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;idle+=dt;
      if(!root.isConnected){stop();return}
      if(!flat){const speed=paused||document.hidden?0:hover?.2:1;scroll+=(target-scroll)*(1-Math.pow(.88,dt*60));spin*=Math.pow(.92,dt*60);const autoSpin=idle>1.15?-7.5:0;angle+=(autoSpin+spin)*dt*speed;
        const radius=Math.min(520,Math.max(330,viewport.clientWidth*.34)),spacing=Math.max(132,Math.min(210,viewport.clientHeight*.2)),loop=spacing*5;
        if(Math.abs(scroll)>loop){const shift=Math.trunc(scroll/loop)*loop;scroll-=shift;target-=shift}
        tiles.forEach((b,i)=>{const row=Math.floor(i/12),col=i%12,y=((row*spacing-scroll+loop*10)%loop)-loop/2;const theta=col*30+(row%2)*15+angle;const z=Math.cos(theta*Math.PI/180);b.style.transform=`translate(-50%,-50%) translateY(${y}px) rotateY(${theta}deg) translateZ(${radius}px)`;b.style.opacity=String(.68+.32*(z+1)/2);b.style.pointerEvents=z>-.3?'auto':'none';});
      }raf=requestAnimationFrame(frame);
    }raf=requestAnimationFrame(frame);dispose=()=>cancelAnimationFrame(raf);
  }
  return {stop,windowScene,tube,reduced};
})();
