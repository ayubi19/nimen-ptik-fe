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
import Autocomplete from '@mui/material/Autocomplete'
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
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import Drawer from '@mui/material/Drawer'
import { useForm, Controller } from 'react-hook-form'
import { nimenIndicatorApi } from '@/libs/api/nimenMasterDataApi'
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
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
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
  const [selectedCoordinatorIDs, setSelectedCoordinatorIDs] = useState([])
  const [coordinatorSearch, setCoordinatorSearch] = useState('')
  const [sendNote, setSendNote] = useState('')
  const [sendLoading, setSendLoading] = useState(false)

  // Finalize state
  const [finalizeOpen, setFinalizeOpen] = useState(false)
  const [finalizeVersion, setFinalizeVersion] = useState('DRAFT_ORIGINAL')
  const [finalizeLoading, setFinalizeLoading] = useState(false)
  const [finalizeDiff, setFinalizeDiff] = useState(null)
  const [finalizeDiffLoading, setFinalizeDiffLoading] = useState(false)
  const [customParticipants, setCustomParticipants] = useState([]) // untuk mode CUSTOM
  const [customSearchResult, setCustomSearchResult] = useState([])
  const [customSearchLoading, setCustomSearchLoading] = useState(false)

  const [editOpen, setEditOpen]           = useState(false)
  const [editLoading, setEditLoading]     = useState(false)
  const [indicators, setIndicators]       = useState([])
  const [deleteOpen, setDeleteOpen]       = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const { control: editControl, handleSubmit: handleEditSubmit, reset: resetEdit,
    watch: watchEdit, formState: { errors: editErrors } } = useForm({
    defaultValues: {
      sprint_number: '', title: '', description: '', indicator_id: '',
      event_date: '', location: '', participant_quota: 1, submission_deadline: ''
    }
  })
  const editQuota = watchEdit('participant_quota')

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

  useEffect(() => {
    nimenIndicatorApi.getAll({ page: 1, page_size: 100, is_active: true })
      .then(r => setIndicators(r.data.data?.data || []))
      .catch(() => {})
  }, [])

  // ── Edit Sprint ──
  const handleOpenEdit = useCallback(() => {
    if (!sprint) return
    resetEdit({
      sprint_number:       sprint.sprint_number,
      title:               sprint.title,
      description:         sprint.description || '',
      indicator_id:        sprint.indicator_id,
      event_date:          sprint.event_date ? sprint.event_date.split('T')[0] : '',
      location:            sprint.location || '',
      participant_quota:   sprint.participant_quota,
      submission_deadline: sprint.submission_deadline ? sprint.submission_deadline.split('T')[0] : '',
    })
    setEditOpen(true)
  }, [sprint, resetEdit])

  const handleEdit = useCallback(async (values) => {
    if (parseInt(values.participant_quota) < participants.length) {
      showToast(`Kuota tidak bisa dikurangi di bawah jumlah peserta saat ini (${participants.length})`, 'error')
      return
    }
    setEditLoading(true)
    try {
      await nimenSprintApi.update(sprintId, {
        sprint_number:       values.sprint_number,
        title:               values.title,
        description:         values.description || '',
        indicator_id:        parseInt(values.indicator_id),
        event_date:          values.event_date,
        location:            values.location || '',
        participant_quota:   parseInt(values.participant_quota),
        submission_deadline: values.submission_deadline,
      })
      showToast('Sprint berhasil diperbarui')
      setEditOpen(false)
      fetchSprint()
    } catch (err) {
      showToast(err.message || 'Gagal memperbarui sprint', 'error')
    } finally {
      setEditLoading(false)
    }
  }, [sprintId, participants.length, fetchSprint, showToast])

  // ── Delete Sprint ──
  const handleDelete = useCallback(async () => {
    setDeleteLoading(true)
    try {
      await nimenSprintApi.delete(sprintId)
      showToast('Sprint berhasil dihapus')
      router.back()
    } catch (err) {
      showToast(err.message || 'Gagal menghapus sprint', 'error')
      setDeleteOpen(false)
    } finally {
      setDeleteLoading(false)
    }
  }, [sprintId, router, showToast])

  // ── Generator ──
  const handleGenerate = useCallback(async () => {
    if (!sprint) return
    setGeneratorLoading(true)
    try {
      const res = await nimenSprintApi.generateParticipants(sprintId, {
        batch_id: sprint.batch_id,
        quota: sprint.participant_quota,
      })
      const raw = res.data.data

      // Exclude mahasiswa yang sudah jadi peserta
      const existingIds = new Set(participants.map(p => p.student_id))
      const filteredSuggested = (raw.suggested || []).filter(s => !existingIds.has(s.student_id))
      const filteredOthers    = (raw.others    || []).filter(s => !existingIds.has(s.student_id))

      const filtered = { ...raw, suggested: filteredSuggested, others: filteredOthers }
      setGeneratorResult(filtered)

      // Auto-select hanya sesuai sisa kuota
      const remaining = sprint.participant_quota - participants.length
      setSelectedStudents(filteredSuggested.slice(0, remaining).map(s => s.student_id))
      setGeneratorOpen(true)
    } catch (err) {
      showToast(err.message || 'Gagal menjalankan generator', 'error')
    } finally {
      setGeneratorLoading(false)
    }
  }, [sprint, sprintId, showToast])

  const handleAddFromGenerator = useCallback(async () => {
    // Validasi: total peserta tidak boleh melebihi kuota
    const remaining = sprint.participant_quota - participants.length
    if (selectedStudents.length > remaining) {
      showToast(`Hanya bisa menambah ${remaining} peserta lagi (kuota tersisa ${remaining} dari ${sprint.participant_quota})`, 'error')
      return
    }
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
  }, [sprintId, sprint, participants, selectedStudents, fetchSprint, showToast])

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
    if (selectedCoordinatorIDs.length === 0) {
      showToast('Pilih minimal 1 koordinator', 'error')
      return
    }
    setSendLoading(true)
    try {
      await nimenSprintApi.sendToCoordinator(sprintId, {
        coordinator_ids: selectedCoordinatorIDs,
        note: sendNote,
      })
      showToast(`Sprint berhasil dikirim ke ${selectedCoordinatorIDs.length} koordinator`)
      setSendOpen(false)
      setSendNote('')
      setSelectedCoordinatorIDs([])
      setCoordinatorSearch('')
      fetchSprint()
    } catch (err) {
      showToast(err.message || 'Gagal mengirim ke koordinator', 'error')
    } finally {
      setSendLoading(false)
    }
  }, [sprintId, selectedCoordinatorIDs, sendNote, fetchSprint, showToast])

  // ── Finalize ──
  const handleOpenFinalize = useCallback(async () => {
    setFinalizeOpen(true)
    setFinalizeDiff(null)
    setFinalizeDiffLoading(true)
    // Inisialisasi custom dari peserta yang sudah ada
    setCustomParticipants(participants.map(p => ({
      student_id: p.student_id,
      full_name:  p.student?.full_name || '',
      nim:        p.student?.student_profile?.nim || '',
    })))
    try {
      const res = await nimenSprintApi.getFinalizeDiff(sprintId)
      setFinalizeDiff(res.data.data)
    } catch (err) {
      showToast(err.message || 'Gagal memuat diff peserta', 'error')
    } finally {
      setFinalizeDiffLoading(false)
    }
  }, [sprintId, participants, showToast])

  const handleFinalize = useCallback(async () => {
    setFinalizeLoading(true)
    try {
      const payload = { use_version: finalizeVersion }
      if (finalizeVersion === 'CUSTOM') {
        payload.custom_students = customParticipants.map(p => p.student_id)
      }
      await nimenSprintApi.finalize(sprintId, payload)
      showToast('Sprint berhasil difinalisasi dan sekarang AKTIF')
      setFinalizeOpen(false)
      fetchSprint()
    } catch (err) {
      showToast(err.message || 'Gagal finalisasi sprint', 'error')
    } finally {
      setFinalizeLoading(false)
    }
  }, [sprintId, finalizeVersion, customParticipants, fetchSprint, showToast])

  if (loading) return <div className='flex justify-center py-20'><CircularProgress /></div>
  if (!sprint) return null

  const statusCfg = STATUS_CONFIG[sprint.status] || { label: sprint.status, color: 'default', step: 0 }
  const isEditable = sprint.status === 'DRAFT_ADMIN'
  const isDraftPejabat = sprint.status === 'DRAFT_PEJABAT'
  const isReviewSubmitted = sprint.status === 'REVIEW_SUBMITTED'
  const isCoordinator = sprint.coordinators?.some(c => c.id === parseInt(currentUserID)) ||
    (sprint.coordinator_id && parseInt(currentUserID) === sprint.coordinator_id)
  const quotaUsed = participants.length
  const quotaPercent = Math.min((quotaUsed / sprint.participant_quota) * 100, 100)

  return (
    <>
      {/* Breadcrumb */}
      <div className='flex items-center gap-2 mb-6'>
        <Typography variant='caption' color='text.secondary'
                    sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                    onClick={() => router.push('/nimen/sprints')}>
          Daftar Sprint
        </Typography>
        <i className='ri-arrow-right-s-line text-sm opacity-50' />
        <Typography variant='caption' fontWeight={500} color='text.primary' noWrap
                    sx={{ maxWidth: { xs: 160, sm: 'none' } }}>
          {sprint.sprint_number}
        </Typography>
      </div>

      <Grid container spacing={6}>

        {/* Stepper Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ py: { xs: 1.5, md: 2 } }}>
              {isMobile ? (
                // Mobile — horizontal scrollable steps
                <Box sx={{ overflowX: 'auto', pb: 0.5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', minWidth: 'max-content', gap: 0 }}>
                    {SPRINT_STEPS.map((label, i) => {
                      const isDone = i < statusCfg.step
                      const isActive = i === statusCfg.step
                      return (
                        <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <Box sx={{
                              width: 28, height: 28, borderRadius: '50%',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 12, fontWeight: 700,
                              bgcolor: isDone || isActive ? 'primary.main' : 'action.hover',
                              color: isDone || isActive ? '#fff' : 'text.secondary',
                            }}>
                              {isDone ? <i className='ri-check-line' style={{ fontSize: 13 }} /> : i + 1}
                            </Box>
                            <Typography variant='caption'
                                        sx={{
                                          fontSize: 10, whiteSpace: 'nowrap',
                                          color: isActive ? 'primary.main' : isDone ? 'text.primary' : 'text.secondary',
                                          fontWeight: isActive ? 700 : 400,
                                        }}>
                              {label}
                            </Typography>
                          </div>
                          {i < SPRINT_STEPS.length - 1 && (
                            <Box sx={{
                              width: 32, height: 2, mx: 0.5, mb: 2.5, flexShrink: 0,
                              bgcolor: isDone ? 'primary.main' : 'divider',
                            }} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </Box>
              ) : (
                // Desktop — standard MUI stepper
                <Stepper activeStep={statusCfg.step} alternativeLabel>
                  {SPRINT_STEPS.map(label => (
                    <Step key={label}><StepLabel>{label}</StepLabel></Step>
                  ))}
                </Stepper>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Header Info */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              {/* Title + Status */}
              <div className='flex items-start justify-between gap-2 mb-3 flex-wrap'>
                <div className='flex items-center gap-2 flex-wrap flex-1 min-w-0'>
                  <Typography variant='h6' fontWeight={600} sx={{ wordBreak: 'break-word' }}>
                    {sprint.title}
                  </Typography>
                  <Chip label={statusCfg.label} color={statusCfg.color} size='small' variant='tonal'
                        sx={{ flexShrink: 0 }} />
                </div>
              </div>

              {/* Info baris */}
              <div className='flex flex-col gap-1.5 mb-4'>
                <div className='flex items-center gap-2'>
                  <i className='ri-file-list-3-line text-sm' style={{ color: 'var(--mui-palette-text-secondary)', flexShrink: 0 }} />
                  <Typography variant='body2' color='text.secondary'>{sprint.sprint_number}</Typography>
                </div>
                {sprint.location && (
                  <div className='flex items-center gap-2'>
                    <i className='ri-map-pin-line text-sm' style={{ color: 'var(--mui-palette-text-secondary)', flexShrink: 0 }} />
                    <Typography variant='body2' color='text.secondary'>{sprint.location}</Typography>
                  </div>
                )}
                <div className='flex items-center gap-2'>
                  <i className='ri-calendar-line text-sm' style={{ color: 'var(--mui-palette-text-secondary)', flexShrink: 0 }} />
                  <Typography variant='body2' color='text.secondary'>
                    {new Date(sprint.event_date).toLocaleDateString('id-ID', {
                      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
                    })}
                  </Typography>
                </div>
                {(sprint.coordinators?.length > 0 || sprint.coordinator) && (
                  <div className='flex items-center gap-2'>
                    <i className='ri-user-star-line text-sm' style={{ color: 'var(--mui-palette-text-secondary)', flexShrink: 0 }} />
                    <Typography variant='body2' color='text.secondary'>
                      Koordinator:{' '}
                      <strong>
                        {sprint.coordinators?.length > 0
                          ? sprint.coordinators.map(c => c.full_name).join(', ')
                          : sprint.coordinator?.full_name}
                      </strong>
                    </Typography>
                  </div>
                )}
              </div>

              <Divider className='mb-4' />

              {/* Action buttons */}
              <div className={`flex flex-wrap gap-2 ${isMobile ? 'flex-col' : 'items-center'}`}>
                {isEditable && isAdmin && (
                  <>
                    <Button variant='tonal' color='secondary'
                            startIcon={<i className='ri-edit-line' />}
                            fullWidth={isMobile}
                            onClick={handleOpenEdit}>
                      Edit
                    </Button>
                    <Button variant='tonal' color='error'
                            startIcon={<i className='ri-delete-bin-line' />}
                            fullWidth={isMobile}
                            onClick={() => setDeleteOpen(true)}>
                      Hapus
                    </Button>
                    <Button variant='contained' color='warning'
                            startIcon={<i className='ri-send-plane-line' />}
                            fullWidth={isMobile}
                            onClick={handleOpenSend}
                            disabled={quotaUsed === 0}>
                      Kirim ke Koordinator
                    </Button>
                  </>
                )}
                {isReviewSubmitted && isAdmin && (
                  <Button variant='contained' color='success'
                          startIcon={<i className='ri-check-double-line' />}
                          fullWidth={isMobile}
                          onClick={handleOpenFinalize}>
                    Finalisasi Sprint
                  </Button>
                )}
                {sprint.status === 'ACTIVE' && isAdmin && (
                  <Button variant='contained' color='warning'
                          startIcon={<i className='ri-shield-check-line' />}
                          fullWidth={isMobile}
                          onClick={() => router.push(`/nimen/sprints/${sprintId}/approval`)}>
                    Approval Nilai
                  </Button>
                )}
                {isDraftPejabat && isCoordinator && (
                  <Button variant='contained' color='info'
                          startIcon={<i className='ri-edit-box-line' />}
                          fullWidth={isMobile}
                          onClick={() => router.push(`/nimen/sprints/${sprintId}/coordinator-review`)}>
                    Review Peserta
                  </Button>
                )}
                <Button variant='tonal' color='secondary'
                        startIcon={<i className='ri-arrow-left-line' />}
                        fullWidth={isMobile}
                        onClick={() => router.push('/nimen/sprints')}>
                  Kembali
                </Button>
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
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ pb: 1 }}>
              <div className='flex items-center justify-between flex-wrap gap-2 mb-3'>
                <div className='flex items-center gap-2'>
                  <Typography variant='subtitle1' fontWeight={600}>Daftar Peserta</Typography>
                  <Chip label={`${quotaUsed} / ${sprint.participant_quota}`} size='small'
                        color={quotaUsed >= sprint.participant_quota ? 'success' : 'warning'} variant='tonal' />
                </div>
                {isEditable && isAdmin && quotaUsed < sprint.participant_quota && (
                  <Button variant='contained' size='small'
                          startIcon={generatorLoading ? <CircularProgress size={14} color='inherit' /> : <i className='ri-magic-line' />}
                          onClick={handleGenerate} disabled={generatorLoading}>
                    Generator Peserta
                  </Button>
                )}
              </div>
              <LinearProgress variant='determinate' value={quotaPercent}
                              color={quotaUsed >= sprint.participant_quota ? 'success' : 'warning'}
                              sx={{ height: 6, borderRadius: 3, mb: 2 }}
              />
            </CardContent>
            <Divider />
            {participants.length === 0 ? (
              <Box className='flex flex-col items-center justify-center py-10 gap-2' sx={{ color: 'text.secondary' }}>
                <i className='ri-group-line text-5xl opacity-30' />
                <Typography variant='body2'>Belum ada peserta.</Typography>
              </Box>
            ) : isMobile ? (
              // Mobile — Card list
              <div className='p-3 flex flex-col gap-2'>
                {participants.map(p => {
                  const student = p.student
                  const profile = student?.student_profile
                  const approvalCfg = APPROVAL_CONFIG[p.approval_status] || { label: p.approval_status, color: 'default' }
                  return (
                    <Card key={p.id} variant='outlined'>
                      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <div className='flex items-start justify-between gap-2'>
                          <div className='flex items-center gap-2 flex-1 min-w-0'>
                            <Avatar sx={{ width: 32, height: 32, fontSize: 11, flexShrink: 0 }}>
                              {getInitials(student?.full_name || '')}
                            </Avatar>
                            <div className='min-w-0'>
                              <Typography variant='body2' fontWeight={600} noWrap>{student?.full_name}</Typography>
                              <Typography variant='caption' color='text.secondary'>
                                {profile?.nim || '—'} · {profile?.syndicate?.name || '—'}
                              </Typography>
                            </div>
                          </div>
                          <div className='flex items-center gap-1 flex-shrink-0'>
                            <Chip label={approvalCfg.label} color={approvalCfg.color} size='small' variant='tonal' />
                            {isEditable && isAdmin && (
                              <Tooltip title='Hapus dari sprint'>
                                <IconButton size='small' color='error'
                                            onClick={() => handleRemoveParticipant(p.student_id)}>
                                  <i className='ri-delete-bin-line text-[16px]' />
                                </IconButton>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              // Desktop — Table full width
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Peserta</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>NIM</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Sindikat</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Status</TableCell>
                    {isEditable && isAdmin && <TableCell align='center' sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Aksi</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {participants.map(p => {
                    const student = p.student
                    const profile = student?.student_profile
                    const approvalCfg = APPROVAL_CONFIG[p.approval_status] || { label: p.approval_status, color: 'default' }
                    return (
                      <TableRow key={p.id} hover>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <Avatar sx={{ width: 32, height: 32, fontSize: 12 }}>
                              {getInitials(student?.full_name || '')}
                            </Avatar>
                            <Typography variant='body2' fontWeight={600}>{student?.full_name}</Typography>
                          </div>
                        </TableCell>
                        <TableCell><Typography variant='body2'>{profile?.nim || '—'}</Typography></TableCell>
                        <TableCell><Typography variant='body2'>{profile?.syndicate?.name || '—'}</Typography></TableCell>
                        <TableCell>
                          <Chip label={approvalCfg.label} color={approvalCfg.color} size='small' variant='tonal' />
                        </TableCell>
                        {isEditable && isAdmin && (
                          <TableCell align='center'>
                            <Tooltip title='Hapus dari sprint'>
                              <IconButton size='small' color='error'
                                          onClick={() => handleRemoveParticipant(p.student_id)}>
                                <i className='ri-delete-bin-line text-[18px]' />
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
      <Dialog open={generatorOpen} onClose={() => setGeneratorOpen(false)}
              maxWidth='md' fullWidth
              fullScreen={isMobile}>
        <DialogTitle sx={{ pb: 1 }}>
          <div className='flex items-center justify-between'>
            <div>
              <Typography variant='h6'>Generator Peserta</Typography>
              <Typography variant='caption' color='text.secondary'>
                Sprint sedikit & pelanggaran tinggi = prioritas lebih tinggi
              </Typography>
            </div>
            <IconButton onClick={() => setGeneratorOpen(false)}><i className='ri-close-line' /></IconButton>
          </div>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: isMobile ? 1.5 : 3 }}>
          {generatorResult && (
            <>
              {/* ── Select All + label ── */}
              <Box className='flex items-center gap-2 mb-2'>
                <Checkbox
                  checked={selectedStudents.length > 0 && selectedStudents.length === generatorResult.suggested?.length}
                  indeterminate={selectedStudents.length > 0 && selectedStudents.length < (generatorResult.suggested?.length || 0)}
                  onChange={e => {
                    if (e.target.checked) {
                      const remaining = sprint.participant_quota - participants.length
                      const allowed = generatorResult.suggested.slice(0, remaining).map(s => s.student_id)
                      setSelectedStudents(allowed)
                      if (generatorResult.suggested.length > remaining) {
                        showToast(`Hanya ${remaining} pertama yang dipilih sesuai sisa kuota`, 'info')
                      }
                    } else {
                      setSelectedStudents([])
                    }
                  }}
                />
                <Typography variant='subtitle2'>
                  ✅ Rekomendasi ({generatorResult.suggested?.length} mahasiswa)
                </Typography>
              </Box>

              {isMobile ? (
                // ── Mobile: Card List ──
                <div className='flex flex-col gap-2 mb-3'>
                  {generatorResult.suggested?.map(s => {
                    const isChecked = selectedStudents.includes(s.student_id)
                    return (
                      <Box key={s.student_id}
                           onClick={() => {
                             const remaining = sprint.participant_quota - participants.length
                             if (!isChecked && selectedStudents.length >= remaining) {
                               showToast(`Maksimal ${remaining} peserta lagi (sisa kuota)`, 'warning')
                               return
                             }
                             setSelectedStudents(prev =>
                               isChecked ? prev.filter(id => id !== s.student_id) : [...prev, s.student_id]
                             )
                           }}
                           sx={{
                             display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
                             borderRadius: 2, cursor: 'pointer',
                             border: 1, borderColor: isChecked ? 'primary.main' : 'divider',
                             bgcolor: isChecked ? 'primary.lighter' : 'background.paper',
                           }}>
                        <Checkbox checked={isChecked} size='small' sx={{ p: 0 }} />
                        <Avatar sx={{ width: 32, height: 32, fontSize: 11, flexShrink: 0 }}>
                          {getInitials(s.full_name)}
                        </Avatar>
                        <div className='flex-1 min-w-0'>
                          <Typography variant='body2' fontWeight={600} noWrap>{s.full_name}</Typography>
                          <Typography variant='caption' color='text.secondary'>{s.nim}</Typography>
                        </div>
                        <div className='flex flex-col items-end gap-1 flex-shrink-0'>
                          <div className='flex gap-1'>
                            <Chip label={`S:${s.sprint_count}`} size='small' color='info' variant='tonal' sx={{ height: 18, fontSize: 10 }} />
                            <Chip label={`P:${s.violation_count}`} size='small' color={s.violation_count > 0 ? 'error' : 'success'} variant='tonal' sx={{ height: 18, fontSize: 10 }} />
                          </div>
                          <Typography variant='caption' fontWeight={700}>{s.priority_score?.toFixed(1)}</Typography>
                        </div>
                      </Box>
                    )
                  })}
                </div>
              ) : (
                // ── Desktop: Table ──
                <Table size='small' className='mb-3'>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell padding='checkbox' />
                      <TableCell sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Nama</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>NIM</TableCell>
                      <TableCell align='center' sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Sprint</TableCell>
                      <TableCell align='center' sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Pelanggaran</TableCell>
                      <TableCell align='center' sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Skor</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {generatorResult.suggested?.map(s => (
                      <TableRow key={s.student_id} selected={selectedStudents.includes(s.student_id)} hover>
                        <TableCell padding='checkbox'>
                          <Checkbox checked={selectedStudents.includes(s.student_id)}
                                    onChange={e => {
                                      const remaining = sprint.participant_quota - participants.length
                                      if (e.target.checked && selectedStudents.length >= remaining) {
                                        showToast(`Maksimal ${remaining} peserta lagi (sisa kuota)`, 'warning')
                                        return
                                      }
                                      setSelectedStudents(prev =>
                                        e.target.checked ? [...prev, s.student_id] : prev.filter(id => id !== s.student_id)
                                      )
                                    }} />
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
              )}

              {/* ── Mahasiswa lainnya ── */}
              {generatorResult.others?.length > 0 && (
                <>
                  <Typography variant='subtitle2' color='text.secondary' className='mb-2'>
                    Mahasiswa lainnya ({generatorResult.others.length})
                  </Typography>
                  {isMobile ? (
                    <div className='flex flex-col gap-2'>
                      {generatorResult.others.map(s => {
                        const isChecked = selectedStudents.includes(s.student_id)
                        return (
                          <Box key={s.student_id}
                               onClick={() => {
                                 const remaining = sprint.participant_quota - participants.length
                                 if (!isChecked && selectedStudents.length >= remaining) {
                                   showToast(`Maksimal ${remaining} peserta lagi (sisa kuota)`, 'warning')
                                   return
                                 }
                                 setSelectedStudents(prev =>
                                   isChecked ? prev.filter(id => id !== s.student_id) : [...prev, s.student_id]
                                 )
                               }}
                               sx={{
                                 display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
                                 borderRadius: 2, cursor: 'pointer',
                                 border: 1, borderColor: isChecked ? 'primary.main' : 'divider',
                                 bgcolor: isChecked ? 'primary.lighter' : 'background.paper',
                               }}>
                            <Checkbox checked={isChecked} size='small' sx={{ p: 0 }} />
                            <Avatar sx={{ width: 32, height: 32, fontSize: 11, flexShrink: 0 }}>
                              {getInitials(s.full_name)}
                            </Avatar>
                            <div className='flex-1 min-w-0'>
                              <Typography variant='body2' noWrap>{s.full_name}</Typography>
                              <Typography variant='caption' color='text.secondary'>{s.nim}</Typography>
                            </div>
                            <div className='flex flex-col items-end gap-1 flex-shrink-0'>
                              <div className='flex gap-1'>
                                <Chip label={`S:${s.sprint_count}`} size='small' color='info' variant='tonal' sx={{ height: 18, fontSize: 10 }} />
                                <Chip label={`P:${s.violation_count}`} size='small' color={s.violation_count > 0 ? 'error' : 'success'} variant='tonal' sx={{ height: 18, fontSize: 10 }} />
                              </div>
                              <Typography variant='caption' fontWeight={700}>{s.priority_score?.toFixed(1)}</Typography>
                            </div>
                          </Box>
                        )
                      })}
                    </div>
                  ) : (
                    <Table size='small'>
                      <TableBody>
                        {generatorResult.others.map(s => (
                          <TableRow key={s.student_id} hover>
                            <TableCell padding='checkbox'>
                              <Checkbox checked={selectedStudents.includes(s.student_id)}
                                        onChange={e => {
                                          const remaining = sprint.participant_quota - participants.length
                                          if (e.target.checked && selectedStudents.length >= remaining) {
                                            showToast(`Maksimal ${remaining} peserta lagi (sisa kuota)`, 'warning')
                                            return
                                          }
                                          setSelectedStudents(prev =>
                                            e.target.checked ? [...prev, s.student_id] : prev.filter(id => id !== s.student_id)
                                          )
                                        }} />
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
                  )}
                </>
              )}
            </>
          )}
        </DialogContent>
        <Divider />
        <DialogActions className='p-4 gap-2'>
          <Typography variant='body2' color='text.secondary' className='flex-1'>
            {selectedStudents.length} dipilih · sisa kuota: {Math.max(0, sprint.participant_quota - participants.length - selectedStudents.length)}
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
      <Dialog open={sendOpen} onClose={() => { setSendOpen(false); setCoordinatorSearch('') }} maxWidth='sm' fullWidth>
        <DialogTitle>Kirim ke Koordinator</DialogTitle>
        <Divider />
        <DialogContent className='flex flex-col gap-4 pt-4'>
          <Typography variant='body2' color='text.secondary'>
            Pilih koordinator angkatan yang akan mereview daftar peserta sprint ini.
            Maksimal <strong>5 koordinator</strong> — yang pertama submit review akan menjadi reviewer sah.
          </Typography>

          {/* Search */}
          <TextField
            fullWidth size='small'
            placeholder='Cari nama atau NIM koordinator...'
            value={coordinatorSearch}
            onChange={e => setCoordinatorSearch(e.target.value)}
            InputProps={{ startAdornment: <i className='ri-search-line mr-2 opacity-50' /> }}
          />

          {/* Daftar koordinator */}
          <div className='flex flex-col gap-2' style={{ maxHeight: 300, overflowY: 'auto' }}>
            {coordinators
              .filter(c => {
                if (!coordinatorSearch) return true
                const q = coordinatorSearch.toLowerCase()
                return c.full_name.toLowerCase().includes(q) || c.nim.toLowerCase().includes(q)
              })
              .map(c => {
                const isSelected = selectedCoordinatorIDs.includes(c.user_id)
                const isDisabled = !isSelected && selectedCoordinatorIDs.length >= 5
                return (
                  <div key={c.user_id}
                       onClick={() => {
                         if (isDisabled) return
                         setSelectedCoordinatorIDs(prev =>
                           isSelected ? prev.filter(id => id !== c.user_id) : [...prev, c.user_id]
                         )
                       }}
                       className='flex items-center gap-3 p-3 border rounded-lg cursor-pointer'
                       style={{
                         borderColor: isSelected ? '#7367f0' : undefined,
                         backgroundColor: isSelected ? '#7367f010' : undefined,
                         opacity: isDisabled ? 0.4 : 1,
                         cursor: isDisabled ? 'not-allowed' : 'pointer',
                       }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: 4, border: '2px solid',
                      borderColor: isSelected ? '#7367f0' : '#ccc',
                      backgroundColor: isSelected ? '#7367f0' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {isSelected && <i className='ri-check-line text-white text-[12px]' />}
                    </div>
                    <div className='flex-1'>
                      <Typography variant='body2' fontWeight={600}>{c.full_name}</Typography>
                      <Typography variant='caption' color='text.secondary'>{c.nim} • {c.position_name}</Typography>
                    </div>
                    {!c.has_telegram && (
                      <Chip label='Belum Telegram' color='warning' size='small' variant='tonal' />
                    )}
                  </div>
                )
              })}
          </div>

          {/* Summary selected */}
          {selectedCoordinatorIDs.length > 0 && (
            <Alert severity='info' icon={<i className='ri-group-line' />}>
              <strong>{selectedCoordinatorIDs.length} koordinator</strong> dipilih
              {selectedCoordinatorIDs.some(id => coordinators.find(c => c.user_id === id && !c.has_telegram)) && (
                <span> — beberapa belum daftar Telegram, notifikasi tidak akan terkirim ke mereka</span>
              )}
            </Alert>
          )}

          <TextField
            fullWidth multiline rows={2}
            label='Catatan untuk koordinator (opsional)'
            placeholder='Contoh: Mohon perhatikan sindikat III dan IV'
            value={sendNote}
            onChange={e => setSendNote(e.target.value)}
          />
        </DialogContent>
        <Divider />
        <DialogActions className='p-4 gap-2'>
          <Button variant='tonal' color='secondary'
                  onClick={() => { setSendOpen(false); setCoordinatorSearch('') }}
                  disabled={sendLoading}>
            Batal
          </Button>
          <Button variant='contained' color='warning' onClick={handleSendToCoordinator}
                  disabled={sendLoading || selectedCoordinatorIDs.length === 0}
                  startIcon={sendLoading ? <CircularProgress size={16} color='inherit' /> : <i className='ri-send-plane-line' />}>
            {sendLoading ? 'Mengirim...' : `Kirim ke ${selectedCoordinatorIDs.length || ''} Koordinator`}
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
          <RadioGroup value={finalizeVersion} onChange={e => {
            setFinalizeVersion(e.target.value)
            // Saat pilih CUSTOM, inisialisasi dari draft yang sedang aktif
            if (e.target.value === 'CUSTOM' && finalizeDiff) {
              const base = finalizeVersion === 'COORDINATOR_DRAFT'
                ? finalizeDiff.coordinator_participants?.filter(p => p.change_type !== 'REMOVED')
                : finalizeDiff.original_participants
              setCustomParticipants((base || []).map(p => ({
                student_id: p.student_id,
                full_name:  p.full_name,
                nim:        p.nim,
              })))
            }
          }} className='mb-4'>
            <FormControlLabel value='DRAFT_ORIGINAL'
                              control={<Radio />}
                              label={
                                <div>
                                  <Typography variant='body2' fontWeight={600}>Draft Admin (awal)</Typography>
                                  <Typography variant='caption' color='text.secondary'>Daftar peserta yang dibuat admin sebelum review koordinator</Typography>
                                </div>
                              }
            />
            <FormControlLabel value='COORDINATOR_DRAFT'
                              control={<Radio />}
                              label={
                                <div>
                                  <Typography variant='body2' fontWeight={600}>Draft Koordinator</Typography>
                                  <Typography variant='caption' color='text.secondary'>Daftar peserta yang sudah direvisi koordinator</Typography>
                                </div>
                              }
            />
            <FormControlLabel value='CUSTOM'
                              control={<Radio />}
                              label={
                                <div>
                                  <Typography variant='body2' fontWeight={600}>Custom (edit manual)</Typography>
                                  <Typography variant='caption' color='text.secondary'>Mulai dari salah satu draft lalu modifikasi bebas</Typography>
                                </div>
                              }
            />
          </RadioGroup>

          {/* ── Mode CUSTOM: editor peserta ── */}
          {finalizeVersion === 'CUSTOM' && (
            <Box sx={{ mb: 3 }}>
              <Alert severity='info' className='mb-3' icon={<i className='ri-edit-line' />}>
                Mode Custom — tambah atau hapus peserta bebas. Kuota: {sprint?.participant_quota} orang.
              </Alert>

              {/* Search tambah peserta */}
              <Box className='flex gap-2 mb-3'>
                <TextField
                  size='small' fullWidth
                  placeholder='Cari mahasiswa untuk ditambahkan...'
                  onChange={async e => {
                    const q = e.target.value
                    if (q.length < 2) { setCustomSearchResult([]); return }
                    setCustomSearchLoading(true)
                    try {
                      const { studentsApi } = await import('@/libs/api/studentsApi')
                      const res = await studentsApi.getAll({
                        batch_id: sprint.batch_id, search: q, page_size: 10
                      })
                      const all = res.data.data?.data || []
                      // Exclude yang sudah ada di list
                      const existIds = new Set(customParticipants.map(p => p.student_id))
                      setCustomSearchResult(all.filter(s => !existIds.has(s.id)))
                    } catch {}
                    finally { setCustomSearchLoading(false) }
                  }}
                  InputProps={{
                    startAdornment: customSearchLoading
                      ? <CircularProgress size={16} sx={{ mr: 1 }} />
                      : <i className='ri-search-line mr-2 opacity-50' />
                  }}
                />
              </Box>

              {/* Search results */}
              {customSearchResult.length > 0 && (
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 2, maxHeight: 160, overflow: 'auto' }}>
                  {customSearchResult.map(s => (
                    <Box key={s.id} className='flex items-center justify-between p-2 hover:bg-action-hover cursor-pointer'
                         onClick={() => {
                           if (customParticipants.length >= sprint.participant_quota) {
                             showToast(`Kuota penuh (${sprint.participant_quota} peserta)`, 'error')
                             return
                           }
                           setCustomParticipants(prev => [...prev, {
                             student_id: s.id,
                             full_name:  s.full_name,
                             nim:        s.student_profile?.nim || '',
                           }])
                           setCustomSearchResult(prev => prev.filter(x => x.id !== s.id))
                         }}>
                      <div className='flex items-center gap-2'>
                        <Avatar sx={{ width: 24, height: 24, fontSize: 10 }}>{getInitials(s.full_name)}</Avatar>
                        <div>
                          <Typography variant='body2' fontWeight={500}>{s.full_name}</Typography>
                          <Typography variant='caption' color='text.secondary'>{s.student_profile?.nim}</Typography>
                        </div>
                      </div>
                      <i className='ri-add-circle-line text-success-main text-lg' />
                    </Box>
                  ))}
                </Box>
              )}

              {/* Custom list */}
              <div className='flex items-center justify-between mb-1'>
                <Typography variant='caption' color='text.secondary'>
                  {customParticipants.length} / {sprint?.participant_quota} peserta
                </Typography>
              </div>
              <Table size='small'>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell>Nama</TableCell>
                    <TableCell>NIM</TableCell>
                    <TableCell align='center'>Hapus</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customParticipants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align='center' sx={{ py: 3 }}>
                        <Typography variant='body2' color='text.secondary'>Belum ada peserta</Typography>
                      </TableCell>
                    </TableRow>
                  ) : customParticipants.map(p => (
                    <TableRow key={p.student_id}>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <Avatar sx={{ width: 28, height: 28, fontSize: 11 }}>{getInitials(p.full_name)}</Avatar>
                          <Typography variant='body2' fontWeight={600}>{p.full_name}</Typography>
                        </div>
                      </TableCell>
                      <TableCell><Typography variant='body2'>{p.nim}</Typography></TableCell>
                      <TableCell align='center'>
                        <IconButton size='small' color='error'
                                    onClick={() => setCustomParticipants(prev => prev.filter(x => x.student_id !== p.student_id))}>
                          <i className='ri-delete-bin-line text-[16px]' />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

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
                  disabled={
                    finalizeLoading || finalizeDiffLoading ||
                    (finalizeVersion === 'CUSTOM' && customParticipants.length === 0)
                  }
                  startIcon={finalizeLoading ? <CircularProgress size={16} color='inherit' /> : <i className='ri-check-double-line' />}>
            {finalizeLoading ? 'Memfinalisasi...' : 'Finalisasi Sprint'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Drawer Edit Sprint ── */}
      <Drawer anchor='right' open={editOpen} onClose={() => setEditOpen(false)}
              PaperProps={{ sx: { width: { xs: '100%', sm: 480 } } }}>
        <div className='flex items-center justify-between p-4 border-b'>
          <Typography variant='h6'>Edit Sprint</Typography>
          <IconButton onClick={() => setEditOpen(false)}><i className='ri-close-line' /></IconButton>
        </div>
        <form onSubmit={handleEditSubmit(handleEdit)} className='flex flex-col gap-4 p-4 overflow-y-auto'>
          <Controller name='sprint_number' control={editControl}
                      rules={{ required: 'Wajib diisi', minLength: { value: 3, message: 'Min 3 karakter' } }}
                      render={({ field }) => (
                        <TextField {...field} fullWidth label='Nomor Sprint'
                                   error={!!editErrors.sprint_number} helperText={editErrors.sprint_number?.message} />
                      )}
          />
          <Controller name='title' control={editControl}
                      rules={{ required: 'Wajib diisi' }}
                      render={({ field }) => (
                        <TextField {...field} fullWidth label='Judul Kegiatan'
                                   error={!!editErrors.title} helperText={editErrors.title?.message} />
                      )}
          />
          <Controller name='description' control={editControl}
                      render={({ field }) => (
                        <TextField {...field} fullWidth multiline rows={2} label='Deskripsi (opsional)' />
                      )}
          />
          <Controller name='indicator_id' control={editControl}
                      rules={{ required: 'Wajib dipilih' }}
                      render={({ field }) => (
                        <Autocomplete
                          options={indicators}
                          getOptionLabel={opt => opt?.name || ''}
                          isOptionEqualToValue={(opt, val) => opt.id === (val?.id ?? val)}
                          value={indicators.find(i => i.id === field.value) || null}
                          onChange={(_, val) => field.onChange(val?.id ?? '')}
                          renderOption={(props, opt) => (
                            <li {...props} key={opt.id}>
                              <div>
                                <Typography variant='body2'>{opt.name}</Typography>
                                <Typography variant='caption' color='text.secondary'>
                                  {opt.value > 0 ? `+${opt.value}` : opt.value} · {opt.variable?.name}
                                </Typography>
                              </div>
                            </li>
                          )}
                          renderInput={params => (
                            <TextField {...params} label='Indikator Nilai'
                                       placeholder='Cari indikator...'
                                       error={!!editErrors.indicator_id}
                                       helperText={editErrors.indicator_id?.message}
                            />
                          )}
                        />
                      )}
          />
          <Controller name='event_date' control={editControl}
                      rules={{ required: 'Wajib diisi' }}
                      render={({ field }) => (
                        <TextField {...field} fullWidth type='date' label='Tanggal Kegiatan'
                                   InputLabelProps={{ shrink: true }}
                                   error={!!editErrors.event_date} helperText={editErrors.event_date?.message} />
                      )}
          />
          <Controller name='location' control={editControl}
                      render={({ field }) => (
                        <TextField {...field} fullWidth label='Lokasi (opsional)' />
                      )}
          />
          <Controller name='participant_quota' control={editControl}
                      rules={{ required: 'Wajib diisi', min: { value: 1, message: 'Min 1' } }}
                      render={({ field }) => (
                        <TextField {...field} fullWidth type='number' label='Kuota Peserta'
                                   inputProps={{ min: 1 }}
                                   error={!!editErrors.participant_quota}
                                   helperText={
                                     parseInt(editQuota) < participants.length
                                       ? `⚠️ Kuota tidak bisa kurang dari jumlah peserta saat ini (${participants.length})`
                                       : editErrors.participant_quota?.message
                                   }
                                   FormHelperTextProps={{
                                     sx: { color: parseInt(editQuota) < participants.length ? 'error.main' : undefined }
                                   }}
                        />
                      )}
          />
          <Controller name='submission_deadline' control={editControl}
                      rules={{ required: 'Wajib diisi' }}
                      render={({ field }) => (
                        <TextField {...field} fullWidth type='date' label='Batas Pengumpulan Dokumen'
                                   InputLabelProps={{ shrink: true }}
                                   error={!!editErrors.submission_deadline} helperText={editErrors.submission_deadline?.message} />
                      )}
          />
          <div className='flex gap-2 mt-2'>
            <Button fullWidth variant='tonal' color='secondary'
                    onClick={() => setEditOpen(false)} disabled={editLoading}>Batal</Button>
            <Button fullWidth variant='contained' type='submit'
                    disabled={editLoading || parseInt(editQuota) < participants.length}
                    startIcon={editLoading ? <CircularProgress size={16} color='inherit' /> : null}>
              {editLoading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* ── Dialog Hapus Sprint ── */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Hapus Sprint?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Hapus sprint <strong>{sprint?.sprint_number}</strong> — {sprint?.title}?
            Semua data peserta dan dokumen akan ikut terhapus. Tindakan ini tidak dapat dibatalkan.
          </DialogContentText>
        </DialogContent>
        <DialogActions className='p-4 gap-2'>
          <Button variant='tonal' color='secondary'
                  onClick={() => setDeleteOpen(false)} disabled={deleteLoading}>Batal</Button>
          <Button variant='contained' color='error' onClick={handleDelete} disabled={deleteLoading}
                  startIcon={deleteLoading ? <CircularProgress size={16} color='inherit' /> : null}>
            {deleteLoading ? 'Menghapus...' : 'Hapus Sprint'}
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
