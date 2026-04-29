'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Snackbar from '@mui/material/Snackbar'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { nimenSelfSubmissionApi } from '@/libs/api/nimenSelfSubmissionApi'
import DocumentManager from '@/components/nimen/DocumentManager'
import { getInitials } from '@/utils/getInitials'

const STATUS_CONFIG = {
  PENDING:  { label: 'Menunggu',  color: 'warning', icon: 'ri-time-line' },
  APPROVED: { label: 'Disetujui', color: 'success', icon: 'ri-checkbox-circle-line' },
  REJECTED: { label: 'Ditolak',   color: 'error',   icon: 'ri-close-circle-line' },
}

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—'

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

// ── Mobile Card ───────────────────────────────────────────────────────────────
const SubmissionMobileCard = ({ submission, onReview }) => {
  const cfg = STATUS_CONFIG[submission.status] || { label: submission.status, color: 'default' }
  const isPending = submission.status === 'PENDING'

  return (
    <Card className='mb-3'>
      <CardContent>
        <div className='flex items-start justify-between gap-2 mb-2'>
          <div className='flex items-center gap-2 flex-1 min-w-0'>
            <Avatar sx={{ width: 34, height: 34, fontSize: 12, flexShrink: 0 }}>
              {getInitials(submission.student?.full_name || '')}
            </Avatar>
            <div className='min-w-0'>
              <Typography variant='body2' fontWeight={600} noWrap>
                {submission.student?.full_name}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                {submission.student?.student_profile?.nim}
              </Typography>
            </div>
          </div>
          <Chip label={cfg.label} color={cfg.color} size='small' variant='tonal' sx={{ flexShrink: 0 }} />
        </div>

        <div className='flex flex-col gap-1 mb-3'>
          <Typography variant='body2' fontWeight={500}>{submission.indicator?.name}</Typography>
          <div className='flex items-center gap-2 flex-wrap'>
            <Chip label={`+${submission.indicator?.value}`} color='success' size='small'
                  variant='tonal' sx={{ fontWeight: 700 }} />
            <div className='flex items-center gap-1'>
              <i className='ri-calendar-line text-xs' style={{ color: 'var(--mui-palette-text-secondary)' }} />
              <Typography variant='caption' color='text.secondary'>{fmtDate(submission.event_date)}</Typography>
            </div>
            <Chip label={`${submission.documents?.length || 0} dokumen`} size='small'
                  color={submission.documents?.length > 0 ? 'info' : 'default'} variant='tonal' />
          </div>
          {submission.status === 'REJECTED' && submission.rejection_reason && (
            <Typography variant='caption' color='error.main' sx={{ fontStyle: 'italic' }}>
              Alasan: {submission.rejection_reason}
            </Typography>
          )}
        </div>

        <Divider className='mb-2' />
        <Button fullWidth size='small'
                variant={isPending ? 'contained' : 'tonal'}
                color={isPending ? 'primary' : 'secondary'}
                startIcon={<i className={isPending ? 'ri-edit-box-line' : 'ri-eye-line'} />}
                onClick={() => onReview(submission)}>
          {isPending ? 'Review Pengajuan' : 'Lihat Detail'}
        </Button>
      </CardContent>
    </Card>
  )
}

