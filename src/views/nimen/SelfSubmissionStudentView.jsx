'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dayjs from 'dayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import 'dayjs/locale/id'
import Grid from '@mui/material/Grid'
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
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import DialogContentText from '@mui/material/DialogContentText'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemIcon from '@mui/material/ListItemIcon'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import LinearProgress from '@mui/material/LinearProgress'
import { nimenSelfSubmissionApi } from '@/libs/api/nimenSelfSubmissionApi'

const STATUS_CONFIG = {
  PENDING:  { label: 'Menunggu Review', color: 'warning' },
  APPROVED: { label: 'Disetujui',       color: 'success' },
  REJECTED: { label: 'Ditolak',         color: 'error'   },
}

const ALLOWED_TYPES = ['pdf', 'docx', 'xlsx', 'jpg', 'jpeg', 'png', 'webp']
const MAX_SIZE_MB = 10

const fileIcon = (name) => {
  const ext = name.split('.').pop().toLowerCase()
  if (['jpg','jpeg','png','webp'].includes(ext)) return 'ri-image-line'
  if (ext === 'pdf') return 'ri-file-pdf-line'
  if (ext === 'docx') return 'ri-file-word-line'
  if (ext === 'xlsx') return 'ri-file-excel-line'
  return 'ri-file-line'
}

