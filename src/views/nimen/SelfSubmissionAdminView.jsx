'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import TablePagination from '@mui/material/TablePagination'
import { nimenSelfSubmissionApi } from '@/libs/api/nimenSelfSubmissionApi'
import DocumentManager from '@/components/nimen/DocumentManager'
import { getInitials } from '@/utils/getInitials'

const STATUS_CONFIG = {
  PENDING:  { label: 'Menunggu', color: 'warning' },
  APPROVED: { label: 'Disetujui', color: 'success' },
  REJECTED: { label: 'Ditolak', color: 'error' },
}

const DebouncedInput = ({ value: initial, onChange, debounce = 400, ...props }) => {
  const [value, setValue] = useState(initial)
  const ref = useRef(onChange)
  useEffect(() => { ref.current = onChange }, [onChange])
  useEffect(() => setValue(initial), [initial])
  useEffect(() => {
    const t = setTimeout(() => ref.current(value), debounce)
    return () => clearTimeout(t)
  }, [value, debounce])
  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} size='small' />
}

const SelfSubmissionAdminView = () => {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  // Dialog review
  const [reviewTarget, setReviewTarget] = useState(null)
  const [decision, setDecision] = useState('APPROVED')
  const [rejectionReason, setRejectionReason] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)

  const showToast = useCallback((message, severity = 'success') => {
    setToast({ open: true, message, severity })
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await nimenSelfSubmissionApi.getAll({
        page: page + 1, page_size: pageSize,
        status: statusFilter, search,
      })
      setData(res.data.data?.data || [])
      setTotal(res.data.data?.pagination?.total || 0)
    } catch (err) {
      showToast(err.message || 'Gagal memuat data', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, statusFilter, search, showToast])

  useEffect(() => { fetchData() }, [fetchData])

  const handleReview = useCallback(async () => {
    if (decision === 'REJECTED' && !rejectionReason) {
      showToast('Alasan penolakan wajib diisi', 'error')
      return
    }
    setReviewLoading(true)
    try {
      await nimenSelfSubmissionApi.review(reviewTarget.id, {
        decision,
        rejection_reason: rejectionReason,
      })
      showToast(decision === 'APPROVED' ? 'Pengajuan disetujui, nilai berhasil masuk' : 'Pengajuan ditolak')
      setReviewTarget(null)
      setRejectionReason('')
      fetchData()
    } catch (err) {
      showToast(err.message || 'Gagal memproses pengajuan', 'error')
    } finally {
      setReviewLoading(false)
    }
  }, [reviewTarget, decision, rejectionReason, fetchData, showToast])

  const handlePresignDoc = useCallback(async (docId) => {
    return nimenSelfSubmissionApi.getDocPresignedURL(reviewTarget?.id, docId)
  }, [reviewTarget])

  return (
    <>
      <Card>
        <CardHeader
          title='Pengajuan Nilai Mandiri'
          subheader='Review dan proses pengajuan nilai dari mahasiswa'
        />
        <div className='flex flex-wrap gap-4 px-6 pb-4'>
          <FormControl size='small' sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select label='Status' value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(0) }}>
              <MenuItem value=''>Semua</MenuItem>
              <MenuItem value='PENDING'>Menunggu</MenuItem>
              <MenuItem value='APPROVED'>Disetujui</MenuItem>
              <MenuItem value='REJECTED'>Ditolak</MenuItem>
            </Select>
          </FormControl>
          <DebouncedInput
            value={search} onChange={v => { setSearch(v); setPage(0) }}
            placeholder='Cari nama atau NIM...'
            InputProps={{ startAdornment: <InputAdornment position='start'><i className='ri-search-line' /></InputAdornment> }}
            sx={{ minWidth: 240 }}
          />
        </div>
        <Divider />
        {loading ? (
          <Box className='flex justify-center py-10'><CircularProgress /></Box>
        ) : data.length === 0 ? (
          <Box className='flex flex-col items-center py-10 gap-2' sx={{ color: 'text.secondary' }}>
            <i className='ri-inbox-line text-5xl opacity-30' />
            <Typography variant='body2'>Tidak ada pengajuan.</Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Mahasiswa</TableCell>
                <TableCell>Indikator</TableCell>
                <TableCell>Tanggal Kejadian</TableCell>
                <TableCell>Dokumen</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align='center'>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map(s => {
                const cfg = STATUS_CONFIG[s.status] || { label: s.status, color: 'default' }
                return (
                  <TableRow key={s.id} hover>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Avatar sx={{ width: 32, height: 32, fontSize: 12 }}>
                          {getInitials(s.student?.full_name || '')}
                        </Avatar>
                        <div>
                          <Typography variant='body2' fontWeight={600}>{s.student?.full_name}</Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {s.student?.student_profile?.nim}
                          </Typography>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' fontWeight={600}>{s.indicator?.name}</Typography>
                      <Chip
                        label={`+${s.indicator?.value}`}
                        color='success' size='small' variant='tonal'
                        sx={{ fontWeight: 700, mt: 0.5 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>
                        {new Date(s.event_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={`${s.documents?.length || 0} file`} size='small'
                        color={s.documents?.length > 0 ? 'success' : 'error'} variant='tonal' />
                    </TableCell>
                    <TableCell>
                      <Chip label={cfg.label} color={cfg.color} size='small' variant='tonal' />
                      {s.status === 'REJECTED' && s.rejection_reason && (
                        <Typography variant='caption' color='error.main' sx={{ display: 'block', mt: 0.5 }}>
                          {s.rejection_reason}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align='center'>
                      <Button size='small'
                        variant={s.status === 'PENDING' ? 'contained' : 'tonal'}
                        color={s.status === 'PENDING' ? 'primary' : 'secondary'}
                        onClick={() => { setReviewTarget(s); setDecision('APPROVED'); setRejectionReason('') }}>
                        {s.status === 'PENDING' ? 'Review' : 'Detail'}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
        <TablePagination component='div' count={total} page={page} rowsPerPage={pageSize}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={e => { setPageSize(parseInt(e.target.value)); setPage(0) }}
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage='Baris per halaman:'
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} dari ${count}`}
        />
      </Card>

      {/* Dialog Review */}
      <Dialog open={!!reviewTarget} onClose={() => setReviewTarget(null)} maxWidth='sm' fullWidth>
        <DialogTitle>
          Review Pengajuan
          <IconButton sx={{ position: 'absolute', right: 8, top: 8 }} onClick={() => setReviewTarget(null)}>
            <i className='ri-close-line' />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent className='flex flex-col gap-4 pt-4'>
          {reviewTarget && (
            <>
              <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
                <Typography variant='body2'><strong>Mahasiswa:</strong> {reviewTarget.student?.full_name} ({reviewTarget.student?.student_profile?.nim})</Typography>
                <Typography variant='body2'><strong>Indikator:</strong> {reviewTarget.indicator?.name} (+{reviewTarget.indicator?.value})</Typography>
                <Typography variant='body2'><strong>Tanggal:</strong> {new Date(reviewTarget.event_date).toLocaleDateString('id-ID')}</Typography>
                {reviewTarget.notes && <Typography variant='body2'><strong>Catatan:</strong> {reviewTarget.notes}</Typography>}
              </Box>

              {/* Dokumen */}
              <div>
                <Typography variant='subtitle2' className='mb-2'>Dokumen Bukti</Typography>
                <DocumentManager
                  documents={reviewTarget.documents || []}
                  onGetPresignedURL={handlePresignDoc}
                  canUpload={false}
                  canDelete={false}
                  emptyText='Tidak ada dokumen yang diupload.'
                />
              </div>

              {reviewTarget.status === 'PENDING' && (
                <>
                  <Divider />
                  <FormControl fullWidth>
                    <InputLabel>Keputusan</InputLabel>
                    <Select label='Keputusan' value={decision} onChange={e => setDecision(e.target.value)}>
                      <MenuItem value='APPROVED'>✅ Setujui — Nilai Masuk</MenuItem>
                      <MenuItem value='REJECTED'>❌ Tolak</MenuItem>
                    </Select>
                  </FormControl>
                  {decision === 'REJECTED' && (
                    <TextField fullWidth multiline rows={3}
                      label='Alasan penolakan (wajib)'
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                    />
                  )}
                </>
              )}
            </>
          )}
        </DialogContent>
        {reviewTarget?.status === 'PENDING' && (
          <>
            <Divider />
            <DialogActions className='p-4 gap-2'>
              <Button variant='tonal' color='secondary' onClick={() => setReviewTarget(null)} disabled={reviewLoading}>Batal</Button>
              <Button variant='contained' color={decision === 'APPROVED' ? 'success' : 'error'}
                onClick={handleReview} disabled={reviewLoading}
                startIcon={reviewLoading ? <CircularProgress size={16} color='inherit' /> : null}>
                {reviewLoading ? 'Memproses...' : decision === 'APPROVED' ? 'Setujui' : 'Tolak'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={4000}
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

export default SelfSubmissionAdminView
