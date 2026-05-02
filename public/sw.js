// sw.js — Service Worker untuk Nimen PTIK
// Handle: Web Push notifications + basic offline cache

const CACHE_NAME = 'nimen-ptik-v1'

// ── Install: cache asset statis penting ───────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(['/dashboard', '/login'])
    )
  )
})

// ── Activate: bersihkan cache lama ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// ── Push: terima Web Push dari server ─────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'Nimen PTIK', body: 'Ada notifikasi baru', type: '', ref_id: null }

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() }
    } catch {
      data.body = event.data.text()
    }
  }

  const url = getNotifUrl(data.type, data.ref_id)

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body,
      icon:    '/images/icon-192x192.png',
      badge:   '/images/icon-192x192.png',
      tag:     `nimen-${data.type}-${data.ref_id || 'general'}`,
      renotify: true,
      data:    { url },
      vibrate: [200, 100, 200],
    })
  )
})

// ── Notification click: buka/fokus halaman tujuan ─────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/dashboard'
  const fullUrl = self.registration.scope.replace(/\/$/, '') + url

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Kalau app sudah terbuka, fokus tab itu
      for (const client of windowClients) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          client.focus()
          client.navigate(fullUrl)
          return
        }
      }
      // Kalau belum terbuka, buka tab baru
      if (clients.openWindow) {
        return clients.openWindow(fullUrl)
      }
    })
  )
})

// ── Helper: mapping tipe notif → URL (sama dengan FE) ────────────────────────
function getNotifUrl(type, refId) {
  switch (type) {
    case 'SELF_SUBMISSION_NEW':      return '/nimen/self-submissions'
    case 'ONBOARDING_NEW':           return '/onboarding'
    case 'SELF_SUBMISSION_APPROVED': return '/nimen/self-submissions/my'
    case 'SELF_SUBMISSION_REJECTED': return '/nimen/self-submissions/my'
    case 'SPRINT_CREATED':           return refId ? `/nimen/sprints/${refId}` : '/nimen/sprints'
    case 'SPRINT_ACTIVE':            return refId ? `/nimen/my-sprints/${refId}` : '/nimen/my-sprints'
    case 'SPRINT_APPROVED':          return '/ranking'
    case 'SPRINT_REJECTED':          return refId ? `/nimen/sprints/${refId}` : '/nimen/sprints'
    case 'SPRINT_SENT_TO_COORD':     return refId ? `/nimen/sprints/${refId}/coordinator-review` : '/nimen/sprints'
    case 'SPRINT_COORD_SUBMITTED':   return refId ? `/nimen/sprints/${refId}` : '/nimen/sprints'
    case 'ONBOARDING_APPROVED':      return '/dashboard'
    case 'ONBOARDING_REJECTED':      return '/dashboard'
    default:                         return '/dashboard'
  }
}
