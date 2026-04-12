'use client'

// Next Imports
import { redirect, usePathname } from 'next/navigation'

const AuthRedirect = () => {
  const pathname = usePathname()

  const login = '/login'

  return redirect(pathname === login ? login : `/login?redirectTo=${pathname}`)
}

export default AuthRedirect
