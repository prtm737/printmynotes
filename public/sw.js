const CACHE = 'printmynotes-shell-v2'
const BASE = new URL('./', self.registration.scope)
const FALLBACK = new URL('index.html', BASE).href
const SHELL = [BASE.href, FALLBACK, new URL('manifest.webmanifest', BASE).href, new URL('icon.svg', BASE).href]
self.addEventListener('install', (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())))
self.addEventListener('activate', (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('printmynotes-shell-') && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())))
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) return
  const url = new URL(event.request.url)
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match(FALLBACK)))
    return
  }
  if (!url.pathname.includes('/assets/') && !url.pathname.endsWith('/manifest.webmanifest') && !url.pathname.endsWith('/icon.svg')) return
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok) {
      const copy = response.clone()
      caches.open(CACHE).then((cache) => cache.put(event.request, copy))
    }
    return response
  })))
})
