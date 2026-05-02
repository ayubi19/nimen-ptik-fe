'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import Badge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import Divider from '@mui/material/Divider'
import Fade from '@mui/material/Fade'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Popper from '@mui/material/Popper'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import classnames from 'classnames'
import PerfectScrollbar from 'react-perfect-scrollbar'
import { useRouter } from 'next/navigation'
import { useSettings } from '@core/hooks/useSettings'
import { notificationApi } from '@/libs/api/notificationApi'

// ── Mapping tipe notifikasi → URL tujuan ─────────────────────────────────────
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
    default:                         return null
  }
}

const POLL_INTERVAL = 30_000

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
}

const getTypeConfig = (type) =>
  TYPE_CONFIG[type] || { icon: 'ri-notification-line', color: 'info' }

const fmtTime = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diffMin = Math.floor((now - d) / 60_000)
  const diffHr  = Math.floor((now - d) / 3_600_000)
  const diffDay = Math.floor((now - d) / 86_400_000)
  if (diffMin < 1)  return 'Baru saja'
  if (diffMin < 60) return `${diffMin} menit lalu`
  if (diffHr < 24)  return `${diffHr} jam lalu`
  if (diffDay < 7)  return `${diffDay} hari lalu`
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

const ScrollWrapper = ({ children, hidden }) =>
  hidden ? (
    <div className='overflow-x-hidden bs-full'>{children}</div>
  ) : (
    <PerfectScrollbar className='bs-full' options={{ wheelPropagation: false, suppressScrollX: true }}>
      {children}
    </PerfectScrollbar>
  )

