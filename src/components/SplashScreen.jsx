'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

/**
 * SplashScreen — ditampilkan saat PWA pertama kali dibuka.
 *
 * Lifecycle:
 *  0 → 300ms   : fade-in (visible)
 *  300ms → 2s  : diam (visible)
 *  2s → 2.5s   : fade-out (hiding)
 *  2.5s        : onDone() dipanggil → komponen dilepas dari DOM
 */
const SplashScreen = ({ onDone }) => {
  // 'visible' | 'hiding' | 'done'
  const [phase, setPhase] = useState('visible')

  useEffect(() => {
    // Mulai fade-out setelah 2 detik
    const fadeTimer = setTimeout(() => setPhase('hiding'), 2000)

    // Lepas dari DOM setelah animasi fade-out selesai (500ms)
    const doneTimer = setTimeout(() => {
      setPhase('done')
      onDone?.()
    }, 2500)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(doneTimer)
    }
  }, [onDone])

  if (phase === 'done') return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff',
        opacity: phase === 'hiding' ? 0 : 1,
        transition: 'opacity 500ms ease-in-out',
        // Tutup area notch / home indicator iOS & Android
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          animation: 'splashFadeUp 0.4s ease-out forwards',
        }}
      >
        <Image
          src='/images/icon-192x192.png'
          alt='Nimen PTIK'
          width={96}
          height={96}
          priority
          style={{ borderRadius: '24px' }}
        />
      </div>

      {/* Loading dots di bagian bawah */}
      <div
        style={{
          position: 'absolute',
          bottom: 'calc(env(safe-area-inset-bottom) + 48px)',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.6)',
              animation: `splashDot 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Keyframes — diinjek langsung via <style> agar tidak perlu CSS module */}
      <style>{`
        @keyframes splashFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes splashDot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40%            { opacity: 1;   transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}

export default SplashScreen
