'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
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
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import Box from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { useForm, Controller } from 'react-hook-form'
import { nimenCategoryApi } from '@/libs/api/nimenMasterDataApi'

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

const TYPE_CONFIG = {
  PLUS:  { label: 'Penambahan',  color: '#28C76F', bg: '#E6F9EE', icon: 'ri-add-circle-line',           chipColor: 'success' },
  MINUS: { label: 'Pengurangan', color: '#FF4C51', bg: '#FFE9EA', icon: 'ri-indeterminate-circle-line',  chipColor: 'error'   },
}

// ── Mobile Card ───────────────────────────────────────────────────────────────
const CategoryMobileCard = ({ row, onEdit, onDelete }) => {
  const cfg = TYPE_CONFIG[row.type] || TYPE_CONFIG.PLUS

  return (
    <Card className='mb-3'>
      <CardContent>
        <div className='flex items-start justify-between mb-2'>
          <div className='flex-1 mr-2'>
            <div className='flex items-center gap-2 mb-1'>
              <i className={cfg.icon} style={{ fontSize: 18, color: cfg.color }} />
              <Typography variant='body2' fontWeight={600}>{row.name}</Typography>
            </div>
            <Chip label={cfg.label} size='small' color={cfg.chipColor} variant='tonal' />
          </div>
          <Chip label={row.is_active ? 'Aktif' : 'Nonaktif'} size='small'
                color={row.is_active ? 'success' : 'default'} variant='tonal' />
        </div>
        <Divider className='my-2' />
        <div className='flex gap-2'>
          <Button size='small' variant='tonal' color='secondary' fullWidth
                  startIcon={<i className='ri-edit-line' />}
                  onClick={() => onEdit(row)}>Edit</Button>
          <Button size='small' variant='tonal' color='error' fullWidth
                  startIcon={<i className='ri-delete-bin-line' />}
                  onClick={() => onDelete(row)}>Hapus</Button>
        </div>
      </CardContent>
    </Card>
  )
}

