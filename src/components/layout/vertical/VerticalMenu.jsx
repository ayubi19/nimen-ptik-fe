'use client'

// MUI Imports
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'

// Component Imports
import { Menu, SubMenu, MenuItem, MenuSection } from '@menu/vertical-menu'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Styled Component Imports
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'

const RenderExpandIcon = ({ open, transitionDuration }) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='ri-arrow-right-s-line' />
  </StyledVerticalNavExpandIcon>
)

const VerticalMenu = ({ scrollMenu }) => {
  const theme = useTheme()
  const verticalNavOptions = useVerticalNav()
  const { isBreakpointReached, transitionDuration } = verticalNavOptions
  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  return (
    <ScrollWrapper
      {...(isBreakpointReached
        ? {
          className: 'bs-full overflow-y-auto overflow-x-hidden',
          onScroll: container => scrollMenu(container, false)
        }
        : {
          options: { wheelPropagation: false, suppressScrollX: true },
          onScrollY: container => scrollMenu(container, true)
        })}
    >
      <Menu
        popoutMenuOffset={{ mainAxis: 17 }}
        menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='ri-circle-fill' /> }}
        menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
      >
        {/* Dashboard */}
        <MenuItem href='/dashboard' icon={<i className='ri-home-smile-line' />}>
          Dashboard
        </MenuItem>

        {/* Akademik */}
        <MenuSection label='Akademik'>
          <MenuItem href='/nimen' icon={<i className='ri-medal-line' />}>
            NIMEN
          </MenuItem>
          <SubMenu label='Inisiatif' icon={<i className='ri-lightbulb-line' />}>
            <MenuItem href='/initiative'>Semua Inisiatif</MenuItem>
          </SubMenu>
          <MenuItem href='/ranking' icon={<i className='ri-bar-chart-line' />}>
            Peringkat
          </MenuItem>
        </MenuSection>

        {/* Mahasiswa */}
        <MenuSection label='Mahasiswa'>
          <MenuItem href='/students/list' icon={<i className='ri-group-line' />}>
            Daftar Mahasiswa
          </MenuItem>
          <MenuItem href='/onboarding' icon={<i className='ri-user-add-line' />}>
            Onboarding
          </MenuItem>
          <MenuItem href='/violation' icon={<i className='ri-error-warning-line' />}>
            Pelanggaran
          </MenuItem>
        </MenuSection>

        {/* Jadwal */}
        <MenuSection label='Jadwal'>
          <MenuItem href='/schedule' icon={<i className='ri-calendar-line' />}>
            Jadwal Kegiatan
          </MenuItem>
        </MenuSection>

        {/* Master Data */}
        <MenuSection label='Master Data'>
          <SubMenu label='Master Data' icon={<i className='ri-database-2-line' />}>
            <MenuItem href='/master-data/syndicates'>Sindikat</MenuItem>
            <MenuItem href='/master-data/batches'>Angkatan</MenuItem>
            <MenuItem href='/master-data/academic-statuses'>Status Akademik</MenuItem>
          </SubMenu>
        </MenuSection>
      </Menu>
    </ScrollWrapper>
  )
}

export default VerticalMenu
