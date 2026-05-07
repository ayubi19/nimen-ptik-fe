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
        <Box component='form' onSubmit={handleSubmit(handleSubmitForm)} sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Topbar */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Box sx={{ width: 34, height: 34, borderRadius: '10px', background: 'rgba(255,255,255,0.72)', border: '0.5px solid rgba(180,100,100,0.18)', boxShadow: '0 3px 10px rgba(139,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', position: 'relative', overflow: 'hidden', '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)' } }} onClick={() => router.back()}>
              <i className='ri-arrow-left-s-line' style={{ fontSize: '20px', color: '#8B2020', position: 'relative', zIndex: 1 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>NIMEN</Typography>
              <Typography sx={{ fontSize: '16px', fontWeight: 500, color: '#3B1010' }}>{isEdit ? 'Edit Draft Sprint' : 'Buat Draft Sprint'}</Typography>
            </Box>
          </Box>

          {/* Info Sprint */}
          <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: '10px', borderBottom: '0.5px solid rgba(180,100,100,0.1)' }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#3B1010' }}>Info Sprint</Typography>
              <Typography sx={{ fontSize: '10px', color: '#9A5A5A' }}>Informasi dasar sprint berdasarkan surat keputusan pimpinan</Typography>
            </Box>
            <Box sx={{ p: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Controller name='batch_id' control={control} rules={{ required: 'Angkatan wajib dipilih' }}
                          render={({ field }) => (
                            <FormControl fullWidth size='small'>
                              <Select displayEmpty {...field} disabled={isEdit}
                                      renderValue={val => { const b = batches.find(x => x.id === val || String(x.id) === String(val)); return b ? `${b.name} (${b.year})` : 'Pilih Angkatan' }}
                                      sx={{ borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0', '& .MuiOutlinedInput-notchedOutline': { border: '0.5px solid rgba(180,100,100,0.15) !important' }, '& .MuiSelect-select': { py: '10px', px: '12px' } }}>
                                {batches.map(b => (
                                  <MenuItem key={b.id} value={b.id}>
                                    <Box><Typography variant='body2' fontWeight={500}>{b.name}</Typography><Typography variant='caption' color='text.secondary'>Angkatan ke-{b.batch_number} · {b.year}</Typography></Box>
                                  </MenuItem>
                                ))}
                              </Select>
                              {errors.batch_id && <Typography sx={{ fontSize: '10px', color: '#A32D2D', mt: '4px' }}>{errors.batch_id.message}</Typography>}
                            </FormControl>
                          )}
              />
              <Controller name='sprint_number' control={control} rules={{ required: 'Nomor sprint wajib diisi' }}
                          render={({ field }) => (
                            <TextField {...field} fullWidth size='small' placeholder='Nomor Sprint (mis: SP/001/IV/2026)'
                                       error={!!errors.sprint_number} helperText={errors.sprint_number?.message}
                                       sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15) !important' } }, '& input': { py: '10px', px: '12px', fontSize: '12px' } }} />
                          )}
              />
              <Controller name='title' control={control} rules={{ required: 'Nama kegiatan wajib diisi' }}
                          render={({ field }) => (
                            <TextField {...field} fullWidth size='small' placeholder='Nama Kegiatan'
                                       error={!!errors.title} helperText={errors.title?.message}
                                       sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15) !important' } }, '& input': { py: '10px', px: '12px', fontSize: '12px' } }} />
                          )}
              />
              <Controller name='description' control={control}
                          render={({ field }) => (
                            <TextField {...field} fullWidth size='small' multiline rows={3} placeholder='Deskripsi (opsional)'
                                       sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15) !important' } }, '& textarea': { fontSize: '12px' } }} />
                          )}
              />
            </Box>
          </Box>

          {/* Indikator Nilai */}
          <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: '10px', borderBottom: '0.5px solid rgba(180,100,100,0.1)' }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#3B1010' }}>Indikator Nilai</Typography>
              <Typography sx={{ fontSize: '10px', color: '#9A5A5A' }}>Pilih indikator nilai untuk peserta sprint</Typography>
            </Box>
            <Box sx={{ p: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Controller name='indicator_id' control={control} rules={{ required: 'Indikator wajib dipilih' }}
                          render={({ field }) => (
                            <Autocomplete
                              options={indicators} loading={indicatorLoading}
                              getOptionLabel={opt => opt.name || ''}
                              isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                              value={selectedIndicatorObj}
                              onInputChange={(_, val) => setIndicatorSearch(val)}
                              onChange={(_, val) => { setSelectedIndicatorObj(val); field.onChange(val?.id || '') }}
                              renderOption={(props, opt) => (
                                <li {...props} key={opt.id}>
                                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                    <Box sx={{ bgcolor: opt.value >= 0 ? '#E1F5EE' : '#FCEBEB', borderRadius: '6px', px: '7px', py: '3px', flexShrink: 0 }}>
                                      <Typography sx={{ fontSize: '11px', fontWeight: 700, color: opt.value >= 0 ? '#0F6E56' : '#A32D2D' }}>{opt.value >= 0 ? `+${opt.value}` : `${opt.value}`}</Typography>
                                    </Box>
                                    <Box>
                                      <Typography sx={{ fontSize: '12px', fontWeight: 600 }}>{opt.name}</Typography>
                                      <Typography sx={{ fontSize: '10px', color: '#9A5A5A' }}>{opt.variable?.name} · {opt.variable?.category?.name}</Typography>
                                    </Box>
                                  </Box>
                                </li>
                              )}
                              renderInput={params => (
                                <TextField {...params} placeholder='Cari Indikator (min 2 karakter)...'
                                           error={!!errors.indicator_id}
                                           helperText={errors.indicator_id?.message || 'Cari berdasarkan nama indikator'}
                                           sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15) !important' } }, '& input': { fontSize: '12px' } }}
                                           InputProps={{ ...params.InputProps, endAdornment: <>{indicatorLoading ? <CircularProgress size={14} /> : null}{params.InputProps.endAdornment}</> }}
                                />
                              )}
                            />
                          )}
              />
              {selectedIndicatorObj && (
                <Box sx={{ background: selectedIndicatorObj.value >= 0 ? 'linear-gradient(145deg, #E63946, #6D0E13)' : 'linear-gradient(145deg, #A32D2D, #6D0E13)', borderRadius: '10px', p: '12px', boxShadow: '0 4px 10px rgba(180,0,30,0.2)' }}>
                  <Typography sx={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>Nilai yang akan diberikan</Typography>
                  <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#fff', lineHeight: 1, my: '4px' }}>
                    {selectedIndicatorObj.value >= 0 ? '+' : ''}{selectedIndicatorObj.value}
                  </Typography>
                  <Typography sx={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>{selectedIndicatorObj.variable?.name} · {selectedIndicatorObj.variable?.category?.name}</Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Waktu & Tempat */}
          <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: '10px', borderBottom: '0.5px solid rgba(180,100,100,0.1)' }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#3B1010' }}>Waktu & Tempat</Typography>
            </Box>
            <Box sx={{ p: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Controller name='event_date' control={control} rules={{ required: 'Tanggal kegiatan wajib diisi' }}
                          render={({ field }) => (
                            <DatePicker value={field.value} onChange={field.onChange} format='DD/MM/YYYY'
                                        slotProps={{ textField: { fullWidth: true, size: 'small', placeholder: 'Tanggal Kegiatan', error: !!errors.event_date, helperText: errors.event_date?.message,
                                            sx: { '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15) !important' } }, '& input': { py: '10px', px: '12px', fontSize: '12px' } } } }}
                            />
                          )}
              />
              <Controller name='submission_deadline' control={control} rules={{ required: 'Batas pengumpulan wajib diisi' }}
                          render={({ field }) => (
                            <DatePicker value={field.value} onChange={field.onChange} format='DD/MM/YYYY'
                                        slotProps={{ textField: { fullWidth: true, size: 'small', placeholder: 'Batas Pengumpulan Dokumen', error: !!errors.submission_deadline, helperText: errors.submission_deadline?.message || 'Batas mahasiswa upload softcopy',
                                            sx: { '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15) !important' } }, '& input': { py: '10px', px: '12px', fontSize: '12px' } } } }}
                            />
                          )}
              />
              <Controller name='location' control={control}
                          render={({ field }) => (
                            <TextField {...field} fullWidth size='small' placeholder='Lokasi (opsional)'
                                       sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15) !important' } }, '& input': { py: '10px', px: '12px', fontSize: '12px' } }} />
                          )}
              />
            </Box>
          </Box>

          {/* Kuota */}
          <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: '10px', borderBottom: '0.5px solid rgba(180,100,100,0.1)' }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#3B1010' }}>Kuota Peserta</Typography>
              <Typography sx={{ fontSize: '10px', color: '#9A5A5A' }}>Jumlah peserta yang dibutuhkan</Typography>
            </Box>
            <Box sx={{ p: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Controller name='participant_quota' control={control}
                          rules={{ required: 'Kuota wajib diisi', min: { value: 1, message: 'Min 1 peserta' } }}
                          render={({ field }) => (
                            <TextField {...field} fullWidth size='small' type='number' placeholder='Jumlah Peserta'
                                       inputProps={{ min: 1 }}
                                       error={!!errors.participant_quota} helperText={errors.participant_quota?.message}
                                       sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15) !important' } }, '& input': { py: '10px', px: '12px', fontSize: '12px' } }} />
                          )}
              />
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '8px', p: '10px', borderRadius: '8px', bgcolor: '#E6F1FB' }}>
                <i className='ri-information-line' style={{ fontSize: '16px', color: '#185FA5', flexShrink: 0, marginTop: 1 }} />
                <Typography sx={{ fontSize: '11px', color: '#185FA5', lineHeight: 1.5 }}>
                  Kuota dapat diubah selama sprint masih berstatus Draft Admin. Setelah sprint aktif, hanya pejabat yang dapat mengganti nama peserta.
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: '8px' }}>
            <Box component='button' type='button' onClick={() => router.back()} disabled={loading} sx={{ flex: 1, py: '10px', borderRadius: '10px', cursor: 'pointer', background: '#fff', border: '0.5px solid rgba(180,100,100,0.18)', boxShadow: '0 2px 6px rgba(139,0,0,0.07)' }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#9A5A5A' }}>Batal</Typography>
            </Box>
            <Box component='button' type='submit' disabled={loading} sx={{ flex: 2, py: '10px', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer', border: 'none', background: loading ? '#ccc' : 'linear-gradient(145deg, #E63946, #6D0E13)', boxShadow: '0 4px 10px rgba(180,0,30,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              {loading && <CircularProgress size={14} sx={{ color: '#fff' }} />}
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                {loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Draft Sprint'}
              </Typography>
            </Box>
          </Box>

        </Box>

        <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast(t => ({ ...t, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <Alert severity={toast.severity} variant='filled' onClose={() => setToast(t => ({ ...t, open: false }))}>{toast.message}</Alert>
        </Snackbar>
      </>
    </LocalizationProvider>
  )
}

export default NimenSprintFormView