const NimenCategoriesView = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [data, setData]             = useState([])
  const [loading, setLoading]       = useState(false)
  const [search, setSearch]         = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editData, setEditData]     = useState(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const showToast = useCallback((msg, severity = 'success') =>
    setToast({ open: true, message: msg, severity }), [])

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: { name: '', type: 'PLUS', is_active: true }
  })
  const selectedType = watch('type')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await nimenCategoryApi.getAll({ page: 1, page_size: 100 })
      setData(res.data.data?.data || [])
    } catch { showToast('Gagal memuat data kategori', 'error') }
    finally { setLoading(false) }
  }, [showToast])

  useEffect(() => { fetchData() }, [fetchData])

  const handleOpenCreate = useCallback(() => {
    setEditData(null)
    reset({ name: '', type: 'PLUS', is_active: true })
    setDrawerOpen(true)
  }, [reset])

  const handleOpenEdit = useCallback((row) => {
    setEditData(row)
    reset({ name: row.name, type: row.type, is_active: row.is_active })
    setDrawerOpen(true)
  }, [reset])

  const handleSave = useCallback(async (values) => {
    setSaveLoading(true)
    try {
      const payload = { name: values.name, type: values.type, ...(editData && { is_active: values.is_active }) }
      if (editData) {
        await nimenCategoryApi.update(editData.id, payload)
        showToast('Kategori berhasil diperbarui')
      } else {
        await nimenCategoryApi.create(payload)
        showToast('Kategori berhasil dibuat')
      }
      setDrawerOpen(false)
      fetchData()
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan', 'error')
    } finally { setSaveLoading(false) }
  }, [editData, fetchData, showToast])

  const handleDelete = useCallback(async () => {
    setDeleteLoading(true)
    try {
      await nimenCategoryApi.delete(deleteTarget.id)
      showToast('Kategori berhasil dihapus')
      setDeleteTarget(null)
      fetchData()
    } catch (err) {
      showToast(err.message || 'Gagal menghapus', 'error')
    } finally { setDeleteLoading(false) }
  }, [deleteTarget, fetchData, showToast])

  const filtered = data.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase())
    const matchType   = !typeFilter || c.type === typeFilter
    const matchStatus = !statusFilter || (statusFilter === 'aktif' ? c.is_active : !c.is_active)
    return matchSearch && matchType && matchStatus
  })

  const totalPlus  = data.filter(c => c.type === 'PLUS').length
  const totalMinus = data.filter(c => c.type === 'MINUS').length

  return (
    <>
      {/* Breadcrumb */}
      <div className='flex items-center gap-2 mb-6'>
        <Typography variant='caption' color='text.secondary'>Master Data NIMEN</Typography>
        <i className='ri-arrow-right-s-line text-sm opacity-50' />
        <Typography variant='caption' fontWeight={500} color='text.primary'>Kategori Nilai NIMEN</Typography>
      </div>

      {/* Header */}
      <div className='flex items-center justify-between mb-6 flex-wrap gap-3'>
        <div />
        <Button variant='contained' startIcon={<i className='ri-add-line' />}
                onClick={handleOpenCreate}
                sx={{ width: { xs: '100%', sm: 'auto' } }}>
          Tambah Kategori
        </Button>
      </div>

      {/* Stats */}
      <Grid container spacing={4} className='mb-6'>
        {[
          { label: 'Penambahan Nilai', value: totalPlus,  icon: 'ri-add-circle-line',           color: '#28C76F', bg: '#E6F9EE' },
          { label: 'Pengurangan Nilai',value: totalMinus, icon: 'ri-indeterminate-circle-line', color: '#FF4C51', bg: '#FFE9EA' },
        ].map(s => (
          <Grid item xs={12} md={6} key={s.label}>
            <Card sx={{ height: '100%' }}>
              <CardContent className='flex items-center gap-3' sx={{ p: '12px !important' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 8, flexShrink: 0,
                  background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
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

      {/* Filter */}
      <Card className='mb-6'>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <DebouncedInput fullWidth value={search} onChange={setSearch}
                              placeholder='Cari nama kategori...'
                              InputProps={{ startAdornment: <InputAdornment position='start'><i className='ri-search-line' /></InputAdornment> }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size='small'>
                <InputLabel>Tipe</InputLabel>
                <Select label='Tipe' value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                  <MenuItem value=''>Semua Tipe</MenuItem>
                  <MenuItem value='PLUS'>Penambahan</MenuItem>
                  <MenuItem value='MINUS'>Pengurangan</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
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

      {/* Content */}
      {loading ? (
        <div className='flex justify-center py-10'><CircularProgress /></div>
      ) : isMobile ? (
        // ── Mobile: Card List ──
        <div>
          {filtered.length === 0 ? (
            <Card>
              <CardContent className='text-center py-10'>
                <i className='ri-node-tree text-5xl opacity-30 block mb-2' />
                <Typography variant='body2' color='text.secondary'>Tidak ada kategori ditemukan</Typography>
              </CardContent>
            </Card>
          ) : filtered.map(row => (
            <CategoryMobileCard key={row.id} row={row}
                                onEdit={handleOpenEdit} onDelete={setDeleteTarget} />
          ))}
        </div>
      ) : (
        // ── Desktop: Table ──
        <Card>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                {['Nama Kategori', 'Tipe', 'Status', 'Aksi'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align='center' sx={{ py: 8 }}>
                    <i className='ri-node-tree text-5xl opacity-30 block mb-2' />
                    <Typography variant='body2' color='text.secondary'>Tidak ada kategori ditemukan</Typography>
                  </TableCell>
                </TableRow>
              ) : filtered.map(row => {
                const cfg = TYPE_CONFIG[row.type] || TYPE_CONFIG.PLUS
                return (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <i className={cfg.icon} style={{ fontSize: 18, color: cfg.color }} />
                        <Typography variant='body2' fontWeight={600}>{row.name}</Typography>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip label={cfg.label} size='small' color={cfg.chipColor} variant='tonal' />
                    </TableCell>
                    <TableCell>
                      <Chip label={row.is_active ? 'Aktif' : 'Nonaktif'} size='small'
                            color={row.is_active ? 'success' : 'default'} variant='tonal' />
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-0.5'>
                        <IconButton size='small' onClick={() => handleOpenEdit(row)}>
                          <i className='ri-edit-line text-[20px]' />
                        </IconButton>
                        <IconButton size='small' onClick={() => setDeleteTarget(row)}>
                          <i className='ri-delete-bin-7-line text-[20px]' />
                        </IconButton>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Drawer */}
      <Drawer anchor='right' open={drawerOpen} onClose={() => setDrawerOpen(false)}
              PaperProps={{ sx: { width: { xs: '100%', sm: 420 } } }}>
        <div className='flex items-center justify-between p-4 border-b'>
          <Typography variant='h6'>{editData ? 'Edit Kategori' : 'Tambah Kategori'}</Typography>
          <IconButton onClick={() => setDrawerOpen(false)}><i className='ri-close-line' /></IconButton>
        </div>
        <form onSubmit={handleSubmit(handleSave)} className='flex flex-col gap-4 p-4'>
          <div>
            <Typography variant='subtitle2' color='text.secondary' className='mb-2'>Tipe Nilai</Typography>
            <Controller name='type' control={control}
                        render={({ field }) => (
                          <ToggleButtonGroup exclusive value={field.value}
                                             onChange={(_, val) => { if (val) field.onChange(val) }}
                                             fullWidth size='small'>
                            <ToggleButton value='PLUS' color='success' sx={{ gap: 1, fontWeight: 600 }}>
                              <i className='ri-add-circle-line text-lg' />Penambahan
                            </ToggleButton>
                            <ToggleButton value='MINUS' color='error' sx={{ gap: 1, fontWeight: 600 }}>
                              <i className='ri-indeterminate-circle-line text-lg' />Pengurangan
                            </ToggleButton>
                          </ToggleButtonGroup>
                        )}
            />
          </div>
          <Controller name='name' control={control}
                      rules={{ required: 'Nama wajib diisi', minLength: { value: 2, message: 'Min 2 karakter' } }}
                      render={({ field }) => (
                        <TextField {...field} fullWidth label='Nama Kategori' placeholder='Contoh: Kepemimpinan'
                                   error={!!errors.name} helperText={errors.name?.message} />
                      )}
          />
          {editData && (
            <Controller name='is_active' control={control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={<Switch checked={field.value} onChange={e => field.onChange(e.target.checked)} />}
                            label='Status Aktif'
                          />
                        )}
            />
          )}
          <Box className='flex items-center gap-2 p-3 rounded-lg'
               sx={{ bgcolor: selectedType === 'PLUS' ? '#E6F9EE' : '#FFE9EA' }}>
            <i className={TYPE_CONFIG[selectedType]?.icon} style={{ fontSize: 18, color: TYPE_CONFIG[selectedType]?.color }} />
            <Typography variant='body2'>
              Nilai kategori ini bersifat <strong>{selectedType === 'PLUS' ? 'positif (+)' : 'negatif (–)'}</strong>
            </Typography>
          </Box>
          <div className='flex gap-2 mt-2'>
            <Button fullWidth variant='tonal' color='secondary'
                    onClick={() => setDrawerOpen(false)} disabled={saveLoading}>Batal</Button>
            <Button fullWidth variant='contained' type='submit' disabled={saveLoading}
                    startIcon={saveLoading ? <CircularProgress size={16} color='inherit' /> : null}>
              {saveLoading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Dialog Hapus */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth='xs' fullWidth>
        <DialogTitle>Hapus Kategori?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Hapus <strong>{deleteTarget?.name}</strong>? Kategori yang masih memiliki variabel tidak dapat dihapus.
          </DialogContentText>
        </DialogContent>
        <DialogActions className='p-4 gap-2'>
          <Button variant='tonal' color='secondary' onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>Batal</Button>
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

export default NimenCategoriesView
