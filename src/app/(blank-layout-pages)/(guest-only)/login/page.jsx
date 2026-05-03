'use client'

import { Suspense } from 'react'
import LoginView from '@views/Login'
import LoginNative from '@views/LoginNative'
import useIsPWA from '@/hooks/useIsPWA'

// Wrapper client component untuk deteksi PWA
const LoginRouter = () => {
  const isPWA = useIsPWA()
  return isPWA ? <LoginNative /> : <LoginView mode='light' />
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginRouter />
    </Suspense>
  )
}
