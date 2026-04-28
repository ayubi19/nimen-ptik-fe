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
  const periods = batch.periods || []

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
    : '—'

  return (
    <Card className='mb-4' sx={{ overflow: 'hidden' }}>
      {/* Colored Header */}
      <Box sx={{ px: 2, py: 1.5, bgcolor: isS1 ? '#E6F9EE' : '#E0F9FC' }}>
        <div className='flex items-start justify-between'>
          <div>
            <Typography variant='body2' fontWeight={600} sx={{ color: 'text.primary', mb: 0.3 }}>
              {batch.name}  ·  Angkatan ke-{batch.batch_number}
            </Typography>
            <Typography variant='caption' sx={{ color: 'text.secondary' }}>
              {batch.year} · {batch.program_type || 'S1'}
            </Typography>
          </div>
          <Chip
            label={batch.is_active ? 'Aktif' : 'Nonaktif'}
            size='small'
            color={batch.is_active ? 'success' : 'default'}
            variant='tonal'
          />
        </div>
      </Box>

      {/* Body */}
      <CardContent>
        {/* Mahasiswa */}
        <div className='flex items-center gap-2 mb-3'>
          <i className='ri-group-line text-sm' style={{ color: 'var(--mui-palette-text-secondary)' }} />
          <Typography variant='caption' color='text.secondary'>
            {batch.student_count != null ? `${batch.student_count} mahasiswa` : '0 mahasiswa'}
          </Typography>
        </div>

        {/* Periods list */}
        {periods.length > 0 ? (
          <div className='flex flex-col gap-1.5 mb-3'>
            {periods.map(p => (
              <div key={p.id} className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  {p.is_active && (
                    <Box sx={{
                      width: 6, height: 6, borderRadius: '50%',
                      bgcolor: isS1 ? '#28C76F' : '#00CFE8', flexShrink: 0
                    }} />
                  )}
                  {!p.is_active && (
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'divider', flexShrink: 0 }} />
                  )}
                  <Typography variant='caption' fontWeight={p.is_active ? 600 : 400}
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
          <Typography variant='caption' color='text.secondary' className='block mb-3 italic'>
            Periode belum di-setup
          </Typography>
        )}

        <Divider className='mb-3' />

        <div className='flex gap-2'>
          <Button fullWidth variant='tonal' size='small' color='secondary'
                  startIcon={<i className='ri-edit-line' />}
                  onClick={() => onEdit(batch)}>
            Edit
          </Button>
          <Button fullWidth variant='tonal' size='small' color='primary'
                  startIcon={<i className='ri-settings-3-line' />}
                  onClick={() => onConfig(batch)}>
            Konfigurasi
          </Button>
          <Button fullWidth variant='tonal' size='small' color='error'
                  startIcon={<i className='ri-delete-bin-line' />}
                  onClick={() => onDelete(batch)}>
            Hapus
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

const SectionHeader = ({ program, count, color, bgColor, textColor }) => (
  <div className='flex items-center gap-2 mb-4' style={{ borderBottom: `2px solid ${color}`, paddingBottom: 8 }}>
    <Chip
      label={program}
      size='small'
      sx={{
        fontWeight: 700, fontSize: 12,
        bgcolor: bgColor,
        color: textColor,
      }}
    />
    <Typography variant='body2' fontWeight={500}>Program {program}</Typography>
    <Typography variant='caption' color='text.secondary' sx={{ ml: 'auto' }}>
      {count} angkatan
    </Typography>
  </div>
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
      {/* Breadcrumb + Header */}
      <div className='flex items-center gap-2 mb-2'>
        <Typography variant='caption' color='text.secondary'>Master Data</Typography>
        <i className='ri-arrow-right-s-line text-sm opacity-50' />
        <Typography variant='body1' fontWeight={600}>Angkatan</Typography>
      </div>
      <div className='flex items-center justify-between mb-6 gap-3 flex-wrap'>
        <div />
        <Button variant='contained' startIcon={<i className='ri-add-line' />}
                onClick={handleOpenCreate}
                sx={{ width: { xs: '100%', sm: 'auto' } }}>
          Tambah Angkatan
        </Button>
      </div>

      {/* Stats */}
      <Grid container spacing={4} className='mb-6'>
        {[
          { label: 'Total Angkatan', value: data.length, icon: 'ri-building-line', color: '#FF4C51', bg: '#FFE9EA' },
          { label: 'Program S1', value: data.filter(b => (b.program_type || 'S1') === 'S1').length, icon: 'ri-book-open-line', color: '#28C76F', bg: '#E6F9EE' },
          { label: 'Program S2', value: data.filter(b => b.program_type === 'S2').length, icon: 'ri-book-2-line', color: '#00CFE8', bg: '#E0F9FC' },
          { label: 'Aktif', value: data.filter(b => b.is_active).length, icon: 'ri-checkbox-circle-line', color: '#FF9F43', bg: '#FFF3E8' },
        ].map(s => (
          <Grid item xs={6} sm={3} key={s.label}>
            <Card sx={{ height: '100%' }}>
              <CardContent className='flex items-center gap-3' sx={{ height: '100%' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 8, flexShrink: 0,
                  background: s.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className={s.icon} style={{ fontSize: 22, color: s.color }} />
                </div>
                <div>
                  <Typography variant='h4' fontWeight={600} lineHeight={1.2}>{s.value}</Typography>
                  <Typography variant='body2' color='text.secondary' sx={{ fontSize: { xs: 11, sm: 13 } }}>
                    {s.label}
                  </Typography>
                </div>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filter dalam Card */}
      <Card className='mb-6'>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <DebouncedInput
                value={search}
                onChange={setSearch}
                placeholder='Cari nama angkatan...'
                fullWidth
                InputProps={{ startAdornment: <InputAdornment position='start'><i className='ri-search-line' /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size='small'>
                <InputLabel>Tahun</InputLabel>
                <Select label='Tahun' value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
                  <MenuItem value=''>Semua Tahun</MenuItem>
                  {years.map(y => <MenuItem key={y} value={String(y)}>{y}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size='small'>
                <InputLabel>Status</InputLabel>
                <Select label='Status' value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <MenuItem value=''>Semua Status</MenuItem>
                  <MenuItem value='aktif'>Aktif</MenuItem>
                  <MenuItem value='nonaktif'>Nonaktif</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

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

      {/* Drawer */}
      <Drawer anchor='right' open={drawerOpen} onClose={() => setDrawerOpen(false)}
              PaperProps={{ sx: { width: 380 } }}>
        <div className='flex items-center justify-between p-4 border-b'>
          <Typography variant='h6'>{editData ? 'Edit Angkatan' : 'Tambah Angkatan'}</Typography>
          <IconButton onClick={() => setDrawerOpen(false)}>
            <i className='ri-close-line' />
          </IconButton>
        </div>
        <form onSubmit={handleSubmit(handleSave)} className='flex flex-col gap-4 p-4'>
          <Controller name='name' control={control}
                      rules={{ required: 'Nama wajib diisi', minLength: { value: 2, message: 'Min 2 karakter' } }}
                      render={({ field }) => (
                        <TextField {...field} fullWidth label='Nama Angkatan'
                                   error={!!errors.name} helperText={errors.name?.message} />
                      )}
          />
          <Controller name='year' control={control}
                      rules={{ required: 'Tahun wajib diisi', min: { value: 2000, message: 'Min 2000' } }}
                      render={({ field }) => (
                        <TextField {...field} fullWidth label='Tahun' type='number'
                                   error={!!errors.year} helperText={errors.year?.message} />
                      )}
          />
          <Controller name='batch_number' control={control}
                      rules={{ required: 'Nomor angkatan wajib diisi', min: { value: 1, message: 'Min 1' } }}
                      render={({ field }) => (
                        <TextField {...field} fullWidth label='Nomor Angkatan' type='number'
                                   helperText={errors.batch_number?.message || 'S1 mulai dari 1, S2 mulai dari 16'}
                                   error={!!errors.batch_number} />
                      )}
          />
          <Controller name='program_type' control={control}
                      rules={{ required: 'Jenjang wajib dipilih' }}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>Jenjang Program</InputLabel>
                          <Select {...field} label='Jenjang Program'>
                            <MenuItem value='S1'>S1 — 4 Tahun</MenuItem>
                            <MenuItem value='S2'>S2 — 1 Tahun</MenuItem>
                          </Select>
                        </FormControl>
                      )}
          />
          {editData && (
            <Controller name='is_active' control={control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={<Switch checked={field.value} onChange={e => field.onChange(e.target.checked)} />}
                            label='Angkatan Aktif'
                          />
                        )}
            />
          )}
          <div className='flex gap-2 mt-2'>
            <Button fullWidth variant='tonal' color='secondary'
                    onClick={() => setDrawerOpen(false)} disabled={saveLoading}>
              Batal
            </Button>
            <Button fullWidth variant='contained' type='submit' disabled={saveLoading}
                    startIcon={saveLoading ? <CircularProgress size={16} color='inherit' /> : null}>
              {saveLoading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
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
