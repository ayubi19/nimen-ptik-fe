'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import Tooltip from '@mui/material/Tooltip'
import { useForm, Controller } from 'react-hook-form'
import CustomAvatar from '@core/components/mui/Avatar'
import { getInitials } from '@/utils/getInitials'
import { profileApi } from '@/libs/api/profileApi'

const ProfileView = () => {
  const { data: session, update } = useSession()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editLoading, setEditLoading] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(false) // untuk dialog fullsize
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const showToast = useCallback((message, severity = 'success') => {
    setToast({ open: true, message, severity })
  }, [])

  const { control: profileControl, handleSubmit: handleProfileSubmit, reset: resetProfile, formState: { errors: profileErrors } } = useForm({
    defaultValues: {
      full_name: '', email: '', birth_place: '', birth_date: '',
      gender: '', religion: '', marital_status: '', phone: '', address: '', city: ''
    }
  })

  const { control: pwControl, handleSubmit: handlePwSubmit, reset: resetPw, watch, formState: { errors: pwErrors } } = useForm({
    defaultValues: { old_password: '', new_password: '', confirm_password: '' }
  })

  const newPassword = watch('new_password')

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    try {
      const res = await profileApi.getProfile()
      const data = res.data.data
      setProfile(data)
      resetProfile({
        full_name: data.full_name || '',
        email: data.email || '',
        birth_place: data.student_profile?.birth_place || '',
        birth_date: data.student_profile?.birth_date
          ? new Date(data.student_profile.birth_date).toISOString().split('T')[0]
          : '',
        gender: data.student_profile?.gender || '',
        religion: data.student_profile?.religion || '',
        marital_status: data.student_profile?.marital_status || '',
        phone: data.student_profile?.phone || '',
        address: data.student_profile?.address || '',
        city: data.student_profile?.city || '',
      })
    } catch (err) {
      showToast(err.message || 'Gagal memuat profil', 'error')
    } finally {
      setLoading(false)
    }
  }, [resetProfile, showToast])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const handleUpdateProfile = useCallback(async (values) => {
    setEditLoading(true)
    try {
      await profileApi.updateProfile(values)
      showToast('Profil berhasil diperbarui')
      fetchProfile()
    } catch (err) {
      showToast(err.message || 'Gagal memperbarui profil', 'error')
    } finally {
      setEditLoading(false)
    }
  }, [fetchProfile, showToast])

  const handleChangePassword = useCallback(async (values) => {
    setPwLoading(true)
    try {
      await profileApi.changePassword(values)
      showToast('Password berhasil diubah')
      resetPw()
    } catch (err) {
      showToast(err.message || 'Gagal mengubah password', 'error')
    } finally {
      setPwLoading(false)
    }
  }, [resetPw, showToast])

  const handleAvatarChange = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarLoading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const res = await profileApi.updateAvatar(formData)

      // Ambil URL foto terbaru dari response atau fetch ulang profile
      await fetchProfile()

      // Sync session agar avatar di navbar ikut update
      const newPhotoUrl = res?.data?.data?.photo_url || null
      if (newPhotoUrl) {
        await update({ image: newPhotoUrl })
      }

      showToast('Avatar berhasil diperbarui')
    } catch (err) {
      showToast(err.message || 'Gagal mengupload avatar', 'error')
    } finally {
      setAvatarLoading(false)
      // Reset input file agar bisa upload file yang sama lagi
      e.target.value = ''
    }
  }, [fetchProfile, update, showToast])

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <CircularProgress />
      </div>
    )
  }

  const isStudent = !profile?.is_developer
  const photoUrl = profile?.student_profile?.photo

  return (
    <>
      <Grid container spacing={6}>
        {/* ── Left Card — Avatar + Info Akademik ── */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent className='flex flex-col items-center gap-6 pbs-12'>
              {/* Avatar */}
              <div className='relative'>
                <Box className='relative'>
                  {photoUrl ? (
                    <>
                      {/* Klik foto → buka fullsize */}
                      <Tooltip title='Lihat foto'>
                        <div
                          className='cursor-pointer rounded-full overflow-hidden'
                          style={{ width: 112, height: 112 }}
                          onClick={() => setPhotoPreview(true)}
                        >
                          <Image
                            src={photoUrl}
                            alt={profile?.full_name}
                            width={112}
                            height={112}
                            className='rounded-full object-cover'
                            style={{ width: 112, height: 112 }}
                          />
                        </div>
                      </Tooltip>
                    </>
                  ) : (
                    <CustomAvatar skin='light' color='primary' size={112} className='text-4xl'>
                      {getInitials(profile?.full_name || '')}
                    </CustomAvatar>
                  )}

                  {/* Tombol kamera — hanya untuk ganti foto, terpisah dari area klik foto */}
                  {isStudent && (
                    <Tooltip title='Ganti foto'>
                      <label
                        htmlFor='avatar-upload'
                        className='absolute bottom-0 right-0 cursor-pointer'
                        style={{ zIndex: 1 }}
                      >
                        <input
                          id='avatar-upload'
                          type='file'
                          accept='.jpg,.jpeg,.png,.webp'
                          className='hidden'
                          onChange={handleAvatarChange}
                        />
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid white',
                            '&:hover': { bgcolor: 'primary.dark' },
                            cursor: 'pointer',
                          }}
                        >
                          {avatarLoading
                            ? <CircularProgress size={14} sx={{ color: 'white' }} />
                            : <i className='ri-camera-line text-white text-sm' />
                          }
                        </Box>
                      </label>
                    </Tooltip>
                  )}
                </Box>
              </div>

              {/* Nama & username */}
              <div className='text-center'>
                <Typography variant='h5'>{profile?.full_name}</Typography>
                <Typography color='text.secondary'>@{profile?.username}</Typography>
              </div>

              <Divider className='w-full' />

              {/* Info detail */}
              <div className='w-full flex flex-col gap-4'>
                <Typography variant='subtitle2' color='text.secondary' className='uppercase tracking-wider text-xs'>
                  Detail
                </Typography>
                {isStudent && [
                  { icon: 'ri-id-card-line', label: 'NIM', value: profile?.student_profile?.nim || '-' },
                  { icon: 'ri-team-line', label: 'Sindikat', value: profile?.student_profile?.syndicate?.name || '-' },
                  { icon: 'ri-calendar-line', label: 'Angkatan', value: profile?.student_profile?.batch?.year || '-' },
                  { icon: 'ri-graduation-cap-line', label: 'Status', value: profile?.student_profile?.academic_status?.name || '-' },
                  { icon: 'ri-mail-line', label: 'Email', value: profile?.email || '-' },
                  { icon: 'ri-phone-line', label: 'Telepon', value: profile?.student_profile?.phone || '-' },
                ].map(({ icon, label, value }) => (
                  <Box key={label} className='flex items-center gap-3'>
                    <i className={`${icon} text-textSecondary text-xl`} />
                    <div>
                      <Typography variant='caption' color='text.secondary'>{label}</Typography>
                      <Typography variant='body2'>{value}</Typography>
                    </div>
                  </Box>
                ))}
                {!isStudent && (
                  <Box className='flex items-center gap-3'>
                    <i className='ri-shield-star-line text-textSecondary text-xl' />
                    <div>
                      <Typography variant='caption' color='text.secondary'>Role</Typography>
                      <div className='mt-0.5'>
                        <Chip label='Developer' color='error' size='small' variant='tonal' />
                      </div>
                    </div>
                  </Box>
                )}
              </div>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Right Column ── */}
        <Grid item xs={12} md={8}>
          <div className='flex flex-col gap-6'>

            {/* Edit Profil */}
            <Card>
              <CardContent>
                <Typography variant='h5' className='mb-6'>Edit Profil</Typography>
                <form onSubmit={handleProfileSubmit(handleUpdateProfile)}>
                  <Grid container spacing={4}>
                    <Grid item xs={12} sm={6}>
                      <Controller name='full_name' control={profileControl}
                                  rules={{ required: 'Nama wajib diisi', minLength: { value: 2, message: 'Min 2 karakter' } }}
                                  render={({ field }) => (
                                    <TextField {...field} fullWidth label='Nama Lengkap'
                                               error={!!profileErrors.full_name} helperText={profileErrors.full_name?.message} />
                                  )}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Controller name='email' control={profileControl}
                                  rules={{ required: 'Email wajib diisi', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email tidak valid' } }}
                                  render={({ field }) => (
                                    <TextField {...field} fullWidth label='Email'
                                               error={!!profileErrors.email} helperText={profileErrors.email?.message} />
                                  )}
                      />
                    </Grid>
                    {isStudent && (
                      <>
                        <Grid item xs={12} sm={6}>
                          <Controller name='birth_place' control={profileControl}
                                      rules={{ required: 'Tempat lahir wajib diisi' }}
                                      render={({ field }) => (
                                        <TextField {...field} fullWidth label='Tempat Lahir'
                                                   error={!!profileErrors.birth_place} helperText={profileErrors.birth_place?.message} />
                                      )}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Controller name='birth_date' control={profileControl}
                                      rules={{ required: 'Tanggal lahir wajib diisi' }}
                                      render={({ field }) => (
                                        <TextField {...field} fullWidth label='Tanggal Lahir' type='date'
                                                   InputLabelProps={{ shrink: true }}
                                                   error={!!profileErrors.birth_date} helperText={profileErrors.birth_date?.message} />
                                      )}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Controller name='gender' control={profileControl}
                                      rules={{ required: 'Wajib dipilih' }}
                                      render={({ field }) => (
                                        <FormControl fullWidth>
                                          <InputLabel>Jenis Kelamin</InputLabel>
                                          <Select {...field} label='Jenis Kelamin'>
                                            <MenuItem value='M'>Laki-laki</MenuItem>
                                            <MenuItem value='F'>Perempuan</MenuItem>
                                          </Select>
                                        </FormControl>
                                      )}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Controller name='marital_status' control={profileControl}
                                      rules={{ required: 'Wajib dipilih' }}
                                      render={({ field }) => (
                                        <FormControl fullWidth>
                                          <InputLabel>Status Pernikahan</InputLabel>
                                          <Select {...field} label='Status Pernikahan'>
                                            <MenuItem value='SINGLE'>Belum Menikah</MenuItem>
                                            <MenuItem value='MARRIED'>Menikah</MenuItem>
                                          </Select>
                                        </FormControl>
                                      )}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Controller name='religion' control={profileControl}
                                      rules={{ required: 'Wajib dipilih' }}
                                      render={({ field }) => (
                                        <FormControl fullWidth>
                                          <InputLabel>Agama</InputLabel>
                                          <Select {...field} label='Agama'>
                                            {['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'].map(r => (
                                              <MenuItem key={r} value={r}>{r}</MenuItem>
                                            ))}
                                          </Select>
                                        </FormControl>
                                      )}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Controller name='phone' control={profileControl}
                                      render={({ field }) => (
                                        <TextField {...field} fullWidth label='Nomor Telepon' />
                                      )}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Controller name='city' control={profileControl}
                                      render={({ field }) => (
                                        <TextField {...field} fullWidth label='Kota' />
                                      )}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Controller name='address' control={profileControl}
                                      render={({ field }) => (
                                        <TextField {...field} fullWidth multiline rows={2} label='Alamat' />
                                      )}
                          />
                        </Grid>
                      </>
                    )}
                    <Grid item xs={12}>
                      <div className='flex justify-end'>
                        <Button type='submit' variant='contained' disabled={editLoading}
                                startIcon={editLoading ? <CircularProgress size={16} color='inherit' /> : null}>
                          {editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </Button>
                      </div>
                    </Grid>
                  </Grid>
                </form>
              </CardContent>
            </Card>

            {/* Ganti Password */}
            <Card>
              <CardContent>
                <Typography variant='h5' className='mb-2'>Ganti Password</Typography>
                <Typography variant='body2' color='text.secondary' className='mb-6'>
                  Pastikan password baru minimal 6 karakter dan mudah kamu ingat.
                </Typography>
                <form onSubmit={handlePwSubmit(handleChangePassword)}>
                  <Grid container spacing={4}>
                    <Grid item xs={12}>
                      <Controller name='old_password' control={pwControl}
                                  rules={{ required: 'Password lama wajib diisi' }}
                                  render={({ field }) => (
                                    <TextField {...field} fullWidth label='Password Saat Ini'
                                               type={showOld ? 'text' : 'password'}
                                               error={!!pwErrors.old_password} helperText={pwErrors.old_password?.message}
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
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Controller name='new_password' control={pwControl}
                                  rules={{ required: 'Password baru wajib diisi', minLength: { value: 6, message: 'Min 6 karakter' } }}
                                  render={({ field }) => (
                                    <TextField {...field} fullWidth label='Password Baru'
                                               type={showNew ? 'text' : 'password'}
                                               error={!!pwErrors.new_password} helperText={pwErrors.new_password?.message}
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
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Controller name='confirm_password' control={pwControl}
                                  rules={{
                                    required: 'Konfirmasi wajib diisi',
                                    validate: val => val === newPassword || 'Password tidak cocok'
                                  }}
                                  render={({ field }) => (
                                    <TextField {...field} fullWidth label='Konfirmasi Password'
                                               type={showConfirm ? 'text' : 'password'}
                                               error={!!pwErrors.confirm_password} helperText={pwErrors.confirm_password?.message}
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
                    </Grid>
                    <Grid item xs={12}>
                      <div className='flex justify-end'>
                        <Button type='submit' variant='contained' color='warning' disabled={pwLoading}
                                startIcon={pwLoading ? <CircularProgress size={16} color='inherit' /> : <i className='ri-lock-password-line' />}>
                          {pwLoading ? 'Menyimpan...' : 'Ubah Password'}
                        </Button>
                      </div>
                    </Grid>
                  </Grid>
                </form>
              </CardContent>
            </Card>

          </div>
        </Grid>
      </Grid>

      {/* ── Dialog Foto Fullsize ── */}
      <Dialog
        open={photoPreview}
        onClose={() => setPhotoPreview(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogContent className='flex items-center justify-center p-4 relative'>
          <IconButton
            onClick={() => setPhotoPreview(false)}
            className='absolute top-2 right-2'
            size='small'
          >
            <i className='ri-close-line text-xl' />
          </IconButton>
          {photoUrl && (
            <Image
              src={photoUrl}
              alt={profile?.full_name || ''}
              width={480}
              height={480}
              className='rounded-lg object-contain'
              style={{ maxWidth: '100%', maxHeight: '70vh' }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Toast ── */}
      <Snackbar open={toast.open} autoHideDuration={4000}
                onClose={() => setToast(t => ({ ...t, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity={toast.severity} variant='filled'
               onClose={() => setToast(t => ({ ...t, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  )
}

export default ProfileView
