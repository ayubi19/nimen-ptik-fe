'use client'

import { useState, useEffect } from 'react'

/**
 * Mendeteksi PWA mode (display-mode: standalone).
 *
 * Pattern yang benar untuk Next.js:
 * - Initial state: baca dari class 'is-pwa' yang sudah di-set oleh inline script
 *   di <head> sebelum hydration — ini mencegah flash sidebar
 * - useEffect: sync ulang setelah hydration untuk memastikan konsisten
 *
 * DEV: tambahkan ?pwa=1 di URL untuk force PWA mode.
 */
const useIsPWA = () => {
  // Baca langsung dari class HTML — sudah di-set oleh inline script sebelum render
  const [isPWA, setIsPWA] = useState(() => {
    if (typeof document === 'undefined') return false
    return document.documentElement.classList.contains('is-pwa')
  })

  useEffect(() => {
    const check = () => {
      if (window.navigator.standalone === true) return true
      if (window.matchMedia('(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)').matches) return true

      const params = new URLSearchParams(window.location.search)
      if (params.get('pwa') === '1') {
        sessionStorage.setItem('force_pwa', '1')
        return true
      }
      if (params.get('pwa') === '0') {
        sessionStorage.removeItem('force_pwa')
        document.documentElement.classList.remove('is-pwa')
        return false
      }
      if (sessionStorage.getItem('force_pwa') === '1') return true

      return false
    }

    const result = check()
    setIsPWA(result)

    // Sync class dengan result
    if (result) {
      document.documentElement.classList.add('is-pwa')
    } else {
      document.documentElement.classList.remove('is-pwa')
    }
  }, [])

  return isPWA
}

export default useIsPWA
