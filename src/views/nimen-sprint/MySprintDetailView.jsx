'use client'
import { useVisibilityRefetch } from '@/hooks/useVisibilityRefetch'

import { useEffect, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import Snackbar from '@mui/material/Snackbar'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { nimenSprintApi } from '@/libs/api/nimenSprintApi'
import { nimenAttachmentApi, nimenParticipantDocApi } from '@/libs/api/nimenDocumentApi'
import DocumentManager from '@/components/nimen/DocumentManager'

const APPROVAL_CONFIG = {
  VALID:               { label: 'Nilai Valid',     color: 'success', icon: 'ri-checkbox-circle-line' },
  DISPENSED:           { label: 'Dispensasi',      color: 'info',    icon: 'ri-shield-check-line'    },
  REJECTED_NO_DOC:     { label: 'Dokumen Kurang',  color: 'error',   icon: 'ri-file-warning-line'    },
  REJECTED_PUNISHMENT: { label: 'Punishment',      color: 'error',   icon: 'ri-close-circle-line'    },
  PENDING:             { label: 'Menunggu',        color: 'warning', icon: 'ri-time-line'            },
}

const MySprintDetailView = ({ sprintId }) => {
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [sprint, setSprint]     = useState(null)
  const [attachments, setAttachments] = useState([])
  const [myDocData, setMyDocData] = useState({ participant: null, documents: [] })
  const [loading, setLoading]   = useState(true)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const showToast = useCallback((msg, severity = 'success') =>
    setToast({ open: true, message: msg, severity }), [])

  const fetchData = useCallback(async () => {
    try {
      const [sprintRes, attachRes, myDocRes] = await Promise.all([
        nimenSprintApi.getById(sprintId),
        nimenAttachmentApi.getAll(sprintId),
        nimenParticipantDocApi.getMyDocuments(sprintId),
      ])
      setSprint(sprintRes.data.data)
      setAttachments(attachRes.data.data || [])
      setMyDocData(myDocRes.data.data || { participant: null, documents: [] })
    } catch (err) {
      showToast(err.message || 'Gagal memuat data', 'error')
    } finally {
      setLoading(false)
    }
  }, [sprintId, showToast])

  useEffect(() => { fetchData() }, [fetchData])

  useVisibilityRefetch(fetchData)


  const handleUpload = useCallback(async (file) => {
    await nimenParticipantDocApi.upload(sprintId, file)
    showToast('Dokumen berhasil diupload')
    fetchData()
  }, [sprintId, fetchData, showToast])

  const handleDelete = useCallback(async (docId) => {
    await nimenParticipantDocApi.delete(sprintId, docId)
    showToast('Dokumen berhasil dihapus')
    fetchData()
  }, [sprintId, fetchData, showToast])

  const handlePresign = useCallback(async (docId) =>
    nimenParticipantDocApi.getPresignedURL(sprintId, docId), [sprintId])

  const handleAttachmentPresign = useCallback(async (attachId) =>
    nimenAttachmentApi.getPresignedURL(sprintId, attachId), [sprintId])

  if (loading) return <Box className='flex justify-center py-20'><CircularProgress /></Box>
  if (!sprint) return null

  const now          = new Date()
  const eventDate    = new Date(sprint.event_date)
  const deadline     = new Date(sprint.submission_deadline)
  const isActive     = sprint.status === 'ACTIVE'
  const canUpload    = isActive && now >= eventDate && now <= deadline
  const isDeadlinePassed = now > deadline
  const isBeforeEvent    = now < eventDate

  const participant  = myDocData?.participant
  const myDocuments  = myDocData?.documents || []
  const approvalCfg  = APPROVAL_CONFIG[participant?.approval_status] || APPROVAL_CONFIG.PENDING
  const indicatorVal = sprint.indicator?.value ?? 0
  const isPlus       = indicatorVal >= 0

  const fmtDate = (d, opts) => new Date(d).toLocaleDateString('id-ID', opts || { day: '2-digit', month: 'long', year: 'numeric' })

  // Countdown deadline
  const msLeft  = deadline - now
  const daysLeft = Math.max(0, Math.floor(msLeft / (1000 * 60 * 60 * 24)))

  return (
    <>
      {/* Breadcrumb */}
      <div className='flex items-center gap-2 mb-6'>
        <Typography variant='caption' color='text.secondary'>NIMEN</Typography>
        <i className='ri-arrow-right-s-line text-sm opacity-50' />
        <Typography variant='caption' color='text.secondary'
                    className='cursor-pointer hover:underline'
                    onClick={() => router.push('/nimen/my-sprints')}>
          Sprint Saya
        </Typography>
        <i className='ri-arrow-right-s-line text-sm opacity-50' />
        <Typography variant='caption' fontWeight={500} color='text.primary' noWrap>{sprint.title}</Typography>
      </div>

      <Grid container spacing={4}>

        {/* ── Hero Card ── */}
        <Grid item xs={12}>
          <Card sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.primary.main}05 100%)`,
            border: `1px solid ${theme.palette.primary.main}20`,
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <div className='flex items-start justify-between gap-3 mb-3'>
                <div className='flex-1 min-w-0'>
                  <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={700} className='mb-1'>
                    {sprint.title}
                  </Typography>
                  <div className='flex flex-wrap gap-2 mt-2'>
                    <Chip label={sprint.sprint_number} size='small' color='primary' variant='tonal' />
                    {sprint.batch?.name && (
                      <Chip label={sprint.batch.name} size='small' variant='tonal' />
                    )}
                  </div>
                </div>
                {/* Nilai besar */}
                <Box sx={{
                  minWidth: 72, height: 72, borderRadius: 3, flexShrink: 0,
                  bgcolor: isPlus ? 'success.main' : 'error.main',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Typography variant='h5' fontWeight={800} sx={{ color: '#fff', lineHeight: 1 }}>
                    {isPlus ? `+${indicatorVal}` : indicatorVal}
                  </Typography>
                  <Typography variant='caption' sx={{ color: '#ffffff99', fontSize: 10 }}>poin</Typography>
                </Box>
              </div>

              {/* Info rows */}
              <div className='flex flex-col gap-1.5 mb-3'>
                <div className='flex items-center gap-2'>
                  <i className='ri-calendar-event-line' style={{ color: theme.palette.text.secondary }} />
                  <Typography variant='body2' color='text.secondary'>
                    {fmtDate(sprint.event_date, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                  </Typography>
                </div>
                {sprint.location && (
                  <div className='flex items-center gap-2'>
                    <i className='ri-map-pin-line' style={{ color: theme.palette.text.secondary }} />
                    <Typography variant='body2' color='text.secondary'>{sprint.location}</Typography>
                  </div>
                )}
                <div className='flex items-center gap-2'>
                  <i className='ri-time-line' style={{ color: isDeadlinePassed ? theme.palette.error.main : theme.palette.text.secondary }} />
                  <Typography variant='body2' color={isDeadlinePassed ? 'error.main' : 'text.secondary'}>
                    Deadline: {fmtDate(sprint.submission_deadline)}
                    {canUpload && ` · ${daysLeft} hari lagi`}
                    {isDeadlinePassed && ' · Sudah lewat'}
                  </Typography>
                </div>
              </div>

              {/* Status + Kembali */}
              <div className='flex items-center justify-between gap-2 flex-wrap'>
                {participant && (
                  <Chip
                    label={approvalCfg.label}
                    color={approvalCfg.color}
                    variant='tonal'
                    icon={<i className={approvalCfg.icon} />}
                  />
                )}
                <Button variant='tonal' color='secondary' size='small'
                        startIcon={<i className='ri-arrow-left-line' />}
                        onClick={() => router.push('/nimen/my-sprints')}>
                  Kembali
                </Button>
              </div>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Alert Status Upload ── */}
        {isActive && (
          <Grid item xs={12}>
            {isBeforeEvent && (
              <Alert severity='info' icon={<i className='ri-time-line' />}>
                Pengumpulan dokumen dibuka setelah tanggal kegiatan{' '}
                (<strong>{fmtDate(sprint.event_date, { day: '2-digit', month: 'long', year: 'numeric' })}</strong>).
              </Alert>
            )}
            {canUpload && (
              <Alert severity='success' icon={<i className='ri-upload-cloud-line' />}>
                Pengumpulan dokumen <strong>sedang dibuka</strong> — deadline{' '}
                <strong>{fmtDate(sprint.submission_deadline)}</strong>
                {daysLeft > 0 && ` (${daysLeft} hari lagi)`}.
                <LinearProgress
                  variant='determinate'
                  value={Math.max(0, 100 - (msLeft / (deadline - eventDate)) * 100)}
                  color='success'
                  sx={{ mt: 1, borderRadius: 2, height: 4 }}
                />
              </Alert>
            )}
            {isDeadlinePassed && (
              <Alert severity='warning' icon={<i className='ri-lock-line' />}>
                Batas pengumpulan dokumen sudah lewat. Dokumen tidak bisa ditambah atau dihapus.
              </Alert>
            )}
          </Grid>
        )}

        {/* ── Dokumen Penunjang Sprint ── */}
        {attachments.length > 0 && (
          <Grid item xs={12} md={5}>
            <Card sx={{ height: '100%' }}>
              <CardHeader
                title='Dokumen Penunjang'
                subheader='Dilampirkan admin sebagai referensi'
                titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
                avatar={
                  <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: '#E0F9FC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className='ri-file-list-3-line' style={{ fontSize: 18, color: '#00CFE8' }} />
                  </Box>
                }
              />
              <Divider />
              <CardContent>
                <DocumentManager
                  documents={attachments}
                  onGetPresignedURL={handleAttachmentPresign}
                  canUpload={false}
                  canDelete={false}
                  emptyText='Tidak ada dokumen penunjang.'
                />
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* ── Dokumen Kamu ── */}
        <Grid item xs={12} md={attachments.length > 0 ? 7 : 12}>
          <Card>
            <CardHeader
              title='Dokumen Kamu'
              subheader={
                canUpload ? 'Upload bukti keikutsertaan kamu di sprint ini'
                  : isDeadlinePassed ? 'Batas waktu sudah lewat, tidak bisa upload'
                    : 'Pengumpulan belum dibuka'
              }
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
              avatar={
                <Box sx={{
                  width: 36, height: 36, borderRadius: 2,
                  bgcolor: canUpload ? '#E6F9EE' : '#F4F4F4',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <i className={canUpload ? 'ri-upload-cloud-2-line' : 'ri-lock-line'}
                     style={{ fontSize: 18, color: canUpload ? '#28C76F' : '#A8AAAE' }} />
                </Box>
              }
            />
            <Divider />
            <CardContent>
              <DocumentManager
                documents={myDocuments}
                onUpload={handleUpload}
                onDelete={handleDelete}
                onGetPresignedURL={handlePresign}
                canUpload={canUpload}
                canDelete={canUpload}
                uploadHint={canUpload ? `Deadline: ${fmtDate(sprint.submission_deadline)}` : ''}
                emptyText='Kamu belum mengupload dokumen apapun.'
              />
            </CardContent>
          </Card>
        </Grid>

      </Grid>

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

export default MySprintDetailView
