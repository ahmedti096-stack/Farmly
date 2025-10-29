const CACHE_NAME = "medicine-app-cache-v1";
const urlsToCache = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "https://unpkg.com/leaflet@1.9.5/dist/leaflet.css",
    "https://unpkg.com/leaflet@1.9.5/dist/leaflet.js"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
});
