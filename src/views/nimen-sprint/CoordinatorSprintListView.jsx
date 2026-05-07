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

// ── Mobile Card — PWA native ─────────────────────────────────────────────────
const SprintMobileCard = ({ sprint, isDone, onReview }) => (
  <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', overflow: 'hidden', mb: '10px' }}>
    <Box sx={{ px: 2, py: '10px', borderBottom: '0.5px solid rgba(180,100,100,0.1)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#EB3D47', mb: '2px' }}>{sprint.sprint_number}</Typography>
        <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#3B1010', lineHeight: 1.3 }} noWrap>{sprint.title}</Typography>
        {sprint.location && <Typography sx={{ fontSize: '10px', color: '#9A5A5A' }}><i className='ri-map-pin-line' /> {sprint.location}</Typography>}
      </Box>
      <Box sx={{ bgcolor: '#FAEEDA', borderRadius: '6px', px: '8px', py: '3px', flexShrink: 0 }}>
        <Typography sx={{ fontSize: '10px', fontWeight: 500, color: '#BA7517' }}>{sprint.batch?.name || '—'}</Typography>
      </Box>
    </Box>
    <Box sx={{ px: 2, py: '8px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', borderBottom: '0.5px solid rgba(180,100,100,0.1)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <i className='ri-calendar-line' style={{ fontSize: '11px', color: '#9A5A5A' }} />
        <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>{fmtDate(sprint.event_date)}</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <i className='ri-group-line' style={{ fontSize: '11px', color: '#9A5A5A' }} />
        <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>{sprint.participant_quota} peserta</Typography>
      </Box>
    </Box>
    <Box sx={{ px: 2, py: '10px' }}>
      {isDone ? (
        <Box component='button' onClick={() => onReview(sprint.id)} sx={{ width: '100%', py: '7px', borderRadius: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.72)', border: '0.5px solid rgba(180,100,100,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
          <i className='ri-eye-line' style={{ fontSize: '13px', color: '#185FA5' }} />
          <Typography sx={{ fontSize: '12px', fontWeight: 500, color: '#3B1010' }}>Lihat Hasil Review</Typography>
        </Box>
      ) : (
        <Box component='button' onClick={() => onReview(sprint.id)} sx={{ width: '100%', py: '7px', borderRadius: '9px', cursor: 'pointer', border: 'none', background: 'linear-gradient(145deg, #E63946, #6D0E13)', boxShadow: '0 3px 8px rgba(180,0,30,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
          <i className='ri-edit-box-line' style={{ fontSize: '13px', color: '#fff' }} />
          <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>Review Peserta</Typography>
        </Box>
      )}
    </Box>
  </Box>
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

  useVisibilityRefetch(fetchSprints)

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
      {/* Topbar PWA */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', mb: '14px' }}>
        <Box sx={{ width: 34, height: 34, borderRadius: '10px', background: 'rgba(255,255,255,0.72)', border: '0.5px solid rgba(180,100,100,0.18)', boxShadow: '0 3px 10px rgba(139,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', position: 'relative', overflow: 'hidden', '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)' } }} onClick={() => window.history.back()}>
          <i className='ri-arrow-left-s-line' style={{ fontSize: '20px', color: '#8B2020', position: 'relative', zIndex: 1 }} />
        </Box>
        <Box>
          <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>NIMEN</Typography>
          <Typography sx={{ fontSize: '16px', fontWeight: 500, color: '#3B1010' }}>Review Sprint</Typography>
        </Box>
      </Box>

      {/* Sprint perlu direview */}
      <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', overflow: 'hidden', mb: '10px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: '12px', borderBottom: '0.5px solid rgba(180,100,100,0.1)' }}>
          <Box>
            <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#3B1010' }}>Sprint Perlu Direview</Typography>
            <Typography sx={{ fontSize: '10px', color: '#9A5A5A' }}>Sprint yang dikirim admin — ubah peserta sebelum submit</Typography>
          </Box>
          {pendingSprints.length > 0 && (
            <Box sx={{ bgcolor: '#FAEEDA', borderRadius: '6px', px: '8px', py: '3px' }}>
              <Typography sx={{ fontSize: '10px', fontWeight: 600, color: '#BA7517' }}>{pendingSprints.length}</Typography>
            </Box>
          )}
        </Box>
        {renderContent(pendingSprints, false)}
      </Box>

      {/* Sprint sudah direview */}
      {(loading || doneSprints.length > 0) && (
        <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
          <Box sx={{ px: 2, py: '12px', borderBottom: '0.5px solid rgba(180,100,100,0.1)' }}>
            <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#3B1010' }}>Sudah Direview</Typography>
            <Typography sx={{ fontSize: '10px', color: '#9A5A5A' }}>Sprint yang sudah disubmit — hanya bisa dilihat</Typography>
          </Box>
          {renderContent(doneSprints, true)}
        </Box>
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
