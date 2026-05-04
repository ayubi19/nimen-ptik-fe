import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import AdminDashboardView from '@/views/dashboard/AdminDashboardView'
import StudentDashboardView from '@/views/dashboard/StudentDashboardView'

export const metadata = { title: 'Dashboard | Nimen PTIK' }

function decodeJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'))
  } catch { return {} }
}

const DashboardPage = async () => {
  const session     = await getServerSession(authOptions)
  const accessToken = session?.user?.accessToken
  const jwtPayload  = accessToken ? decodeJwt(accessToken) : {}
  const isDeveloper = jwtPayload?.is_developer === true
  const roleNames   = (jwtPayload?.roles || []).map(r => typeof r === 'string' ? r : r.name)
  const hasPosition = jwtPayload?.has_position === true
  const isAdmin     = isDeveloper || roleNames.includes('admin_nimen')

  if (isAdmin) return <AdminDashboardView />

  return <StudentDashboardView hasPosition={hasPosition} />
}

export default DashboardPage
