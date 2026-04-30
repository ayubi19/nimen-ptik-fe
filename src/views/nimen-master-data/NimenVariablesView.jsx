'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputLabel from '@mui/material/InputLabel'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Switch from '@mui/material/Switch'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import Box from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { useForm, Controller } from 'react-hook-form'
import { nimenVariableApi, nimenCategoryApi } from '@/libs/api/nimenMasterDataApi'

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

// ── Mobile Card ───────────────────────────────────────────────────────────────
const VariableMobileCard = ({ row, onEdit, onDelete }) => {
  const cat = row.category
  const isPlus = cat?.type === 'PLUS'

  return (
    <Card className='mb-3'>
      <CardContent>
        <div className='flex items-start justify-between mb-2'>
          <div className='flex-1 mr-2'>
            <Typography variant='body2' fontWeight={600}>{row.name}</Typography>
            {row.description && (
              <Typography variant='caption' color='text.secondary'>{row.description}</Typography>
            )}
          </div>
          <Chip
            label={row.is_active ? 'Aktif' : 'Nonaktif'}
            size='small'
            color={row.is_active ? 'success' : 'default'}
            variant='tonal'
          />
        </div>
        <div className='flex items-center gap-2 flex-wrap mt-2'>
          {cat && (
            <Chip
              label={cat.name}
              size='small'
              color={isPlus ? 'success' : 'error'}
              variant='tonal'
              icon={<i className={isPlus ? 'ri-add-circle-line' : 'ri-indeterminate-circle-line'} />}
            />
          )}
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

// ── Main View ─────────────────────────────────────────────────────────────────
const NimenVariablesView = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [data, setData]             = useState([])
  const [total, setTotal]           = useState(0)
  const [loading, setLoading]       = useState(false)
  const [categories, setCategories] = useState([])
  const [globalFilter, setGlobalFilter]   = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter]   = useState('')
  const [page, setPage]             = useState(0)
  const [pageSize, setPageSize]     = useState(10)
  const [stats, setStats]           = useState({ total: 0, plus: 0, minus: 0 })

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editData, setEditData]     = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const showToast = useCallback((msg, severity = 'success') =>
    setToast({ open: true, message: msg, severity }), [])

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { category_id: '', name: '', description: '', is_active: true }
  })

  // Load kategori untuk dropdown & filter
  useEffect(() => {
    nimenCategoryApi.getAll({ page_size: 100, is_active: true })
      .then(res => setCategories(res.data.data.data || []))
      .catch(() => {})
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const res = await nimenVariableApi.getAll({ page: 1, page_size: 100 })
      const all = res.data.data?.data || []
      const totalAll = res.data.data?.pagination?.total || 0
      setStats({
        total: totalAll,
        plus:  all.filter(v => v.category?.type === 'PLUS').length,
        minus: all.filter(v => v.category?.type === 'MINUS').length,
      })
    } catch {}
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page: page + 1, page_size: pageSize }
      if (globalFilter)  params.search      = globalFilter
      if (categoryFilter) params.category_id = categoryFilter
      if (statusFilter !== '') params.is_active = statusFilter
      const res = await nimenVariableApi.getAll(params)
      setData(res.data.data.data || [])
      setTotal(res.data.data.pagination?.total || 0)
    } catch (err) {
      showToast(err.message || 'Gagal memuat data', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, globalFilter, categoryFilter, statusFilter, showToast])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { fetchStats() }, [fetchStats])

  const handleOpenCreate = useCallback(() => {
    setEditData(null)
    reset({ category_id: '', name: '', description: '', is_active: true })
    setDrawerOpen(true)
  }, [reset])

  const handleOpenEdit = useCallback((row) => {
    setEditData(row)
    reset({
      category_id: row.category_id,
      name: row.name,
      description: row.description || '',
      is_active: row.is_active,
    })
    setDrawerOpen(true)
  }, [reset])

  const handleSubmitForm = useCallback(async (values) => {
    setFormLoading(true)
    try {
      const payload = {
        category_id: parseInt(values.category_id),
        name: values.name,
        description: values.description || null,
        ...(editData && { is_active: values.is_active })
      }
      if (editData) {
        await nimenVariableApi.update(editData.id, payload)
        showToast('Variabel berhasil diperbarui')
      } else {
        await nimenVariableApi.create(payload)
        showToast('Variabel berhasil dibuat')
      }
      setDrawerOpen(false)
      fetchData()
      fetchStats()
    } catch (err) {
      showToast(err.message || 'Terjadi kesalahan', 'error')
    } finally {
      setFormLoading(false)
    }
  }, [editData, fetchData, fetchStats, showToast])

  const handleDelete = useCallback(async () => {
    setDeleteLoading(true)
    try {
      await nimenVariableApi.delete(deleteTarget.id)
      showToast('Variabel berhasil dihapus')
      setDeleteTarget(null)
      fetchData()
      fetchStats()
    } catch (err) {
      showToast(err.message || 'Gagal menghapus', 'error')
    } finally {
      setDeleteLoading(false)
    }
  }, [deleteTarget, fetchData, fetchStats, showToast])

  return (
    <>
      {/* Breadcrumb */}
      <div className='flex items-center gap-2 mb-6'>
        <Typography variant='caption' color='text.secondary'>Master Data NIMEN</Typography>
        <i className='ri-arrow-right-s-line text-sm opacity-50' />
        <Typography variant='caption' fontWeight={500} color='text.primary'>Variabel Nilai NIMEN</Typography>
      </div>

      {/* Header */}
      <div className='flex items-center justify-between mb-6 flex-wrap gap-3'>
        <div />
        <Button variant='contained' startIcon={<i className='ri-add-line' />}
                onClick={handleOpenCreate}
                sx={{ width: { xs: '100%', sm: 'auto' } }}>
          Tambah Variabel
        </Button>
      </div>

      {/* Stats */}
      <Grid container spacing={4} className='mb-6'>
        {[
          { label: 'Total Variabel',   value: stats.total, icon: 'ri-node-tree',                color: '#FF4C51', bg: '#FFE9EA' },
          { label: 'Penambahan Nilai', value: stats.plus,  icon: 'ri-arrow-up-circle-line',    color: '#28C76F', bg: '#E6F9EE' },
          { label: 'Pengurangan Nilai',value: stats.minus, icon: 'ri-arrow-down-circle-line',  color: '#EA5455', bg: '#FFEDED' },
        ].map(s => (
          <Grid item xs={12} sm={4} key={s.label}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: '16px !important', display: 'flex', alignItems: 'center', gap: '12px' }}>
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
              <DebouncedInput fullWidth value={globalFilter}
                              onChange={v => { setGlobalFilter(v); setPage(0) }}
                              placeholder='Cari variabel...'
                              InputProps={{ startAdornment: <InputAdornment position='start'><i className='ri-search-line' /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size='small'>
                <InputLabel>Kategori</InputLabel>
                <Select label='Kategori' value={categoryFilter}
                        onChange={e => { setCategoryFilter(e.target.value); setPage(0) }}>
                  <MenuItem value=''>Semua Kategori</MenuItem>
                  {categories.map(c => (
                    <MenuItem key={c.id} value={c.id}>
                      <div className='flex items-center gap-2'>
                        <i className={c.type === 'PLUS' ? 'ri-add-circle-line text-success-main' : 'ri-indeterminate-circle-line text-error-main'} />
                        {c.name}
                      </div>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size='small'>
                <InputLabel>Status</InputLabel>
                <Select label='Status' value={statusFilter}
                        onChange={e => { setStatusFilter(e.target.value); setPage(0) }}>
                  <MenuItem value=''>Semua Status</MenuItem>
                  <MenuItem value='true'>Aktif</MenuItem>
                  <MenuItem value='false'>Nonaktif</MenuItem>
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
          {data.length === 0 ? (
            <Card>
              <CardContent className='text-center py-10'>
                <i className='ri-node-tree text-5xl opacity-30 block mb-2' />
                <Typography variant='body2' color='text.secondary'>Tidak ada variabel ditemukan</Typography>
              </CardContent>
            </Card>
          ) : data.map(row => (
            <VariableMobileCard key={row.id} row={row}
                                onEdit={handleOpenEdit} onDelete={setDeleteTarget} />
          ))}
          <TablePagination
            component='div' count={total} page={page}
            rowsPerPage={pageSize} rowsPerPageOptions={[10, 25, 50]}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={e => { setPageSize(parseInt(e.target.value)); setPage(0) }}
            labelRowsPerPage='Baris:'
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} dari ${count}`}
          />
        </div>
      ) : (
        // ── Desktop: Table ──
        <Card>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                {['Nama Variabel', 'Kategori', 'Deskripsi', 'Status', 'Aksi'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align='center' sx={{ py: 8 }}>
                    <i className='ri-node-tree text-5xl opacity-30 block mb-2' />
                    <Typography variant='body2' color='text.secondary'>Tidak ada variabel ditemukan</Typography>
                  </TableCell>
                </TableRow>
              ) : data.map(row => {
                const cat = row.category
                const isPlus = cat?.type === 'PLUS'
                return (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography variant='body2' fontWeight={600}>{row.name}</Typography>
                    </TableCell>
                    <TableCell>
                      {cat ? (
                        <Chip
                          label={cat.name}
                          size='small'
                          color={isPlus ? 'success' : 'error'}
                          variant='tonal'
                          icon={<i className={isPlus ? 'ri-add-circle-line' : 'ri-indeterminate-circle-line'} />}
                        />
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' color='text.secondary'
                                  sx={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.description || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.is_active ? 'Aktif' : 'Nonaktif'}
                        size='small'
                        color={row.is_active ? 'success' : 'default'}
                        variant='tonal'
                      />
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-1'>
                        <IconButton size='small' onClick={() => handleOpenEdit(row)}>
                          <i className='ri-edit-line text-[18px]' />
                        </IconButton>
                        <IconButton size='small' color='error' onClick={() => setDeleteTarget(row)}>
                          <i className='ri-delete-bin-line text-[18px]' />
                        </IconButton>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <TablePagination
            component='div' count={total} page={page}
            rowsPerPage={pageSize} rowsPerPageOptions={[10, 25, 50]}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={e => { setPageSize(parseInt(e.target.value)); setPage(0) }}
            labelRowsPerPage='Baris per halaman:'
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} dari ${count}`}
          />
        </Card>
      )}

      {/* Drawer Form */}
      <Drawer anchor='right' open={drawerOpen} onClose={() => setDrawerOpen(false)}
              PaperProps={{ sx: { width: { xs: '100%', sm: 420 } } }}>
        <div className='flex items-center justify-between p-4 border-b'>
          <Typography variant='h6'>{editData ? 'Edit Variabel' : 'Tambah Variabel'}</Typography>
          <IconButton onClick={() => setDrawerOpen(false)}><i className='ri-close-line' /></IconButton>
        </div>
        <form onSubmit={handleSubmit(handleSubmitForm)} className='flex flex-col gap-4 p-4 overflow-y-auto'>
          <Controller name='category_id' control={control}
                      rules={{ required: 'Kategori wajib dipilih' }}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.category_id}>
                          <InputLabel>Kategori</InputLabel>
                          <Select {...field} label='Kategori'>
                            {categories.map(c => (
                              <MenuItem key={c.id} value={c.id}>
                                <div className='flex items-center gap-2'>
                                  <i className={c.type === 'PLUS' ? 'ri-add-circle-line text-success-main' : 'ri-indeterminate-circle-line text-error-main'} />
                                  {c.name}
                                </div>
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.category_id && (
                            <Typography variant='caption' color='error'>{errors.category_id.message}</Typography>
                          )}
                        </FormControl>
                      )}
          />
          <Controller name='name' control={control}
                      rules={{ required: 'Nama wajib diisi', minLength: { value: 2, message: 'Min 2 karakter' } }}
                      render={({ field }) => (
                        <TextField {...field} fullWidth label='Nama Variabel' placeholder='Contoh: Kepemimpinan'
                                   error={!!errors.name} helperText={errors.name?.message} />
                      )}
          />
          <Controller name='description' control={control}
                      render={({ field }) => (
                        <TextField {...field} fullWidth multiline rows={3} label='Deskripsi (opsional)'
                                   placeholder='Deskripsi singkat variabel ini...' />
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
          <div className='flex gap-2 mt-2'>
            <Button fullWidth variant='tonal' color='secondary'
                    onClick={() => setDrawerOpen(false)} disabled={formLoading}>Batal</Button>
            <Button fullWidth variant='contained' type='submit' disabled={formLoading}
                    startIcon={formLoading ? <CircularProgress size={16} color='inherit' /> : null}>
              {formLoading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Dialog Hapus */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth='xs' fullWidth>
        <DialogTitle>Hapus Variabel?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Hapus variabel <strong>{deleteTarget?.name}</strong>? Variabel yang masih memiliki indikator tidak dapat dihapus.
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

export default NimenVariablesView
