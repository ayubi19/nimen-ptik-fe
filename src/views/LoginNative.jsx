'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Controller, useForm } from 'react-hook-form'

// MUI Imports
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'

import themeConfig from '@configs/themeConfig'

/**
 * LoginNative — tampilan login khusus PWA mode.
 * Semua wave path diambil langsung dari Figma (Copy as SVG).
 * Frame Figma: 375x844
 * Wave Illu viewBox: 375x278
 */

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
      minHeight:               '100dvh',
      display:                 'flex',
      flexDirection:           'column',
      bgcolor:                 '#FFFFFF',
      overflow:                'hidden',
      pt:                      'env(safe-area-inset-top)',
      WebkitTapHighlightColor: 'transparent',
    }}>

      {/* ── Konten atas ── */}
      <Box sx={{ flex: 1, px: '28px', pt: '94px', display: 'flex', flexDirection: 'column' }}>

        {/* Judul — 32px/45px bold, #3D3D3D dari Figma */}
        <Typography sx={{
          fontSize:      '32px',
          fontWeight:    700,
          lineHeight:    '45px',
          color:         '#3D3D3D',
          mb:            '48px',
          letterSpacing: '-0.3px',
        }}>
          Nilai Mental
        </Typography>

        {/* Error */}
        {errorState && (
          <Alert severity='error' onClose={() => setErrorState(null)} sx={{ mb: 4 }}>
            {errorState}
          </Alert>
        )}

        {/* Form */}
        <Box
          component='form'
          noValidate
          autoComplete='off'
          onSubmit={handleSubmit(onSubmit)}
          sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
        >
          {/* Username */}
          <Controller
            name='username'
            control={control}
            rules={{ required: 'Username wajib diisi' }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                variant='standard'
                placeholder='username'
                error={!!errors.username}
                helperText={errors.username?.message}
                sx={{
                  '& .MuiInput-root': { fontSize: '15px' },
                  '& .MuiInput-root:before': { borderBottomColor: '#D1D5DB' },
                  '& .MuiInput-root:hover:not(.Mui-disabled):before': { borderBottomColor: '#9CA3AF' },
                  '& .MuiInput-root:after': { borderBottomColor: '#EB4C4C' },
                  '& input::placeholder': { color: '#9CA3AF', opacity: 1, fontSize: '15px' },
                }}
              />
            )}
          />

          {/* Password */}
          <Controller
            name='password'
            control={control}
            rules={{ required: 'Password wajib diisi' }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                variant='standard'
                placeholder='Password'
                type={isPasswordShown ? 'text' : 'password'}
                error={!!errors.password}
                helperText={errors.password?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        edge='end'
                        onClick={() => setIsPasswordShown(v => !v)}
                        onMouseDown={e => e.preventDefault()}
                        size='small'
                        sx={{ color: '#9CA3AF' }}
                      >
                        <i
                          className={isPasswordShown ? 'ri-eye-line' : 'ri-eye-off-line'}
                          style={{ fontSize: '20px' }}
                        />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiInput-root': { fontSize: '15px' },
                  '& .MuiInput-root:before': { borderBottomColor: '#D1D5DB' },
                  '& .MuiInput-root:hover:not(.Mui-disabled):before': { borderBottomColor: '#9CA3AF' },
                  '& .MuiInput-root:after': { borderBottomColor: '#EB4C4C' },
                  '& input::placeholder': { color: '#9CA3AF', opacity: 1, fontSize: '15px' },
                }}
              />
            )}
          />

          {/* Kamu lupa password? — rata kanan */}
          <Box sx={{ textAlign: 'right', mt: '-8px' }}>
            <Typography component='span' sx={{ fontSize: '14px', color: '#6B7280', cursor: 'pointer' }}>
              Kamu lupa password?
            </Typography>
          </Box>

          {/* Spacer — gap besar antara forgot dan button, seperti di Figma */}
          <Box sx={{ flex: 1, minHeight: '48px' }} />

          {/* Login Button — H:60, Radial gradient dari Figma */}
          <Box
            component='button'
            type='submit'
            disabled={isLoading}
            sx={{
              width:          '100%',
              height:         '60px',
              background:     'radial-gradient(circle at 2% 5%, #FFA6A6 0%, #EB4C4C 100%)',
              border:         'none',
              borderRadius:   '16px',
              fontSize:       '17px',
              fontWeight:     700,
              color:          '#FFFFFF',
              cursor:         isLoading ? 'not-allowed' : 'pointer',
              opacity:        isLoading ? 0.8 : 1,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            '8px',
              transition:     'opacity 0.2s',
              boxShadow:      '0 4px 20px rgba(235,76,76,0.35)',
              letterSpacing:  '0.3px',
              '&:active':     { opacity: 0.85 },
            }}
          >
            {isLoading ? (
              <>
                <Box component='span' sx={{
                  width:          '16px',
                  height:         '16px',
                  border:         '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  borderRadius:   '50%',
                  animation:      'nimen-spin 0.7s linear infinite',
                  display:        'inline-block',
                }} />
                Memproses...
              </>
            ) : 'Login'}
          </Box>
        </Box>
      </Box>

      {/* ── Wave Section — path persis dari Figma ── */}
      {/* Figma frame: 375x844, Illu viewBox: 375x278 */}
      {/* Wave mulai di Y≈566 dari atas (844-278=566), sekitar 67% dari atas layar */}
      <Box sx={{
        position:  'relative',
        width:     '100%',
        flexShrink: 0,
        // Proporsi wave: 278/844 = 32.9% tinggi frame Figma
        height:    'calc(278 / 844 * 100dvh)',
        minHeight: '240px',
      }}>
        <svg
          width='100%'
          height='100%'
          viewBox='0 0 375 278'
          preserveAspectRatio='none'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
        >
          <defs>
            <radialGradient
              id='waveRadial'
              cx='0' cy='0' r='1'
              gradientTransform='matrix(536 354.999 -764.094 249.026 7.99999 86.9999)'
              gradientUnits='userSpaceOnUse'
            >
              <stop stopColor='#EB4C4C'/>
              <stop offset='1' stopColor='#FFA6A6'/>
            </radialGradient>
          </defs>

          {/* Path paling atas — #FFA6A6 */}
          <path
            fillRule='evenodd'
            clipRule='evenodd'
            d='M413 109.395C403.282 108.976 393.55 111.162 383.914 113.3C353.113 120.16 322.173 126.628 291.009 127.684C261.972 128.661 232.588 124.852 204.76 112.465C178.463 100.761 154.184 81.2699 130.08 62.5979C112.383 48.8859 94.5738 35.2869 75.7965 24.8079C39.5326 4.57088 -0.0372118 -3.42912 -38.8059 1.33888C-38.8715 1.34488 -38.9371 1.35688 -39 1.36288V278H412.997V109.395H413Z'
            fill='#FFA6A6'
          />

          {/* Path tengah — #FF7070 */}
          <path
            fillRule='evenodd'
            clipRule='evenodd'
            d='M413 124.401C403.282 124.066 393.55 125.812 383.914 127.521C353.113 132.998 322.173 138.165 291.009 139.005C261.972 139.79 232.588 136.746 204.76 126.856C178.463 117.501 154.184 101.931 130.08 87.011C112.383 76.058 94.5738 65.193 75.7965 56.823C39.5326 40.655 -0.0372118 34.259 -38.8059 38.07C-38.8715 38.076 -38.9371 38.082 -39 38.088V278H412.997V124.401H413Z'
            fill='#FF7070'
          />

          {/* Path solid — radial gradient #EB4C4C → #FFA6A6 */}
          <path
            fillRule='evenodd'
            clipRule='evenodd'
            d='M413 137.458C403.282 137.193 393.55 138.579 383.914 139.941C353.113 144.293 322.173 148.401 291.009 149.065C261.972 149.691 232.588 147.265 204.76 139.404C178.463 131.971 154.184 119.599 130.08 107.745C112.383 99.0399 94.5738 90.4049 75.7965 83.7549C39.5326 70.9029 -0.0372118 65.8229 -38.8059 68.8499C-38.8715 68.8559 -38.9371 68.8619 -39 68.8649V278H413L412.997 137.458H413Z'
            fill='url(#waveRadial)'
          />
        </svg>

        {/* Teks di dalam wave solid */}
        <Box sx={{
          position:      'absolute',
          bottom:        0,
          left:          0,
          right:         0,
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           '4px',
          pb:            'calc(env(safe-area-inset-bottom) + 32px)',
        }}>
          <Typography sx={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', fontWeight: 400 }}>
            Belum memiliki akun?
          </Typography>
          <Box
            component='a'
            href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}`}
            target='_blank'
            rel='noopener noreferrer'
            sx={{
              display:        'flex',
              alignItems:     'center',
              gap:            '6px',
              fontSize:       '15px',
              fontWeight:     700,
              color:          '#FFFFFF',
              textDecoration: 'none',
            }}
          >
            <svg width='18' height='18' viewBox='0 0 24 24'>
              <circle cx='12' cy='12' r='12' fill='rgba(255,255,255,0.2)'/>
              <path
                d='M17.707 7.293l-2.12 10.002c-.16.716-.576.895-1.168.556l-3.23-2.38-1.558 1.5c-.173.172-.317.317-.65.317l.232-3.294 5.985-5.41c.26-.232-.057-.36-.402-.128L6.29 13.98l-3.198-.998c-.695-.218-.71-.695.146-.103l11.166-4.306c.578-.21 1.083.128.303 1.72z'
                fill='white'
              />
            </svg>
            Daftar menggunakan Telegram
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
        @keyframes nimen-spin { to { transform: rotate(360deg); } }
      `}</style>
    </Box>
  )
}

export default LoginNative
