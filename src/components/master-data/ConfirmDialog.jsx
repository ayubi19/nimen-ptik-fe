'use client'

import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import CircularProgress from '@mui/material/CircularProgress'

const ConfirmDialog = ({ open, onClose, onConfirm, title, message, loading }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth='xs' fullWidth>
      <DialogTitle>{title || 'Konfirmasi'}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {message || 'Apakah Anda yakin ingin melakukan tindakan ini?'}
        </DialogContentText>
      </DialogContent>
      <DialogActions className='px-6 pb-4'>
        <Button onClick={onClose} disabled={loading} variant='outlined' color='secondary'>
          Batal
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant='contained'
          color='error'
          startIcon={loading ? <CircularProgress size={16} color='inherit' /> : null}
        >
          {loading ? 'Menghapus...' : 'Hapus'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ConfirmDialog
