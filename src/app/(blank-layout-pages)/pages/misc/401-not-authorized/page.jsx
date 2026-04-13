import Providers from '@components/Providers'
import BlankLayout from '@layouts/BlankLayout'
import NotFound from '@views/NotFound'
import { getServerMode, getSystemMode } from '@core/utils/serverHelpers'

const NotAuthorizedPage = async () => {
  const mode = await getServerMode()
  const systemMode = await getSystemMode()

  return (
    <Providers direction='ltr'>
      <BlankLayout systemMode={systemMode}>
        <NotFound mode={mode} />
      </BlankLayout>
    </Providers>
  )
}

export default NotAuthorizedPage
