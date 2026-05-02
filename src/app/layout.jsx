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

// Components
import PushNotificationInit from '@/components/PushNotificationInit'

export const metadata = {
  title:       'Nimen PTIK - Sistem Manajemen Nilai Mental Mahasiswa',
  description: 'Nimen PTIK - Sistem Manajemen Nilai Mental Mahasiswa STIK PTIK',
  manifest:    '/manifest.json',
  appleWebApp: {
    capable:           true,
    statusBarStyle:    'default',
    title:             'Nimen PTIK',
  },
}

export const viewport = {
  themeColor:  '#EB3D47',
  width:       'device-width',
  initialScale: 1,
}

const RootLayout = async ({ children }) => {
  const systemMode = await getSystemMode()

  return (
    <html id='__next' lang='id' dir='ltr' suppressHydrationWarning>
    <head>
      {/* PWA meta tags */}
      <link rel='manifest' href='/manifest.json' />
      <meta name='mobile-web-app-capable' content='yes' />
      <meta name='apple-mobile-web-app-capable' content='yes' />
      <meta name='apple-mobile-web-app-status-bar-style' content='default' />
      <meta name='apple-mobile-web-app-title' content='Nimen PTIK' />
      <link rel='apple-touch-icon' href='/images/icon-192x192.png' />
    </head>
    <body className='flex is-full min-bs-full flex-auto flex-col'>
    <InitColorSchemeScript attribute='data' defaultMode={systemMode} />
    <PushNotificationInit />
    {children}
    </body>
    </html>
  )
}

export default RootLayout
