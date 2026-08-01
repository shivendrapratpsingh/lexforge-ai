/* LexForge AI — service worker.
   Deliberately minimal: it exists to receive push notifications and to
   focus the right screen when one is tapped. It does NOT cache pages —
   an offline cache on a legal-drafting app risks showing a stale draft,
   which is worse than showing nothing. */

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))

self.addEventListener('push', event => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch (_) { data = {} }

  const title = data.title || 'LexForge AI'
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-96.png',
    // Same tag = a new digest replaces yesterday's instead of stacking up.
    tag: data.tag || 'lexforge',
    renotify: true,
    data: { url: data.url || '/dashboard' },
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'draft', title: 'New draft' },
    ],
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const target = event.action === 'draft' ? '/new-draft' : (event.notification.data?.url || '/dashboard')

  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    // Reuse an already-open LexForge window rather than piling up tabs.
    for (const client of all) {
      if (new URL(client.url).origin === self.location.origin) {
        await client.focus()
        if ('navigate' in client) { try { await client.navigate(target) } catch (_) {} }
        return
      }
    }
    await self.clients.openWindow(target)
  })())
})
