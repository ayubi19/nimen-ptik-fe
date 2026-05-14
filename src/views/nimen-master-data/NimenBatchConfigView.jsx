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
import Autocomplete from '@mui/material/Autocomplete'
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
import { batchNimenConfigApi, nimenIndicatorApi } from '@/libs/api/nimenMasterDataApi'
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
  <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', p: '12px', mb: '12px' }}>
    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
      {STEPS.map((label, i) => {
        const step = i + 1
        const isDone = step < current
        const isActive = step === current
        return (
          <Box key={label} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            {i < STEPS.length - 1 && (
              <Box sx={{
                position: 'absolute', top: 14, left: '50%', width: '100%', height: '2px',
                bgcolor: isDone ? '#EB3D47' : 'rgba(180,100,100,0.15)', zIndex: 0,
              }} />
            )}
            <Box sx={{
              width: 28, height: 28, borderRadius: '50%', zIndex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 600,
              background: isDone ? 'linear-gradient(145deg, #E63946, #6D0E13)' : isActive ? '#EB3D47' : '#F5F2F0',
              color: isDone || isActive ? '#fff' : '#9A5A5A',
              boxShadow: isDone || isActive ? '0 3px 8px rgba(180,0,30,0.2)' : 'none',
            }}>
              {isDone ? <i className='ri-check-line' style={{ fontSize: '12px', color: '#fff' }} /> : step}
            </Box>
            <Typography sx={{
              mt: '5px', textAlign: 'center', fontSize: '9px',
              color: isActive ? '#EB3D47' : isDone ? '#3B1010' : '#9A5A5A',
              fontWeight: isActive ? 600 : 400, lineHeight: 1.3,
            }}>
              {label}
            </Typography>
          </Box>
        )
      })}
    </Box>
  </Box>
)

