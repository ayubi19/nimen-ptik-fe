'use client'

import { usePushNotification } from '@/hooks/usePushNotification'

// Komponen ini dipasang di layout — invisible, hanya init push notification
// Dipisah jadi client component agar tidak ganggu server component layout
export default function PushNotificationInit() {
  usePushNotification()
  return null
}
