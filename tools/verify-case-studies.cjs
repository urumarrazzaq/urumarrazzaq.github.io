const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {createPortfolioServer}=require('./admin-server.cjs');
const content=require('../assets/data/content.json');
const path=require('node:path');
(async()=>{
 const server=createPortfolioServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  let embeds=0;
  await page.route('https://www.youtube-nocookie.com/embed/**',route=>{embeds++;return route.fulfill({contentType:'text/html',body:'<html><body>Embedded video test</body></html>'});});
  await page.goto(base+'/portfolio.html');
  assert.equal(await page.locator('.spotlight-selector button').count(),3);
  await page.locator('.spotlight-selector button').nth(1).click();
  await page.locator('.spotlight-copy .text-link').click();
  await page.waitForURL('**/work-project-1.html');
  assert.equal(embeds,0,'No YouTube player requested before interaction');
  assert.equal(await page.locator('.project-page-media iframe').count(),0);
  assert.ok(await page.locator('.project-page-media img').evaluate(img=>img.complete&&img.naturalWidth>0));
  await page.screenshot({path:path.join(__dirname,'../artifacts/polished-case-study-desktop.png'),fullPage:true});
  await page.locator('.project-page-media [data-youtube]').focus();await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.querySelector('.project-page-media iframe'));
  assert.equal(await page.locator('.project-page-media iframe').getAttribute('referrerpolicy'),'strict-origin-when-cross-origin');
  await page.waitForFunction(()=>document.querySelector('.project-page-media iframe').contentWindow!==null);
  const destinations=['home','about','portfolio','services','fab','hire','contact',...content.projects.filter(p=>p.studyFocus).map(p=>'work-'+p.id)];
  for(const width of [320,390,768,1440]){
   await page.setViewportSize({width,height:900});
   for(const route of destinations){
    await page.goto(`${base}/${route}.html`);
    assert.equal(await page.locator('main h1').count(),1,route+' has one primary heading');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),route+' fits '+width+'px');
   }
   if(width===390){await page.goto(base+'/work-project-1.html');await page.screenshot({path:path.join(__dirname,'../artifacts/polished-case-study-mobile.png'),fullPage:true});}
  }
  const noJS=await browser.newPage({javaScriptEnabled:false});await noJS.goto(base+'/work-project-1.html');
  assert.ok(await noJS.locator('.project-page-media a').getAttribute('href'));
  assert.ok(await noJS.getByRole('heading',{name:'The approach'}).isVisible());
  assert.deepEqual(errors,[]);
  console.log('PASS: curated case-study navigation, deferred embedded playback, keyboard play, no-JS fallback, and 10 destinations at 320/390/768/1440px without horizontal overflow or runtime errors.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
