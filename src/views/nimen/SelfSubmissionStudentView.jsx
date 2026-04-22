'use client'

import { useCallback, useEffect, useState } from 'react'
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
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { nimenSelfSubmissionApi } from '@/libs/api/nimenSelfSubmissionApi'
import DocumentManager from '@/components/nimen/DocumentManager'

const STATUS_CONFIG = {
  PENDING:  { label: 'Menunggu Review', color: 'warning' },
  APPROVED: { label: 'Disetujui',       color: 'success' },
  REJECTED: { label: 'Ditolak',         color: 'error'   },
}

const SelfSubmissionStudentView = () => {
  const [indicators, setIndicators] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  // Dialog buat pengajuan baru
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedIndicator, setSelectedIndicator] = useState(null)
  const [eventDate, setEventDate] = useState('')
  const [notes, setNotes] = useState('')
  const [createLoading, setCreateLoading] = useState(false)

  // Dialog detail (upload dokumen)
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

  // Buat pengajuan
  const handleCreate = useCallback(async () => {
    if (!eventDate) { showToast('Tanggal kejadian wajib diisi', 'error'); return }
    setCreateLoading(true)
    try {
      const res = await nimenSelfSubmissionApi.create({
        indicator_id: selectedIndicator.indicator_id,
        event_date: eventDate,
        notes,
      })
      showToast('Pengajuan berhasil dibuat. Silakan upload dokumen bukti.')
      setCreateOpen(false)
      setEventDate('')
      setNotes('')
      // Buka detail untuk upload dokumen
      setDetailSubmission(res.data.data)
      setDetailOpen(true)
      fetchData()
    } catch (err) {
      showToast(err.message || 'Gagal membuat pengajuan', 'error')
    } finally {
      setCreateLoading(false)
    }
  }, [selectedIndicator, eventDate, notes, fetchData, showToast])

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

  // Upload dokumen
  const handleUploadDoc = useCallback(async (file) => {
    await nimenSelfSubmissionApi.uploadDocument(detailSubmission.id, file)
    showToast('Dokumen berhasil diupload')
    // Refresh detail
    const res = await nimenSelfSubmissionApi.getById(detailSubmission.id)
    setDetailSubmission(res.data.data)
    fetchData()
  }, [detailSubmission, fetchData, showToast])

  const handleDeleteDoc = useCallback(async (docId) => {
    await nimenSelfSubmissionApi.deleteDocument(detailSubmission.id, docId)
    showToast('Dokumen berhasil dihapus')
    const res = await nimenSelfSubmissionApi.getById(detailSubmission.id)
    setDetailSubmission(res.data.data)
    fetchData()
  }, [detailSubmission, fetchData, showToast])

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
                          color='success'
                          variant='tonal'
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
                            {s.status === 'PENDING' && (
                              <>
                                <Tooltip title='Upload / lihat dokumen'>
                                  <IconButton size='small' onClick={() => { setDetailSubmission(s); setDetailOpen(true) }}>
                                    <i className='ri-folder-open-line text-[18px]' />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title='Batalkan pengajuan'>
                                  <IconButton size='small' color='error' onClick={() => setCancelTarget(s)}>
                                    <i className='ri-close-circle-line text-[18px]' />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                            {s.status !== 'PENDING' && s.documents?.length > 0 && (
                              <Tooltip title='Lihat dokumen'>
                                <IconButton size='small' onClick={() => { setDetailSubmission(s); setDetailOpen(true) }}>
                                  <i className='ri-folder-open-line text-[18px]' />
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

      {/* Dialog Buat Pengajuan */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Ajukan Nilai — {selectedIndicator?.indicator_name}</DialogTitle>
        <Divider />
        <DialogContent className='flex flex-col gap-4 pt-4'>
          <Alert severity='info'>
            Nilai <strong>+{selectedIndicator?.value}</strong> akan masuk setelah admin menyetujui pengajuan ini.
            {selectedIndicator?.cooldown_days > 0 && (
              <> Indikator ini memiliki cooldown <strong>{selectedIndicator.cooldown_days} hari</strong> antar pengajuan.</>
            )}
          </Alert>
          <TextField
            fullWidth required type='date' label='Tanggal Kejadian'
            value={eventDate} onChange={e => setEventDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ max: new Date().toISOString().split('T')[0] }}
          />
          <TextField
            fullWidth multiline rows={3} label='Catatan (opsional)'
            placeholder='Ceritakan singkat kegiatan yang kamu lakukan'
            value={notes} onChange={e => setNotes(e.target.value)}
          />
        </DialogContent>
        <Divider />
        <DialogActions className='p-4 gap-2'>
          <Button variant='tonal' color='secondary' onClick={() => setCreateOpen(false)} disabled={createLoading}>Batal</Button>
          <Button variant='contained' onClick={handleCreate} disabled={createLoading || !eventDate}
            startIcon={createLoading ? <CircularProgress size={16} color='inherit' /> : null}>
            {createLoading ? 'Menyimpan...' : 'Buat Pengajuan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Detail & Upload Dokumen */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>
          Dokumen Pengajuan
          <IconButton sx={{ position: 'absolute', right: 8, top: 8 }} onClick={() => setDetailOpen(false)}>
            <i className='ri-close-line' />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent className='pt-4'>
          {detailSubmission && (
            <DocumentManager
              documents={detailSubmission.documents || []}
              onUpload={detailSubmission.status === 'PENDING' ? handleUploadDoc : undefined}
              onDelete={detailSubmission.status === 'PENDING' ? handleDeleteDoc : undefined}
              onGetPresignedURL={handlePresignDoc}
              canUpload={detailSubmission.status === 'PENDING'}
              canDelete={detailSubmission.status === 'PENDING'}
              uploadHint='Upload bukti kegiatan (foto, sertifikat, dll)'
              emptyText='Belum ada dokumen. Upload bukti kegiatan kamu.'
            />
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
