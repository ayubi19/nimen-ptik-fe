'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
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

// ── Submission History Card (Mobile) ─────────────────────────────────────────
const SubmissionCard = ({ submission, onDetail, onCancel }) => {
  const cfg = STATUS_CONFIG[submission.status] || { label: submission.status, color: 'default' }
  return (
    <Card variant='outlined' className='mb-3'>
      <CardContent sx={{ p: '12px !important' }}>
        <div className='flex items-start justify-between gap-2 mb-2'>
          <div className='flex-1 min-w-0'>
            <Typography variant='body2' fontWeight={600} noWrap>{submission.indicator?.name}</Typography>
            <Typography variant='caption' color='text.secondary'>
              {fmtDate(submission.event_date)}
            </Typography>
          </div>
          <Chip label={cfg.label} color={cfg.color} size='small' variant='tonal' sx={{ flexShrink: 0 }} />
        </div>
        {submission.status === 'REJECTED' && submission.rejection_reason && (
          <Alert severity='error' sx={{ py: 0.5, mb: 1, fontSize: 12 }}>
            {submission.rejection_reason}
          </Alert>
        )}
        <div className='flex items-center gap-2 mt-1'>
          <Chip label={`${submission.documents?.length || 0} dokumen`} size='small'
                color={submission.documents?.length > 0 ? 'info' : 'default'} variant='tonal' />
          {submission.documents?.length > 0 && (
            <Button size='small' variant='tonal' color='secondary'
                    startIcon={<i className='ri-folder-open-line' />}
                    onClick={() => onDetail(submission)}>
              Lihat
            </Button>
          )}
          {submission.status === 'PENDING' && (
            <Button size='small' variant='tonal' color='error'
                    startIcon={<i className='ri-close-circle-line' />}
                    onClick={() => onCancel(submission)}>
              Batal
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
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
      {/* Breadcrumb */}
      <div className='flex items-center gap-2 mb-6'>
        <Typography variant='caption' color='text.secondary'>NIMEN</Typography>
        <i className='ri-arrow-right-s-line text-sm opacity-50' />
        <Typography variant='caption' fontWeight={500} color='text.primary'>Pengajuan Nilai Mandiri</Typography>
      </div>

      {/* Stats */}
      <Grid container spacing={4} className='mb-6'>
        {[
          { label: 'Total Pengajuan',    value: submissions.length, icon: 'ri-file-list-3-line',     color: '#7367F0', bg: '#F3EDFF' },
          { label: 'Menunggu Review',    value: pendingCount,       icon: 'ri-time-line',             color: '#FF9F43', bg: '#FFF3E8' },
          { label: 'Nilai Masuk',        value: approvedCount,      icon: 'ri-checkbox-circle-line',  color: '#28C76F', bg: '#E6F9EE' },
          { label: 'Bisa Diajukan',      value: availableIndicators.length, icon: 'ri-hand-coin-line', color: '#00CFE8', bg: '#E0F9FC' },
        ].map(s => (
          <Grid item xs={6} sm={3} key={s.label}>
            <Card>
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
                              sx={{ display: 'block', fontSize: { xs: 10, sm: 12 }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.label}
                  </Typography>
                </div>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Indikator tersedia */}
      <Card className='mb-6'>
        <CardContent>
          <Typography variant='subtitle1' fontWeight={600} className='mb-1'>
            Indikator yang Bisa Diajukan
          </Typography>
          <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 2 }}>
            Ajukan nilai untuk kegiatan yang kamu lakukan di luar sprint
          </Typography>

          {indicators.length === 0 ? (
            <Box className='text-center py-6'>
              <i className='ri-inbox-line text-4xl opacity-30 block mb-2' />
              <Typography variant='body2' color='text.secondary'>
                Tidak ada indikator yang tersedia untuk pengajuan mandiri.
              </Typography>
            </Box>
          ) : (
            <div className='flex flex-col gap-3'>
              {/* Tersedia */}
              {availableIndicators.map(ind => (
                <div key={ind.indicator_id} style={{
                  border: '1px solid var(--mui-palette-divider)',
                  borderRadius: 8, padding: '12px 16px',
                  borderLeft: '3px solid #28C76F',
                }}>
                  <div className='flex items-center justify-between gap-3'>
                    <div className='flex-1 min-w-0'>
                      <Typography variant='body2' fontWeight={600} noWrap>{ind.indicator_name}</Typography>
                      <Typography variant='caption' color='text.secondary' noWrap sx={{ display: 'block' }}>
                        {ind.category_name} · {ind.variable_name}
                      </Typography>
                      <div className='flex items-center gap-1 mt-0.5'>
                        <i className='ri-refresh-line text-xs' style={{ color: 'var(--mui-palette-text-secondary)', flexShrink: 0 }} />
                        <Typography variant='caption' color='text.secondary' noWrap>
                          Cooldown {ind.cooldown_days} hari
                        </Typography>
                      </div>
                    </div>
                    <div className='flex items-center gap-2 flex-shrink-0'>
                      <Chip label={`+${ind.value}`} color='success' variant='tonal' size='small' sx={{ fontWeight: 700 }} />
                      <Button variant='contained' size='small'
                              onClick={() => { setSelectedIndicator(ind); setCreateOpen(true) }}>
                        Ajukan
                      </Button>
                    </div>
                  </div>
                  {ind.description && (
                    <Typography variant='caption' color='text.secondary'
                                sx={{ display: 'block', mt: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ind.description}
                    </Typography>
                  )}
                </div>
              ))}

              {/* Cooldown */}
              {cooldownIndicators.map(ind => (
                <div key={ind.indicator_id} style={{
                  border: '1px solid var(--mui-palette-divider)',
                  borderRadius: 8, padding: '12px 16px',
                  borderLeft: '3px solid #FF9F43',
                  opacity: 0.7,
                }}>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='flex-1 min-w-0'>
                      <Typography variant='body2' fontWeight={600}>{ind.indicator_name}</Typography>
                      <div className='flex items-center gap-1 mt-0.5'>
                        <i className='ri-time-line text-xs' style={{ color: '#FF9F43' }} />
                        <Typography variant='caption' sx={{ color: '#FF9F43' }}>
                          Cooldown aktif · bisa diajukan{' '}
                          {new Date(ind.cooldown_until).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                          {' '}({ind.days_until_allowed} hari lagi)
                        </Typography>
                      </div>
                    </div>
                    <Chip label={`+${ind.value}`} color='default' variant='tonal' sx={{ fontWeight: 700, flexShrink: 0 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Riwayat Pengajuan */}
      <Card>
        <CardContent sx={{ pb: 1 }}>
          <Typography variant='subtitle1' fontWeight={600}>Riwayat Pengajuan Saya</Typography>
        </CardContent>
        <Divider />
        {submissions.length === 0 ? (
          <Box className='flex flex-col items-center py-10 gap-2' sx={{ color: 'text.secondary' }}>
            <i className='ri-inbox-line text-5xl opacity-30' />
            <Typography variant='body2'>Belum ada pengajuan.</Typography>
          </Box>
        ) : isMobile ? (
          // Mobile — Card list
          <div className='p-3'>
            {submissions.map(s => (
              <SubmissionCard key={s.id} submission={s}
                              onDetail={sub => { setDetailSubmission(sub); setDetailOpen(true) }}
                              onCancel={setCancelTarget}
              />
            ))}
          </div>
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
      </Card>

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

            {pendingFiles.length === 0 ? (
              <Box onClick={() => !createLoading && fileInputRef.current?.click()} sx={{
                border: '2px dashed', borderColor: 'divider', borderRadius: 2, p: 3,
                textAlign: 'center', cursor: createLoading ? 'not-allowed' : 'pointer',
                transition: 'all .2s',
                '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
              }}>
                <i className='ri-upload-cloud-2-line text-4xl opacity-40 block mb-1' />
                <Typography variant='body2' color='text.secondary'>Klik untuk pilih file</Typography>
                <Typography variant='caption' color='text.secondary'>
                  PDF, DOCX, JPG, PNG, WEBP · maks {MAX_SIZE_MB}MB per file
                </Typography>
              </Box>
            ) : (
              <List dense disablePadding sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                {pendingFiles.map((f, idx) => (
                  <ListItem key={idx} divider={idx < pendingFiles.length - 1}
                            secondaryAction={
                              <IconButton edge='end' size='small' disabled={createLoading}
                                          onClick={() => setPendingFiles(prev => prev.filter((_, i) => i !== idx))}>
                                <i className='ri-close-line' />
                              </IconButton>
                            }>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <i className={`${fileIcon(f.name)} text-[18px]`} />
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography variant='body2' noWrap sx={{ maxWidth: 260 }}>{f.name}</Typography>}
                      secondary={`${(f.size / 1024 / 1024).toFixed(2)} MB`}
                    />
                  </ListItem>
                ))}
                {pendingFiles.length < 10 && (
                  <ListItem>
                    <Button size='small' startIcon={<i className='ri-add-line' />}
                            onClick={() => fileInputRef.current?.click()} disabled={createLoading}>
                      Tambah file
                    </Button>
                  </ListItem>
                )}
              </List>
            )}
            <input ref={fileInputRef} type='file' hidden multiple
                   accept='.pdf,.docx,.xlsx,.jpg,.jpeg,.png,.webp' onChange={handlePickFile} />
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
