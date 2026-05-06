'use client'

import { Box, Typography } from '@mui/material'

/**
 * EmptyState — komponen standar untuk tampilan kosong.
 * Icon dan teks selalu center secara vertikal dan horizontal.
 *
 * Props:
 *   icon    : string  — remix icon class, default 'ri-inbox-line'
 *   message : string  — teks yang ditampilkan, default 'Tidak ada data ditemukan.'
 *   py      : number  — padding vertikal, default 6
 */
export default function EmptyState({
                                     icon    = 'ri-inbox-line',
                                     message = 'Tidak ada data ditemukan.',
                                     py      = 6,
                                   }) {
  return (
    <Box sx={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      py,
      gap: 1,
      width: '100%',
    }}>
      <i className={icon} style={{ fontSize: 48, opacity: 0.3, display: 'block' }} />
      <Typography variant='body2' color='text.secondary' textAlign='center'>
        {message}
      </Typography>
    </Box>
  )
}
