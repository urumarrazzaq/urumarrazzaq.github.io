(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const escape = (s = '') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const logo=$('.monogram');
  if(logo){
    logo.classList.add('animated-logo');logo.setAttribute('role','img');logo.setAttribute('aria-label','UR.');
    logo.innerHTML='<span class="logo-letter logo-u" aria-hidden="true">U</span><span class="logo-letter logo-r" aria-hidden="true">R</span><span class="logo-dot" aria-hidden="true">.</span>';
  }
  document.addEventListener('visibilitychange',()=>document.body.classList.toggle('page-inactive',document.hidden));
  const batchSize = 9;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const testimonialCards=[...document.querySelectorAll('#testimonial-grid .testimonial')];
  const testimonialsMore=$('#testimonials-load-more');
  if(testimonialsMore){
    let shown=Math.min(4,testimonialCards.length);
    function updateTestimonials(){
      testimonialCards.forEach((card,index)=>{card.hidden=index>=shown;});
      testimonialsMore.hidden=shown>=testimonialCards.length;
      $('#testimonials-count').textContent='Showing '+shown+' of '+testimonialCards.length+' testimonials';
    }
    updateTestimonials();
    testimonialsMore.addEventListener('click',()=>{
      const previous=shown;shown=Math.min(shown+4,testimonialCards.length);updateTestimonials();
      testimonialCards.slice(previous,shown).forEach((card,index)=>registerReveal(card,index));
      // Keep keyboard focus at the beginning of the newly revealed batch.
      const first=testimonialCards[previous];if(first){first.tabIndex=-1;first.focus({preventScroll:true});}
    });
  }
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const reticle = document.createElement('div');
  reticle.className = 'cursor-reticle';reticle.setAttribute('aria-hidden','true');document.body.append(reticle);
  let cursorFrame=0,cursorX=0,cursorY=0,targetX=0,targetY=0;
  function stopCursor(){cancelAnimationFrame(cursorFrame);cursorFrame=0;reticle.classList.remove('visible');}
  function drawCursor(){
    cursorX+=(targetX-cursorX)*.35;cursorY+=(targetY-cursorY)*.35;
    reticle.style.transform=`translate3d(${cursorX}px,${cursorY}px,0)`;
    if(Math.abs(targetX-cursorX)+Math.abs(targetY-cursorY)>.2)cursorFrame=requestAnimationFrame(drawCursor);else cursorFrame=0;
  }
  document.addEventListener('pointermove',event=>{
    if(!finePointer.matches||motion.matches||event.pointerType==='touch'||event.target.closest('input,textarea,select,dialog')){stopCursor();return;}
    targetX=event.clientX;targetY=event.clientY;
    if(!reticle.classList.contains('visible')){cursorX=targetX;cursorY=targetY;}
    reticle.classList.add('visible');reticle.classList.toggle('interactive',!!event.target.closest('a,button,[role="button"]'));
    if(!cursorFrame)cursorFrame=requestAnimationFrame(drawCursor);
  },{passive:true});
  document.addEventListener('pointerdown',()=>{if(reticle.classList.contains('visible'))reticle.animate([{opacity:.8},{opacity:.2},{opacity:.8}],{duration:240});},{passive:true});
  document.addEventListener('pointerout',event=>{if(!event.relatedTarget)stopCursor();});
  addEventListener('blur',stopCursor);motion.addEventListener('change',stopCursor);finePointer.addEventListener('change',stopCursor);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopCursor();});
  let navigationTarget = '';
  const typewriter = $('.typewriter');
  if (typewriter) {
    const roles = JSON.parse(typewriter.dataset.roles || '[]');
    const output = $('#typed-role');
    if (roles.length && output) {
      let roleIndex = 0, characterIndex = Array.from(roles[0]).length, deleting = true, timer, heroVisible = true;
      const schedule = delay => { clearTimeout(timer); timer = setTimeout(tick, delay); };
      function tick() {
        if (motion.matches || document.hidden || !heroVisible) return;
        const characters = Array.from(roles[roleIndex]);
        characterIndex += deleting ? -1 : 1;
        output.textContent = characters.slice(0, characterIndex).join('');
        if (characterIndex === 0) {
          roleIndex = (roleIndex + 1) % roles.length;
          deleting = false;
          schedule(360);
        } else if (!deleting && characterIndex === characters.length) {
          deleting = true;
          schedule(1800);
        } else schedule(deleting ? 34 : 65);
      }
      if (!motion.matches && roles.length > 1) schedule(1700);
      motion.addEventListener('change', () => {
        clearTimeout(timer);
        if (motion.matches) {
          roleIndex = 0; characterIndex = Array.from(roles[0]).length;
          deleting = true; output.textContent = roles[0];
        } else if (roles.length > 1 && heroVisible) schedule(1200);
      });
      document.addEventListener('visibilitychange', () => {
        clearTimeout(timer);
        if (!document.hidden && heroVisible && !motion.matches && roles.length > 1) schedule(900);
      });
      new IntersectionObserver(entries => {
        heroVisible = entries[0].isIntersecting;
        clearTimeout(timer);
        if (heroVisible && !document.hidden && !motion.matches && roles.length > 1) schedule(900);
      }, {threshold: .05}).observe($('.hero'));
    }
  }
  let projects = [], filter = 'all', limit = batchSize;
  const safeURL = value => {
    if (typeof value !== 'string') return '';
    if (/^(assets\/(img|uploads)\/|resume\/)[\w ./()-]+$/.test(value)) return value;
    try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) ? u.href : ''; } catch { return ''; }
  };
  const splitFilter = p => p.filter.split(/\s+/).map(x => x.replace(/^filter-/, ''));
  const discipline = p => ['simulation','tools','archviz','ai','uiux'].find(key => splitFilter(p).includes(key)) || 'gameplay';
  function card(p) {
    return `<article class="project-card" data-discipline="${discipline(p)}" data-id="${escape(p.id)}"><button class="project-image" data-project="${escape(p.id)}"${p.video?' data-play="true"':''} aria-label="${p.video?'Watch':'Explore'} ${escape(p.title)} inside the website"><img src="${escape(safeURL(p.image))}" alt="${escape(p.title)} — project thumbnail" loading="lazy" width="640" height="360">${p.video?'<span class="play-badge" aria-hidden="true">▶</span><span class="play-label">WATCH SHOWCASE</span>':'<span class="play-label">PROJECT DETAILS</span>'}</button><div class="project-copy"><p class="eyebrow">${escape(p.category)}</p><h3><button data-project="${escape(p.id)}">${escape(p.title)}</button></h3><p>${escape(p.description || 'Project footage and a closer look at the experience.')}</p><a class="text-link" href="work-${escape(p.id)}.html" data-project="${escape(p.id)}">Project details <span>&#8599;</span></a></div></article>`;
  }
  // Each part of the portfolio has its own entrance, while content stays visible if motion is off.
  function revealFrames(target) {
    if (target.classList.contains('portrait-frame')) return [{opacity: .5, transform: 'perspective(900px) rotateY(9deg) scale(.94)'}, {opacity: 1, transform: 'perspective(900px) rotateY(0) scale(1)'}];
    if (target.classList.contains('project-card')) {
      const entry = {simulation:'translateY(14px)',tools:'translateX(-16px)',archviz:'scale(.97)',ai:'translateX(16px)',uiux:'translateY(10px)',gameplay:'translateY(18px)'}[target.dataset.discipline] || 'translateY(14px)';
      return [{opacity: .4, transform: entry}, {opacity: 1, transform: 'none'}];
    }
    if (target.classList.contains('service-card')) return [{opacity: .6, transform: 'translateY(8px)'}, {opacity: 1, transform: 'translateY(0)'}];
    if (target.classList.contains('about-layout') || target.classList.contains('expertise-item')) return [{opacity: .35, transform: 'translateX(28px)'}, {opacity: 1, transform: 'translateX(0)'}];
    if (target.classList.contains('about-stat') || target.classList.contains('about-fact')) return [{opacity: .4, transform: 'scale(.9) translateY(12px)'}, {opacity: 1, transform: 'scale(1) translateY(0)'}];
    if (target.classList.contains('testimonial')) return [{opacity: .4, transform: 'translateX(-30px)'}, {opacity: 1, transform: 'translateX(0)'}];
    if (target.classList.contains('hire-card')) return [{opacity: .3, transform: 'perspective(700px) rotateY(-7deg) translateY(24px)'}, {opacity: 1, transform: 'perspective(700px) rotateY(0) translateY(0)'}];
    if (target.classList.contains('fab-card')) return [{opacity: .35, transform: 'scale(.92)'}, {opacity: 1, transform: 'scale(1)'}];
    if (target.closest('.contact-section')) return [{opacity: .4, transform: 'scale(.94)'}, {opacity: 1, transform: 'scale(1)'}];
    return [{opacity: .35, transform: 'translateY(20px)'}, {opacity: 1, transform: 'translateY(0)'}];
  }
  const reloading = performance.getEntriesByType('navigation')[0]?.type === 'reload';
  document.body.classList.toggle('restored-page',reloading);
  const entranceAnimations = new Set();
  function registerReveal(el,index=0){
    if(el.hidden||el.dataset.observed)return;
    el.dataset.observed='true';
    // Restored scroll positions must not make already-visible content jump on reload.
    const rect=el.getBoundingClientRect();
    if(reloading&&rect.bottom>0&&rect.top<innerHeight)return;
    el.dataset.revealDelay=String(index%3*65);
    reveals.observe(el);
  }
  function playEntrance(target){
    // Animate card contents so hover and entrance never compete for the card transform.
    const parts=target.matches('.project-card')?[target.querySelector('.project-copy')]:
      target.matches('.fab-card')?[target.querySelector('.fab-art'),target.querySelector('.fab-copy')]:
      target.matches('.hire-card')?[...target.children]:[target];
    parts.filter(Boolean).forEach((part,index)=>{
      const animation=part.animate(revealFrames(target),{duration:target.matches('.project-card,.service-card')?420:600,delay:Number(target.dataset.revealDelay||0)+Math.min(index,3)*45,easing:'cubic-bezier(.2,.7,.2,1)',fill:'backwards'});
      entranceAnimations.add(animation);
      animation.finished.catch(()=>{}).finally(()=>entranceAnimations.delete(animation));
    });
  }
  const reveals = new IntersectionObserver(entries => {
    for (const {target, isIntersecting} of entries) {
      if (!isIntersecting) continue;
      if (navigationTarget && target.closest('main>section')?.id !== navigationTarget) continue;
      reveals.unobserve(target);
      if (!motion.matches) playEntrance(target);
      if (!motion.matches && target.classList.contains('expertise-item')) {
        const bar = target.querySelector('.expertise-meter>span');
        if (bar) bar.animate([{width: '0%'}, {width: bar.style.width}], {duration: 1000, delay: 300, easing: 'cubic-bezier(.16,1,.3,1)'});
      }
    }
  }, {threshold: .18, rootMargin:'0px 0px -24px 0px'});
  const countObserver = new IntersectionObserver(entries => {
    for (const {target, isIntersecting} of entries) {
      if (!isIntersecting) continue;
      if (navigationTarget && target.closest('main>section')?.id !== navigationTarget) continue;
      countObserver.unobserve(target);
      if (motion.matches) continue;
      const match = target.textContent.trim().match(/^(\d+)(.*)$/);
      if (!match) continue;
      const total = Number(match[1]), suffix = match[2], duration = 1100;
      let start;
      function count(frame) {
        if (motion.matches) { target.textContent = match[1] + suffix; return; }
        start ??= frame;
        const progress = Math.min((frame - start) / duration, 1);
        target.textContent = Math.round(total * (1 - Math.pow(1 - progress, 3))) + suffix;
        if (progress < 1) requestAnimationFrame(count);
      }
      requestAnimationFrame(count);
    }
  }, {threshold: .65});
  document.querySelectorAll('.about-stat strong').forEach(el => {const rect=el.getBoundingClientRect();if(!(reloading&&rect.bottom>0&&rect.top<innerHeight))countObserver.observe(el);});
  function observeCards() { document.querySelectorAll('.project-card:not([data-observed])').forEach(registerReveal); }
  // Do not animate section wrappers and their children together.
  document.querySelectorAll('.portrait-frame,.hero-reel,.about-stat,.about-fact,.expertise-item,.testimonial,.service-card,.fab-card,.hire-card,.contact-section .actions').forEach(registerReveal);
  motion.addEventListener('change', () => { if (motion.matches) entranceAnimations.forEach(a => a.cancel()); });
  // Small decorative layers use compositor-only motion and run only near the viewport.
  const ambientSections=[...document.querySelectorAll('main>.section:not(.hero):not(.hire-section)')];
  const visibleAmbients=new Set();
  let effectsPaused=false;
  try{effectsPaused=sessionStorage.getItem('effects-paused')==='true';}catch{}
  const effectsToggle=document.createElement('button');
  effectsToggle.className='effects-toggle';effectsToggle.type='button';document.body.append(effectsToggle);
  function updateAmbient(){
    document.body.classList.toggle('effects-paused',effectsPaused);
    effectsToggle.textContent=effectsPaused?'Resume effects':'Pause effects';
    effectsToggle.setAttribute('aria-pressed',String(effectsPaused));effectsToggle.hidden=motion.matches;
    ambientSections.forEach(section=>section.classList.toggle('ambient-active',visibleAmbients.has(section)&&!effectsPaused&&!document.hidden&&!motion.matches));
  }
  effectsToggle.addEventListener('click',()=>{effectsPaused=!effectsPaused;try{sessionStorage.setItem('effects-paused',String(effectsPaused));}catch{}updateAmbient();});
  const ambientObserver=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting)visibleAmbients.add(entry.target);else visibleAmbients.delete(entry.target);}updateAmbient();},{threshold:0});
  ambientSections.forEach(section=>{
    section.classList.add('ambient-section');
    const layer=document.createElement('div');layer.className='ambient-layer';layer.setAttribute('aria-hidden','true');
    layer.innerHTML='<i class="ambient-glow"></i><i class="ambient-line"></i><i class="ambient-dots"></i>';
    section.append(layer);ambientObserver.observe(section);
  });
  document.addEventListener('visibilitychange',updateAmbient);motion.addEventListener('change',updateAmbient);updateAmbient();
  const hireSection=$('.hire-section');
  if(hireSection){
    let hireVisible=false;
    const updateRings=()=>hireSection.classList.toggle('rings-active',hireVisible&&!document.hidden&&!motion.matches);
    new IntersectionObserver(entries=>{hireVisible=entries[0].isIntersecting;updateRings();},{threshold:.08}).observe(hireSection);
    document.addEventListener('visibilitychange',updateRings);motion.addEventListener('change',updateRings);
  }
  const hero = $('.hero');
  const heroVideo=$('#hero-youtube'),videoToggle=$('#hero-video-toggle');
  if(heroVideo&&videoToggle){
    let player,ready=false,loading=false,visible=false,userPaused=false,userRequested=false,failed=false,revealTimer;
    const wanted=()=>visible&&!document.hidden&&!motion.matches&&!userPaused&&(!navigator.connection?.saveData||userRequested);
    const label=()=>{const playing=ready&&player.getPlayerState()===1;const action=playing?'Pause background':'Play background';videoToggle.setAttribute('aria-label',action);videoToggle.title=action;videoToggle.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">'+(playing?'<path d="M6 4h4v16H6zm8 0h4v16h-4z"/>':'<path d="m8 4 12 8-12 8z"/>')+'</svg>';videoToggle.hidden=motion.matches||failed;};
    function hidePlayer(){clearTimeout(revealTimer);hero.classList.remove('background-playing');}
    function syncPlayerVisibility(){
      hidePlayer();
      if(ready&&wanted()&&player.getPlayerState()===1){
        // Wait for YouTube's transient startup overlay to clear before revealing the footage.
        revealTimer=setTimeout(()=>{if(ready&&wanted()&&player.getPlayerState()===1)hero.classList.add('background-playing');},3000);
      }
    }
    const fail=()=>{hidePlayer();failed=true;ready=false;player?.destroy();label();};
    function createPlayer(){
      if(player||failed)return;
      player=new YT.Player('hero-youtube',{host:'https://www.youtube-nocookie.com',width:'100%',height:'100%',videoId:heroVideo.dataset.videoId,
        playerVars:{autoplay:0,controls:0,playsinline:1,loop:1,playlist:heroVideo.dataset.videoId,rel:0,disablekb:1,origin:location.origin},
        events:{onReady:()=>{ready=true;const iframe=player.getIframe();iframe.tabIndex=-1;iframe.setAttribute('title','Background trailer');iframe.setAttribute('referrerpolicy','strict-origin-when-cross-origin');player.mute();updateVideo();},
          onStateChange:()=>{if(!wanted()&&player.getPlayerState()===1)player.pauseVideo();syncPlayerVisibility();label();},onError:fail,onAutoplayBlocked:()=>{hidePlayer();label();}}});
    }
    function updateVideo(){
      label();
      if(!wanted())hidePlayer();
      if(ready){player.mute();if(wanted())player.playVideo();else player.pauseVideo();return;}
      if(!wanted()||loading||failed)return;
      loading=true;
      if(window.YT?.Player){createPlayer();return;}
      const previous=window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady=()=>{previous?.();createPlayer();};
      const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.onerror=fail;document.head.append(script);
    }
    videoToggle.addEventListener('click',()=>{userRequested=true;userPaused=ready&&player.getPlayerState()===1;updateVideo();});
    new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;updateVideo();},{threshold:.08}).observe(hero);
    document.addEventListener('visibilitychange',updateVideo);motion.addEventListener('change',updateVideo);label();
  }
  const localBackground=$('#hero-local-video');
  if(localBackground&&videoToggle){
    let inView=false,pausedByUser=false,requested=false;
    const labelLocal=()=>{const playing=!localBackground.paused;const label=playing?'Pause background':'Play background';videoToggle.setAttribute('aria-label',label);videoToggle.title=label;videoToggle.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">'+(playing?'<path d="M6 4h4v16H6zm8 0h4v16h-4z"/>':'<path d="m8 4 12 8-12 8z"/>')+'</svg>';videoToggle.hidden=motion.matches;};
    const updateLocal=()=>{if(!inView||document.hidden||motion.matches||pausedByUser||(navigator.connection?.saveData&&!requested)){localBackground.pause();labelLocal();return;}if(!localBackground.getAttribute('src'))localBackground.src=localBackground.dataset.src;localBackground.muted=true;localBackground.play().catch(labelLocal);};
    videoToggle.addEventListener('click',()=>{requested=true;pausedByUser=!localBackground.paused;updateLocal();});
    localBackground.addEventListener('play',labelLocal);localBackground.addEventListener('pause',labelLocal);
    new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;updateLocal();},{threshold:.08}).observe(hero);
    motion.addEventListener('change',updateLocal);document.addEventListener('visibilitychange',updateLocal);labelLocal();
  }
  let pointerFrame = 0;
  hero?.addEventListener('pointermove', event => {
    if (motion.matches || event.pointerType === 'touch' || pointerFrame) return;
    const rect = hero.getBoundingClientRect();
    const x = Math.round((event.clientX - rect.left) / rect.width * 100);
    const y = Math.round((event.clientY - rect.top) / rect.height * 100);
    pointerFrame = requestAnimationFrame(() => {
      hero.style.setProperty('--pointer-x', `${x}%`);
      hero.style.setProperty('--pointer-y', `${y}%`);
      pointerFrame = 0;
    });
  });
  hero?.addEventListener('pointerleave', () => {
    hero.style.removeProperty('--pointer-x');
    hero.style.removeProperty('--pointer-y');
  });
  const reel = $('#reel-viewport');
  if (reel) {
    const controls = $('.reel-controls'), previous = $('#reel-prev'), next = $('#reel-next');
    let reelVisible = false, reelHovered = false, manualUntil = 0;
    const maxScroll = () => Math.max(0, reel.scrollWidth - reel.clientWidth);
    function updateReel() {
      controls.hidden = maxScroll() < 2;
      previous.disabled = reel.scrollLeft < 3;
      next.disabled = reel.scrollLeft >= maxScroll() - 3;
    }
    function reelStep(direction) {
      const clip = reel.querySelector('.reel-clip');
      if (!clip) return;
      const gap = parseFloat(getComputedStyle(reel.querySelector('.reel-clips')).gap) || 0;
      reel.scrollBy({left: direction * (clip.getBoundingClientRect().width + gap), behavior: motion.matches ? 'instant' : 'smooth'});
    }
    previous.addEventListener('click', () => { manualUntil = Date.now() + 12000; reelStep(-1); });
    next.addEventListener('click', () => { manualUntil = Date.now() + 12000; reelStep(1); });
    reel.addEventListener('scroll', updateReel, {passive: true});
    reel.addEventListener('pointerenter', () => { reelHovered = true; });
    reel.addEventListener('pointerleave', () => { reelHovered = false; });
    reel.addEventListener('touchstart', () => { manualUntil = Date.now() + 12000; }, {passive: true});
    new ResizeObserver(updateReel).observe(reel);
    new IntersectionObserver(entries => { reelVisible = entries[0].isIntersecting; }, {threshold: .2}).observe(reel);
    setInterval(() => {
      if (motion.matches || document.hidden || !reelVisible || reelHovered || Date.now() < manualUntil || maxScroll() < 2) return;
      if (reel.scrollLeft >= maxScroll() - 3) reel.scrollTo({left: 0, behavior: 'smooth'});
      else reelStep(1);
    }, 5200);
    updateReel();
  }
  function initSpotlight(){
    const toolbar=$('.portfolio-toolbar');if(!toolbar)return;
    const candidates=['gameplay','tools','ai','simulation'].map(tag=>projects.find(p=>p.video&&splitFilter(p).includes(tag))).filter(Boolean);
    const featured=[...new Map(candidates.map(p=>[p.id,p])).values()];if(!featured.length)return;
    const stage=document.createElement('div');stage.className='project-spotlight';stage.setAttribute('aria-label','Featured project spotlight');
    stage.innerHTML='<div class="spotlight-top"><span class="eyebrow">THE SHOWCASE</span><span class="spotlight-index"></span></div><div class="spotlight-stage"><button class="spotlight-art" type="button"><img width="960" height="540" loading="lazy" alt=""><span class="spotlight-play" aria-hidden="true">&#9654;</span><span class="spotlight-caption">WATCH THE WORK</span></button><div class="spotlight-copy"><p class="eyebrow spotlight-category"></p><h3></h3><p class="spotlight-description"></p><div class="spotlight-tech"></div><a class="text-link">Explore project <span aria-hidden="true">&#8599;</span></a></div></div><div class="spotlight-selector" role="group" aria-label="Choose a featured project"></div>';
    const selector=stage.querySelector('.spotlight-selector');
    featured.forEach((p,index)=>{const button=document.createElement('button');button.type='button';button.innerHTML='<span class="spotlight-number">0'+(index+1)+'</span><span>'+escape(p.title)+'</span>';button.addEventListener('click',()=>select(index,true));selector.append(button);});
    function select(index,animate=false){
      const p=featured[index],art=stage.querySelector('.spotlight-art'),img=art.querySelector('img'),link=stage.querySelector('.text-link');
      art.dataset.project=p.id;art.dataset.play='true';art.setAttribute('aria-label','Watch '+p.title);
      img.src=safeURL(p.image);img.alt=p.title+' project preview';
      stage.querySelector('.spotlight-index').textContent='0'+(index+1)+' / 0'+featured.length;
      stage.querySelector('.spotlight-category').textContent=p.category;
      stage.querySelector('h3').textContent=p.title;
      const paragraph=p.description.split(/\n/)[0];const summary=paragraph.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim()||paragraph;stage.querySelector('.spotlight-description').textContent=summary.length>230?summary.slice(0,227).replace(/\s+\S*$/,'')+'...':summary;
      stage.querySelector('.spotlight-tech').innerHTML=(p.technologies||'').split(',').map(t=>t.trim()).filter(Boolean).slice(0,3).map(t=>'<span>'+escape(t)+'</span>').join('');
      link.href='work-'+p.id+'.html';link.dataset.project=p.id;
      [...selector.children].forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
      if(animate&&!motion.matches){const copy=stage.querySelector('.spotlight-copy');copy.getAnimations().forEach(a=>a.cancel());copy.animate([{opacity:.5,transform:'translateY(5px)'},{opacity:1,transform:'none'}],{duration:250,easing:'ease-out'});}
    }
    toolbar.before(stage);select(0);
  }
  const projectNodes = new Map([...document.querySelectorAll('#project-grid .project-card')].map(el => [el.dataset.id, el]));
  function render(append = false, animate = false) {
    if (!$('#project-grid')) return;
    const term = $('#project-search').value.trim().toLowerCase();
    const spotlight=$('.project-spotlight');if(spotlight)spotlight.hidden=!!term||filter!=='all';
    const matches = projects.filter(p => (filter === 'all' || splitFilter(p).includes(filter)) && `${p.title} ${p.category} ${p.description || ''}`.toLowerCase().includes(term));
    const visible = matches.slice(0, limit);
    const grid = $('#project-grid');
    const nodes = visible.map(p => {
      if (!projectNodes.has(p.id)) { const template = document.createElement('template'); template.innerHTML = card(p); projectNodes.set(p.id, template.content.firstElementChild); }
      const el = projectNodes.get(p.id);el.dataset.discipline = discipline(p);
      if (!animate && !append) { reveals.unobserve(el);el.dataset.observed = 'true';el.querySelectorAll('*').forEach(child=>child.getAnimations().forEach(a=>a.cancel())); }
      return el;
    });
    if (nodes.length) {
      if (append) nodes.forEach(el=>{if(el.parentElement!==grid)grid.append(el);});
      else if (nodes.length!==grid.children.length || nodes.some((el,i)=>el!==grid.children[i])) grid.replaceChildren(...nodes);
    } else grid.innerHTML = '<p class="empty-state">No projects found. Try another search or category.</p>';
    $('#project-count').textContent = `Showing ${visible.length} of ${matches.length} ${filter === 'all' ? '' : 'matching '}projects`;
    $('#load-more').hidden = limit >= matches.length;
    $('#load-status').textContent = matches.length ? `${Math.max(0, matches.length - visible.length)} more ${filter === 'all' ? 'projects' : 'matching projects'}${visible.length === matches.length ? ' · You’ve reached the end' : ''}` : 'Clear your search to explore the portfolio.';
    if (animate || append) observeCards();
  }
  $('#menu-toggle').addEventListener('click', () => { $('.sidebar').classList.toggle('menu-open'); $('#menu-toggle').setAttribute('aria-expanded', String($('.sidebar').classList.contains('menu-open'))); });
  const sections = [...document.querySelectorAll('main>section')];
  const onePage = document.body.dataset.layout !== 'multi-page';
  let navigationTimeout = 0;
  function setActiveSection(id) {
    document.querySelectorAll('#nav a').forEach(a => {
      if (onePage ? a.hash === '#' + id : a.getAttribute('href') === id + '.html') {
        if (a.getAttribute('aria-current') !== 'location') a.setAttribute('aria-current', 'location');
      } else if (a.hasAttribute('aria-current')) a.removeAttribute('aria-current');
    });
  }
  function activeFromScroll() {
    const threshold = Math.max(130, Math.min(innerHeight * .38, 300));
    let id = sections[0].id;
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= threshold) id = section.id;
    }
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 3) id = sections.at(-1).id;
    setActiveSection(id);
  }
  function finishNavigation() {
    clearTimeout(navigationTimeout);
    navigationTarget = '';
    activeFromScroll();
  }
  function arrivedAtTarget() {
    const target = document.getElementById(navigationTarget);
    if (!target) return true;
    const top = target.getBoundingClientRect().top;
    const desired = target.id === 'home' ? 0 : parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
    return Math.abs(top - desired) < 110 || target === sections.at(-1) && innerHeight + scrollY >= document.documentElement.scrollHeight - 3;
  }
  function settleNavigation() {
    if (!navigationTarget) return;
    if (arrivedAtTarget()) finishNavigation();
    else navigationTimeout = setTimeout(settleNavigation, 250);
  }
  function beginNavigation(id) {
    navigationTarget = id;
    setActiveSection(id);
    clearTimeout(navigationTimeout);
    navigationTimeout = setTimeout(settleNavigation, 2200);
  }
  document.querySelectorAll('#nav a').forEach(a => a.addEventListener('click', () => {
    if (onePage) beginNavigation(a.hash.slice(1));
    $('.sidebar').classList.remove('menu-open');
    $('#menu-toggle').setAttribute('aria-expanded', 'false');
  }));
  document.addEventListener('click', event => {
    if ($('.sidebar').classList.contains('menu-open') && !event.target.closest('.sidebar')) {
      $('.sidebar').classList.remove('menu-open');
      $('#menu-toggle').setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && $('.sidebar').classList.contains('menu-open')) {
      $('.sidebar').classList.remove('menu-open');
      $('#menu-toggle').setAttribute('aria-expanded', 'false');
      $('#menu-toggle').focus();
    }
  });
  const aliases = {entrance:'home',hero:'home',control:'about',skills:'about',projects:'portfolio',career:'about',resume:'about'};
  if (onePage && aliases[location.hash.slice(1)]) { const id = aliases[location.hash.slice(1)]; if (document.getElementById(id)) { history.replaceState(null, '', '#' + id); beginNavigation(id); document.getElementById(id).scrollIntoView(); } }
  addEventListener('scroll', () => { if (navigationTarget && arrivedAtTarget()) finishNavigation(); else if (!navigationTarget) activeFromScroll(); }, {passive: true});
  addEventListener('scrollend', event => { if (navigationTarget && (event.target === document || event.target === window) && arrivedAtTarget()) finishNavigation(); });
  addEventListener('wheel', () => { if (navigationTarget) finishNavigation(); }, {passive: true});
  addEventListener('touchstart', () => { if (navigationTarget) finishNavigation(); }, {passive: true});
  addEventListener('keydown', event => { if (navigationTarget && ['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key)) finishNavigation(); });
  activeFromScroll();
  document.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => {
    filter = b.dataset.filter; limit = batchSize;
    document.querySelectorAll('[data-filter]').forEach(el => el.setAttribute('aria-pressed', String(el === b)));
    render();
  }));
  let searchTimer;
  $('#project-search')?.addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => { limit = batchSize; render(); }, 140); });
  $('#load-more')?.addEventListener('click', () => {
    const count = $('#project-grid').children.length;
    limit += batchSize; render(true);
    const added = $('#project-grid').children[count];
    added?.querySelector('button')?.focus({preventScroll:true});
    added?.scrollIntoView({behavior:motion.matches ? 'instant' : 'smooth', block:'start'});
  });
  function youtubeID(url) {
    try {
      const u = new URL(url);
      if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('/')[0];
      if (['youtube.com','www.youtube.com','m.youtube.com','www.youtube-nocookie.com'].includes(u.hostname)) return u.searchParams.get('v') || u.pathname.split('/').filter(Boolean).at(-1);
    } catch {}
    return null;
  }
  function playEmbedded(id) {
    if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) return;
    if (location.protocol === 'file:') {
      const notice = document.createElement('div');
      notice.className = 'video-setup';
      notice.innerHTML = '<strong>Open the portfolio through the local server to play this video here.</strong><p>YouTube requires a website address for embedded playback. In this project folder, run <code>node tools/admin-server.cjs</code>, then open <a href="http://127.0.0.1:8080/">http://127.0.0.1:8080/</a>.</p>';
      $('.detail-media').replaceChildren(notice);
      return;
    }
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0`;
    iframe.title = $('#project-title').textContent + ' — gameplay video';
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allowFullscreen = true;
    $('.detail-media').replaceChildren(iframe);
  }
  function openProject(p, autoplay = false) {
    const video = safeURL(p.video), link = safeURL(p.link), thumb = safeURL(p.image), yt = youtubeID(video);
    const localVideo = video && /\.(mp4|webm)$/i.test(video);
    const media = localVideo ? `<video src="${escape(video)}" controls playsinline preload="metadata" poster="${escape(thumb)}"></video>` : yt && /^[a-zA-Z0-9_-]{11}$/.test(yt) ? `<button class="video-consent" data-youtube="${escape(yt)}" aria-label="Play ${escape(p.title)} video"><img src="${escape(thumb)}" alt="${escape(p.title)}"><span>▶ Play gameplay here</span></button>` : `<img src="${escape(thumb)}" alt="${escape(p.title)}">`;
    $('#project-category').textContent = p.category;
    $('#project-detail').innerHTML = `<div class="detail-media">${media}</div><div class="detail-heading"><h2 id="project-title">${escape(p.title)}</h2>${link && link !== video && !youtubeID(link) ? `<a class="button secondary" href="${escape(link)}" target="_blank" rel="noopener">Project page ↗</a>` : ''}</div><p class="detail-description">${escape(p.description || 'Explore the project footage for a closer look at this experience.')}</p>${p.contributions ? `<h3 class="detail-label">MY CONTRIBUTIONS</h3><p class="detail-description">${escape(p.contributions)}</p>` : ''}${p.technologies ? `<h3 class="detail-label">TECHNOLOGIES</h3><div class="detail-tags">${p.technologies.split(',').map(t => `<span>${escape(t.trim())}</span>`).join('')}</div>` : ''}`;
    $('#project-dialog').showModal(); $('#project-dialog').scrollTop = 0;
    if (autoplay && yt) playEmbedded(yt);
    else if (autoplay && localVideo) $('.detail-media video').play().catch(() => {});
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-project]');
    if (a && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey && e.button === 0) { const p = projects.find(p => p.id === a.dataset.project); if (p) { e.preventDefault(); openProject(p, a.dataset.play === 'true'); } }
    const play = e.target.closest('[data-youtube]');
    if (play) playEmbedded(play.dataset.youtube);
  });
  $('#close-project').addEventListener('click', () => $('#project-dialog').close());
  $('#project-dialog').addEventListener('close', () => { $('#project-detail').innerHTML = ''; });
  if ($('#copy-email')) $('#copy-email').hidden = false;
  $('#copy-email')?.addEventListener('click', async () => {
    const email = $('.email-address').textContent;
    try { await navigator.clipboard.writeText(email); $('#copy-email').textContent = 'Email copied ✓'; $('#announcement').textContent = 'Email copied'; }
    catch { $('#copy-email').textContent = 'Select the address below'; const range = document.createRange(); range.selectNodeContents($('.email-address')); getSelection().removeAllRanges(); getSelection().addRange(range); }
  });
  // Generated JSON is inert, escaped at build time, and works even when opened locally.
  // Only the visible batch creates image elements; remaining media waits for Load more.
  try {
    projects = JSON.parse($('#portfolio-data').textContent);
    initSpotlight();
    if ($('.portfolio-toolbar')) $('.portfolio-toolbar').hidden = false;
    render(false, true);
  } catch {
    if ($('#project-count')) $('#project-count').textContent = 'Project data could not load. Reload the page to try again.';
  }
  if ($('#fab-grid')) {
    try {
      const listings = JSON.parse($('#fab-data').textContent), batch = 3;
      let shown = Math.min(batch, listings.length);
      const update = () => { $('#fab-load-more').hidden = shown >= listings.length; $('#fab-count').textContent = listings.length ? `Showing ${shown} of ${listings.length} listings` : 'Listings are being prepared.'; };
      $('#fab-load-more').addEventListener('click', () => {
        const more = listings.slice(shown, shown + batch);
        $('#fab-grid').insertAdjacentHTML('beforeend', more.map(item => `<article class="fab-card"><div class="fab-art">${item.image?`<img src="${escape(safeURL(item.image))}" alt="${escape(item.title)} artwork" loading="lazy">`:'<span aria-hidden="true">FAB</span>'}</div><div class="fab-copy"><span class="eyebrow">FAB LISTING</span><h3>${escape(item.title)}</h3><p>${escape(item.description)}</p><a class="text-link" href="${escape(safeURL(item.url))}" target="_blank" rel="noopener">${item.url.includes('/portal/')?'Publisher preview':'View on Fab'} ↗</a></div></article>`).join(''));
        shown += more.length;update();
        document.querySelectorAll('#fab-grid .fab-card:not([data-observed])').forEach(registerReveal);
        $('#fab-grid .fab-card:nth-child(' + (shown - more.length + 1) + ')')?.scrollIntoView({behavior:motion.matches?'instant':'smooth',block:'nearest'});
      });
      update();
    } catch { $('#fab-count').textContent = 'Fab listings could not load.'; }
  }
})();
