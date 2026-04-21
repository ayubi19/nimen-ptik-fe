'use client'

import { useSession } from 'next-auth/react'
import { useTheme } from '@mui/material/styles'
import PerfectScrollbar from 'react-perfect-scrollbar'
import { Menu, SubMenu, MenuItem, MenuSection } from '@menu/vertical-menu'
import useVerticalNav from '@menu/hooks/useVerticalNav'
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'

const RenderExpandIcon = ({ open, transitionDuration }) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='ri-arrow-right-s-line' />
  </StyledVerticalNavExpandIcon>
)

const decodeJwt = (token) => {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch { return {} }
}

const VerticalMenu = ({ scrollMenu }) => {
  const theme = useTheme()
  const verticalNavOptions = useVerticalNav()
  const { isBreakpointReached, transitionDuration } = verticalNavOptions
  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar
  const { data: session } = useSession()

  const jwtPayload = session?.user?.accessToken ? decodeJwt(session.user.accessToken) : {}
  const isDeveloper = jwtPayload?.is_developer === true
  const roleNames = session?.user?.roles?.map(r => r.name) || []
  const isAdminNimen = roleNames.includes('admin_nimen')
  const isAdminInitiative = roleNames.includes('admin_initiative')

  const canManageNimenMasterData = isDeveloper || isAdminNimen
  const canManageMasterData = isDeveloper || isAdminNimen || isAdminInitiative
  const canManageUsers = isDeveloper || isAdminNimen

  return (
    <ScrollWrapper
      {...(isBreakpointReached
        ? { className: 'bs-full overflow-y-auto overflow-x-hidden', onScroll: container => scrollMenu(container, false) }
        : { options: { wheelPropagation: false, suppressScrollX: true }, onScrollY: container => scrollMenu(container, true) }
      )}
    >
      <Menu
        popoutMenuOffset={{ mainAxis: 17 }}
        menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='ri-circle-fill' /> }}
        menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
      >
        <MenuItem href='/dashboard' icon={<i className='ri-home-smile-line' />}>Dashboard</MenuItem>

        <MenuSection label='Akademik'>
          <MenuItem href='/nimen' icon={<i className='ri-medal-line' />}>NIMEN</MenuItem>
          <MenuItem href='/nimen/my-sprints' icon={<i className='ri-calendar-check-line' />}>Sprint Saya</MenuItem>
          {canManageNimenMasterData && (
            <MenuItem href='/nimen/sprints' icon={<i className='ri-file-list-3-line' />}>Sprint</MenuItem>
          )}
          <SubMenu label='Inisiatif' icon={<i className='ri-lightbulb-line' />}>
            <MenuItem href='/initiative'>Semua Inisiatif</MenuItem>
          </SubMenu>
          <MenuItem href='/ranking' icon={<i className='ri-bar-chart-line' />}>Peringkat</MenuItem>
        </MenuSection>

        <MenuSection label='Mahasiswa'>
          <MenuItem href='/students/list' icon={<i className='ri-group-line' />}>Daftar Mahasiswa</MenuItem>
          <MenuItem href='/onboarding' icon={<i className='ri-user-add-line' />}>Onboarding</MenuItem>
          <MenuItem href='/students/organization' icon={<i className='ri-organization-chart' />}>Struktur Organisasi</MenuItem>
          <MenuItem href='/violation' icon={<i className='ri-error-warning-line' />}>Pelanggaran</MenuItem>
        </MenuSection>

        <MenuSection label='Jadwal'>
          <MenuItem href='/schedule' icon={<i className='ri-calendar-line' />}>Jadwal Kegiatan</MenuItem>
        </MenuSection>

        {canManageMasterData && (
          <MenuSection label='Master Data'>
            <SubMenu label='Master Data' icon={<i className='ri-database-2-line' />}>
              <MenuItem href='/master-data/syndicates'>Sindikat</MenuItem>
              <MenuItem href='/master-data/batches'>Angkatan</MenuItem>
              <MenuItem href='/master-data/academic-statuses'>Status Akademik</MenuItem>
            </SubMenu>
          </MenuSection>
        )}

        {canManageNimenMasterData && (
          <MenuSection label='Master Data NIMEN'>
            <SubMenu label='Struktur Nilai' icon={<i className='ri-node-tree' />}>
              <MenuItem href='/nimen/master-data/categories'>Kategori</MenuItem>
              <MenuItem href='/nimen/master-data/variables'>Variabel</MenuItem>
              <MenuItem href='/nimen/master-data/indicators'>Indikator</MenuItem>
            </SubMenu>
            <MenuItem href='/nimen/batch-config' icon={<i className='ri-settings-3-line' />}>
              Konfigurasi Angkatan
            </MenuItem>
          </MenuSection>
        )}

        {canManageUsers && (
          <MenuSection label='Administrasi'>
            <MenuItem href='/users' icon={<i className='ri-shield-user-line' />}>Manajemen User</MenuItem>
          </MenuSection>
        )}
      </Menu>
    </ScrollWrapper>
  )
}

export default VerticalMenu
