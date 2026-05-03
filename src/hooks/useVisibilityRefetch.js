'use client'

import { useEffect, useRef } from 'react'

/**
 * useVisibilityRefetch — panggil callback saat tab kembali visible,
 * dengan cooldown agar tidak spam fetch saat user bolak-balik tab.
 *
 * @param {Function} callback  — fungsi yang dipanggil saat tab visible
 * @param {number}   cooldown  — minimum jeda antar fetch (ms), default 30 detik
 * @param {boolean}  enabled   — aktifkan/nonaktifkan hook (default true)
 */
export function useVisibilityRefetch(callback, cooldown = 30_000, enabled = true) {
  const lastFetchRef = useRef(0)
  const callbackRef  = useRef(callback)

  // Selalu pakai versi callback terbaru tanpa re-register listener
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (!enabled) return

    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return
      const now = Date.now()
      if (now - lastFetchRef.current < cooldown) return
      lastFetchRef.current = now
      callbackRef.current()
    }

    // Trigger saat klik notifikasi dari bell (meski pathname tidak berubah)
    const onNotifClick = () => {
      lastFetchRef.current = 0 // reset cooldown agar fetch langsung
      callbackRef.current()
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('nimen:refetch', onNotifClick)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('nimen:refetch', onNotifClick)
    }
  }, [cooldown, enabled])
}
