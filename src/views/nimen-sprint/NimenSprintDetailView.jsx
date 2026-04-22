'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
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
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Checkbox from '@mui/material/Checkbox'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import LinearProgress from '@mui/material/LinearProgress'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import { nimenSprintApi } from '@/libs/api/nimenSprintApi'
import { nimenAttachmentApi, nimenParticipantDocApi } from '@/libs/api/nimenDocumentApi'
import DocumentManager from '@/components/nimen/DocumentManager'
import { getInitials } from '@/utils/getInitials'

const STATUS_CONFIG = {
  DRAFT_ADMIN:             { label: 'Draft Admin',          color: 'secondary', step: 0 },
  DRAFT_PEJABAT:     { label: 'Menunggu Koordinator', color: 'warning',   step: 1 },
  REVIEW_SUBMITTED:   { label: 'Revisi Masuk',         color: 'info',      step: 2 },
  ACTIVE:                  { label: 'Aktif',                color: 'success',   step: 3 },
  APPROVAL_PENDING:        { label: 'Approval Pending',     color: 'warning',   step: 3 },
  CLOSED:                  { label: 'Selesai',              color: 'secondary', step: 4 },
}

const APPROVAL_CONFIG = {
  PENDING:             { label: 'Menunggu',         color: 'warning'   },
  VALID:               { label: 'Valid',            color: 'success'   },
  DISPENSED:           { label: 'Dispensasi',       color: 'info'      },
  REJECTED_NO_DOC:     { label: 'Tidak Ada Dokumen',color: 'error'     },
  REJECTED_PUNISHMENT: { label: 'Punishment',       color: 'error'     },
}

const SPRINT_STEPS = ['Draft Admin', 'Koordinator Review', 'Revisi Masuk', 'Aktif', 'Selesai']

const decodeJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
  } catch { return {} }
}

