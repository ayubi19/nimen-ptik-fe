'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import { useRouter, useSearchParams } from 'next/navigation'

// MUI Imports
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'

// Third-party Imports
import { signIn } from 'next-auth/react'
import { Controller, useForm } from 'react-hook-form'
import classnames from 'classnames'

// Component Imports
import Logo from '@components/layout/shared/Logo'

// Config Imports
import themeConfig from '@configs/themeConfig'

const lightIllustration = '/images/illustrations/auth/v2-login-light.png'

const Login = () => {
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [errorState, setErrorState] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      username: '',
      password: ''
    }
  })

  const onSubmit = async data => {
    setIsLoading(true)
    setErrorState(null)

    const result = await signIn('credentials', {
      username: data.username,
      password: data.password,
      redirect: false
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
    <div className='flex bs-full justify-center'>
      <div className='flex bs-full items-center justify-center flex-1 min-bs-[100dvh] relative p-6 max-md:hidden'>
        <div className='plb-12 pis-12'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightIllustration}
            alt='login illustration'
            className='max-bs-[500px] max-is-full bs-auto'
          />
        </div>
      </div>

      <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[480px]'>
        <div className='absolute block-start-5 sm:block-start-[33px] inline-start-6 sm:inline-start-[38px]'>
          <Logo />
        </div>

        <div className='flex flex-col gap-6 is-full sm:is-auto md:is-full sm:max-is-[400px] md:max-is-[unset] mbs-11 sm:mbs-14 md:mbs-0'>
          <div className='flex flex-col gap-1'>
            <Typography variant='h4'>{`Selamat Datang di ${themeConfig.templateName}`}</Typography>
            <Typography>Silakan login untuk melanjutkan</Typography>
          </div>

          {errorState && (
            <Alert severity='error' onClose={() => setErrorState(null)}>
              {errorState}
            </Alert>
          )}

          <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
            <Controller
              name='username'
              control={control}
              rules={{ required: 'Username wajib diisi' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Username'
                  placeholder='Masukkan username'
                  error={!!errors.username}
                  helperText={errors.username?.message}
                />
              )}
            />

            <Controller
              name='password'
              control={control}
              rules={{ required: 'Password wajib diisi' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Password'
                  placeholder='············'
                  type={isPasswordShown ? 'text' : 'password'}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton
                          edge='end'
                          onClick={() => setIsPasswordShown(!isPasswordShown)}
                          onMouseDown={e => e.preventDefault()}
                        >
                          <i className={isPasswordShown ? 'ri-eye-off-line' : 'ri-eye-line'} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              )}
            />

            <Button fullWidth variant='contained' type='submit' disabled={isLoading}>
              {isLoading ? 'Memproses...' : 'Login'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
