(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const escape = (s = '') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const batchSize = 9;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let projects = [], filter = 'all', limit = batchSize;
  const safeURL = value => {
    if (typeof value !== 'string') return '';
    if (/^(assets\/(img|uploads)\/|resume\/)[\w ./()-]+$/.test(value)) return value;
    try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) ? u.href : ''; } catch { return ''; }
  };
  const splitFilter = p => p.filter.split(/\s+/).map(x => x.replace(/^filter-/, ''));
  function card(p) {
    return `<article class="project-card" data-id="${escape(p.id)}"><button class="project-image" data-project="${escape(p.id)}" data-play="true" aria-label="Watch ${escape(p.title)} inside the website"><img src="${escape(safeURL(p.image))}" alt="${escape(p.title)} — project thumbnail" loading="lazy" width="640" height="360"><span class="play-badge" aria-hidden="true">▶</span><span class="play-label">WATCH GAMEPLAY</span></button><div class="project-copy"><p class="eyebrow">${escape(p.category)}</p><h3><button data-project="${escape(p.id)}">${escape(p.title)}</button></h3><p>${escape(p.description || 'Project footage and a closer look at the experience.')}</p><button class="text-link" data-project="${escape(p.id)}">Project details <span>↗</span></button></div></article>`;
  }
  // One-time reveals animate content only after it is visible; nothing is hidden while loading.
  const reveals = new IntersectionObserver(entries => {
    for (const {target, isIntersecting} of entries) {
      if (!isIntersecting) continue;
      reveals.unobserve(target);
      if (!motion.matches) target.animate([
        {opacity: .35, transform: 'translateY(22px)'},
        {opacity: 1, transform: 'translateY(0)'}
      ], {duration: 650, easing: 'cubic-bezier(.2,.7,.2,1)'});
    }
  }, {threshold: .06});
  function observeCards() { document.querySelectorAll('.project-card:not([data-observed])').forEach(el => { el.dataset.observed = 'true'; reveals.observe(el); }); }
  document.querySelectorAll('.about-layout,.section-heading,.service-card,.skills,.contact-section .actions').forEach(el => reveals.observe(el));
  motion.addEventListener('change', () => { if (motion.matches) document.getAnimations().forEach(a => a.cancel()); });
  function render(append = false) {
    const term = $('#project-search').value.trim().toLowerCase();
    const matches = projects.filter(p => (filter === 'all' || splitFilter(p).includes(filter)) && `${p.title} ${p.category} ${p.description || ''}`.toLowerCase().includes(term));
    const visible = matches.slice(0, limit);
    if (append) $('#project-grid').insertAdjacentHTML('beforeend', visible.slice(Math.max(0, limit - batchSize)).map(card).join(''));
    else {
      document.querySelectorAll('#project-grid .project-card').forEach(el => reveals.unobserve(el));
      $('#project-grid').innerHTML = visible.map(card).join('') || '<p class="empty-state">No projects found. Try another search or category.</p>';
    }
    $('#project-count').textContent = `Showing ${visible.length} of ${matches.length} ${filter === 'all' ? '' : 'matching '}projects`;
    $('#load-more').hidden = limit >= matches.length;
    $('#load-status').textContent = matches.length ? `${Math.max(0, matches.length - visible.length)} more ${filter === 'all' ? 'projects' : 'matching projects'}${visible.length === matches.length ? ' · You’ve reached the end' : ''}` : 'Clear your search to explore the portfolio.';
    observeCards();
  }
  $('#menu-toggle').addEventListener('click', () => { $('.sidebar').classList.toggle('menu-open'); $('#menu-toggle').setAttribute('aria-expanded', String($('.sidebar').classList.contains('menu-open'))); });
  document.querySelectorAll('#nav a').forEach(a => a.addEventListener('click', () => { $('.sidebar').classList.remove('menu-open'); $('#menu-toggle').setAttribute('aria-expanded', 'false'); }));
  const aliases = {entrance:'home',hero:'home',control:'about',skills:'about',projects:'portfolio',career:'about',resume:'about'};
  if (aliases[location.hash.slice(1)]) { const id = aliases[location.hash.slice(1)]; history.replaceState(null, '', '#' + id); document.getElementById(id).scrollIntoView(); }
  const observer = new IntersectionObserver(entries => {
    const entry = entries.filter(e => e.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!entry) return;
    document.querySelectorAll('#nav a').forEach(a => { if (a.hash === '#' + entry.target.id) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
  }, {rootMargin:'-10% 0px -45% 0px',threshold:[0,.1,.3]});
  document.querySelectorAll('main>section').forEach(s => observer.observe(s));
  document.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => {
    filter = b.dataset.filter; limit = batchSize;
    document.querySelectorAll('[data-filter]').forEach(el => el.setAttribute('aria-pressed', String(el === b)));
    render();
  }));
  $('#project-search').addEventListener('input', () => { limit = batchSize; render(); });
  $('#load-more').addEventListener('click', () => {
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
      notice.innerHTML = '<strong>Open the portfolio through the local server to play this video here.</strong><p>YouTube requires a website address for embedded playback. In this project folder, run <code>npm start</code>, then open <a href="http://127.0.0.1:8080/">http://127.0.0.1:8080/</a>.</p>';
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
    if (a) { const p = projects.find(p => p.id === a.dataset.project); if (p) { e.preventDefault(); openProject(p, a.dataset.play === 'true'); } }
    const play = e.target.closest('[data-youtube]');
    if (play) playEmbedded(play.dataset.youtube);
  });
  $('#close-project').addEventListener('click', () => $('#project-dialog').close());
  $('#project-dialog').addEventListener('close', () => { $('#project-detail').innerHTML = ''; });
  $('#copy-email').hidden = false;
  $('#copy-email').addEventListener('click', async () => {
    const email = $('.email-address').textContent;
    try { await navigator.clipboard.writeText(email); $('#copy-email').textContent = 'Email copied ✓'; $('#announcement').textContent = 'Email copied'; }
    catch { $('#copy-email').textContent = 'Select the address below'; const range = document.createRange(); range.selectNodeContents($('.email-address')); getSelection().removeAllRanges(); getSelection().addRange(range); }
  });
  // Generated JSON is inert, escaped at build time, and works even when opened locally.
  // Only the visible batch creates image elements; remaining media waits for Load more.
  try {
    projects = JSON.parse($('#portfolio-data').textContent);
    $('.portfolio-toolbar').hidden = false;
    render();
  } catch {
    $('#project-count').textContent = 'Project data could not load. Reload the page to try again.';
  }
})();
