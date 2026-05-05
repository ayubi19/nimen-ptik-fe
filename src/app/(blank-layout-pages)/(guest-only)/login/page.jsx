'use client'

import { Suspense, useState, useEffect } from 'react'
import LoginView from '@views/Login'
import LoginNative from '@views/LoginNative'
import useIsPWA from '@/hooks/useIsPWA'

const LoginRouter = () => {
  const isPWA = useIsPWA()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
  }, [])

  // Belum hydrated — tampilkan background warna sesuai mode
  // agar tidak ada flash konten yang salah
  if (!ready) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 99998,
        background: isPWA ? '#ffffff' : 'var(--mui-palette-background-default)',
      }} />
    )
  }

  return isPWA ? <LoginNative /> : <LoginView mode='light' />
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginRouter />
    </Suspense>
  )
}
