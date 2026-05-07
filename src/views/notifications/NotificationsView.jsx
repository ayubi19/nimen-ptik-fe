'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Snackbar from '@mui/material/Snackbar'
import TablePagination from '@mui/material/TablePagination'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { notificationApi } from '@/libs/api/notificationApi'

const getNotifUrl = (type, refId) => {
  switch (type) {
    case 'SELF_SUBMISSION_NEW':      return '/nimen/self-submissions'
    case 'ONBOARDING_NEW':           return '/onboarding'
    case 'SELF_SUBMISSION_APPROVED': return '/nimen/self-submissions/my'
    case 'SELF_SUBMISSION_REJECTED': return '/nimen/self-submissions/my'
    case 'SPRINT_CREATED':           return refId ? `/nimen/sprints/${refId}` : '/nimen/sprints'
    case 'SPRINT_ACTIVE':            return refId ? `/nimen/my-sprints/${refId}` : '/nimen/my-sprints'
    case 'SPRINT_APPROVED':          return '/ranking'
    case 'SPRINT_REJECTED':          return refId ? `/nimen/sprints/${refId}` : '/nimen/sprints'
    case 'SPRINT_SENT_TO_COORD':     return refId ? `/nimen/sprints/${refId}/coordinator-review` : '/nimen/sprints/coordinator-review'
    case 'SPRINT_COORD_SUBMITTED':   return refId ? `/nimen/sprints/${refId}` : '/nimen/sprints'
    case 'ONBOARDING_APPROVED':      return '/dashboard'
    case 'ONBOARDING_REJECTED':      return '/dashboard'
    case 'VIOLATION_CREATED':        return '/violation'
    default:                         return null
  }
}

const TYPE_CONFIG = {
  SELF_SUBMISSION_NEW:      { icon: 'ri-file-add-line',        color: 'primary' },
  SELF_SUBMISSION_APPROVED: { icon: 'ri-checkbox-circle-line', color: 'success' },
  SELF_SUBMISSION_REJECTED: { icon: 'ri-close-circle-line',    color: 'error'   },
  SPRINT_CREATED:           { icon: 'ri-file-list-3-line',     color: 'primary' },
  SPRINT_ACTIVE:            { icon: 'ri-run-line',             color: 'warning' },
  SPRINT_APPROVED:          { icon: 'ri-medal-line',           color: 'success' },
  SPRINT_REJECTED:          { icon: 'ri-close-circle-line',    color: 'error'   },
  SPRINT_SENT_TO_COORD:     { icon: 'ri-send-plane-line',      color: 'info'    },
  SPRINT_COORD_SUBMITTED:   { icon: 'ri-checkbox-circle-line', color: 'info'    },
  ONBOARDING_NEW:           { icon: 'ri-user-add-line',        color: 'info'    },
  ONBOARDING_APPROVED:      { icon: 'ri-user-follow-line',     color: 'success' },
  ONBOARDING_REJECTED:      { icon: 'ri-user-unfollow-line',   color: 'error'   },
  VIOLATION_CREATED:        { icon: 'ri-error-warning-line',   color: 'error'   },
}

const getTypeConfig = (type) =>
  TYPE_CONFIG[type] || { icon: 'ri-notification-line', color: 'info' }

