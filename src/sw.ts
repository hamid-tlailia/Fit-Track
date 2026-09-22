/// <reference lib="webworker" />
import { registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'

declare let self: ServiceWorkerGlobalScope

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// Mirrors the old generateSW runtimeCaching rule: lazily-loaded JS chunks
// (TensorFlow/pose-detection, excluded from the precache manifest) get
// cached on first use instead of being force-downloaded on install.
registerRoute(
  ({ request }) => request.destination === 'script',
  new CacheFirst({ cacheName: 'lazy-chunks' }),
)

self.addEventListener('install', () => {
  void self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

interface PushPayload {
  title?: string
  body?: string
}

self.addEventListener('push', (event) => {
  let payload: PushPayload = {}
  try {
    payload = event.data?.json() ?? {}
  } catch {
    payload = { body: event.data?.text() }
  }
  const title = payload.title || 'FitForge'
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body,
      // Android renders the status-bar badge as a monochrome silhouette cut
      // from the icon's alpha channel, and only accepts a raster bitmap for
      // it — an SVG (what /favicon.svg is) silently fails to load there and
      // shows as a blank white square. `icon` also gets a PNG for the same
      // reason, since SVG support for it is inconsistent across Chrome
      // versions on Android.
      icon: '/icon-192.png',
      badge: '/badge-96.png',
      tag: 'fitforge-daily-reminder',
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => 'focus' in c)
      if (existing) return (existing as WindowClient).focus()
      return self.clients.openWindow('/')
    }),
  )
})
