'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { nimenSprintApi } from '@/libs/api/nimenSprintApi'
import { nimenParticipantDocApi } from '@/libs/api/nimenDocumentApi'
import { getInitials } from '@/utils/getInitials'

const DECISION_OPTIONS = [
  { value: 'VALID',               label: 'Terima — Nilai Masuk',            color: 'success' },
  { value: 'DISPENSED',           label: 'Dispensasi — Nilai Masuk',        color: 'info'    },
  { value: 'REJECTED_NO_DOC',     label: 'Tolak — Dokumen Tidak Lengkap',   color: 'error'   },
  { value: 'REJECTED_PUNISHMENT', label: 'Tolak — Punishment Aktif',        color: 'error'   },
]

const NimenSprintApprovalView = ({ sprintId }) => {
  const router = useRouter()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  // Dialog manual approval
  const [manualOpen, setManualOpen] = useState(false)
  const [manualTarget, setManualTarget] = useState(null)
  const [manualDecision, setManualDecision] = useState('')
  const [manualReason, setManualReason] = useState('')
  const [manualLoading, setManualLoading] = useState(false)

  // Dialog lihat dokumen
  const [docOpen, setDocOpen] = useState(false)
  const [docTarget, setDocTarget] = useState(null)
  const [docs, setDocs] = useState([])
  const [docLoading, setDocLoading] = useState(false)

  const showToast = useCallback((message, severity = 'success') => {
    setToast({ open: true, message, severity })
  }, [])

  const fetchSummary = useCallback(async () => {
    setLoading(true)
    try {
      const res = await nimenSprintApi.getApprovalSummary(sprintId)
      setSummary(res.data.data)
    } catch (err) {
      showToast(err.message || 'Gagal memuat data', 'error')
    } finally {
      setLoading(false)
    }
  }, [sprintId, showToast])

  useEffect(() => { fetchSummary() }, [fetchSummary])

  // Bulk approve
  const handleBulkApprove = useCallback(async () => {
    setBulkLoading(true)
    try {
      const res = await nimenSprintApi.bulkApprove(sprintId)
      const { approved, needs_action } = res.data.data
      showToast(`${approved} peserta berhasil di-approve`)
      fetchSummary()
    } catch (err) {
      showToast(err.message || 'Gagal bulk approve', 'error')
    } finally {
      setBulkLoading(false)
    }
  }, [sprintId, fetchSummary, showToast])

  // Buka dialog manual
  const handleOpenManual = useCallback((item) => {
    setManualTarget(item)
    // Pre-select decision berdasarkan block reason
    if (!item.document_submitted) {
      setManualDecision('REJECTED_NO_DOC')
    } else if (item.has_active_punishment) {
      setManualDecision('REJECTED_PUNISHMENT')
    } else {
      setManualDecision('')
    }
    setManualReason('')
    setManualOpen(true)
  }, [])

  // Submit manual approval
  const handleManualSubmit = useCallback(async () => {
    if (!manualDecision) {
      showToast('Pilih keputusan terlebih dahulu', 'error')
      return
    }
    if ((manualDecision === 'DISPENSED' || manualDecision.startsWith('REJECTED')) && !manualReason) {
      showToast('Alasan wajib diisi', 'error')
      return
    }
    setManualLoading(true)
    try {
      await nimenSprintApi.approveParticipant(sprintId, {
        participant_id: manualTarget.participant_id,
        decision: manualDecision,
        reason: manualReason,
      })
      showToast('Peserta berhasil diproses')
      setManualOpen(false)
      fetchSummary()
    } catch (err) {
      showToast(err.message || 'Gagal memproses peserta', 'error')
    } finally {
      setManualLoading(false)
    }
  }, [sprintId, manualTarget, manualDecision, manualReason, fetchSummary, showToast])

  // Lihat dokumen peserta
  const handleViewDocs = useCallback(async (item) => {
    setDocTarget(item)
    setDocLoading(true)
    setDocOpen(true)
    try {
      const res = await nimenParticipantDocApi.getParticipantDocuments(sprintId, item.student_id)
      setDocs(res.data.data?.documents || [])
    } catch {
      setDocs([])
    } finally {
      setDocLoading(false)
    }
  }, [sprintId])

  const handleOpenDoc = useCallback(async (doc) => {
    try {
      const res = await nimenParticipantDocApi.getPresignedURL
        ? nimenParticipantDocApi.getParticipantDocPresignedURL(sprintId, docTarget?.student_id, doc.id)
        : null
      if (res) window.open(res.data.data.url, '_blank')
    } catch {}
  }, [sprintId, docTarget])

  if (loading) return <Box className='flex justify-center py-20'><CircularProgress /></Box>
  if (!summary) return null

  const totalPending = (summary.auto_approve?.length || 0) + (summary.needs_action?.length || 0)
  const allProcessed = totalPending === 0

  return (
    <>
      <Grid container spacing={6}>

        {/* Header */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <div className='flex items-start justify-between gap-4 flex-wrap'>
                <div>
                  <Typography variant='h5' className='mb-1'>Approval Sprint</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {summary.sprint_number} — {summary.title}
                  </Typography>
                  <div className='flex items-center gap-2 mt-2'>
                    <Chip
                      label={summary.indicator_value >= 0 ? `+${summary.indicator_value}` : `${summary.indicator_value}`}
                      color={summary.is_positive ? 'success' : 'error'}
                      sx={{ fontWeight: 700 }}
                    />
                    <Typography variant='caption' color='text.secondary'>
                      {totalPending} peserta menunggu • {summary.auto_approve?.length || 0} bisa langsung diapprove
                    </Typography>
                  </div>
                </div>
                <div className='flex gap-2'>
                  <Button variant='tonal' color='secondary' size='small'
                    startIcon={<i className='ri-arrow-left-line' />}
                    onClick={() => router.push(`/nimen/sprints/${sprintId}`)}>
                    Kembali
                  </Button>
                  {!allProcessed && summary.auto_approve?.length > 0 && (
                    <Button variant='contained' color='success'
                      startIcon={bulkLoading ? <CircularProgress size={16} color='inherit' /> : <i className='ri-check-double-line' />}
                      onClick={handleBulkApprove}
                      disabled={bulkLoading}>
                      {bulkLoading ? 'Memproses...' : `Bulk Approve ${summary.auto_approve.length} Peserta`}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>

        {allProcessed && (
          <Grid item xs={12}>
            <Alert severity='success' icon={<i className='ri-checkbox-circle-line' />}>
              Semua peserta sudah diproses. Sprint akan otomatis ditutup.
            </Alert>
          </Grid>
        )}

        {/* Auto Approve */}
        {summary.auto_approve?.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardHeader
                title={
                  <div className='flex items-center gap-2'>
                    <span>Siap Diapprove</span>
                    <Chip label={summary.auto_approve.length} color='success' size='small' />
                  </div>
                }
                subheader='Dokumen lengkap, tidak sedang punishment — bisa langsung bulk approve'
              />
              <Divider />
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Peserta</TableCell>
                    <TableCell>NIM</TableCell>
                    <TableCell align='center'>Dokumen</TableCell>
                    <TableCell align='center'>Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summary.auto_approve.map(item => (
                    <TableRow key={item.participant_id}>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <Avatar sx={{ width: 30, height: 30, fontSize: 11 }}>
                            {getInitials(item.student_name)}
                          </Avatar>
                          <Typography variant='body2' fontWeight={600}>{item.student_name}</Typography>
                        </div>
                      </TableCell>
                      <TableCell><Typography variant='body2'>{item.nim}</Typography></TableCell>
                      <TableCell align='center'>
                        <Chip label={`${item.document_count} file`} size='small' color='success' variant='tonal' />
                      </TableCell>
                      <TableCell align='center'>
                        <div className='flex justify-center gap-1'>
                          <Tooltip title='Lihat dokumen'>
                            <IconButton size='small' onClick={() => handleViewDocs(item)}>
                              <i className='ri-folder-open-line text-[18px]' />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title='Proses manual'>
                            <IconButton size='small' onClick={() => handleOpenManual(item)}>
                              <i className='ri-settings-3-line text-[18px]' />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </Grid>
        )}

        {/* Needs Action */}
        {summary.needs_action?.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardHeader
                title={
                  <div className='flex items-center gap-2'>
                    <span>Butuh Keputusan Manual</span>
                    <Chip label={summary.needs_action.length} color='warning' size='small' />
                  </div>
                }
                subheader='Dokumen tidak ada atau sedang dalam masa hukuman — admin harus memutuskan'
              />
              <Divider />
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Peserta</TableCell>
                    <TableCell>NIM</TableCell>
                    <TableCell>Kendala</TableCell>
                    <TableCell align='center'>Dokumen</TableCell>
                    <TableCell align='center'>Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summary.needs_action.map(item => (
                    <TableRow key={item.participant_id}>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <Avatar sx={{ width: 30, height: 30, fontSize: 11 }}>
                            {getInitials(item.student_name)}
                          </Avatar>
                          <Typography variant='body2' fontWeight={600}>{item.student_name}</Typography>
                        </div>
                      </TableCell>
                      <TableCell><Typography variant='body2'>{item.nim}</Typography></TableCell>
                      <TableCell>
                        <Typography variant='caption' color='error.main'>
                          <i className='ri-error-warning-line mr-1' />
                          {item.block_reason}
                        </Typography>
                        {item.has_active_punishment && (
                          <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                            Punishment s/d {new Date(item.punishment_end_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align='center'>
                        <Chip
                          label={`${item.document_count} file`}
                          size='small'
                          color={item.document_submitted ? 'success' : 'error'}
                          variant='tonal'
                        />
                      </TableCell>
                      <TableCell align='center'>
                        <div className='flex justify-center gap-1'>
                          {item.document_count > 0 && (
                            <Tooltip title='Lihat dokumen'>
                              <IconButton size='small' onClick={() => handleViewDocs(item)}>
                                <i className='ri-folder-open-line text-[18px]' />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title='Beri keputusan'>
                            <IconButton size='small' color='warning' onClick={() => handleOpenManual(item)}>
                              <i className='ri-edit-box-line text-[18px]' />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Dialog Manual Approval */}
      <Dialog open={manualOpen} onClose={() => setManualOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>
          Keputusan Manual — {manualTarget?.student_name}
        </DialogTitle>
        <Divider />
        <DialogContent className='flex flex-col gap-4 pt-4'>
          {manualTarget?.has_active_punishment && (
            <Alert severity='warning'>
              Mahasiswa sedang dalam masa hukuman sampai <strong>{manualTarget.punishment_end_date && new Date(manualTarget.punishment_end_date).toLocaleDateString('id-ID')}</strong>.
              Pilih <em>Dispensasi</em> jika ingin tetap memberikan nilai.
            </Alert>
          )}
          {!manualTarget?.document_submitted && (
            <Alert severity='error'>
              Mahasiswa tidak mengumpulkan dokumen.
            </Alert>
          )}
          <FormControl fullWidth>
            <InputLabel>Keputusan</InputLabel>
            <Select
              label='Keputusan'
              value={manualDecision}
              onChange={e => setManualDecision(e.target.value)}
            >
              {DECISION_OPTIONS.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>
                  <Chip label={opt.label} color={opt.color} size='small' variant='tonal' sx={{ pointerEvents: 'none' }} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            rows={3}
            label={manualDecision === 'DISPENSED' ? 'Alasan dispensasi (wajib)' :
                   manualDecision?.startsWith('REJECTED') ? 'Alasan penolakan (wajib)' :
                   'Catatan (opsional)'}
            value={manualReason}
            onChange={e => setManualReason(e.target.value)}
          />
        </DialogContent>
        <Divider />
        <DialogActions className='p-4 gap-2'>
          <Button variant='tonal' color='secondary' onClick={() => setManualOpen(false)} disabled={manualLoading}>
            Batal
          </Button>
          <Button
            variant='contained'
            color={manualDecision === 'VALID' || manualDecision === 'DISPENSED' ? 'success' : 'error'}
            onClick={handleManualSubmit}
            disabled={manualLoading || !manualDecision}
            startIcon={manualLoading ? <CircularProgress size={16} color='inherit' /> : null}
          >
            {manualLoading ? 'Menyimpan...' : 'Konfirmasi'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Lihat Dokumen */}
      <Dialog open={docOpen} onClose={() => setDocOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>
          Dokumen — {docTarget?.student_name}
          <IconButton sx={{ position: 'absolute', right: 8, top: 8 }} onClick={() => setDocOpen(false)}>
            <i className='ri-close-line' />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent>
          {docLoading ? (
            <Box className='flex justify-center py-4'><CircularProgress size={24} /></Box>
          ) : docs.length === 0 ? (
            <Typography variant='body2' color='text.secondary' className='text-center py-4'>
              Tidak ada dokumen
            </Typography>
          ) : (
            <div className='flex flex-col gap-2'>
              {docs.map(doc => (
                <div key={doc.id} className='flex items-center justify-between p-2 border rounded'>
                  <div>
                    <Typography variant='body2' noWrap sx={{ maxWidth: 200 }}>{doc.file_name}</Typography>
                    <Typography variant='caption' color='text.secondary'>{doc.file_type.toUpperCase()}</Typography>
                  </div>
                  <Tooltip title='Download / Buka'>
                    <IconButton size='small' onClick={() => handleOpenDoc(doc)}>
                      <i className='ri-download-line' />
                    </IconButton>
                  </Tooltip>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
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

export default NimenSprintApprovalView
