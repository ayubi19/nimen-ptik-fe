'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Controller, useForm } from 'react-hook-form'

// MUI Imports
import Typography from '@mui/material/Typography'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'

import themeConfig from '@configs/themeConfig'

/**
 * LoginNative — tampilan login khusus PWA mode.
 * Semua nilai CSS diambil persis dari Figma Dev Mode.
 * Font: Poppins (Google Fonts)
 * Frame: 375x812
 */

const POPPINS = "'Poppins', sans-serif"

const LoginNative = () => {
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [errorState, setErrorState]           = useState(null)
  const [isLoading, setIsLoading]             = useState(false)

  const router       = useRouter()
  const searchParams = useSearchParams()

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { username: '', password: '' }
  })

  const onSubmit = async (data) => {
    setIsLoading(true)
    setErrorState(null)
    const result = await signIn('credentials', {
      username: data.username,
      password: data.password,
      redirect: false,
    })
    setIsLoading(false)
    if (result?.error) {
      setErrorState(result.error)
    } else {
      const redirectTo = searchParams.get('redirectTo') || themeConfig.homePageUrl
      router.push(redirectTo)
      router.refresh()
    }
  }

  return (
    <Box sx={{
      position:                'relative',
      width:                   '100%',
      minHeight:               '100dvh',
      display:                 'flex',
      flexDirection:           'column',
      bgcolor:                 '#FFFFFF',
      overflow:                'hidden',
      pt:                      'env(safe-area-inset-top)',
      WebkitTapHighlightColor: 'transparent',
    }}>

      {/* ── Konten atas ── */}
      <Box sx={{
        flex:          1,
        px:            '28px', // X position dari Figma
        pt:            '94px',
        display:       'flex',
        flexDirection: 'column',
      }}>

        {/* Judul — persis dari Figma */}
        <Typography sx={{
          fontFamily:    POPPINS,
          fontSize:      '32px',
          fontWeight:    600,
          lineHeight:    '45px',
          color:         '#4E5053',
          fontStyle:     'normal',
          mb:            '40px',
          letterSpacing: 'normal',
          fontFeatureSettings: "'liga' off, 'clig' off",
        }}>
          Nilai Mental
        </Typography>

        {/* Error */}
        {errorState && (
          <Alert
            severity='error'
            onClose={() => setErrorState(null)}
            sx={{ mb: 4, fontFamily: POPPINS }}
          >
            {errorState}
          </Alert>
        )}

        {/* Form */}
        <Box
          component='form'
          noValidate
          autoComplete='off'
          onSubmit={handleSubmit(onSubmit)}
          sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >

          {/* ── Input Username — dari Figma Group: 320x37 ── */}
          <Controller
            name='username'
            control={control}
            rules={{ required: 'Username wajib diisi' }}
            render={({ field }) => (
              <Box sx={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Box sx={{ position: 'relative', width: '100%' }}>
                  <input
                    {...field}
                    type='text'
                    placeholder='Username'
                    autoComplete='username'
                    style={{
                      width:           '100%',
                      height:          '37px',
                      padding:         '0',
                      paddingBottom:   '8px',
                      border:          'none',
                      borderBottom:    `1.5px solid ${errors.username ? '#FF0000' : '#D0D0D0'}`,
                      background:      'transparent',
                      fontFamily:      POPPINS,
                      fontSize:        '14px',
                      fontWeight:      600,
                      lineHeight:      '20px',
                      letterSpacing:   '0.3px',
                      color:           '#4E5053',
                      outline:         'none',
                      boxSizing:       'border-box',
                    }}
                  />
                </Box>
                {errors.username && (
                  <span style={{ fontFamily: POPPINS, fontSize: '11px', color: '#FF0000' }}>
                    {errors.username.message}
                  </span>
                )}
              </Box>
            )}
          />

          {/* ── Input Password — dari Figma Group 2 ── */}
          <Controller
            name='password'
            control={control}
            rules={{ required: 'Password wajib diisi' }}
            render={({ field }) => (
              <Box sx={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Box sx={{ position: 'relative', width: '100%' }}>
                  <input
                    {...field}
                    type={isPasswordShown ? 'text' : 'password'}
                    placeholder='Password'
                    autoComplete='current-password'
                    style={{
                      width:           '100%',
                      height:          '37px',
                      padding:         '0',
                      paddingBottom:   '8px',
                      paddingRight:    '32px',
                      border:          'none',
                      borderBottom:    `1.5px solid ${errors.password ? '#FF0000' : '#D0D0D0'}`,
                      background:      'transparent',
                      fontFamily:      POPPINS,
                      fontSize:        '14px',
                      fontWeight:      600,
                      lineHeight:      '20px',
                      letterSpacing:   '0.3px',
                      color:           '#4E5053',
                      outline:         'none',
                      boxSizing:       'border-box',
                    }}
                  />
                  <button
                    type='button'
                    onClick={() => setIsPasswordShown(v => !v)}
                    style={{
                      position:   'absolute',
                      right:      0,
                      bottom:     '6px',
                      background: 'none',
                      border:     'none',
                      cursor:     'pointer',
                      padding:    '2px',
                      display:    'flex',
                      alignItems: 'center',
                      color:      '#D0D0D0',
                    }}
                  >
                    <i
                      className={isPasswordShown ? 'ri-eye-line' : 'ri-eye-off-line'}
                      style={{ fontSize: '20px' }}
                    />
                  </button>
                </Box>
                {errors.password && (
                  <span style={{ fontFamily: POPPINS, fontSize: '11px', color: '#FF0000' }}>
                    {errors.password.message}
                  </span>
                )}
              </Box>
            )}
          />

          {/* Kamu lupa password? — dari Figma: Caption/Medium, #727376, right align */}
          <Box sx={{ width: '320px', textAlign: 'right', mt: '-4px' }}>
            <Typography component='span' sx={{
              fontFamily:          POPPINS,
              fontSize:            '12px',
              fontWeight:          500,
              lineHeight:          '30px',
              letterSpacing:       '0.26px',
              color:               '#727376',
              cursor:              'pointer',
              fontFeatureSettings: "'liga' off, 'clig' off",
            }}>
              Kamu lupa password?
            </Typography>
          </Box>

          {/* Spacer */}
          <Box sx={{ minHeight: '40px' }} />

          {/* Login Button — 320x60, Radial #800000 → #FF0000 dari Figma */}
          <button
            type='submit'
            disabled={isLoading}
            style={{
              width:          '320px',
              height:         '60px',
              background:     'radial-gradient(206.49% 206.49% at 10.4% 9.05%, #800000 0%, #FF0000 100%)',
              border:         'none',
              borderRadius:   '16px',
              fontFamily:     POPPINS,
              fontSize:       '17px',
              fontWeight:     700,
              color:          '#FFFFFF',
              cursor:         isLoading ? 'not-allowed' : 'pointer',
              opacity:        isLoading ? 0.8 : 1,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            '8px',
              letterSpacing:  '0.3px',
              boxShadow:      '0 4px 24px rgba(128,0,0,0.4)',
              transition:     'opacity 0.2s',
            }}
          >
            {isLoading ? (
              <>
                <span style={{
                  width:          '16px',
                  height:         '16px',
                  border:         '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  borderRadius:   '50%',
                  display:        'inline-block',
                  animation:      'nimen-spin 0.7s linear infinite',
                }} />
                Memproses...
              </>
            ) : 'Login'}
          </button>

        </Box>
      </Box>

      {/* ── Wave Section — 3 SVG terpisah sesuai viewBox Figma masing-masing ── */}
      <Box sx={{
        position:   'relative',
        width:      '100%',
        flexShrink: 0,
        height:     'calc(278 / 812 * 100dvh)',
        minHeight:  '240px',
        overflow:   'hidden',
      }}>
        {/* SVG container — absolute fill */}
        <Box sx={{ position: 'absolute', inset: 0 }}>

          {/* Path 1 — viewBox 375x278, fill #FF0000, paling belakang, anchor bottom */}
          <svg
            style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '278px' }}
            viewBox='-39 0 452 278'
            preserveAspectRatio='xMidYMax slice'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              fillRule='evenodd' clipRule='evenodd'
              d='M413 109.395C403.282 108.976 393.55 111.162 383.914 113.3C353.113 120.16 322.173 126.628 291.009 127.684C261.972 128.661 232.588 124.852 204.76 112.465C178.463 100.761 154.184 81.2699 130.08 62.5979C112.383 48.8859 94.5738 35.2869 75.7965 24.8079C39.5326 4.57088 -0.0372118 -3.42912 -38.8059 1.33888C-38.8715 1.34488 -38.9371 1.35688 -39 1.36288V278H412.997V109.395H413Z'
              fill='#FF0000'
            />
          </svg>

          {/* Path 2 — viewBox 375x241, fill #BF0000, tengah, anchor bottom */}
          <svg
            style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '241px' }}
            viewBox='-39 0 452 241'
            preserveAspectRatio='xMidYMax slice'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              fillRule='evenodd' clipRule='evenodd'
              d='M413 87.401C403.282 87.066 393.55 88.812 383.914 90.521C353.113 95.998 322.173 101.165 291.009 102.005C261.972 102.79 232.588 99.746 204.76 89.856C178.463 80.501 154.184 64.931 130.08 50.011C112.383 39.058 94.5738 28.193 75.7965 19.823C39.5326 3.65504 -0.0372118 -2.74096 -38.8059 1.07004C-38.8715 1.07604 -38.9371 1.08204 -39 1.08804V241H412.997V87.401H413Z'
              fill='#BF0000'
            />
          </svg>

          {/* Path 3 — viewBox 375x210, radial gradient, paling depan, anchor bottom */}
          <svg
            style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '210px' }}
            viewBox='-39 0 452 210'
            preserveAspectRatio='xMidYMax slice'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <defs>
              <radialGradient
                id='waveRadial'
                cx='0' cy='0' r='1'
                gradientTransform='matrix(536 354.999 -764.094 249.026 7.99999 18.9999)'
                gradientUnits='userSpaceOnUse'
              >
                <stop stopColor='#800000'/>
                <stop offset='1' stopColor='#FF0000'/>
              </radialGradient>
            </defs>
            <path
              fillRule='evenodd' clipRule='evenodd'
              d='M413 69.4579C403.282 69.1929 393.55 70.5789 383.914 71.9409C353.113 76.2929 322.173 80.4009 291.009 81.0649C261.972 81.6909 232.588 79.2649 204.76 71.4039C178.463 63.9709 154.184 51.5989 130.08 39.7449C112.383 31.0399 94.5738 22.4049 75.7965 15.7549C39.5326 2.90286 -0.0372118 -2.17714 -38.8059 0.849861C-38.8715 0.855861 -38.9371 0.861861 -39 0.864861V210H413L412.997 69.4579H413Z'
              fill='url(#waveRadial)'
            />
          </svg>

        </Box>

        {/* Teks di dalam wave */}
        <Box sx={{
          position:      'absolute',
          bottom:        0,
          left:          0,
          right:         0,
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           0,
          pb:            'calc(env(safe-area-inset-bottom) + 32px)',
        }}>
          {/* "Belum memiliki akun?" — Body/Regular, #FFF */}
          <Typography sx={{
            fontFamily:          POPPINS,
            fontSize:            '14px',
            fontWeight:          400,
            lineHeight:          '30px',
            letterSpacing:       '0.3px',
            color:               '#FFFFFF',
            textAlign:           'center',
            fontFeatureSettings: "'liga' off, 'clig' off",
          }}>
            Belum memiliki akun?
          </Typography>

          {/* "Daftar disini" — Body/Medium, #FFF */}
          <Box
            component='a'
            href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}`}
            target='_blank'
            rel='noopener noreferrer'
            sx={{
              fontFamily:          POPPINS,
              fontSize:            '14px',
              fontWeight:          500,
              lineHeight:          '30px',
              letterSpacing:       '0.3px',
              color:               '#FFFFFF',
              textAlign:           'center',
              textDecoration:      'none',
              fontFeatureSettings: "'liga' off, 'clig' off",
              '&:hover':           { textDecoration: 'underline' },
            }}
          >
            Daftar disini
          </Box>
        </Box>
      </Box>

      {/* Home indicator iOS */}
      <Box sx={{
        position:     'absolute',
        bottom:       '8px',
        left:         '50%',
        transform:    'translateX(-50%)',
        width:        '134px',
        height:       '5px',
        borderRadius: '3px',
        bgcolor:      'rgba(255,255,255,0.5)',
        zIndex:       10,
      }} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        @keyframes nimen-spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #D0D0D0 !important; font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 14px; }
        input:focus { border-bottom-color: #800000 !important; }
      `}</style>
    </Box>
  )
}

export default LoginNative
