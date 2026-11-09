'use strict';
function text(value,name,max=3000){if(typeof value!=='string'||value.length>max)throw Error(`${name} must be text (up to ${max} characters).`);return value.trim();}
function required(value,name,max=200){const s=text(value,name,max);if(!s)throw Error(`${name} is required.`);return s;}
function local(value,name,extensions){const s=text(value,name,500);if(!/^(assets\/(img|uploads)\/|resume\/)[a-zA-Z0-9 _./()-]+$/.test(s)||s.split('/').includes('..')||!extensions.test(s))throw Error(`${name} must reference a supported local file.`);return s;}
function link(value,name,optional=true){const s=text(value||'',name,1000);if(!s&&optional)return '';let u;try{u=new URL(s);}catch{throw Error(`${name} must be a complete HTTPS or HTTP URL.`);}if(!['https:','http:'].includes(u.protocol)||u.username||u.password)throw Error(`${name} must be an HTTPS or HTTP URL without credentials.`);return u.href;}
function thumbnail(value){if(/^https:\/\/img\.youtube\.com\/vi\/[a-zA-Z0-9_-]{11}\/(hqdefault|mqdefault|maxresdefault)\.jpg$/.test(value))return value;return local(value,'Project thumbnail',/\.(png|jpe?g|webp|gif)$/i);}
function validateContent(c){
 if(!c||typeof c!=='object'||Array.isArray(c))throw Error('Invalid content.');
 const p=c.profile,a=c.about,k=c.contact;
 const site=c.site||{mode:'one-page',sections:{}};
 if(!['one-page','multi-page'].includes(site.mode))throw Error('Choose one-page or multi-page mode.');
 const sectionNames=['about','portfolio','services','fab','hire','contact'];
 const sections=Object.fromEntries(sectionNames.map(name=>[name,site.sections?.[name]!==false]));
 for(const name of sectionNames)if(site.sections?.[name]!==undefined&&typeof site.sections[name]!=='boolean')throw Error(`${name} visibility must be on or off.`);
 if(!p||!a||!k)throw Error('Profile, about and contact content are required.');
 if(!Array.isArray(p.titles||[])||(p.titles||[]).length>20)throw Error('Use up to 20 rotating titles.');
 if(!Array.isArray(a.skills)||a.skills.length>40)throw Error('Use up to 40 skills.');
 if(!Array.isArray(a.profileFacts||[])||(a.profileFacts||[]).length>20)throw Error('Use up to 20 profile facts.');
 if(!Array.isArray(a.stats||[])||(a.stats||[]).length>12)throw Error('Use up to 12 profile statistics.');
 if(!Array.isArray(a.expertise||[])||(a.expertise||[]).length>24)throw Error('Use up to 24 expertise entries.');
 if(!Array.isArray(c.testimonials||[])||(c.testimonials||[]).length>24)throw Error('Use up to 24 testimonials.');
 if(!Array.isArray(c.services)||c.services.length>24)throw Error('Use up to 24 services.');
 if(!Array.isArray(c.projects)||c.projects.length>500)throw Error('Use up to 500 projects.');
 if(!Array.isArray(c.fabListings||[])||(c.fabListings||[]).length>100)throw Error('Use up to 100 Fab listings.');
 const position=Number(p.imagePosition);if(!Number.isFinite(position)||position<0||position>100)throw Error('Portrait position must be between 0 and 100.');
 const email=required(k.email,'Email',200);if(!/^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(email))throw Error('Enter a valid email address.');
 const phone=text(k.phone||'','Phone',40);if(phone&&!/^\+?[\d ()-]+$/.test(phone))throw Error('Enter a valid phone number.');
 const ids=new Set();
 return {
 site:{mode:site.mode,sections},
 profile:{name:required(p.name,'Name',100),role:required(p.role,'Role',120),titles:(p.titles||[]).map(title=>required(title,'Rotating title',100)),headline:required(p.headline,'Headline',250),intro:required(p.intro,'Introduction',2000),image:local(p.image,'Portrait',/\.(png|jpe?g|webp|gif)$/i),imagePosition:position,location:required(p.location,'Location',150),resume:local(p.resume,'Résumé',/\.pdf$/i)},
 about:{heading:required(a.heading,'About heading',250),body:required(a.body,'About description',10000),education:text(a.education||'','Education',300),skills:a.skills.map(s=>required(s,'Skill',100)),stats:(a.stats||[]).map(x=>({value:required(x.value,'Statistic value',30),label:required(x.label,'Statistic label',100)})),profileFacts:(a.profileFacts||[]).map(f=>({label:required(f.label,'Fact label',100),value:required(f.value,'Fact value',300)})),expertise:(a.expertise||[]).map(x=>{const percentage=Number(x.percentage);if(!Number.isFinite(percentage)||percentage<0||percentage>100)throw Error('Expertise percentage must be between 0 and 100.');return {title:required(x.title,'Expertise title',150),percentage,description:required(x.description,'Expertise description',1000)};})},
 services:c.services.map(s=>({title:required(s.title,'Service title',150),description:required(s.description,'Service description',3000)})),
 fabListings:(c.fabListings||[]).map(item=>({title:required(item.title,'Fab listing title',200),description:required(item.description,'Fab listing description',3000),image:item.image?local(item.image,'Fab listing image',/\.(png|jpe?g|webp|gif)$/i):'',url:link(item.url,'Fab listing URL',false)})),
 testimonials:(c.testimonials||[]).map(t=>({quote:required(t.quote,'Testimonial quote',3000),name:required(t.name,'Testimonial name',150),role:required(t.role,'Testimonial role',150),image:t.image?local(t.image,'Testimonial image',/\.(png|jpe?g|webp|gif)$/i):''})),
 contact:{heading:required(k.heading,'Contact heading',250),intro:required(k.intro,'Contact introduction',2000),email,phone,...Object.fromEntries(['linkedin','github','youtube','instagram','upwork','fiverr'].map(name=>[name,link(k[name],name)]))},
 projects:c.projects.map(p=>{const id=required(p.id,'Project ID',100);if(!/^[a-zA-Z0-9_-]+$/.test(id)||ids.has(id))throw Error('Project IDs must be unique and use letters, numbers, underscores, or hyphens.');ids.add(id);let video=p.video||'';if(video.startsWith('assets/'))video=local(video,'Video',/\.(mp4|webm)$/i);else video=link(video,'Video');const filter=required(p.filter,'Project filters',200);if(!filter.split(/\s+/).every(f=>['gameplay','ai','archviz','uiux','mobile','trailers','simulation','tools','uefn','others'].includes(f.replace(/^filter-/,''))))throw Error('Choose a supported project discipline.');return {id,title:required(p.title,'Project title',300),category:required(p.category,'Project category',200),filter,image:thumbnail(p.image),video,link:link(p.link,'Project link'),description:required(p.description,'Project description',12000),contributions:text(p.contributions||'','Contributions',12000),technologies:text(p.technologies||'','Technologies',2000)};})
 };
}
module.exports={validateContent};
