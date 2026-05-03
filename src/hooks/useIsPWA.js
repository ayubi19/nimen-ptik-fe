'use client'

import { useEffect, useState } from 'react'

/**
 * Mendeteksi apakah app sedang berjalan dalam mode PWA (add to home screen).
 * Mengembalikan `true` jika display-mode adalah standalone, fullscreen, atau minimal-ui.
 */
const useIsPWA = () => {
  const [isPWA, setIsPWA] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(
      '(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)'
    )

    setIsPWA(mq.matches)

    const handler = (e) => setIsPWA(e.matches)
    mq.addEventListener('change', handler)

    return () => mq.removeEventListener('change', handler)
  }, [])

  return isPWA
}

export default useIsPWA
