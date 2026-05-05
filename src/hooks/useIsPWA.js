'use client'

import { useState, useEffect } from 'react'

/**
 * Mendeteksi PWA mode (display-mode: standalone).
 *
 * Initial state selalu false (sama antara server dan client)
 * untuk menghindari hydration mismatch.
 * Deteksi dilakukan di useEffect setelah hydration selesai.
 * Flash sidebar dicegah via CSS di globals.css menggunakan
 * media query (display-mode: standalone) tanpa JS.
 *
 * DEV: tambahkan ?pwa=1 di URL untuk force PWA mode.
 */
const useIsPWA = () => {
  const [isPWA, setIsPWA] = useState(false)

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
        return false
      }
      if (sessionStorage.getItem('force_pwa') === '1') return true

      return false
    }

    const result = check()
    setIsPWA(result)

    // Sync class untuk CSS guard
    if (result) {
      document.documentElement.classList.add('is-pwa')
    } else {
      document.documentElement.classList.remove('is-pwa')
    }
  }, [])

  return isPWA
}

export default useIsPWA
