(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const escape = (s='') => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let projects=[], filter='all', limit=9;
  const safeURL = value => {
    if (typeof value!=='string') return '';
    if (/^(assets\/(img|uploads)\/|resume\/)[\w ./()-]+$/.test(value)) return value;
    try {const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u.href:'';} catch {return '';}
  };
  const splitFilter = p => p.filter.split(/\s+/).map(x=>x.replace(/^filter-/,''));
  function card(p){return `<article class="project-card"><a class="project-image" href="${escape(safeURL(p.video||p.link)||'#portfolio')}" data-project="${escape(p.id)}"><img src="${escape(safeURL(p.image))}" alt="${escape(p.title)} — project thumbnail" loading="lazy" width="640" height="360"><span class="play-badge" aria-hidden="true">▶</span></a><div class="project-copy"><p class="eyebrow">${escape(p.category)}</p><h3><a href="#portfolio" data-project="${escape(p.id)}">${escape(p.title)}</a></h3><p>${escape(p.description||'Project footage and a closer look at the experience.')}</p><button class="text-link" data-project="${escape(p.id)}">View project <span>↗</span></button></div></article>`;}
  function render(append=false){
    const term=$('#project-search').value.trim().toLowerCase();
    const matches=projects.filter(p=>(filter==='all'||splitFilter(p).includes(filter))&&`${p.title} ${p.category} ${p.description||''}`.toLowerCase().includes(term));
    const visible=matches.slice(0,limit);
    if(append){$('#project-grid').insertAdjacentHTML('beforeend',visible.slice(Math.max(0,limit-9)).map(card).join(''));}
    else $('#project-grid').innerHTML=visible.map(card).join('')||'<p class="empty-state">No projects found. Try another search or category.</p>';
    $('#project-count').textContent=`Showing ${visible.length} of ${matches.length} projects`;
    $('#load-more').hidden=limit>=matches.length;
    $('#load-status').textContent=matches.length?`${projects.length} projects in the complete portfolio`:'Clear your search to explore the portfolio.';
  }
  $('#menu-toggle').addEventListener('click',()=>{$('.sidebar').classList.toggle('menu-open');$('#menu-toggle').setAttribute('aria-expanded',String($('.sidebar').classList.contains('menu-open')));});
  document.querySelectorAll('#nav a').forEach(a=>a.addEventListener('click',()=>{$('.sidebar').classList.remove('menu-open');$('#menu-toggle').setAttribute('aria-expanded','false');}));
  const aliases={entrance:'home',hero:'home',control:'about',skills:'about',projects:'portfolio',career:'about',resume:'about'};
  if(aliases[location.hash.slice(1)]){const id=aliases[location.hash.slice(1)];history.replaceState(null,'','#'+id);document.getElementById(id).scrollIntoView();}
  const observer=new IntersectionObserver(entries=>{const entry=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];if(!entry)return;document.querySelectorAll('#nav a').forEach(a=>{if(a.hash==='#'+entry.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});},{rootMargin:'-10% 0px -45% 0px',threshold:[0,.1,.3]});
  document.querySelectorAll('main>section').forEach(s=>observer.observe(s));
  document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;limit=9;document.querySelectorAll('[data-filter]').forEach(el=>el.setAttribute('aria-pressed',String(el===b)));render();}));
  $('#project-search').addEventListener('input',()=>{limit=9;render();});
  $('#load-more').addEventListener('click',()=>{const count=$('#project-grid').children.length;limit+=9;render(true);const added=$('#project-grid').children[count]?.querySelector('a');added?.focus({preventScroll:true});});
  function youtubeID(url){try {const u=new URL(url);if(u.hostname==='youtu.be')return u.pathname.slice(1).split('/')[0];if(['youtube.com','www.youtube.com','m.youtube.com'].includes(u.hostname))return u.searchParams.get('v')||u.pathname.split('/').filter(Boolean).at(-1);}catch{}return null;}
  function openProject(p){
    const video=safeURL(p.video),link=safeURL(p.link),thumb=safeURL(p.image),yt=youtubeID(video);
    const media=video&&/\.(mp4|webm)$/i.test(video)?`<video src="${escape(video)}" controls playsinline preload="metadata" poster="${escape(thumb)}"></video>`:yt&&/^[a-zA-Z0-9_-]{11}$/.test(yt)?`<button class="video-consent" data-youtube="${escape(yt)}" aria-label="Play ${escape(p.title)} video"><img src="${escape(thumb)}" alt="${escape(p.title)}"><span>▶ Play project video</span></button>`:`<img src="${escape(thumb)}" alt="${escape(p.title)}">`;
    $('#project-category').textContent=p.category;
    $('#project-detail').innerHTML=`<div class="detail-media">${media}</div>${video?`<p class="video-fallback">${yt?'Video hosted on YouTube. ':''}<a href="${escape(video)}" target="_blank" rel="noopener">Watch in a new tab ↗</a> if embedded playback is unavailable.</p>`:''}<div class="detail-heading"><h2 id="project-title">${escape(p.title)}</h2>${link&&link!==video?`<a class="button secondary" href="${escape(link)}" target="_blank" rel="noopener">Project page ↗</a>`:''}</div><p class="detail-description">${escape(p.description||'Watch the project footage for a closer look at this experience.')}</p>${p.contributions?`<h3 class="detail-label">MY CONTRIBUTIONS</h3><p class="detail-description">${escape(p.contributions)}</p>`:''}${p.technologies?`<h3 class="detail-label">TECHNOLOGIES</h3><div class="detail-tags">${p.technologies.split(',').map(t=>`<span>${escape(t.trim())}</span>`).join('')}</div>`:''}`;
    $('#project-dialog').showModal();$('#project-dialog').scrollTop=0;
  }
  document.addEventListener('click',e=>{const a=e.target.closest('[data-project]');if(a){const p=projects.find(p=>p.id===a.dataset.project);if(p){e.preventDefault();openProject(p);}}const play=e.target.closest('[data-youtube]');if(play){const iframe=document.createElement('iframe');iframe.src=`https://www.youtube-nocookie.com/embed/${play.dataset.youtube}?autoplay=1&rel=0`;iframe.title=$('#project-title').textContent+' — gameplay video';iframe.allow='autoplay; encrypted-media; picture-in-picture';iframe.allowFullscreen=true;play.replaceWith(iframe);}});
  $('#close-project').addEventListener('click',()=>$('#project-dialog').close());
  $('#project-dialog').addEventListener('close',()=>{$('#project-detail').innerHTML='';});
  $('#copy-email').hidden=false;
  $('#copy-email').addEventListener('click',async()=>{const email=$('.email-address').textContent;try{await navigator.clipboard.writeText(email);$('#copy-email').textContent='Email copied ✓';$('#announcement').textContent='Email copied';}catch{$('#copy-email').textContent='Select the address below';const range=document.createRange();range.selectNodeContents($('.email-address'));getSelection().removeAllRanges();getSelection().addRange(range);}});
  fetch('assets/data/content.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(c=>{projects=c.projects;$('.portfolio-toolbar').hidden=false;render();}).catch(()=>{$('#project-count').textContent='All projects shown. Select a thumbnail to watch its video.';});
})();
