'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Chip from '@mui/material/Chip'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import 'dayjs/locale/id'
import { useForm, Controller } from 'react-hook-form'
import { nimenSprintApi } from '@/libs/api/nimenSprintApi'
import { batchApi } from '@/libs/api/masterDataApi'
import { nimenIndicatorApi } from '@/libs/api/nimenMasterDataApi'

dayjs.locale('id')

const NimenSprintFormView = ({ sprintId = null }) => {
  const router = useRouter()
  const isEdit = !!sprintId
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(isEdit)
  const [batches, setBatches] = useState([])
  const [indicators, setIndicators] = useState([])
  const [indicatorSearch, setIndicatorSearch] = useState('')
  const [indicatorLoading, setIndicatorLoading] = useState(false)
  const [selectedIndicatorObj, setSelectedIndicatorObj] = useState(null)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const showToast = useCallback((message, severity = 'success') => {
    setToast({ open: true, message, severity })
  }, [])

  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      batch_id: '',
      sprint_number: '',
      title: '',
      description: '',
      indicator_id: '',
      event_date: null,
      location: '',
      participant_quota: '',
      submission_deadline: null,
    }
  })

  // Load master data
  useEffect(() => {
    batchApi.getAllActive().then(res => setBatches(res.data.data || [])).catch(() => {})
  }, [])

  // Load sprint data saat edit
  useEffect(() => {
    if (!isEdit) return
    setPageLoading(true)
    nimenSprintApi.getById(sprintId)
      .then(res => {
        const s = res.data.data
        setSelectedIndicatorObj(s.indicator || null)
        reset({
          batch_id: s.batch_id,
          sprint_number: s.sprint_number,
          title: s.title,
          description: s.description || '',
          indicator_id: s.indicator_id,
          event_date: s.event_date ? dayjs(s.event_date) : null,
          location: s.location || '',
          participant_quota: s.participant_quota,
          submission_deadline: s.submission_deadline ? dayjs(s.submission_deadline) : null,
        })
      })
      .catch(() => showToast('Gagal memuat data sprint', 'error'))
      .finally(() => setPageLoading(false))
  }, [isEdit, sprintId, reset, showToast])

  // Search indikator dengan debounce
  useEffect(() => {
    if (indicatorSearch.length < 2) return
    setIndicatorLoading(true)
    const t = setTimeout(() => {
      nimenIndicatorApi.getAll({ search: indicatorSearch, page_size: 20, is_active: true })
        .then(res => setIndicators(res.data.data.data || []))
        .catch(() => {})
        .finally(() => setIndicatorLoading(false))
    }, 400)
    return () => clearTimeout(t)
  }, [indicatorSearch])

  const handleSubmitForm = useCallback(async (values) => {
    setLoading(true)
    try {
      const payload = {
        batch_id: parseInt(values.batch_id),
        sprint_number: values.sprint_number,
        title: values.title,
        description: values.description || '',
        indicator_id: parseInt(values.indicator_id),
        event_date: values.event_date ? dayjs(values.event_date).format('YYYY-MM-DD') : '',
        location: values.location || '',
        participant_quota: parseInt(values.participant_quota),
        submission_deadline: values.submission_deadline ? dayjs(values.submission_deadline).format('YYYY-MM-DD') : '',
      }

      if (isEdit) {
        await nimenSprintApi.update(sprintId, payload)
        showToast('Sprint berhasil diperbarui')
        setTimeout(() => router.push('/nimen/sprints'), 800)
      } else {
        const res = await nimenSprintApi.create(payload)
        showToast('Sprint berhasil dibuat')
        const newId = res.data.data.id
        setTimeout(() => router.push(`/nimen/sprints/${newId}`), 800)
      }
    } catch (err) {
      showToast(err.message || 'Terjadi kesalahan', 'error')
    } finally {
      setLoading(false)
    }
  }, [isEdit, sprintId, router, showToast])

  if (pageLoading) {
    return <div className='flex justify-center py-20'><CircularProgress /></div>
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale='id'>
      <>
        <form onSubmit={handleSubmit(handleSubmitForm)}>
          <Grid container spacing={6}>

            {/* Info Sprint */}
            <Grid item xs={12}>
              <Card>
                <CardHeader
                  title={isEdit ? 'Edit Draft Sprint' : 'Buat Draft Sprint'}
                  subheader='Informasi dasar sprint berdasarkan surat keputusan pimpinan'
                />
                <Divider />
                <CardContent>
                  <Grid container spacing={4}>
                    <Grid item xs={12} sm={6}>
                      <Controller name='batch_id' control={control} rules={{ required: 'Angkatan wajib dipilih' }}
                                  render={({ field }) => (
                                    <FormControl fullWidth error={!!errors.batch_id}>
                                      <InputLabel>Angkatan</InputLabel>
                                      <Select {...field} label='Angkatan' disabled={isEdit}>
                                        {batches.map(b => <MenuItem key={b.id} value={b.id}>{b.name} ({b.year})</MenuItem>)}
                                      </Select>
                                      {errors.batch_id && <Typography variant='caption' color='error'>{errors.batch_id.message}</Typography>}
                                    </FormControl>
                                  )}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Controller name='sprint_number' control={control} rules={{ required: 'Nomor sprint wajib diisi' }}
                                  render={({ field }) => (
                                    <TextField {...field} fullWidth label='Nomor Sprint' placeholder='Contoh: SP/001/IV/2026'
                                               error={!!errors.sprint_number} helperText={errors.sprint_number?.message} />
                                  )}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Controller name='title' control={control} rules={{ required: 'Nama kegiatan wajib diisi' }}
                                  render={({ field }) => (
                                    <TextField {...field} fullWidth label='Nama Kegiatan' placeholder='Contoh: Upacara 17 Agustus 2026'
                                               error={!!errors.title} helperText={errors.title?.message} />
                                  )}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Controller name='description' control={control}
                                  render={({ field }) => (
                                    <TextField {...field} fullWidth multiline rows={3} label='Deskripsi (opsional)' />
                                  )}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Indikator Nilai */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title='Indikator Nilai' subheader='Pilih indikator nilai yang akan diberikan kepada peserta sprint ini' />
                <Divider />
                <CardContent>
                  <Grid container spacing={4} alignItems='center'>
                    <Grid item xs={12} sm={8}>
                      <Controller name='indicator_id' control={control} rules={{ required: 'Indikator wajib dipilih' }}
                                  render={({ field }) => (
                                    <Autocomplete
                                      options={indicators}
                                      loading={indicatorLoading}
                                      getOptionLabel={opt => opt.name || ''}
                                      isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                                      value={selectedIndicatorObj}
                                      onInputChange={(_, val) => setIndicatorSearch(val)}
                                      onChange={(_, val) => {
                                        setSelectedIndicatorObj(val)
                                        field.onChange(val?.id || '')
                                      }}
                                      renderOption={(props, opt) => (
                                        <li {...props} key={opt.id}>
                                          <div>
                                            <div className='flex items-center gap-2'>
                                              <Chip
                                                label={opt.value >= 0 ? `+${opt.value}` : `${opt.value}`}
                                                color={opt.value >= 0 ? 'success' : 'error'}
                                                size='small' sx={{ fontWeight: 700, minWidth: 50 }}
                                              />
                                              <Typography variant='body2' fontWeight={600}>{opt.name}</Typography>
                                            </div>
                                            <Typography variant='caption' color='text.secondary' sx={{ ml: 0.5 }}>
                                              {opt.variable?.name} • {opt.variable?.category?.name}
                                            </Typography>
                                          </div>
                                        </li>
                                      )}
                                      renderInput={params => (
                                        <TextField {...params} label='Cari Indikator' placeholder='Ketik minimal 2 karakter...'
                                                   error={!!errors.indicator_id}
                                                   helperText={errors.indicator_id?.message || 'Cari berdasarkan nama indikator'}
                                                   InputProps={{
                                                     ...params.InputProps,
                                                     endAdornment: (
                                                       <>
                                                         {indicatorLoading ? <CircularProgress size={16} /> : null}
                                                         {params.InputProps.endAdornment}
                                                       </>
                                                     )
                                                   }}
                                        />
                                      )}
                                    />
                                  )}
                      />
                    </Grid>
                    {selectedIndicatorObj && (
                      <Grid item xs={12} sm={4}>
                        <Box className='p-4 rounded-lg border' sx={{
                          borderColor: selectedIndicatorObj.value >= 0 ? 'success.main' : 'error.main',
                          bgcolor: selectedIndicatorObj.value >= 0 ? 'success.light' : 'error.light'
                        }}>
                          <Typography variant='caption' color='text.secondary'>Nilai yang akan diberikan</Typography>
                          <Typography variant='h4' fontWeight={700}
                                      color={selectedIndicatorObj.value >= 0 ? 'success.main' : 'error.main'}>
                            {selectedIndicatorObj.value >= 0 ? '+' : ''}{selectedIndicatorObj.value}
                          </Typography>
                          <Typography variant='caption'>{selectedIndicatorObj.variable?.name}</Typography>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Waktu & Tempat */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title='Waktu & Tempat' />
                <Divider />
                <CardContent>
                  <Grid container spacing={4}>
                    <Grid item xs={12} sm={4}>
                      <Controller name='event_date' control={control}
                                  rules={{ required: 'Tanggal kegiatan wajib diisi' }}
                                  render={({ field }) => (
                                    <DatePicker
                                      label='Tanggal Kegiatan'
                                      value={field.value}
                                      onChange={field.onChange}
                                      format='DD/MM/YYYY'
                                      slotProps={{
                                        textField: {
                                          fullWidth: true,
                                          error: !!errors.event_date,
                                          helperText: errors.event_date?.message,
                                        }
                                      }}
                                    />
                                  )}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Controller name='submission_deadline' control={control}
                                  rules={{ required: 'Batas pengumpulan wajib diisi' }}
                                  render={({ field }) => (
                                    <DatePicker
                                      label='Batas Pengumpulan Dokumen'
                                      value={field.value}
                                      onChange={field.onChange}
                                      format='DD/MM/YYYY'
                                      slotProps={{
                                        textField: {
                                          fullWidth: true,
                                          error: !!errors.submission_deadline,
                                          helperText: errors.submission_deadline?.message || 'Batas mahasiswa upload softcopy',
                                        }
                                      }}
                                    />
                                  )}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Controller name='location' control={control}
                                  render={({ field }) => (
                                    <TextField {...field} fullWidth label='Lokasi (opsional)' placeholder='Contoh: Lapangan Upacara STIK' />
                                  )}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Kuota */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title='Kuota Peserta' subheader='Jumlah peserta yang dibutuhkan untuk sprint ini' />
                <Divider />
                <CardContent>
                  <Grid container spacing={4} alignItems='center'>
                    <Grid item xs={12} sm={4}>
                      <Controller name='participant_quota' control={control}
                                  rules={{ required: 'Kuota wajib diisi', min: { value: 1, message: 'Min 1 peserta' } }}
                                  render={({ field }) => (
                                    <TextField {...field} fullWidth label='Jumlah Peserta' type='number'
                                               inputProps={{ min: 1 }}
                                               error={!!errors.participant_quota} helperText={errors.participant_quota?.message} />
                                  )}
                      />
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <Box className='flex items-start gap-2 p-3 rounded-lg' sx={{ bgcolor: 'info.light' }}>
                        <i className='ri-information-line text-info-main text-xl flex-shrink-0 mt-0.5' />
                        <Typography variant='body2'>
                          Kuota dapat diubah selama sprint masih berstatus Draft Admin. Setelah sprint aktif, hanya pejabat yang dapat mengganti nama peserta (tidak bisa menambah kuota).
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Action */}
            <Grid item xs={12}>
              <div className='flex justify-end gap-4'>
                <Button variant='tonal' color='secondary' onClick={() => router.back()} disabled={loading}>
                  Batal
                </Button>
                <Button type='submit' variant='contained' disabled={loading}
                        startIcon={loading ? <CircularProgress size={18} color='inherit' /> : <i className='ri-save-line' />}>
                  {loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Draft Sprint'}
                </Button>
              </div>
            </Grid>

          </Grid>
        </form>

        <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast(t => ({ ...t, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <Alert severity={toast.severity} variant='filled' onClose={() => setToast(t => ({ ...t, open: false }))}>{toast.message}</Alert>
        </Snackbar>
      </>
    </LocalizationProvider>
  )
}

export default NimenSprintFormView