// ── Batch Card — PWA native ───────────────────────────────────────────────────
const BatchConfigCard = ({ batch, onEditNilai, onEditPeriod, onActivatePeriod }) => {
  const isS1 = (batch.program_type || 'S1') === 'S1'
  const accentColor = isS1 ? '#0F6E56' : '#185FA5'
  const accentBg = isS1 ? '#E1F5EE' : '#E6F1FB'
  const periods = batch.periods || []
  const activePeriod = periods.find(p => p.is_active)
  const nextPeriod = periods.find(p => !p.is_active && p.period_number > (activePeriod?.period_number || 0))

  return (
    <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', overflow: 'hidden', mb: '10px' }}>
      {/* Header */}
      <Box sx={{ px: 2, py: '10px', borderBottom: '0.5px solid rgba(180,100,100,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#3B1010', lineHeight: 1.3 }}>
            {batch.name}
          </Typography>
          <Typography sx={{ fontSize: '10px', color: '#9A5A5A' }}>
            Angkatan ke-{batch.batch_number} · {batch.year} · {batch.program_type || 'S1'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          <Box sx={{ bgcolor: accentBg, borderRadius: '6px', px: '6px', py: '2px' }}>
            <Typography sx={{ fontSize: '9px', fontWeight: 700, color: accentColor }}>{batch.program_type || 'S1'}</Typography>
          </Box>
          <Box sx={{ bgcolor: batch.is_active ? '#E1F5EE' : '#F1EFE8', borderRadius: '6px', px: '6px', py: '2px' }}>
            <Typography sx={{ fontSize: '9px', fontWeight: 500, color: batch.is_active ? '#0F6E56' : '#5F5E5A' }}>
              {batch.is_active ? 'Aktif' : 'Nonaktif'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Body */}
      <Box sx={{ px: 2, py: '10px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '5px', mb: '8px' }}>
          <i className='ri-group-line' style={{ fontSize: '12px', color: '#9A5A5A' }} />
          <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>{batch.student_count ?? 0} mahasiswa</Typography>
        </Box>

        {periods.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', mb: '10px' }}>
            {periods.map(p => (
              <Box key={p.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, bgcolor: p.is_active ? accentColor : 'rgba(180,100,100,0.2)' }} />
                  <Typography sx={{ fontSize: '11px', fontWeight: p.is_active ? 600 : 400, color: p.is_active ? '#3B1010' : '#9A5A5A' }}>
                    {p.label}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '10px', color: '#9A5A5A' }}>
                  {fmtDate(p.start_date)} — {fmtDate(p.end_date)}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography sx={{ fontSize: '11px', color: '#9A5A5A', fontStyle: 'italic', mb: '10px' }}>
            Periode belum di-setup
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: '6px', pt: '8px', borderTop: '0.5px solid rgba(180,100,100,0.1)' }}>
          <Box component='button' onClick={() => onEditNilai(batch)} sx={{
            flex: 1, py: '5px', borderRadius: '8px', fontSize: '10px', fontWeight: 500,
            border: '0.5px solid rgba(180,100,100,0.18)', background: 'rgba(255,255,255,0.72)',
            boxShadow: '0 2px 6px rgba(139,0,0,0.07)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#444441',
          }}>
            <i className='ri-settings-3-line' style={{ fontSize: '11px' }} /> Edit Nilai
          </Box>
          {periods.length > 0 && (
            <Box component='button' onClick={() => onEditPeriod(batch)} sx={{
              flex: 1, py: '5px', borderRadius: '8px', fontSize: '10px', fontWeight: 500,
              border: '0.5px solid rgba(180,100,100,0.18)', background: 'rgba(255,255,255,0.72)',
              boxShadow: '0 2px 6px rgba(139,0,0,0.07)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#444441',
            }}>
              <i className='ri-calendar-line' style={{ fontSize: '11px' }} /> Edit Periode
            </Box>
          )}
          {isS1 && nextPeriod && (
            <Box component='button' onClick={() => onActivatePeriod(batch, nextPeriod)} sx={{
              flex: 1, py: '5px', borderRadius: '8px', fontSize: '10px', fontWeight: 600,
              border: 'none', background: 'linear-gradient(145deg, #E63946, #6D0E13)',
              boxShadow: '0 3px 8px rgba(180,0,30,0.2)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#fff',
            }}>
              <i className='ri-play-line' style={{ fontSize: '11px' }} /> {nextPeriod.label}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
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
  const [indicators, setIndicators] = useState([])
  const [setupLoading, setSetupLoading] = useState(false)

  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })
  const showToast = useCallback((msg, severity = 'success') => {
    setToast({ open: true, message: msg, severity })
  }, [])

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { max_nimen_value: 95, initial_nimen_value: 73, non_position_indicator_id: '' }
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

  // Load indikator aktif untuk pilihan non-pejabat
  useEffect(() => {
    nimenIndicatorApi.getAll({ page: 1, page_size: 100 })
      .then(res => setIndicators(res.data.data?.data || []))
      .catch(() => {})
  }, [])

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
        non_position_indicator_id: d.non_position_indicator_id || '',
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
        non_position_indicator_id: values.non_position_indicator_id ? parseInt(values.non_position_indicator_id) : null,
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
        reset({ max_nimen_value: d.max_nimen_value || 95, initial_nimen_value: d.initial_nimen_value || 73, non_position_indicator_id: d.non_position_indicator_id || '' })
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
        non_position_indicator_id: values.non_position_indicator_id ? parseInt(values.non_position_indicator_id) : null,
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

      {/* Topbar PWA */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', mb: '14px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Box sx={{
            width: 34, height: 34, borderRadius: '10px',
            background: 'rgba(255,255,255,0.72)', border: '0.5px solid rgba(180,100,100,0.18)',
            boxShadow: '0 3px 10px rgba(139,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, cursor: 'pointer', position: 'relative', overflow: 'hidden',
            '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)' }
          }} onClick={() => window.history.back()}>
            <i className='ri-arrow-left-s-line' style={{ fontSize: '20px', color: '#8B2020', position: 'relative', zIndex: 1 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>Master Data NIMEN</Typography>
            <Typography sx={{ fontSize: '16px', fontWeight: 500, color: '#3B1010' }}>Konfigurasi Angkatan</Typography>
          </Box>
        </Box>
      </Box>

      {/* ══════════════ MODE LIST ══════════════ */}
      {mode === 'list' && (
        <>
          <Box sx={{ mb: '12px' }}>
            <Box component='button' onClick={() => { setMode('wizard'); setStep(1) }} sx={{
              width: '100%', py: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: 'linear-gradient(145deg, #E63946, #6D0E13)',
              boxShadow: '0 4px 10px rgba(180,0,30,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}>
              <i className='ri-add-line' style={{ fontSize: '14px', color: '#fff' }} />
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Konfigurasi Angkatan Baru</Typography>
            </Box>
          </Box>

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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', mb: '14px' }}>
            <Box component='button' onClick={handleResetWizard} sx={{
              display: 'flex', alignItems: 'center', gap: '6px', px: '12px', py: '6px',
              borderRadius: '8px', cursor: 'pointer',
              background: 'rgba(255,255,255,0.72)', border: '0.5px solid rgba(180,100,100,0.18)',
              boxShadow: '0 2px 6px rgba(139,0,0,0.07)',
            }}>
              <i className='ri-arrow-left-s-line' style={{ fontSize: '14px', color: '#8B2020' }} />
              <Typography sx={{ fontSize: '12px', fontWeight: 500, color: '#3B1010' }}>Kembali ke Daftar</Typography>
            </Box>
          </Box>

          <Stepper current={step} />

          {/* Step 1 */}
          {step === 1 && (
            <Card>
              <CardContent>
                <Typography variant='subtitle1' fontWeight={600} className='mb-1'>Pilih Angkatan</Typography>
                <Typography variant='body2' color='text.secondary' className='mb-4'>
                  Pilih angkatan yang akan dikonfigurasi
                </Typography>
                <FormControl fullWidth sx={{ mb: '16px' }}>
                  <Select displayEmpty value={selectedBatch}
                          onChange={e => setSelectedBatch(e.target.value)}
                          renderValue={val => {
                            const b = allBatches.find(x => x.id === val || String(x.id) === String(val))
                            return b ? `${b.name} (${b.year})` : 'Pilih Angkatan'
                          }}
                          sx={{ borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0', '& .MuiOutlinedInput-notchedOutline': { border: '0.5px solid rgba(180,100,100,0.15)' }, '& .MuiSelect-select': { py: '10px', px: '12px' } }}>
                    {allBatches.map(b => (
                      <MenuItem key={b.id} value={b.id}>
                        <Box>
                          <Typography variant='body2' fontWeight={500}>{b.name}</Typography>
                          <Typography variant='caption' color='text.secondary'>Angkatan ke-{b.batch_number} · {b.year} · {b.program_type || 'S1'}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Box component='button' onClick={handleSelectBatch} disabled={!selectedBatch} sx={{
                  width: '100%', py: '10px', borderRadius: '10px', border: 'none',
                  cursor: selectedBatch ? 'pointer' : 'not-allowed',
                  background: selectedBatch ? 'linear-gradient(145deg, #E63946, #6D0E13)' : 'rgba(180,100,100,0.2)',
                  boxShadow: selectedBatch ? '0 4px 10px rgba(180,0,30,0.25)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Lanjut</Typography>
                  <i className='ri-arrow-right-s-line' style={{ fontSize: '16px', color: '#fff' }} />
                </Box>
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
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Controller name='non_position_indicator_id' control={control}
                                  render={({ field }) => (
                                    <Autocomplete
                                      options={indicators.filter(i => parseFloat(i.value) > 0)}
                                      getOptionLabel={opt => `${opt.name} (+${parseFloat(opt.value)})`}
                                      isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                                      value={indicators.find(i => i.id === field.value) || null}
                                      onChange={(_, val) => field.onChange(val ? val.id : '')}
                                      renderInput={params => (
                                        <TextField {...params} label='Indikator Nilai Non-Pejabat'
                                                   helperText='Nilai flat untuk mahasiswa tanpa jabatan aktif setiap bulan' />
                                      )}
                                      renderOption={(props, opt) => (
                                        <li {...props} key={opt.id}>
                                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 1 }}>
                                            <Typography variant='body2'>{opt.name}</Typography>
                                            <Typography variant='caption' color='success.main' sx={{ flexShrink: 0 }}>+{parseFloat(opt.value)}</Typography>
                                          </Box>
                                        </li>
                                      )}
                                      noOptionsText='Tidak ada indikator'
                                      clearText='Hapus pilihan'
                                    />
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
              <Grid item xs={12}>
                <Divider sx={{ mb: 1 }} />
                <Controller name='non_position_indicator_id' control={control}
                            render={({ field }) => (
                              <Autocomplete
                                options={indicators.filter(i => parseFloat(i.value) > 0)}
                                getOptionLabel={opt => `${opt.name} (+${parseFloat(opt.value)})`}
                                isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                                value={indicators.find(i => i.id === field.value) || null}
                                onChange={(_, val) => field.onChange(val ? val.id : '')}
                                renderInput={params => (
                                  <TextField {...params} label='Indikator Nilai Non-Pejabat'
                                             helperText='Nilai flat untuk mahasiswa tanpa jabatan aktif setiap bulan' />
                                )}
                                renderOption={(props, opt) => (
                                  <li {...props} key={opt.id}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 1 }}>
                                      <Typography variant='body2'>{opt.name}</Typography>
                                      <Typography variant='caption' color='success.main' sx={{ flexShrink: 0 }}>+{parseFloat(opt.value)}</Typography>
                                    </Box>
                                  </li>
                                )}
                                noOptionsText='Tidak ada indikator'
                                clearText='Hapus pilihan'
                              />
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