const fmtTime = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diff = Math.floor((now - d) / 1000)
  if (diff < 60)  return 'Baru saja'
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function NotificationsView() {
  const [items, setItems]     = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [toast, setToast]     = useState({ open: false, message: '', severity: 'success' })
  const router                = useRouter()
  const isMobile              = useMediaQuery(theme => theme.breakpoints.down('md'))

  const showToast = useCallback((msg, severity = 'success') =>
    setToast({ open: true, message: msg, severity }), [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await notificationApi.getList({ page: page + 1, page_size: pageSize })
      setItems(res.data.data || [])
      setTotal(res.data.total || 0)
    } catch {
      showToast('Gagal memuat notifikasi', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, showToast])

  useEffect(() => { fetchData() }, [fetchData])

  const handleClick = async (n) => {
    if (!n.is_read) {
      try { await notificationApi.markRead(n.id) } catch {}
      setItems(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x))
    }
    const url = getNotifUrl(n.type, n.ref_id)
    if (url) router.push(url)
  }

  const handleMarkAll = async () => {
    try {
      await notificationApi.markAllRead()
      setItems(prev => prev.map(x => ({ ...x, is_read: true })))
      showToast('Semua notifikasi ditandai sudah dibaca')
    } catch {
      showToast('Gagal menandai semua notifikasi', 'error')
    }
  }

  const unreadCount = items.filter(n => !n.is_read).length

  // Color map per notif type
  const NOTIF_COLOR = {
    primary: { bg: '#E6F1FB', color: '#185FA5' },
    success: { bg: '#E1F5EE', color: '#0F6E56' },
    error:   { bg: '#FCEBEB', color: '#A32D2D' },
    warning: { bg: '#FAEEDA', color: '#BA7517' },
    info:    { bg: '#EEEDFE', color: '#534AB7' },
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {/* Topbar PWA */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Box sx={{
            width: 34, height: 34, borderRadius: '10px',
            background: 'rgba(255,255,255,0.72)', border: '0.5px solid rgba(180,100,100,0.18)',
            boxShadow: '0 3px 10px rgba(139,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, cursor: 'pointer', position: 'relative', overflow: 'hidden',
            '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)' }
          }} onClick={() => window.history.back()}>
            <i className='ri-arrow-left-s-line' style={{ fontSize: '20px', color: '#8B2020', position: 'relative', zIndex: 1 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>NIMEN PTIK</Typography>
            <Typography sx={{ fontSize: '16px', fontWeight: 500, color: '#3B1010' }}>Notifikasi</Typography>
          </Box>
        </Box>
        {unreadCount > 0 && (
          <Box component='button' onClick={handleMarkAll} sx={{
            display: 'flex', alignItems: 'center', gap: '5px', px: '10px', py: '6px',
            borderRadius: '8px', cursor: 'pointer',
            background: 'rgba(255,255,255,0.72)', border: '0.5px solid rgba(180,100,100,0.18)',
            boxShadow: '0 2px 6px rgba(139,0,0,0.07)',
          }}>
            <i className='ri-check-double-line' style={{ fontSize: '13px', color: '#0F6E56' }} />
            <Typography sx={{ fontSize: '10px', fontWeight: 500, color: '#3B1010', display: { xs: 'none', sm: 'block' } }}>
              Tandai dibaca
            </Typography>
          </Box>
        )}
      </Box>

      {/* Unread badge */}
      {unreadCount > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#EB3D47' }} />
          <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>
            {unreadCount} belum dibaca
          </Typography>
        </Box>
      )}

      {/* Content */}
      <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: '40px' }}>
            <CircularProgress size={24} sx={{ color: '#EB3D47' }} />
          </Box>
        ) : items.length === 0 ? (
          <Box sx={{ py: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <i className='ri-notification-off-line' style={{ fontSize: 40, opacity: 0.25 }} />
            <Typography sx={{ fontSize: '12px', color: '#9A5A5A' }}>Tidak ada notifikasi</Typography>
          </Box>
        ) : (
          items.map((n, i) => {
            const cfg = getTypeConfig(n.type)
            const clr = NOTIF_COLOR[cfg.color] || NOTIF_COLOR.info
            const url = getNotifUrl(n.type, n.ref_id)
            return (
              <Box key={n.id} onClick={() => handleClick(n)} sx={{
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                px: 2, py: '12px',
                cursor: url ? 'pointer' : 'default',
                bgcolor: n.is_read ? 'transparent' : 'rgba(235,61,71,0.03)',
                borderBottom: i < items.length - 1 ? '0.5px solid rgba(180,100,100,0.08)' : 'none',
                transition: 'background 0.15s',
                '&:active': url ? { opacity: 0.7 } : {},
              }}>
                {/* Icon crystal style */}
                <Box sx={{
                  width: 38, height: 38, borderRadius: '10px', flexShrink: 0,
                  bgcolor: clr.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className={cfg.icon} style={{ fontSize: '18px', color: clr.color }} />
                </Box>

                {/* Content */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px', mb: '2px' }}>
                    <Typography sx={{ fontSize: '13px', fontWeight: n.is_read ? 400 : 600, color: '#3B1010', lineHeight: 1.3 }}>
                      {n.title}
                    </Typography>
                    <Typography sx={{ fontSize: '10px', color: '#9A5A5A', flexShrink: 0, mt: '1px' }}>
                      {fmtTime(n.created_at)}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: '11px', color: '#9A5A5A', lineHeight: 1.4 }}>
                    {n.body}
                  </Typography>
                </Box>

                {/* Unread dot */}
                {!n.is_read && (
                  <Box sx={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, mt: '5px', bgcolor: '#EB3D47' }} />
                )}
              </Box>
            )
          })
        )}

        <Box sx={{ borderTop: '0.5px solid rgba(180,100,100,0.1)' }}>
          <TablePagination
            component='div' count={total} page={page} rowsPerPage={pageSize}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={e => { setPageSize(+e.target.value); setPage(0) }}
            rowsPerPageOptions={[10, 20, 50]}
            labelRowsPerPage='Per halaman'
          />
        </Box>
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
