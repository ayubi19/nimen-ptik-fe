'use client'

import Chip from '@mui/material/Chip'

const StatusChip = ({ isActive }) => {
  return (
    <Chip
      label={isActive ? 'Aktif' : 'Nonaktif'}
      color={isActive ? 'success' : 'default'}
      size='small'
      variant='tonal'
    />
  )
}

export default StatusChip
