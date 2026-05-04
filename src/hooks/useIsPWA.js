'use client'

import { useState, useEffect } from 'react'

/**
 * Mendeteksi PWA mode (display-mode: standalone).
 *
 * Pattern yang benar untuk Next.js:
 * - Server: selalu return false (tidak bisa deteksi)
 * - Client: deteksi di useEffect setelah hydration selesai
 * - Untuk mencegah flash: gunakan CSS media query sebagai guard utama,
 *   JS hanya untuk komponen yang HARUS tahu (bottom nav, login router)
 *
 * DEV: tambahkan ?pwa=1 di URL untuk force PWA mode.
 */
const useIsPWA = () => {
  const [isPWA, setIsPWA] = useState(false)

  useEffect(() => {
    const check = () => {
      // iOS Safari
      if (window.navigator.standalone === true) return true

      // Standard display-mode
      if (window.matchMedia('(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)').matches) return true

      // Dev helper
      const params = new URLSearchParams(window.location.search)
      if (params.get('pwa') === '1') {
        sessionStorage.setItem('force_pwa', '1')
        return true
      }
      if (params.get('pwa') === '0') {
        sessionStorage.removeItem('force_pwa')
        return false
      }
      if (sessionStorage.getItem('force_pwa') === '1') return true

      return false
    }

    setIsPWA(check())
  }, [])

  return isPWA
}

export default useIsPWA
