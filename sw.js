/* offline shell for the carousel editor.
   VERSION is rewritten by 배포하기.command on every deploy, which is what
   retires the old cache — never edit it by hand and expect an update to land. */
const VERSION = '20260730-222621';
const CACHE = `carousel-${VERSION}`;

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  'https://cdn.tailwindcss.com/3.4.17',
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css'
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // the cdn files send no CORS header, so they have to be fetched opaquely —
    // and cache.add() rejects opaque responses (status 0), so put() them by hand.
    // one bad url must not sink the whole install either.
    await Promise.all(SHELL.map(async u => {
      try {
        if (u.startsWith('http')) await cache.put(u, await fetch(u, { mode: 'no-cors' }));
        else await cache.add(u);
      } catch (_) {}
    }));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // the page itself: prefer the network so a deploy shows up, fall back offline
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put('./index.html', fresh.clone());
        return fresh;
      } catch (_) {
        return (await caches.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  // everything else (fonts, tailwind, icons): cache first, refresh in the background
  e.respondWith((async () => {
    const hit = await caches.match(req);
    const net = fetch(req).then(res => {
      // a redirected response cannot be stored, so never let that reject here
      if (res && !res.redirected && (res.ok || res.type === 'opaque')) {
        caches.open(CACHE).then(c => c.put(req, res.clone())).catch(() => {});
      }
      return res;
    }).catch(() => null);
    return hit || (await net) || Response.error();
  })());
});
