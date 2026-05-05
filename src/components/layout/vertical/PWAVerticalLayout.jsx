'use client'

import { useState, useEffect } from 'react'
import VerticalLayout from '@layouts/VerticalLayout'
import BottomNav from '@components/layout/vertical/BottomNav'
import SplashScreen from '@/components/SplashScreen'
import useIsPWA from '@/hooks/useIsPWA'

/**
 * PWAVerticalLayout — wrapper VerticalLayout yang aware terhadap PWA mode.
 *
 * Saat browser biasa  : render normal (sidebar + navbar seperti biasa)
 * Saat PWA standalone : SplashScreen menutupi layout sampai selesai,
 *                       baru konten tanpa sidebar + BottomNav ditampilkan.
 *
 * Splash dikelola di sini (bukan di PWASplashInit) agar layout tidak
 * sempat terlihat sebelum splash selesai — menghilangkan flash sidebar.
 */
const PWAVerticalLayout = ({ navigation, navbar, footer, children }) => {
  const isPWA = useIsPWA()
  const [splashDone, setSplashDone] = useState(false)

  useEffect(() => {
    if (!isPWA) setSplashDone(true)
  }, [isPWA])

  if (!isPWA) {
    return (
      <VerticalLayout navigation={navigation} navbar={navbar} footer={footer}>
        {children}
      </VerticalLayout>
    )
  }

  return (
    <>
      {!splashDone && (
        <SplashScreen onDone={() => setSplashDone(true)} />
      )}
      <div style={{ visibility: splashDone ? 'visible' : 'hidden' }}>
        <VerticalLayout navigation={null} navbar={navbar} footer={null}>
          <div style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
            {children}
          </div>
          <BottomNav />
        </VerticalLayout>
      </div>
    </>
  )
}

export default PWAVerticalLayout
