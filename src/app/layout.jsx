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
import PWASplashInit from '@/components/PWASplashInit'

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
  themeColor:  '#ffffff',
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
      {/* Deteksi PWA mode sebelum hydration — cegah flash sidebar */}
      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
          try {
            var isPWA =
              window.navigator.standalone === true ||
              window.matchMedia('(display-mode: standalone)').matches ||
              window.matchMedia('(display-mode: fullscreen)').matches ||
              window.matchMedia('(display-mode: minimal-ui)').matches ||
              sessionStorage.getItem('force_pwa') === '1';
            if (isPWA) document.documentElement.classList.add('is-pwa');
          } catch(e) {}
        })();
      ` }} />
    </head>
    <body className='flex is-full min-bs-full flex-auto flex-col'>
    <InitColorSchemeScript attribute='data' defaultMode={systemMode} />
    <PushNotificationInit />
    <PWASplashInit />
    {children}
    </body>
    </html>
  )
}

export default RootLayout
