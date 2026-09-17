import webpush from 'web-push'

let configured = false

function ensureConfigured(): boolean {
  if (configured) return true
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT ?? 'mailto:support@fitforge.app'
  if (!publicKey || !privateKey) return false
  webpush.setVapidDetails(subject, publicKey, privateKey)
  configured = true
  return true
}

export interface PushSubscriptionRow {
  endpoint: string
  p256dh: string
  auth: string
}

/** Returns 'sent', 'gone' (subscription should be deleted), or 'skipped' (VAPID not configured). */
export async function sendPush(
  sub: PushSubscriptionRow,
  payload: { title: string; body: string },
): Promise<'sent' | 'gone' | 'skipped'> {
  if (!ensureConfigured()) return 'skipped'

  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify(payload),
    )
    return 'sent'
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode
    if (statusCode === 404 || statusCode === 410) return 'gone'
    console.error('Push send failed', sub.endpoint, error)
    return 'skipped'
  }
}
