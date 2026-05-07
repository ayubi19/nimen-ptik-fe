'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import Box from '@mui/material/Box'
import { useForm, Controller } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { batchApi } from '@/libs/api/masterDataApi'

const DebouncedInput = ({ value: initial, onChange, debounce = 400, ...props }) => {
  const [value, setValue] = useState(initial)
  const ref = useRef(onChange)
  useEffect(() => { ref.current = onChange }, [onChange])
  useEffect(() => setValue(initial), [initial])
  useEffect(() => {
    const t = setTimeout(() => ref.current(value), debounce)
    return () => clearTimeout(t)
  }, [value, debounce])
  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} size='small' />
}

const BatchCard = ({ batch, onEdit, onDelete, onConfig }) => {
  const isS1 = (batch.program_type || 'S1') === 'S1'
  const accentColor = isS1 ? '#0F6E56' : '#185FA5'
  const accentBg    = isS1 ? '#E1F5EE' : '#E6F1FB'
  const periods     = batch.periods || []
  const fmtDate = d => d ? new Date(d).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) : '—'

  return (
    <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', overflow: 'hidden', mb: '10px' }}>
      {/* Header */}
      <Box sx={{ px: 2, py: '10px', borderBottom: '0.5px solid rgba(180,100,100,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#3B1010', lineHeight: 1.3 }}>
            {batch.name}
          </Typography>
          <Typography sx={{ fontSize: '10px', color: '#9A5A5A' }}>
            Angkatan ke-{batch.batch_number} · {batch.year}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: '5px' }}>
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
          <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>
            {batch.student_count != null ? `${batch.student_count} mahasiswa` : '0 mahasiswa'}
          </Typography>
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
          <Box component='button' onClick={() => onEdit(batch)} sx={{
            flex: 1, py: '5px', borderRadius: '8px', fontSize: '10px', fontWeight: 500, cursor: 'pointer',
            border: '0.5px solid rgba(180,100,100,0.18)', background: 'rgba(255,255,255,0.72)',
            boxShadow: '0 2px 6px rgba(139,0,0,0.07)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#444441',
          }}>
            <i className='ri-edit-line' style={{ fontSize: '11px' }} /> Edit
          </Box>
          <Box component='button' onClick={() => onConfig(batch)} sx={{
            flex: 1, py: '5px', borderRadius: '8px', fontSize: '10px', fontWeight: 600, cursor: 'pointer',
            border: 'none', background: 'linear-gradient(145deg, #E63946, #6D0E13)',
            boxShadow: '0 3px 8px rgba(180,0,30,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#fff',
          }}>
            <i className='ri-settings-3-line' style={{ fontSize: '11px' }} /> Konfigurasi
          </Box>
          <Box component='button' onClick={() => onDelete(batch)} sx={{
            px: '10px', py: '5px', borderRadius: '8px', fontSize: '10px', cursor: 'pointer',
            border: '0.5px solid rgba(163,45,45,0.2)', background: '#FCEBEB',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className='ri-delete-bin-line' style={{ fontSize: '13px', color: '#A32D2D' }} />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

const SectionHeader = ({ program, count, color, bgColor, textColor }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mb: '10px', pb: '8px', borderBottom: `2px solid ${color}` }}>
    <Box sx={{ bgcolor: bgColor, borderRadius: '6px', px: '8px', py: '3px' }}>
      <Typography sx={{ fontSize: '11px', fontWeight: 700, color: textColor }}>{program}</Typography>
    </Box>
    <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#3B1010' }}>Program {program}</Typography>
    <Typography sx={{ fontSize: '11px', color: '#9A5A5A', ml: 'auto' }}>{count} angkatan</Typography>
  </Box>
)

