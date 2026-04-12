// HOC Imports
import GuestOnlyRoute from '@/hocs/GuestOnlyRoute'

const Layout = async ({ children }) => {
  return <GuestOnlyRoute>{children}</GuestOnlyRoute>
}

export default Layout
