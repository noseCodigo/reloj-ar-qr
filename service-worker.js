const CACHE = 'reloj-ar-v3';
const URLS = [
    '/reloj-ar-qr/',
    '/reloj-ar-qr/index.html',
    '/reloj-ar-qr/styles/style.css',
    '/reloj-ar-qr/js/jsqr.min.js',
    '/reloj-ar-qr/js/reloj-canvas.js',
    '/reloj-ar-qr/js/app.js',
    '/reloj-ar-qr/manifest.json'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE).then(cache => cache.addAll(URLS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(k => k !== CACHE).map(k => caches.delete(k))
        ))
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then(r => r || fetch(e.request))
    );
});
