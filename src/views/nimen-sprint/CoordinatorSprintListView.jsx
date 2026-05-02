'use client'

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
import Snackbar from '@mui/material/Snackbar'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { nimenSprintApi } from '@/libs/api/nimenSprintApi'

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—'

// ── Mobile Card ───────────────────────────────────────────────────────────────
const SprintMobileCard = ({ sprint, isDone, onReview }) => (
  <Card className='mb-3' variant='outlined'>
    <CardContent sx={{ p: '12px !important' }}>
      <div className='flex items-start justify-between gap-2 mb-2'>
        <div className='flex-1 min-w-0'>
          <Typography variant='body2' fontWeight={700} color='primary.main'>
            {sprint.sprint_number}
          </Typography>
          <Typography variant='body2' fontWeight={600} noWrap>{sprint.title}</Typography>
          {sprint.location && (
            <Typography variant='caption' color='text.secondary'>
              <i className='ri-map-pin-line mr-1' />{sprint.location}
            </Typography>
          )}
        </div>
        <Chip
          label={sprint.batch?.name || '—'}
          size='small' color='primary' variant='tonal'
          sx={{ flexShrink: 0 }}
        />
      </div>
      <div className='flex items-center gap-2 flex-wrap mb-2'>
        <Chip
          label={fmtDate(sprint.event_date)}
          size='small' variant='tonal'
          icon={<i className='ri-calendar-line' />}
        />
        <Chip
          label={`${sprint.participant_quota} peserta`}
          size='small' variant='tonal'
          icon={<i className='ri-group-line' />}
        />
      </div>
      <Divider className='mb-2' />
      {isDone ? (
        <Button fullWidth variant='tonal' color='secondary' size='small'
                startIcon={<i className='ri-eye-line' />}
                onClick={() => onReview(sprint.id)}>
          Lihat Hasil Review
        </Button>
      ) : (
        <Button fullWidth variant='contained' color='warning' size='small'
                startIcon={<i className='ri-edit-box-line' />}
                onClick={() => onReview(sprint.id)}>
          Review Peserta
        </Button>
      )}
    </CardContent>
  </Card>
)

