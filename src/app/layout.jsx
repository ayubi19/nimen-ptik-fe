// Next Imports
import { headers } from 'next/headers'

// MUI Imports
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'

// Third-party Imports
import 'react-perfect-scrollbar/dist/css/styles.css'

// Util Imports
import { getSystemMode } from '@core/utils/serverHelpers'

// Style Imports
import '@/app/globals.css'

// Generated Icon CSS Imports
import '@assets/iconify-icons/generated-icons.css'

export const metadata = {
  title: 'Nimen PTIK - Sistem Manajemen Nilai & Inisiatif Mahasiswa',
  description: 'Nimen PTIK - Sistem Manajemen Nilai & Inisiatif Mahasiswa PTIK'
}

const RootLayout = async ({ children }) => {
  const systemMode = await getSystemMode()

  return (
    <html id='__next' lang='id' dir='ltr' suppressHydrationWarning>
    <body className='flex is-full min-bs-full flex-auto flex-col'>
    <InitColorSchemeScript attribute='data' defaultMode={systemMode} />
    {children}
    </body>
    </html>
  )
}

export default RootLayout
