'use client'
import { useVisibilityRefetch } from '@/hooks/useVisibilityRefetch'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import dayjs from 'dayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import 'dayjs/locale/id'
import Alert from '@mui/material/Alert'
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
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Snackbar from '@mui/material/Snackbar'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { nimenSelfSubmissionApi } from '@/libs/api/nimenSelfSubmissionApi'
import DocumentManager from '@/components/nimen/DocumentManager'

const STATUS_CONFIG = {
  PENDING:  { label: 'Menunggu Review', color: 'warning', icon: 'ri-time-line' },
  APPROVED: { label: 'Disetujui',       color: 'success', icon: 'ri-checkbox-circle-line' },
  REJECTED: { label: 'Ditolak',         color: 'error',   icon: 'ri-close-circle-line' },
}

const ALLOWED_TYPES = ['pdf', 'docx', 'xlsx', 'jpg', 'jpeg', 'png', 'webp']
const MAX_SIZE_MB = 10

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—'

const fileIcon = (name) => {
  const ext = name?.split('.').pop().toLowerCase()
  if (['jpg','jpeg','png','webp'].includes(ext)) return 'ri-image-line'
  if (ext === 'pdf') return 'ri-file-pdf-line'
  if (ext === 'docx') return 'ri-file-word-line'
  if (ext === 'xlsx') return 'ri-file-excel-line'
  return 'ri-file-line'
}

// ── Submission Card — PWA native ─────────────────────────────────────────────
const STATUS_BADGE = {
  PENDING:  { bg: '#FAEEDA', color: '#BA7517' },
  APPROVED: { bg: '#E1F5EE', color: '#0F6E56' },
  REJECTED: { bg: '#FCEBEB', color: '#A32D2D' },
}

