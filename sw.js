const CACHE='sloy-v74';
const CORE=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
async function sameBody(a,b){try{return (await a.clone().text())===(await b.clone().text());}catch(e){return true;}}
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET') return;
  const u=new URL(r.url);
  if(u.origin!==location.origin) return;
  if(r.mode==='navigate'){
    e.respondWith((async()=>{
      const c=await caches.open(CACHE);
      const cached=await c.match('index.html',{ignoreSearch:true});
      const net=fetch(r).then(async res=>{
        if(res&&res.ok){
          const old=cached;
          const same=old?await sameBody(old,res):false;
          await c.put('index.html',res.clone());
          if(old&&!same){const cl=await self.clients.matchAll();cl.forEach(x=>x.postMessage({type:'updated'}));}
        }
        return res;
      }).catch(()=>null);
      if(cached){e.waitUntil(net);return cached;}
      return (await net)||new Response('Нет сети и приложение ещё не сохранено.',{status:503,headers:{'content-type':'text/plain; charset=utf-8'}});
    })());
    return;
  }
  e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{
    if(res&&res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));}
    return res;
  })));
});
