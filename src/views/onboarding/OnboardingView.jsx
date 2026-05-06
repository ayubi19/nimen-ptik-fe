'use client'
import { useVisibilityRefetch } from '@/hooks/useVisibilityRefetch'

import { useEffect, useState, useCallback, useRef } from 'react'
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
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
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
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { useForm, Controller } from 'react-hook-form'
import { getInitials } from '@/utils/getInitials'
import { onboardingApi, telegramAdminApi } from '@/libs/api/onboardingApi'
import { syndicateApi, batchApi, academicStatusApi } from '@/libs/api/masterDataApi'

const STATUS_CONFIG = {
  PENDING:  { label: 'Menunggu',  icon: 'ri-time-line' },
  APPROVED: { label: 'Disetujui', icon: 'ri-checkbox-circle-line' },
  REJECTED: { label: 'Ditolak',   icon: 'ri-close-circle-line' },
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

const RegistrationMobileCard = ({ reg, onDetail, onApprove, onReject }) => {
  const badge = STATUS_BADGE[reg.status] || { label: reg.status, bg: '#F1EFE8', color: '#5F5E5A' }
  const isPending = reg.status === 'PENDING'

  return (
    <Box sx={{
      background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)',
      borderRadius: '12px', padding: '12px', mb: '10px',
    }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', mb: '10px' }}>
        <Avatar sx={{
          width: 40, height: 40, borderRadius: '12px !important',
          background: 'linear-gradient(145deg, #E63946, #6D0E13)',
          boxShadow: '0 3px 8px rgba(180,0,30,0.22), inset 0 1px 0 rgba(255,180,180,0.35)',
          fontSize: 11, fontWeight: 500, flexShrink: 0,
        }}>
          {getInitials(reg.full_name)}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#3B1010', lineHeight: 1.3 }} noWrap>
            {reg.full_name}
          </Typography>
          <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>{reg.nim || '—'}</Typography>
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
        mb: '10px', display: 'flex', flexDirection: 'column', gap: '4px',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i className='ri-mail-line' style={{ fontSize: '12px', color: '#9A5A5A', flexShrink: 0 }} />
          <Typography sx={{ fontSize: '11px', color: '#3B1010', wordBreak: 'break-all' }}>{reg.email}</Typography>
        </Box>
        {reg.phone && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className='ri-phone-line' style={{ fontSize: '12px', color: '#9A5A5A', flexShrink: 0 }} />
            <Typography sx={{ fontSize: '11px', color: '#3B1010' }}>{reg.phone}</Typography>
          </Box>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i className='ri-calendar-line' style={{ fontSize: '12px', color: '#9A5A5A', flexShrink: 0 }} />
          <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>{fmtDate(reg.created_at)}</Typography>
        </Box>
      </Box>

      {/* Rejection reason */}
      {reg.status === 'REJECTED' && reg.rejection_reason && (
        <Box sx={{ bgcolor: '#FCEBEB', border: '0.5px solid rgba(163,45,45,0.2)', borderRadius: '8px', p: '8px 10px', mb: '10px' }}>
          <Typography sx={{ fontSize: '11px', color: '#A32D2D' }}>{reg.rejection_reason}</Typography>
        </Box>
      )}

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: '6px' }}>
        <Box component='button' onClick={() => onDetail(reg)} sx={{
          flex: 1, py: '5px', borderRadius: '8px', fontSize: '10px', fontWeight: 500,
          border: '0.5px solid rgba(180,100,100,0.18)',
          background: 'rgba(255,255,255,0.72)',
          boxShadow: '0 2px 6px rgba(139,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.9)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
          color: '#185FA5',
        }}>
          <i className='ri-eye-line' style={{ fontSize: '11px' }} /> Detail
        </Box>
        {isPending && (
          <>
            <Box component='button' onClick={() => onApprove(reg)} sx={{
              flex: 1, py: '5px', borderRadius: '8px', fontSize: '10px', fontWeight: 500,
              border: '0.5px solid rgba(15,110,86,0.25)',
              background: '#E1F5EE', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
              color: '#0F6E56',
            }}>
              <i className='ri-checkbox-circle-line' style={{ fontSize: '11px' }} /> Setujui
            </Box>
            <Box component='button' onClick={() => onReject(reg)} sx={{
              flex: 1, py: '5px', borderRadius: '8px', fontSize: '10px', fontWeight: 500,
              border: '0.5px solid rgba(163,45,45,0.2)',
              background: '#FCEBEB', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
              color: '#A32D2D',
            }}>
              <i className='ri-close-circle-line' style={{ fontSize: '11px' }} /> Tolak
            </Box>
          </>
        )}
      </Box>
    </Box>
  )
}

