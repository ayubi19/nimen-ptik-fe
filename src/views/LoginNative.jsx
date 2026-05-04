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

        {/* Judul */}
        <Typography sx={{
          fontFamily:    POPPINS,
          fontSize:      '32px',
          fontWeight:    600,
          lineHeight:    '45px',
          color:         '#4E5053',
          mb:            '48px',
          fontFeatureSettings: "'liga' off, 'clig' off",
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
                placeholder='Username'
                error={!!errors.username}
                helperText={errors.username?.message}
                sx={{
                  '& .MuiInput-root': { fontFamily: POPPINS, fontSize: '14px', fontWeight: 600 },
                  '& .MuiInput-root:before': { borderBottomColor: '#D0D0D0' },
                  '& .MuiInput-root:hover:not(.Mui-disabled):before': { borderBottomColor: '#9CA3AF' },
                  '& .MuiInput-root:after': { borderBottomColor: '#800000' },
                  '& input::placeholder': { color: '#D0D0D0', opacity: 1, fontFamily: POPPINS, fontWeight: 600 },
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
                        sx={{ color: '#D0D0D0' }}
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
                  '& .MuiInput-root': { fontFamily: POPPINS, fontSize: '14px', fontWeight: 600 },
                  '& .MuiInput-root:before': { borderBottomColor: '#D0D0D0' },
                  '& .MuiInput-root:hover:not(.Mui-disabled):before': { borderBottomColor: '#9CA3AF' },
                  '& .MuiInput-root:after': { borderBottomColor: '#800000' },
                  '& input::placeholder': { color: '#D0D0D0', opacity: 1, fontFamily: POPPINS, fontWeight: 600 },
                }}
              />
            )}
          />

          {/* Kamu lupa password? */}
          <Box sx={{ textAlign: 'right', mt: '-8px' }}>
            <Box
              component='a'
              href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}?start=lupa_password`}
              target='_blank'
              rel='noopener noreferrer'
              sx={{
                fontFamily:          POPPINS,
                fontSize:            '12px',
                fontWeight:          500,
                lineHeight:          '30px',
                letterSpacing:       '0.26px',
                color:               '#727376',
                textDecoration:      'none',
                fontFeatureSettings: "'liga' off, 'clig' off",
                '&:hover':           { color: '#800000' },
              }}
            >
              Kamu lupa password?
            </Box>
          </Box>

          {/* Spacer */}
          <Box sx={{ flex: 1, minHeight: '48px' }} />

          {/* Login Button */}
          <Box
            component='button'
            type='submit'
            disabled={isLoading}
            sx={{
              width:          '100%',
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
              transition:     'opacity 0.2s',
              boxShadow:      '0 4px 24px rgba(128,0,0,0.4)',
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

      {/* ── Wave Section — 3 SVG terpisah sesuai viewBox Figma ── */}
      <Box sx={{
        position:   'relative',
        width:      '100%',
        flexShrink: 0,
        height:     'calc(278 / 812 * 100dvh)',
        minHeight:  '240px',
        overflow:   'hidden',
      }}>

        {/* Path 1 — #FF0000, paling belakang, viewBox 375x278 */}
        <svg
          style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '278px' }}
          viewBox='-39 0 452 278'
          preserveAspectRatio='xMinYMax slice'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            fillRule='evenodd' clipRule='evenodd'
            d='M413 109.395C403.282 108.976 393.55 111.162 383.914 113.3C353.113 120.16 322.173 126.628 291.009 127.684C261.972 128.661 232.588 124.852 204.76 112.465C178.463 100.761 154.184 81.2699 130.08 62.5979C112.383 48.8859 94.5738 35.2869 75.7965 24.8079C39.5326 4.57088 -0.0372118 -3.42912 -38.8059 1.33888C-38.8715 1.34488 -38.9371 1.35688 -39 1.36288V278H412.997V109.395H413Z'
            fill='#FF0000'
          />
        </svg>

        {/* Path 2 — #BF0000, tengah, viewBox 375x241 */}
        <svg
          style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '241px' }}
          viewBox='-39 0 452 241'
          preserveAspectRatio='xMinYMax slice'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            fillRule='evenodd' clipRule='evenodd'
            d='M413 87.401C403.282 87.066 393.55 88.812 383.914 90.521C353.113 95.998 322.173 101.165 291.009 102.005C261.972 102.79 232.588 99.746 204.76 89.856C178.463 80.501 154.184 64.931 130.08 50.011C112.383 39.058 94.5738 28.193 75.7965 19.823C39.5326 3.65504 -0.0372118 -2.74096 -38.8059 1.07004C-38.8715 1.07604 -38.9371 1.08204 -39 1.08804V241H412.997V87.401H413Z'
            fill='#BF0000'
          />
        </svg>

        {/* Path 3 — Radial #800000→#FF0000, paling depan, viewBox 375x210 */}
        <svg
          style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '210px' }}
          viewBox='-39 0 452 210'
          preserveAspectRatio='xMinYMax slice'
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
          zIndex:        10,
        }}>
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
              textDecoration:      'none',
              fontFeatureSettings: "'liga' off, 'clig' off",
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
      `}</style>
    </Box>
  )
}

export default LoginNative
