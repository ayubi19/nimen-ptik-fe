'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@mui/material/Card'
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
  getPeriods: (id) => apiClient.get(`/batches/${id}/periods`),
  setupPeriods: (id, data) => apiClient.post(`/batches/${id}/periods/setup`, data),
  updatePeriod: (id, pid, data) => apiClient.put(`/batches/${id}/periods/${pid}`, data),
  activatePeriod: (id, pid) => apiClient.post(`/batches/${id}/periods/${pid}/activate`),
}

const PERIOD_LABELS_S1 = ['Tahun I', 'Tahun II', 'Tahun III', 'Tahun IV']

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
  : '—'

// ── Stepper ───────────────────────────────────────────────────────────────────
const STEPS = ['Pilih Angkatan', 'Konfigurasi Nilai', 'Setup Periode', 'Selesai']

const Stepper = ({ current }) => (
  <Card className='mb-6'>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
        {STEPS.map((label, i) => {
          const step = i + 1
          const isDone = step < current
          const isActive = step === current
          return (
            <Box key={label} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              {i < STEPS.length - 1 && (
                <Box sx={{
                  position: 'absolute', top: 16, left: '50%', width: '100%', height: 2,
                  bgcolor: isDone ? 'primary.main' : 'divider', zIndex: 0,
                }} />
              )}
              <Box sx={{
                width: 32, height: 32, borderRadius: '50%', zIndex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 600,
                bgcolor: isDone || isActive ? 'primary.main' : 'action.hover',
                color: isDone || isActive ? '#fff' : 'text.secondary',
                border: isDone || isActive ? 'none' : '1.5px solid',
                borderColor: 'divider',
              }}>
                {isDone
                  ? <i className='ri-check-line text-[14px]' style={{ color: '#fff' }} />
                  : step}
              </Box>
              <Typography variant='caption' sx={{
                mt: 0.75, textAlign: 'center',
                color: isActive || isDone ? 'primary.main' : 'text.secondary',
                fontWeight: isActive ? 600 : 400,
                fontSize: { xs: 10, sm: 11 },
              }}>
                {label}
              </Typography>
            </Box>
          )
        })}
      </Box>
    </CardContent>
  </Card>
)