const NimenSprintDetailView = ({ sprintId }) => {
  const router = useRouter()
  const { data: session } = useSession()
  const [sprint, setSprint] = useState(null)
  const [participants, setParticipants] = useState([])
  const [attachments, setAttachments] = useState([])
  const [loading, setLoading] = useState(true)

  // Generator state
  const [generatorOpen, setGeneratorOpen] = useState(false)
  const [generatorLoading, setGeneratorLoading] = useState(false)
  const [generatorResult, setGeneratorResult] = useState(null)
  const [selectedStudents, setSelectedStudents] = useState([])
  const [addingLoading, setAddingLoading] = useState(false)
  const [removeLoading, setRemoveLoading] = useState(null)

  // Send to coordinator state
  const [sendOpen, setSendOpen] = useState(false)
  const [coordinators, setCoordinators] = useState([])
  const [selectedCoordinatorID, setSelectedCoordinatorID] = useState('')
  const [sendNote, setSendNote] = useState('')
  const [sendLoading, setSendLoading] = useState(false)

  // Finalize state
  const [finalizeOpen, setFinalizeOpen] = useState(false)
  const [finalizeVersion, setFinalizeVersion] = useState('DRAFT_ORIGINAL')
  const [finalizeLoading, setFinalizeLoading] = useState(false)
  const [finalizeDiff, setFinalizeDiff] = useState(null)
  const [finalizeDiffLoading, setFinalizeDiffLoading] = useState(false)

  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const showToast = useCallback((msg, severity = 'success') => {
    setToast({ open: true, message: msg, severity })
  }, [])

  // Role checks
  const jwtPayload = session?.user?.accessToken ? decodeJwt(session.user.accessToken) : {}
  const isDeveloper = jwtPayload?.is_developer === true
  const roleNames = session?.user?.roles || []
  const isAdminNimen = roleNames.includes('admin_nimen')
  const isAdmin = isDeveloper || isAdminNimen
  const currentUserID = session?.user?.id

  const fetchSprint = useCallback(async () => {
    try {
      const [sprintRes, participantRes, attachRes] = await Promise.all([
        nimenSprintApi.getById(sprintId),
        nimenSprintApi.getParticipants(sprintId),
        nimenAttachmentApi.getAll(sprintId),
      ])
      setSprint(sprintRes.data.data)
      setParticipants(participantRes.data.data || [])
      setAttachments(attachRes.data.data || [])
    } catch (err) {
      showToast(err.message || 'Gagal memuat data', 'error')
    } finally {
      setLoading(false)
    }
  }, [sprintId, showToast])

  useEffect(() => { fetchSprint() }, [fetchSprint])

  // ── Generator ──
  const handleGenerate = useCallback(async () => {
    if (!sprint) return
    setGeneratorLoading(true)
    try {
      const res = await nimenSprintApi.generateParticipants(sprintId, {
        batch_id: sprint.batch_id,
        quota: sprint.participant_quota,
      })
      setGeneratorResult(res.data.data)
      setSelectedStudents(res.data.data.suggested.map(s => s.student_id))
      setGeneratorOpen(true)
    } catch (err) {
      showToast(err.message || 'Gagal menjalankan generator', 'error')
    } finally {
      setGeneratorLoading(false)
    }
  }, [sprint, sprintId, showToast])

  const handleAddFromGenerator = useCallback(async () => {
    setAddingLoading(true)
    try {
      await nimenSprintApi.addParticipants(sprintId, { student_ids: selectedStudents })
      showToast(`${selectedStudents.length} peserta berhasil ditambahkan`)
      setGeneratorOpen(false)
      fetchSprint()
    } catch (err) {
      showToast(err.message || 'Gagal menambahkan peserta', 'error')
    } finally {
      setAddingLoading(false)
    }
  }, [sprintId, selectedStudents, fetchSprint, showToast])

  const handleRemoveParticipant = useCallback(async (studentId) => {
    setRemoveLoading(studentId)
    try {
      await nimenSprintApi.removeParticipant(sprintId, { student_id: studentId })
      showToast('Peserta berhasil dihapus')
      fetchSprint()
    } catch (err) {
      showToast(err.message || 'Gagal menghapus peserta', 'error')
    } finally {
      setRemoveLoading(null)
    }
  }, [sprintId, fetchSprint, showToast])

  // ── Send to Coordinator ──
  const handleOpenSend = useCallback(async () => {
    try {
      const res = await nimenSprintApi.getCoordinators(sprintId)
      setCoordinators(res.data.data || [])
      setSendOpen(true)
    } catch (err) {
      showToast(err.message || 'Gagal memuat data koordinator', 'error')
    }
  }, [sprintId, showToast])

  const handleSendToCoordinator = useCallback(async () => {
    if (!selectedCoordinatorID) {
      showToast('Pilih koordinator terlebih dahulu', 'error')
      return
    }
    setSendLoading(true)
    try {
      await nimenSprintApi.sendToCoordinator(sprintId, {
        coordinator_id: parseInt(selectedCoordinatorID),
        note: sendNote,
      })
      showToast('Sprint berhasil dikirim ke koordinator')
      setSendOpen(false)
      setSendNote('')
      setSelectedCoordinatorID('')
      fetchSprint()
    } catch (err) {
      showToast(err.message || 'Gagal mengirim ke koordinator', 'error')
    } finally {
      setSendLoading(false)
    }
  }, [sprintId, selectedCoordinatorID, sendNote, fetchSprint, showToast])

  // ── Finalize ──
  const handleOpenFinalize = useCallback(async () => {
    setFinalizeOpen(true)
    setFinalizeDiff(null)
    setFinalizeDiffLoading(true)
    try {
      const res = await nimenSprintApi.getFinalizeDiff(sprintId)
      setFinalizeDiff(res.data.data)
    } catch (err) {
      showToast(err.message || 'Gagal memuat diff peserta', 'error')
    } finally {
      setFinalizeDiffLoading(false)
    }
  }, [sprintId, showToast])

  const handleFinalize = useCallback(async () => {
    setFinalizeLoading(true)
    try {
      await nimenSprintApi.finalize(sprintId, { use_version: finalizeVersion })
      showToast('Sprint berhasil difinalisasi dan sekarang AKTIF')
      setFinalizeOpen(false)
      fetchSprint()
    } catch (err) {
      showToast(err.message || 'Gagal finalisasi sprint', 'error')
    } finally {
      setFinalizeLoading(false)
    }
  }, [sprintId, finalizeVersion, fetchSprint, showToast])

  if (loading) return <div className='flex justify-center py-20'><CircularProgress /></div>
  if (!sprint) return null

  const statusCfg = STATUS_CONFIG[sprint.status] || { label: sprint.status, color: 'default', step: 0 }
  const isEditable = sprint.status === 'DRAFT_ADMIN'
  const isDraftPejabat = sprint.status === 'DRAFT_PEJABAT'
  const isReviewSubmitted = sprint.status === 'REVIEW_SUBMITTED'
  const isCoordinator = sprint.coordinator_id && parseInt(currentUserID) === sprint.coordinator_id
  const quotaUsed = participants.length
  const quotaPercent = Math.min((quotaUsed / sprint.participant_quota) * 100, 100)

  return (
    <>
      <Grid container spacing={6}>

        {/* Stepper Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Stepper activeStep={statusCfg.step} alternativeLabel>
                {SPRINT_STEPS.map(label => (
                  <Step key={label}><StepLabel>{label}</StepLabel></Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>
        </Grid>

        {/* Header Info */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <div className='flex flex-wrap items-start justify-between gap-4'>
                <div>
                  <div className='flex items-center gap-3 mb-2'>
                    <Typography variant='h5'>{sprint.title}</Typography>
                    <Chip label={statusCfg.label} color={statusCfg.color} size='small' variant='tonal' />
                  </div>
                  <Typography variant='body2' color='text.secondary' className='mb-1'>
                    <i className='ri-file-list-3-line mr-1' />{sprint.sprint_number}
                    {sprint.location && <><i className='ri-map-pin-line ml-3 mr-1' />{sprint.location}</>}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    <i className='ri-calendar-line mr-1' />
                    {new Date(sprint.event_date).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                  </Typography>
                  {sprint.coordinator && (
                    <Typography variant='body2' color='text.secondary' className='mt-1'>
                      <i className='ri-user-star-line mr-1' />
                      Koordinator: <strong>{sprint.coordinator.full_name}</strong>
                    </Typography>
                  )}
                </div>
                <div className='flex flex-wrap gap-2'>
                  {/* Tombol berdasarkan status & role */}
                  {isEditable && isAdmin && (
                    <>
                      <Button variant='tonal' startIcon={<i className='ri-edit-line' />}
                        onClick={() => router.push(`/nimen/sprints/${sprintId}/edit`)}>
                        Edit
                      </Button>
                      <Button variant='contained' color='warning'
                        startIcon={<i className='ri-send-plane-line' />}
                        onClick={handleOpenSend}
                        disabled={quotaUsed === 0}>
                        Kirim ke Koordinator
                      </Button>
                    </>
                  )}
                  {isReviewSubmitted && isAdmin && (
                    <Button variant='contained' color='success'
                      startIcon={<i className='ri-check-double-line' />}
                      onClick={handleOpenFinalize}>
                      Finalisasi Sprint
                    </Button>
                  )}
                  {sprint.status === 'ACTIVE' && isAdmin && (
                    <Button variant='contained' color='warning'
                      startIcon={<i className='ri-shield-check-line' />}
                      onClick={() => router.push(`/nimen/sprints/${sprintId}/approval`)}>
                      Approval Nilai
                    </Button>
                  )}
                  {isDraftPejabat && isCoordinator && (
                    <Button variant='contained' color='info'
                      startIcon={<i className='ri-edit-box-line' />}
                      onClick={() => router.push(`/nimen/sprints/${sprintId}/coordinator-review`)}>
                      Review Peserta
                    </Button>
                  )}
                  <Button variant='tonal' color='secondary' startIcon={<i className='ri-arrow-left-line' />}
                    onClick={() => router.push('/nimen/sprints')}>
                    Kembali
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>

        {/* Catatan koordinator (jika ada) */}
        {sprint.coordinator_note && (
          <Grid item xs={12}>
            <Alert severity='info' icon={<i className='ri-chat-quote-line' />}>
              <strong>Catatan Koordinator:</strong> {sprint.coordinator_note}
            </Alert>
          </Grid>
        )}

        {/* Indikator & Deadline */}
        <Grid item xs={12} md={4}>
          <Card className='h-full'>
            <CardHeader title='Indikator Nilai' />
            <Divider />
            <CardContent>
              {sprint.indicator && (
                <div className='flex flex-col gap-2'>
                  <Chip
                    label={sprint.indicator.value >= 0 ? `+${sprint.indicator.value}` : `${sprint.indicator.value}`}
                    color={sprint.indicator.value >= 0 ? 'success' : 'error'}
                    sx={{ fontWeight: 700, fontSize: 18, height: 40, width: 'fit-content' }}
                  />
                  <Typography variant='body1' fontWeight={600}>{sprint.indicator.name}</Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {sprint.indicator.variable?.name} • {sprint.indicator.variable?.category?.name}
                  </Typography>
                </div>
              )}
              <Divider className='my-4' />
              <Typography variant='subtitle2' color='text.secondary' className='mb-1'>Batas Pengumpulan Dokumen</Typography>
              <Typography variant='body1' fontWeight={600}>
                {new Date(sprint.submission_deadline).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Dokumen Penunjang Sprint */}
        <Grid item xs={12} md={8}>
          <Card className='h-full'>
            <CardHeader
              title='Dokumen Penunjang Sprint'
              subheader='Dokumen referensi yang dilampirkan untuk peserta dan koordinator'
              action={
                isAdmin && (
                  <Typography variant='caption' color='text.secondary' sx={{ pr: 1 }}>
                    {attachments.length}/10 file
                  </Typography>
                )
              }
            />
            <Divider />
            <CardContent>
              <DocumentManager
                documents={attachments}
                onUpload={isAdmin ? async (file) => {
                  await nimenAttachmentApi.upload(sprintId, file)
                  fetchSprint()
                } : undefined}
                onDelete={isAdmin ? async (id) => {
                  await nimenAttachmentApi.delete(sprintId, id)
                  fetchSprint()
                } : undefined}
                onGetPresignedURL={async (id) => nimenAttachmentApi.getPresignedURL(sprintId, id)}
                canUpload={isAdmin}
                canDelete={isAdmin}
                emptyText='Belum ada dokumen penunjang yang dilampirkan.'
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Daftar Peserta */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader
              title={
                <div className='flex items-center gap-3'>
                  <span>Daftar Peserta</span>
                  <Chip label={`${quotaUsed} / ${sprint.participant_quota}`} size='small'
                    color={quotaUsed >= sprint.participant_quota ? 'success' : 'warning'} variant='tonal' />
                </div>
              }
              action={
                isEditable && isAdmin && quotaUsed < sprint.participant_quota && (
                  <Button variant='contained' size='small'
                    startIcon={generatorLoading ? <CircularProgress size={14} color='inherit' /> : <i className='ri-magic-line' />}
                    onClick={handleGenerate} disabled={generatorLoading}>
                    Generator Peserta
                  </Button>
                )
              }
            />
            <Box sx={{ px: 2, pb: 1 }}>
              <LinearProgress variant='determinate' value={quotaPercent}
                color={quotaUsed >= sprint.participant_quota ? 'success' : 'warning'}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
            <Divider />
            {participants.length === 0 ? (
              <Box className='flex flex-col items-center justify-center py-10 gap-2' sx={{ color: 'text.secondary' }}>
                <i className='ri-group-line text-5xl opacity-30' />
                <Typography variant='body2'>Belum ada peserta.</Typography>
              </Box>
            ) : (
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Peserta</TableCell>
                    <TableCell>NIM</TableCell>
                    <TableCell>Sindikat</TableCell>
                    <TableCell>Status</TableCell>
                    {isEditable && isAdmin && <TableCell align='center'>Aksi</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {participants.map(p => {
                    const student = p.student
                    const profile = student?.student_profile
                    const approvalCfg = APPROVAL_CONFIG[p.approval_status] || { label: p.approval_status, color: 'default' }
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <Avatar sx={{ width: 32, height: 32, fontSize: 12 }}>
                              {getInitials(student?.full_name || '')}
                            </Avatar>
                            <Typography variant='body2' fontWeight={600}>{student?.full_name}</Typography>
                          </div>
                        </TableCell>
                        <TableCell><Typography variant='body2'>{profile?.nim || '-'}</Typography></TableCell>
                        <TableCell><Typography variant='body2'>{profile?.syndicate?.name || '-'}</Typography></TableCell>
                        <TableCell>
                          <Chip label={approvalCfg.label} color={approvalCfg.color} size='small' variant='tonal' />
                        </TableCell>
                        {isEditable && isAdmin && (
                          <TableCell align='center'>
                            <Tooltip title='Hapus dari sprint'>
                              <IconButton size='small' color='error'
                                onClick={() => handleRemoveParticipant(p.student_id)}
                                disabled={removeLoading === p.student_id}>
                                {removeLoading === p.student_id
                                  ? <CircularProgress size={16} />
                                  : <i className='ri-delete-bin-7-line' />}
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* ── Dialog Generator ── */}
      <Dialog open={generatorOpen} onClose={() => setGeneratorOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>
          <div className='flex items-center justify-between'>
            <div>
              <Typography variant='h6'>Generator Peserta</Typography>
              <Typography variant='caption' color='text.secondary'>
                Urutan berdasarkan prioritas — sprint sedikit & pelanggaran tinggi = lebih diprioritaskan
              </Typography>
            </div>
            <IconButton onClick={() => setGeneratorOpen(false)}><i className='ri-close-line' /></IconButton>
          </div>
        </DialogTitle>
        <Divider />
        <DialogContent>
          {generatorResult && (
            <>
              <Typography variant='subtitle2' className='mb-3'>
                ✅ Rekomendasi ({generatorResult.suggested?.length} mahasiswa)
              </Typography>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell padding='checkbox'>
                      <Checkbox
                        checked={selectedStudents.length === generatorResult.suggested?.length}
                        onChange={e => setSelectedStudents(
                          e.target.checked ? generatorResult.suggested.map(s => s.student_id) : []
                        )}
                      />
                    </TableCell>
                    <TableCell>Nama</TableCell>
                    <TableCell>NIM</TableCell>
                    <TableCell align='center'>Sprint</TableCell>
                    <TableCell align='center'>Pelanggaran</TableCell>
                    <TableCell align='center'>Skor</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {generatorResult.suggested?.map(s => (
                    <TableRow key={s.student_id} selected={selectedStudents.includes(s.student_id)}>
                      <TableCell padding='checkbox'>
                        <Checkbox checked={selectedStudents.includes(s.student_id)}
                          onChange={e => setSelectedStudents(prev =>
                            e.target.checked ? [...prev, s.student_id] : prev.filter(id => id !== s.student_id)
                          )} />
                      </TableCell>
                      <TableCell><Typography variant='body2' fontWeight={600}>{s.full_name}</Typography></TableCell>
                      <TableCell><Typography variant='body2'>{s.nim}</Typography></TableCell>
                      <TableCell align='center'><Chip label={s.sprint_count} size='small' color='info' variant='tonal' /></TableCell>
                      <TableCell align='center'><Chip label={s.violation_count} size='small' color={s.violation_count > 0 ? 'error' : 'success'} variant='tonal' /></TableCell>
                      <TableCell align='center'><Typography variant='body2' fontWeight={700}>{s.priority_score?.toFixed(1)}</Typography></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {generatorResult.others?.length > 0 && (
                <>
                  <Typography variant='subtitle2' color='text.secondary' className='mt-4 mb-2'>
                    Mahasiswa lainnya ({generatorResult.others.length})
                  </Typography>
                  <Table size='small'>
                    <TableBody>
                      {generatorResult.others.map(s => (
                        <TableRow key={s.student_id}>
                          <TableCell padding='checkbox'>
                            <Checkbox checked={selectedStudents.includes(s.student_id)}
                              onChange={e => setSelectedStudents(prev =>
                                e.target.checked ? [...prev, s.student_id] : prev.filter(id => id !== s.student_id)
                              )} />
                          </TableCell>
                          <TableCell><Typography variant='body2'>{s.full_name}</Typography></TableCell>
                          <TableCell><Typography variant='body2'>{s.nim}</Typography></TableCell>
                          <TableCell align='center'><Chip label={s.sprint_count} size='small' color='info' variant='tonal' /></TableCell>
                          <TableCell align='center'><Chip label={s.violation_count} size='small' color={s.violation_count > 0 ? 'error' : 'success'} variant='tonal' /></TableCell>
                          <TableCell align='center'><Typography variant='body2'>{s.priority_score?.toFixed(1)}</Typography></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </>
          )}
        </DialogContent>
        <Divider />
        <DialogActions className='p-4 gap-2'>
          <Typography variant='body2' color='text.secondary' className='flex-1'>
            {selectedStudents.length} dipilih dari kuota {sprint.participant_quota}
          </Typography>
          <Button variant='tonal' color='secondary' onClick={() => setGeneratorOpen(false)} disabled={addingLoading}>Batal</Button>
          <Button variant='contained' onClick={handleAddFromGenerator}
            disabled={addingLoading || selectedStudents.length === 0}
            startIcon={addingLoading ? <CircularProgress size={16} color='inherit' /> : <i className='ri-user-add-line' />}>
            {addingLoading ? 'Menambahkan...' : `Tambah ${selectedStudents.length} Peserta`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog Kirim ke Koordinator ── */}
      <Dialog open={sendOpen} onClose={() => setSendOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Kirim ke Koordinator</DialogTitle>
        <Divider />
        <DialogContent className='flex flex-col gap-5 pt-4'>
          <Typography variant='body2' color='text.secondary'>
            Pilih koordinator angkatan yang akan mereview daftar peserta sprint ini.
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Koordinator</InputLabel>
            <Select label='Koordinator' value={selectedCoordinatorID}
              onChange={e => setSelectedCoordinatorID(e.target.value)}>
              {coordinators.map(c => (
                <MenuItem key={c.user_id} value={c.user_id}>
                  <div className='flex items-center justify-between w-full gap-2'>
                    <div>
                      <Typography variant='body2' fontWeight={600}>{c.full_name}</Typography>
                      <Typography variant='caption' color='text.secondary'>{c.nim} • {c.position_name}</Typography>
                    </div>
                    {!c.has_telegram && (
                      <Chip label='Belum daftar Telegram' color='warning' size='small' variant='tonal' />
                    )}
                  </div>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth multiline rows={3}
            label='Catatan untuk koordinator (opsional)'
            placeholder='Contoh: Mohon perhatikan sindikat III dan IV'
            value={sendNote}
            onChange={e => setSendNote(e.target.value)}
          />
          {coordinators.find(c => c.user_id === parseInt(selectedCoordinatorID) && !c.has_telegram) && (
            <Alert severity='warning'>
              Koordinator yang dipilih belum mendaftarkan Telegram. Notifikasi tidak akan dikirim.
            </Alert>
          )}
        </DialogContent>
        <Divider />
        <DialogActions className='p-4 gap-2'>
          <Button variant='tonal' color='secondary' onClick={() => setSendOpen(false)} disabled={sendLoading}>Batal</Button>
          <Button variant='contained' color='warning' onClick={handleSendToCoordinator}
            disabled={sendLoading || !selectedCoordinatorID}
            startIcon={sendLoading ? <CircularProgress size={16} color='inherit' /> : <i className='ri-send-plane-line' />}>
            {sendLoading ? 'Mengirim...' : 'Kirim ke Koordinator'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog Finalisasi ── */}
      <Dialog open={finalizeOpen} onClose={() => setFinalizeOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>Finalisasi Sprint</DialogTitle>
        <Divider />
        <DialogContent className='pt-4'>
          <DialogContentText className='mb-4'>
            Pilih versi daftar peserta yang akan digunakan. Setelah difinalisasi, sprint berstatus <strong>AKTIF</strong> dan semua peserta menerima notifikasi.
          </DialogContentText>
          <RadioGroup value={finalizeVersion} onChange={e => setFinalizeVersion(e.target.value)} className='mb-4'>
            <FormControlLabel value='DRAFT_ORIGINAL'
              control={<Radio />}
              label={
                <div>
                  <Typography variant='body2' fontWeight={600}>Gunakan Draft Admin (awal)</Typography>
                  <Typography variant='caption' color='text.secondary'>Daftar peserta yang dibuat admin, sebelum review koordinator</Typography>
                </div>
              }
            />
            <FormControlLabel value='COORDINATOR_DRAFT'
              control={<Radio />}
              label={
                <div>
                  <Typography variant='body2' fontWeight={600}>Gunakan Draft Koordinator</Typography>
                  <Typography variant='caption' color='text.secondary'>Daftar peserta yang sudah direvisi koordinator</Typography>
                </div>
              }
            />
          </RadioGroup>

          {/* Diff Peserta */}
          {finalizeDiffLoading && (
            <Box className='flex justify-center py-6'><CircularProgress size={28} /></Box>
          )}
          {!finalizeDiffLoading && finalizeDiff && (() => {
            const listToShow = finalizeVersion === 'DRAFT_ORIGINAL'
              ? finalizeDiff.original_participants
              : finalizeDiff.coordinator_participants
            const hasChanges = finalizeDiff.coordinator_participants?.some(p => p.change_type !== 'UNCHANGED')
            return (
              <Box>
                {hasChanges && (
                  <Alert severity='info' className='mb-3' icon={<i className='ri-git-diff-line' />}>
                    Koordinator melakukan perubahan pada daftar peserta.
                    {finalizeVersion === 'COORDINATOR_DRAFT'
                      ? ' Preview di bawah sudah mencerminkan perubahan koordinator.'
                      : ' Preview di bawah menggunakan daftar admin (awal).'}
                  </Alert>
                )}
                <Typography variant='subtitle2' color='text.secondary' className='mb-2'>
                  Preview peserta final ({listToShow?.length ?? 0} orang)
                </Typography>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nama</TableCell>
                      <TableCell>NIM</TableCell>
                      {finalizeVersion === 'COORDINATOR_DRAFT' && <TableCell>Perubahan</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {listToShow?.filter(p => p.change_type !== 'REMOVED').map(p => (
                      <TableRow key={p.student_id}
                        sx={p.change_type === 'ADDED' ? { bgcolor: 'success.lighter' } : {}}>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <Avatar sx={{ width: 28, height: 28, fontSize: 11 }}>
                              {getInitials(p.full_name)}
                            </Avatar>
                            <Typography variant='body2' fontWeight={600}>{p.full_name}</Typography>
                          </div>
                        </TableCell>
                        <TableCell><Typography variant='body2'>{p.nim}</Typography></TableCell>
                        {finalizeVersion === 'COORDINATOR_DRAFT' && (
                          <TableCell>
                            {p.change_type === 'ADDED' && <Chip label='Ditambah' color='success' size='small' variant='tonal' icon={<i className='ri-add-line' />} />}
                            {p.change_type === 'UNCHANGED' && <Typography variant='caption' color='text.secondary'>—</Typography>}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    {finalizeVersion === 'COORDINATOR_DRAFT' && finalizeDiff.coordinator_participants?.filter(p => p.change_type === 'REMOVED').map(p => (
                      <TableRow key={`removed-${p.student_id}`} sx={{ bgcolor: 'error.lighter', opacity: 0.6 }}>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <Avatar sx={{ width: 28, height: 28, fontSize: 11 }}>
                              {getInitials(p.full_name)}
                            </Avatar>
                            <Typography variant='body2' sx={{ textDecoration: 'line-through' }}>{p.full_name}</Typography>
                          </div>
                        </TableCell>
                        <TableCell><Typography variant='body2' sx={{ textDecoration: 'line-through' }}>{p.nim}</Typography></TableCell>
                        <TableCell><Chip label='Dihapus' color='error' size='small' variant='tonal' icon={<i className='ri-subtract-line' />} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )
          })()}
        </DialogContent>
        <Divider />
        <DialogActions className='p-4 gap-2'>
          <Button variant='tonal' color='secondary' onClick={() => setFinalizeOpen(false)} disabled={finalizeLoading}>Batal</Button>
          <Button variant='contained' color='success' onClick={handleFinalize}
            disabled={finalizeLoading || finalizeDiffLoading}
            startIcon={finalizeLoading ? <CircularProgress size={16} color='inherit' /> : <i className='ri-check-double-line' />}>
            {finalizeLoading ? 'Memfinalisasi...' : 'Finalisasi Sprint'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast(t => ({ ...t, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity={toast.severity} variant='filled' onClose={() => setToast(t => ({ ...t, open: false }))}>{toast.message}</Alert>
      </Snackbar>
    </>
  )
}

export default NimenSprintDetailView
