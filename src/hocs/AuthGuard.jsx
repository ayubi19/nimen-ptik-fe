// Third-party Imports
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

// Lib Imports
import { authOptions } from '@/libs/auth'

// Component Imports
import AuthRedirect from '@/components/AuthRedirect'

export default async function AuthGuard({ children }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return <AuthRedirect />
  }

  // Paksa ganti password jika must_change_password = true
  // Kecuali sudah di halaman change-password
  if (session.user?.mustChangePassword) {
    redirect('/change-password')
  }

  return <>{children}</>
}