const NotificationDropdown = () => {
  const [open, setOpen]               = useState(false)
  const [items, setItems]             = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading]         = useState(false)

  const router       = useRouter()
  const anchorRef    = useRef(null)
  const popperRef    = useRef(null)
  const hidden       = useMediaQuery(theme => theme.breakpoints.down('lg'))
  const isSmall      = useMediaQuery(theme => theme.breakpoints.down('sm'))
  const { settings } = useSettings()

  const fetchAll = useCallback(async () => {
    try {
      const res  = await notificationApi.getAll()
      const data = res.data.data
      setItems(data.items || [])
      setUnreadCount(data.unread_count || 0)
    } catch { /* silent */ }
  }, [])

  const fetchCount = useCallback(async () => {
    try {
      const res = await notificationApi.getUnreadCount()
      setUnreadCount(res.data.data?.unread_count || 0)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchCount, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchAll, fetchCount])

  const handleToggle = useCallback(async () => {
    const nextOpen = !open
    setOpen(nextOpen)
    if (nextOpen) {
      setLoading(true)
      await fetchAll()
      setLoading(false)
    }
  }, [open, fetchAll])

  const handleMarkRead = useCallback(async (id) => {
    setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
    try { await notificationApi.markRead(id) } catch { fetchAll() }
  }, [fetchAll])

  const handleClick = useCallback(async (n) => {
    // Mark read jika belum
    if (!n.is_read) {
      setItems(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x))
      setUnreadCount(prev => Math.max(0, prev - 1))
      try { await notificationApi.markRead(n.id) } catch { /* silent */ }
    }
    // Navigate jika ada URL tujuan
    const url = getNotifUrl(n.type, n.ref_id)
    if (url) {
      setOpen(false)
      router.push(url)
      // Force refresh data di halaman tujuan
      setTimeout(() => router.refresh(), 100)
    }
  }, [router])

  const handleMarkAllRead = useCallback(async () => {
    setItems(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
    try { await notificationApi.markAllRead() } catch { fetchAll() }
  }, [fetchAll])

  const allRead = items.length === 0 || items.every(n => n.is_read)

  useEffect(() => {
    const adjust = () => {
      if (popperRef.current)
        popperRef.current.style.height = `${Math.min(window.innerHeight - 100, 550)}px`
    }
    window.addEventListener('resize', adjust)
    return () => window.removeEventListener('resize', adjust)
  }, [])

  return (
    <>
      <IconButton ref={anchorRef} onClick={handleToggle} className='text-textPrimary'>
        <Badge color='error' variant='dot' overlap='circular'
               invisible={unreadCount === 0}
               anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <i className='ri-notification-2-line' />
        </Badge>
      </IconButton>

      <Popper open={open} transition disablePortal placement='bottom-end'
              ref={popperRef} anchorEl={anchorRef.current}
              {...(isSmall
                ? { className: 'is-full !mbs-4 z-[1] max-bs-[550px] bs-[550px]', modifiers: [{ name: 'preventOverflow', options: { padding: 16 } }] }
                : { className: 'is-96 !mbs-4 z-[1] max-bs-[550px] bs-[550px]' })}>
        {({ TransitionProps, placement }) => (
          <Fade {...TransitionProps}
                style={{ transformOrigin: placement === 'bottom-end' ? 'right top' : 'left top' }}>
            <Paper className={classnames('bs-full', settings.skin === 'bordered' ? 'border shadow-none' : 'shadow-lg')}>
              <ClickAwayListener onClickAway={() => setOpen(false)}>
                <div className='bs-full flex flex-col'>

                  {/* Header */}
                  <div className='flex items-center justify-between plb-3 pli-4 gap-2'>
                    <Typography variant='h6' className='flex-auto'>Notifikasi</Typography>
                    {unreadCount > 0 && (
                      <Chip variant='tonal' size='small' color='primary' label={`${unreadCount} baru`} />
                    )}
                    {items.length > 0 && (
                      <Tooltip title='Tandai semua sudah dibaca'
                               placement={placement === 'bottom-end' ? 'left' : 'right'}>
                        <IconButton size='small' onClick={handleMarkAllRead}
                                    disabled={allRead} className='text-textPrimary'>
                          <i className={classnames(allRead ? 'ri-mail-line' : 'ri-mail-open-line', 'text-xl')} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </div>

                  <Divider />

                  {/* Body */}
                  <ScrollWrapper hidden={hidden}>
                    {loading ? (
                      <Box className='flex justify-center py-8'><CircularProgress size={28} /></Box>
                    ) : items.length === 0 ? (
                      <Box className='flex flex-col items-center py-10 gap-2' sx={{ color: 'text.secondary' }}>
                        <i className='ri-notification-off-line text-5xl opacity-30' />
                        <Typography variant='body2'>Belum ada notifikasi</Typography>
                      </Box>
                    ) : (
                      items.map((n, idx) => {
                        const cfg = getTypeConfig(n.type)
                        return (
                          <div
                            key={n.id}
                            className={classnames(
                              'flex plb-3 pli-4 gap-3 cursor-pointer hover:bg-actionHover',
                              { 'border-be': idx !== items.length - 1 },
                              { 'bg-actionSelected': !n.is_read }
                            )}
                            onClick={() => handleClick(n)}
                          >
                            {/* Icon avatar */}
                            <Box sx={{
                              width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              bgcolor: `var(--mui-palette-${cfg.color}-lightOpacity)`,
                            }}>
                              <i className={`${cfg.icon} text-[18px]`}
                                 style={{ color: `var(--mui-palette-${cfg.color}-main)` }} />
                            </Box>

                            {/* Text */}
                            <div className='flex flex-col flex-auto min-w-0'>
                              <Typography variant='body2' fontWeight={n.is_read ? 400 : 600}
                                          color='text.primary' noWrap>
                                {n.title}
                              </Typography>
                              <Typography variant='caption' color='text.secondary'
                                          sx={{ display: 'block', mb: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {n.body}
                              </Typography>
                              <Typography variant='caption' color='text.disabled'>
                                {fmtTime(n.created_at)}
                              </Typography>
                            </div>

                            {/* Unread dot + navigable cue */}
                            <div className='flex flex-col items-center gap-1 flex-shrink-0'>
                              {!n.is_read && (
                                <Box sx={{
                                  width: 8, height: 8, borderRadius: '50%',
                                  bgcolor: 'primary.main', mt: 0.5,
                                }} />
                              )}
                              {getNotifUrl(n.type, n.ref_id) && (
                                <i className='ri-arrow-right-s-line text-[16px] opacity-30 group-hover:opacity-70'
                                   style={{ color: 'var(--mui-palette-text-secondary)' }} />
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </ScrollWrapper>

                  <Divider />
                  <div className='p-4'>
                    <Button fullWidth variant='tonal' color='secondary' size='small'
                            onClick={handleMarkAllRead} disabled={allRead || items.length === 0}>
                      Tandai Semua Sudah Dibaca
                    </Button>
                  </div>

                </div>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  )
}

export default NotificationDropdown
