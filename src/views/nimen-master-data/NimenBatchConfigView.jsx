'use client'

import { useEffect, useState, useCallback } from 'react'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import Chip from '@mui/material/Chip'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import InputAdornment from '@mui/material/InputAdornment'
import Box from '@mui/material/Box'
import { useForm, Controller } from 'react-hook-form'
import { batchApi } from '@/libs/api/masterDataApi'
import { batchNimenConfigApi } from '@/libs/api/nimenMasterDataApi'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import 'dayjs/locale/id'

const NimenBatchConfigView = () => {
  const [batches, setBatches] = useState([])
  const [selectedBatch, setSelectedBatch] = useState('')
  const [config, setConfig] = useState(null)
  const [loadingBatches, setLoadingBatches] = useState(false)
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const showToast = useCallback((message, severity = 'success') => {
    setToast({ open: true, message, severity })
  }, [])

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      duration_years: 1,
      start_date: null,
      end_date: null,
      nimen_freeze_date: null,
      max_nimen_value: 95,
      initial_nimen_value: 73,
    }
  })

  // Load semua angkatan aktif untuk dropdown
  useEffect(() => {
    setLoadingBatches(true)
    batchApi.getAllActive()
      .then(res => setBatches(res.data.data || []))
      .catch(() => showToast('Gagal memuat data angkatan', 'error'))
      .finally(() => setLoadingBatches(false))
  }, [showToast])

  // Load config saat angkatan dipilih
  const loadConfig = useCallback(async (batchId) => {
    setLoadingConfig(true)
    setConfig(null)
    try {
      const res = await batchNimenConfigApi.getConfig(batchId)
      const data = res.data.data
      setConfig(data)
      reset({
        duration_years: data.duration_years || 1,
        start_date: data.start_date ? dayjs(data.start_date) : null,
        end_date: data.end_date ? dayjs(data.end_date) : null,
        nimen_freeze_date: data.nimen_freeze_date ? dayjs(data.nimen_freeze_date) : null,
        max_nimen_value: data.max_nimen_value || 95,
        initial_nimen_value: data.initial_nimen_value || 73,
      })
    } catch (err) {
      showToast(err.message || 'Gagal memuat konfigurasi', 'error')
    } finally {
      setLoadingConfig(false)
    }
  }, [reset, showToast])

  const handleBatchChange = useCallback((batchId) => {
    setSelectedBatch(batchId)
    if (batchId) loadConfig(batchId)
  }, [loadConfig])

  const handleSave = useCallback(async (values) => {
    setSaveLoading(true)
    try {
      const payload = {
        duration_years: parseInt(values.duration_years),
        start_date: values.start_date ? dayjs(values.start_date).format('YYYY-MM-DD') : null,
        end_date: values.end_date ? dayjs(values.end_date).format('YYYY-MM-DD') : null,
        nimen_freeze_date: values.nimen_freeze_date ? dayjs(values.nimen_freeze_date).format('YYYY-MM-DD') : null,
        max_nimen_value: parseFloat(values.max_nimen_value),
        initial_nimen_value: parseFloat(values.initial_nimen_value),
      }
      await batchNimenConfigApi.updateConfig(selectedBatch, payload)
      showToast('Konfigurasi NIMEN berhasil diperbarui')
      loadConfig(selectedBatch)
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan konfigurasi', 'error')
    } finally {
      setSaveLoading(false)
    }
  }, [selectedBatch, loadConfig, showToast])

  const selectedBatchData = batches.find(b => b.id === selectedBatch)

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale='id'>
      <>
        {/* Pilih Angkatan */}
        <Card className='mb-6'>
          <CardContent>
            <div className='flex flex-wrap items-center gap-4'>
              <Typography variant='h6' className='flex-shrink-0'>Konfigurasi NIMEN per Angkatan</Typography>
              <FormControl size='small' sx={{ minWidth: 200 }} disabled={loadingBatches}>
                <InputLabel>Pilih Angkatan</InputLabel>
                <Select
                  label='Pilih Angkatan'
                  value={selectedBatch}
                  onChange={e => handleBatchChange(e.target.value)}
                >
                  {batches.map(b => (
                    <MenuItem key={b.id} value={b.id}>{b.name} ({b.year})</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {loadingBatches && <CircularProgress size={20} />}
            </div>
          </CardContent>
        </Card>

        {!selectedBatch && (
          <Box className='flex flex-col items-center justify-center py-16 gap-3' sx={{ color: 'text.secondary' }}>
            <i className='ri-settings-3-line text-6xl opacity-30' />
            <Typography variant='body1'>Pilih angkatan terlebih dahulu untuk mengatur konfigurasi NIMEN</Typography>
          </Box>
        )}

        {selectedBatch && loadingConfig && (
          <Box className='flex justify-center py-16'><CircularProgress /></Box>
        )}

        {selectedBatch && !loadingConfig && config && (
          <form onSubmit={handleSubmit(handleSave)}>
            <Grid container spacing={6}>

              {/* Info Angkatan */}
              <Grid item xs={12}>
                <Card>
                  <CardHeader
                    title={
                      <div className='flex items-center gap-3'>
                        <Typography variant='h6'>Angkatan {selectedBatchData?.name}</Typography>
                        <Chip label={`${selectedBatchData?.year}`} color='primary' size='small' variant='tonal' />
                      </div>
                    }
                  />
                </Card>
              </Grid>

              {/* Durasi Pendidikan */}
              <Grid item xs={12}>
                <Card>
                  <CardHeader title='Durasi & Periode Pendidikan' subheader='Atur rentang waktu pendidikan angkatan ini' />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={4}>
                      <Grid item xs={12} sm={4}>
                        <Controller name='duration_years' control={control}
                                    rules={{ required: 'Wajib diisi', min: { value: 1, message: 'Min 1 tahun' }, max: { value: 10, message: 'Max 10 tahun' } }}
                                    render={({ field }) => (
                                      <TextField {...field} fullWidth label='Durasi Pendidikan' type='number'
                                                 inputProps={{ min: 1, max: 10 }}
                                                 error={!!errors.duration_years} helperText={errors.duration_years?.message}
                                                 InputProps={{ endAdornment: <InputAdornment position='end'>tahun</InputAdornment> }}
                                      />
                                    )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Controller name='start_date' control={control}
                                    render={({ field }) => (
                                      <DatePicker
                                        label='Tanggal Mulai'
                                        value={field.value}
                                        onChange={field.onChange}
                                        format='DD/MM/YYYY'
                                        slotProps={{
                                          textField: { fullWidth: true, helperText: 'Tanggal awal pendidikan angkatan ini' }
                                        }}
                                      />
                                    )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Controller name='end_date' control={control}
                                    render={({ field }) => (
                                      <DatePicker
                                        label='Tanggal Selesai'
                                        value={field.value}
                                        onChange={field.onChange}
                                        format='DD/MM/YYYY'
                                        slotProps={{
                                          textField: { fullWidth: true, helperText: 'Tanggal akhir pendidikan angkatan ini' }
                                        }}
                                      />
                                    )}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Konfigurasi NIMEN */}
              <Grid item xs={12}>
                <Card>
                  <CardHeader title='Konfigurasi Nilai NIMEN' subheader='Atur batas nilai dan nilai awal untuk angkatan ini' />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={4}>
                      <Grid item xs={12} sm={6}>
                        <Controller name='max_nimen_value' control={control}
                                    rules={{ required: 'Wajib diisi', min: { value: 1, message: 'Min 1' } }}
                                    render={({ field }) => (
                                      <TextField {...field} fullWidth label='Nilai Maksimum NIMEN' type='number'
                                                 inputProps={{ min: 1, step: 0.01 }}
                                                 error={!!errors.max_nimen_value} helperText={errors.max_nimen_value?.message || 'Total nilai tertinggi yang bisa diraih mahasiswa'}
                                      />
                                    )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Controller name='initial_nimen_value' control={control}
                                    rules={{ required: 'Wajib diisi', min: { value: 0, message: 'Min 0' } }}
                                    render={({ field }) => (
                                      <TextField {...field} fullWidth label='Nilai Awal Mahasiswa' type='number'
                                                 inputProps={{ min: 0, step: 0.01 }}
                                                 error={!!errors.initial_nimen_value} helperText={errors.initial_nimen_value?.message || 'Nilai yang diberikan saat mahasiswa pertama kali terdaftar'}
                                      />
                                    )}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Freeze Date */}
              <Grid item xs={12}>
                <Card>
                  <CardHeader
                    title='Batas Akhir Input NIMEN (Freeze Date)'
                    subheader='Setelah tanggal ini, semua input nilai NIMEN untuk angkatan ini akan diblokir otomatis'
                  />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={4} alignItems='center'>
                      <Grid item xs={12} sm={4}>
                        <Controller name='nimen_freeze_date' control={control}
                                    render={({ field }) => (
                                      <DatePicker
                                        label='Tanggal Freeze NIMEN'
                                        value={field.value}
                                        onChange={field.onChange}
                                        format='DD/MM/YYYY'
                                        slotProps={{
                                          textField: { fullWidth: true }
                                        }}
                                      />
                                    )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={8}>
                        <Box className='flex items-start gap-2 p-3 rounded-lg' sx={{ bgcolor: 'warning.light' }}>
                          <i className='ri-information-line text-warning-main text-xl flex-shrink-0 mt-0.5' />
                          <Typography variant='body2'>
                            Kosongkan jika belum ingin mengatur freeze date. Setelah diatur, nilai apapun tidak bisa diinput setelah tanggal ini — termasuk nilai minus.
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Tombol Simpan */}
              <Grid item xs={12}>
                <div className='flex justify-end gap-4'>
                  <Button type='submit' variant='contained' size='large' disabled={saveLoading}
                          startIcon={saveLoading ? <CircularProgress size={18} color='inherit' /> : <i className='ri-save-line' />}>
                    {saveLoading ? 'Menyimpan...' : 'Simpan Konfigurasi'}
                  </Button>
                </div>
              </Grid>

            </Grid>
          </form>
        )}

        <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast(t => ({ ...t, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <Alert severity={toast.severity} variant='filled' onClose={() => setToast(t => ({ ...t, open: false }))}>{toast.message}</Alert>
        </Snackbar>
      </>
    </LocalizationProvider>
  )
}

export default NimenBatchConfigView
