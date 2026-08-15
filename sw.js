// Service Worker for Gyaan Ashram — offline caching
var CACHE_NAME = "gyaan-ashram-v1";
var ASSETS = [
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/assets/gyaan-ashram-logo.jpg",
  "/manifest.json"
];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(
        names.filter(function(name){ return name !== CACHE_NAME; })
          .map(function(name){ return caches.delete(name); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function(e){
  e.respondWith(
    caches.match(e.request).then(function(cached){
      return cached || fetch(e.request).then(function(response){
        // Cache new successful requests
        if(response.status === 200 && response.type === "basic"){
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache){
            cache.put(e.request, clone);
          });
        }
        return response;
      });
    }).catch(function(){
      // Offline fallback for navigation
      if(e.request.mode === "navigate"){
        return caches.match("/index.html");
      }
    })
  );
});