const SubmissionCard = ({ submission, onDetail, onCancel }) => {
  const cfg   = STATUS_CONFIG[submission.status] || { label: submission.status }
  const badge = STATUS_BADGE[submission.status]  || { bg: '#F1EFE8', color: '#5F5E5A' }
  const docCount = submission.documents?.length || 0
  return (
    <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', p: '12px', mb: '10px' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', mb: '8px' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#3B1010', lineHeight: 1.3 }} noWrap>{submission.indicator?.name}</Typography>
          <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>{fmtDate(submission.event_date)}</Typography>
        </Box>
        <Box sx={{ bgcolor: badge.bg, borderRadius: '6px', px: '8px', py: '3px', flexShrink: 0 }}>
          <Typography sx={{ fontSize: '10px', fontWeight: 500, color: badge.color }}>{cfg.label}</Typography>
        </Box>
      </Box>
      {submission.status === 'REJECTED' && submission.rejection_reason && (
        <Box sx={{ bgcolor: '#FCEBEB', borderRadius: '7px', px: '10px', py: '6px', mb: '8px' }}>
          <Typography sx={{ fontSize: '11px', color: '#A32D2D' }}>{submission.rejection_reason}</Typography>
        </Box>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', pt: '8px', borderTop: '0.5px solid rgba(180,100,100,0.1)' }}>
        <Box sx={{ bgcolor: docCount > 0 ? '#E6F1FB' : '#F1EFE8', borderRadius: '6px', px: '8px', py: '3px' }}>
          <Typography sx={{ fontSize: '10px', fontWeight: 500, color: docCount > 0 ? '#185FA5' : '#5F5E5A' }}>{docCount} dokumen</Typography>
        </Box>
        {docCount > 0 && (
          <Box component='button' onClick={() => onDetail(submission)} sx={{ display: 'flex', alignItems: 'center', gap: '3px', px: '8px', py: '3px', borderRadius: '6px', cursor: 'pointer', background: 'rgba(255,255,255,0.72)', border: '0.5px solid rgba(180,100,100,0.18)' }}>
            <i className='ri-folder-open-line' style={{ fontSize: '12px', color: '#9A5A5A' }} />
            <Typography sx={{ fontSize: '10px', fontWeight: 500, color: '#3B1010' }}>Lihat</Typography>
          </Box>
        )}
        {submission.status === 'PENDING' && (
          <Box component='button' onClick={() => onCancel(submission)} sx={{ display: 'flex', alignItems: 'center', gap: '3px', px: '8px', py: '3px', borderRadius: '6px', border: 'none', cursor: 'pointer', bgcolor: '#FCEBEB' }}>
            <i className='ri-close-circle-line' style={{ fontSize: '12px', color: '#A32D2D' }} />
            <Typography sx={{ fontSize: '10px', fontWeight: 500, color: '#A32D2D' }}>Batal</Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}

// ── Main View ─────────────────────────────────────────────────────────────────
const SelfSubmissionStudentView = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [indicators, setIndicators]   = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading]         = useState(true)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const [createOpen, setCreateOpen]           = useState(false)
  const [selectedIndicator, setSelectedIndicator] = useState(null)
  const [eventDate, setEventDate]             = useState(null)
  const [notes, setNotes]                     = useState('')
  const [pendingFiles, setPendingFiles]       = useState([])
  const [createLoading, setCreateLoading]     = useState(false)
  const [uploadProgress, setUploadProgress]   = useState(0)
  const fileInputRef = useRef(null)

  const [detailOpen, setDetailOpen]           = useState(false)
  const [detailSubmission, setDetailSubmission] = useState(null)
  const [cancelTarget, setCancelTarget]       = useState(null)
  const [cancelLoading, setCancelLoading]     = useState(false)

  // Preview file lokal (sebelum upload)
  const [localPreview, setLocalPreview]       = useState(null) // { url, type, name }

  const handleLocalPreview = useCallback((file) => {
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['pdf', 'jpg', 'jpeg', 'png', 'webp'].includes(ext)) return
    const url = URL.createObjectURL(file)
    setLocalPreview({ url, type: ext, name: file.name })
  }, [])

  const closeLocalPreview = useCallback(() => {
    if (localPreview?.url) URL.revokeObjectURL(localPreview.url)
    setLocalPreview(null)
  }, [localPreview])

  const showToast = useCallback((msg, severity = 'success') =>
    setToast({ open: true, message: msg, severity }), [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [indRes, subRes] = await Promise.all([
        nimenSelfSubmissionApi.getAvailableIndicators(),
        nimenSelfSubmissionApi.getMy({ page: 1, page_size: 50 }),
      ])
      setIndicators(indRes.data.data || [])
      setSubmissions(subRes.data.data?.data || [])
    } catch (err) {
      showToast(err.message || 'Gagal memuat data', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { fetchData() }, [fetchData])

  useVisibilityRefetch(fetchData)

  const pathname = usePathname()
  useEffect(() => { fetchData() }, [pathname, fetchData])
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


  const resetCreate = useCallback(() => {
    setEventDate(null); setNotes(''); setPendingFiles([])
    setUploadProgress(0); setSelectedIndicator(null)
  }, [])

  const handlePickFile = useCallback((e) => {
    const files = Array.from(e.target.files || [])
    const errors = []; const valid = []
    files.forEach(f => {
      const ext = f.name.split('.').pop().toLowerCase()
      if (!ALLOWED_TYPES.includes(ext)) { errors.push(`${f.name}: tipe tidak diizinkan`); return }
      if (f.size > MAX_SIZE_MB * 1024 * 1024) { errors.push(`${f.name}: melebihi ${MAX_SIZE_MB}MB`); return }
      if (pendingFiles.length + valid.length >= 10) { errors.push('Maksimal 10 file'); return }
      valid.push(f)
    })
    if (errors.length > 0) showToast(errors.join(', '), 'error')
    if (valid.length > 0) setPendingFiles(prev => [...prev, ...valid])
    e.target.value = ''
  }, [pendingFiles, showToast])

  const handleCreate = useCallback(async () => {
    if (!eventDate?.isValid()) { showToast('Tanggal kejadian wajib diisi', 'error'); return }
    if (pendingFiles.length === 0) { showToast('Upload minimal 1 dokumen bukti', 'error'); return }
    setCreateLoading(true); setUploadProgress(0)
    try {
      const res = await nimenSelfSubmissionApi.create({
        indicator_id: selectedIndicator.indicator_id,
        event_date: eventDate.format('YYYY-MM-DD'), notes,
      })
      const sid = res.data.data.id
      for (let i = 0; i < pendingFiles.length; i++) {
        await nimenSelfSubmissionApi.uploadDocument(sid, pendingFiles[i])
        setUploadProgress(Math.round(((i + 1) / pendingFiles.length) * 100))
      }
      showToast('Pengajuan berhasil dikirim!')
      setCreateOpen(false); resetCreate(); fetchData()
    } catch (err) {
      showToast(err.message || 'Gagal membuat pengajuan', 'error')
    } finally { setCreateLoading(false) }
  }, [selectedIndicator, eventDate, notes, pendingFiles, fetchData, showToast, resetCreate])

  const handleCancel = useCallback(async () => {
    setCancelLoading(true)
    try {
      await nimenSelfSubmissionApi.cancel(cancelTarget.id)
      showToast('Pengajuan berhasil dibatalkan')
      setCancelTarget(null); fetchData()
    } catch (err) {
      showToast(err.message || 'Gagal membatalkan', 'error')
    } finally { setCancelLoading(false) }
  }, [cancelTarget, fetchData, showToast])

  const handlePresignDoc = useCallback(async (docId) =>
      nimenSelfSubmissionApi.getDocPresignedURL(detailSubmission.id, docId),
    [detailSubmission])

  if (loading) return <Box className='flex justify-center py-20'><CircularProgress /></Box>

  const availableIndicators = indicators.filter(i => i.can_submit)
  const cooldownIndicators  = indicators.filter(i => !i.can_submit)
  const pendingCount  = submissions.filter(s => s.status === 'PENDING').length
  const approvedCount = submissions.filter(s => s.status === 'APPROVED').length

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale='id'>
      {/* Topbar PWA */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', mb: '14px' }}>
        <Box sx={{ width: 34, height: 34, borderRadius: '10px', background: 'rgba(255,255,255,0.72)', border: '0.5px solid rgba(180,100,100,0.18)', boxShadow: '0 3px 10px rgba(139,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', position: 'relative', overflow: 'hidden', '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)' } }} onClick={() => window.history.back()}>
          <i className='ri-arrow-left-s-line' style={{ fontSize: '20px', color: '#8B2020', position: 'relative', zIndex: 1 }} />
        </Box>
        <Box>
          <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>NIMEN</Typography>
          <Typography sx={{ fontSize: '16px', fontWeight: 500, color: '#3B1010' }}>Pengajuan Nilai Mandiri</Typography>
        </Box>
      </Box>

      {/* Stats — 2x2 crystal */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', mb: '10px' }}>
        {[
          { label: 'Total Pengajuan', value: submissions.length,         icon: 'ri-file-list-3-line' },
          { label: 'Menunggu Review', value: pendingCount,               icon: 'ri-time-line' },
          { label: 'Nilai Masuk',     value: approvedCount,              icon: 'ri-checkbox-circle-line' },
          { label: 'Bisa Diajukan',   value: availableIndicators.length, icon: 'ri-hand-coin-line' },
        ].map(s => (
          <Box key={s.label} sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', flexShrink: 0, background: 'linear-gradient(145deg, #E63946, #6D0E13)', boxShadow: '0 4px 10px rgba(180,0,30,0.25), inset 0 1px 0 rgba(255,180,180,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '45%', borderRadius: '12px 12px 0 0', background: 'linear-gradient(180deg, rgba(255,200,200,0.32) 0%, transparent 100%)' } }}>
              <i className={s.icon} style={{ fontSize: '20px', color: 'rgba(255,255,255,0.92)', position: 'relative', zIndex: 1 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '20px', fontWeight: 500, color: '#3B1010', lineHeight: 1 }}>{s.value}</Typography>
              <Typography sx={{ fontSize: '10px', color: '#9A5A5A', mt: '2px' }}>{s.label}</Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Indikator section — native */}
      <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', overflow: 'hidden', mb: '10px' }}>
        <Box sx={{ px: 2, py: '12px', borderBottom: '0.5px solid rgba(180,100,100,0.1)' }}>
          <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#3B1010' }}>Indikator yang Bisa Diajukan</Typography>
          <Typography sx={{ fontSize: '10px', color: '#9A5A5A' }}>Ajukan nilai untuk kegiatan di luar sprint</Typography>
        </Box>
        {indicators.length === 0 ? (
          <Box sx={{ py: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <i className='ri-inbox-line' style={{ fontSize: 36, opacity: 0.25 }} />
            <Typography sx={{ fontSize: '12px', color: '#9A5A5A' }}>Tidak ada indikator tersedia.</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {/* Tersedia */}
            {availableIndicators.map((ind, i) => (
              <Box key={ind.indicator_id} sx={{ px: 2, py: '12px', borderBottom: '0.5px solid rgba(180,100,100,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#3B1010', lineHeight: 1.3 }} noWrap>{ind.indicator_name}</Typography>
                  <Typography sx={{ fontSize: '10px', color: '#9A5A5A', mt: '1px' }} noWrap>{ind.category_name} · {ind.variable_name}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '3px', mt: '3px' }}>
                    <i className='ri-refresh-line' style={{ fontSize: '10px', color: '#9A5A5A' }} />
                    <Typography sx={{ fontSize: '10px', color: '#9A5A5A' }}>Cooldown {ind.cooldown_days} hari</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <Box sx={{ bgcolor: '#E1F5EE', borderRadius: '6px', px: '8px', py: '3px' }}>
                    <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#0F6E56' }}>+{ind.value}</Typography>
                  </Box>
                  <Box component='button' onClick={() => { setSelectedIndicator(ind); setCreateOpen(true) }} sx={{ px: '12px', py: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'linear-gradient(145deg, #E63946, #6D0E13)', boxShadow: '0 3px 8px rgba(180,0,30,0.2)' }}>
                    <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#fff' }}>Ajukan</Typography>
                  </Box>
                </Box>
              </Box>
            ))}
            {/* Cooldown */}
            {cooldownIndicators.map(ind => (
              <Box key={ind.indicator_id} sx={{ px: 2, py: '12px', borderBottom: '0.5px solid rgba(180,100,100,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', opacity: 0.75, borderLeft: '3px solid #BA7517' }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#3B1010' }}>{ind.indicator_name}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', mt: '3px' }}>
                    <i className='ri-time-line' style={{ fontSize: '11px', color: '#BA7517' }} />
                    <Typography sx={{ fontSize: '10px', color: '#BA7517' }}>
                      Cooldown aktif · bisa diajukan {new Date(ind.cooldown_until).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} ({ind.days_until_allowed} hari lagi)
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ bgcolor: '#F1EFE8', borderRadius: '6px', px: '8px', py: '3px', flexShrink: 0 }}>
                  <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#5F5E5A' }}>+{ind.value}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Riwayat Pengajuan — native */}
      <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ px: 2, py: '12px', borderBottom: '0.5px solid rgba(180,100,100,0.1)' }}>
          <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#3B1010' }}>Riwayat Pengajuan Saya</Typography>
        </Box>
        {submissions.length === 0 ? (
          <Box sx={{ py: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <i className='ri-inbox-line' style={{ fontSize: 36, opacity: 0.25 }} />
            <Typography sx={{ fontSize: '12px', color: '#9A5A5A' }}>Belum ada pengajuan.</Typography>
          </Box>
        ) : isMobile ? (
          <Box sx={{ p: '12px' }}>
            {submissions.map(s => (
              <SubmissionCard key={s.id} submission={s}
                              onDetail={sub => { setDetailSubmission(sub); setDetailOpen(true) }}
                              onCancel={setCancelTarget}
              />
            ))}
          </Box>
        ) : (
          // Desktop — Table
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                {['Indikator', 'Tanggal Kejadian', 'Dokumen', 'Status', 'Aksi'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {submissions.map(s => {
                const cfg = STATUS_CONFIG[s.status] || { label: s.status, color: 'default' }
                return (
                  <TableRow key={s.id} hover>
                    <TableCell>
                      <Typography variant='body2' fontWeight={600}>{s.indicator?.name}</Typography>
                      <Typography variant='caption' color='text.secondary'>{s.indicator?.variable?.name}</Typography>
                    </TableCell>
                    <TableCell><Typography variant='body2'>{fmtDate(s.event_date)}</Typography></TableCell>
                    <TableCell>
                      <Chip label={`${s.documents?.length || 0} file`} size='small'
                            color={s.documents?.length > 0 ? 'info' : 'default'} variant='tonal' />
                    </TableCell>
                    <TableCell>
                      <Chip label={cfg.label} color={cfg.color} size='small' variant='tonal' />
                      {s.status === 'REJECTED' && s.rejection_reason && (
                        <Typography variant='caption' color='error.main' sx={{ display: 'block', mt: 0.5 }}>
                          {s.rejection_reason}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-1'>
                        {s.documents?.length > 0 && (
                          <Tooltip title='Lihat dokumen'>
                            <IconButton size='small'
                                        onClick={() => { setDetailSubmission(s); setDetailOpen(true) }}>
                              <i className='ri-folder-open-line text-[18px]' />
                            </IconButton>
                          </Tooltip>
                        )}
                        {s.status === 'PENDING' && (
                          <Tooltip title='Batalkan pengajuan'>
                            <IconButton size='small' color='error' onClick={() => setCancelTarget(s)}>
                              <i className='ri-close-circle-line text-[18px]' />
                            </IconButton>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Box>

      {/* Dialog Buat Pengajuan */}
      <Dialog open={createOpen}
              onClose={() => { if (!createLoading) { setCreateOpen(false); resetCreate() } }}
              maxWidth='sm' fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ pb: 1 }}>
          <div className='flex items-start justify-between gap-2'>
            <div>
              <Typography variant='h6'>Ajukan Nilai Mandiri</Typography>
              <Typography variant='caption' color='text.secondary'>
                {selectedIndicator?.indicator_name}
              </Typography>
            </div>
            {isMobile && (
              <IconButton onClick={() => { setCreateOpen(false); resetCreate() }} disabled={createLoading}>
                <i className='ri-close-line' />
              </IconButton>
            )}
          </div>
        </DialogTitle>
        <Divider />
        <DialogContent className='flex flex-col gap-4 pt-4'>
          <Alert severity='info' icon={<i className='ri-information-line' />}>
            Nilai <strong>+{selectedIndicator?.value}</strong> akan masuk setelah admin menyetujui.
            {selectedIndicator?.cooldown_days > 0 && (
              <> Cooldown <strong>{selectedIndicator.cooldown_days} hari</strong> setelah disetujui.</>
            )}
          </Alert>

          <DatePicker
            label='Tanggal Kejadian *'
            value={eventDate}
            onChange={val => setEventDate(val)}
            maxDate={dayjs()}
            format='DD/MM/YYYY'
            slotProps={{ textField: { fullWidth: true, required: true, size: 'small' } }}
            disabled={createLoading}
          />

          <TextField fullWidth multiline rows={2} label='Catatan (opsional)' size='small'
                     placeholder='Ceritakan singkat kegiatan yang kamu lakukan'
                     value={notes} onChange={e => setNotes(e.target.value)} disabled={createLoading} />

          {/* Upload Dokumen */}
          <div>
            <div className='flex items-center justify-between mb-2'>
              <Typography variant='subtitle2'>
                Dokumen Bukti <span style={{ color: 'red' }}>*</span>
              </Typography>
              <Typography variant='caption' color='text.secondary'>{pendingFiles.length}/10 file</Typography>
            </div>

            {/* Dashed zone — selalu tampil selama belum penuh */}
            {pendingFiles.length < 10 && (
              <Box component='label' htmlFor='self-submission-file-input' sx={{
                border: '2px dashed',
                borderColor: createLoading ? 'divider' : 'divider',
                borderRadius: 2, p: 3,
                textAlign: 'center',
                cursor: createLoading ? 'not-allowed' : 'pointer',
                display: 'block',
                transition: 'all .2s', mb: pendingFiles.length > 0 ? 2 : 0,
                '&:hover': !createLoading ? { borderColor: 'primary.main', bgcolor: 'action.hover' } : {},
              }}>
                <i className='ri-upload-cloud-2-line text-4xl opacity-40 block mb-1' />
                <Typography variant='body2' color='text.secondary'>Klik untuk pilih file</Typography>
                <Typography variant='caption' color='text.secondary'>
                  PDF, DOCX, JPG, PNG, WEBP · maks {MAX_SIZE_MB}MB per file
                </Typography>
              </Box>
            )}

            {/* List file yang sudah dipilih */}
            {pendingFiles.length > 0 && (
              <List dense disablePadding sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                {pendingFiles.map((f, idx) => {
                  const ext = f.name.split('.').pop().toLowerCase()
                  const isViewable = ['pdf', 'jpg', 'jpeg', 'png', 'webp'].includes(ext)
                  return (
                    <ListItem key={idx} divider={idx < pendingFiles.length - 1}
                              secondaryAction={
                                <Box className='flex items-center gap-0.5'>
                                  {isViewable && (
                                    <Tooltip title='Preview'>
                                      <IconButton size='small' disabled={createLoading}
                                                  onClick={() => handleLocalPreview(f)}>
                                        <i className='ri-eye-line text-[16px]' />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                  <IconButton edge='end' size='small' disabled={createLoading}
                                              onClick={() => setPendingFiles(prev => prev.filter((_, i) => i !== idx))}>
                                    <i className='ri-close-line' />
                                  </IconButton>
                                </Box>
                              }>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <i className={`${fileIcon(f.name)} text-[18px]`} />
                      </ListItemIcon>
                      <ListItemText
                        primary={<Typography variant='body2' noWrap sx={{ maxWidth: 220 }}>{f.name}</Typography>}
                        secondary={`${(f.size / 1024 / 1024).toFixed(2)} MB`}
                      />
                    </ListItem>
                  )
                })}
              </List>
            )}

            {/* Penuh */}
            {pendingFiles.length >= 10 && (
              <Box sx={{
                border: '2px dashed', borderColor: 'divider', borderRadius: 2, p: 2,
                textAlign: 'center', opacity: 0.5,
              }}>
                <i className='ri-checkbox-circle-line text-3xl block mb-1' />
                <Typography variant='caption' color='text.secondary'>Maksimal 10 file tercapai</Typography>
              </Box>
            )}

            <input id='self-submission-file-input' ref={fileInputRef} type='file' multiple
                   accept='.pdf,.docx,.xlsx,.jpg,.jpeg,.png,.webp' onChange={handlePickFile}
                   disabled={createLoading}
                   style={{ display: 'none' }} />
          </div>

          {createLoading && uploadProgress > 0 && (
            <Box>
              <Typography variant='caption' color='text.secondary'>
                Mengupload dokumen... {uploadProgress}%
              </Typography>
              <LinearProgress variant='determinate' value={uploadProgress} sx={{ mt: 0.5, borderRadius: 1 }} />
            </Box>
          )}
        </DialogContent>
        <Divider />
        <DialogActions className='p-4 gap-2'>
          <Button variant='tonal' color='secondary'
                  onClick={() => { setCreateOpen(false); resetCreate() }} disabled={createLoading}>
            Batal
          </Button>
          <Button variant='contained' onClick={handleCreate}
                  disabled={createLoading || !eventDate?.isValid() || pendingFiles.length === 0}
                  startIcon={createLoading ? <CircularProgress size={16} color='inherit' /> : <i className='ri-send-plane-line' />}>
            {createLoading ? 'Menyimpan...' : 'Kirim Pengajuan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Preview File Lokal (sebelum upload) */}
      <Dialog open={!!localPreview} onClose={closeLocalPreview} maxWidth='lg' fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ pb: 1 }}>
          <div className='flex items-center justify-between'>
            <Typography variant='subtitle1' noWrap sx={{ maxWidth: '80%' }}>
              {localPreview?.name}
            </Typography>
            <IconButton onClick={closeLocalPreview}><i className='ri-close-line' /></IconButton>
          </div>
        </DialogTitle>
        <DialogContent sx={{ p: 0, minHeight: 400 }}>
          {localPreview && (
            ['jpg','jpeg','png','webp'].includes(localPreview.type) ? (
              <Box className='flex justify-center p-4'>
                {/* eslint-disable-next-line @next/next/no-img-element -- blob URL lokal dari File object, tidak kompatibel dengan next/image */}
                <img
                  src={localPreview.url}
                  alt={localPreview.name}
                  style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
                />
              </Box>
            ) : (
              <iframe
                src={localPreview.url}
                title={localPreview.name}
                width='100%'
                height='700px'
                style={{ border: 'none' }}
              />
            )
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Lihat Dokumen */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)}
              maxWidth='sm' fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ pb: 1 }}>
          <div className='flex items-center justify-between'>
            <div>
              <Typography variant='h6'>Dokumen Bukti</Typography>
              <Typography variant='caption' color='text.secondary'>
                {detailSubmission?.indicator?.name} · {fmtDate(detailSubmission?.event_date)}
              </Typography>
            </div>
            <IconButton onClick={() => setDetailOpen(false)}><i className='ri-close-line' /></IconButton>
          </div>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <DocumentManager
            documents={detailSubmission?.documents || []}
            onGetPresignedURL={handlePresignDoc}
            canUpload={false}
            canDelete={false}
            emptyText='Tidak ada dokumen yang diupload.'
          />
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Cancel */}
      <Dialog open={!!cancelTarget} onClose={() => setCancelTarget(null)} maxWidth='xs' fullWidth>
        <DialogTitle>Batalkan Pengajuan?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Batalkan pengajuan <strong>{cancelTarget?.indicator?.name}</strong>?
            Semua dokumen yang sudah diupload akan ikut terhapus.
          </DialogContentText>
        </DialogContent>
        <DialogActions className='p-4 gap-2'>
          <Button variant='tonal' color='secondary' onClick={() => setCancelTarget(null)} disabled={cancelLoading}>
            Tidak
          </Button>
          <Button variant='contained' color='error' onClick={handleCancel} disabled={cancelLoading}
                  startIcon={cancelLoading ? <CircularProgress size={16} color='inherit' /> : null}>
            {cancelLoading ? 'Membatalkan...' : 'Ya, Batalkan'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={4000}
                onClose={() => setToast(t => ({ ...t, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity={toast.severity} variant='filled'
               onClose={() => setToast(t => ({ ...t, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>
    </LocalizationProvider>
  )
}

export default SelfSubmissionStudentView
