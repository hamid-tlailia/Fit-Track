import { api } from '@/lib/api'

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const view = new Uint8Array(new ArrayBuffer(rawData.length))
  for (let i = 0; i < rawData.length; i += 1) view[i] = rawData.charCodeAt(i)
  return view
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null
  const registration = await navigator.serviceWorker.ready
  return registration.pushManager.getSubscription()
}

export async function subscribeToPush(language: string): Promise<void> {
  if (!isPushSupported()) throw new Error('push_not_supported')

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('permission_denied')

  // These don't depend on each other — running them in parallel instead of
  // one after the other shaves a real chunk off how long the toggle sits
  // there looking stuck, especially right after a fresh page load when the
  // service worker hasn't finished activating yet.
  const [{ publicKey }, registration] = await Promise.all([
    api.get<{ publicKey: string }>('/push?action=vapid-public-key'),
    navigator.serviceWorker.ready,
  ])
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  })

  const json = subscription.toJSON()
  await api.post('/push?action=subscribe', {
    endpoint: json.endpoint,
    keys: json.keys,
    language,
  })
}

export async function unsubscribeFromPush(): Promise<void> {
  const subscription = await getCurrentSubscription()
  if (!subscription) return
  const endpoint = subscription.endpoint
  await subscription.unsubscribe()
  await api.delete(`/push?action=unsubscribe&endpoint=${encodeURIComponent(endpoint)}`).catch(() => undefined)
}
