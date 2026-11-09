'use strict';
const http=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const {promisify}=require('node:util');
const scrypt=promisify(crypto.scrypt);
const {validateContent}=require('./content-schema.cjs');
const {renderFiles}=require('./render-site.cjs');
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.pdf':'application/pdf','.mp4':'video/mp4','.webm':'video/webm','.svg':'image/svg+xml','.woff2':'font/woff2','.woff':'font/woff','.ico':'image/x-icon'};
function fail(status,message){const e=Error(message);e.status=status;throw e;}
async function body(req,limit=1024*1024){let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>limit)fail(413,'Request is too large.');chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{fail(400,'Invalid JSON request.');}}
async function atomic(file,data){await fs.mkdir(path.dirname(file),{recursive:true});const tmp=file+'.'+crypto.randomUUID()+'.tmp';try{await fs.writeFile(tmp,data,{mode:0o600});await fs.rename(tmp,file);}finally{await fs.rm(tmp,{force:true}).catch(()=>{});}}
function fileType(bytes){if(bytes.length<16)return null;if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))&&bytes.subarray(12,16).toString()==='IHDR')return 'png';if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'jpg';if(bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP')return 'webp';if(['GIF87a','GIF89a'].includes(bytes.subarray(0,6).toString()))return 'gif';if(bytes.subarray(0,5).toString()==='%PDF-')return 'pdf';if(bytes.subarray(4,8).toString()==='ftyp')return 'mp4';if(bytes.subarray(0,4).equals(Buffer.from([26,69,223,163])))return 'webm';return null;}
function createPortfolioServer({root=path.resolve(__dirname,'..')}={}){
 const contentFile=path.join(root,'assets/data/content.json'),privateRoot=path.join(root,'.local'),authFile=path.join(privateRoot,'admin-auth.json');
 const sessions=new Map();let failures=0,blockedUntil=0,passwordBusy=false,writing=false;
 async function readContent(){const raw=await fs.readFile(contentFile,'utf8');return {content:JSON.parse(raw),revision:digest(raw)};}
 async function auth(){try{return JSON.parse(await fs.readFile(authFile,'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw e;}}
 function json(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value));}
 const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://shared.akamai.steamstatic.com; media-src 'self' https:; frame-src https://www.youtube-nocookie.com; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
  try{
   const port=server.address().port,allowedHosts=[`127.0.0.1:${port}`,`localhost:${port}`];
   if(!allowedHosts.includes(req.headers.host))fail(403,'Only local dashboard access is allowed.');
   const url=new URL(req.url,`http://${req.headers.host}`),route=decodeURIComponent(url.pathname);
   if(route.startsWith('/api/')){
    res.setHeader('Cache-Control','no-store');
    const rawCookie=(req.headers.cookie||'').match(/(?:^|;\s*)portfolio_session=([a-f0-9]{64})(?:;|$)/)?.[1];
    const key=rawCookie?digest(rawCookie):null;let session=key?sessions.get(key):null;
    if(session&&session.expires<Date.now()){sessions.delete(key);session=null;}
    if(req.method!=='GET'){
     if(req.headers.origin!==`http://${req.headers.host}`||req.headers['x-portfolio-request']!=='1')fail(403,'This request must originate from the local dashboard.');
     if(session&&req.headers['x-csrf-token']!==session.csrf)fail(403,'Your session token is missing. Sign in again.');
    }
    if(route==='/api/session'&&req.method==='GET')return json(res,200,{authenticated:!!session,setupRequired:!(await auth()),csrf:session?.csrf});
    if(route==='/api/setup'&&req.method==='POST'){
     if(passwordBusy)fail(409,'Password setup is already in progress.');passwordBusy=true;
     try{if(await auth())fail(409,'A password is already configured.');const {password}=await body(req,4096);if(typeof password!=='string'||password.length<12||password.length>256)fail(400,'Choose a password between 12 and 256 characters.');const salt=crypto.randomBytes(32).toString('hex');const hash=(await scrypt(password,salt,64)).toString('hex');await atomic(authFile,JSON.stringify({salt,hash})+'\n');return json(res,201,{ok:true});}finally{passwordBusy=false;}
    }
    if(route==='/api/login'&&req.method==='POST'){
     if(Date.now()<blockedUntil)fail(429,'Too many attempts. Try again in ten minutes.');
     const saved=await auth();if(!saved)fail(409,'Set up a password first.');const {password}=await body(req,4096);
     if(typeof password!=='string'||password.length>256)fail(400,'Enter a valid password.');
     const actual=await scrypt(password,saved.salt,64),expected=Buffer.from(saved.hash,'hex');
     if(!crypto.timingSafeEqual(actual,expected)){failures++;if(failures>=8){blockedUntil=Date.now()+600000;failures=0;}fail(401,'Incorrect password.');}
     failures=0;const token=crypto.randomBytes(32).toString('hex'),csrf=crypto.randomBytes(32).toString('hex');
     for(const [k,s]of sessions)if(s.expires<Date.now())sessions.delete(k);
     if(sessions.size>=20)sessions.delete(sessions.keys().next().value);
     sessions.set(digest(token),{csrf,expires:Date.now()+4*60*60*1000});
     res.setHeader('Set-Cookie',`portfolio_session=${token}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=14400`);return json(res,200,{ok:true,csrf});
    }
    if(!session)fail(401,'Please sign in to manage your portfolio.');
    if(route==='/api/logout'&&req.method==='POST'){sessions.delete(key);res.setHeader('Set-Cookie','portfolio_session=; HttpOnly; SameSite=Strict; Path=/api; Max-Age=0');return json(res,200,{ok:true});}
    if(route==='/api/content'&&req.method==='GET')return json(res,200,await readContent());
    if(route==='/api/content'&&req.method==='PUT'){
     const submitted=await body(req,3*1024*1024);if(writing)fail(409,'A save is already in progress. Please try again.');writing=true;
     try{
      const previous=await readContent();if(submitted.revision!==previous.revision)fail(409,'Content has changed since you opened it. Reload the dashboard before saving.');
      let content;try{content=validateContent(submitted.content);}catch(e){fail(400,e.message);}
      const files=[content.profile.image,content.profile.resume,...content.fabListings.map(item=>item.image).filter(Boolean),...content.projects.flatMap(p=>[...(p.image.startsWith('assets/')?[p.image]:[]),...(p.video.startsWith('assets/')?[p.video]:[])])];
      for(const file of new Set(files)){try{const real=await fs.realpath(path.join(root,file));if(!real.startsWith(root+path.sep)||!(await fs.stat(real)).isFile())throw Error();}catch{fail(400,`File not found in this repository: ${file}. Upload it or choose an existing file before saving.`);}}
      const raw=JSON.stringify(content,null,2)+'\n',pages=renderFiles(content);
      await atomic(path.join(privateRoot,'backups',`${Date.now()}-${crypto.randomUUID()}.json`),JSON.stringify(previous.content,null,2)+'\n');
      await atomic(contentFile,raw);
      for(const [name,html] of Object.entries(pages))await atomic(path.join(root,name),html);
      for(const id of ['about','portfolio','services','fab','hire','contact'])if(!pages[id+'.html'])await fs.rm(path.join(root,id+'.html'),{force:true});
      return json(res,200,{ok:true,revision:digest(raw)});
     }finally{writing=false;}
    }
    if(route==='/api/upload'&&req.method==='POST'){
     const upload=await body(req,35*1024*1024);if(typeof upload.data!=='string'||!/^[A-Za-z0-9+/]*={0,2}$/.test(upload.data))fail(400,'Invalid upload data.');
     const bytes=Buffer.from(upload.data,'base64');if(bytes.length>25*1024*1024)fail(413,'Files must be 25 MB or smaller.');
     const type=fileType(bytes);if(!type)fail(400,'Upload a PNG, JPEG, WebP, GIF, PDF, MP4, or WebM file. SVG and executable uploads are not supported.');
     const relative=`assets/uploads/${crypto.randomUUID()}.${type}`;await atomic(path.join(root,relative),bytes);return json(res,201,{path:relative,type,size:bytes.length});
    }
    fail(404,'Unknown dashboard endpoint.');
   }
   if(!['GET','HEAD'].includes(req.method))fail(405,'Method not allowed.');
   if(route==='/admin'){res.writeHead(302,{Location:'/admin/'}).end();return;}
   let relative=route==='/'?'index.html':route==='/admin/'?'admin/index.html':route.replace(/^\//,'');
   if(relative.split('/').some(s=>s.startsWith('.')||s==='..')||!(/^(index|one-page|home|about|portfolio|services|fab|hire|contact)\.html$/.test(relative)||/^(admin\/(index\.html|admin\.css|admin\.js)|assets\/(css|js|img|uploads|data|vendor)\/.+|resume\/.+\.pdf)$/.test(relative)))fail(404,'File not found.');
   const filename=path.resolve(root,relative);if(!filename.startsWith(root+path.sep))fail(404,'File not found.');
   const real=await fs.realpath(filename);if(!real.startsWith(root+path.sep)||real.includes(path.sep+'.local'+path.sep))fail(404,'File not found.');
   const stat=await fs.stat(real);if(!stat.isFile())fail(404,'File not found.');
   res.setHeader('Content-Type',types[path.extname(real).toLowerCase()]||'application/octet-stream');res.setHeader('Cache-Control','no-cache');
   // Range requests make locally uploaded videos seekable.
   const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
   if(range){const start=Number(range[1]),end=range[2]?Math.min(Number(range[2]),stat.size-1):stat.size-1;if(start>end||start>=stat.size){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end();return;}const handle=await fs.open(real);try{const bytes=Buffer.alloc(end-start+1);await handle.read(bytes,0,bytes.length,start);res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${stat.size}`,'Content-Length':bytes.length,'Accept-Ranges':'bytes'});res.end(req.method==='HEAD'?undefined:bytes);}finally{await handle.close();}return;}
   res.setHeader('Content-Length',stat.size);res.setHeader('Accept-Ranges','bytes');res.end(req.method==='HEAD'?undefined:await fs.readFile(real));
  }catch(e){if(res.headersSent){res.destroy();return;}json(res,e.status||(e.code==='ENOENT'?404:500),{error:e.status?e.message:e.code==='ENOENT'?'File not found.':'The local server could not complete the request.'});}
 });
 server.requestTimeout=30000;server.headersTimeout=10000;
 return server;
}
module.exports={createPortfolioServer};
if(require.main===module){const port=Number(process.env.PORT||8080);const server=createPortfolioServer();server.listen(port,'127.0.0.1',()=>{console.log(`Portfolio: http://127.0.0.1:${server.address().port}/`);console.log(`Local dashboard: http://127.0.0.1:${server.address().port}/admin/`);console.log('Create your password in the dashboard on first launch. Saves stay local; nothing is committed or pushed.');});server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'Port is in use. Set PORT to another local port.':e.message);process.exitCode=1;});}
