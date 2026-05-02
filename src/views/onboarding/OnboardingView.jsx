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

    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent)
    const log = (msg) => {
      console.log(msg)
      // Tampilkan di layar sementara untuk debug mobile
      if (isMobile) {
        const el = document.getElementById('pwa-debug') || (() => {
          const d = document.createElement('div')
          d.id = 'pwa-debug'
          d.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:rgba(0,0,0,0.8);color:#0f0;font-size:11px;padding:8px;z-index:99999;max-height:150px;overflow-y:auto;font-family:monospace'
          document.body.appendChild(d)
          return d
        })()
        el.innerHTML += msg + '<br>'
        el.scrollTop = el.scrollHeight
      }
    }

    const setup = async () => {
      log('[PWA] setup started, permission: ' + Notification.permission)
      try {
        // 1. Register Service Worker
        log('[PWA] registering SW...')
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
        log('[PWA] SW registered:', reg.scope)
        log('[PWA] waiting for SW ready...')
        const readyReg = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise((_, reject) => setTimeout(() => reject(new Error('SW ready timeout')), 5000))
        ])
        log('[PWA] SW ready:', readyReg.scope)

        // 2. Cek permission — jangan minta langsung, tunggu user interact dulu
        //    Kalau sudah granted sebelumnya, langsung subscribe
        log('[PWA] checking permission:', Notification.permission)
        if (Notification.permission === 'denied') { log('[PWA] permission denied'); return }

        if (Notification.permission === 'default') {
          // Minta permission saat user pertama kali login
          // Delay 3 detik agar tidak terasa mengganggu saat halaman baru buka
          await new Promise((r) => setTimeout(r, 3000))
          const result = await Notification.requestPermission()
          if (result !== 'granted') return
        }

        // 3. Subscribe ke Web Push (pakai readyReg konsisten)
        log('[PWA] checking existing subscription...')
        const existing = await readyReg.pushManager.getSubscription()
        log('[PWA] existing subscription:', existing ? 'found' : 'none')

        if (existing) {
          log('[PWA] sending existing subscription to BE...')
          await saveSubscription(existing)
          subscribedRef.current = true
          log('[PWA] existing subscription saved!')
          return
        }

        log('[PWA] subscribing to push...')
        const subscription = await readyReg.pushManager.subscribe({
          userVisibleOnly:      true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })
        log('[PWA] subscribed! endpoint:', subscription.endpoint.slice(0, 50))

        log('[PWA] sending subscription to BE...')
        await saveSubscription(subscription)
        subscribedRef.current = true
        log('[PWA] subscription saved!')
      } catch (err) {
        // Gagal subscribe — tidak perlu crash app, Web Push opsional
        log('[PWA] ERROR: push subscription failed:', err)
      }
    }

    setup()
  }, [])
}
