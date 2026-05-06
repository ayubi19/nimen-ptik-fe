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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

      {/* Breadcrumb */}
      <div className='flex items-center gap-2'>
        <Typography variant='caption' color='text.secondary'>NIMEN PTIK</Typography>
        <i className='ri-arrow-right-s-line text-sm opacity-50' />
        <Typography variant='caption' fontWeight={500} color='text.primary'>Notifikasi</Typography>
      </div>

      <Card sx={{ borderRadius: 1 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant='body1' fontWeight={500}>Semua Notifikasi</Typography>
            {unreadCount > 0 && (
              <Chip label={`${unreadCount} belum dibaca`} size='small' color='error' variant='tonal' />
            )}
          </Box>
          {unreadCount > 0 && (
            <Button size='small' variant='text' onClick={handleMarkAll}
                    startIcon={<i className='ri-check-double-line' />}>
              Tandai semua dibaca
            </Button>
          )}
        </Box>
        <Divider />

        {/* Content */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : items.length === 0 ? (
          <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <i className='ri-notification-off-line' style={{ fontSize: 48, opacity: 0.3 }} />
            <Typography variant='body2' color='text.secondary'>Tidak ada notifikasi</Typography>
          </Box>
        ) : (
          items.map((n, i) => {
            const cfg = getTypeConfig(n.type)
            const url = getNotifUrl(n.type, n.ref_id)
            return (
              <Box key={n.id}>
                <Box
                  onClick={() => handleClick(n)}
                  sx={{
                    display: 'flex', alignItems: 'flex-start', gap: 1.5,
                    px: 2, py: isMobile ? 1.5 : 1.25,
                    cursor: url ? 'pointer' : 'default',
                    bgcolor: n.is_read ? 'transparent' : 'action.hover',
                    transition: 'background 0.15s',
                    '&:hover': url ? { bgcolor: 'action.selected' } : {},
                  }}>
                  {/* Icon */}
                  <Box sx={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    bgcolor: `var(--mui-palette-${cfg.color}-lightOpacity)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className={cfg.icon}
                       style={{ fontSize: 16, color: `var(--mui-palette-${cfg.color}-main)` }} />
                  </Box>

                  {/* Content */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                      <Typography variant='body2' fontWeight={n.is_read ? 400 : 500} noWrap={!isMobile}>
                        {n.title}
                      </Typography>
                      <Typography variant='caption' color='text.secondary' sx={{ flexShrink: 0 }}>
                        {fmtTime(n.created_at)}
                      </Typography>
                    </Box>
                    <Typography variant='caption' color='text.secondary'
                                sx={{ display: 'block', mt: 0.25 }}>
                      {n.body}
                    </Typography>
                  </Box>

                  {/* Unread dot */}
                  {!n.is_read && (
                    <Box sx={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0, mt: 0.75,
                      bgcolor: 'error.main',
                    }} />
                  )}
                </Box>
                {i < items.length - 1 && <Divider />}
              </Box>
            )
          })
        )}

        <Divider />
        <TablePagination
          component='div' count={total} page={page} rowsPerPage={pageSize}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={e => { setPageSize(+e.target.value); setPage(0) }}
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage='Per halaman'
        />
      </Card>

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
