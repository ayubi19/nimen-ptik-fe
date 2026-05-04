import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import AdminDashboardView from '@/views/dashboard/AdminDashboardView'

export const metadata = {
  title: 'Dashboard | Nimen PTIK'
}

const DashboardPage = async () => {
  const session = await getServerSession(authOptions)
  const roles = session?.user?.roles || []
  const isDeveloper = session?.user?.isDeveloper || false

  const isAdmin = isDeveloper || roles.some(r =>
    (typeof r === 'string' ? r : r.name) === 'admin_nimen'
  )

  if (isAdmin) {
    return (
      <div className='flex flex-col gap-4'>
        <div>
          <h4 className='text-xl font-semibold'>Dashboard</h4>
          <p className='text-sm text-textSecondary mt-1'>
            Ringkasan sistem Nimen PTIK
          </p>
        </div>
        <AdminDashboardView />
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h4 className='text-xl font-semibold'>Selamat Datang di Nimen PTIK</h4>
        <p className='text-sm text-textSecondary mt-1'>
          Sistem Manajemen Nilai Mental Mahasiswa STIK PTIK
        </p>
      </div>
    </div>
  )
}

export default DashboardPage
