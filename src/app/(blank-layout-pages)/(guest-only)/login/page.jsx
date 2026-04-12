// Component Imports
import LoginView from '@views/Login'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

export const metadata = {
  title: 'Login | Nimen PTIK',
  description: 'Login ke aplikasi Nimen PTIK'
}

const LoginPage = async () => {
  const mode = await getServerMode()

  return <LoginView mode={mode} />
}

export default LoginPage
