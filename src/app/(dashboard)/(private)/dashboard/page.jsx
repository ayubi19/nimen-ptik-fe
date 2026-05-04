import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import AdminDashboardView from '@/views/dashboard/AdminDashboardView'
import StudentDashboardView from '@/views/dashboard/StudentDashboardView'

export const metadata = { title: 'Dashboard | Nimen PTIK' }

const DashboardPage = async () => {
  const session    = await getServerSession(authOptions)
  const roles      = session?.user?.roles || []
  const isDeveloper = session?.user?.isDeveloper || false

  const isAdmin = isDeveloper || roles.some(r =>
    (typeof r === 'string' ? r : r.name) === 'admin_nimen'
  )

  // Cek apakah mahasiswa biasa (bukan admin)
  const isStudent = !isAdmin && roles.some(r =>
    (typeof r === 'string' ? r : r.name) === 'mahasiswa'
  ) || (!isAdmin && !isDeveloper)

  // has_position dari JWT payload — mahasiswa dengan jabatan koordinator
  const hasPosition = session?.user?.has_position === true

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
