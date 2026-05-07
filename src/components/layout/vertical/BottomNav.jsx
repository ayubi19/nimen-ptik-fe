'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Badge from '@mui/material/Badge'
import { notificationApi } from '@/libs/api/notificationApi'

// ── Helper decode JWT ─────────────────────────────────────────────────────────
const decodeJwt = (token) => {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch { return {} }
}

// ── Definisi semua menu yang mungkin muncul ───────────────────────────────────
const buildMenuItems = ({ isStudent, hasPosition }) => {
  const middle = isStudent
    ? hasPosition
      ? { key: 'review', href: '/nimen/sprints/coordinator-review', icon: 'ri-edit-box-line', label: 'Review' }
      : { key: 'sprint', href: '/nimen/my-sprints', icon: 'ri-calendar-check-line', label: 'Sprint' }
    : null

  const nimenItem = isStudent
    ? { key: 'nimen', href: '/nimen', icon: 'ri-medal-line', label: 'NIMEN' }
    : { key: 'sprint', href: '/nimen/sprints', icon: 'ri-shield-line', label: 'Sprint' }

  return [
    { key: 'dashboard',  href: '/dashboard',  icon: 'ri-home-smile-line', label: 'Home'      },
    nimenItem,
    ...(middle ? [middle] : []),
    { key: 'notif',      href: '/notif',       icon: 'ri-notification-2-line', label: 'Notifikasi', isNotif: true },
    { key: 'profile',    href: '/profile',     icon: 'ri-user-3-line',      label: 'Profil'    },
  ]
}

// ── Cek apakah pathname aktif untuk item tertentu ────────────────────────────
const isActive = (pathname, href) => {
  if (href === '/dashboard') return pathname === '/dashboard'
  if (href === '/nimen') return pathname === '/nimen'
  if (href === '/nimen/sprints') return pathname.startsWith('/nimen/sprints')
  return pathname.startsWith(href)
}

// ── Komponen BottomNav ────────────────────────────────────────────────────────
const BottomNav = () => {
  const pathname            = usePathname()
  const router              = useRouter()
  const { data: session }   = useSession()
  const [unreadCount, setUnreadCount] = useState(0)

  // ── Parse role dari session ───────────────────────────────────────────────
  const jwtPayload  = session?.user?.accessToken ? decodeJwt(session.user.accessToken) : {}
  const roleNames   = session?.user?.roles || []
  const isStudent   = roleNames.includes('student') || roleNames.includes('student_pic')
  const hasPosition = jwtPayload?.has_position === true

  const menuItems = buildMenuItems({ isStudent, hasPosition })

  // ── Fetch unread count untuk badge notifikasi ─────────────────────────────
  const fetchUnread = useCallback(async () => {
    try {
      const res = await notificationApi.getUnreadCount()
      setUnreadCount(res.data?.data?.unread_count ?? 0)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    if (session?.user?.accessToken) fetchUnread()
  }, [session, fetchUnread])

  // Refetch unread count saat ada notif baru dari SSE (event global)
  useEffect(() => {
    const handler = () => fetchUnread()
    window.addEventListener('nimen:refetch', handler)
    return () => window.removeEventListener('nimen:refetch', handler)
  }, [fetchUnread])

  // ── Handle tap item ───────────────────────────────────────────────────────
  const handleTap = (item) => {
    if (item.isNotif) {
      // Notifikasi: toggle ke halaman notif atau buka dropdown —
      // untuk PWA kita route ke halaman dedicated
      router.push('/notifications')
      return
    }
    router.push(item.href)
  }

  return (
    <nav
      style={{
        position:        'fixed',
        bottom:          0,
        left:            0,
        right:           0,
        zIndex:          1300,
        display:         'flex',
        alignItems:      'stretch',
        backgroundColor: '#FFFFFF',
        borderTop:       '0.5px solid rgba(180,100,100,0.12)',
        paddingBottom:   'env(safe-area-inset-bottom)',
        boxShadow:       '0 -4px 20px rgba(139,0,0,0.07)',
      }}
    >
      {menuItems.map((item) => {
        const active = isActive(pathname, item.href)

        return (
          <button
            key={item.key}
            onClick={() => handleTap(item)}
            style={{
              flex:                    1,
              display:                 'flex',
              flexDirection:           'column',
              alignItems:              'center',
              justifyContent:          'center',
              gap:                     '4px',
              paddingTop:              '12px',
              paddingBottom:           '12px',
              border:                  'none',
              background:              'transparent',
              cursor:                  'pointer',
              color:                   active ? '#EB3D47' : '#B0A8A8',
              transition:              'color 0.2s, transform 0.15s',
              WebkitTapHighlightColor: 'transparent',
              outline:                 'none',
              position:                'relative',
              transform:               active ? 'scale(1.05)' : 'scale(1)',
            }}
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
          >
            {/* Active pill indicator — di atas icon */}
            {active && (
              <span style={{
                position:        'absolute',
                top:             0,
                left:            '50%',
                transform:       'translateX(-50%)',
                width:           '32px',
                height:          '3px',
                borderRadius:    '0 0 4px 4px',
                backgroundColor: '#EB3D47',
              }} />
            )}

            {/* Icon */}
            {item.isNotif ? (
              <Badge
                badgeContent={unreadCount}
                color='error'
                max={99}
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize:  '9px',
                    height:    '16px',
                    minWidth:  '16px',
                    padding:   '0 4px',
                    top:       '1px',
                    right:     '1px',
                    bgcolor:   '#EB3D47',
                  }
                }}
              >
                <i
                  className={item.isNotif ? item.icon : (active ? item.icon.replace('-line', '-fill') : item.icon)}
                  style={{ fontSize: '22px', lineHeight: 1 }}
                />
              </Badge>
            ) : (
              <i
                className={active ? item.icon.replace('-line', '-fill') : item.icon}
                style={{ fontSize: '22px', lineHeight: 1 }}
              />
            )}

            {/* Label */}
            <span style={{
              fontSize:   '10px',
              fontWeight: active ? 700 : 400,
              lineHeight: 1,
              color:      active ? '#EB3D47' : '#B0A8A8',
              letterSpacing: active ? '0.01em' : 0,
            }}>
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

export default BottomNav
