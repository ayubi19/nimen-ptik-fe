'use client'

import { useState } from 'react'
import useIsPWA from '@/hooks/useIsPWA'
import SplashScreen from '@/components/SplashScreen'

/**
 * PWASplashInit — dipasang di root layout.
 * Hanya merender SplashScreen saat app berjalan dalam mode PWA (standalone).
 * Saat berjalan di browser biasa, tidak merender apapun.
 */
export default function PWASplashInit() {
  const isPWA = useIsPWA()
  const [splashDone, setSplashDone] = useState(false)

  if (!isPWA || splashDone) return null

  return <SplashScreen onDone={() => setSplashDone(true)} />
}
