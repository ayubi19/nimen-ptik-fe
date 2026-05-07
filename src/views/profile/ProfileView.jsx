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
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import 'dayjs/locale/id'

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
      full_name: '', email: '', birth_place: '', birth_date: null,
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
        birth_date: data.student_profile?.birth_date ? dayjs(data.student_profile.birth_date) : null,
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
      const profilePayload = {
        ...values,
        birth_date: values.birth_date ? dayjs(values.birth_date).format('YYYY-MM-DD') : '',
      }
      await profileApi.updateProfile(profilePayload)
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
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale='id'>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Profil card */}
        <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', pt: '20px', pb: '16px', px: 2 }}>
            {/* Avatar */}
            <Box sx={{ position: 'relative' }}>
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
                <Box sx={{ width: 80, height: 80, borderRadius: '20px', background: 'linear-gradient(145deg, #E63946, #6D0E13)', boxShadow: '0 5px 14px rgba(180,0,30,0.28), inset 0 1px 0 rgba(255,180,180,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 600, color: 'rgba(255,255,255,0.95)' }}>
                  {getInitials(profile?.full_name || '')}
                </Box>
              )}

              {/* Tombol kamera — hanya untuk ganti foto, terpisah dari area klik foto */}
              {isStudent && (
                <label htmlFor='avatar-upload' style={{ position: 'absolute', bottom: -2, right: -2, cursor: 'pointer', zIndex: 1 }}>
                  <input id='avatar-upload' type='file' accept='.jpg,.jpeg,.png,.webp' className='hidden' onChange={handleAvatarChange} />
                  <Box sx={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(145deg, #E63946, #6D0E13)', boxShadow: '0 2px 6px rgba(180,0,30,0.3)', border: '2px solid #F5F2F0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    {avatarLoading ? <CircularProgress size={12} sx={{ color: '#fff' }} /> : <i className='ri-camera-line' style={{ fontSize: '12px', color: '#fff' }} />}
                  </Box>
                </label>
              )}
            </Box>

            {/* Nama & username */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: '17px', fontWeight: 600, color: '#3B1010' }}>{profile?.full_name}</Typography>
              <Typography sx={{ fontSize: '12px', color: '#9A5A5A' }}>@{profile?.username}</Typography>
            </Box>
          </Box>

          {/* Info detail */}
          <Box sx={{ borderTop: '0.5px solid rgba(180,100,100,0.1)', px: 2, py: '10px', display: 'flex', flexDirection: 'column', gap: 0 }}>
            <Typography sx={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9A5A5A', mb: '8px' }}>Detail</Typography>
            {isStudent && [
              { icon: 'ri-id-card-line',         label: 'NIM',      value: profile?.student_profile?.nim || '-' },
              { icon: 'ri-team-line',             label: 'Sindikat', value: profile?.student_profile?.syndicate?.name || '-' },
              { icon: 'ri-calendar-line',         label: 'Angkatan', value: profile?.student_profile?.batch?.year || '-' },
              { icon: 'ri-graduation-cap-line',   label: 'Status',   value: profile?.student_profile?.academic_status?.name || '-' },
              { icon: 'ri-mail-line',             label: 'Email',    value: profile?.email || '-' },
              { icon: 'ri-phone-line',            label: 'Telepon',  value: profile?.student_profile?.phone || '-' },
            ].map(({ icon, label, value }, i, arr) => (
              <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: '12px', py: '9px', borderBottom: i < arr.length - 1 ? '0.5px solid rgba(180,100,100,0.08)' : 'none' }}>
                <i className={icon} style={{ fontSize: '18px', color: '#9A5A5A', width: 20, textAlign: 'center', flexShrink: 0 }} />
                <Box>
                  <Typography sx={{ fontSize: '10px', color: '#9A5A5A' }}>{label}</Typography>
                  <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#3B1010' }}>{value}</Typography>
                </Box>
              </Box>
            ))}
            {!isStudent && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', py: '9px' }}>
                <i className='ri-shield-star-line' style={{ fontSize: '18px', color: '#9A5A5A', width: 20, textAlign: 'center', flexShrink: 0 }} />
                <Box>
                  <Typography sx={{ fontSize: '10px', color: '#9A5A5A' }}>Role</Typography>
                  <Box sx={{ bgcolor: '#FCEBEB', borderRadius: '6px', px: '8px', py: '2px', display: 'inline-block', mt: '2px' }}>
                    <Typography sx={{ fontSize: '10px', fontWeight: 600, color: '#A32D2D' }}>Developer</Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </Box>

        {/* Edit Profil — native */}
        <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
          <Box sx={{ px: 2, py: '10px', borderBottom: '0.5px solid rgba(180,100,100,0.1)' }}>
            <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#3B1010' }}>Edit Profil</Typography>
          </Box>
          <Box component='form' onSubmit={handleProfileSubmit(handleUpdateProfile)} sx={{ p: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Controller name='full_name' control={profileControl}
                        rules={{ required: 'Nama wajib diisi', minLength: { value: 2, message: 'Min 2 karakter' } }}
                        render={({ field }) => (
                          <TextField {...field} fullWidth size='small' placeholder='Nama Lengkap'
                                     error={!!profileErrors.full_name} helperText={profileErrors.full_name?.message}
                                     sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15) !important' } }, '& input': { py: '10px', px: '12px', fontSize: '12px' } }} />
                        )}
            />
            <Controller name='email' control={profileControl}
                        rules={{ required: 'Email wajib diisi', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email tidak valid' } }}
                        render={({ field }) => (
                          <TextField {...field} fullWidth size='small' placeholder='Email'
                                     error={!!profileErrors.email} helperText={profileErrors.email?.message}
                                     sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15) !important' } }, '& input': { py: '10px', px: '12px', fontSize: '12px' } }} />
                        )}
            />
            {isStudent && (
              <>
                <Controller name='birth_place' control={profileControl}
                            rules={{ required: 'Tempat lahir wajib diisi' }}
                            render={({ field }) => (
                              <TextField {...field} fullWidth size='small' placeholder='Tempat Lahir'
                                         error={!!profileErrors.birth_place} helperText={profileErrors.birth_place?.message}
                                         sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15) !important' } }, '& input': { py: '10px', px: '12px', fontSize: '12px' } }} />
                            )}
                />
                <Controller name='birth_date' control={profileControl}
                            rules={{ required: 'Tanggal lahir wajib diisi' }}
                            render={({ field }) => (
                              <DatePicker value={field.value} onChange={field.onChange} format='DD/MM/YYYY'
                                          slotProps={{ textField: { fullWidth: true, size: 'small', placeholder: 'Tanggal Lahir', error: !!profileErrors.birth_date, helperText: profileErrors.birth_date?.message,
                                              sx: { '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15) !important' } }, '& input': { py: '10px', px: '12px', fontSize: '12px' } } } }}
                              />
                            )}
                />
                <Box sx={{ display: 'flex', gap: '8px' }}>
                  <Controller name='gender' control={profileControl} rules={{ required: 'Wajib dipilih' }}
                              render={({ field }) => (
                                <FormControl fullWidth size='small' sx={{ flex: 1 }}>
                                  <Select displayEmpty {...field} renderValue={val => val === 'M' ? 'Laki-laki' : val === 'F' ? 'Perempuan' : 'Jenis Kelamin'}
                                          sx={{ borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0', '& .MuiOutlinedInput-notchedOutline': { border: '0.5px solid rgba(180,100,100,0.15) !important' }, '& .MuiSelect-select': { py: '10px', px: '12px' } }}>
                                    <MenuItem value='M'>Laki-laki</MenuItem>
                                    <MenuItem value='F'>Perempuan</MenuItem>
                                  </Select>
                                </FormControl>
                              )}
                  />
                  <Controller name='marital_status' control={profileControl} rules={{ required: 'Wajib dipilih' }}
                              render={({ field }) => (
                                <FormControl fullWidth size='small' sx={{ flex: 1 }}>
                                  <Select displayEmpty {...field} renderValue={val => val === 'SINGLE' ? 'Belum Menikah' : val === 'MARRIED' ? 'Menikah' : 'Status Nikah'}
                                          sx={{ borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0', '& .MuiOutlinedInput-notchedOutline': { border: '0.5px solid rgba(180,100,100,0.15) !important' }, '& .MuiSelect-select': { py: '10px', px: '12px' } }}>
                                    <MenuItem value='SINGLE'>Belum Menikah</MenuItem>
                                    <MenuItem value='MARRIED'>Menikah</MenuItem>
                                  </Select>
                                </FormControl>
                              )}
                  />
                </Box>
                <Controller name='religion' control={profileControl} rules={{ required: 'Wajib dipilih' }}
                            render={({ field }) => (
                              <FormControl fullWidth size='small'>
                                <Select displayEmpty {...field} renderValue={val => val || 'Agama'}
                                        sx={{ borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0', '& .MuiOutlinedInput-notchedOutline': { border: '0.5px solid rgba(180,100,100,0.15) !important' }, '& .MuiSelect-select': { py: '10px', px: '12px' } }}>
                                  {['Islam','Kristen','Katolik','Hindu','Buddha','Konghucu'].map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                                </Select>
                              </FormControl>
                            )}
                />
                <Controller name='phone' control={profileControl}
                            render={({ field }) => (
                              <TextField {...field} fullWidth size='small' placeholder='Nomor Telepon'
                                         sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15) !important' } }, '& input': { py: '10px', px: '12px', fontSize: '12px' } }} />
                            )}
                />
                <Controller name='city' control={profileControl}
                            render={({ field }) => (
                              <TextField {...field} fullWidth size='small' placeholder='Kota'
                                         sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15) !important' } }, '& input': { py: '10px', px: '12px', fontSize: '12px' } }} />
                            )}
                />
                <Controller name='address' control={profileControl}
                            render={({ field }) => (
                              <TextField {...field} fullWidth size='small' multiline rows={2} placeholder='Alamat'
                                         sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15) !important' } }, '& textarea': { fontSize: '12px' } }} />
                            )}
                />
              </>
            )}
            <Box component='button' type='submit' disabled={editLoading} sx={{ width: '100%', py: '10px', borderRadius: '10px', border: 'none', cursor: editLoading ? 'not-allowed' : 'pointer', background: editLoading ? '#ccc' : 'linear-gradient(145deg, #E63946, #6D0E13)', boxShadow: '0 4px 10px rgba(180,0,30,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              {editLoading && <CircularProgress size={14} sx={{ color: '#fff' }} />}
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}</Typography>
            </Box>
          </Box>
        </Box>

        {/* Ganti Password — native */}
        <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
          <Box sx={{ px: 2, py: '10px', borderBottom: '0.5px solid rgba(180,100,100,0.1)' }}>
            <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#3B1010' }}>Ganti Password</Typography>
            <Typography sx={{ fontSize: '10px', color: '#9A5A5A' }}>Minimal 6 karakter</Typography>
          </Box>
          <Box component='form' onSubmit={handlePwSubmit(handleChangePassword)} sx={{ p: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Controller name='old_password' control={pwControl}
                        rules={{ required: 'Password lama wajib diisi' }}
                        render={({ field }) => (
                          <TextField {...field} fullWidth size='small' placeholder='Password Saat Ini'
                                     type={showOld ? 'text' : 'password'}
                                     error={!!pwErrors.old_password} helperText={pwErrors.old_password?.message}
                                     sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15) !important' } }, '& input': { py: '10px', px: '12px', fontSize: '12px' } }}
                                     InputProps={{ endAdornment: <InputAdornment position='end'><IconButton onClick={() => setShowOld(!showOld)} edge='end' size='small'><i className={`ri-${showOld ? 'eye-off' : 'eye'}-line`} /></IconButton></InputAdornment> }}
                          />
                        )}
            />
            <Controller name='new_password' control={pwControl}
                        rules={{ required: 'Password baru wajib diisi', minLength: { value: 6, message: 'Min 6 karakter' } }}
                        render={({ field }) => (
                          <TextField {...field} fullWidth size='small' placeholder='Password Baru'
                                     type={showNew ? 'text' : 'password'}
                                     error={!!pwErrors.new_password} helperText={pwErrors.new_password?.message}
                                     sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15) !important' } }, '& input': { py: '10px', px: '12px', fontSize: '12px' } }}
                                     InputProps={{ endAdornment: <InputAdornment position='end'><IconButton onClick={() => setShowNew(!showNew)} edge='end' size='small'><i className={`ri-${showNew ? 'eye-off' : 'eye'}-line`} /></IconButton></InputAdornment> }}
                          />
                        )}
            />
            <Controller name='confirm_password' control={pwControl}
                        rules={{ required: 'Konfirmasi wajib diisi', validate: val => val === newPassword || 'Password tidak cocok' }}
                        render={({ field }) => (
                          <TextField {...field} fullWidth size='small' placeholder='Konfirmasi Password'
                                     type={showConfirm ? 'text' : 'password'}
                                     error={!!pwErrors.confirm_password} helperText={pwErrors.confirm_password?.message}
                                     sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15) !important' } }, '& input': { py: '10px', px: '12px', fontSize: '12px' } }}
                                     InputProps={{ endAdornment: <InputAdornment position='end'><IconButton onClick={() => setShowConfirm(!showConfirm)} edge='end' size='small'><i className={`ri-${showConfirm ? 'eye-off' : 'eye'}-line`} /></IconButton></InputAdornment> }}
                          />
                        )}
            />
            <Box component='button' type='submit' disabled={pwLoading} sx={{ width: '100%', py: '10px', borderRadius: '10px', border: 'none', cursor: pwLoading ? 'not-allowed' : 'pointer', background: pwLoading ? '#ccc' : 'linear-gradient(145deg, #BA7517, #8a5510)', boxShadow: '0 4px 10px rgba(186,117,23,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              {pwLoading ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <i className='ri-lock-password-line' style={{ fontSize: '14px', color: '#fff' }} />}
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{pwLoading ? 'Menyimpan...' : 'Ubah Password'}</Typography>
            </Box>
          </Box>
        </Box>

      </Box>

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
    </LocalizationProvider>
  )
}

export default ProfileView
