/* Connected portfolio world. Content remains readable without WebGL or JavaScript. */
(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const destinations = ['entrance', 'control', 'projects', 'career', 'contact'];
  const labels = ['IDENTITY ENTRANCE', 'MISSION CONTROL', 'PROJECT EXHIBITION', 'CAREER DISTRICT', 'CONTACT OBSERVATORY'];
  const aliases = { hero: 'entrance', about: 'control', skills: 'control', portfolio: 'projects', services: 'control', resume: 'career', testimonials: 'career' };
  const reduceQuery = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduceQuery.matches;
  let active = 0;
  let projects = [];
  let worlds = {};
  let scene = null;
  const escape = (value = '') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  // Data is authored locally; reject non-HTTP links before rendering it into a page.
  const external = value => { try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) ? escape(u.href) : ''; } catch { return ''; } };
  const image = value => typeof value === 'string' && /^assets\/img\/[\w ./-]+$/.test(value) ? escape(value) : '';

  function navigate(id, focus = true) {
    id = aliases[id] || id;
    const index = destinations.indexOf(id);
    if (index < 0) return false;
    active = index;
    destinations.forEach(name => {
      const section = document.getElementById(name);
      section.classList.toggle('active', name === id);
      section.inert = !document.body.classList.contains('reading') && name !== id;
    });
    document.querySelectorAll('#destinations a').forEach(link => {
      if (link.hash === '#' + id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    $('#location-number').textContent = String(index + 1).padStart(2, '0');
    $('#location-name').textContent = labels[index];
    $('#announcement').textContent = labels[index].toLowerCase();
    $('.header').classList.remove('menu-open');
    $('.menu-toggle').setAttribute('aria-expanded', 'false');
    scene?.travel(index);
    if (focus) {
      const section = document.getElementById(id);
      section.setAttribute('tabindex', '-1');
      section.focus({ preventScroll: true });
      if (document.body.classList.contains('reading')) section.scrollIntoView({ behavior: paused ? 'instant' : 'smooth' });
      else section.scrollTop = 0;
    }
    return true;
  }

  document.body.classList.add('enhanced');
  navigate(location.hash.slice(1) || 'entrance', false) || navigate('entrance', false);
  addEventListener('hashchange', () => navigate(location.hash.slice(1)));
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link || link.hash === '#main') return;
    const target = aliases[link.hash.slice(1)] || link.hash.slice(1);
    if (!destinations.includes(target)) return;
    e.preventDefault();
    $('#map-dialog').close();
    if (location.hash !== '#' + target) history.pushState(null, '', '#' + target);
    navigate(target);
  });
  addEventListener('popstate', () => navigate(location.hash.slice(1) || 'entrance'));
  $('.menu-toggle').addEventListener('click', () => {
    const open = $('.header').classList.toggle('menu-open');
    $('.menu-toggle').setAttribute('aria-expanded', String(open));
  });
  document.querySelectorAll('.close-dialog').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
  $('#world-map-button').addEventListener('click', () => $('#map-dialog').showModal());
  $('#open-archive').addEventListener('click', () => $('#archive-dialog').showModal());
  $('#year').textContent = new Date().getFullYear();

  function updateMotion() {
    document.body.classList.toggle('motion-paused', paused);
    $('#motion-toggle').setAttribute('aria-pressed', String(paused));
    $('#motion-toggle').textContent = paused ? 'Resume motion' : 'Pause motion';
    scene?.setPaused(paused);
  }
  $('#motion-toggle').addEventListener('click', () => { paused = !paused; updateMotion(); });
  reduceQuery.addEventListener('change', e => { paused = e.matches; updateMotion(); });
  updateMotion();
  $('#reading-toggle').addEventListener('click', () => {
    const reading = document.body.classList.toggle('reading');
    $('#reading-toggle').setAttribute('aria-pressed', String(reading));
    $('#reading-toggle').textContent = reading ? 'World mode' : 'Reading mode';
    navigate(destinations[active], false);
    window.scrollTo(0, 0);
  });
  $('#copy-email').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText('umarrazzaq8899@gmail.com');
      $('#copy-email').textContent = 'Email copied ✓';
      $('#announcement').textContent = 'Email address copied to clipboard';
    } catch {
      $('#copy-email').textContent = 'Select the email below';
      const selection = getSelection();
      const range = document.createRange();
      range.selectNodeContents($('.email-address'));
      selection.removeAllRanges(); selection.addRange(range);
    }
  });

  function card(project) {
    return `<button class="archive-card" data-project="${escape(project.id)}"><img src="${image(project.image)}" alt="${escape(project.title)}" loading="lazy"><span class="card-content"><small>${escape(project.category)}</small><span class="card-action">↗</span><strong>${escape(project.title)}</strong></span></button>`;
  }
  function filterProjects() {
    const term = $('#project-search').value.trim().toLowerCase();
    const filter = $('#project-filter').value;
    const filtered = projects.filter(p => (filter === 'all' || p.filter.split(/\s+/).map(f => f.replace(/^filter-/, '')).includes(filter)) && `${p.title} ${p.category}`.toLowerCase().includes(term));
    $('#archive-grid').innerHTML = filtered.map(card).join('') || '<p class="empty-state">No projects match. Try another search or discipline.</p>';
    $('#project-count').textContent = `${filtered.length} / ${projects.length} PROJECTS`;
  }
  $('#project-search').addEventListener('input', filterProjects);
  $('#project-filter').addEventListener('change', filterProjects);
  function openProject(p) {
    const video = external(p.video);
    const link = external(p.link);
    $('#project-eyebrow').textContent = p.category;
    $('#project-detail').innerHTML = `<div class="project-layout"><img src="${image(p.image)}" alt="${escape(p.title)}"><div><h2 id="project-title">${escape(p.title)}</h2><p>${escape(p.category)} · Selected work from my portfolio.</p><p>Explore the original project footage and linked project page for a closer look at the experience.</p><div class="actions">${video ? `<a class="button" href="${video}" target="_blank" rel="noopener">Watch gameplay ↗</a>` : ''}${link && link !== video ? `<a class="button secondary" href="${link}" target="_blank" rel="noopener">Project page ↗</a>` : ''}</div></div></div>`;
    $('#project-dialog').showModal();
  }
  function openWorld(key) {
    const w = worlds[key];
    if (!w) return;
    $('#project-eyebrow').textContent = w.eyebrow;
    $('#project-dialog').dataset.world = key;
    $('#project-detail').innerHTML = `<div class="project-layout">${w.media ? `<img src="${image(w.media)}" alt="${escape(w.title)} project media">` : `<div class="project-media ${escape(w.theme)}"><span>${escape(w.title.split(' ').map(s => s[0]).join(''))}</span><span>PROJECT MEDIA COMING SOON</span></div>`}<div><h2 id="project-title">${escape(w.title)}</h2><p>${escape(w.description)}</p><p>${escape(w.status)}</p><h4>CONTRIBUTIONS</h4><p>${escape(w.contributions)}</p><h4>TECHNOLOGIES</h4><div class="tags">${w.technologies.length ? w.technologies.map(t => `<span>${escape(t)}</span>`).join('') : '<span>Details coming soon</span>'}</div>${external(w.video) ? `<div class="actions"><a class="button" href="${external(w.video)}" target="_blank" rel="noopener">Watch gameplay ↗</a></div>` : ''}</div></div>`;
    $('#project-dialog').classList.remove('portal-enter');
    $('#project-dialog').showModal();
    $('#project-dialog').classList.add('portal-enter');
    scene?.project(key);
  }
  $('#project-dialog').addEventListener('close', () => {
    delete $('#project-dialog').dataset.world;
    scene?.travel(active);
  });
  document.addEventListener('click', e => {
    const project = e.target.closest('[data-project]');
    if (project) { const p = projects.find(p => p.id === project.dataset.project); if (p) openProject(p); }
    const portal = e.target.closest('[data-project-world]');
    if (portal) openWorld(portal.dataset.projectWorld);
  });
  Promise.all([fetch('assets/data/projects.json').then(r => { if (!r.ok) throw Error('Project archive unavailable'); return r.json(); }), fetch('assets/data/worlds.json').then(r => { if (!r.ok) throw Error('Project worlds unavailable'); return r.json(); })])
    .then(([p, w]) => {
      projects = p; worlds = w;
      $('#featured-projects').innerHTML = [projects[0], projects[1], projects.find(p => p.title === 'DIShooter Gameplay Trailer') || projects[3]].filter(Boolean).map(card).join('');
      filterProjects();
    }).catch(() => {
      $('#featured-projects').innerHTML = '<p class="muted">The project archive could not load. <a class="text-link" href="https://www.youtube.com/@urumarrazzaq">Explore project videos on YouTube ↗</a></p>';
      $('#project-count').textContent = 'ARCHIVE UNAVAILABLE — PLEASE RELOAD';
      document.querySelectorAll('[data-project-world]').forEach(b => { b.disabled = true; b.title = 'Project data could not load. Please reload.'; });
    });

  // Small damped tilt is applied directly to holograms, never to reading surfaces.
  document.querySelectorAll('.portal').forEach(el => {
    el.addEventListener('pointermove', e => {
      if (paused || e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      el.style.transform = `perspective(800px) rotateX(${(0.5 - (e.clientY-r.top)/r.height)*4}deg) rotateY(${((e.clientX-r.left)/r.width-0.5)*6}deg) translateY(-4px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  function createWorld() {
    if (!window.THREE || reduceQuery.matches) return null;
    const T = window.THREE;
    const canvas = $('#world');
    let renderer;
    try { renderer = new T.WebGLRenderer({ canvas, antialias: devicePixelRatio < 2, alpha: true, powerPreference: 'low-power' }); } catch { return null; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 720 ? 1 : 1.5));
    renderer.setSize(innerWidth, innerHeight);
    const world = new T.Scene();
    world.fog = new T.FogExp2(0x10191d, 0.022);
    const camera = new T.PerspectiveCamera(58, innerWidth/innerHeight, .1, 200);
    const materials = {
      wall: new T.MeshStandardMaterial({ color: 0x1c3038, roughness: .72, metalness: .4 }),
      floor: new T.MeshStandardMaterial({ color: 0x14232c, roughness: .35, metalness: .6 }),
      trim: new T.MeshStandardMaterial({ color: 0xd9ad71, emissive: 0xd9ad71, emissiveIntensity: .55, roughness: .5 }),
      glass: new T.MeshStandardMaterial({ color: 0x6cb2bd, emissive: 0x245f68, transparent: true, opacity: .26, side: T.DoubleSide, metalness: .4, roughness: .2 })
    };
    function box(x,y,z,w,h,d,material=materials.wall) {
      const mesh = new T.Mesh(new T.BoxGeometry(w,h,d), material);
      mesh.position.set(x,y,z);world.add(mesh);return mesh;
    }
    world.add(new T.HemisphereLight(0x9abfc9,0x11151b,1.4));
    const sun = new T.DirectionalLight(0xffd4a0,1.4);sun.position.set(20,30,10);world.add(sun);
    box(44,-.3,1,112,.6,30,materials.floor);
    // A shared front skywalk physically connects all five destinations.
    box(44,0,12,112,.1,5,materials.floor);
    for (const z of [10,14]) box(44,.1,z,112,.04,.04,materials.trim);
    const holograms = [];
    const doors = [];
    for (let i=0;i<5;i++) {
      const x=i*22;
      for (const offset of [-9,9]) {
        box(x+offset,3,-1,.45,6,17);
        for (let z=-8;z<=7;z+=4) { box(x+offset*.96,3,z,.12,5,.18,materials.trim); }
      }
      if (i!==3) {
        box(x,6,-1,18,.4,18);
        for (const z of [-8,-2,4]) { box(x,5.75,z,17,.05,.07,materials.trim); }
      }
      box(x,0,-8,18,.12,1,materials.trim);
      for (let n=-3;n<=3;n++) box(x+n*2.5,.025,-1,.025,.04,18,materials.trim);
      // Split airlock leaves move apart when the camera enters the room.
      if (i < 3) for (const direction of [-1,1]) {
        const door = box(x+direction*6.9,2.7,7,4.2,5.4,.25);
        doors.push({ mesh:door, x, direction });
      }
      if (i===1) {
        box(x,1,-3,4,2,3,materials.floor);
        const crystal = new T.Mesh(new T.OctahedronGeometry(1.2),materials.glass);
        crystal.position.set(x,3.6,-3);world.add(crystal);holograms.push(crystal);
        for (const side of [-1,1]) for (let z=-5;z<=1;z+=3) box(x+side*5,3,z,2.8,1.8,.08,materials.glass);
      }
      if (i===2) {
        for (let p=0;p<4;p++) {
          const px=x-6+p*4;
          const mat = new T.MeshStandardMaterial({color:[0x91a79a,0x7bd5da,0xdb9c72,0xd4b18d][p],emissive:[0x91a79a,0x7bd5da,0xdb9c72,0xd4b18d][p],emissiveIntensity:.65});
          box(px-1.4,2.5,-5,.08,5,.3,mat);box(px+1.4,2.5,-5,.08,5,.3,mat);box(px,5,-5,2.9,.08,.3,mat);
          const gate=box(px,2.5,-5,2.7,4.8,.06,materials.glass);holograms.push(gate);
        }
      }
      if (i===3) {
        for (const side of [-1,1]) for (let n=0;n<5;n++) {
          const height=7+(n%3)*4;
          box(x+side*(13+n*3),height/2,-10-n*6,3,height,4);
          box(x+side*(13+n*3),height/2,-7.9-n*6,.06,height,.05,materials.trim);
        }
      }
      if (i===4) {
        for (let n=-2;n<=2;n++) box(x+n*4,3,-8,.15,6,.15,materials.trim);
        const planet=new T.Mesh(new T.SphereGeometry(12,24,16),new T.MeshStandardMaterial({color:0x6d8185,roughness:1}));
        planet.position.set(x+8,14,-43);world.add(planet);
        const ring=new T.Mesh(new T.TorusGeometry(4,.04,6,64),materials.trim);ring.rotation.x=Math.PI/2;ring.position.set(x,.1,-2);world.add(ring);
      }
    }
    const particles = new Float32Array(100*3);
    for(let i=0;i<particles.length;i+=3){particles[i]=(i*17.3%110)-10;particles[i+1]=(i*1.37%7)+.5;particles[i+2]=(i*3.23%22)-10;}
    const pg=new T.BufferGeometry();pg.setAttribute('position',new T.BufferAttribute(particles,3));
    const points=new T.Points(pg,new T.PointsMaterial({color:0xd9ad71,size:.035,transparent:true,opacity:.6}));world.add(points);
    let target=active*22, current=target, from=target, progress=1, targetZ=9, currentZ=9, halted=paused, raf=0, previous=0, elapsed=0;
    const pointer={x:0,y:0};
    addEventListener('pointermove',e=>{pointer.x=(e.clientX/innerWidth-.5)*2;pointer.y=(e.clientY/innerHeight-.5)*2;},{passive:true});
    function render(now=0) {
      raf=0;
      const dt=Math.min((now-previous)/1000||.016,.05);previous=now;
      if(!halted){elapsed+=dt;progress=Math.min(progress+dt/.95,1);const ease=progress*progress*(3-2*progress);current=from+(target-from)*ease;currentZ+=(targetZ-currentZ)*Math.min(dt*4,1);}
      else {current=target;currentZ=targetZ;progress=1;}
      const bridge=Math.sin(progress*Math.PI)*6;
      camera.position.set(current+(halted?0:pointer.x*.16),2.7+(halted?0:Math.sin(elapsed*.3)*.045-pointer.y*.08),currentZ+bridge);
      camera.lookAt(current,2.4,-5);
      holograms.forEach((h,i)=>{if(!halted){h.rotation.y=Math.sin(elapsed*.5+i)*.07;h.position.y+=(Math.sin(elapsed+i)*.001);}});
      doors.forEach(d=>{const proximity=Math.max(0,1-Math.abs(current-d.x)/14);d.mesh.position.x=d.x+d.direction*(6.9+proximity*2);});
      if(!halted){points.rotation.z=Math.sin(elapsed*.08)*.012;points.position.x=pointer.x*.2;points.position.y=-pointer.y*.1;}
      renderer.render(world,camera);
      if(!halted&&!document.hidden) raf=requestAnimationFrame(render);
    }
    function wake(){if(!raf){previous=performance.now();raf=requestAnimationFrame(render);}}
    addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);wake();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else wake();});
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(raf);raf=0;canvas.style.display='none';});
    wake();
    return {
      travel(index){from=current;target=index*22;targetZ=9;progress=0;wake();},
      project(key){from=current;target=44+({subject:-6,cheebz:-2,tensei:2,copper:6}[key]||0);targetZ=-.5;progress=0;wake();},
      setPaused(value){halted=value;wake();}
    };
  }
  scene=createWorld();
})();
