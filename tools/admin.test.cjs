const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {createPortfolioServer}=require('./admin-server.cjs');
const {validateContent}=require('./content-schema.cjs');
const {renderFiles}=require('./render-site.cjs');
const projectRoot=path.resolve(__dirname,'..');

test('case studies survive dashboard validation and render escaped, deferred video pages',async()=>{
 const source=JSON.parse(await fs.readFile(path.join(projectRoot,'assets/data/content.json'),'utf8'));
 const p=source.projects.find(p=>p.studyFocus);
 p.studyApproach='A <script>alert(1)</script> example';
 const clean=validateContent(source),saved=clean.projects.find(x=>x.id===p.id);
 assert.equal(saved.studyApproach,p.studyApproach);
 assert.equal(saved.studyResult,p.studyResult);
 const html=renderFiles(clean)[`work-${p.id}.html`];
 assert.ok(html.includes('A &lt;script&gt;alert(1)&lt;/script&gt; example'));
 assert.ok(html.includes('data-youtube='));
 assert.ok(!html.includes('<iframe'));
 assert.ok(html.includes('aria-label="More projects"'));
 p.studyFocus={invalid:true};assert.throws(()=>validateContent(source),/must be text/);
});

test('background YouTube URL survives saves and rejects unsupported links',async()=>{
 const content=JSON.parse(await fs.readFile(path.join(projectRoot,'assets/data/content.json'),'utf8'));
 for(const url of ['https://youtu.be/Nc5NxjcvrIM','https://www.youtube.com/watch?v=Nc5NxjcvrIM','https://www.youtube.com/shorts/Nc5NxjcvrIM']){
  content.profile.backgroundVideo=url;
  const clean=validateContent(content);assert.equal(clean.profile.backgroundVideo,url);
  assert.ok(renderFiles(clean)['index.html'].includes('data-video-id="Nc5NxjcvrIM"'));
 }
 content.profile.backgroundVideo='https://evil.example/watch?v=Nc5NxjcvrIM';assert.throws(()=>validateContent(content),/YouTube/);
 content.profile.backgroundVideo='';assert.ok(!renderFiles(validateContent(content))['index.html'].includes('id="hero-youtube"'));
});

test('project pages expose readable content, canonical metadata and video schema',async()=>{
 const source=JSON.parse(await fs.readFile(path.join(projectRoot,'assets/data/content.json'),'utf8'));
 const content=validateContent(source),pages=renderFiles(content),p=content.projects.find(p=>p.videoPublishedAt);
 assert.equal(content.site.url,source.site.url);
 const html=pages[`work-${p.id}.html`];
 assert.ok(html.includes('<h1>'));
 assert.ok(html.includes('youtube-nocookie.com/embed/'));
 const graph=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
 assert.equal(graph.find(x=>x['@type']==='VideoObject').duration,`PT${p.videoDurationSeconds}S`);
 assert.ok(pages['sitemap.xml'].includes(`work-${p.id}.html`));
 assert.ok(pages['robots.txt'].includes('Disallow: /admin/'));
 assert.ok(pages['portfolio.html'].includes(`href="work-${content.projects.at(-1).id}.html"`));
 content.site.sections.portfolio=false;
 assert.ok(!Object.keys(renderFiles(content)).some(name=>name.startsWith('work-')));
});

