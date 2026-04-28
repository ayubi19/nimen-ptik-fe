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
import FormControlLabel from '@mui/material/FormControlLabel'
import FormControl from '@mui/material/FormControl'
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
import { syndicateApi } from '@/libs/api/masterDataApi'

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

// Warna roman numeral → hue cycling
const ROMAN_COLORS = [
  { bg: '#FFE9EA', color: '#FF4C51' },
  { bg: '#E6F9EE', color: '#28C76F' },
  { bg: '#E0F9FC', color: '#00CFE8' },
  { bg: '#FFF3E8', color: '#FF9F43' },
  { bg: '#F3EDFF', color: '#7367F0' },
  { bg: '#FCEAEA', color: '#E83E8C' },
  { bg: '#E8F4FE', color: '#1E9BE9' },
  { bg: '#FEF9E7', color: '#D4AC0D' },
]

const getColor = (idx) => ROMAN_COLORS[idx % ROMAN_COLORS.length]

const SyndicateCard = ({ syndicate, idx, onEdit, onDelete }) => {
  const { bg, color } = getColor(idx)

  return (
    <Card className='mb-4' sx={{ overflow: 'hidden' }}>
      {/* Colored Header */}
      <Box sx={{ px: 2, py: 1.5, bgcolor: bg }}>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <Box sx={{
              width: 36, height: 36, borderRadius: '50%',
              bgcolor: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Typography variant='caption' fontWeight={700} sx={{ color: '#fff', fontSize: 11 }}>
                {syndicate.code || syndicate.name?.split(' ').pop()?.substring(0, 3)}
              </Typography>
            </Box>
            <div>
              <Typography variant='body2' fontWeight={600} color='text.primary'>
                {syndicate.name}
              </Typography>
              {syndicate.code && (
                <Typography variant='caption' color='text.secondary'>
                  Kode: {syndicate.code}
                </Typography>
              )}
            </div>
          </div>
          <Chip
            label={syndicate.is_active ? 'Aktif' : 'Nonaktif'}
            size='small'
            color={syndicate.is_active ? 'success' : 'default'}
            variant='tonal'
          />
        </div>
      </Box>

      {/* Body */}
      <CardContent sx={{ pt: 1.5, pb: '12px !important' }}>
        {/* Info mahasiswa count kalau ada */}
        <div className='flex items-center gap-2 mb-3'>
          <i className='ri-group-line text-sm' style={{ color: 'var(--mui-palette-text-secondary)' }} />
          <Typography variant='caption' color='text.secondary'>
            {syndicate.student_count != null ? `${syndicate.student_count} mahasiswa` : '—'}
          </Typography>
        </div>

        <Divider className='mb-3' />

        <div className='flex gap-2'>
          <Button fullWidth variant='tonal' size='small' color='secondary'
                  startIcon={<i className='ri-edit-line' />}
                  onClick={() => onEdit(syndicate)}>
            Edit
          </Button>
          <Button fullWidth variant='tonal' size='small' color='error'
                  startIcon={<i className='ri-delete-bin-line' />}
                  onClick={() => onDelete(syndicate)}>
            Hapus
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

const SyndicatesView = () => {
  const [data, setData]             = useState([])
  const [loading, setLoading]       = useState(false)
  const [search, setSearch]         = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editData, setEditData]     = useState(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const showToast = useCallback((msg, severity = 'success') => {
    setToast({ open: true, message: msg, severity })
  }, [])

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { name: '', code: '', is_active: true }
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await syndicateApi.getAll({ page: 1, page_size: 100 })
      setData(res.data.data?.data || [])
    } catch {
      showToast('Gagal memuat data sindikat', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { fetchData() }, [fetchData])

  const handleOpenCreate = useCallback(() => {
    setEditData(null)
    reset({ name: '', code: '', is_active: true })
    setDrawerOpen(true)
  }, [reset])

  const handleOpenEdit = useCallback((row) => {
    setEditData(row)
    reset({ name: row.name, code: row.code || '', is_active: row.is_active })
    setDrawerOpen(true)
  }, [reset])

  const handleSave = useCallback(async (values) => {
    setSaveLoading(true)
    try {
      const payload = { name: values.name, code: values.code || null }
      if (editData) payload.is_active = values.is_active
      if (editData) {
        await syndicateApi.update(editData.id, payload)
        showToast('Sindikat berhasil diperbarui')
      } else {
        await syndicateApi.create(payload)
        showToast('Sindikat berhasil dibuat')
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
      await syndicateApi.delete(deleteTarget.id)
      showToast('Sindikat berhasil dihapus')
      setDeleteTarget(null)
      fetchData()
    } catch (err) {
      showToast(err.message || 'Gagal menghapus', 'error')
    } finally {
      setDeleteLoading(false)
    }
  }, [deleteTarget, fetchData, showToast])

  const filtered = useMemo(() => data.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || (statusFilter === 'aktif' ? s.is_active : !s.is_active)
    return matchSearch && matchStatus
  }), [data, search, statusFilter])

  const totalAktif    = data.filter(s => s.is_active).length
  const totalNonaktif = data.filter(s => !s.is_active).length

  return (
    <>
      {/* Breadcrumb + Header */}
      <div className='flex items-center gap-2 mb-2'>
        <Typography variant='caption' color='text.secondary'>Master Data</Typography>
        <i className='ri-arrow-right-s-line text-sm opacity-50' />
        <Typography variant='body1' fontWeight={600}>Sindikat</Typography>
      </div>
      <div className='flex items-center justify-between mb-6 gap-3 flex-wrap'>
        <div />
        <Button variant='contained' startIcon={<i className='ri-add-line' />}
                onClick={handleOpenCreate}
                sx={{ width: { xs: '100%', sm: 'auto' } }}>
          Tambah Sindikat
        </Button>
      </div>

      {/* Stats */}
      <Grid container spacing={4} className='mb-6'>
        {[
          { label: 'Aktif',    value: totalAktif,    icon: 'ri-checkbox-circle-line', color: '#28C76F', bg: '#E6F9EE' },
          { label: 'Nonaktif', value: totalNonaktif, icon: 'ri-close-circle-line',    color: '#A8AAAE', bg: '#F4F4F4' },
        ].map(s => (
          <Grid item xs={6} key={s.label}>
            <Card sx={{ height: '100%' }}>
              <CardContent className='flex items-center gap-3' sx={{ height: '100%', p: '12px !important' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 8, flexShrink: 0,
                  background: s.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className={s.icon} style={{ fontSize: 22, color: s.color }} />
                </div>
                <div>
                  <Typography variant='h4' fontWeight={600} lineHeight={1.2}>{s.value}</Typography>
                  <Typography variant='body2' color='text.secondary' sx={{ fontSize: { xs: 10, sm: 12 } }}>
                    {s.label}
                  </Typography>
                </div>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filter */}
      <Card className='mb-6'>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <DebouncedInput
                value={search}
                onChange={setSearch}
                placeholder='Cari nama sindikat...'
                fullWidth
                InputProps={{ startAdornment: <InputAdornment position='start'><i className='ri-search-line' /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12}>
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

      {/* List */}
      {loading ? (
        <div className='flex justify-center py-10'><CircularProgress /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className='text-center py-12'>
            <i className='ri-shield-star-line text-5xl opacity-30 block mb-3' />
            <Typography variant='body2' color='text.secondary'>Tidak ada sindikat ditemukan</Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={4}>
          {filtered.map((s, idx) => (
            <Grid item xs={12} sm={6} md={4} key={s.id}>
              <SyndicateCard
                syndicate={s}
                idx={idx}
                onEdit={handleOpenEdit}
                onDelete={setDeleteTarget}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Drawer */}
      <Drawer anchor='right' open={drawerOpen} onClose={() => setDrawerOpen(false)}
              PaperProps={{ sx: { width: { xs: '100%', sm: 380 } } }}>
        <div className='flex items-center justify-between p-4 border-b'>
          <Typography variant='h6'>{editData ? 'Edit Sindikat' : 'Tambah Sindikat'}</Typography>
          <IconButton onClick={() => setDrawerOpen(false)}>
            <i className='ri-close-line' />
          </IconButton>
        </div>
        <form onSubmit={handleSubmit(handleSave)} className='flex flex-col gap-4 p-4'>
          <Controller name='name' control={control}
                      rules={{ required: 'Nama sindikat wajib diisi', minLength: { value: 2, message: 'Min 2 karakter' } }}
                      render={({ field }) => (
                        <TextField {...field} fullWidth label='Nama Sindikat' placeholder='Contoh: Sindikat I'
                                   error={!!errors.name} helperText={errors.name?.message} />
                      )}
          />
          <Controller name='code' control={control}
                      render={({ field }) => (
                        <TextField {...field} fullWidth label='Kode (opsional)' placeholder='Contoh: I'
                                   inputProps={{ maxLength: 20 }}
                                   helperText='Kode singkat ditampilkan sebagai avatar' />
                      )}
          />
          {editData && (
            <Controller name='is_active' control={control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={<Switch checked={field.value} onChange={e => field.onChange(e.target.checked)} />}
                            label='Sindikat Aktif'
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
        <DialogTitle>Hapus Sindikat?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Hapus <strong>{deleteTarget?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
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

export default SyndicatesView
