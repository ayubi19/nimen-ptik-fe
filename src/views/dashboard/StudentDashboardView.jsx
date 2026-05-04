'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
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
import { dashboardApi } from '@/libs/api/dashboardApi'

const fmtDate = (str) => {
  if (!str) return '-'
  return new Date(str).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

const SPRINT_STATUS_LABEL = {
  ACTIVE:           { label: 'Aktif',   color: 'success' },
  APPROVAL_PENDING: { label: 'Approval', color: 'warning' },
  CLOSED:           { label: 'Selesai', color: 'default' },
}

const APPROVAL_STATUS_LABEL = {
  PENDING:   { label: 'Menunggu', color: 'warning' },
  VALID:     { label: 'Valid',    color: 'success' },
  REJECTED:  { label: 'Ditolak', color: 'error'   },
  DISPENSED: { label: 'Dispensi', color: 'info'   },
}

const SUBMISSION_STATUS_LABEL = {
  PENDING:  { label: 'Pending',   color: 'warning' },
  APPROVED: { label: 'Disetujui', color: 'success' },
  REJECTED: { label: 'Ditolak',  color: 'error'   },
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <Typography variant='caption' color='text.secondary'
                sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 1 }}>
      {children}
    </Typography>
  )
}

function EmptyState({ message }) {
  return (
    <Typography variant='caption' color='text.secondary'
                sx={{ display: 'block', textAlign: 'center', py: 2 }}>
      {message}
    </Typography>
  )
}

