// 아주 단순한 서비스워커: 앱 셸만 캐시해서 오프라인에서도 화면은 뜨게 함.
// (저장/불러오기 기능은 네트워크 필요)
const CACHE = "ref-app-shell-v1";
const SHELL = ["/", "/style.css", "/app.js", "/manifest.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  if (e.request.url.includes("/api/")) return; // API는 항상 네트워크로
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