// ── Main View ─────────────────────────────────────────────────────────────────
const OnboardingView = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [data, setData]         = useState([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(false)
  const [globalFilter, setGlobalFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [page, setPage]         = useState(0)
  const [pageSize, setPageSize] = useState(10)

  const [syndicates, setSyndicates]             = useState([])
  const [batches, setBatches]                   = useState([])
  const [academicStatuses, setAcademicStatuses] = useState([])

  const [detailOpen, setDetailOpen]     = useState(false)
  const [detailData, setDetailData]     = useState(null)
  const [approveOpen, setApproveOpen]   = useState(false)
  const [approveTarget, setApproveTarget] = useState(null)
  const [approveLoading, setApproveLoading] = useState(false)
  const [rejectOpen, setRejectOpen]     = useState(false)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectLoading, setRejectLoading] = useState(false)
  const [telegramOpen, setTelegramOpen] = useState(false)
  const [telegramForm, setTelegramForm] = useState({ telegram_user_id: '', telegram_username: '' })
  const [telegramLoading, setTelegramLoading] = useState(false)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const showToast = useCallback((msg, severity = 'success') =>
    setToast({ open: true, message: msg, severity }), [])

  const { control: approveControl, handleSubmit: handleApproveSubmit,
    reset: resetApprove, formState: { errors: approveErrors } } = useForm({
    defaultValues: { nim: '', syndicate_id: '', batch_id: '', academic_status_id: '',
      gender: 'M', religion: 'Islam', marital_status: 'SINGLE' }
  })

  const { control: rejectControl, handleSubmit: handleRejectSubmit,
    reset: resetReject, formState: { errors: rejectErrors } } = useForm({
    defaultValues: { reason: '' }
  })

  useEffect(() => {
    syndicateApi.getAllActive().then(r => setSyndicates(r.data.data || [])).catch(() => {})
    batchApi.getAllActive().then(r => setBatches(r.data.data || [])).catch(() => {})
    academicStatusApi.getAllActive().then(r => setAcademicStatuses(r.data.data || [])).catch(() => {})
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page: page + 1, page_size: pageSize }
      if (globalFilter) params.search = globalFilter
      if (statusFilter) params.status = statusFilter
      const res = await onboardingApi.getAll(params)
      setData(res.data.data?.data || [])
      setTotal(res.data.data?.pagination?.total || 0)
    } catch (err) {
      showToast(err.message || 'Gagal memuat data', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, globalFilter, statusFilter, showToast])

  useEffect(() => { fetchData() }, [fetchData])
  // Refetch saat tab visible dengan cooldown 30 detik
  useVisibilityRefetch(fetchData)



  // Refetch saat halaman mendapat fokus kembali atau navigasi dari notifikasi
  const pathname = usePathname()
  useEffect(() => {
    const onFocus = () => fetchData()
    const onVisible = () => { if (document.visibilityState === 'visible') fetchData() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [fetchData])

  useEffect(() => { fetchData() }, [pathname, fetchData])

  const handleOpenApprove = useCallback((row) => {
    setApproveTarget(row)
    resetApprove({ nim: row.nim, syndicate_id: '', batch_id: '', academic_status_id: '',
      gender: 'M', religion: 'Islam', marital_status: 'SINGLE' })
    setApproveOpen(true)
  }, [resetApprove])

  const handleOpenReject = useCallback((row) => {
    setRejectTarget(row)
    resetReject({ reason: '' })
    setRejectOpen(true)
  }, [resetReject])

  const handleApprove = useCallback(async (values) => {
    setApproveLoading(true)
    try {
      await onboardingApi.approve(approveTarget.id, {
        syndicate_id: parseInt(values.syndicate_id),
        batch_id: parseInt(values.batch_id),
        academic_status_id: parseInt(values.academic_status_id),
        nim: values.nim, gender: values.gender,
        religion: values.religion, marital_status: values.marital_status,
      })
      showToast('Registrasi disetujui, akun mahasiswa berhasil dibuat')
      setApproveOpen(false); fetchData()
    } catch (err) {
      showToast(err.message || 'Gagal menyetujui', 'error')
    } finally { setApproveLoading(false) }
  }, [approveTarget, fetchData, showToast])

  const handleReject = useCallback(async (values) => {
    setRejectLoading(true)
    try {
      await onboardingApi.reject(rejectTarget.id, { reason: values.reason })
      showToast('Pendaftaran berhasil ditolak')
      setRejectOpen(false); fetchData()
    } catch (err) {
      showToast(err.message || 'Gagal menolak', 'error')
    } finally { setRejectLoading(false) }
  }, [rejectTarget, fetchData, showToast])

  const handleRegisterTelegram = useCallback(async () => {
    if (!telegramForm.telegram_user_id) return
    setTelegramLoading(true)
    try {
      await telegramAdminApi.registerAdmin({
        telegram_user_id: parseInt(telegramForm.telegram_user_id),
        telegram_username: telegramForm.telegram_username || null,
      })
      showToast('Telegram berhasil didaftarkan untuk notifikasi')
      setTelegramOpen(false)
      setTelegramForm({ telegram_user_id: '', telegram_username: '' })
    } catch (err) {
      showToast(err.message || 'Gagal mendaftarkan Telegram', 'error')
    } finally { setTelegramLoading(false) }
  }, [telegramForm, showToast])

  const pendingCount  = data.filter(d => d.status === 'PENDING').length
  const approvedCount = data.filter(d => d.status === 'APPROVED').length
  const rejectedCount = data.filter(d => d.status === 'REJECTED').length

  return (
    <>
      {/* Topbar PWA style */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', mb: '14px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
            <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>Mahasiswa</Typography>
            <Typography sx={{ fontSize: '16px', fontWeight: 500, color: '#3B1010' }}>Onboarding</Typography>
          </Box>
        </Box>
        {/* Tombol Telegram tetap ada */}
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: '6px',
          px: '10px', py: '6px', borderRadius: '10px', cursor: 'pointer',
          background: 'rgba(255,255,255,0.72)',
          border: '0.5px solid rgba(180,100,100,0.18)',
          boxShadow: '0 3px 10px rgba(139,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
        }} onClick={() => setTelegramOpen(true)}>
          <i className='ri-telegram-line' style={{ fontSize: '16px', color: '#185FA5' }} />
          <Typography sx={{ fontSize: '11px', fontWeight: 500, color: '#3B1010', display: { xs: 'none', sm: 'block' } }}>
            Telegram Saya
          </Typography>
        </Box>
      </Box>

      {/* Stats — 2x2 crystal icons, referensi StudentsListView */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', mb: '10px' }}>
        {[
          { label: 'Total Pendaftaran', value: total,                                                  icon: 'ri-file-list-3-line' },
          { label: 'Menunggu Review',   value: statusFilter === 'PENDING'  ? total : pendingCount,    icon: 'ri-time-line' },
          { label: 'Disetujui',         value: statusFilter === 'APPROVED' ? total : approvedCount,   icon: 'ri-checkbox-circle-line' },
          { label: 'Ditolak',           value: statusFilter === 'REJECTED' ? total : rejectedCount,   icon: 'ri-close-circle-line' },
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
              <Typography sx={{ fontSize: '20px', fontWeight: 500, color: '#3B1010', lineHeight: 1 }}>
                {s.value}
              </Typography>
              <Typography sx={{ fontSize: '10px', color: '#9A5A5A', mt: '2px', lineHeight: 1.3 }}>
                {s.label}
              </Typography>
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
                  <i className={cfg.icon} style={{ fontSize: '16px', color: '#B45454' }}></i>
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
                <i className={cfg.icon} style={{ fontSize: '16px' }}></i>
                <Chip label={cfg.label} color={cfg.color} size='small' variant='tonal' />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <DebouncedInput
          fullWidth
          value={globalFilter}
          onChange={v => { setGlobalFilter(v); setPage(0) }}
          placeholder='Cari nama, NIM, email...'
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
        <>
          {data.length === 0 ? (
            <Card>
              <CardContent sx={{ py: 6 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <i className='ri-user-add-line' style={{ fontSize: 48, opacity: 0.3 }} />
                  <Typography variant='body2' color='text.secondary'>Tidak ada pendaftaran ditemukan.</Typography>
                </Box>
              </CardContent>
            </Card>
          ) : data.map(reg => (
            <RegistrationMobileCard key={reg.id} reg={reg}
                                    onDetail={r => { setDetailData(r); setDetailOpen(true) }}
                                    onApprove={handleOpenApprove}
                                    onReject={handleOpenReject}
            />
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
        <Card>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                {['Pendaftar', 'Kontak', 'Telegram', 'Tanggal Daftar', 'Status', 'Aksi'].map(h => (
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
                      <i className='ri-user-add-line' style={{ fontSize: 48, opacity: 0.3 }} />
                      <Typography variant='body2' color='text.secondary'>Tidak ada pendaftaran ditemukan.</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : data.map(reg => {
                const cfg = STATUS_CONFIG[reg.status] || { label: reg.status, color: 'default' }
                const isPending = reg.status === 'PENDING'
                return (
                  <TableRow key={reg.id} hover>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Avatar sx={{ width: 32, height: 32, fontSize: 12, bgcolor: 'primary.main' }}>
                          {getInitials(reg.full_name)}
                        </Avatar>
                        <div>
                          <Typography variant='body2' fontWeight={600}>{reg.full_name}</Typography>
                          <Typography variant='caption' color='text.secondary'>{reg.nim}</Typography>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>{reg.email}</Typography>
                      {reg.phone && <Typography variant='caption' color='text.secondary'>{reg.phone}</Typography>}
                    </TableCell>
                    <TableCell>
                      {reg.telegram_username
                        ? <Chip label={`@${reg.telegram_username}`} size='small' variant='tonal' color='info' icon={<i className='ri-telegram-line' />} />
                        : <Typography variant='caption' color='text.secondary'>—</Typography>
                      }
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>{fmtDate(reg.created_at)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={cfg.label} color={cfg.color} size='small' variant='tonal' />
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-0.5'>
                        <Tooltip title='Detail'>
                          <IconButton size='small' onClick={() => { setDetailData(reg); setDetailOpen(true) }}>
                            <i className='ri-eye-line text-[18px]' />
                          </IconButton>
                        </Tooltip>
                        {isPending && (
                          <>
                            <Tooltip title='Setujui'>
                              <IconButton size='small' color='success' onClick={() => handleOpenApprove(reg)}>
                                <i className='ri-checkbox-circle-line text-[18px]' />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='Tolak'>
                              <IconButton size='small' color='error' onClick={() => handleOpenReject(reg)}>
                                <i className='ri-close-circle-line text-[18px]' />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </div>
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

      {/* Drawer Detail */}
      <Drawer anchor='right' open={detailOpen} onClose={() => setDetailOpen(false)}
              PaperProps={{ sx: { width: { xs: '100%', sm: 420 } } }}>
        <div className='flex items-center justify-between p-4 border-b'>
          <Typography variant='h6'>Detail Pendaftaran</Typography>
          <IconButton onClick={() => setDetailOpen(false)}><i className='ri-close-line' /></IconButton>
        </div>
        {detailData && (
          <div className='p-4 flex flex-col gap-3 overflow-y-auto'>
            <div className='flex flex-col items-center gap-2 py-2'>
              <Avatar sx={{ width: 64, height: 64, fontSize: 22, bgcolor: 'primary.main' }}>
                {getInitials(detailData.full_name)}
              </Avatar>
              <div className='text-center'>
                <Typography variant='h6' fontWeight={600}>{detailData.full_name}</Typography>
                <Typography variant='caption' color='text.secondary'>{detailData.nim}</Typography>
              </div>
              <Chip label={STATUS_CONFIG[detailData.status]?.label || detailData.status}
                    color={STATUS_CONFIG[detailData.status]?.color || 'default'} size='small' variant='tonal' />
            </div>
            <Divider />
            {[
              { icon: 'ri-mail-line',      label: 'Email',         value: detailData.email },
              { icon: 'ri-phone-line',     label: 'Telepon',       value: detailData.phone },
              { icon: 'ri-telegram-line',  label: 'Telegram',      value: detailData.telegram_username ? `@${detailData.telegram_username}` : null },
              { icon: 'ri-map-pin-line',   label: 'Tempat Lahir',  value: detailData.birth_place },
              { icon: 'ri-cake-line',      label: 'Tanggal Lahir', value: fmtDate(detailData.birth_date) },
              { icon: 'ri-calendar-line',  label: 'Tanggal Daftar',value: fmtDate(detailData.created_at) },
            ].map(r => r.value ? (
              <div key={r.label} className='flex items-center gap-3'>
                <Box sx={{ width: 30, height: 30, borderRadius: 1, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`${r.icon} text-sm`} />
                </Box>
                <div className='min-w-0'>
                  <Typography variant='caption' color='text.secondary'>{r.label}</Typography>
                  <Typography variant='body2' fontWeight={500} sx={{ wordBreak: 'break-all' }}>{r.value}</Typography>
                </div>
              </div>
            ) : null)}
            {detailData.rejection_reason && (
              <Alert severity='error'>
                <strong>Alasan Penolakan:</strong> {detailData.rejection_reason}
              </Alert>
            )}
            {detailData.status === 'PENDING' && (
              <div className='flex gap-2 mt-2'>
                <Button fullWidth variant='contained' color='success'
                        startIcon={<i className='ri-checkbox-circle-line' />}
                        onClick={() => { setDetailOpen(false); handleOpenApprove(detailData) }}>
                  Setujui
                </Button>
                <Button fullWidth variant='tonal' color='error'
                        startIcon={<i className='ri-close-circle-line' />}
                        onClick={() => { setDetailOpen(false); handleOpenReject(detailData) }}>
                  Tolak
                </Button>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Drawer Approve */}
      <Drawer anchor='right' open={approveOpen} onClose={() => setApproveOpen(false)}
              PaperProps={{ sx: { width: { xs: '100%', sm: 480 } } }}>
        <div className='flex items-center justify-between p-4 border-b'>
          <div>
            <Typography variant='h6'>Setujui Pendaftaran</Typography>
            {approveTarget && <Typography variant='caption' color='text.secondary'>{approveTarget.full_name}</Typography>}
          </div>
          <IconButton onClick={() => setApproveOpen(false)}><i className='ri-close-line' /></IconButton>
        </div>
        <form onSubmit={handleApproveSubmit(handleApprove)} className='flex flex-col gap-4 p-4 overflow-y-auto'>
          {/* Info dari mahasiswa */}
          <Box sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 2 }}>
            <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
              DATA DARI MAHASISWA
            </Typography>
            <Grid container spacing={1}>
              {[
                ['Tempat Lahir', approveTarget?.birth_place, 6],
                ['Tanggal Lahir', fmtDate(approveTarget?.birth_date), 6],
                ['Telepon', approveTarget?.phone, 6],
                ['Email', approveTarget?.email, 12],
              ].map(([label, value, xs]) => value ? (
                <Grid item xs={xs} key={label}>
                  <Typography variant='caption' color='text.secondary'>{label}</Typography>
                  <Typography variant='body2' fontWeight={500} sx={{ wordBreak: 'break-all' }}>{value}</Typography>
                </Grid>
              ) : null)}
            </Grid>
          </Box>
          <Divider><Typography variant='caption'>Lengkapi Data</Typography></Divider>
          <Controller name='nim' control={approveControl} rules={{ required: 'NIM wajib diisi' }}
                      render={({ field }) => (
                        <TextField {...field} fullWidth size='small' label='NIM (konfirmasi/koreksi)'
                                   error={!!approveErrors.nim} helperText={approveErrors.nim?.message} />
                      )}
          />
          <Controller name='syndicate_id' control={approveControl} rules={{ required: 'Wajib dipilih' }}
                      render={({ field }) => (
                        <FormControl fullWidth size='small' error={!!approveErrors.syndicate_id}>
                          <InputLabel>Sindikat</InputLabel>
                          <Select {...field} label='Sindikat'>
                            {syndicates.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                          </Select>
                        </FormControl>
                      )}
          />
          <Controller name='batch_id' control={approveControl} rules={{ required: 'Wajib dipilih' }}
                      render={({ field }) => (
                        <FormControl fullWidth size='small' error={!!approveErrors.batch_id}>
                          <InputLabel>Angkatan</InputLabel>
                          <Select {...field} label='Angkatan'
                                  renderValue={val => {
                                    const b = batches.find(x => x.id === val || String(x.id) === String(val))
                                    if (!b) return ''
                                    return (
                                      <div className='flex items-center justify-between gap-2'>
                                        <Typography variant='body2' fontWeight={500} noWrap>{b.name}</Typography>
                                        <Chip label={b.program_type || 'S1'} size='small' variant='tonal'
                                              color={b.program_type === 'S2' ? 'info' : 'success'} sx={{ flexShrink: 0 }} />
                                      </div>
                                    )
                                  }}>
                            {batches.map(b => (
                              <MenuItem key={b.id} value={b.id}>
                                <div className='flex items-center justify-between w-full gap-2'>
                                  <div>
                                    <Typography variant='body2' fontWeight={500}>{b.name}</Typography>
                                    <Typography variant='caption' color='text.secondary'>
                                      Angkatan ke-{b.batch_number} · {b.year}
                                    </Typography>
                                  </div>
                                  <Chip label={b.program_type || 'S1'} size='small' variant='tonal'
                                        color={b.program_type === 'S2' ? 'info' : 'success'} />
                                </div>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
          />
          <Controller name='academic_status_id' control={approveControl} rules={{ required: 'Wajib dipilih' }}
                      render={({ field }) => (
                        <FormControl fullWidth size='small' error={!!approveErrors.academic_status_id}>
                          <InputLabel>Status Akademik</InputLabel>
                          <Select {...field} label='Status Akademik'>
                            {academicStatuses.map(a => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
                          </Select>
                        </FormControl>
                      )}
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Controller name='gender' control={approveControl}
                          render={({ field }) => (
                            <FormControl fullWidth size='small'>
                              <InputLabel>Jenis Kelamin</InputLabel>
                              <Select {...field} label='Jenis Kelamin'>
                                <MenuItem value='M'>Laki-laki</MenuItem>
                                <MenuItem value='F'>Perempuan</MenuItem>
                              </Select>
                            </FormControl>
                          )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller name='marital_status' control={approveControl}
                          render={({ field }) => (
                            <FormControl fullWidth size='small'>
                              <InputLabel>Status Pernikahan</InputLabel>
                              <Select {...field} label='Status Pernikahan'>
                                <MenuItem value='SINGLE'>Belum Menikah</MenuItem>
                                <MenuItem value='MARRIED'>Menikah</MenuItem>
                              </Select>
                            </FormControl>
                          )}
              />
            </Grid>
          </Grid>
          <Controller name='religion' control={approveControl}
                      render={({ field }) => (
                        <FormControl fullWidth size='small'>
                          <InputLabel>Agama</InputLabel>
                          <Select {...field} label='Agama'>
                            {['Islam','Kristen','Katolik','Hindu','Buddha','Konghucu'].map(r => (
                              <MenuItem key={r} value={r}>{r}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
          />
          <div className='flex gap-2 mt-2'>
            <Button fullWidth variant='tonal' color='secondary'
                    onClick={() => setApproveOpen(false)} disabled={approveLoading}>Batal</Button>
            <Button fullWidth variant='contained' color='success' type='submit' disabled={approveLoading}
                    startIcon={approveLoading ? <CircularProgress size={16} color='inherit' /> : <i className='ri-checkbox-circle-line' />}>
              {approveLoading ? 'Memproses...' : 'Setujui & Buat Akun'}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Dialog Reject */}
      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Tolak Pendaftaran</DialogTitle>
        <DialogContent>
          <DialogContentText className='mb-4'>
            Tolak pendaftaran <strong>{rejectTarget?.full_name}</strong> ({rejectTarget?.nim})?
            Mahasiswa akan mendapat notifikasi via Telegram.
          </DialogContentText>
          <form id='reject-form' onSubmit={handleRejectSubmit(handleReject)}>
            <Controller name='reason' control={rejectControl}
                        rules={{ required: 'Alasan wajib diisi', minLength: { value: 5, message: 'Minimal 5 karakter' } }}
                        render={({ field }) => (
                          <TextField {...field} fullWidth multiline rows={3} label='Alasan Penolakan'
                                     placeholder='Tuliskan alasan penolakan yang jelas untuk mahasiswa...'
                                     error={!!rejectErrors.reason} helperText={rejectErrors.reason?.message} />
                        )}
            />
          </form>
        </DialogContent>
        <DialogActions className='p-4 gap-2'>
          <Button variant='tonal' color='secondary' onClick={() => setRejectOpen(false)} disabled={rejectLoading}>
            Batal
          </Button>
          <Button type='submit' form='reject-form' variant='contained' color='error' disabled={rejectLoading}
                  startIcon={rejectLoading ? <CircularProgress size={16} color='inherit' /> : null}>
            {rejectLoading ? 'Memproses...' : 'Tolak Pendaftaran'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Drawer Telegram */}
      <Drawer anchor='right' open={telegramOpen} onClose={() => setTelegramOpen(false)}
              PaperProps={{ sx: { width: { xs: '100%', sm: 400 } } }}>
        <div className='flex items-center justify-between p-4 border-b'>
          <div>
            <Typography variant='h6'>Daftarkan Telegram</Typography>
            <Typography variant='caption' color='text.secondary'>Untuk menerima notifikasi registrasi baru</Typography>
          </div>
          <IconButton onClick={() => setTelegramOpen(false)}><i className='ri-close-line' /></IconButton>
        </div>
        <div className='flex flex-col gap-4 p-4'>
          <Alert severity='info'>
            Cara mendapat Telegram User ID: buka Telegram, cari <strong>@userinfobot</strong>, kirim pesan apapun — bot akan membalas dengan ID kamu.
          </Alert>
          <TextField fullWidth size='small' label='Telegram User ID' type='number'
                     value={telegramForm.telegram_user_id}
                     onChange={e => setTelegramForm(f => ({ ...f, telegram_user_id: e.target.value }))}
                     placeholder='Contoh: 123456789' />
          <TextField fullWidth size='small' label='Username Telegram (opsional)'
                     value={telegramForm.telegram_username}
                     onChange={e => setTelegramForm(f => ({ ...f, telegram_username: e.target.value }))}
                     placeholder='tanpa @'
                     InputProps={{ startAdornment: <InputAdornment position='start'>@</InputAdornment> }}
          />
          <div className='flex gap-2 mt-2'>
            <Button fullWidth variant='tonal' color='secondary'
                    onClick={() => setTelegramOpen(false)} disabled={telegramLoading}>Batal</Button>
            <Button fullWidth variant='contained'
                    disabled={!telegramForm.telegram_user_id || telegramLoading}
                    onClick={handleRegisterTelegram}
                    startIcon={telegramLoading ? <CircularProgress size={16} color='inherit' /> : <i className='ri-telegram-line' />}>
              {telegramLoading ? 'Mendaftarkan...' : 'Daftarkan'}
            </Button>
          </div>
        </div>
      </Drawer>

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

export default OnboardingView
