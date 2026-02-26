self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("campustrace-v1").then((cache) => cache.addAll(["/", "/dashboard", "/login", "/register"])),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request)),
  );
});
