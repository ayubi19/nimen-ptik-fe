'use client'

import useIsPWA from '@/hooks/useIsPWA'
import PWADashboardView from './PWADashboardView'

/**
 * PWADashboardWrapper
 *
 * Untuk mencegah flash sidebar:
 * - CSS globals.css sudah hide sidebar saat display-mode: standalone
 * - JS (useIsPWA) hanya untuk switch konten dashboard
 * - Saat JS belum ready: sidebar sudah tersembunyi via CSS, konten web ditampilkan
 * - Setelah JS ready: switch ke PWADashboardView
 */
export default function PWADashboardWrapper({ isAdmin, hasPosition, webView }) {
  const isPWA = useIsPWA()

  if (!isPWA) return webView

  return <PWADashboardView isAdmin={isAdmin} hasPosition={hasPosition} />
}
