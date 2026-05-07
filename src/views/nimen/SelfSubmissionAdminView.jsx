'use client'
import { useVisibilityRefetch } from '@/hooks/useVisibilityRefetch'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
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

// ── Mobile Card — PWA Native style ────────────────────────────────────────────
const STATUS_BADGE = {
  PENDING:  { label: 'Menunggu',  bg: '#FAEEDA', color: '#BA7517' },
  APPROVED: { label: 'Disetujui', bg: '#E1F5EE', color: '#0F6E56' },
  REJECTED: { label: 'Ditolak',   bg: '#FCEBEB', color: '#A32D2D' },
}

const SubmissionMobileCard = ({ submission, onReview }) => {
  const badge = STATUS_BADGE[submission.status] || { label: submission.status, bg: '#F1EFE8', color: '#5F5E5A' }
  const isPending = submission.status === 'PENDING'
  const docCount = submission.documents?.length || 0

  return (
    <Box sx={{
      background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)',
      borderRadius: '12px', padding: '12px', mb: '10px',
    }}>
      {/* Header — nama mahasiswa */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', mb: '10px' }}>
        <Avatar sx={{
          width: 40, height: 40, borderRadius: '12px !important',
          background: 'linear-gradient(145deg, #E63946, #6D0E13)',
          boxShadow: '0 3px 8px rgba(180,0,30,0.22), inset 0 1px 0 rgba(255,180,180,0.35)',
          fontSize: 11, fontWeight: 500, flexShrink: 0,
        }}>
          {getInitials(submission.student?.full_name || '')}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#3B1010', lineHeight: 1.3 }} noWrap>
            {submission.student?.full_name}
          </Typography>
          <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>
            {submission.student?.student_profile?.nim || '—'}
          </Typography>
        </Box>
        <Box sx={{ bgcolor: badge.bg, borderRadius: '6px', px: 1, py: '3px', flexShrink: 0 }}>
          <Typography sx={{ fontSize: '10px', fontWeight: 500, color: badge.color }}>{badge.label}</Typography>
        </Box>
      </Box>

      {/* Meta info */}
      <Box sx={{
        py: '8px',
        borderTop: '0.5px solid rgba(180,100,100,0.1)',
        borderBottom: '0.5px solid rgba(180,100,100,0.1)',
        mb: '10px', display: 'flex', flexDirection: 'column', gap: '5px',
      }}>
        {/* Indikator + nilai */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <Typography sx={{ fontSize: '12px', fontWeight: 500, color: '#3B1010', flex: 1, minWidth: 0 }} noWrap>
            {submission.indicator?.name}
          </Typography>
          <Box sx={{ bgcolor: '#E1F5EE', borderRadius: '6px', px: '7px', py: '2px', flexShrink: 0 }}>
            <Typography sx={{ fontSize: '10px', fontWeight: 700, color: '#0F6E56' }}>
              +{submission.indicator?.value}
            </Typography>
          </Box>
        </Box>
        {/* Tanggal + dokumen */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <i className='ri-calendar-line' style={{ fontSize: '11px', color: '#9A5A5A' }} />
            <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>{fmtDate(submission.event_date)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <i className='ri-file-line' style={{ fontSize: '11px', color: docCount > 0 ? '#185FA5' : '#9A5A5A' }} />
            <Typography sx={{ fontSize: '11px', color: docCount > 0 ? '#185FA5' : '#9A5A5A' }}>
              {docCount} dokumen
            </Typography>
          </Box>
        </Box>
        {/* Alasan tolak */}
        {submission.status === 'REJECTED' && submission.rejection_reason && (
          <Box sx={{ bgcolor: '#FCEBEB', borderRadius: '6px', px: '8px', py: '4px' }}>
            <Typography sx={{ fontSize: '10px', color: '#A32D2D', fontStyle: 'italic' }}>
              {submission.rejection_reason}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Action button */}
      <Box component='button' onClick={() => onReview(submission)} sx={{
        width: '100%', py: '6px', borderRadius: '8px',
        fontSize: '11px', fontWeight: 600, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
        border: isPending ? 'none' : '0.5px solid rgba(180,100,100,0.18)',
        background: isPending
          ? 'linear-gradient(145deg, #E63946, #6D0E13)'
          : 'rgba(255,255,255,0.72)',
        boxShadow: isPending
          ? '0 4px 10px rgba(180,0,30,0.25), inset 0 1px 0 rgba(255,180,180,0.45)'
          : '0 2px 6px rgba(139,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.9)',
        color: isPending ? '#fff' : '#185FA5',
      }}>
        <i className={isPending ? 'ri-edit-box-line' : 'ri-eye-line'} style={{ fontSize: '13px' }} />
        {isPending ? 'Review Pengajuan' : 'Lihat Detail'}
      </Box>
    </Box>
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

  useVisibilityRefetch(fetchData)

  const pathname = usePathname()
  useEffect(() => { fetchData() }, [pathname, fetchData])


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
      {/* Topbar PWA style */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', mb: '14px' }}>
        <Box sx={{
          width: 34, height: 34, borderRadius: '10px',
          background: 'rgba(255,255,255,0.72)',
          border: '0.5px solid rgba(180,100,100,0.18)',
          boxShadow: '0 3px 10px rgba(139,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, cursor: 'pointer', position: 'relative', overflow: 'hidden',
          '&::before': {
            content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)',
          }
        }} onClick={() => window.history.back()}>
          <i className='ri-arrow-left-s-line' style={{ fontSize: '20px', color: '#8B2020', position: 'relative', zIndex: 1 }} />
        </Box>
        <Box>
          <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>NIMEN</Typography>
          <Typography sx={{ fontSize: '16px', fontWeight: 500, color: '#3B1010' }}>Pengajuan Nilai Mandiri</Typography>
        </Box>
      </Box>

      {/* Stats — 2x2 crystal icons */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', mb: '10px' }}>
        {[
          { label: 'Total Pengajuan', value: total,                                               icon: 'ri-file-list-3-line' },
          { label: 'Menunggu Review', value: statusFilter === 'PENDING'  ? total : statPending,  icon: 'ri-time-line' },
          { label: 'Disetujui',       value: statusFilter === 'APPROVED' ? total : statApproved, icon: 'ri-checkbox-circle-line' },
          { label: 'Ditolak',         value: statusFilter === 'REJECTED' ? total : statRejected, icon: 'ri-close-circle-line' },
        ].map(s => (
          <Box key={s.label} sx={{
            background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)',
            borderRadius: '12px', padding: '10px 12px',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
              background: 'linear-gradient(145deg, #E63946, #6D0E13)',
              boxShadow: '0 4px 10px rgba(180,0,30,0.25), inset 0 1px 0 rgba(255,180,180,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', overflow: 'hidden',
              '&::before': {
                content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
                borderRadius: '12px 12px 0 0',
                background: 'linear-gradient(180deg, rgba(255,200,200,0.32) 0%, transparent 100%)',
              }
            }}>
              <i className={s.icon} style={{ fontSize: '20px', color: 'rgba(255,255,255,0.92)', position: 'relative', zIndex: 1 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '20px', fontWeight: 500, color: '#3B1010', lineHeight: 1 }}>{s.value}</Typography>
              <Typography sx={{ fontSize: '10px', color: '#9A5A5A', mt: '2px', lineHeight: 1.3 }}>{s.label}</Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Filter — PWA native style */}
      <Box sx={{
        background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)',
        borderRadius: '12px', p: '10px 12px', mb: '10px',
        display: 'flex', flexDirection: 'column', gap: '8px',
      }}>
        <FormControl fullWidth size='small'>
          <Select
            displayEmpty
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(0) }}
            renderValue={val => {
              const cfg = STATUS_CONFIG[val]
              if (!cfg) return 'Semua Status'
              return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <i className={cfg.icon} style={{ fontSize: '14px', color: '#B45454' }} />
                  <span>{cfg.label}</span>
                </Box>
              )
            }}
            sx={{
              borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0',
              '& .MuiOutlinedInput-notchedOutline': { border: '0.5px solid rgba(180,100,100,0.15)' },
              '& .MuiSelect-select': { py: '7px', px: '10px' },
            }}
          >
            <MenuItem value=''>Semua Status</MenuItem>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <MenuItem key={key} value={key}>
                <Chip label={cfg.label} color={cfg.color} size='small' variant='tonal' />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <DebouncedInput
          fullWidth value={search}
          onChange={v => { setSearch(v); setPage(0) }}
          placeholder='Cari nama atau NIM...'
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0',
              '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15)' },
            },
            '& .MuiOutlinedInput-input': { py: '7px', px: '10px' },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <i className='ri-search-line' style={{ color: '#9A5A5A', fontSize: '14px' }} />
              </InputAdornment>
            )
          }}
        />
      </Box>

      {/* Content */}
      {loading ? (
        <Box className='flex justify-center py-10'><CircularProgress /></Box>
      ) : isMobile ? (
        // Mobile — Card List
        <>
          {data.length === 0 ? (
            <Card>
              <CardContent sx={{ py: 6 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <i className='ri-inbox-line' style={{ fontSize: 48, opacity: 0.3 }} />
                  <Typography variant='body2' color='text.secondary'>Tidak ada pengajuan ditemukan.</Typography>
                </Box>
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
                  <TableCell colSpan={6} sx={{ py: 8 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <i className='ri-inbox-line' style={{ fontSize: 48, opacity: 0.3 }} />
                      <Typography variant='body2' color='text.secondary'>Tidak ada pengajuan ditemukan.</Typography>
                    </Box>
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