// ── Batch Card (List Mode) ────────────────────────────────────────────────────
const BatchConfigCard = ({ batch, onEditNilai, onEditPeriod, onActivatePeriod }) => {
  const isS1 = (batch.program_type || 'S1') === 'S1'
  const accentColor = isS1 ? '#28C76F' : '#00CFE8'
  const periods = batch.periods || []
  const activePeriod = periods.find(p => p.is_active)
  const nextPeriod = periods.find(p => !p.is_active && p.period_number > (activePeriod?.period_number || 0))

  return (
    <Card className='mb-4' sx={{ overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5, bgcolor: isS1 ? '#E6F9EE' : '#E0F9FC' }}>
        <div className='flex items-start justify-between'>
          <div>
            <Typography variant='body2' fontWeight={600} sx={{ color: 'text.primary', mb: 0.3 }}>
              {batch.name} · Angkatan ke-{batch.batch_number}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {batch.year} · {batch.program_type || 'S1'}
            </Typography>
          </div>
          <Chip label={batch.is_active ? 'Aktif' : 'Nonaktif'}
                size='small' color={batch.is_active ? 'success' : 'default'} variant='tonal' />
        </div>
      </Box>
      <CardContent>
        {/* Mahasiswa */}
        <div className='flex items-center gap-2 mb-3'>
          <i className='ri-group-line text-sm' style={{ color: 'var(--mui-palette-text-secondary)' }} />
          <Typography variant='caption' color='text.secondary'>
            {batch.student_count ?? 0} mahasiswa
          </Typography>
        </div>

        {/* Periode list */}
        {periods.length > 0 ? (
          <div className='flex flex-col gap-1 mb-3'>
            {periods.map(p => (
              <div key={p.id} className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Box sx={{
                    width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                    bgcolor: p.is_active ? accentColor : 'divider',
                  }} />
                  <Typography variant='caption'
                              fontWeight={p.is_active ? 600 : 400}
                              color={p.is_active ? 'text.primary' : 'text.secondary'}>
                    {p.label}
                  </Typography>
                </div>
                <Typography variant='caption' color='text.secondary'>
                  {fmtDate(p.start_date)} — {fmtDate(p.end_date)}
                </Typography>
              </div>
            ))}
          </div>
        ) : (
          <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 2, fontStyle: 'italic' }}>
            Periode belum di-setup
          </Typography>
        )}

        <Divider className='mb-3' />

        <div className='flex gap-2'>
          <Button fullWidth variant='tonal' size='small' color='secondary'
                  onClick={() => onEditNilai(batch)}>
            Edit Nilai
          </Button>
          {periods.length > 0 && (
            <Button fullWidth variant='tonal' size='small' color='secondary'
                    onClick={() => onEditPeriod(batch)}>
              Edit Periode
            </Button>
          )}
          {isS1 && nextPeriod && (
            <Button fullWidth variant='tonal' size='small' color='primary'
                    onClick={() => onActivatePeriod(batch, nextPeriod)}>
              Aktifkan {nextPeriod.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Section Header ────────────────────────────────────────────────────────────
const SectionHeader = ({ program, count }) => {
  const isS1 = program === 'S1'
  return (
    <div className='flex items-center gap-2 mb-4 pb-2'
         style={{ borderBottom: `2px solid ${isS1 ? '#28C76F' : '#00CFE8'}` }}>
      <Chip label={program} size='small' sx={{
        fontWeight: 700, fontSize: 12,
        bgcolor: isS1 ? '#E6F9EE' : '#E0F9FC',
        color: isS1 ? '#1B7A47' : '#0891B2',
      }} />
      <Typography variant='body2' fontWeight={500}>Program {program}</Typography>
      <Typography variant='caption' color='text.secondary' sx={{ ml: 'auto' }}>
        {count} angkatan
      </Typography>
    </div>
  )
}

// ── Main View ─────────────────────────────────────────────────────────────────
const NimenBatchConfigView = () => {
  const router = useRouter()
  const [mode, setMode] = useState('list') // 'list' | 'wizard'
  const [step, setStep] = useState(1)

  // List mode state
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [activateTarget, setActivateTarget] = useState(null)
  const [activateLoading, setActivateLoading] = useState(false)
  const [editNilaiTarget, setEditNilaiTarget] = useState(null)
  const [editNilaiLoading, setEditNilaiLoading] = useState(false)
  const [editPeriodTarget, setEditPeriodTarget] = useState(null) // { batch, periods }
  const [editPeriodInputs, setEditPeriodInputs] = useState([])
  const [editPeriodLoading, setEditPeriodLoading] = useState(false)

  // Wizard state
  const [allBatches, setAllBatches] = useState([])
  const [selectedBatch, setSelectedBatch] = useState('')
  const [batchData, setBatchData] = useState(null)
  const [periods, setPeriods] = useState([])
  const [periodInputs, setPeriodInputs] = useState([])
  const [saveLoading, setSaveLoading] = useState(false)
  const [setupLoading, setSetupLoading] = useState(false)

  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })
  const showToast = useCallback((msg, severity = 'success') => {
    setToast({ open: true, message: msg, severity })
  }, [])

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { max_nimen_value: 95, initial_nimen_value: 73 }
  })

  // Fetch batches dengan periods
  const fetchBatches = useCallback(async () => {
    setLoading(true)
    try {
      const res = await batchApi.getAll({ page: 1, page_size: 100 })
      const list = res.data.data?.data || []
      setBatches(list)
      setAllBatches(list)
    } catch {
      showToast('Gagal memuat data angkatan', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { fetchBatches() }, [fetchBatches])

  // Aktifkan periode
  const handleActivatePeriod = useCallback(async () => {
    if (!activateTarget) return
    setActivateLoading(true)
    try {
      await batchPeriodApi.activatePeriod(activateTarget.batch.id, activateTarget.period.id)
      showToast(`${activateTarget.period.label} berhasil diaktifkan!`)
      setActivateTarget(null)
      fetchBatches()
    } catch (err) {
      showToast(err.message || 'Gagal mengaktifkan periode', 'error')
    } finally {
      setActivateLoading(false)
    }
  }, [activateTarget, fetchBatches, showToast])

  // Edit nilai NIMEN
  const handleEditNilaiOpen = useCallback(async (batch) => {
    try {
      const res = await batchNimenConfigApi.getConfig(batch.id)
      const d = res.data.data
      reset({
        max_nimen_value: d.max_nimen_value || 95,
        initial_nimen_value: d.initial_nimen_value || 73,
      })
      setEditNilaiTarget(batch)
    } catch {
      showToast('Gagal memuat konfigurasi nilai', 'error')
    }
  }, [reset, showToast])

  const handleEditNilaiSave = useCallback(async (values) => {
    setEditNilaiLoading(true)
    try {
      await batchNimenConfigApi.updateConfig(editNilaiTarget.id, {
        max_nimen_value: parseFloat(values.max_nimen_value),
        initial_nimen_value: parseFloat(values.initial_nimen_value),
      })
      showToast('Konfigurasi nilai berhasil diperbarui')
      setEditNilaiTarget(null)
      fetchBatches()
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan', 'error')
    } finally {
      setEditNilaiLoading(false)
    }
  }, [editNilaiTarget, fetchBatches, showToast])

  const handleOpenEditPeriod = useCallback((batch) => {
    setEditPeriodInputs((batch.periods || []).map(p => ({
      id: p.id,
      label: p.label,
      is_active: p.is_active,
      start_date: p.start_date ? dayjs(p.start_date) : null,
      end_date: p.end_date ? dayjs(p.end_date) : null,
      freeze_date: p.nimen_freeze_date ? dayjs(p.nimen_freeze_date) : null,
    })))
    setEditPeriodTarget(batch)
  }, [])

  const handleSaveEditPeriods = useCallback(async () => {
    const invalid = editPeriodInputs.some(p => !p.start_date || !p.end_date)
    if (invalid) { showToast('Semua periode wajib diisi tanggal', 'error'); return }
    setEditPeriodLoading(true)
    try {
      await Promise.all(editPeriodInputs.map(p =>
        batchPeriodApi.updatePeriod(editPeriodTarget.id, p.id, {
          start_date: dayjs(p.start_date).format('YYYY-MM-DD'),
          end_date: dayjs(p.end_date).format('YYYY-MM-DD'),
          nimen_freeze_date: p.freeze_date ? dayjs(p.freeze_date).format('YYYY-MM-DD') : '',
        })
      ))
      showToast('Periode berhasil diperbarui')
      setEditPeriodTarget(null)
      fetchBatches()
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan periode', 'error')
    } finally { setEditPeriodLoading(false) }
  }, [editPeriodTarget, editPeriodInputs, fetchBatches, showToast])

  // Wizard: pilih angkatan → step 2
  const handleSelectBatch = useCallback(async () => {
    if (!selectedBatch) { showToast('Pilih angkatan dulu', 'error'); return }
    try {
      const [configRes, periodsRes] = await Promise.allSettled([
        batchNimenConfigApi.getConfig(selectedBatch),
        batchPeriodApi.getPeriods(selectedBatch),
      ])
      const batch = allBatches.find(b => b.id === parseInt(selectedBatch))
      setBatchData(batch)
      if (configRes.status === 'fulfilled') {
        const d = configRes.value.data.data
        reset({ max_nimen_value: d.max_nimen_value || 95, initial_nimen_value: d.initial_nimen_value || 73 })
      }
      const existingPeriods = periodsRes.status === 'fulfilled' ? periodsRes.value.data.data || [] : []
      setPeriods(existingPeriods)
      const pt = batch?.program_type || 'S1'
      const count = pt === 'S1' ? 4 : 1
      setPeriodInputs(Array.from({ length: count }, (_, i) => ({
        period_number: i + 1,
        label: pt === 'S1' ? PERIOD_LABELS_S1[i] : 'Periode S2',
        start_date: null, end_date: null, freeze_date: null,
      })))
      setStep(2)
    } catch { showToast('Gagal memuat data', 'error') }
  }, [selectedBatch, allBatches, reset, showToast])

  // Wizard: simpan nilai → step 3
  const handleSaveConfig = useCallback(async (values) => {
    setSaveLoading(true)
    try {
      await batchNimenConfigApi.updateConfig(selectedBatch, {
        max_nimen_value: parseFloat(values.max_nimen_value),
        initial_nimen_value: parseFloat(values.initial_nimen_value),
      })
      showToast('Konfigurasi nilai berhasil disimpan')
      setStep(3)
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Gagal menyimpan', 'error')
    } finally { setSaveLoading(false) }
  }, [selectedBatch, showToast])

  // Wizard: setup periode → step 4
  const handleSetupPeriods = useCallback(async () => {
    const invalid = periodInputs.some(p => !p.start_date || !p.end_date)
    if (invalid) { showToast('Semua periode wajib diisi', 'error'); return }
    setSetupLoading(true)
    try {
      await batchPeriodApi.setupPeriods(selectedBatch, {
        periods: periodInputs.map(p => ({
          period_number: p.period_number, label: p.label,
          start_date: dayjs(p.start_date).format('YYYY-MM-DD'),
          end_date: dayjs(p.end_date).format('YYYY-MM-DD'),
          nimen_freeze_date: p.freeze_date ? dayjs(p.freeze_date).format('YYYY-MM-DD') : '',
        }))
      })
      showToast('Periode berhasil disetup! Periode pertama diaktifkan.')
      const res = await batchPeriodApi.getPeriods(selectedBatch)
      setPeriods(res.data.data || [])
      setStep(4)
    } catch (err) {
      showToast(err.message || 'Gagal setup periode', 'error')
    } finally { setSetupLoading(false) }
  }, [selectedBatch, periodInputs, showToast])

  const handleResetWizard = useCallback(() => {
    setMode('list')
    setStep(1)
    setSelectedBatch('')
    setBatchData(null)
    setPeriods([])
    setPeriodInputs([])
    fetchBatches()
  }, [fetchBatches])

  const isS1 = batchData?.program_type !== 'S2'
  const s1List = batches.filter(b => (b.program_type || 'S1') === 'S1')
  const s2List = batches.filter(b => b.program_type === 'S2')

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale='id'>

      {/* Breadcrumb */}
      <div className='flex items-center gap-2 mb-6'>
        <Typography variant='caption' color='text.secondary'>Master Data NIMEN</Typography>
        <i className='ri-arrow-right-s-line text-sm opacity-50' />
        <Typography variant='caption' fontWeight={500} color='text.primary'>Konfigurasi Angkatan</Typography>
      </div>

      {/* ══════════════ MODE LIST ══════════════ */}
      {mode === 'list' && (
        <>
          <div className='flex items-center justify-between mb-6 flex-wrap gap-3'>
            <div />
            <Button variant='contained' startIcon={<i className='ri-add-line' />}
                    onClick={() => { setMode('wizard'); setStep(1) }}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}>
              Konfigurasi Angkatan Baru
            </Button>
          </div>

          {loading ? (
            <div className='flex justify-center py-10'><CircularProgress /></div>
          ) : (
            <Grid container spacing={6}>
              {/* S1 */}
              <Grid item xs={12} md={6}>
                <SectionHeader program='S1' count={s1List.length} />
                <div style={{ maxHeight: 600, overflowY: 'auto', paddingRight: 4 }}>
                  {s1List.length === 0 ? (
                    <Card>
                      <CardContent className='text-center py-8'>
                        <i className='ri-inbox-line text-4xl opacity-30 block mb-2' />
                        <Typography variant='body2' color='text.secondary'>
                          Belum ada angkatan S1 yang dikonfigurasi
                        </Typography>
                      </CardContent>
                    </Card>
                  ) : s1List.map(b => (
                    <BatchConfigCard key={b.id} batch={b}
                                     onEditNilai={handleEditNilaiOpen}
                                     onEditPeriod={handleOpenEditPeriod}
                                     onActivatePeriod={(batch, period) => setActivateTarget({ batch, period })}
                    />
                  ))}
                </div>
              </Grid>

              {/* S2 */}
              <Grid item xs={12} md={6}>
                <SectionHeader program='S2' count={s2List.length} />
                <div style={{ maxHeight: 600, overflowY: 'auto', paddingRight: 4 }}>
                  {s2List.length === 0 ? (
                    <Card>
                      <CardContent className='text-center py-8'>
                        <i className='ri-inbox-line text-4xl opacity-30 block mb-2' />
                        <Typography variant='body2' color='text.secondary'>
                          Belum ada angkatan S2 yang dikonfigurasi
                        </Typography>
                      </CardContent>
                    </Card>
                  ) : s2List.map(b => (
                    <BatchConfigCard key={b.id} batch={b}
                                     onEditNilai={handleEditNilaiOpen}
                                     onEditPeriod={handleOpenEditPeriod}
                                     onActivatePeriod={(batch, period) => setActivateTarget({ batch, period })}
                    />
                  ))}
                </div>
              </Grid>
            </Grid>
          )}
        </>
      )}

      {/* ══════════════ MODE WIZARD ══════════════ */}
      {mode === 'wizard' && (
        <>
          <div className='flex items-center gap-3 mb-6'>
            <Button variant='tonal' color='secondary' size='small'
                    startIcon={<i className='ri-arrow-left-line' />}
                    onClick={handleResetWizard}>
              Kembali ke Daftar
            </Button>
          </div>

          <Stepper current={step} />

          {/* Step 1 */}
          {step === 1 && (
            <Card>
              <CardContent>
                <Typography variant='subtitle1' fontWeight={600} className='mb-1'>Pilih Angkatan</Typography>
                <Typography variant='body2' color='text.secondary' className='mb-4'>
                  Pilih angkatan yang akan dikonfigurasi
                </Typography>
                <FormControl fullWidth className='mb-6'>
                  <InputLabel>Angkatan</InputLabel>
                  <Select label='Angkatan' value={selectedBatch}
                          onChange={e => setSelectedBatch(e.target.value)}>
                    {allBatches.map(b => (
                      <MenuItem key={b.id} value={b.id}>
                        <div className='flex items-center gap-2'>
                          <span>{b.name} · Angkatan ke-{b.batch_number} ({b.year})</span>
                          <Chip label={b.program_type || 'S1'} size='small' variant='tonal'
                                color={b.program_type === 'S2' ? 'info' : 'success'} />
                        </div>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <div className='flex justify-end'>
                  <Button variant='contained' onClick={handleSelectBatch}
                          disabled={!selectedBatch}
                          endIcon={<i className='ri-arrow-right-line' />}>
                    Lanjut
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <form onSubmit={handleSubmit(handleSaveConfig)}>
              <Card className='mb-4'>
                <Box sx={{ px: 2, py: 1.5, bgcolor: isS1 ? '#E6F9EE' : '#E0F9FC' }}>
                  <Typography variant='body2' fontWeight={600} color='text.primary'>
                    {batchData?.name} · Angkatan ke-{batchData?.batch_number}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {batchData?.year} · {batchData?.program_type || 'S1'}
                  </Typography>
                </Box>
                <CardContent>
                  <Typography variant='subtitle1' fontWeight={600} className='mb-1'>Konfigurasi Nilai NIMEN</Typography>
                  <Typography variant='body2' color='text.secondary' className='mb-4'>
                    Atur batas nilai dan nilai awal untuk angkatan ini
                  </Typography>
                  <Grid container spacing={4}>
                    <Grid item xs={12} sm={6}>
                      <Controller name='max_nimen_value' control={control}
                                  rules={{ required: 'Wajib diisi', min: { value: 1, message: 'Min 1' } }}
                                  render={({ field }) => (
                                    <TextField {...field} fullWidth label='Nilai Maksimum NIMEN' type='number'
                                               error={!!errors.max_nimen_value}
                                               helperText={errors.max_nimen_value?.message || 'Nilai tertinggi yang bisa diraih'} />
                                  )}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Controller name='initial_nimen_value' control={control}
                                  rules={{ required: 'Wajib diisi', min: { value: 0, message: 'Min 0' } }}
                                  render={({ field }) => (
                                    <TextField {...field} fullWidth label='Nilai Awal Mahasiswa' type='number'
                                               error={!!errors.initial_nimen_value}
                                               helperText={errors.initial_nimen_value?.message || 'Nilai saat pertama kali terdaftar'} />
                                  )}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              <div className='flex justify-between'>
                <Button variant='tonal' color='secondary' onClick={() => setStep(1)}
                        startIcon={<i className='ri-arrow-left-line' />}>Kembali</Button>
                <Button variant='contained' type='submit' disabled={saveLoading}
                        startIcon={saveLoading ? <CircularProgress size={16} color='inherit' /> : null}
                        endIcon={!saveLoading && <i className='ri-arrow-right-line' />}>
                  {saveLoading ? 'Menyimpan...' : 'Simpan & Lanjut'}
                </Button>
              </div>
            </form>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <>
              <Card className='mb-4'>
                <Box sx={{ px: 2, py: 1.5, bgcolor: isS1 ? '#E6F9EE' : '#E0F9FC' }}>
                  <Typography variant='body2' fontWeight={600} color='text.primary'>
                    {batchData?.name} · Angkatan ke-{batchData?.batch_number}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {batchData?.year} · {batchData?.program_type || 'S1'}
                  </Typography>
                </Box>
                <CardContent>
                  <Typography variant='subtitle1' fontWeight={600} className='mb-1'>Setup Periode Akademik</Typography>
                  <Typography variant='body2' color='text.secondary' className='mb-4'>
                    {isS1 ? 'Angkatan S1 membutuhkan 4 periode — Tahun I sampai Tahun IV'
                      : 'Angkatan S2 membutuhkan 1 periode'}
                  </Typography>

                  {periods.length > 0 ? (
                    <div className='flex flex-col gap-3'>
                      <Alert severity='info' className='mb-2'>
                        Periode sudah di-setup sebelumnya.
                      </Alert>
                      {periods.map(p => (
                        <Box key={p.id} sx={{
                          border: '1px solid', borderRadius: 2, p: 2,
                          borderColor: p.is_active ? 'primary.main' : 'divider',
                          bgcolor: p.is_active ? 'action.hover' : 'background.paper',
                        }}>
                          <div className='flex items-center justify-between'>
                            <div>
                              <div className='flex items-center gap-2 mb-1'>
                                <Typography variant='body2' fontWeight={600}>{p.label}</Typography>
                                {p.is_active && <Chip label='Aktif' size='small' color='primary' variant='tonal' />}
                              </div>
                              <Typography variant='caption' color='text.secondary'>
                                {fmtDate(p.start_date)} — {fmtDate(p.end_date)}
                              </Typography>
                            </div>
                          </div>
                        </Box>
                      ))}
                    </div>
                  ) : (
                    <div className='flex flex-col gap-4'>
                      {periodInputs.map((p, idx) => (
                        <Box key={idx} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
                          <Typography variant='body2' fontWeight={600} className='mb-3'>{p.label}</Typography>
                          <Grid container spacing={3}>
                            <Grid item xs={12} sm={4}>
                              <DatePicker label='Tanggal Mulai *' value={p.start_date}
                                          onChange={val => { const u=[...periodInputs]; u[idx]={...u[idx],start_date:val}; setPeriodInputs(u) }}
                                          format='DD/MM/YYYY'
                                          slotProps={{ textField: { fullWidth: true, size: 'small' } }} />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <DatePicker label='Tanggal Selesai *' value={p.end_date}
                                          minDate={p.start_date || undefined}
                                          onChange={val => { const u=[...periodInputs]; u[idx]={...u[idx],end_date:val}; setPeriodInputs(u) }}
                                          format='DD/MM/YYYY'
                                          slotProps={{ textField: { fullWidth: true, size: 'small' } }} />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <DatePicker label='Freeze Date (opsional)' value={p.freeze_date}
                                          minDate={p.start_date || undefined}
                                          maxDate={p.end_date || undefined}
                                          onChange={val => { const u=[...periodInputs]; u[idx]={...u[idx],freeze_date:val}; setPeriodInputs(u) }}
                                          format='DD/MM/YYYY'
                                          slotProps={{ textField: { fullWidth: true, size: 'small', helperText: 'Batas akhir input nilai' } }} />
                            </Grid>
                          </Grid>
                        </Box>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              <div className='flex justify-between'>
                <Button variant='tonal' color='secondary' onClick={() => setStep(2)}
                        startIcon={<i className='ri-arrow-left-line' />}>Kembali</Button>
                {periods.length === 0 ? (
                  <Button variant='contained' onClick={handleSetupPeriods} disabled={setupLoading}
                          startIcon={setupLoading ? <CircularProgress size={16} color='inherit' /> : null}
                          endIcon={!setupLoading && <i className='ri-arrow-right-line' />}>
                    {setupLoading ? 'Menyimpan...' : 'Simpan & Selesai'}
                  </Button>
                ) : (
                  <Button variant='contained' onClick={() => setStep(4)}
                          endIcon={<i className='ri-arrow-right-line' />}>Lanjut</Button>
                )}
              </div>
            </>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <Card>
              <CardContent className='text-center py-8'>
                <Box sx={{
                  width: 64, height: 64, borderRadius: '50%',
                  bgcolor: 'success.light', margin: '0 auto 1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className='ri-checkbox-circle-line text-[32px]' style={{ color: '#28C76F' }} />
                </Box>
                <Typography variant='h6' fontWeight={600} className='mb-1'>Konfigurasi Selesai!</Typography>
                <Typography variant='body2' color='text.secondary' className='mb-6'>
                  Periode pertama otomatis diaktifkan dan nilai awal diberikan ke semua mahasiswa
                </Typography>
                <Divider className='mb-4' />
                <div className='text-left max-w-sm mx-auto mb-6'>
                  {[
                    { label: 'Angkatan', value: `${batchData?.name} · ke-${batchData?.batch_number}` },
                    { label: 'Jenjang', value: batchData?.program_type || 'S1' },
                    { label: 'Periode Aktif', value: periods.find(p => p.is_active)?.label || periods[0]?.label || '—' },
                  ].map(r => (
                    <div key={r.label} className='flex justify-between py-2'
                         style={{ borderBottom: '1px solid var(--mui-palette-divider)' }}>
                      <Typography variant='body2' color='text.secondary'>{r.label}</Typography>
                      <Typography variant='body2' fontWeight={500}>{r.value}</Typography>
                    </div>
                  ))}
                </div>
                <div className='flex flex-col gap-3 items-center'>
                  <Button variant='contained' onClick={() => router.push('/master-data/batches')}
                          fullWidth startIcon={<i className='ri-check-line' />}>Selesai</Button>
                  <Button variant='tonal' color='secondary' onClick={handleResetWizard}
                          fullWidth startIcon={<i className='ri-refresh-line' />}>
                    Konfigurasi Angkatan Lain
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Dialog Edit Nilai */}
      <Dialog open={!!editNilaiTarget} onClose={() => setEditNilaiTarget(null)} maxWidth='sm' fullWidth>
        <DialogTitle>Edit Nilai NIMEN — {editNilaiTarget?.name}</DialogTitle>
        <form onSubmit={handleSubmit(handleEditNilaiSave)}>
          <DialogContent>
            <Grid container spacing={3} className='mt-1'>
              <Grid item xs={12} sm={6}>
                <Controller name='max_nimen_value' control={control}
                            rules={{ required: 'Wajib diisi', min: { value: 1, message: 'Min 1' } }}
                            render={({ field }) => (
                              <TextField {...field} fullWidth label='Nilai Maksimum NIMEN' type='number'
                                         error={!!errors.max_nimen_value} helperText={errors.max_nimen_value?.message} />
                            )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name='initial_nimen_value' control={control}
                            rules={{ required: 'Wajib diisi', min: { value: 0, message: 'Min 0' } }}
                            render={({ field }) => (
                              <TextField {...field} fullWidth label='Nilai Awal Mahasiswa' type='number'
                                         error={!!errors.initial_nimen_value} helperText={errors.initial_nimen_value?.message} />
                            )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions className='p-4 gap-2'>
            <Button variant='tonal' color='secondary' onClick={() => setEditNilaiTarget(null)} disabled={editNilaiLoading}>
              Batal
            </Button>
            <Button variant='contained' type='submit' disabled={editNilaiLoading}
                    startIcon={editNilaiLoading ? <CircularProgress size={16} color='inherit' /> : null}>
              {editNilaiLoading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog Aktivasi Periode */}
      <Dialog open={!!activateTarget} onClose={() => setActivateTarget(null)} maxWidth='xs' fullWidth>
        <DialogTitle>Aktifkan {activateTarget?.period?.label}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Mengaktifkan <strong>{activateTarget?.period?.label}</strong> akan menonaktifkan periode sebelumnya
            dan memberikan nilai awal <strong>73</strong> ke semua mahasiswa angkatan ini.
            <br /><br />
            Tindakan ini tidak dapat dibatalkan.
          </DialogContentText>
        </DialogContent>
        <DialogActions className='p-4 gap-2'>
          <Button variant='tonal' color='secondary' onClick={() => setActivateTarget(null)} disabled={activateLoading}>
            Batal
          </Button>
          <Button variant='contained' onClick={handleActivatePeriod} disabled={activateLoading}
                  startIcon={activateLoading ? <CircularProgress size={16} color='inherit' /> : null}>
            {activateLoading ? 'Mengaktifkan...' : 'Ya, Aktifkan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Edit Periode */}
      <Dialog open={!!editPeriodTarget} onClose={() => setEditPeriodTarget(null)} maxWidth='md' fullWidth>
        <DialogTitle>Edit Periode — {editPeriodTarget?.name}</DialogTitle>
        <DialogContent>
          <div className='flex flex-col gap-4 mt-2'>
            {editPeriodInputs.map((p, idx) => (
              <Box key={p.id} sx={{
                border: '1px solid', borderRadius: 2, p: 2,
                borderColor: p.is_active ? 'primary.main' : 'divider',
                bgcolor: p.is_active ? 'action.hover' : 'background.paper',
              }}>
                <div className='flex items-center gap-2 mb-3'>
                  <Typography variant='body2' fontWeight={600}>{p.label}</Typography>
                  {p.is_active && <Chip label='Aktif' size='small' color='primary' variant='tonal' />}
                </div>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <DatePicker
                      label='Tanggal Mulai *'
                      value={p.start_date}
                      onChange={val => {
                        const u = [...editPeriodInputs]
                        u[idx] = { ...u[idx], start_date: val }
                        setEditPeriodInputs(u)
                      }}
                      format='DD/MM/YYYY'
                      slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <DatePicker
                      label='Tanggal Selesai *'
                      value={p.end_date}
                      minDate={p.start_date || undefined}
                      onChange={val => {
                        const u = [...editPeriodInputs]
                        u[idx] = { ...u[idx], end_date: val }
                        setEditPeriodInputs(u)
                      }}
                      format='DD/MM/YYYY'
                      slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <DatePicker
                      label='Freeze Date (opsional)'
                      value={p.freeze_date}
                      minDate={p.start_date || undefined}
                      maxDate={p.end_date || undefined}
                      onChange={val => {
                        const u = [...editPeriodInputs]
                        u[idx] = { ...u[idx], freeze_date: val }
                        setEditPeriodInputs(u)
                      }}
                      format='DD/MM/YYYY'
                      slotProps={{ textField: { fullWidth: true, size: 'small', helperText: 'Batas akhir input nilai' } }}
                    />
                  </Grid>
                </Grid>
              </Box>
            ))}
          </div>
        </DialogContent>
        <DialogActions className='p-4 gap-2'>
          <Button variant='tonal' color='secondary'
                  onClick={() => setEditPeriodTarget(null)} disabled={editPeriodLoading}>
            Batal
          </Button>
          <Button variant='contained' onClick={handleSaveEditPeriods} disabled={editPeriodLoading}
                  startIcon={editPeriodLoading ? <CircularProgress size={16} color='inherit' /> : null}>
            {editPeriodLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast */}
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

export default NimenBatchConfigView
