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
      try {
        // 1. Register Service Worker
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
        await navigator.serviceWorker.ready

        // 2. Cek permission — jangan minta langsung, tunggu user interact dulu
        //    Kalau sudah granted sebelumnya, langsung subscribe
        if (Notification.permission === 'denied') return

        if (Notification.permission === 'default') {
          // Minta permission saat user pertama kali login
          // Delay 3 detik agar tidak terasa mengganggu saat halaman baru buka
          await new Promise((r) => setTimeout(r, 3000))
          const result = await Notification.requestPermission()
          if (result !== 'granted') return
        }

        // 3. Subscribe ke Web Push
        const existing = await reg.pushManager.getSubscription()
        if (existing) {
          // Sudah ada subscription, kirim ulang ke BE (token bisa beda setelah login ulang)
          await saveSubscription(existing)
          subscribedRef.current = true
          return
        }

        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly:      true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })

        // 4. Kirim ke BE
        await saveSubscription(subscription)
        subscribedRef.current = true
      } catch (err) {
        // Gagal subscribe — tidak perlu crash app, Web Push opsional
        console.warn('[PWA] push subscription failed:', err)
      }
    }

    setup()
  }, [])
}
