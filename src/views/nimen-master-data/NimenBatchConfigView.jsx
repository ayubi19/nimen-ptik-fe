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
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import DialogContentText from '@mui/material/DialogContentText'
import { useForm, Controller } from 'react-hook-form'
import { batchApi } from '@/libs/api/masterDataApi'
import { batchNimenConfigApi } from '@/libs/api/nimenMasterDataApi'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import 'dayjs/locale/id'
import apiClient from '@/libs/api/client'

const batchPeriodApi = {
  getPeriods: (batchId) => apiClient.get(`/batches/${batchId}/periods`),
  setupPeriods: (batchId, data) => apiClient.post(`/batches/${batchId}/periods/setup`, data),
  activatePeriod: (batchId, periodId) => apiClient.post(`/batches/${batchId}/periods/${periodId}/activate`),
}

const PERIOD_LABELS_S1 = ['Tahun I', 'Tahun II', 'Tahun III', 'Tahun IV']

const NimenBatchConfigView = () => {
  const [batches, setBatches] = useState([])
  const [selectedBatch, setSelectedBatch] = useState('')
  const [config, setConfig] = useState(null)
  const [loadingBatches, setLoadingBatches] = useState(false)
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  // Period state
  const [periods, setPeriods] = useState([])
  const [periodInputs, setPeriodInputs] = useState([]) // form input sebelum setup
  const [setupLoading, setSetupLoading] = useState(false)
  const [activateTarget, setActivateTarget] = useState(null) // period yang akan diaktifkan
  const [activateLoading, setActivateLoading] = useState(false)

  const showToast = useCallback((message, severity = 'success') => {
    setToast({ open: true, message, severity })
  }, [])

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      program_type: 'S1',
      duration_years: 1,
      start_date: null,
      end_date: null,
      nimen_freeze_date: null,
      max_nimen_value: 95,
      initial_nimen_value: 73,
    }
  })

  const watchedProgramType = watch('program_type')

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
    setPeriods([])
    try {
      const [configRes, periodsRes] = await Promise.allSettled([
        batchNimenConfigApi.getConfig(batchId),
        batchPeriodApi.getPeriods(batchId),
      ])

      if (configRes.status === 'fulfilled') {
        const data = configRes.value.data.data
        setConfig(data)
        reset({
          program_type: data.program_type || 'S1',
          duration_years: data.duration_years || 1,
          start_date: data.start_date ? dayjs(data.start_date) : null,
          end_date: data.end_date ? dayjs(data.end_date) : null,
          nimen_freeze_date: data.nimen_freeze_date ? dayjs(data.nimen_freeze_date) : null,
          max_nimen_value: data.max_nimen_value || 95,
          initial_nimen_value: data.initial_nimen_value || 73,
        })

        // Init period inputs jika belum ada periode
        if (periodsRes.status === 'fulfilled' && periodsRes.value.data.data?.length === 0) {
          const pt = data.program_type || 'S1'
          const count = pt === 'S1' ? 4 : 1
          setPeriodInputs(Array.from({ length: count }, (_, i) => ({
            period_number: i + 1,
            label: pt === 'S1' ? PERIOD_LABELS_S1[i] : 'Periode S2',
            start_date: null,
            end_date: null,
          })))
        }
      }

      if (periodsRes.status === 'fulfilled') {
        setPeriods(periodsRes.value.data.data || [])
      }
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

  // Handle perubahan program_type — update jumlah period inputs
  const handleProgramTypeChange = useCallback((pt) => {
    const count = pt === 'S1' ? 4 : 1
    setPeriodInputs(Array.from({ length: count }, (_, i) => ({
      period_number: i + 1,
      label: pt === 'S1' ? PERIOD_LABELS_S1[i] : 'Periode S2',
      start_date: null,
      end_date: null,
    })))
  }, [])

  // Setup periode — panggil API
  const handleSetupPeriods = useCallback(async () => {
    const invalid = periodInputs.some(p => !p.start_date || !p.end_date)
    if (invalid) {
      showToast('Semua periode wajib diisi tanggal mulai dan selesai', 'error')
      return
    }
    setSetupLoading(true)
    try {
      await batchPeriodApi.setupPeriods(selectedBatch, {
        periods: periodInputs.map(p => ({
          period_number: p.period_number,
          label: p.label,
          start_date: dayjs(p.start_date).format('YYYY-MM-DD'),
          end_date: dayjs(p.end_date).format('YYYY-MM-DD'),
        })),
      })
      showToast('Periode berhasil di-setup! Periode pertama diaktifkan dan nilai awal 73 diberikan ke semua mahasiswa.')
      loadConfig(selectedBatch)
    } catch (err) {
      showToast(err.message || 'Gagal setup periode', 'error')
    } finally {
      setSetupLoading(false)
    }
  }, [selectedBatch, periodInputs, loadConfig, showToast])

  // Aktifkan periode berikutnya
  const handleActivatePeriod = useCallback(async () => {
    if (!activateTarget) return
    setActivateLoading(true)
    try {
      await batchPeriodApi.activatePeriod(selectedBatch, activateTarget.id)
      showToast(`${activateTarget.label} berhasil diaktifkan! Nilai awal 73 sedang diberikan ke semua mahasiswa.`)
      setActivateTarget(null)
      loadConfig(selectedBatch)
    } catch (err) {
      showToast(err.message || 'Gagal mengaktifkan periode', 'error')
    } finally {
      setActivateLoading(false)
    }
  }, [selectedBatch, activateTarget, loadConfig, showToast])

  const handleSave = useCallback(async (values) => {
    setSaveLoading(true)
    try {
      const payload = {
        program_type: values.program_type,
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
                  <CardHeader title='Durasi & Periode Pendidikan' subheader='Atur jenjang dan rentang waktu pendidikan angkatan ini' />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={4}>
                      {/* Program Type */}
                      <Grid item xs={12} sm={4}>
                        <Controller name='program_type' control={control}
                                    render={({ field }) => (
                                      <FormControl fullWidth>
                                        <InputLabel>Jenjang Program</InputLabel>
                                        <Select {...field} label='Jenjang Program'
                                                onChange={e => { field.onChange(e); handleProgramTypeChange(e.target.value) }}
                                                disabled={periods.length > 0}>
                                          <MenuItem value='S1'>S1 — 4 Tahun</MenuItem>
                                          <MenuItem value='S2'>S2 — 1 Tahun</MenuItem>
                                        </Select>
                                      </FormControl>
                                    )}
                        />
                        {periods.length > 0 && (
                          <Typography variant='caption' color='text.secondary'>
                            Jenjang tidak bisa diubah setelah periode di-setup
                          </Typography>
                        )}
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Controller name='start_date' control={control}
                                    render={({ field }) => (
                                      <DatePicker
                                        label='Tanggal Mulai Angkatan'
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
                                        label='Tanggal Selesai Angkatan'
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

              {/* Setup / Tampil Periode Akademik */}
              <Grid item xs={12}>
                <Card>
                  <CardHeader
                    title='Periode Akademik NIMEN'
                    subheader={periods.length > 0
                      ? 'Kelola periode akademik angkatan ini'
                      : `Setup periode untuk angkatan ${watchedProgramType} ini — ${watchedProgramType === 'S1' ? '4 periode (Tahun I–IV)' : '1 periode'}`}
                  />
                  <Divider />
                  <CardContent>
                    {periods.length > 0 ? (
                      // Tampil periode yang sudah ada
                      <div className='flex flex-col gap-3'>
                        {periods.map(p => (
                          <div key={p.id}
                               className='flex items-center justify-between p-3 border rounded-lg'
                               style={{ borderColor: p.is_active ? '#7367f0' : undefined,
                                 backgroundColor: p.is_active ? '#7367f010' : undefined }}>
                            <div>
                              <div className='flex items-center gap-2 mb-1'>
                                <Typography variant='body2' fontWeight={700}>{p.label}</Typography>
                                {p.is_active && <Chip label='Aktif' color='primary' size='small' />}
                              </div>
                              <Typography variant='caption' color='text.secondary'>
                                {new Date(p.start_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                                {' — '}
                                {new Date(p.end_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                              </Typography>
                              {p.activated_at && (
                                <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                                  Diaktifkan: {new Date(p.activated_at).toLocaleDateString('id-ID')}
                                </Typography>
                              )}
                            </div>
                            {!p.is_active && watchedProgramType === 'S1' && (
                              <Button variant='tonal' size='small' color='warning'
                                      onClick={() => setActivateTarget(p)}>
                                Aktifkan
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      // Form setup periode baru
                      <div className='flex flex-col gap-4'>
                        <Alert severity='info'>
                          Periode belum di-setup. Isi tanggal untuk setiap periode, lalu klik <strong>Setup Periode</strong>.
                          Periode pertama akan otomatis diaktifkan dan nilai awal 73 diberikan ke semua mahasiswa.
                        </Alert>
                        {periodInputs.map((p, idx) => (
                          <div key={idx}>
                            <Typography variant='subtitle2' className='mb-3'>
                              {p.label}
                            </Typography>
                            <Grid container spacing={3}>
                              <Grid item xs={12} sm={6}>
                                <DatePicker
                                  label='Tanggal Mulai *'
                                  value={p.start_date}
                                  onChange={val => {
                                    const updated = [...periodInputs]
                                    updated[idx] = { ...updated[idx], start_date: val }
                                    setPeriodInputs(updated)
                                  }}
                                  format='DD/MM/YYYY'
                                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                                />
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <DatePicker
                                  label='Tanggal Selesai *'
                                  value={p.end_date}
                                  minDate={p.start_date || undefined}
                                  onChange={val => {
                                    const updated = [...periodInputs]
                                    updated[idx] = { ...updated[idx], end_date: val }
                                    setPeriodInputs(updated)
                                  }}
                                  format='DD/MM/YYYY'
                                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                                />
                              </Grid>
                            </Grid>
                            {idx < periodInputs.length - 1 && <Divider className='mt-4' />}
                          </div>
                        ))}
                        <div className='flex justify-end mt-2'>
                          <Button variant='contained' color='primary'
                                  onClick={handleSetupPeriods}
                                  disabled={setupLoading}
                                  startIcon={setupLoading
                                    ? <CircularProgress size={16} color='inherit' />
                                    : <i className='ri-calendar-check-line' />}>
                            {setupLoading ? 'Menyimpan...' : 'Setup Periode'}
                          </Button>
                        </div>
                      </div>
                    )}
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

        {/* Dialog konfirmasi aktivasi periode */}
        <Dialog open={!!activateTarget} onClose={() => setActivateTarget(null)} maxWidth='xs' fullWidth>
          <DialogTitle>Aktifkan {activateTarget?.label}?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Mengaktifkan <strong>{activateTarget?.label}</strong> akan:
              <br /><br />
              • Menonaktifkan periode yang sedang berjalan
              <br />
              • Memberikan nilai awal <strong>73</strong> ke semua mahasiswa angkatan ini
              <br />
              • Ranking dihitung ulang dari awal periode ini
              <br /><br />
              Tindakan ini tidak dapat dibatalkan.
            </DialogContentText>
          </DialogContent>
          <DialogActions className='p-4 gap-2'>
            <Button variant='tonal' color='secondary'
                    onClick={() => setActivateTarget(null)}
                    disabled={activateLoading}>
              Batal
            </Button>
            <Button variant='contained' color='warning'
                    onClick={handleActivatePeriod}
                    disabled={activateLoading}
                    startIcon={activateLoading ? <CircularProgress size={16} color='inherit' /> : null}>
              {activateLoading ? 'Mengaktifkan...' : 'Ya, Aktifkan'}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    </LocalizationProvider>
  )
}

export default NimenBatchConfigView
