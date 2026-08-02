// オフラインでも起動できるようにアプリ本体をキャッシュする
// ファイルを更新したら CACHE_NAME のバージョンを上げること
const CACHE_NAME = 'tvshrink-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  // 古いバージョンのキャッシュを削除
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // アプリ本体(同一オリジン)だけキャッシュ対象。YouTube等の外部は素通しする
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      // キャッシュを即返しつつ、裏で最新版を取得して更新しておく
      const fetching = fetch(e.request).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || fetching;
    })
  );
});
