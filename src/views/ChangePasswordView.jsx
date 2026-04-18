'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import { Controller, useForm } from 'react-hook-form'
import Logo from '@components/layout/shared/Logo'
import apiClient from '@/libs/api/client'

const ChangePasswordView = () => {
  const router = useRouter()
  const { data: session, update } = useSession()
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const { control, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { old_password: '', new_password: '', confirm_password: '' }
  })

  const newPassword = watch('new_password')

  const onSubmit = async (values) => {
    setLoading(true)
    setError(null)
    try {
      await apiClient.put('/profile/change-password', {
        old_password: values.old_password,
        new_password: values.new_password,
        confirm_password: values.confirm_password,
      })

      // Update session agar mustChangePassword = false
      await update({ mustChangePassword: false })
      router.push('/dashboard')
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-backgroundDefault p-6'>
      {/* Logo di kiri atas */}
      <div className='absolute block-start-5 sm:block-start-[33px] inline-start-6 sm:inline-start-[38px]'>
        <Logo />
      </div>

      <Card className='w-full max-w-md'>
        <CardContent className='p-8 flex flex-col gap-6'>
          {/* Header */}
          <div className='flex flex-col items-center gap-2 text-center'>
            <div className='flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2'>
              <i className='ri-lock-password-line text-primary text-3xl' />
            </div>
            <Typography variant='h4'>Ganti Password</Typography>
            <Typography color='text.secondary'>
              Halo <strong>{session?.user?.name}</strong>, akun kamu menggunakan password sementara.
              Silakan ganti sekarang untuk keamanan akunmu.
            </Typography>
          </div>

          {error && (
            <Alert severity='error' onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5'>
            {/* Password lama */}
            <Controller
              name='old_password'
              control={control}
              rules={{ required: 'Password lama wajib diisi' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Password Sementara'
                  type={showOld ? 'text' : 'password'}
                  error={!!errors.old_password}
                  helperText={errors.old_password?.message}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton onClick={() => setShowOld(!showOld)} edge='end'>
                          <i className={`ri-${showOld ? 'eye-off' : 'eye'}-line`} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              )}
            />

            {/* Password baru */}
            <Controller
              name='new_password'
              control={control}
              rules={{
                required: 'Password baru wajib diisi',
                minLength: { value: 6, message: 'Minimal 6 karakter' }
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Password Baru'
                  type={showNew ? 'text' : 'password'}
                  error={!!errors.new_password}
                  helperText={errors.new_password?.message}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton onClick={() => setShowNew(!showNew)} edge='end'>
                          <i className={`ri-${showNew ? 'eye-off' : 'eye'}-line`} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              )}
            />

            {/* Konfirmasi password */}
            <Controller
              name='confirm_password'
              control={control}
              rules={{
                required: 'Konfirmasi password wajib diisi',
                validate: val => val === newPassword || 'Konfirmasi password tidak cocok'
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Konfirmasi Password Baru'
                  type={showConfirm ? 'text' : 'password'}
                  error={!!errors.confirm_password}
                  helperText={errors.confirm_password?.message}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton onClick={() => setShowConfirm(!showConfirm)} edge='end'>
                          <i className={`ri-${showConfirm ? 'eye-off' : 'eye'}-line`} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              )}
            />

            <Button
              fullWidth
              type='submit'
              variant='contained'
              size='large'
              disabled={loading}
              startIcon={loading ? <CircularProgress size={18} color='inherit' /> : <i className='ri-lock-line' />}
            >
              {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
            </Button>
          </form>

          {/* Logout */}
          <div className='text-center'>
            <Typography variant='body2' color='text.secondary'>
              Bukan kamu?{' '}
              <span
                className='text-primary cursor-pointer hover:underline'
                onClick={() => signOut({ callbackUrl: '/login' })}
              >
                Keluar
              </span>
            </Typography>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ChangePasswordView