const SelfSubmissionStudentView = () => {
  const [indicators, setIndicators] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  // Dialog buat pengajuan — all-in-one
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedIndicator, setSelectedIndicator] = useState(null)
  const [eventDate, setEventDate] = useState(null)
  const [notes, setNotes] = useState('')
  const [pendingFiles, setPendingFiles] = useState([]) // file yang dipilih sebelum submit
  const [createLoading, setCreateLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0) // 0-100
  const fileInputRef = useRef(null)

  // Dialog lihat dokumen (untuk pengajuan yang sudah ada)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailSubmission, setDetailSubmission] = useState(null)

  // Dialog cancel
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelLoading, setCancelLoading] = useState(false)

  const showToast = useCallback((message, severity = 'success') => {
    setToast({ open: true, message, severity })
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [indicatorsRes, submissionsRes] = await Promise.all([
        nimenSelfSubmissionApi.getAvailableIndicators(),
        nimenSelfSubmissionApi.getMy({ page: 1, page_size: 50 }),
      ])
      setIndicators(indicatorsRes.data.data || [])
      setSubmissions(submissionsRes.data.data?.data || [])
    } catch (err) {
      showToast(err.message || 'Gagal memuat data', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { fetchData() }, [fetchData])

  // Reset dialog
  const resetCreateDialog = useCallback(() => {
    setEventDate(null)
    setNotes('')
    setPendingFiles([])
    setUploadProgress(0)
    setSelectedIndicator(null)
  }, [])

  // Pilih file dari input
  const handlePickFile = useCallback((e) => {
    const files = Array.from(e.target.files || [])
    const errors = []
    const valid = []

    files.forEach(f => {
      const ext = f.name.split('.').pop().toLowerCase()
      if (!ALLOWED_TYPES.includes(ext)) {
        errors.push(`${f.name}: tipe tidak diizinkan`)
        return
      }
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        errors.push(`${f.name}: ukuran melebihi ${MAX_SIZE_MB}MB`)
        return
      }
      if (pendingFiles.length + valid.length >= 10) {
        errors.push(`Maksimal 10 file`)
        return
      }
      valid.push(f)
    })

    if (errors.length > 0) showToast(errors.join(', '), 'error')
    if (valid.length > 0) setPendingFiles(prev => [...prev, ...valid])
    e.target.value = ''
  }, [pendingFiles, showToast])

  // Hapus file dari pending list
  const handleRemovePendingFile = useCallback((idx) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== idx))
  }, [])

  // Submit pengajuan + upload semua file
  const handleCreate = useCallback(async () => {
    if (!eventDate || !eventDate.isValid()) {
      showToast('Tanggal kejadian wajib diisi', 'error')
      return
    }
    if (pendingFiles.length === 0) {
      showToast('Upload minimal 1 dokumen bukti', 'error')
      return
    }

    setCreateLoading(true)
    setUploadProgress(0)

    try {
      // Step 1: Buat pengajuan
      const res = await nimenSelfSubmissionApi.create({
        indicator_id: selectedIndicator.indicator_id,
        event_date: eventDate.format('YYYY-MM-DD'),
        notes,
      })
      const submissionID = res.data.data.id

      // Step 2: Upload semua file satu per satu
      for (let i = 0; i < pendingFiles.length; i++) {
        await nimenSelfSubmissionApi.uploadDocument(submissionID, pendingFiles[i])
        setUploadProgress(Math.round(((i + 1) / pendingFiles.length) * 100))
      }

      showToast('Pengajuan berhasil dibuat dan dokumen berhasil diupload!')
      setCreateOpen(false)
      resetCreateDialog()
      fetchData()
    } catch (err) {
      showToast(err.message || 'Gagal membuat pengajuan', 'error')
    } finally {
      setCreateLoading(false)
    }
  }, [selectedIndicator, eventDate, notes, pendingFiles, fetchData, showToast, resetCreateDialog])

  // Cancel pengajuan
  const handleCancel = useCallback(async () => {
    setCancelLoading(true)
    try {
      await nimenSelfSubmissionApi.cancel(cancelTarget.id)
      showToast('Pengajuan berhasil dibatalkan')
      setCancelTarget(null)
      fetchData()
    } catch (err) {
      showToast(err.message || 'Gagal membatalkan', 'error')
    } finally {
      setCancelLoading(false)
    }
  }, [cancelTarget, fetchData, showToast])

  // Presign untuk dokumen yang sudah ada
  const handlePresignDoc = useCallback(async (docId) => {
    return nimenSelfSubmissionApi.getDocPresignedURL(detailSubmission.id, docId)
  }, [detailSubmission])

  if (loading) return <Box className='flex justify-center py-20'><CircularProgress /></Box>

  const availableIndicators = indicators.filter(i => i.can_submit)
  const cooldownIndicators = indicators.filter(i => !i.can_submit)

  return (
    <>
      <Grid container spacing={6}>

        {/* Indikator yang tersedia */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title='Pengajuan Nilai Mandiri'
              subheader='Ajukan nilai untuk kegiatan yang kamu lakukan di luar sprint'
            />
            <Divider />
            <CardContent>
              {indicators.length === 0 ? (
                <Typography variant='body2' color='text.secondary'>
                  Tidak ada indikator yang tersedia untuk pengajuan mandiri.
                </Typography>
              ) : (
                <div className='flex flex-col gap-3'>
                  {availableIndicators.map(ind => (
                    <div key={ind.indicator_id}
                         className='flex items-center justify-between p-3 border rounded-lg gap-4'>
                      <div>
                        <Typography variant='body2' fontWeight={600}>{ind.indicator_name}</Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {ind.variable_name} • {ind.category_name}
                        </Typography>
                        {ind.description && (
                          <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                            {ind.description}
                          </Typography>
                        )}
                        <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                          Cooldown: {ind.cooldown_days} hari antar pengajuan
                        </Typography>
                      </div>
                      <div className='flex items-center gap-2 shrink-0'>
                        <Chip
                          label={`+${ind.value}`}
                          color='success' variant='tonal'
                          sx={{ fontWeight: 700 }}
                        />
                        <Button variant='contained' size='small'
                                onClick={() => { setSelectedIndicator(ind); setCreateOpen(true) }}>
                          Ajukan
                        </Button>
                      </div>
                    </div>
                  ))}
                  {cooldownIndicators.map(ind => (
                    <div key={ind.indicator_id}
                         className='flex items-center justify-between p-3 border rounded-lg gap-4 opacity-60'>
                      <div>
                        <Typography variant='body2' fontWeight={600}>{ind.indicator_name}</Typography>
                        <Typography variant='caption' color='warning.main'>
                          <i className='ri-time-line mr-1' />
                          Cooldown aktif — bisa diajukan kembali:{' '}
                          {new Date(ind.cooldown_until).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                          {' '}({ind.days_until_allowed} hari lagi)
                        </Typography>
                      </div>
                      <Chip label={`+${ind.value}`} color='default' variant='tonal' sx={{ fontWeight: 700 }} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Riwayat pengajuan */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title='Riwayat Pengajuan Saya' />
            <Divider />
            {submissions.length === 0 ? (
              <Box className='flex flex-col items-center py-8 gap-2' sx={{ color: 'text.secondary' }}>
                <i className='ri-inbox-line text-4xl opacity-30' />
                <Typography variant='body2'>Belum ada pengajuan.</Typography>
              </Box>
            ) : (
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Indikator</TableCell>
                    <TableCell>Tanggal Kejadian</TableCell>
                    <TableCell>Dokumen</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align='center'>Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {submissions.map(s => {
                    const cfg = STATUS_CONFIG[s.status] || { label: s.status, color: 'default' }
                    return (
                      <TableRow key={s.id}>
                        <TableCell>
                          <Typography variant='body2' fontWeight={600}>{s.indicator?.name}</Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {s.indicator?.variable?.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>
                            {new Date(s.event_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={`${s.documents?.length || 0} file`} size='small'
                                color={s.documents?.length > 0 ? 'success' : 'warning'} variant='tonal' />
                        </TableCell>
                        <TableCell>
                          <Chip label={cfg.label} color={cfg.color} size='small' variant='tonal' />
                          {s.status === 'REJECTED' && s.rejection_reason && (
                            <Typography variant='caption' color='error.main' sx={{ display: 'block' }}>
                              {s.rejection_reason}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align='center'>
                          <div className='flex justify-center gap-1'>
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
        </Grid>
      </Grid>

      {/* Dialog Buat Pengajuan — All in One */}
      <Dialog open={createOpen}
              onClose={() => { if (!createLoading) { setCreateOpen(false); resetCreateDialog() } }}
              maxWidth='sm' fullWidth>
        <DialogTitle>Ajukan Nilai — {selectedIndicator?.indicator_name}</DialogTitle>
        <Divider />
        <DialogContent className='flex flex-col gap-4 pt-4'>
          <Alert severity='info'>
            Nilai <strong>+{selectedIndicator?.value}</strong> akan masuk setelah admin menyetujui.
            {selectedIndicator?.cooldown_days > 0 && (
              <> Cooldown <strong>{selectedIndicator.cooldown_days} hari</strong> antar pengajuan.</>
            )}
          </Alert>

          {/* Tanggal Kejadian */}
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale='id'>
            <DatePicker
              label='Tanggal Kejadian *'
              value={eventDate}
              onChange={val => setEventDate(val)}
              maxDate={dayjs()}
              format='DD/MM/YYYY'
              slotProps={{ textField: { fullWidth: true, required: true } }}
              disabled={createLoading}
            />
          </LocalizationProvider>

          {/* Catatan */}
          <TextField
            fullWidth multiline rows={2} label='Catatan (opsional)'
            placeholder='Ceritakan singkat kegiatan yang kamu lakukan'
            value={notes} onChange={e => setNotes(e.target.value)}
            disabled={createLoading}
          />

          {/* Upload Dokumen Bukti */}
          <div>
            <div className='flex items-center justify-between mb-2'>
              <Typography variant='subtitle2'>
                Dokumen Bukti <span style={{ color: 'red' }}>*</span>
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                {pendingFiles.length}/10 file
              </Typography>
            </div>

            {pendingFiles.length === 0 ? (
              <Box
                onClick={() => !createLoading && fileInputRef.current?.click()}
                sx={{
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  cursor: createLoading ? 'not-allowed' : 'pointer',
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                }}>
                <i className='ri-upload-cloud-2-line text-3xl opacity-40' />
                <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                  Klik untuk pilih file
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  PDF, DOCX, XLSX, JPG, PNG, WEBP — maks {MAX_SIZE_MB}MB per file
                </Typography>
              </Box>
            ) : (
              <List dense disablePadding sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
                {pendingFiles.map((f, idx) => (
                  <ListItem key={idx} divider={idx < pendingFiles.length - 1}
                            secondaryAction={
                              <IconButton edge='end' size='small' disabled={createLoading}
                                          onClick={() => handleRemovePendingFile(idx)}>
                                <i className='ri-close-line' />
                              </IconButton>
                            }>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <i className={`${fileIcon(f.name)} text-[18px]`} />
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography variant='body2' noWrap sx={{ maxWidth: 300 }}>{f.name}</Typography>}
                      secondary={`${(f.size / 1024 / 1024).toFixed(2)} MB`}
                    />
                  </ListItem>
                ))}
                {pendingFiles.length < 10 && (
                  <ListItem>
                    <Button size='small' startIcon={<i className='ri-add-line' />}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={createLoading}>
                      Tambah file
                    </Button>
                  </ListItem>
                )}
              </List>
            )}

            <input ref={fileInputRef} type='file' hidden multiple
                   accept='.pdf,.docx,.xlsx,.jpg,.jpeg,.png,.webp'
                   onChange={handlePickFile} />
          </div>

          {/* Progress upload */}
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
                  onClick={() => { setCreateOpen(false); resetCreateDialog() }}
                  disabled={createLoading}>
            Batal
          </Button>
          <Button variant='contained' onClick={handleCreate}
                  disabled={createLoading || !eventDate || !eventDate.isValid() || pendingFiles.length === 0}
                  startIcon={createLoading ? <CircularProgress size={16} color='inherit' /> : null}>
            {createLoading ? 'Menyimpan...' : 'Kirim Pengajuan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Lihat Dokumen (pengajuan sudah ada) */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>
          Dokumen Bukti
          <IconButton sx={{ position: 'absolute', right: 8, top: 8 }} onClick={() => setDetailOpen(false)}>
            <i className='ri-close-line' />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent>
          {detailSubmission?.documents?.length === 0 ? (
            <Typography variant='body2' color='text.secondary' className='text-center py-4'>
              Tidak ada dokumen.
            </Typography>
          ) : (
            <List dense disablePadding>
              {detailSubmission?.documents?.map(doc => (
                <ListItem key={doc.id} divider
                          secondaryAction={
                            <Tooltip title='Buka / Download'>
                              <IconButton size='small' onClick={async () => {
                                const res = await handlePresignDoc(doc.id)
                                window.open(res.data.data.url, '_blank')
                              }}>
                                <i className='ri-download-line' />
                              </IconButton>
                            </Tooltip>
                          }>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <i className={`${fileIcon(doc.file_name)} text-[18px]`} />
                  </ListItemIcon>
                  <ListItemText
                    primary={<Typography variant='body2' noWrap sx={{ maxWidth: 220 }}>{doc.file_name}</Typography>}
                    secondary={doc.file_type.toUpperCase()}
                  />
                </ListItem>
              ))}
            </List>
          )}
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
          <Button variant='tonal' color='secondary' onClick={() => setCancelTarget(null)} disabled={cancelLoading}>Tidak</Button>
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
    </>
  )
}

export default SelfSubmissionStudentView
