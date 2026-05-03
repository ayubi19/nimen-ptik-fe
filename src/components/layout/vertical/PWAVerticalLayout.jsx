'use client'

import { useEffect, useState } from 'react'
import VerticalLayout from '@layouts/VerticalLayout'
import BottomNav from '@components/layout/vertical/BottomNav'
import useIsPWA from '@/hooks/useIsPWA'

/**
 * PWAVerticalLayout — wrapper VerticalLayout yang aware terhadap PWA mode.
 *
 * Saat browser biasa  : render normal (sidebar + navbar seperti biasa)
 * Saat PWA standalone : sembunyikan sidebar, tampilkan BottomNav,
 *                       tambahkan padding bawah agar konten tidak tertutup BottomNav
 */
const PWAVerticalLayout = ({ navigation, navbar, footer, children }) => {
  const isPWA = useIsPWA()

  if (!isPWA) {
    // Browser biasa — layout Pixinvent normal, tidak ada perubahan
    return (
      <VerticalLayout navigation={navigation} navbar={navbar} footer={footer}>
        {children}
      </VerticalLayout>
    )
  }

  // PWA mode — sidebar disembunyikan, bottom nav muncul
  return (
    <VerticalLayout
      navigation={null}
      navbar={navbar}
      footer={null}
    >
      {/* Padding bawah agar konten tidak tertutup BottomNav (64px + safe-area) */}
      <div style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
        {children}
      </div>
      <BottomNav />
    </VerticalLayout>
  )
}

export default PWAVerticalLayout
