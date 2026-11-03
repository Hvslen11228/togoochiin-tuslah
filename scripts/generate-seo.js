// Run from repo root: node scripts/generate-seo.js  (needs playwright)
// Reads recipes from index.html, writes /jor/*.html, sitemap, robots, icons, OG image and updates index.html head + link list.
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const SITE='https://togoochiin-tuslah.vercel.app';const GA='G-2P55D1KWLC';const ROOT=process.cwd();
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const P='M15 28.5c-3.6-.9-6-3.9-6-7.4 0-4.2 3.5-7.6 7.8-7.6.8 0 1.5.1 2.2.3C20.6 11.2 22.2 10 24 10s3.4 1.2 5 3.8c.7-.2 1.4-.3 2.2-.3 4.3 0 7.8 3.4 7.8 7.6 0 3.5-2.4 6.5-6 7.4V33H15z';
const mark=(r,sc=1)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="${r}" fill="#D93F1B"/><g transform="translate(${24-24*sc} ${24.5-24.5*sc}) scale(${sc})"><path fill="#fff" d="${P}"/><rect x="15" y="35" width="18" height="4" rx="2" fill="#fff"/></g></svg>`;
const analytics=`<script async src="https://www.googletagmanager.com/gtag/js?id=${GA}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA}');</script>
<script>window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};</script>
<script defer src="/_vercel/insights/script.js"></script>`;
const icons=`<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#D93F1B">`;
const css=`:root{--bg:#F5F6F3;--surface:#fff;--fg:#141B18;--muted:#5F6B65;--line:#E1E4DE;--accent:#D93F1B;--on:#fff}
@media (prefers-color-scheme:dark){:root{--bg:#0E1211;--surface:#181E1B;--fg:#EEF2EF;--muted:#9BA8A1;--line:#2A322E;--accent:#FF7D5C;--on:#230B04;color-scheme:dark}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 "Golos Text",system-ui,-apple-system,"Segoe UI",sans-serif}
.w{max-width:820px;margin:0 auto;padding:20px max(16px,env(safe-area-inset-right,0px)) 56px max(16px,env(safe-area-inset-left,0px))}
.top{display:flex;align-items:center;gap:10px;font-weight:700;color:inherit;text-decoration:none;margin-bottom:22px}.top svg{width:32px;height:32px}
img.h{display:block;width:100%;max-width:520px;aspect-ratio:3/2;object-fit:cover;border-radius:18px}
h1{font-size:clamp(28px,5vw,40px);line-height:1.15;letter-spacing:-.02em;margin:18px 0 6px}.nat{color:var(--muted);margin:0}.meta{color:var(--muted);font-size:15px}
h2{font-size:20px;margin:28px 0 10px}ul,ol{padding-left:22px}li{margin:6px 0}
.cta{display:inline-block;margin:12px 0;padding:12px 20px;border-radius:999px;background:var(--accent);color:var(--on);font-weight:700;text-decoration:none}
.sub{color:var(--muted);font-size:14px}a{color:var(--accent)}.tip{padding:14px 16px;background:var(--surface);border:1px solid var(--line);border-radius:12px}`;
(async()=>{
const b=await chromium.launch();const p=await b.newPage();await p.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());
await p.goto('file://'+path.join(ROOT,'index.html'));
const D=await p.evaluate(()=>({C:COUNTRIES,occ:Object.keys(OCC).map(k=>[k,OCC[k][0]]),meals:MEALS,R:R.map(r=>({id:r.id,c:r.c,n:r.n,nat:r.nat,rom:r.rom,min:r.min,diff:r.diff,serv:r.serv,desc:r.desc,tip:r.tip,img:IMG[r.id],steps:r.steps.map(s=>s[0]),ing:r.ing.map(i=>({name:ING[i[0]][0],amt:fmtAmt(i[1],i[2],1),note:i[3]||''})),occ:Object.keys(OCC).filter(k=>inOcc(k,r)).map(k=>OCC[k][0]),meal:Object.keys(MEALS).filter(k=>inMeal(k,r)).map(k=>MEALS[k])})),ing:Object.keys(ING).length}));
fs.rmSync('jor',{recursive:true,force:true});fs.mkdirSync('jor');
const urls=[SITE+'/'];
for(const r of D.R){const url=`${SITE}/jor/${r.id}`;urls.push(url);const cn=D.C[r.c].n;
const desc=`${r.n}: ${r.desc} ${r.min} минут, ${r.serv} порц. Орц, хийх арга, орлуулагчтай.`;
const kw=[r.n,r.rom,r.nat,cn+' хоол',r.n+' жор',...r.occ,...r.meal.map(m=>({'Өглөө':'Өглөөний хоол','Өдөр':'Өдрийн хоол','Орой':'Оройн хоол','Зууш':'Зууш'}[m]))].filter((v,i,a)=>a.indexOf(v)===i).join(', ');
const ld={'@context':'https://schema.org','@type':'Recipe',name:r.n,alternateName:r.nat!==r.n?r.nat:undefined,description:r.desc,image:[`${SITE}/images/${r.id}.jpg`],author:{'@type':'Organization',name:'Тогоочийн туслах'},totalTime:`PT${r.min}M`,recipeYield:`${r.serv} порц`,recipeCuisine:cn,keywords:kw,inLanguage:'mn',recipeIngredient:r.ing.map(i=>`${i.name}: ${i.amt}`),recipeInstructions:r.steps.map(t=>({'@type':'HowToStep',text:t}))};
const html=`<!doctype html>
<html lang="mn"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(r.n)} жор | Тогоочийн туслах</title>
<meta name="description" content="${esc(desc)}"><meta name="keywords" content="${esc(kw)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="article"><meta property="og:site_name" content="Тогоочийн туслах"><meta property="og:title" content="${esc(r.n)} жор"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}/images/${r.id}.jpg"><meta name="twitter:card" content="summary_large_image">
${icons}
${analytics}
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g,'\\u003c')}</script>
<style>${css}</style></head><body><div class="w">
<a class="top" href="/">${mark(14)}Тогоочийн туслах</a>
<main><img class="h" src="/images/${r.id}.jpg" alt="${esc(r.n)}" width="390" height="260">
<h1>${esc(r.n)}</h1>${r.nat!==r.n?`<p class="nat" lang="${{kr:'ko',cn:'zh',jp:'ja',th:'th'}[r.c]||'en'}">${esc(r.nat)}</p>`:''}
<p>${esc(r.desc)}</p><p class="meta">${esc(cn)} · ${r.min} минут · ${esc(r.diff)} · ${r.serv} порц</p>
<a class="cta" href="/#r-${r.id}">Апп-д нээх: порц, таймер, орлуулагч</a>
<h2>Орц</h2><ul>${r.ing.map(i=>`<li>${esc(i.name)}: ${esc(i.amt)}${i.note?` (${esc(i.note)})`:''}</li>`).join('')}</ul>
<h2>Хийх арга</h2><ol>${r.steps.map(t=>`<li>${esc(t)}</li>`).join('')}</ol>
<p class="tip"><b>Зөвлөгөө.</b> ${esc(r.tip)}</p>
<p class="sub">Жишээ зураг: <a href="https://commons.wikimedia.org/wiki/File:${r.img.split('/')[2]}" rel="noopener">Wikimedia Commons</a></p>
<p><a href="/">← Бүх жор</a></p></main></div></body></html>
`;fs.writeFileSync(`jor/${r.id}.html`,html)}
const day=new Date().toISOString().slice(0,10);
fs.writeFileSync('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u=>`<url><loc>${u}</loc><lastmod>${day}</lastmod></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync('robots.txt',`User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
fs.writeFileSync('vercel.json',JSON.stringify({cleanUrls:true,trailingSlash:false},null,2)+'\n');
fs.writeFileSync('.vercelignore','scripts\nREADME.md\n');
fs.writeFileSync('site.webmanifest',JSON.stringify({name:'Тогоочийн туслах',short_name:'Тогооч',description:'Хоолны жор, орц, орлуулагч',start_url:'/',display:'standalone',background_color:'#F5F6F3',theme_color:'#D93F1B',lang:'mn',icons:[{src:'/icon-192.png',sizes:'192x192',type:'image/png'},{src:'/icon-512.png',sizes:'512x512',type:'image/png'},{src:'/icon-maskable-512.png',sizes:'512x512',type:'image/png',purpose:'maskable'}]},null,2)+'\n');
const shot=async(svg,s,f,omit)=>{const q=await b.newPage({viewport:{width:s,height:s}});await q.setContent(`<!doctype html><style>html,body{margin:0;background:transparent}svg{display:block;width:${s}px;height:${s}px}</style>${svg}`);await q.screenshot({path:f,omitBackground:omit});await q.close()};
await shot(mark(14),48,'favicon-48.png',true);await shot(mark(0),180,'apple-touch-icon.png',false);await shot(mark(14),192,'icon-192.png',true);await shot(mark(14),512,'icon-512.png',true);await shot(mark(0,.72),512,'icon-maskable-512.png',false);
// OG image
const pick=['bibimbap','buuz','margherita','pad-thai'];const q=await b.newPage({viewport:{width:1200,height:630}});
const uri=id=>'data:image/jpeg;base64,'+fs.readFileSync(`images/${id}.jpg`).toString('base64');
await q.setContent(`<!doctype html><meta charset="utf-8"><body style="margin:0;width:1200px;height:630px;background:#F5F6F3;color:#141B18;font-family:'Golos Text',system-ui,sans-serif;display:grid;grid-template-columns:1fr 1fr;gap:40px;padding:50px;box-sizing:border-box;align-items:center"><div><div style="display:flex;align-items:center;gap:14px;font-size:30px;font-weight:800"><span style="width:60px;height:60px;display:block">${mark(14)}</span>Тогоочийн туслах</div><h1 style="font-size:70px;line-height:1.05;margin:28px 0 18px;letter-spacing:-.03em">Өнөөдөр юу хийх вэ?</h1><div style="font-size:28px;color:#46524C">${D.R.length} хоолны жор, орц, орлуулагч</div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;height:530px">${pick.map(i=>`<img src="${uri(i)}" style="width:100%;height:260px;object-fit:cover;border-radius:18px">`).join('')}</div>`);
await q.waitForTimeout(200);await q.screenshot({path:'og-image.jpg',type:'jpeg',quality:82});await q.close();
// index head + link list
let s=fs.readFileSync('index.html','utf8');
const title=`Тогоочийн туслах: ${D.R.length} хоолны жор, орц, орлуулагч`;const dsc=`Солонгос, Монгол, Хятад, Япон, Тайланд, Итали, Франц, Америк хоолны ${D.R.length} жор. Өглөө, өдөр, оройн хоол, зууш. Байгаа орцоороо хийж болох хоолоо олж, орцоо юугаар орлуулахаа мэд.`;
const kw='хоолны жор, жор, монгол хоолны жор, солонгос хоол, хятад хоол, япон хоол, тайланд хоол, итали хоол, франц хоол, америк хоол, өглөөний хоол, оройн хоол, амархан хоол, хурдан хоол, орц орлуулах, орлуулагч, бууз, цуйван, кимчи, тогоочийн туслах';
const ld={'@context':'https://schema.org','@type':'WebSite',name:'Тогоочийн туслах',url:SITE+'/',inLanguage:'mn',description:dsc};
const seo=`<!-- seo:start -->
<meta name="description" content="${esc(dsc)}"><meta name="keywords" content="${esc(kw)}">
<link rel="canonical" href="${SITE}/">
<meta property="og:type" content="website"><meta property="og:site_name" content="Тогоочийн туслах"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(dsc)}"><meta property="og:url" content="${SITE}/"><meta property="og:image" content="${SITE}/og-image.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image">
${icons}
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<!-- seo:end -->`;
s=s.replace(/<!-- seo:start -->[\s\S]*?<!-- seo:end -->\n?/,'');
s=s.replace(/<meta name="description"[^>]*>\n/,'').replace(/<meta property="og:title"[^>]*>\n/,'').replace(/<meta property="og:description"[^>]*>\n/,'').replace(/<meta name="theme-color"[^>]*>\n/,'').replace(/<link rel="icon"[^>]*>\n/,'');
s=s.replace(/<title>[^<]*<\/title>/,`<title>${esc(title)}</title>`);
s=s.replace('</head>',seo+'\n</head>');
const groups={};for(const r of D.R)(groups[r.c]=groups[r.c]||[]).push(r);
const list=`<!-- links:start --><footer class="alljor"><div class="wrap"><h2>Бүх жор</h2>${Object.keys(D.C).filter(k=>groups[k]).map(k=>`<details><summary>${esc(D.C[k].n)} хоол (${groups[k].length})</summary><p>${groups[k].map(r=>`<a href="/jor/${r.id}">${esc(r.n)}</a>`).join(' · ')}</p></details>`).join('')}</div></footer><!-- links:end -->`;
s=s.replace(/<!-- links:start -->[\s\S]*?<!-- links:end -->\n?/,'');
s=s.replace('<div id="toast"',list+'\n<div id="toast"');
if(!s.includes('.alljor{'))s=s.replace('@media (prefers-reduced-motion:reduce)','.alljor{border-top:1px solid var(--line);padding-block:24px 40px;font-size:14.5px}.alljor h2{font:700 16px/1.3 var(--display);margin:0 0 10px}.alljor details{padding:8px 0;border-top:1px solid var(--line)}.alljor summary{cursor:pointer;font-weight:600;min-height:32px}.alljor p{margin:8px 0 4px;color:var(--muted);line-height:1.9}\n@media (max-width:720px){.alljor{padding-bottom:calc(92px + env(safe-area-inset-bottom,0px))}main{padding-bottom:24px!important}}\n@media (prefers-reduced-motion:reduce)');
fs.writeFileSync('index.html',s);
console.log('pages',D.R.length,'urls',urls.length);await b.close()})();
