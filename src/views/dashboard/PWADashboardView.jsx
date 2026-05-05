'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import { dashboardApi } from '@/libs/api/dashboardApi'
import { notificationApi } from '@/libs/api/notificationApi'

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (str) => {
  if (!str) return '-'
  return new Date(str).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
}

const decodeJwt = (token) => {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch { return {} }
}

const getGreeting = () => {
  const h = new Date().getHours()
  if (h < 11) return 'Selamat pagi'
  if (h < 15) return 'Selamat siang'
  if (h < 18) return 'Selamat sore'
  return 'Selamat malam'
}

const SPRINT_STATUS_CONFIG = {
  DRAFT_ADMIN:      { label: 'Draft',       color: '#888780', bg: '#F1EFE8' },
  DRAFT_PEJABAT:    { label: 'Koordinator', color: '#378ADD', bg: '#E6F1FB' },
  REVIEW_SUBMITTED: { label: 'Review',      color: '#1D9E75', bg: '#E1F5EE' },
  APPROVAL_PENDING: { label: 'Approval',    color: '#EF9F27', bg: '#FAEEDA' },
  ACTIVE:           { label: 'Aktif',       color: '#D4537E', bg: '#FBEAF0' },
}

// ── Components ─────────────────────────────────────────────────────────────────

