'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import { dashboardApi } from '@/libs/api/dashboardApi'

// ── Sprint status config ──────────────────────────────────────────────────────
const SPRINT_STATUS = [
  { key: 'draft_admin',      label: 'Draft Admin',      color: '#888780', bg: '#F1EFE8', status: 'DRAFT_ADMIN'      },
  { key: 'draft_pejabat',    label: 'Di Koordinator',   color: '#378ADD', bg: '#E6F1FB', status: 'DRAFT_PEJABAT'    },
  { key: 'review_submitted', label: 'Review Masuk',     color: '#1D9E75', bg: '#E1F5EE', status: 'REVIEW_SUBMITTED' },
  { key: 'approval_pending', label: 'Perlu Approval',   color: '#EF9F27', bg: '#FAEEDA', status: 'APPROVAL_PENDING' },
  { key: 'active',           label: 'Aktif Berjalan',   color: '#D4537E', bg: '#FBEAF0', status: 'ACTIVE'           },
]

const fmtDate = (str) => {
  if (!str) return '-'
  const d = new Date(str)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StudentCard({ label, badge, data, isMobile }) {
  return (
    <Card sx={{ borderRadius: 1 }}>
      <CardContent sx={{ pb: '14px !important', pt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant='body2' fontWeight={500}>{label}</Typography>
            <Chip label={badge} size='small' variant='tonal'
                  color={badge === 'S2' ? 'info' : 'success'} />
          </Box>
          <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={500}>{data?.total ?? 0}</Typography>
        </Box>
        <Divider sx={{ mb: 1 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant='caption' color='text.secondary'>Aktif</Typography>
            <Typography variant='body2' fontWeight={500} color='success.main'>{data?.active ?? 0}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant='caption' color='text.secondary'>Lulus</Typography>
            <Typography variant='body2' fontWeight={500} color='text.secondary'>{data?.graduated ?? 0}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant='caption' color='text.secondary'>Drop Out</Typography>
            <Typography variant='body2' fontWeight={500} color='error.main'>{data?.drop_out ?? 0}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

function SprintStatusCard({ data, onClickStatus }) {
  return (
    <Card sx={{ borderRadius: 1, height: '100%' }}>
      <CardHeader title='Status Sprint' titleTypographyProps={{ variant: 'body1', fontWeight: 500 }}
                  sx={{ pb: 1 }} />
      <Divider />
      <CardContent sx={{ pt: 1.5, pb: '14px !important' }}>
        {SPRINT_STATUS.map(s => (
          <Box key={s.key}
               onClick={() => onClickStatus(s.status)}
               sx={{
                 display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                 p: 1, mb: 0.75, borderRadius: 1, cursor: 'pointer',
                 bgcolor: s.bg, transition: 'opacity 0.15s',
                 '&:hover': { opacity: 0.8 },
                 '&:last-child': { mb: 0 },
               }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color, flexShrink: 0 }} />
              <Typography variant='caption' fontWeight={500} sx={{ color: s.color }}>{s.label}</Typography>
            </Box>
            <Typography variant='body2' fontWeight={500}>{data?.[s.key] ?? 0}</Typography>
          </Box>
        ))}
      </CardContent>
    </Card>
  )
}

function OnboardingCard({ count, onView }) {
  return (
    <Card sx={{ borderRadius: 1, height: '100%' }}>
      <CardHeader title='Onboarding Pending' titleTypographyProps={{ variant: 'body1', fontWeight: 500 }}
                  sx={{ pb: 1 }} />
      <Divider />
      <CardContent sx={{ pt: 2, pb: '14px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box sx={{
            width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
            bgcolor: count > 0 ? '#FAEEDA' : '#F1EFE8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Typography variant='h5' fontWeight={500} sx={{ color: count > 0 ? '#633806' : '#5F5E5A' }}>
              {count ?? 0}
            </Typography>
          </Box>
          <Box>
            <Typography variant='body2' fontWeight={500}>
              {count > 0 ? 'Registrasi menunggu' : 'Tidak ada pending'}
            </Typography>
            <Typography variant='caption' color='text.secondary'>Belum diproses admin</Typography>
          </Box>
        </Box>
        <Divider sx={{ mb: 1.5 }} />
        <Typography variant='caption' color='primary.main' sx={{ cursor: 'pointer' }} onClick={onView}>
          Lihat semua registrasi →
        </Typography>
      </CardContent>
    </Card>
  )
}

function RankingCard({ title, batchName, items, onViewAll }) {
  return (
    <Card sx={{ borderRadius: 1 }}>
      <CardHeader
        title={<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant='body1' fontWeight={500}>{title}</Typography>
            {batchName && (
              <Typography variant='caption' color='text.secondary'>{batchName}</Typography>
            )}
          </Box>
          <Typography variant='caption' color='primary.main' sx={{ cursor: 'pointer', flexShrink: 0 }}
                      onClick={onViewAll}>
            Lihat semua →
          </Typography>
        </Box>}
        sx={{ pb: 1 }}
      />
      <Divider />
      <CardContent sx={{ pt: 1, pb: '12px !important' }}>
        {!items || items.length === 0 ? (
          <Typography variant='caption' color='text.secondary'>Belum ada data ranking</Typography>
        ) : items.map((r, i) => (
          <Box key={r.student_id} sx={{
            display: 'flex', alignItems: 'center', gap: 1.5,
            py: 0.75, borderBottom: i < items.length - 1 ? '0.5px solid' : 'none',
            borderColor: 'divider',
          }}>
            <Typography variant='caption' fontWeight={500} color='text.secondary'
                        sx={{ width: 18, flexShrink: 0, textAlign: 'center' }}>
              {r.rank_position}
            </Typography>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant='body2' noWrap>{r.full_name}</Typography>
              <Typography variant='caption' color='text.secondary'>{r.nim}</Typography>
            </Box>
            <Typography variant='body2' fontWeight={500} color='success.main' sx={{ flexShrink: 0 }}>
              +{Number(r.total_value).toFixed(2)}
            </Typography>
          </Box>
        ))}
      </CardContent>
    </Card>
  )
}

function PunishmentCard({ title, badge, items, onViewAll }) {
  return (
    <Card sx={{ borderRadius: 1 }}>
      <CardHeader
        title={<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant='body1' fontWeight={500}>{title}</Typography>
            <Chip label={badge} size='small' variant='tonal'
                  color={badge === 'S2' ? 'info' : 'success'} />
          </Box>
          <Typography variant='caption' color='primary.main' sx={{ cursor: 'pointer', flexShrink: 0 }}
                      onClick={onViewAll}>
            Lihat semua →
          </Typography>
        </Box>}
        sx={{ pb: 1 }}
      />
      <Divider />
      <CardContent sx={{ pt: 1, pb: '12px !important' }}>
        {!items || items.length === 0 ? (
          <Typography variant='caption' color='text.secondary'>Belum ada data pelanggaran</Typography>
        ) : items.map((p, i) => (
          <Box key={`${p.student_id}-${i}`} sx={{
            display: 'flex', alignItems: 'flex-start', gap: 1,
            py: 0.75, borderBottom: i < items.length - 1 ? '0.5px solid' : 'none',
            borderColor: 'divider',
          }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant='body2' fontWeight={500} noWrap>{p.full_name}</Typography>
              <Typography variant='caption' color='error.main'>
                {p.punishment_type} · {p.duration_days} hari
              </Typography>
            </Box>
            <Typography variant='caption' color='text.secondary' sx={{ flexShrink: 0 }}>
              {fmtDate(p.event_date)}
            </Typography>
          </Box>
        ))}
      </CardContent>
    </Card>
  )
}

// ── Main View ─────────────────────────────────────────────────────────────────
export default function AdminDashboardView() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const router                = useRouter()
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('md'))
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })
  const showToast = useCallback((msg, severity = 'success') =>
    setToast({ open: true, message: msg, severity }), [])
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await dashboardApi.getAdminSummary()
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* ── Section: Mahasiswa ── */}
      <Box>
        <Typography variant='caption' color='text.secondary'
                    sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 1 }}>
          Mahasiswa
        </Typography>
        <Grid container spacing={isMobile ? 1.5 : 2}>
          <Grid item xs={12} sm={6}>
            <StudentCard label='Mahasiswa S1' badge='S1' data={data?.students?.s1} isMobile={isMobile} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <StudentCard label='Mahasiswa S2' badge='S2' data={data?.students?.s2} isMobile={isMobile} />
          </Grid>
        </Grid>
      </Box>

      {/* ── Section: Sprint & Onboarding ── */}
      <Box>
        <Typography variant='caption' color='text.secondary'
                    sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 1 }}>
          Sprint & Onboarding
        </Typography>
        <Grid container spacing={isMobile ? 1.5 : 2}>
          <Grid item xs={12} sm={6}>
            <SprintStatusCard
              data={data?.sprints}
              onClickStatus={(status) => router.push(`/nimen/sprints?status=${status}`)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <OnboardingCard
              count={data?.onboarding_pending}
              onView={() => router.push('/onboarding')}
            />
          </Grid>
        </Grid>
      </Box>

      {/* ── Section: Peringkat Teratas ── */}
      <Box>
        <Typography variant='caption' color='text.secondary'
                    sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 1 }}>
          Peringkat Teratas (Angkatan Aktif)
        </Typography>
        <Grid container spacing={isMobile ? 1.5 : 2}>
          <Grid item xs={12} sm={6}>
            <RankingCard
              title='Top 5 S1'
              batchName={data?.active_batch_s1?.name}
              items={data?.top_rankings_s1}
              onViewAll={() => router.push('/ranking')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <RankingCard
              title='Top 5 S2'
              batchName={data?.active_batch_s2?.name}
              items={data?.top_rankings_s2}
              onViewAll={() => router.push('/ranking')}
            />
          </Grid>
        </Grid>
      </Box>

      {/* ── Section: Pelanggaran Terbaru ── */}
      <Box>
        <Typography variant='caption' color='text.secondary'
                    sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 1 }}>
          Pelanggaran Terbaru
        </Typography>
        <Grid container spacing={isMobile ? 1.5 : 2}>
          <Grid item xs={12} sm={6}>
            <PunishmentCard
              title='Pelanggaran S1' badge='S1'
              items={data?.recent_punishments_s1}
              onViewAll={() => router.push('/violation')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <PunishmentCard
              title='Pelanggaran S2' badge='S2'
              items={data?.recent_punishments_s2}
              onViewAll={() => router.push('/violation')}
            />
          </Grid>
        </Grid>
      </Box>

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
