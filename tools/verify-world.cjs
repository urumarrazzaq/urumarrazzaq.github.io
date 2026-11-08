/* Run with Node and Playwright available: node tools/verify-world.cjs */
const { chromium } = require('playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const types = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.json':'application/json', '.png':'image/png', '.webp':'image/webp', '.jpg':'image/jpeg', '.pdf':'application/pdf' };
const server = http.createServer(async (req,res) => {
  try {
    const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url,'http://localhost').pathname === '/' ? '/index.html' : new URL(req.url,'http://localhost').pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    res.setHeader('Content-Type',types[path.extname(file)] || 'application/octet-stream');
    res.end(await fs.readFile(file));
  } catch { res.writeHead(404).end(); }
});
(async () => {
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL || 'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
  const errors = [], missing = [];
  const page = await browser.newPage({ viewport:{width:1440,height:1000} });
  const settled = async target => target.locator('.destination.active').evaluate(el => Promise.all(el.getAnimations().map(a => a.finished.catch(()=>{}))));
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)missing.push(r.url());});
  try {
    await fs.mkdir(path.join(root,'artifacts'),{recursive:true});
    await page.goto(base);
    await page.waitForSelector('#featured-projects .archive-card',{state:'attached'});
    assert.equal(await page.locator('.destination.active').getAttribute('id'),'entrance');
    await settled(page);
    await page.screenshot({path:path.join(root,'artifacts/desktop-entrance.png')});
    for (const id of ['control','projects','career','contact']) {
      await page.locator(`#destinations a[href="#${id}"]`).click();
      assert.equal(await page.locator('.destination.active').getAttribute('id'),id);
      assert.equal(await page.locator(`#${id}`).evaluate(el=>el.inert),false);
      assert.equal(await page.locator('.destination:not(.active)').first().evaluate(el=>el.inert),true);
    }
    await page.locator('#destinations a[href="#projects"]').click();
    await settled(page);
    await page.screenshot({path:path.join(root,'artifacts/desktop-projects.png')});
    for (const key of ['subject','cheebz','tensei','copper']) {
      await page.locator(`[data-project-world="${key}"]`).click();
      await page.waitForSelector('#project-dialog[open]');
      assert.ok((await page.locator('#project-title').textContent()).length);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#project-dialog').evaluate(el=>el.open),false);
    }
    await page.locator('#open-archive').click();
    assert.equal(await page.locator('#archive-grid .archive-card').count(),40);
    await page.locator('#project-search').fill('Maelstrom');
    assert.equal(await page.locator('#archive-grid .archive-card').count(),1);
    await page.locator('#archive-grid .archive-card').click();
    assert.equal(await page.locator('#project-title').textContent(),'Maelstrom');
    assert.ok((await page.locator('#project-dialog a').first().getAttribute('href')).startsWith('https://'));
    await page.keyboard.press('Escape');
    await page.locator('#project-search').fill('not-a-project-123');
    assert.equal(await page.locator('#archive-grid .archive-card').count(),0);
    await page.locator('#project-search').fill('');
    await page.locator('#project-filter').selectOption('archviz');
    assert.ok(await page.locator('#archive-grid .archive-card').count()>0);
    // Load every archived image to catch legacy case/path problems, even offscreen.
    const data = await (await page.request.get(base+'/assets/data/projects.json')).json();
    for (const project of data) assert.equal((await page.request.get(base+'/'+project.image)).status(),200,project.image);
    await page.keyboard.press('Escape');
    await page.locator('#world-map-button').click();
    await page.locator('#map-dialog a[href="#contact"]').click();
    assert.equal(await page.locator('.destination.active').getAttribute('id'),'contact');
    await page.locator('#motion-toggle').click();
    assert.equal(await page.locator('#motion-toggle').getAttribute('aria-pressed'),'true');
    await page.locator('#reading-toggle').click();
    assert.equal(await page.locator('.destination[inert]').count(),0);
    await page.locator('#reading-toggle').click();
    await page.goto(base+'/#portfolio');
    assert.equal(await page.locator('.destination.active').getAttribute('id'),'projects');
    const mobile = await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    mobile.on('pageerror',e=>errors.push(e.message));
    await mobile.goto(base);
    await mobile.waitForSelector('#featured-projects .archive-card',{state:'attached'});
    await mobile.screenshot({path:path.join(root,'artifacts/mobile-entrance.png')});
    assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'mobile horizontal overflow');
    await mobile.locator('.menu-toggle').click();
    await mobile.locator('#destinations a[href="#projects"]').click();
    await mobile.screenshot({path:path.join(root,'artifacts/mobile-projects.png')});
    await mobile.locator('[data-project-world="subject"]').click();
    await mobile.locator('#project-dialog .close-dialog').click();
    assert.equal(await mobile.locator('#motion-toggle').getAttribute('aria-pressed'),'true');
    const fallback = await browser.newPage({javaScriptEnabled:false});
    await fallback.goto(base);
    assert.equal(await fallback.locator('.destination:visible').count(),5);
    const noWebgl = await browser.newPage();
    await noWebgl.route('**/three.min.js',r=>r.abort());
    await noWebgl.goto(base+'/#career');
    assert.equal(await noWebgl.locator('.destination.active').getAttribute('id'),'career');
    assert.deepEqual(errors,[],'JavaScript errors');
    assert.deepEqual(missing,[],'Missing local resources');
    console.log('PASS: desktop/mobile navigation, 4 portals, 40 project assets, archive search/filter/details, dialogs, map, motion, reading mode, legacy anchors, no-JS and no-WebGL fallbacks.');
    console.log('Screenshots: artifacts/desktop-entrance.png, desktop-projects.png, mobile-entrance.png, mobile-projects.png');
  } finally { await browser.close(); server.close(); }
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
