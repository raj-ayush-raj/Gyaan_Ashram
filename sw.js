var CACHE_NAME = "gyaan-ashram-v3";
var ASSETS = ["/","/index.html","/styles.css","/app.js","/assets/gyaan-ashram-new-logo.png","/manifest.json"];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE_NAME).then(function(cache){return cache.addAll(ASSETS);}));
  self.skipWaiting();
});

self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(names){
    return Promise.all(names.filter(function(n){return n!==CACHE_NAME;}).map(function(n){return caches.delete(n);}));
  }));
  self.clients.claim();
});

self.addEventListener("fetch", function(e){
  e.respondWith(
    fetch(e.request).then(function(response){
      if(response.status===200){var c=response.clone();caches.open(CACHE_NAME).then(function(cache){cache.put(e.request,c);});}
      return response;
    }).catch(function(){
      return caches.match(e.request).then(function(cached){
        if(cached) return cached;
        if(e.request.mode==="navigate") return caches.match("/index.html");
      });
    })
  );
});
