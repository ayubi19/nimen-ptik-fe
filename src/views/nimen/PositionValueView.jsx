'use client'

import { useCallback, useState } from 'react'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Grid from '@mui/material/Grid'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import DialogContentText from '@mui/material/DialogContentText'
import { getInitials } from '@/utils/getInitials'
import apiClient from '@/libs/api/client'

const positionValueApi = {
  preview: (month) =>
    apiClient.get('/nimen/position-values/preview', { params: month ? { month } : {} }),
  grant: (month) =>
    apiClient.post('/nimen/position-values/grant', month ? { month } : {}),
}

const getCurrentMonth = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const formatMonth = (yyyymm) => {
  const [year, month] = yyyymm.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, 1)
  return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
}

const PositionValueView = () => {
  const [month, setMonth] = useState(getCurrentMonth())
  const [preview, setPreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [grantLoading, setGrantLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const showToast = useCallback((message, severity = 'success') => {
    setToast({ open: true, message, severity })
  }, [])

  const handlePreview = useCallback(async () => {
    setPreviewLoading(true)
    setResult(null)
    try {
      const res = await positionValueApi.preview(month)
      setPreview(res.data.data)
    } catch (err) {
      showToast(err.message || 'Gagal memuat preview', 'error')
    } finally {
      setPreviewLoading(false)
    }
  }, [month, showToast])

  const handleGrant = useCallback(async () => {
    setGrantLoading(true)
    setConfirmOpen(false)
    try {
      const res = await positionValueApi.grant(month)
      setResult(res.data.data)
      setPreview(null)
      showToast(`Nilai jabatan bulan ${formatMonth(month)} berhasil diberikan ke ${res.data.data.total_granted} pejabat`)
    } catch (err) {
      showToast(err.message || 'Gagal memberikan nilai jabatan', 'error')
    } finally {
      setGrantLoading(false)
    }
  }, [month, showToast])

  const displayData = result || preview

  return (
    <>
      <Grid container spacing={6}>

        {/* Control Panel */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title='Nilai Jabatan Bulanan'
              subheader='Berikan nilai jabatan secara otomatis ke semua pejabat aktif untuk bulan yang dipilih'
            />
            <Divider />
            <CardContent>
              <div className='flex flex-wrap items-end gap-4'>
                <TextField
                  type='month'
                  label='Pilih Bulan'
                  value={month}
                  onChange={e => { setMonth(e.target.value); setPreview(null); setResult(null) }}
                  size='small'
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 200 }}
                />
                <Button
                  variant='tonal'
                  color='primary'
                  startIcon={previewLoading ? <CircularProgress size={14} color='inherit' /> : <i className='ri-eye-line' />}
                  onClick={handlePreview}
                  disabled={previewLoading || grantLoading}
                >
                  {previewLoading ? 'Memuat...' : 'Preview'}
                </Button>
                {preview && preview.total_granted > 0 && (
                  <Button
                    variant='contained'
                    color='success'
                    startIcon={grantLoading ? <CircularProgress size={14} color='inherit' /> : <i className='ri-gift-line' />}
                    onClick={() => setConfirmOpen(true)}
                    disabled={grantLoading}
                  >
                    Berikan Nilai ke {preview.total_granted} Pejabat
                  </Button>
                )}
              </div>

              {displayData && (
                <Box sx={{ mt: 3 }}>
                  <div className='flex flex-wrap gap-3 mb-3'>
                    <Chip
                      label={`Periode: ${displayData.period}`}
                      color='primary'
                      variant='tonal'
                      icon={<i className='ri-calendar-line' />}
                    />
                    <Chip
                      label={`${displayData.total_granted} akan mendapat nilai`}
                      color='success'
                      variant='tonal'
                      icon={<i className='ri-check-line' />}
                    />
                    {displayData.total_skipped > 0 && (
                      <Chip
                        label={`${displayData.total_skipped} dilewati`}
                        color='warning'
                        variant='tonal'
                        icon={<i className='ri-skip-right-line' />}
                      />
                    )}
                    {result && (
                      <Chip
                        label='Sudah diberikan'
                        color='success'
                        icon={<i className='ri-checkbox-circle-line' />}
                      />
                    )}
                  </div>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Tabel Pejabat yang Akan/Sudah Dapat Nilai */}
        {displayData && displayData.granted?.length > 0 && (
          <Grid item xs={12} md={result || displayData.skipped?.length === 0 ? 12 : 7}>
            <Card>
              <CardHeader
                title={result ? '✅ Berhasil Diberikan' : 'Akan Mendapat Nilai'}
                subheader={`${displayData.granted.length} pejabat`}
                titleTypographyProps={{ variant: 'subtitle1' }}
              />
              <Divider />
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Nama</TableCell>
                    <TableCell>NIM</TableCell>
                    <TableCell>Jabatan</TableCell>
                    <TableCell align='right'>Nilai</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayData.granted.map(item => (
                    <TableRow key={item.user_id}>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <Avatar sx={{ width: 28, height: 28, fontSize: 11 }}>
                            {getInitials(item.full_name)}
                          </Avatar>
                          <Typography variant='body2' fontWeight={600}>{item.full_name}</Typography>
                        </div>
                      </TableCell>
                      <TableCell><Typography variant='body2'>{item.nim}</Typography></TableCell>
                      <TableCell>
                        <Typography variant='body2'>{item.position_name}</Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Chip
                          label={`+${item.value}`}
                          color='success'
                          size='small'
                          variant='tonal'
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </Grid>
        )}

        {/* Tabel yang Dilewati */}
        {displayData && displayData.skipped?.length > 0 && (
          <Grid item xs={12} md={displayData.granted?.length > 0 ? 5 : 12}>
            <Card>
              <CardHeader
                title='⏭ Dilewati'
                subheader={`${displayData.skipped.length} pejabat sudah menerima nilai bulan ini`}
                titleTypographyProps={{ variant: 'subtitle1' }}
              />
              <Divider />
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Nama</TableCell>
                    <TableCell>Alasan</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayData.skipped.map(item => (
                    <TableRow key={item.user_id}>
                      <TableCell>
                        <Typography variant='body2' fontWeight={600}>{item.full_name}</Typography>
                        <Typography variant='caption' color='text.secondary'>{item.nim}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='caption' color='warning.main'>
                          {item.skip_reason}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </Grid>
        )}

        {/* Empty state */}
        {!displayData && !previewLoading && (
          <Grid item xs={12}>
            <Box className='flex flex-col items-center py-10 gap-2' sx={{ color: 'text.secondary' }}>
              <i className='ri-medal-line text-5xl opacity-30' />
              <Typography variant='body2'>
                Pilih bulan dan klik <strong>Preview</strong> untuk melihat siapa yang akan mendapat nilai jabatan.
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Dialog Konfirmasi */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Konfirmasi Pemberian Nilai</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Berikan nilai jabatan bulan <strong>{formatMonth(month)}</strong> ke{' '}
            <strong>{preview?.total_granted} pejabat</strong> aktif?
            <br /><br />
            Tindakan ini tidak dapat dibatalkan.
          </DialogContentText>
        </DialogContent>
        <DialogActions className='p-4 gap-2'>
          <Button variant='tonal' color='secondary' onClick={() => setConfirmOpen(false)}>
            Batal
          </Button>
          <Button variant='contained' color='success' onClick={handleGrant}>
            Ya, Berikan Nilai
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={5000}
        onClose={() => setToast(t => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity={toast.severity} variant='filled'
          onClose={() => setToast(t => ({ ...t, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  )
}

export default PositionValueView