// Hero greeting card
function HeroCard({ name, role, unread, nim, syndicateName, batchName }) {
  const greeting = getGreeting()
  return (
    <Box sx={{
      borderRadius: 1,
      background:   'linear-gradient(135deg, #EB3D47 0%, #8B0000 100%)',
      p:            3,
      color:        '#fff',
      position:     'relative',
      overflow:     'hidden',
    }}>
      {/* Wave SVG decoration di kanan — mirip login page */}
      <Box sx={{ position: 'absolute', bottom: 0, right: -10, width: 150, height: '100%', opacity: 0.12 }}>
        <svg width="160" height="100%" viewBox="0 0 160 120" preserveAspectRatio="none" fill="none">
          <path d="M160 0 C100 20, 60 40, 80 70 C100 95, 140 85, 160 120 L160 0 Z" fill="white"/>
          <path d="M160 20 C110 35, 75 55, 90 80 C108 105, 148 100, 160 120 L160 20 Z" fill="white" opacity="0.5"/>
        </svg>
      </Box>
      {/* Decorative circle */}
      <Box sx={{
        position: 'absolute', top: -20, right: 15,
        width: 90, height: 90, borderRadius: '50%',
        bgcolor: 'rgba(255,255,255,0.12)',
      }} />

      {/* Content */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography sx={{ fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.3px' }}>
            {greeting} 🫡
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: '22px', fontWeight: 700, lineHeight: 1.2, color: '#FFFFFF' }}>
              {name || 'Mahasiswa'}
            </Typography>
            {batchName && (
              <Chip
                label={batchName}
                size='small'
                sx={{
                  height: 20, fontSize: '10px', fontWeight: 600,
                  bgcolor: 'rgba(255,255,255,0.2)', color: '#fff',
                  border: '1px solid rgba(255,255,255,0.35)',
                }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, flexWrap: 'wrap' }}>
            <Chip
              label={role}
              size='small'
              sx={{
                height: 22, fontSize: '11px', fontWeight: 700,
                bgcolor: 'rgba(255,255,255,0.25)', color: '#fff',
                border: '1px solid rgba(255,255,255,0.4)', letterSpacing: '0.3px',
              }}
            />
            {nim && (
              <Typography sx={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
                {nim}
              </Typography>
            )}
            {syndicateName && (
              <Typography sx={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)' }}>
                · {syndicateName}
              </Typography>
            )}
          </Box>
        </Box>
        {unread > 0 && (
          <Box sx={{
            bgcolor: '#fff', borderRadius: 1, px: 1.5, py: 0.5,
            display: 'flex', alignItems: 'center', gap: 0.5,
          }}>
            <i className='ri-notification-2-fill' style={{ fontSize: '14px', color: 'var(--mui-palette-primary-main)' }} />
            <Typography sx={{ fontSize: '12px', fontWeight: 700, color: 'var(--mui-palette-primary-main)' }}>
              {unread}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}

// Quick action grid item
function QuickAction({ icon, label, color, bg, onClick, badge }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        gap:            1,
        p:              1.5,
        borderRadius:   1,
        bgcolor:        bg || 'var(--mui-palette-background-paper)',
        cursor:         'pointer',
        position:       'relative',
        transition:     'transform 0.15s, opacity 0.15s',
        '&:active':     { transform: 'scale(0.94)', opacity: 0.8 },
      }}
    >
      {badge > 0 && (
        <Box sx={{
          position: 'absolute', top: 6, right: 6,
          width: 16, height: 16, borderRadius: '50%',
          bgcolor: 'error.main', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Typography sx={{ fontSize: '9px', fontWeight: 700, color: '#fff' }}>{badge > 9 ? '9+' : badge}</Typography>
        </Box>
      )}
      <Box sx={{
        width: 44, height: 44, borderRadius: 1, bgcolor: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${color}22`,
      }}>
        <i className={icon} style={{ fontSize: '22px', color }} />
      </Box>
      <Typography sx={{ fontSize: '11px', fontWeight: 500, textAlign: 'center', lineHeight: 1.3 }}>
        {label}
      </Typography>
    </Box>
  )
}


// Sprint recent item (admin)
function SprintRecentItem({ sprint, onClick }) {
  const cfg = SPRINT_STATUS_CONFIG[sprint.status] || { label: sprint.status, color: '#888780', bg: '#F1EFE8' }
  const fmtDate = (s) => s ? new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
  return (
    <Box onClick={onClick} sx={{
      display: 'flex', alignItems: 'center', gap: 1.5,
      py: 1.25, borderBottom: '0.5px solid', borderColor: 'divider',
      cursor: 'pointer', '&:last-child': { borderBottom: 'none', pb: 0 },
      '&:active': { opacity: 0.7 },
    }}>
      <Box sx={{
        width: 32, height: 32, borderRadius: 1, flexShrink: 0,
        bgcolor: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: cfg.color }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant='body2' fontWeight={500} noWrap>{sprint.title}</Typography>
        <Typography variant='caption' color='text.secondary'>
          {sprint.sprint_number} · {fmtDate(sprint.event_date)}
        </Typography>
      </Box>
      <Chip label={cfg.label} size='small' sx={{
        height: 20, fontSize: '10px', fontWeight: 600, flexShrink: 0,
        bgcolor: cfg.bg, color: cfg.color, border: 'none',
      }} />
    </Box>
  )
}

// Ranking card (student)
function RankingHeroCard({ ranking, onView }) {
  if (!ranking) return null
  const pct = ranking.max_value > 0 ? Math.min((ranking.total_value / ranking.max_value) * 100, 100) : 0
  const isTop3 = ranking.rank_position <= 3
  const isTop10 = ranking.rank_position <= 10

  return (
    <Card onClick={onView} sx={{ borderRadius: 1, cursor: 'pointer', '&:active': { opacity: 0.8 } }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          {/* Rank badge */}
          <Box sx={{
            width: 52, height: 52, borderRadius: 1, flexShrink: 0,
            bgcolor: isTop3 ? '#EAF3DE' : isTop10 ? '#FAEEDA' : '#FCEBEB',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <Typography sx={{
              fontSize: '20px', fontWeight: 800, lineHeight: 1,
              color: isTop3 ? '#27500A' : isTop10 ? '#633806' : '#791F1F',
            }}>
              #{ranking.rank_position}
            </Typography>
          </Box>
          {/* Info */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant='body2' fontWeight={600}>Peringkat Saya</Typography>
              <Typography variant='caption' color='text.secondary'>
                {Math.round(pct)}%
              </Typography>
            </Box>
            <LinearProgress
              variant='determinate' value={pct}
              sx={{
                height: 6, borderRadius: 3, mb: 0.5,
                bgcolor: 'action.hover',
                '& .MuiLinearProgress-bar': {
                  bgcolor: isTop3 ? 'success.main' : isTop10 ? 'warning.main' : 'error.main',
                  borderRadius: 3,
                }
              }}
            />
            <Typography variant='caption' color='text.secondary'>
              {ranking.total_value?.toFixed(1)} / {ranking.max_value?.toFixed(1)} poin
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

// Sprint item (student)
function SprintItem({ sprint, onClick }) {
  const isActive = sprint.sprint_status === 'ACTIVE'
  return (
    <Box onClick={onClick} sx={{
      display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5,
      borderBottom: '0.5px solid', borderColor: 'divider',
      cursor: 'pointer', '&:last-child': { borderBottom: 'none' },
      '&:active': { opacity: 0.7 },
    }}>
      <Box sx={{
        width: 36, height: 36, borderRadius: 1, flexShrink: 0,
        bgcolor: isActive ? '#E1F5EE' : 'action.hover',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <i className={isActive ? 'ri-calendar-check-fill' : 'ri-calendar-line'}
           style={{ fontSize: '18px', color: isActive ? '#1D9E75' : 'var(--mui-palette-text-secondary)' }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant='body2' fontWeight={500} noWrap>{sprint.title}</Typography>
        <Typography variant='caption' color='text.secondary'>
          {fmtDate(sprint.start_date)} – {fmtDate(sprint.end_date)}
        </Typography>
      </Box>
      <Chip
        label={isActive ? 'Aktif' : 'Selesai'}
        size='small'
        color={isActive ? 'success' : 'default'}
        variant='tonal'
        sx={{ flexShrink: 0 }}
      />
    </Box>
  )
}

// ── Student PWA Dashboard ─────────────────────────────────────────────────────
function StudentPWADashboard({ session, hasPosition }) {
  const router              = useRouter()
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        const [dash, notif] = await Promise.all([
          dashboardApi.getStudentSummary(),
          notificationApi.getUnreadCount(),
        ])
        setData(dash.data.data)
        setUnread(notif.data?.data?.unread_count ?? 0)
      } catch { /* silent */ }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const jwtPayload = session?.user?.accessToken ? decodeJwt(session.user.accessToken) : {}
  const name       = jwtPayload?.name || session?.user?.name || 'Mahasiswa'
  const roleLabel  = hasPosition ? 'Mahasiswa Pejabat' : 'Mahasiswa'

  // Quick actions student
  const quickActions = [
    { icon: 'ri-medal-line',        label: 'NIMEN',         color: '#EB3D47', bg: '#FCEBEB', href: '/nimen' },
    { icon: 'ri-calendar-check-line', label: 'Sprint Saya', color: '#378ADD', bg: '#E6F1FB', href: '/nimen/my-sprints' },
    { icon: 'ri-file-add-line',     label: 'Pengajuan',     color: '#1D9E75', bg: '#E1F5EE', href: '/nimen/self-submissions/my' },
    { icon: 'ri-bar-chart-line',    label: 'Peringkat',     color: '#EF9F27', bg: '#FAEEDA', href: '/ranking' },
    { icon: 'ri-error-warning-line', label: 'Pelanggaran',  color: '#A32D2D', bg: '#FCEBEB', href: '/violation' },
    ...(hasPosition ? [
      { icon: 'ri-edit-box-line',   label: 'Review',        color: '#534AB7', bg: '#EEEDFE', href: '/nimen/sprints/coordinator-review' },
    ] : []),
    { icon: 'ri-user-3-line',       label: 'Profil',        color: '#888780', bg: '#F1EFE8', href: '/profile' },
    { icon: 'ri-notification-2-line', label: 'Notifikasi',  color: '#D4537E', bg: '#FBEAF0', href: '/notifications', badge: unread },
  ]

  if (loading) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Skeleton variant='rounded' height={120} sx={{ borderRadius: 1 }} />
      <Skeleton variant='rounded' height={80} sx={{ borderRadius: 1 }} />
      <Grid container spacing={2}>
        {[...Array(6)].map((_, i) => <Grid item xs={3} key={i}><Skeleton variant='rounded' height={80} sx={{ borderRadius: 1 }} /></Grid>)}
      </Grid>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* Hero */}
      <HeroCard name={name} role={roleLabel} unread={unread} nim={data?.nim} syndicateName={data?.syndicate_name} batchName={data?.ranking?.batch_name} />

      {/* Peringkat */}
      {data?.ranking && (
        <RankingHeroCard ranking={data.ranking} onView={() => router.push('/ranking')} />
      )}

      {/* Quick Actions */}
      <Box>
        <Typography variant='caption' color='text.secondary'
                    sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', mb: 2, display: 'block' }}>
          Menu Lainnya
        </Typography>
        <Grid container spacing={2}>
          {quickActions.map(a => (
            <Grid item xs={3} key={a.label}>
              <QuickAction {...a} onClick={() => router.push(a.href)} />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Riwayat Sprint */}
      {data?.active_sprints?.length > 0 && (
        <Card sx={{ borderRadius: 1 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant='body2' fontWeight={600}>Riwayat Sprint</Typography>
              <Typography variant='caption' color='primary.main'
                          sx={{ cursor: 'pointer' }} onClick={() => router.push('/nimen/my-sprints')}>
                Lihat semua →
              </Typography>
            </Box>
            {data.active_sprints.slice(0, 3).map((s, i) => (
              <SprintItem key={i} sprint={s} onClick={() => router.push(`/nimen/my-sprints/${s.sprint_id || s.id}`)} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Pelanggaran aktif */}
      {data?.punishments?.filter(p => p.is_active)?.length > 0 && (() => {
        const activePunishment = data.punishments.find(p => p.is_active)
        const endDate = activePunishment?.end_date
          ? new Date(activePunishment.end_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
          : '-'
        return (
          <Card sx={{ borderRadius: 1, border: '1px solid', borderColor: 'error.light' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <i className='ri-error-warning-fill' style={{ fontSize: '18px', color: '#A32D2D' }} />
                <Typography variant='body2' fontWeight={600} color='error.main'>
                  Pelanggaran Aktif ({data.punishments.filter(p => p.is_active).length})
                </Typography>
              </Box>
              <Typography variant='caption' color='text.secondary'>
                Hukuman aktif hingga <strong>{endDate}</strong>. Selama periode ini, semua pengajuan nilai akan ditangguhkan dan tidak dihitung ke total nilaimu.
              </Typography>
              <Box onClick={() => router.push('/violation')} sx={{
                mt: 1.5, p: 1, borderRadius: 1, bgcolor: '#FCEBEB',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer',
              }}>
                <Typography variant='caption' fontWeight={600} color='error.main'>Lihat Detail Pelanggaran</Typography>
                <i className='ri-arrow-right-s-line' style={{ color: '#A32D2D' }} />
              </Box>
            </CardContent>
          </Card>
        )
      })()}

      {/* Koordinator section jika has_position */}
      {hasPosition && data?.pending_reviews?.length > 0 && (
        <Card sx={{ borderRadius: 1, border: '1px solid', borderColor: 'info.light' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <i className='ri-edit-box-fill' style={{ fontSize: '18px', color: '#378ADD' }} />
              <Typography variant='body2' fontWeight={600} color='info.main'>
                Perlu Review ({data.pending_reviews.length})
              </Typography>
            </Box>
            <Typography variant='caption' color='text.secondary'>
              Ada sprint yang menunggu review kamu sebagai koordinator.
            </Typography>
            <Box onClick={() => router.push('/nimen/sprints/coordinator-review')} sx={{
              mt: 1.5, p: 1, borderRadius: 1, bgcolor: '#E6F1FB',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer',
            }}>
              <Typography variant='caption' fontWeight={600} color='info.main'>Review Sekarang</Typography>
              <i className='ri-arrow-right-s-line' style={{ color: '#378ADD' }} />
            </Box>
          </CardContent>
        </Card>
      )}

    </Box>
  )
}

// ── Admin PWA Dashboard ───────────────────────────────────────────────────────
function AdminPWADashboard({ session }) {
  const router              = useRouter()
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        const [dash, notif] = await Promise.all([
          dashboardApi.getAdminSummary(),
          notificationApi.getUnreadCount(),
        ])
        setData(dash.data.data)
        setUnread(notif.data?.data?.unread_count ?? 0)
      } catch { /* silent */ }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const jwtPayload = session?.user?.accessToken ? decodeJwt(session.user.accessToken) : {}
  const name       = jwtPayload?.name || session?.user?.name || 'Admin'
  const isDev      = jwtPayload?.is_developer === true

  // Quick actions admin — semua menu yang tidak ada di bottom nav
  const quickActions = [
    { icon: 'ri-group-line',          label: 'Mahasiswa',       color: '#378ADD', bg: '#E6F1FB', href: '/students/list' },
    { icon: 'ri-user-add-line',       label: 'Onboarding',      color: '#1D9E75', bg: '#E1F5EE', href: '/onboarding' },
    { icon: 'ri-organization-chart',  label: 'Organisasi',      color: '#EF9F27', bg: '#FAEEDA', href: '/students/organization' },
    { icon: 'ri-file-check-line',     label: 'Pengajuan',       color: '#D4537E', bg: '#FBEAF0', href: '/nimen/self-submissions' },
    { icon: 'ri-bar-chart-line',      label: 'Peringkat',       color: '#534AB7', bg: '#EEEDFE', href: '/ranking' },
    { icon: 'ri-error-warning-line',  label: 'Pelanggaran',     color: '#A32D2D', bg: '#FCEBEB', href: '/violation' },
    { icon: 'ri-settings-3-line',     label: 'Konfigurasi',     color: '#185FA5', bg: '#E6F1FB', href: '/nimen/batch-config' },
    { icon: 'ri-medal-2-line',        label: 'Nilai Jabatan',   color: '#BA7517', bg: '#FAEEDA', href: '/nimen/position-values' },
    { icon: 'ri-shield-user-line',    label: 'Manaj. User',     color: '#993556', bg: '#FBEAF0', href: '/users' },
    { icon: 'ri-file-list-3-line',    label: 'Rekap NIMEN',     color: '#0F6E56', bg: '#E1F5EE', href: '/nimen' },
    { icon: 'ri-notification-2-line', label: 'Notifikasi',      color: '#EB3D47', bg: '#FCEBEB', href: '/notifications', badge: unread },
  ]

  const masterDataActions = [
    { icon: 'ri-team-line',           label: 'Sindikat',        color: '#D4537E', bg: '#FBEAF0', href: '/master-data/syndicates' },
    { icon: 'ri-graduation-cap-line', label: 'Angkatan',        color: '#D4537E', bg: '#FBEAF0', href: '/master-data/batches' },
    { icon: 'ri-checkbox-circle-line',label: 'Status Akademik', color: '#D4537E', bg: '#FBEAF0', href: '/master-data/academic-statuses' },
    { icon: 'ri-list-check-2',        label: 'Kategori Nilai',  color: '#D4537E', bg: '#FBEAF0', href: '/nimen/master-data/categories' },
    { icon: 'ri-calendar-2-line',     label: 'Variabel',        color: '#D4537E', bg: '#FBEAF0', href: '/nimen/master-data/variables' },
    { icon: 'ri-user-settings-line',  label: 'Indikator',       color: '#D4537E', bg: '#FBEAF0', href: '/nimen/master-data/indicators' },
  ]

  if (loading) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Skeleton variant='rounded' height={120} sx={{ borderRadius: 1 }} />
      <Grid container spacing={2}>
        {[...Array(4)].map((_, i) => <Grid item xs={6} key={i}><Skeleton variant='rounded' height={80} sx={{ borderRadius: 1 }} /></Grid>)}
      </Grid>
      <Skeleton variant='rounded' height={200} sx={{ borderRadius: 1 }} />
    </Box>
  )

  const s1 = data?.students?.s1
  const s2 = data?.students?.s2
  const totalStudents = (s1?.active ?? 0) + (s2?.active ?? 0)
  const sprintCounts  = data?.sprint_status_counts || {}
  const pendingOnboard = data?.pending_onboarding ?? 0

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* Hero */}
      <HeroCard name={name} role={isDev ? 'Developer' : 'Admin NIMEN'} unread={unread} />
      {/* Quick actions — menu operasional */}
      <Box>
        <Typography variant='caption' color='text.secondary'
                    sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', mb: 2, display: 'block' }}>
          Menu Lainnya
        </Typography>
        <Grid container spacing={2}>
          {quickActions.map(a => (
            <Grid item xs={3} key={a.label}>
              <QuickAction {...a} onClick={() => router.push(a.href)} />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Master Data section */}
      <Box sx={{ border: '0.5px solid', borderColor: '#EF9F27', borderRadius: 1, p: 2 }}>
        <Typography variant='caption' sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', mb: 2, display: 'block', color: '#854F0B', fontWeight: 600 }}>
          Master Data
        </Typography>
        <Grid container spacing={2}>
          {masterDataActions.map(a => (
            <Grid item xs={4} key={a.label}>
              <QuickAction {...a} onClick={() => router.push(a.href)} />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Sprint Terbaru — 5 sprint terakhir */}
      <Card sx={{ borderRadius: 1 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant='body2' fontWeight={600}>Sprint Terbaru</Typography>
            <Typography variant='caption' color='primary.main'
                        sx={{ cursor: 'pointer' }} onClick={() => router.push('/nimen/sprints')}>
              Lihat semua →
            </Typography>
          </Box>
          {data?.recent_sprints?.length > 0 ? (
            data.recent_sprints.map(s => (
              <SprintRecentItem
                key={s.id} sprint={s}
                onClick={() => router.push(`/nimen/sprints/${s.id}`)}
              />
            ))
          ) : (
            <Typography variant='caption' color='text.secondary'>Belum ada sprint yang dibuat.</Typography>
          )}
        </CardContent>
      </Card>



    </Box>
  )
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function PWADashboardView({ hasPosition, isAdmin }) {
  const { data: session } = useSession()

  return isAdmin
    ? <AdminPWADashboard session={session} />
    : <StudentPWADashboard session={session} hasPosition={hasPosition} />
}
