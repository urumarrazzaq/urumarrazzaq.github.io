const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {createPortfolioServer}=require('./admin-server.cjs');
const {render}=require('./render-site.cjs');
const root=path.resolve(__dirname,'..');
async function listen(server){await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return `http://127.0.0.1:${server.address().port}`;}
(async()=>{
 await fs.mkdir(path.join(root,'artifacts'),{recursive:true});
 const server=createPortfolioServer();const base=await listen(server);
 let browser,fixtureServer,fixture;
 const errors=[];
 try{
  browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.waitForFunction(()=>!document.querySelector('.portfolio-toolbar').hidden);
  assert.deepEqual(await page.locator('#nav a').allTextContents(),['Home','About','Portfolio','Services','Contact']);
  assert.equal(await page.locator('main>section:visible').count(),5);
  assert.equal(await page.locator('#typed-role').textContent(),'Game Developer');
  assert.equal(await page.locator('.reel-clip').count(),8);
  assert.equal(await page.locator('.reel-controls').isVisible(),true);
  await page.locator('#reel-next').click();
  await page.waitForFunction(()=>document.querySelector('#reel-viewport').scrollLeft>10);
  await page.waitForFunction(()=>Math.abs(document.querySelector('#reel-viewport').scrollLeft - document.querySelector('.reel-clip').getBoundingClientRect().width - 16)<5);
  assert.equal(await page.locator('.expertise-item').count(),8);
  assert.equal(await page.locator('.testimonial').count(),6);
  assert.equal(await page.locator('.about-fact').count(),4);
  assert.equal(await page.locator('.about-stat').count(),3);
  assert.equal(await page.locator('.contact-links a[href*="upwork.com"]').count(),1);
  await page.screenshot({path:path.join(root,'artifacts/readable-desktop-home.png')});
  await page.evaluate(()=>{window.countSamples=[];new MutationObserver(()=>window.countSamples.push(document.querySelector('.about-stat strong').textContent)).observe(document.querySelector('.about-stat strong'),{childList:true,characterData:true,subtree:true});});
  await page.locator('.about-stats').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>window.countSamples.includes('30+')&&window.countSamples.some(value=>value!=='30+'));
  await page.locator('#about').screenshot({path:path.join(root,'artifacts/readable-desktop-about.png')});
  assert.equal(await page.locator('#project-grid .project-card').count(),9);
  await page.locator('#nav a[href="#portfolio"]').click();
  await page.locator('#project-grid').scrollIntoViewIfNeeded();
  await page.locator('#portfolio').screenshot({path:path.join(root,'artifacts/readable-desktop-portfolio.png')});
  assert.equal(await page.locator('#project-grid img').first().evaluate(el=>el.complete&&el.naturalWidth>0),true);
  for(const count of [18,27,36,40]){await page.locator('#load-more').click();assert.equal(await page.locator('#project-grid .project-card').count(),count);}
  assert.equal(await page.locator('#load-more').isVisible(),false);
  await page.locator('[data-filter="ai"]').click();assert.ok(await page.locator('#project-grid .project-card').count()>0);
  await page.locator('[data-filter="all"]').click();await page.locator('#project-search').fill('Maelstrom');assert.equal(await page.locator('#project-grid .project-card').count(),1);
  await page.locator('#project-grid .text-link').click();await page.waitForSelector('#project-dialog[open]');
  assert.equal(await page.locator('#project-title').textContent(),'Maelstrom');assert.match(await page.locator('.detail-description').first().textContent(),/replication/);
  let popups=0;page.on('popup',()=>popups++);
  let resolveVideo;const videoRequestPromise=new Promise(resolve=>{resolveVideo=resolve;});
  await page.route('https://www.youtube-nocookie.com/**',r=>{resolveVideo(r.request());return r.fulfill({contentType:'text/html',body:'Embedded player test fixture'});});
  await page.locator('.video-consent').click();assert.match(await page.locator('.detail-media iframe').getAttribute('src'),/^https:\/\/www.youtube-nocookie.com\/embed\/[\w-]{11}/);
  await page.waitForFunction(()=>document.querySelector('.detail-media iframe')?.contentWindow!==null);
  assert.equal(await page.locator('.detail-media iframe').getAttribute('referrerpolicy'),'strict-origin-when-cross-origin');
  const videoRequest=await videoRequestPromise;assert.equal(videoRequest.headers().referer,base+'/');assert.equal(popups,0);
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#project-dialog').open&&!document.querySelector('#project-dialog iframe'));
  await page.locator('#project-grid .project-image').click();assert.equal(await page.locator('#project-dialog iframe').count(),1);await page.locator('#close-project').click();
  await page.locator('#project-search').fill('no-such-project-123');assert.equal(await page.locator('.empty-state').count(),1);await page.locator('#project-search').fill('');
  const content=JSON.parse(await fs.readFile(path.join(root,'assets/data/content.json'),'utf8'));
  for(const p of content.projects){assert.equal((await page.request.get(base+'/'+p.image)).status(),200,p.title);}
  for(const width of [768,390,320]){
   const mobile=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto(base);await mobile.waitForFunction(()=>!document.querySelector('.portfolio-toolbar').hidden);
   assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${width}px horizontal overflow`);
   assert.equal(await mobile.locator('#typed-role').textContent(),'Game Developer');
   assert.equal(await mobile.locator('.portrait-frame img').evaluate(el=>getComputedStyle(el).objectPosition),'50% 35%');
   await mobile.locator('#menu-toggle').click();await mobile.keyboard.press('Escape');assert.equal(await mobile.locator('#menu-toggle').getAttribute('aria-expanded'),'false');
   await mobile.locator('#menu-toggle').click();await mobile.locator('#nav a[href="#portfolio"]').click();assert.equal(await mobile.locator('#menu-toggle').getAttribute('aria-expanded'),'false');
   await mobile.locator('#project-grid .text-link').first().click();assert.equal(await mobile.locator('#project-dialog').evaluate(el=>el.open),true);await mobile.locator('#close-project').click();
   if(width===390){await mobile.goto(base);await mobile.screenshot({path:path.join(root,'artifacts/readable-mobile-home.png')});await mobile.locator('#portfolio').screenshot({path:path.join(root,'artifacts/readable-mobile-portfolio.png')});}
   await mobile.close();
  }
  const nojs=await browser.newPage({javaScriptEnabled:false});await nojs.goto(base);assert.equal(await nojs.locator('main>section:visible').count(),5);assert.equal(await nojs.locator('.project-card').count(),9);assert.equal(await nojs.locator('#typed-role').textContent(),'Game Developer');
  const filePreview=await browser.newPage();await filePreview.goto('file:///'+path.join(root,'index.html').replace(/\\/g,'/'));
  await filePreview.locator('.reel-clip').first().click();
  assert.equal(await filePreview.locator('.video-setup').isVisible(),true);
  assert.equal(await filePreview.locator('#project-dialog iframe').count(),0);
  assert.match(await filePreview.locator('.video-setup').innerText(),/node tools\/admin-server\.cjs/);
  await filePreview.close();
  // Exercise dashboard forms against an isolated copy, never the owner's credentials.
  fixture=await fs.mkdtemp(path.join(root,'artifacts/browser-admin-'));content.projects=content.projects.slice(0,2);
  const files=['admin/index.html','admin/admin.css','admin/admin.js','assets/css/portfolio.css','assets/js/portfolio.js',content.profile.image,content.profile.resume,...content.projects.map(p=>p.image)];
  for(const file of files){await fs.mkdir(path.dirname(path.join(fixture,file)),{recursive:true});await fs.copyFile(path.join(root,file),path.join(fixture,file));}
  await fs.mkdir(path.join(fixture,'assets/data'),{recursive:true});await fs.writeFile(path.join(fixture,'assets/data/content.json'),JSON.stringify(content,null,2)+'\n');await fs.writeFile(path.join(fixture,'index.html'),render(content));
  fixtureServer=createPortfolioServer({root:fixture});const adminBase=await listen(fixtureServer);
  const admin=await browser.newPage({viewport:{width:1440,height:1000}});admin.on('pageerror',e=>errors.push(e.message));
  await admin.goto(adminBase+'/admin/');await admin.waitForFunction(()=>document.querySelector('#auth-title').textContent==='Create your password');
  await admin.locator('#password').fill('browser-test-password-2026');await admin.locator('#confirm-password').fill('browser-test-password-2026');await admin.locator('#auth-submit').click();await admin.waitForSelector('#dashboard:not([hidden])');
  await admin.locator('[data-tab="projects"]').click();await admin.screenshot({path:path.join(root,'artifacts/local-dashboard-projects.png')});
  await admin.locator('[data-path="projects.0.description"]').fill('Browser-tested project description.');await admin.locator('#save').click();await admin.waitForFunction(()=>document.querySelector('#save-state').textContent==='All changes saved');
  assert.equal(JSON.parse(await fs.readFile(path.join(fixture,'assets/data/content.json'),'utf8')).projects[0].description,'Browser-tested project description.');
  await admin.locator('#add-project').click();await admin.locator('[data-path="projects.0.title"]').fill('New dashboard project');await admin.locator('input[data-upload="projects.0.image"]').setInputFiles(path.join(root,content.profile.image));await admin.waitForFunction(()=>document.querySelector('#dashboard-message').textContent.startsWith('File uploaded locally.'));
  await admin.locator('#save').click();await admin.waitForFunction(()=>document.querySelector('#save-state').textContent==='All changes saved');
  const edited=JSON.parse(await fs.readFile(path.join(fixture,'assets/data/content.json'),'utf8'));assert.equal(edited.projects.length,3);assert.match(edited.projects[0].image,/^assets\/uploads\//);
  await admin.locator('[data-tab="testimonials"]').click();
  assert.equal(await admin.locator('[data-path$=".quote"]').count(),6);
  await admin.locator('[data-path="testimonials.0.quote"]').fill('Updated collaborator recommendation.');
  await admin.locator('#save').click();await admin.waitForFunction(()=>document.querySelector('#save-state').textContent==='All changes saved');
  assert.equal(JSON.parse(await fs.readFile(path.join(fixture,'assets/data/content.json'),'utf8')).testimonials[0].quote,'Updated collaborator recommendation.');
  await admin.locator('[data-tab="about"]').click();
  assert.equal(await admin.locator('[data-path^="about.stats."][data-path$=".value"]').count(),3);
  await admin.locator('[data-tab="profile"]').click();await admin.locator('[data-path="profile.imagePosition"]').fill('50');
  await admin.locator('#titles-editor').fill('Gameplay Programmer\nTechnical Artist');
  await admin.locator('#save').click();await admin.waitForFunction(()=>document.querySelector('#save-state').textContent==='All changes saved');
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(fixture,'assets/data/content.json'),'utf8')).profile.titles,['Gameplay Programmer','Technical Artist']);
  await admin.locator('#logout').click();await admin.waitForSelector('#auth-view:not([hidden])');assert.equal((await admin.request.get(adminBase+'/api/content')).status(),401);
  assert.deepEqual(errors,[]);
  console.log('PASS: 5 readable sections; 40 thumbnails; gallery pagination/search/category filters; descriptions and video embedding; mobile at 320/390/768px; no-JS portfolio; dashboard password setup/login/logout, project editing, upload, save, static regeneration and profile crop control.');
  console.log('Screenshots saved in artifacts/readable-*.png and artifacts/local-dashboard-projects.png.');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));if(fixtureServer)await new Promise(resolve=>fixtureServer.close(resolve));if(fixture)await fs.rm(fixture,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
