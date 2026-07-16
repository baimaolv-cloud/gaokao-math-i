/* 新高考Ⅰ卷数学 · 离线缓存 Service Worker
 * 策略：安装时缓存应用外壳（app shell），之后优先命中缓存，
 * 网络可用时回填新资源。断网也能正常打开。
 */
const CACHE = 'gaokao-math-v1';
const ASSETS = [
  './',
  './index.html',
  './vendor/mathjax-tex-svg.js',
  './icon.svg',
  './manifest.json'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; }).map(function (k) {
          return caches.delete(k);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      if (cached) return cached;
      return fetch(e.request).then(function (resp) {
        // 仅缓存同源 GET 响应（避免缓存 file:// 或跨域报错）
        if (resp && resp.ok && (e.request.url.indexOf('http') === 0)) {
          var copy = resp.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return resp;
      }).catch(function () {
        return cached;
      });
    })
  );
});