// ── Main View ─────────────────────────────────────────────────────────────────
const SelfSubmissionAdminView = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [data, setData]           = useState([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(false)
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [page, setPage]           = useState(0)
  const [pageSize, setPageSize]   = useState(10)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const [reviewTarget, setReviewTarget]       = useState(null)
  const [decision, setDecision]               = useState('APPROVED')
  const [rejectionReason, setRejectionReason] = useState('')
  const [reviewLoading, setReviewLoading]     = useState(false)

  const showToast = useCallback((msg, severity = 'success') =>
    setToast({ open: true, message: msg, severity }), [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await nimenSelfSubmissionApi.getAll({
        page: page + 1, page_size: pageSize,
        status: statusFilter || undefined,
        search: search || undefined,
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

  const handleOpenReview = useCallback((submission) => {
    setReviewTarget(submission)
    setDecision('APPROVED')
    setRejectionReason('')
  }, [])

  const handleReview = useCallback(async () => {
    if (decision === 'REJECTED' && !rejectionReason.trim()) {
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
      fetchData()
    } catch (err) {
      showToast(err.message || 'Gagal memproses pengajuan', 'error')
    } finally {
      setReviewLoading(false)
    }
  }, [reviewTarget, decision, rejectionReason, fetchData, showToast])

  const handlePresignDoc = useCallback(async (docId) =>
      nimenSelfSubmissionApi.getDocPresignedURL(reviewTarget?.id, docId),
    [reviewTarget])

  // Stats dari data halaman ini (approximation)
  const statPending  = data.filter(d => d.status === 'PENDING').length
  const statApproved = data.filter(d => d.status === 'APPROVED').length
  const statRejected = data.filter(d => d.status === 'REJECTED').length

  return (
    <>
      {/* Breadcrumb */}
      <div className='flex items-center gap-2 mb-6'>
        <Typography variant='caption' color='text.secondary'>NIMEN</Typography>
        <i className='ri-arrow-right-s-line text-sm opacity-50' />
        <Typography variant='caption' fontWeight={500} color='text.primary'>Pengajuan Nilai Mandiri</Typography>
      </div>

      {/* Stats */}
      <Grid container spacing={4} className='mb-6'>
        {[
          { label: 'Total Pengajuan', value: total,                                               icon: 'ri-file-list-3-line',      color: '#7367F0', bg: '#F3EDFF' },
          { label: 'Menunggu Review', value: statusFilter === 'PENDING'  ? total : statPending,  icon: 'ri-time-line',             color: '#FF9F43', bg: '#FFF3E8' },
          { label: 'Disetujui',       value: statusFilter === 'APPROVED' ? total : statApproved, icon: 'ri-checkbox-circle-line',  color: '#28C76F', bg: '#E6F9EE' },
          { label: 'Ditolak',         value: statusFilter === 'REJECTED' ? total : statRejected, icon: 'ri-close-circle-line',     color: '#EA5455', bg: '#FFEDED' },
        ].map(s => (
          <Grid item xs={6} sm={3} key={s.label}>
            <Card sx={{ height: '100%' }}>
              <CardContent className='flex items-center gap-3' sx={{ p: '12px !important' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                  background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className={s.icon} style={{ fontSize: 20, color: s.color }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <Typography variant='h5' fontWeight={600} lineHeight={1.2}>{s.value}</Typography>
                  <Typography variant='caption' color='text.secondary'
                              sx={{ display: 'block', fontSize: { xs: 11, sm: 12 }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.label}
                  </Typography>
                </div>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filter */}
      <Card className='mb-6'>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size='small'>
                <InputLabel>Status</InputLabel>
                <Select label='Status' value={statusFilter}
                        onChange={e => { setStatusFilter(e.target.value); setPage(0) }}>
                  <MenuItem value=''>Semua Status</MenuItem>
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <MenuItem key={key} value={key}>
                      <Chip label={cfg.label} color={cfg.color} size='small' variant='tonal' />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={8}>
              <DebouncedInput fullWidth value={search}
                              onChange={v => { setSearch(v); setPage(0) }}
                              placeholder='Cari nama atau NIM...'
                              InputProps={{ startAdornment: <InputAdornment position='start'><i className='ri-search-line' /></InputAdornment> }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <Box className='flex justify-center py-10'><CircularProgress /></Box>
      ) : isMobile ? (
        // Mobile — Card List
        <>
          {data.length === 0 ? (
            <Card>
              <CardContent className='text-center py-12'>
                <i className='ri-inbox-line text-5xl opacity-30 block mb-2' />
                <Typography variant='body2' color='text.secondary'>Tidak ada pengajuan ditemukan.</Typography>
              </CardContent>
            </Card>
          ) : data.map(s => (
            <SubmissionMobileCard key={s.id} submission={s} onReview={handleOpenReview} />
          ))}
          <TablePagination component='div' count={total} page={page} rowsPerPage={pageSize}
                           onPageChange={(_, p) => setPage(p)}
                           onRowsPerPageChange={e => { setPageSize(parseInt(e.target.value)); setPage(0) }}
                           rowsPerPageOptions={[10, 25, 50]}
                           labelRowsPerPage='Baris:'
                           labelDisplayedRows={({ from, to, count }) => `${from}–${to} dari ${count}`}
          />
        </>
      ) : (
        // Desktop — Table
        <Card>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                {['Mahasiswa', 'Indikator', 'Tanggal', 'Dokumen', 'Status', 'Aksi'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align='center' sx={{ py: 8 }}>
                    <i className='ri-inbox-line text-5xl opacity-30 block mb-2' />
                    <Typography variant='body2' color='text.secondary'>Tidak ada pengajuan ditemukan.</Typography>
                  </TableCell>
                </TableRow>
              ) : data.map(s => {
                const cfg = STATUS_CONFIG[s.status] || { label: s.status, color: 'default' }
                const isPending = s.status === 'PENDING'
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
                    <TableCell sx={{ maxWidth: 260 }}>
                      <Typography variant='body2' fontWeight={500} noWrap>{s.indicator?.name}</Typography>
                      <Chip label={`+${s.indicator?.value}`} color='success' size='small'
                            variant='tonal' sx={{ fontWeight: 700, mt: 0.5 }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>{fmtDate(s.event_date)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={`${s.documents?.length || 0} file`} size='small'
                            color={s.documents?.length > 0 ? 'info' : 'default'} variant='tonal' />
                    </TableCell>
                    <TableCell>
                      <Chip label={cfg.label} color={cfg.color} size='small' variant='tonal' />
                      {s.status === 'REJECTED' && s.rejection_reason && (
                        <Typography variant='caption' color='error.main'
                                    sx={{ display: 'block', mt: 0.5, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.rejection_reason}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button size='small'
                              variant={isPending ? 'contained' : 'tonal'}
                              color={isPending ? 'primary' : 'secondary'}
                              onClick={() => handleOpenReview(s)}>
                        {isPending ? 'Review' : 'Detail'}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <TablePagination component='div' count={total} page={page} rowsPerPage={pageSize}
                           onPageChange={(_, p) => setPage(p)}
                           onRowsPerPageChange={e => { setPageSize(parseInt(e.target.value)); setPage(0) }}
                           rowsPerPageOptions={[10, 25, 50]}
                           labelRowsPerPage='Baris per halaman:'
                           labelDisplayedRows={({ from, to, count }) => `${from}–${to} dari ${count}`}
          />
        </Card>
      )}

      {/* Dialog Review */}
      <Dialog open={!!reviewTarget} onClose={() => setReviewTarget(null)}
              maxWidth='sm' fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ pb: 1 }}>
          <div className='flex items-center justify-between'>
            <div>
              <Typography variant='h6'>
                {reviewTarget?.status === 'PENDING' ? 'Review Pengajuan' : 'Detail Pengajuan'}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                {reviewTarget?.student?.full_name} · {reviewTarget?.student?.student_profile?.nim}
              </Typography>
            </div>
            <IconButton onClick={() => setReviewTarget(null)}><i className='ri-close-line' /></IconButton>
          </div>
        </DialogTitle>
        <Divider />
        <DialogContent className='flex flex-col gap-4 pt-4'>
          {reviewTarget && (
            <>
              {/* Info summary */}
              <Grid container spacing={2}>
                {[
                  { label: 'Indikator', value: reviewTarget.indicator?.name },
                  { label: 'Nilai',     value: `+${reviewTarget.indicator?.value}`, chip: true },
                  { label: 'Tanggal Kejadian', value: fmtDate(reviewTarget.event_date) },
                  reviewTarget.notes && { label: 'Catatan Mahasiswa', value: reviewTarget.notes },
                ].filter(Boolean).map(r => (
                  <Grid item xs={12} key={r.label}>
                    <div className='flex items-start gap-2'>
                      <Typography variant='caption' color='text.secondary' sx={{ minWidth: 140, flexShrink: 0 }}>
                        {r.label}
                      </Typography>
                      {r.chip
                        ? <Chip label={r.value} color='success' size='small' variant='tonal' sx={{ fontWeight: 700 }} />
                        : <Typography variant='body2' fontWeight={500}>{r.value}</Typography>
                      }
                    </div>
                  </Grid>
                ))}
              </Grid>

              <Divider />

              {/* Dokumen */}
              <div>
                <Typography variant='subtitle2' className='mb-2'>
                  Dokumen Bukti ({reviewTarget.documents?.length || 0} file)
                </Typography>
                <DocumentManager
                  documents={reviewTarget.documents || []}
                  onGetPresignedURL={handlePresignDoc}
                  canUpload={false}
                  canDelete={false}
                  emptyText='Tidak ada dokumen yang diupload.'
                />
              </div>

              {/* Keputusan — hanya jika PENDING */}
              {reviewTarget.status === 'PENDING' && (
                <>
                  <Divider />
                  <FormControl fullWidth size='small'>
                    <InputLabel>Keputusan</InputLabel>
                    <Select label='Keputusan' value={decision}
                            onChange={e => setDecision(e.target.value)}>
                      <MenuItem value='APPROVED'>
                        <div className='flex items-center gap-2'>
                          <i className='ri-checkbox-circle-line' style={{ color: '#28C76F' }} />
                          Setujui — Nilai Langsung Masuk
                        </div>
                      </MenuItem>
                      <MenuItem value='REJECTED'>
                        <div className='flex items-center gap-2'>
                          <i className='ri-close-circle-line' style={{ color: '#EA5455' }} />
                          Tolak Pengajuan
                        </div>
                      </MenuItem>
                    </Select>
                  </FormControl>
                  {decision === 'REJECTED' && (
                    <TextField fullWidth multiline rows={3}
                               label='Alasan Penolakan (wajib)'
                               value={rejectionReason}
                               onChange={e => setRejectionReason(e.target.value)}
                               error={!rejectionReason.trim()}
                               helperText={!rejectionReason.trim() ? 'Wajib diisi jika menolak' : ''}
                    />
                  )}
                </>
              )}

              {/* Info jika sudah diproses */}
              {reviewTarget.status === 'REJECTED' && reviewTarget.rejection_reason && (
                <Alert severity='error' icon={<i className='ri-close-circle-line' />}>
                  <strong>Alasan Penolakan:</strong> {reviewTarget.rejection_reason}
                </Alert>
              )}
              {reviewTarget.status === 'APPROVED' && (
                <Alert severity='success' icon={<i className='ri-checkbox-circle-line' />}>
                  Pengajuan ini telah disetujui dan nilai sudah masuk ke rekap NIMEN.
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        {reviewTarget?.status === 'PENDING' && (
          <>
            <Divider />
            <DialogActions className='p-4 gap-2'>
              <Button variant='tonal' color='secondary'
                      onClick={() => setReviewTarget(null)} disabled={reviewLoading}>
                Batal
              </Button>
              <Button variant='contained'
                      color={decision === 'APPROVED' ? 'success' : 'error'}
                      onClick={handleReview} disabled={reviewLoading}
                      startIcon={reviewLoading
                        ? <CircularProgress size={16} color='inherit' />
                        : <i className={decision === 'APPROVED' ? 'ri-checkbox-circle-line' : 'ri-close-circle-line'} />
                      }>
                {reviewLoading ? 'Memproses...' : decision === 'APPROVED' ? 'Setujui Pengajuan' : 'Tolak Pengajuan'}
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
