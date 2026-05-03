'use client'

import { useEffect, useState } from 'react'

/**
 * Mendeteksi apakah app sedang berjalan dalam mode PWA (add to home screen).
 * Mengembalikan `true` jika display-mode adalah standalone, fullscreen, atau minimal-ui.
 *
 * DEV MODE: tambahkan ?pwa=1 di URL untuk force PWA mode tanpa install.
 * Contoh: http://localhost:3000/dashboard?pwa=1
 * Setelah itu semua halaman akan ikut PWA mode (disimpan di sessionStorage).
 */
const useIsPWA = () => {
  const [isPWA, setIsPWA] = useState(false)

  useEffect(() => {
    // ── Cek display-mode standalone (production) ──────────────────────────
    const mq = window.matchMedia(
      '(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)'
    )

    // ── Dev helper: ?pwa=1 di URL → force PWA mode ────────────────────────
    const params = new URLSearchParams(window.location.search)
    if (params.get('pwa') === '1') {
      sessionStorage.setItem('force_pwa', '1')
    } else if (params.get('pwa') === '0') {
      sessionStorage.removeItem('force_pwa')
    }
    const isForcedDev = sessionStorage.getItem('force_pwa') === '1'

    setIsPWA(mq.matches || isForcedDev)

    const handler = (e) => setIsPWA(e.matches || isForcedDev)
    mq.addEventListener('change', handler)

    return () => mq.removeEventListener('change', handler)
  }, [])

  return isPWA
}

export default useIsPWA