// ── Desktop Table ─────────────────────────────────────────────────────────────
const SprintDesktopTable = ({ sprints, isDone, onReview }) => (
  <Table>
    <TableHead>
      <TableRow sx={{ bgcolor: 'action.hover' }}>
        {['No. Sprint', 'Kegiatan', 'Angkatan', 'Tanggal', 'Kuota', 'Aksi'].map(h => (
          <TableCell key={h} sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
            {h}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
    <TableBody>
      {sprints.map(sprint => (
        <TableRow key={sprint.id} hover>
          <TableCell>
            <Typography variant='body2' fontWeight={600} color='primary.main'>
              {sprint.sprint_number}
            </Typography>
          </TableCell>
          <TableCell>
            <Typography variant='body2' fontWeight={600}>{sprint.title}</Typography>
            {sprint.location && (
              <Typography variant='caption' color='text.secondary'>
                <i className='ri-map-pin-line mr-1' />{sprint.location}
              </Typography>
            )}
          </TableCell>
          <TableCell>
            <Chip label={sprint.batch?.name || '—'} size='small' color='primary' variant='tonal' />
          </TableCell>
          <TableCell>
            <Typography variant='body2'>{fmtDate(sprint.event_date)}</Typography>
          </TableCell>
          <TableCell>
            <Chip label={`${sprint.participant_quota} peserta`} size='small' variant='tonal' />
          </TableCell>
          <TableCell align='center'>
            {isDone ? (
              <Tooltip title='Sudah disubmit oleh koordinator lain'>
                <span>
                  <Button variant='tonal' size='small' color='secondary'
                          startIcon={<i className='ri-eye-line' />}
                          onClick={() => onReview(sprint.id)}>
                    Lihat
                  </Button>
                </span>
              </Tooltip>
            ) : (
              <Button variant='contained' size='small' color='warning'
                      startIcon={<i className='ri-edit-box-line' />}
                      onClick={() => onReview(sprint.id)}>
                Review Peserta
              </Button>
            )}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
)

// ── Main View ─────────────────────────────────────────────────────────────────
const CoordinatorSprintListView = () => {
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [pendingSprints, setPendingSprints] = useState([])
  const [doneSprints, setDoneSprints]       = useState([])
  const [loading, setLoading]               = useState(true)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const showToast = useCallback((msg, severity = 'success') =>
    setToast({ open: true, message: msg, severity }), [])

  const fetchSprints = useCallback(async () => {
    setLoading(true)
    try {
      const [pendingRes, doneRes] = await Promise.all([
        nimenSprintApi.getAll({ status: 'DRAFT_PEJABAT',     as_coordinator: true }),
        nimenSprintApi.getAll({ status: 'REVIEW_SUBMITTED',  as_coordinator: true }),
      ])
      setPendingSprints(pendingRes.data.data?.data || [])
      setDoneSprints(doneRes.data.data?.data || [])
    } catch (err) {
      showToast(err.message || 'Gagal memuat data', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { fetchSprints() }, [fetchSprints])

  // Refetch saat halaman mendapat fokus kembali atau navigasi dari notifikasi
  const pathname = usePathname()
  useEffect(() => {
    const onFocus = () => fetchSprints()
    const onVisible = () => { if (document.visibilityState === 'visible') fetchSprints() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [fetchSprints])

  useEffect(() => { fetchSprints() }, [pathname, fetchSprints])

  const handleReview = useCallback((id) => {
    router.push(`/nimen/sprints/${id}/coordinator-review`)
  }, [router])

  const renderContent = (sprints, isDone) => {
    if (loading) return <Box className='flex justify-center py-10'><CircularProgress /></Box>
    if (sprints.length === 0) return (
      <Box className='flex flex-col items-center py-10 gap-2' sx={{ color: 'text.secondary' }}>
        <i className='ri-checkbox-circle-line text-5xl opacity-30' />
        <Typography variant='body2'>
          {isDone ? 'Belum ada sprint yang sudah direview' : 'Tidak ada sprint yang perlu direview saat ini'}
        </Typography>
        {!isDone && (
          <Typography variant='caption'  sx={{ textAlign: 'center', maxWidth: '280px', wordBreak: 'break-word'
          }}>Admin akan mengirim notifikasi Telegram saat ada sprint baru</Typography>
        )}
      </Box>
    )
    if (isMobile) return (
      <Box sx={{ p: 2 }}>
        {sprints.map(s => (
          <SprintMobileCard key={s.id} sprint={s} isDone={isDone} onReview={handleReview} />
        ))}
      </Box>
    )
    return <SprintDesktopTable sprints={sprints} isDone={isDone} onReview={handleReview} />
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className='flex items-center gap-2 mb-6'>
        <Typography variant='caption' color='text.secondary'>NIMEN</Typography>
        <i className='ri-arrow-right-s-line text-sm opacity-50' />
        <Typography variant='caption' fontWeight={500} color='text.primary'>Review Sprint</Typography>
      </div>

      {/* Sprint perlu direview */}
      <Card className='mb-6'>
        <CardHeader
          title='Sprint Perlu Direview'
          subheader='Sprint yang dikirim admin kepadamu — kamu bisa mengubah daftar peserta sebelum submit'
          action={pendingSprints.length > 0 && (
            <Chip label={pendingSprints.length} color='warning' size='small' />
          )}
        />
        <Divider />
        {renderContent(pendingSprints, false)}
      </Card>

      {/* Sprint sudah direview */}
      {(loading || doneSprints.length > 0) && (
        <Card>
          <CardHeader
            title='Sudah Direview'
            subheader='Sprint ini sudah disubmit oleh salah satu koordinator — kamu hanya bisa melihat hasilnya'
          />
          <Divider />
          {renderContent(doneSprints, true)}
        </Card>
      )}

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

export default CoordinatorSprintListView
