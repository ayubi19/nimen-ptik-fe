'use client'

import { useEffect, useRef } from 'react'
import axios from 'axios'
import { getSession } from 'next-auth/react'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

// Konversi VAPID public key dari base64url ke Uint8Array (format yang dibutuhkan browser)
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

async function saveSubscription(subscription) {
  const session = await getSession()
  const token = session?.user?.accessToken
  if (!token) return

  const { endpoint, keys } = subscription.toJSON()
  await axios.post(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/push-subscriptions`,
    {
      endpoint,
      p256dh:     keys.p256dh,
      auth:       keys.auth,
      user_agent: navigator.userAgent,
    },
    { headers: { Authorization: `Bearer ${token}` } }
  )
}

// Hook ini:
// 1. Register Service Worker (sw.js)
// 2. Minta izin notifikasi dari user
// 3. Subscribe ke Web Push dengan VAPID key
// 4. Kirim subscription ke BE untuk disimpan
export function usePushNotification() {
  const subscribedRef = useRef(false)

  useEffect(() => {
    if (subscribedRef.current) return
    if (!VAPID_PUBLIC_KEY) return
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    const setup = async () => {
      console.log('[PWA] setup started, permission:', Notification.permission)
      try {
        // 1. Register Service Worker
        console.log('[PWA] registering SW...')
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
        console.log('[PWA] SW registered:', reg.scope)
        console.log('[PWA] waiting for SW ready...')
        const readyReg = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise((_, reject) => setTimeout(() => reject(new Error('SW ready timeout')), 5000))
        ])
        console.log('[PWA] SW ready:', readyReg.scope)

        // 2. Cek permission — jangan minta langsung, tunggu user interact dulu
        //    Kalau sudah granted sebelumnya, langsung subscribe
        console.log('[PWA] checking permission:', Notification.permission)
        if (Notification.permission === 'denied') { console.log('[PWA] permission denied'); return }

        if (Notification.permission === 'default') {
          // Minta permission saat user pertama kali login
          // Delay 3 detik agar tidak terasa mengganggu saat halaman baru buka
          await new Promise((r) => setTimeout(r, 3000))
          const result = await Notification.requestPermission()
          if (result !== 'granted') return
        }

        // 3. Subscribe ke Web Push (pakai readyReg konsisten)
        console.log('[PWA] checking existing subscription...')
        const existing = await readyReg.pushManager.getSubscription()
        console.log('[PWA] existing subscription:', existing ? 'found' : 'none')

        if (existing) {
          console.log('[PWA] sending existing subscription to BE...')
          await saveSubscription(existing)
          subscribedRef.current = true
          console.log('[PWA] existing subscription saved!')
          return
        }

        console.log('[PWA] subscribing to push...')
        const subscription = await readyReg.pushManager.subscribe({
          userVisibleOnly:      true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })
        console.log('[PWA] subscribed! endpoint:', subscription.endpoint.slice(0, 50))

        console.log('[PWA] sending subscription to BE...')
        await saveSubscription(subscription)
        subscribedRef.current = true
        console.log('[PWA] subscription saved!')
      } catch (err) {
        // Gagal subscribe — tidak perlu crash app, Web Push opsional
        console.warn('[PWA] push subscription failed:', err)
      }
    }

    setup()
  }, [])
}