function RankingCard({ ranking, isMobile, onView }) {
  if (!ranking) return (
    <Card sx={{ borderRadius: 1 }}>
      <CardContent>
        <EmptyState message='Data peringkat belum tersedia' />
      </CardContent>
    </Card>
  )

  const pct = ranking.max_value > 0
    ? Math.min((ranking.total_value / ranking.max_value) * 100, 100)
    : 0

  const rankColor = ranking.rank_position <= 3 ? 'success' : ranking.rank_position <= 10 ? 'warning' : 'error'
  const rankBg    = rankColor === 'success' ? '#EAF3DE' : rankColor === 'warning' ? '#FAEEDA' : '#FCEBEB'
  const rankText  = rankColor === 'success' ? '#27500A' : rankColor === 'warning' ? '#633806' : '#791F1F'

  return (
    <Card sx={{ borderRadius: 1 }}>
      <CardContent sx={{ pb: '14px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 1.5 : 2 }}>
          <Box sx={{
            width: isMobile ? 56 : 68, height: isMobile ? 56 : 68,
            borderRadius: '50%', bgcolor: rankBg, flexShrink: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <Typography sx={{ fontSize: 9, fontWeight: 500, color: rankText }}>PERINGKAT</Typography>
            <Typography sx={{ fontSize: isMobile ? 20 : 24, fontWeight: 500, color: rankText, lineHeight: 1.1 }}>
              {ranking.rank_position}
            </Typography>
            <Typography sx={{ fontSize: 9, color: rankText }}>dari {ranking.total_students}</Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.5 }}>
              <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={500}>
                {Number(ranking.total_value).toFixed(2)}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                / {Number(ranking.max_value).toFixed(0)} poin
              </Typography>
            </Box>
            <LinearProgress variant='determinate' value={pct}
                            color={rankColor === 'success' ? 'success' : rankColor === 'warning' ? 'warning' : 'error'}
                            sx={{ height: 8, borderRadius: 4, mb: 0.5 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant='caption' color='text.secondary'>0</Typography>
              <Typography variant='caption' color='text.secondary'>{pct.toFixed(1)}% dari maksimum</Typography>
            </Box>
          </Box>
          <Typography variant='caption' color='primary.main' sx={{ cursor: 'pointer', flexShrink: 0 }}
                      onClick={onView}>
            Detail →
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

function SprintHistoryCard({ items, isMobile, onView }) {
  return (
    <Card sx={{ borderRadius: 1, height: '100%' }}>
      <CardHeader title='Riwayat Sprint'
                  titleTypographyProps={{ variant: 'body1', fontWeight: 500 }}
                  action={<Typography variant='caption' color='primary.main'
                                      sx={{ cursor: 'pointer', mt: 0.5, display: 'block' }}
                                      onClick={onView}>Lihat semua →</Typography>}
                  sx={{ pb: 1 }} />
      <Divider />
      <CardContent sx={{ pt: 1, pb: '12px !important' }}>
        {!items || items.length === 0
          ? <EmptyState message='Belum ada riwayat sprint' />
          : items.map((s, i) => {
            const approval = APPROVAL_STATUS_LABEL[s.approval_status] || { label: s.approval_status, color: 'default' }
            return (
              <Box key={s.sprint_id} sx={{
                py: 0.75, borderBottom: i < items.length - 1 ? '0.5px solid' : 'none',
                borderColor: 'divider',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant='body2' fontWeight={500} noWrap>{s.title}</Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Kegiatan: {fmtDate(s.submission_deadline)}
                    </Typography>
                  </Box>
                  <Chip label={approval.label} color={approval.color} size='small' variant='tonal'
                        sx={{ flexShrink: 0 }} />
                </Box>

              </Box>
            )
          })}
      </CardContent>
    </Card>
  )
}

function SelfSubmissionCard({ items, isMobile, onView }) {
  return (
    <Card sx={{ borderRadius: 1, height: '100%' }}>
      <CardHeader title='Pengajuan Mandiri'
                  titleTypographyProps={{ variant: 'body1', fontWeight: 500 }}
                  action={<Typography variant='caption' color='primary.main'
                                      sx={{ cursor: 'pointer', mt: 0.5, display: 'block' }}
                                      onClick={onView}>Lihat semua →</Typography>}
                  sx={{ pb: 1 }} />
      <Divider />
      <CardContent sx={{ pt: 1, pb: '12px !important' }}>
        {!items || items.length === 0
          ? <EmptyState message='Belum ada pengajuan mandiri' />
          : items.map((s, i) => {
            const status = SUBMISSION_STATUS_LABEL[s.status] || { label: s.status, color: 'default' }
            return (
              <Box key={s.id} sx={{
                display: 'flex', alignItems: 'center', gap: 1,
                py: 0.75, borderBottom: i < items.length - 1 ? '0.5px solid' : 'none',
                borderColor: 'divider',
              }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant='body2' fontWeight={500} noWrap>{s.indicator_name}</Typography>
                  <Typography variant='caption' color='text.secondary'>{fmtDate(s.event_date)}</Typography>
                </Box>
                <Chip label={status.label} color={status.color} size='small' variant='tonal'
                      sx={{ flexShrink: 0 }} />
              </Box>
            )
          })}
      </CardContent>
    </Card>
  )
}

function PunishmentsCard({ items, isMobile, onView }) {
  return (
    <Card sx={{ borderRadius: 1 }}>
      <CardHeader title='Riwayat Pelanggaran'
                  titleTypographyProps={{ variant: 'body1', fontWeight: 500 }}
                  action={<Typography variant='caption' color='primary.main'
                                      sx={{ cursor: 'pointer', mt: 0.5, display: 'block' }}
                                      onClick={onView}>Lihat semua →</Typography>}
                  sx={{ pb: 1 }} />
      <Divider />
      <CardContent sx={{ pt: 1, pb: '12px !important' }}>
        {!items || items.length === 0
          ? <EmptyState message='Tidak ada riwayat pelanggaran' />
          : items.map((p, i) => (
            <Box key={p.id} sx={{
              display: 'flex', alignItems: isMobile ? 'flex-start' : 'center',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 0.5 : 1,
              py: 0.75, borderBottom: i < items.length - 1 ? '0.5px solid' : 'none',
              borderColor: 'divider',
            }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant='body2' fontWeight={500}>{p.punishment_type}</Typography>
                <Typography variant='caption' color='text.secondary' noWrap>
                  {p.indicator_name} · {p.duration_days} hari
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                <Typography variant='caption' color='text.secondary'>{fmtDate(p.event_date)}</Typography>
                <Chip
                  label={p.is_active ? 'Aktif' : 'Selesai'}
                  color={p.is_active ? 'error' : 'default'}
                  size='small' variant='tonal'
                />
              </Box>
            </Box>
          ))}
      </CardContent>
    </Card>
  )
}

function CoordinatorCard({ title, items, isMobile, onView, emptyMessage, statusKey }) {
  return (
    <Card sx={{ borderRadius: 1, height: '100%' }}>
      <CardHeader title={title}
                  titleTypographyProps={{ variant: 'body1', fontWeight: 500 }}
                  action={<Typography variant='caption' color='primary.main'
                                      sx={{ cursor: 'pointer', mt: 0.5, display: 'block' }}
                                      onClick={onView}>Lihat →</Typography>}
                  sx={{ pb: 1 }} />
      <Divider />
      <CardContent sx={{ pt: 1, pb: '12px !important' }}>
        {!items || items.length === 0
          ? <EmptyState message={emptyMessage} />
          : items.map((s, i) => (
            <Box key={s.sprint_id} sx={{
              display: 'flex', alignItems: 'center', gap: 1,
              py: 0.75, borderBottom: i < items.length - 1 ? '0.5px solid' : 'none',
              borderColor: 'divider',
            }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant='body2' fontWeight={500} noWrap>{s.title}</Typography>
                <Typography variant='caption' color='text.secondary'>
                  {statusKey === 'pending'
                    ? `Dikirim: ${fmtDate(s.sent_at)}`
                    : `Submit: ${fmtDate(s.submitted_at)}`}
                </Typography>
              </Box>
              <Chip
                label={statusKey === 'pending' ? 'Pending' : 'Submitted'}
                color={statusKey === 'pending' ? 'info' : 'success'}
                size='small' variant='tonal'
                sx={{ flexShrink: 0 }}
              />
            </Box>
          ))}
      </CardContent>
    </Card>
  )
}

// ── Main View ─────────────────────────────────────────────────────────────────
export default function StudentDashboardView({ hasPosition }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast]     = useState({ open: false, message: '', severity: 'success' })
  const router                = useRouter()
  const isMobile              = useMediaQuery(theme => theme.breakpoints.down('md'))

  const showToast = useCallback((msg, severity = 'success') =>
    setToast({ open: true, message: msg, severity }), [])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await dashboardApi.getStudentSummary()
      setData(res.data.data)
    } catch {
      showToast('Gagal memuat data dashboard', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  const spacing = isMobile ? 1.5 : 2

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* ── Peringkat ── */}
      <Box>
        <SectionLabel>Peringkat Saya</SectionLabel>
        <RankingCard
          ranking={data?.ranking}
          isMobile={isMobile}
          onView={() => router.push('/ranking')}
        />
      </Box>

      {/* ── Aktivitas ── */}
      <Box>
        <SectionLabel>Aktivitas Saya</SectionLabel>
        <Grid container spacing={spacing}>
          <Grid item xs={12} sm={6}>
            <SprintHistoryCard
              items={data?.active_sprints}
              isMobile={isMobile}
              onView={() => router.push('/nimen/my-sprints')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <SelfSubmissionCard
              items={data?.self_submissions}
              isMobile={isMobile}
              onView={() => router.push('/nimen/self-submissions/my')}
            />
          </Grid>
        </Grid>
      </Box>

      {/* ── Pelanggaran — selalu tampil ── */}
      <Box>
        <SectionLabel>Pelanggaran Saya</SectionLabel>
        <PunishmentsCard
          items={data?.punishments}
          isMobile={isMobile}
          onView={() => router.push('/violation')}
        />
      </Box>

      {/* ── Koordinator — hanya jika has_position = true ── */}
      {hasPosition && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <SectionLabel>Tugas Koordinator</SectionLabel>
            <Chip label='Jabatan Aktif' size='small' color='info' variant='tonal'
                  sx={{ mb: 1, height: 18, fontSize: 10 }} />
          </Box>
          <Grid container spacing={spacing}>
            <Grid item xs={12} sm={6}>
              <CoordinatorCard
                title='Perlu Saya Review'
                items={data?.pending_reviews}
                isMobile={isMobile}
                onView={() => router.push('/nimen/sprints/coordinator-review')}
                emptyMessage='Tidak ada sprint yang perlu direview'
                statusKey='pending'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <CoordinatorCard
                title='Sudah Saya Submit'
                items={data?.submitted_reviews}
                isMobile={isMobile}
                onView={() => router.push('/nimen/sprints/coordinator-review')}
                emptyMessage='Belum ada yang disubmit'
                statusKey='submitted'
              />
            </Grid>
          </Grid>
        </Box>
      )}

      <Snackbar open={toast.open} autoHideDuration={4000}
                onClose={() => setToast(p => ({ ...p, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast.severity} onClose={() => setToast(p => ({ ...p, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>

    </Box>
  )
}