const BatchesView = () => {
  const router = useRouter()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editData, setEditData] = useState(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const showToast = useCallback((msg, severity = 'success') => {
    setToast({ open: true, message: msg, severity })
  }, [])

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { name: '', year: new Date().getFullYear(), program_type: 'S1', batch_number: 1, is_active: true }
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await batchApi.getAll({ page: 1, page_size: 100 })
      setData(res.data.data?.data || [])
    } catch {
      showToast('Gagal memuat data angkatan', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { fetchData() }, [fetchData])

  const handleOpenEdit = useCallback((row) => {
    setEditData(row)
    reset({ name: row.name, year: row.year, program_type: row.program_type || 'S1', batch_number: row.batch_number || 1, is_active: row.is_active })
    setDrawerOpen(true)
  }, [reset])

  const handleOpenCreate = useCallback(() => {
    setEditData(null)
    reset({ name: '', year: new Date().getFullYear(), program_type: 'S1', batch_number: 1, is_active: true })
    setDrawerOpen(true)
  }, [reset])

  const handleSave = useCallback(async (values) => {
    setSaveLoading(true)
    try {
      const payload = {
        name: values.name,
        year: parseInt(values.year),
        program_type: values.program_type,
        batch_number: parseInt(values.batch_number),
        ...(editData && { is_active: values.is_active })
      }
      if (editData) {
        await batchApi.update(editData.id, payload)
        showToast('Angkatan berhasil diperbarui')
      } else {
        await batchApi.create(payload)
        showToast('Angkatan berhasil dibuat')
      }
      setDrawerOpen(false)
      fetchData()
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan', 'error')
    } finally {
      setSaveLoading(false)
    }
  }, [editData, fetchData, showToast])

  const handleDelete = useCallback(async () => {
    setDeleteLoading(true)
    try {
      await batchApi.delete(deleteTarget.id)
      showToast('Angkatan berhasil dihapus')
      setDeleteTarget(null)
      fetchData()
    } catch (err) {
      showToast(err.message || 'Gagal menghapus', 'error')
    } finally {
      setDeleteLoading(false)
    }
  }, [deleteTarget, fetchData, showToast])

  const { s1List, s2List, years } = useMemo(() => {
    const filtered = data.filter(b => {
      const matchSearch = !search || b.name.toLowerCase().includes(search.toLowerCase())
      const matchYear = !yearFilter || String(b.year) === yearFilter
      const matchStatus = !statusFilter || (statusFilter === 'aktif' ? b.is_active : !b.is_active)
      return matchSearch && matchYear && matchStatus
    })
    return {
      s1List: filtered.filter(b => (b.program_type || 'S1') === 'S1'),
      s2List: filtered.filter(b => b.program_type === 'S2'),
      years: [...new Set(data.map(b => b.year))].sort((a, b) => b - a),
    }
  }, [data, search, yearFilter, statusFilter])

  return (
    <>
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
            <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>Master Data</Typography>
            <Typography sx={{ fontSize: '16px', fontWeight: 500, color: '#3B1010' }}>Angkatan</Typography>
          </Box>
        </Box>
        <Box component='button' onClick={handleOpenCreate} sx={{
          display: 'flex', alignItems: 'center', gap: '5px', px: '12px', py: '7px',
          borderRadius: '10px', border: 'none', cursor: 'pointer',
          background: 'linear-gradient(145deg, #E63946, #6D0E13)',
          boxShadow: '0 4px 10px rgba(180,0,30,0.25)',
        }}>
          <i className='ri-add-line' style={{ fontSize: '14px', color: '#fff' }} />
          <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>Tambah</Typography>
        </Box>
      </Box>

      {/* Stats — 2x2 crystal */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', mb: '10px' }}>
        {[
          { label: 'Total Angkatan', value: data.length,                                              icon: 'ri-building-line' },
          { label: 'Program S1',     value: data.filter(b => (b.program_type || 'S1') === 'S1').length, icon: 'ri-book-open-line' },
          { label: 'Program S2',     value: data.filter(b => b.program_type === 'S2').length,           icon: 'ri-book-2-line' },
          { label: 'Aktif',          value: data.filter(b => b.is_active).length,                       icon: 'ri-checkbox-circle-line' },
        ].map(s => (
          <Box key={s.label} sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', flexShrink: 0, background: 'linear-gradient(145deg, #E63946, #6D0E13)', boxShadow: '0 4px 10px rgba(180,0,30,0.25), inset 0 1px 0 rgba(255,180,180,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '45%', borderRadius: '12px 12px 0 0', background: 'linear-gradient(180deg, rgba(255,200,200,0.32) 0%, transparent 100%)' } }}>
              <i className={s.icon} style={{ fontSize: '20px', color: 'rgba(255,255,255,0.92)', position: 'relative', zIndex: 1 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '20px', fontWeight: 500, color: '#3B1010', lineHeight: 1 }}>{s.value}</Typography>
              <Typography sx={{ fontSize: '10px', color: '#9A5A5A', mt: '2px' }}>{s.label}</Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Filter — PWA native */}
      <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', p: '10px 12px', mb: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <DebouncedInput fullWidth value={search} onChange={setSearch}
                        placeholder='Cari nama angkatan...'
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15) !important' } }, '& input': { py: '7px', px: '10px', fontSize: '12px' } }}
                        InputProps={{ startAdornment: <InputAdornment position='start'><i className='ri-search-line' style={{ color: '#9A5A5A', fontSize: '14px' }} /></InputAdornment> }}
        />
        <Box sx={{ display: 'flex', gap: '8px' }}>
          <FormControl size='small' sx={{ flex: 1 }}>
            <Select displayEmpty value={yearFilter} onChange={e => setYearFilter(e.target.value)}
                    renderValue={val => val || 'Semua Tahun'}
                    sx={{ borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0', '& .MuiOutlinedInput-notchedOutline': { border: '0.5px solid rgba(180,100,100,0.15) !important' }, '& .MuiSelect-select': { py: '7px', px: '10px' } }}>
              <MenuItem value=''>Semua Tahun</MenuItem>
              {years.map(y => <MenuItem key={y} value={String(y)}>{y}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size='small' sx={{ flex: 1 }}>
            <Select displayEmpty value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    renderValue={val => val === 'aktif' ? 'Aktif' : val === 'nonaktif' ? 'Nonaktif' : 'Semua Status'}
                    sx={{ borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0', '& .MuiOutlinedInput-notchedOutline': { border: '0.5px solid rgba(180,100,100,0.15) !important' }, '& .MuiSelect-select': { py: '7px', px: '10px' } }}>
              <MenuItem value=''>Semua Status</MenuItem>
              <MenuItem value='aktif'>Aktif</MenuItem>
              <MenuItem value='nonaktif'>Nonaktif</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Two Column */}
      {loading ? (
        <div className='flex justify-center py-10'><CircularProgress /></div>
      ) : (
        <Grid container spacing={6}>
          {/* S1 */}
          <Grid item xs={12} md={6}>
            <SectionHeader program='S1' count={s1List.length}
                           color='#28C76F' bgColor='#E6F9EE' textColor='#1B7A47' />
            <div style={{ maxHeight: 560, overflowY: 'auto', paddingRight: 4 }}>
              {s1List.length === 0 ? (
                <Card>
                  <CardContent className='text-center py-8'>
                    <i className='ri-inbox-line text-4xl opacity-30 block mb-2' />
                    <Typography variant='body2' color='text.secondary'>
                      Tidak ada angkatan S1 yang cocok
                    </Typography>
                  </CardContent>
                </Card>
              ) : s1List.map(b => (
                <BatchCard key={b.id} batch={b}
                           onEdit={handleOpenEdit}
                           onDelete={setDeleteTarget}
                           onConfig={() => router.push('/nimen/batch-config')}
                />
              ))}
            </div>
          </Grid>

          {/* S2 */}
          <Grid item xs={12} md={6}>
            <SectionHeader program='S2' count={s2List.length}
                           color='#00CFE8' bgColor='#E0F9FC' textColor='#0891B2' />
            <div style={{ maxHeight: 560, overflowY: 'auto', paddingRight: 4 }}>
              {s2List.length === 0 ? (
                <Card>
                  <CardContent className='text-center py-8'>
                    <i className='ri-inbox-line text-4xl opacity-30 block mb-2' />
                    <Typography variant='body2' color='text.secondary'>
                      Tidak ada angkatan S2 yang cocok
                    </Typography>
                  </CardContent>
                </Card>
              ) : s2List.map(b => (
                <BatchCard key={b.id} batch={b}
                           onEdit={handleOpenEdit}
                           onDelete={setDeleteTarget}
                           onConfig={() => router.push('/nimen/batch-config')}
                />
              ))}
            </div>
          </Grid>
        </Grid>
      )}

      {/* Drawer — PWA native */}
      <Drawer anchor='right' open={drawerOpen} onClose={() => setDrawerOpen(false)}
              PaperProps={{ sx: { width: { xs: '100%', sm: 400 }, bgcolor: '#F5F2F0' } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: '14px 16px', bgcolor: '#fff', borderBottom: '0.5px solid rgba(180,100,100,0.15)' }}>
          <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#3B1010' }}>
            {editData ? 'Edit Angkatan' : 'Tambah Angkatan'}
          </Typography>
          <Box component='button' onClick={() => setDrawerOpen(false)} sx={{ width: 30, height: 30, borderRadius: '8px', border: 'none', cursor: 'pointer', background: '#F5F2F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className='ri-close-line' style={{ fontSize: '16px', color: '#9A5A5A' }} />
          </Box>
        </Box>
        <Box component='form' onSubmit={handleSubmit(handleSave)} sx={{ display: 'flex', flexDirection: 'column', gap: '10px', p: '14px', overflowY: 'auto' }}>
          <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', p: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Controller name='name' control={control}
                        rules={{ required: 'Nama wajib diisi', minLength: { value: 2, message: 'Min 2 karakter' } }}
                        render={({ field }) => (
                          <TextField {...field} fullWidth size='small' placeholder='Nama Angkatan'
                                     error={!!errors.name} helperText={errors.name?.message}
                                     sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15) !important' } }, '& input': { py: '10px', px: '12px', fontSize: '12px' } }} />
                        )}
            />
            <Box sx={{ display: 'flex', gap: '8px' }}>
              <Controller name='year' control={control}
                          rules={{ required: 'Tahun wajib diisi', min: { value: 2000, message: 'Min 2000' } }}
                          render={({ field }) => (
                            <TextField {...field} fullWidth size='small' placeholder='Tahun' type='number'
                                       error={!!errors.year} helperText={errors.year?.message}
                                       sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15) !important' } }, '& input': { py: '10px', px: '12px', fontSize: '12px' } }} />
                          )}
              />
              <Controller name='batch_number' control={control}
                          rules={{ required: 'Nomor angkatan wajib diisi', min: { value: 1, message: 'Min 1' } }}
                          render={({ field }) => (
                            <TextField {...field} fullWidth size='small' placeholder='No. Angkatan' type='number'
                                       error={!!errors.batch_number}
                                       helperText={errors.batch_number?.message || 'S1: 1+, S2: 16+'}
                                       sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15) !important' } }, '& input': { py: '10px', px: '12px', fontSize: '12px' } }} />
                          )}
              />
            </Box>
            <Controller name='program_type' control={control} rules={{ required: 'Jenjang wajib dipilih' }}
                        render={({ field }) => (
                          <FormControl fullWidth size='small'>
                            <Select displayEmpty {...field}
                                    renderValue={val => val === 'S1' ? 'S1 — 4 Tahun' : val === 'S2' ? 'S2 — 1 Tahun' : 'Pilih Jenjang'}
                                    sx={{ borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0', '& .MuiOutlinedInput-notchedOutline': { border: '0.5px solid rgba(180,100,100,0.15) !important' }, '& .MuiSelect-select': { py: '10px', px: '12px' } }}>
                              <MenuItem value='S1'>S1 — 4 Tahun</MenuItem>
                              <MenuItem value='S2'>S2 — 1 Tahun</MenuItem>
                            </Select>
                          </FormControl>
                        )}
            />
            {editData && (
              <Controller name='is_active' control={control}
                          render={({ field }) => (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: '4px' }}>
                              <Typography sx={{ fontSize: '12px', color: '#3B1010' }}>Angkatan Aktif</Typography>
                              <Switch checked={field.value} onChange={e => field.onChange(e.target.checked)}
                                      sx={{ '& .MuiSwitch-track': { bgcolor: field.value ? '#EB3D47 !important' : undefined } }} />
                            </Box>
                          )}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: '8px' }}>
            <Box component='button' type='button' onClick={() => setDrawerOpen(false)} disabled={saveLoading} sx={{ flex: 1, py: '10px', borderRadius: '10px', cursor: 'pointer', background: '#fff', border: '0.5px solid rgba(180,100,100,0.18)', boxShadow: '0 2px 6px rgba(139,0,0,0.07)' }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#9A5A5A' }}>Batal</Typography>
            </Box>
            <Box component='button' type='submit' disabled={saveLoading} sx={{ flex: 2, py: '10px', borderRadius: '10px', cursor: 'pointer', border: 'none', background: saveLoading ? '#ccc' : 'linear-gradient(145deg, #E63946, #6D0E13)', boxShadow: '0 4px 10px rgba(180,0,30,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              {saveLoading && <CircularProgress size={14} sx={{ color: '#fff' }} />}
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{saveLoading ? 'Menyimpan...' : 'Simpan'}</Typography>
            </Box>
          </Box>
        </Box>
      </Drawer>

      {/* Dialog Hapus */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth='xs' fullWidth>
        <DialogTitle>Hapus Angkatan?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Hapus <strong>{deleteTarget?.name} ({deleteTarget?.year} — {deleteTarget?.program_type || 'S1'})</strong>?
            Tindakan ini tidak dapat dibatalkan.
          </DialogContentText>
        </DialogContent>
        <DialogActions className='p-4 gap-2'>
          <Button variant='tonal' color='secondary' onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>
            Batal
          </Button>
          <Button variant='contained' color='error' onClick={handleDelete} disabled={deleteLoading}
                  startIcon={deleteLoading ? <CircularProgress size={16} color='inherit' /> : null}>
            {deleteLoading ? 'Menghapus...' : 'Hapus'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default BatchesView
