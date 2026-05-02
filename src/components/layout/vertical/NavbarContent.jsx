import classnames from 'classnames'
import NavToggle from './NavToggle'
import NotificationsDropdown from '@components/layout/shared/NotificationsDropdown'
import UserDropdown from '@components/layout/shared/UserDropdown'
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'

const NavbarContent = () => {
  return (
    <div className={classnames(verticalLayoutClasses.navbarContent, 'flex items-center justify-between gap-4 is-full')}>
      <div className='flex items-center gap-[7px]'>
        <NavToggle />
      </div>
      <div className='flex items-center'>
        <NotificationsDropdown />
        <UserDropdown />
      </div>
    </div>
  )
}

export default NavbarContent
