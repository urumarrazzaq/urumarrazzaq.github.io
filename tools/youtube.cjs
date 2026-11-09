'use strict';
function youtubeID(value){
 try{
  const u=new URL(value);if(!['https:','http:'].includes(u.protocol)||u.username||u.password)return '';
  let id='';
  if(u.hostname==='youtu.be')id=u.pathname.slice(1).split('/')[0];
  else if(['youtube.com','www.youtube.com','m.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(u.hostname))id=u.pathname==='/watch'?u.searchParams.get('v'):u.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1];
  return /^[A-Za-z0-9_-]{11}$/.test(id||'')?id:'';
 }catch{return '';}
}
module.exports={youtubeID};
