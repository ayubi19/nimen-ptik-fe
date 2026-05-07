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
      p:            2.5,
      color:        '#fff',
      position:     'relative',
      overflow:     'hidden',
    }}>
      {/* Decorative circles */}
      <Box sx={{ position: 'absolute', top: -20, right: 15, width: 90, height: 90, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.10)' }} />
      <Box sx={{ position: 'absolute', bottom: -15, right: 50, width: 60, height: 60, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.07)' }} />

      {/* Baris 1: Greeting */}
      <Typography sx={{ fontSize: '12px', fontWeight: 400, color: 'rgba(255,255,255,0.7)', mb: 0.5 }}>
        {greeting} 🫡
      </Typography>

      {/* Baris 2: Nama */}
      <Typography sx={{ fontSize: '20px', fontWeight: 700, lineHeight: 1.2, color: '#fff', mb: 1 }}>
        {name || 'Mahasiswa'}
      </Typography>

      {/* Baris 3: Badge angkatan + sindikat */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mb: 1 }}>
        {batchName && (
          <Chip label={batchName} size='small' sx={{
            height: 20, fontSize: '10px', fontWeight: 600,
            bgcolor: 'rgba(255,255,255,0.18)', color: '#fff',
            border: '1px solid rgba(255,255,255,0.3)',
          }} />
        )}
        {syndicateName && (
          <Chip label={syndicateName} size='small' sx={{
            height: 20, fontSize: '10px', fontWeight: 500,
            bgcolor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(255,255,255,0.2)',
          }} />
        )}
      </Box>

      {/* Divider */}
      <Box sx={{ width: '100%', height: '0.5px', bgcolor: 'rgba(255,255,255,0.2)', mb: 1 }} />

      {/* Baris 4: Badge role + NIM + notif badge */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip label={role} size='small' sx={{
            height: 20, fontSize: '10px', fontWeight: 700,
            bgcolor: 'rgba(255,255,255,0.25)', color: '#fff',
            border: '1px solid rgba(255,255,255,0.4)',
          }} />
          {nim && (
            <Typography sx={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', fontWeight: 400 }}>
              {nim}
            </Typography>
          )}
        </Box>
        {unread > 0 && (
          <Box sx={{ bgcolor: '#fff', borderRadius: 1, px: 1.5, py: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
function QuickAction({ svgKey, label, onClick, badge, variant = 'glass' }) {
  const isGlass   = variant === 'glass'
  const isCrystal = variant === 'crystal'

  const svgs = {
    mahasiswa:     '<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>',
    onboarding:    '<path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>',
    organisasi:    '<path d="M12 3L2 12h3v8h6v-5h2v5h6v-8h3L12 3zm0 12.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>',
    pengajuan:     '<path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>',
    peringkat:     '<path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>',
    pelanggaran:   '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>',
    nilaijabatan:  '<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>',
    manajuser:     '<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>',
    konfigurasi:   '<path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>',
    rekapnimen:    '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/>',
    notifikasi:    '<path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>',
    sindikat:      '<path d="M12 3L2 12h3v8h6v-5h2v5h6v-8h3L12 3z"/>',
    angkatan:      '<path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>',
    statusakademik:'<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>',
    kategorinilai: '<path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/>',
    variabel:      '<path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>',
    indikator:     '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/>',
    nimen:         '<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>',
    sprintsaya:    '<path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>',
    review:        '<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>',
    profil:        '<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>',
  }

  const iconFill = isCrystal ? 'rgba(255,255,255,0.92)' : '#8B2020'
  const iconBoxSx = isGlass ? {
    width: 52, height: 52, borderRadius: '14px', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(255,255,255,0.72)',
    border: '0.5px solid rgba(180,100,100,0.18)',
    boxShadow: '0 3px 10px rgba(139,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9)',
    position: 'relative', overflow: 'hidden',
    '&::before': {
      content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
      borderRadius: '14px 14px 0 0',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)',
      pointerEvents: 'none',
    },
  } : {
    width: 52, height: 52, borderRadius: '14px', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(145deg, #E63946, #6D0E13)',
    boxShadow: '0 5px 12px rgba(180,0,30,0.28), 0 2px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,180,180,0.45)',
    position: 'relative', overflow: 'hidden',
    '&::before': {
      content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
      borderRadius: '14px 14px 0 0',
      background: 'linear-gradient(180deg, rgba(255,200,200,0.32) 0%, transparent 100%)',
      pointerEvents: 'none',
    },
  }

  return (
    <Box onClick={onClick} sx={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75,
      cursor: 'pointer', position: 'relative',
      transition: 'transform 0.15s, opacity 0.15s',
      '&:active': { transform: 'scale(0.92)', opacity: 0.8 },
    }}>
      {badge > 0 && (
        <Box sx={{
          position: 'absolute', top: 0, right: 4, zIndex: 1,
          width: 16, height: 16, borderRadius: '50%',
          bgcolor: '#EB3D47', border: '1.5px solid #fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Typography sx={{ fontSize: '9px', fontWeight: 700, color: '#fff' }}>{badge > 9 ? '9+' : badge}</Typography>
        </Box>
      )}
      <Box sx={iconBoxSx}>
        <svg width="24" height="24" viewBox="0 0 24 24" style={{ position: 'relative', zIndex: 1 }}
             dangerouslySetInnerHTML={{ __html: `<path fill="${iconFill}" d="${(svgs[svgKey] || '').replace(/<path[^>]*d="([^"]*)"[^>]*>/,'$1')}"/>` }} />
      </Box>
      <Typography sx={{
        fontSize: '10px', fontWeight: 500, textAlign: 'center', lineHeight: 1.3,
        color: isCrystal ? '#7A1A1A' : '#3B1010',
      }}>
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
  const totalValue = ranking.total_value || 0
  const maxValue   = ranking.max_value   || 95
  const rank       = ranking.rank_position
  const total      = ranking.total_students || 0
  const pct        = Math.min((totalValue / maxValue) * 100, 100)

  const badgeBg = rank === 1 ? 'linear-gradient(135deg, #FFD700, #FFA500)'
    : rank === 2 ? 'linear-gradient(135deg, #C0C0C0, #A8A8A8)'
      : rank === 3 ? 'linear-gradient(135deg, #CD7F32, #A0522D)'
        : 'linear-gradient(135deg, #EB3D47, #8B0000)'

  const barColor = pct >= 70 ? '#EB3D47' : pct >= 50 ? '#EF9F27' : '#E24B4A'

  return (
    <Card onClick={onView} sx={{
      borderRadius: 1, cursor: 'pointer',
      background: 'linear-gradient(135deg, rgba(235,61,71,0.08) 0%, rgba(235,61,71,0.03) 100%)',
      border: '1px solid rgba(235,61,71,0.15)',
      '&:active': { opacity: 0.85 },
    }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          {/* Medal / Rank badge */}
          <Box sx={{
            width: 72, height: 72, borderRadius: 2, flexShrink: 0,
            background: badgeBg,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            boxShadow: 2,
          }}>
            {rank && rank <= 3 ? (
              <Typography sx={{ fontSize: 36, lineHeight: 1 }}>
                {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
              </Typography>
            ) : (
              <>
                <Typography sx={{ fontSize: '9px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                  PERINGKAT
                </Typography>
                <Typography sx={{ fontSize: '26px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                  {rank || '—'}
                </Typography>
                {total > 0 && (
                  <Typography sx={{ fontSize: '9px', color: 'rgba(255,255,255,0.7)' }}>
                    dari {total}
                  </Typography>
                )}
              </>
            )}
          </Box>

          {/* Info nilai */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant='body2' fontWeight={600} color='text.secondary' sx={{ mb: 0.5 }}>
              Peringkat Saya
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.5 }}>
              <Typography sx={{ fontSize: '22px', fontWeight: 800, color: '#EB3D47', lineHeight: 1 }}>
                {totalValue.toFixed(2)}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                / {maxValue.toFixed(0)} poin
              </Typography>
            </Box>
            {rank && rank <= 3 && (
              <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 0.5 }}>
                Peringkat {rank} dari {total} mahasiswa
              </Typography>
            )}
            {/* Progress bar */}
            <Box sx={{ mt: 1 }}>
              <Box sx={{
                height: 8, borderRadius: 4,
                bgcolor: 'rgba(0,0,0,0.08)',
                overflow: 'hidden',
              }}>
                <Box sx={{
                  height: '100%', borderRadius: 4,
                  width: `${pct}%`,
                  bgcolor: barColor,
                  transition: 'width 0.6s ease',
                }} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography variant='caption' color='text.secondary'>0</Typography>
                <Typography variant='caption' color='text.secondary' fontWeight={500}>
                  {pct.toFixed(1)}% dari maksimum
                </Typography>
              </Box>
            </Box>
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
    { svgKey: 'nimen',       label: 'NIMEN',       href: '/nimen',                             variant: 'glass' },
    { svgKey: 'sprintsaya',  label: 'Sprint Saya', href: '/nimen/my-sprints',                 variant: 'glass' },
    { svgKey: 'pengajuan',   label: 'Pengajuan',   href: '/nimen/self-submissions/my',        variant: 'glass' },
    { svgKey: 'peringkat',   label: 'Peringkat',   href: '/ranking',                          variant: 'glass' },
    { svgKey: 'pelanggaran', label: 'Pelanggaran', href: '/violation',                        variant: 'glass' },
    ...(hasPosition ? [
      { svgKey: 'review',    label: 'Review',      href: '/nimen/sprints/coordinator-review', variant: 'glass' },
    ] : []),
    { svgKey: 'profil',      label: 'Profil',      href: '/profile',                          variant: 'glass' },
    { svgKey: 'notifikasi',  label: 'Notifikasi',  href: '/notifications', badge: unread,     variant: 'glass' },
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

      {/* Quick Actions — tanpa background, icon glass di atas warm bg */}
      <Box sx={{ p: 0.5 }}>
        <Typography variant='caption' sx={{
          textTransform: 'uppercase', letterSpacing: '0.06em',
          mb: 1.5, display: 'block', color: '#9A5A5A', fontWeight: 700, fontSize: '10px',
        }}>
          Menu Lainnya
        </Typography>
        <Grid container spacing={1.5}>
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
    { svgKey: 'mahasiswa',    label: 'Mahasiswa',     href: '/students/list',          variant: 'glass' },
    { svgKey: 'onboarding',   label: 'Onboarding',    href: '/onboarding',             variant: 'glass' },
    { svgKey: 'organisasi',   label: 'Organisasi',    href: '/students/organization',  variant: 'glass' },
    { svgKey: 'pengajuan',    label: 'Pengajuan',     href: '/nimen/self-submissions', variant: 'glass' },
    { svgKey: 'peringkat',    label: 'Peringkat',     href: '/ranking',                variant: 'glass' },
    { svgKey: 'pelanggaran',  label: 'Pelanggaran',   href: '/violation',              variant: 'glass' },
    { svgKey: 'nilaijabatan', label: 'Nilai Jabatan', href: '/nimen/position-values',  variant: 'glass' },
    { svgKey: 'manajuser',    label: 'Manaj. User',   href: '/users',                  variant: 'glass' },
    { svgKey: 'konfigurasi',  label: 'Konfigurasi',   href: '/nimen/batch-config',     variant: 'glass' },
    { svgKey: 'rekapnimen',   label: 'Rekap NIMEN',   href: '/nimen',                  variant: 'glass' },
    { svgKey: 'notifikasi',   label: 'Notifikasi',    href: '/notifications', badge: unread, variant: 'glass' },
  ]

  const masterDataActions = [
    { svgKey: 'sindikat',       label: 'Sindikat',        href: '/master-data/syndicates',        variant: 'crystal' },
    { svgKey: 'angkatan',       label: 'Angkatan',        href: '/master-data/batches',           variant: 'crystal' },
    { svgKey: 'statusakademik', label: 'Status Akademik', href: '/master-data/academic-statuses', variant: 'crystal' },
    { svgKey: 'kategorinilai',  label: 'Kategori Nilai',  href: '/nimen/master-data/categories',  variant: 'crystal' },
    { svgKey: 'variabel',       label: 'Variabel',        href: '/nimen/master-data/variables',   variant: 'crystal' },
    { svgKey: 'indikator',      label: 'Indikator',       href: '/nimen/master-data/indicators',  variant: 'crystal' },
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
      {/* Quick actions — tanpa background, icon glass di atas warm bg */}
      <Box sx={{ p: 0.5 }}>
        <Typography variant='caption' sx={{
          textTransform: 'uppercase', letterSpacing: '0.06em',
          mb: 1.5, display: 'block', color: '#9A5A5A', fontWeight: 700, fontSize: '10px',
        }}>
          Menu Lainnya
        </Typography>
        <Grid container spacing={1.5}>
          {quickActions.map(a => (
            <Grid item xs={3} key={a.label}>
              <QuickAction {...a} onClick={() => router.push(a.href)} />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Master Data section — card rose tint, icon crystal red */}
      <Card sx={{ borderRadius: 1, bgcolor: '#FDF1F1', border: '0.5px solid #F5C6C6' }}>
        <CardContent sx={{ p: 2 }}>
          <Typography variant='caption' sx={{
            textTransform: 'uppercase', letterSpacing: '0.06em',
            mb: 1.5, display: 'block', color: '#A32D2D', fontWeight: 700, fontSize: '10px',
          }}>
            Master Data
          </Typography>
          <Grid container spacing={1.5}>
            {masterDataActions.map(a => (
              <Grid item xs={4} key={a.label}>
                <QuickAction {...a} onClick={() => router.push(a.href)} />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Sprint Terbaru — 5 sprint terakhir */}
      <Card sx={{ borderRadius: 1, bgcolor: '#FFFFFF', border: '0.5px solid #FFFFFF' }}>
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