test('local dashboard protects content, rejects unsafe requests, and saves static output',async t=>{
 const fixture=await fs.mkdtemp(path.join(projectRoot,'artifacts/admin-test-'));
 await fs.mkdir(path.join(fixture,'assets/data'),{recursive:true});
 const initial=JSON.parse(await fs.readFile(path.join(projectRoot,'assets/data/content.json'),'utf8'));
 // Use a small fixture; never alter the real portfolio, password or uploads.
 initial.projects=initial.projects.slice(0,2);
 const filePaths=[initial.profile.image,initial.profile.resume,...(initial.fabListings||[]).map(p=>p.image).filter(Boolean),...initial.projects.map(p=>p.image)];
 for(const file of filePaths){await fs.mkdir(path.dirname(path.join(fixture,file)),{recursive:true});await fs.copyFile(path.join(projectRoot,file),path.join(fixture,file));}
 await fs.writeFile(path.join(fixture,'assets/data/content.json'),JSON.stringify(initial,null,2)+'\n');
 const server=createPortfolioServer({root:fixture});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(async()=>{await new Promise(resolve=>server.close(resolve));await fs.rm(fixture,{recursive:true,force:true});});
 const base=`http://127.0.0.1:${server.address().port}`;
 let cookie='',csrf='';
 async function request(route,{method='GET',data,origin=base,token=csrf,headers={}}={}){return fetch(base+route,{method,headers:{Origin:origin,'X-Portfolio-Request':'1','X-CSRF-Token':token,'Content-Type':'application/json',Cookie:cookie,...headers},...(data?{body:JSON.stringify(data)}:{})});}
 assert.equal((await request('/api/content')).status,401);
 assert.equal((await request('/api/session')).status,200);
 assert.equal((await request('/api/setup',{method:'POST',origin:'https://attacker.example',data:{password:'test-password-long-enough'}})).status,403);
 assert.equal((await request('/api/setup',{method:'POST',data:{password:'short'}})).status,400);
 assert.equal((await request('/api/setup',{method:'POST',data:{password:'test-password-long-enough'}})).status,201);
 assert.equal((await request('/api/setup',{method:'POST',data:{password:'another-password-long'}})).status,409);
 const stored=await fs.readFile(path.join(fixture,'.local/admin-auth.json'),'utf8');assert.ok(!stored.includes('test-password-long-enough'),'password stored as plaintext');
 assert.equal((await request('/api/login',{method:'POST',data:{password:'wrong'}})).status,401);
 const login=await request('/api/login',{method:'POST',data:{password:'test-password-long-enough'}});assert.equal(login.status,200);cookie=login.headers.get('set-cookie').split(';')[0];assert.match(login.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);csrf=(await login.json()).csrf;
 assert.equal((await request('/.local/admin-auth.json')).status,404);
 assert.equal((await request('/tools/admin-server.cjs')).status,404);
 assert.equal((await request('/.git/config')).status,404);
 const loaded=await(await request('/api/content')).json();
 assert.equal((await request('/api/content',{method:'PUT',token:'bad',data:{content:loaded.content,revision:loaded.revision}})).status,403);
 assert.equal((await request('/api/content',{method:'PUT',data:{content:loaded.content,revision:'old'}})).status,409);
 const invalid=structuredClone(loaded.content);invalid.contact.github='javascript:alert(1)';assert.equal((await request('/api/content',{method:'PUT',data:{content:invalid,revision:loaded.revision}})).status,400);
 assert.equal((await request('/api/upload',{method:'POST',data:{data:Buffer.from('<svg onload="alert(1)"></svg>').toString('base64')}})).status,400);
 const portrait=await fs.readFile(path.join(projectRoot,initial.profile.image));
 const upload=await request('/api/upload',{method:'POST',data:{data:portrait.toString('base64')}});assert.equal(upload.status,201);const uploaded=await upload.json();assert.match(uploaded.path,/^assets\/uploads\/[a-f0-9-]+\.(png|webp)$/);assert.equal(path.extname(uploaded.path),path.extname(initial.profile.image));
 loaded.content.projects[0].description='Updated project description for verification.';loaded.content.profile.image=uploaded.path;
 const save=await request('/api/content',{method:'PUT',data:loaded});assert.equal(save.status,200,JSON.stringify(await save.clone().json()));
 const saved=JSON.parse(await fs.readFile(path.join(fixture,'assets/data/content.json'),'utf8'));assert.equal(saved.projects[0].description,'Updated project description for verification.');
 assert.match(await fs.readFile(path.join(fixture,'index.html'),'utf8'),/Updated project description for verification/);
 assert.ok((await fs.readdir(path.join(fixture,'.local/backups'))).length);
 assert.equal((await request('/api/logout',{method:'POST',data:{}})).status,200);
 assert.equal((await request('/api/content')).status,401);
 // Per-process throttle blocks repeated password guessing.
 cookie='';csrf='';for(let i=0;i<8;i++)assert.equal((await request('/api/login',{method:'POST',data:{password:'wrong'}})).status,401);
 assert.equal((await request('/api/login',{method:'POST',data:{password:'test-password-long-enough'}})).status,429);
});

test('content schema rejects executable paths, duplicate IDs, and unsupported filters',async()=>{
 const content=JSON.parse(await fs.readFile(path.join(projectRoot,'assets/data/content.json'),'utf8'));
 assert.equal(validateContent(content).projects.length,content.projects.length);
 for(const mutate of [c=>c.profile.image='assets/img/../../.local/admin-auth.json',c=>c.projects[1].id=c.projects[0].id,c=>c.projects[0].filter='invented',c=>c.profile.imagePosition=101,c=>c.projects[0].description='',c=>c.projects[0].video='javascript:alert(1)']){const c=structuredClone(content);mutate(c);assert.throws(()=>validateContent(c));}
});

test('both layouts are generated and hidden sections disappear from each',async()=>{
 const content=JSON.parse(await fs.readFile(path.join(projectRoot,'assets/data/content.json'),'utf8'));
 const initial=renderFiles(validateContent(content));
 assert.match(initial['index.html'],/<section id="hire"/);
 assert.match(initial['index.html'],/<section id="fab"/);
 assert.match(initial['hire.html'],/<section id="hire"/);
 assert.match(initial['one-page.html'],/href="home.html">Separate pages/);
 assert.match(initial['home.html'],/href="one-page.html">One page/);
 content.site.mode='multi-page';content.site.sections.hire=false;
 const changed=renderFiles(validateContent(content));
 assert.match(changed['index.html'],/data-layout="multi-page"/);
 assert.deepEqual([...changed['index.html'].matchAll(/<section id="([^"]+)/g)].map(x=>x[1]),['home']);
 assert.equal(changed['hire.html'],undefined);
 assert.doesNotMatch(changed['one-page.html'],/href="#hire"|<section id="hire"/);
 assert.match(changed['one-page.html'],/<section id="portfolio"/);
 const many=structuredClone(content);many.fabListings=Array.from({length:7},(_,i)=>({...content.fabListings[0],title:`Fab listing ${i+1}`}));
 const gallery=renderFiles(validateContent(many))['fab.html'];
 assert.equal((gallery.match(/class="fab-card"/g)||[]).length,3);
 assert.match(gallery,/<button id="fab-load-more"/);
 assert.match(gallery,/<script type="application\/json" id="fab-data">/);
});
