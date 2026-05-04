import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import AdminDashboardView from '@/views/dashboard/AdminDashboardView'
import StudentDashboardView from '@/views/dashboard/StudentDashboardView'

export const metadata = { title: 'Dashboard | Nimen PTIK' }

// Decode JWT di server side menggunakan Buffer (sama seperti VerticalMenu tapi server-safe)
function decodeJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'))
  } catch { return {} }
}

const DashboardPage = async () => {
  const session = await getServerSession(authOptions)
  const accessToken = session?.user?.accessToken

  // Decode JWT untuk ambil claims langsung — konsisten dengan VerticalMenu.jsx
  const jwtPayload  = accessToken ? decodeJwt(accessToken) : {}
  const isDeveloper = jwtPayload?.is_developer === true
  const roleNames   = (jwtPayload?.roles || []).map(r => typeof r === 'string' ? r : r.name)
  const hasPosition = jwtPayload?.has_position === true

  const isAdmin   = isDeveloper || roleNames.includes('admin_nimen')
  const isStudent = !isAdmin

  if (isAdmin) {
    return (
      <div className='flex flex-col gap-4'>
        <div>
          <h4 className='text-xl font-semibold'>Dashboard</h4>
          <p className='text-sm text-textSecondary mt-1'>Ringkasan sistem Nimen PTIK</p>
        </div>
        <AdminDashboardView />
      </div>
    )
  }

  if (isStudent) {
    return (
      <div className='flex flex-col gap-4'>
        <div>
          <h4 className='text-xl font-semibold'>Dashboard</h4>
          <p className='text-sm text-textSecondary mt-1'>Selamat datang di Nimen PTIK</p>
        </div>
        <StudentDashboardView hasPosition={hasPosition} />
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h4 className='text-xl font-semibold'>Selamat Datang di Nimen PTIK</h4>
        <p className='text-sm text-textSecondary mt-1'>Sistem Manajemen Nilai Mental Mahasiswa STIK PTIK</p>
      </div>
    </div>
  )
}

export default DashboardPage
