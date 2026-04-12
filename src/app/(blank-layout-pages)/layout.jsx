// Component Imports
import Providers from '@components/Providers'

// Util Imports
import { getSystemMode } from '@core/utils/serverHelpers'

const Layout = async ({ children }) => {
  const systemMode = await getSystemMode()

  return (
    <Providers direction='ltr'>
      {children}
    </Providers>
  )
}

export default Layout
