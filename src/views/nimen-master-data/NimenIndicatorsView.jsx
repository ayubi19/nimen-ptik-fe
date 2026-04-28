'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Avatar from '@mui/material/Avatar'
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
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { useForm, Controller } from 'react-hook-form'
import { nimenIndicatorApi, nimenVariableApi, nimenCategoryApi } from '@/libs/api/nimenMasterDataApi'

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

// ── Mobile Card Row ───────────────────────────────────────────────────────────
const IndicatorMobileCard = ({ row, onEdit, onDelete }) => {
  const rule = row.self_submission_rule
  const isPlus = row.value > 0

  return (
    <Card className='mb-3'>
      <CardContent>
        <div className='flex items-start justify-between mb-2'>
          <div className='flex-1 mr-2'>
            <Typography variant='body2' fontWeight={600}>{row.name}</Typography>
            <Typography variant='caption' color='text.secondary'>
              {row.variable?.category?.name} · {row.variable?.name}
            </Typography>
          </div>
          <Chip
            label={row.is_active ? 'Aktif' : 'Nonaktif'}
            size='small'
            color={row.is_active ? 'success' : 'default'}
            variant='tonal'
          />
        </div>
        <div className='flex items-center gap-2 flex-wrap mt-2'>
          <Chip
            label={isPlus ? `+${Math.abs(row.value)}` : `-${Math.abs(row.value)}`}
            size='small'
            color={isPlus ? 'success' : 'error'}
            variant='tonal'
          />
          {rule
            ? <Chip label={`Pengajuan Mandiri · ${rule.cooldown_days} hari`} size='small' color='info' variant='tonal' />
            : <Chip label='Tidak ada pengajuan mandiri' size='small' variant='tonal' />
          }
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

const NimenIndicatorsView = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [variables, setVariables] = useState([])
  const [categories, setCategories] = useState([])
  const [categoryFilter, setCategoryFilter] = useState('')
  const [globalFilter, setGlobalFilter] = useState('')
  const [variableFilter, setVariableFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editData, setEditData] = useState(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const showToast = useCallback((msg, severity = 'success') =>
    setToast({ open: true, message: msg, severity }), [])

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      variable_id: '', name: '', description: '', value_abs: '',
      cooldown_days: '', has_cooldown: false, is_active: true
    }
  })
  const hasCooldown = watch('has_cooldown')

  const [stats, setStats] = useState({ total: 0, plus: 0, minus: 0, mandiri: 0 })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page: page + 1, page_size: pageSize,
        search: globalFilter || undefined,
        variable_id: variableFilter || undefined,
        category_id: categoryFilter || undefined,
        is_active: statusFilter === '' ? undefined : statusFilter === 'aktif',
      }
      const res = await nimenIndicatorApi.getAll(params)
      setData(res.data.data?.data || [])
      setTotal(res.data.data?.pagination?.total || 0)
    } catch { showToast('Gagal memuat data', 'error') }
    finally { setLoading(false) }
  }, [page, pageSize, globalFilter, variableFilter, categoryFilter, statusFilter, showToast])

  // Fetch stats terpisah — tanpa filter, ambil semua untuk hitung summary
  const fetchStats = useCallback(async () => {
    try {
      const res = await nimenIndicatorApi.getAll({ page: 1, page_size: 100 })
      const all = res.data.data?.data || []
      const totalAll = res.data.data?.pagination?.total || 0
      setStats({
        total: totalAll,
        plus: all.filter(d => d.value > 0).length,
        minus: all.filter(d => d.value < 0).length,
        mandiri: all.filter(d => d.self_submission_rule).length,
      })
    } catch { }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { fetchStats() }, [fetchStats])

  useEffect(() => {
    nimenVariableApi.getAll({ page: 1, page_size: 100 })
      .then(r => setVariables(r.data.data?.data || []))
    nimenCategoryApi.getAll({ page: 1, page_size: 100 })
      .then(r => setCategories(r.data.data?.data || []))
  }, [])

  const handleOpenEdit = useCallback((row) => {
    setEditData(row)
    reset({
      variable_id: row.variable_id || '',
      name: row.name || '',
      description: row.description || '',
      value_abs: Math.abs(row.value)?.toString() || '',
      has_cooldown: !!row.self_submission_rule,
      cooldown_days: row.self_submission_rule?.cooldown_days?.toString() || '',
      is_active: row.is_active ?? true,
    })
    setDrawerOpen(true)
  }, [reset])

  const handleOpenCreate = useCallback(() => {
    setEditData(null)
    reset({ variable_id: '', name: '', description: '', value_abs: '', cooldown_days: '', has_cooldown: false, is_active: true })
    setDrawerOpen(true)
  }, [reset])

  const handleSave = useCallback(async (values) => {
    setSaveLoading(true)
    try {
      const selectedVar = variables.find(v => v.id === parseInt(values.variable_id))
      const isReduction = selectedVar?.name?.toLowerCase().includes('pengurangan')
      const value = isReduction ? -Math.abs(parseFloat(values.value_abs)) : Math.abs(parseFloat(values.value_abs))

      const payload = {
        variable_id: parseInt(values.variable_id),
        name: values.name,
        description: values.description,
        value,
        is_active: values.is_active,
        cooldown_days: values.has_cooldown && values.cooldown_days ? parseInt(values.cooldown_days) : null,
      }
      if (editData) {
        await nimenIndicatorApi.update(editData.id, payload)
        showToast('Indikator berhasil diperbarui')
      } else {
        await nimenIndicatorApi.create(payload)
        showToast('Indikator berhasil dibuat')
      }
      setDrawerOpen(false)
      fetchData()
      fetchStats()
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan', 'error')
    } finally { setSaveLoading(false) }
  }, [editData, variables, fetchData, showToast])

  const handleDelete = useCallback(async () => {
    setDeleteLoading(true)
    try {
      await nimenIndicatorApi.delete(deleteTarget.id)
      showToast('Indikator berhasil dihapus')
      setDeleteTarget(null)
      fetchData()
      fetchStats()
    } catch (err) {
      showToast(err.message || 'Gagal menghapus', 'error')
    } finally { setDeleteLoading(false) }
  }, [deleteTarget, fetchData, showToast])

  // Stats — total dari API, plus/minus/mandiri dari semua data halaman ini
  // Untuk akurasi penuh perlu fetch semua, tapi approximation dari current page OK

  return (
    <>
      {/* Breadcrumb */}
      <div className='flex items-center gap-2 mb-6'>
        <Typography variant='caption' color='text.secondary'>Master Data NIMEN</Typography>
        <i className='ri-arrow-right-s-line text-sm opacity-50' />
        <Typography variant='caption' fontWeight={500} color='text.primary'>Indikator Nilai NIMEN</Typography>
      </div>

      {/* Header */}
      <div className='flex items-center justify-between mb-6 flex-wrap gap-3'>
        <div />
        <Button variant='contained' startIcon={<i className='ri-add-line' />}
                onClick={handleOpenCreate}
                sx={{ width: { xs: '100%', sm: 'auto' } }}>
          Tambah Indikator
        </Button>
      </div>

      {/* Stats */}
      <Grid container spacing={4} className='mb-6'>
        {[
          { label: 'Total Indikator', value: stats.total, icon: 'ri-list-check-line', color: '#FF4C51', bg: '#FFE9EA' },
          { label: 'Penambahan Nilai', value: stats.plus, icon: 'ri-arrow-up-circle-line', color: '#28C76F', bg: '#E6F9EE' },
          { label: 'Pengurangan Nilai', value: stats.minus, icon: 'ri-arrow-down-circle-line', color: '#EA5455', bg: '#FFEDED' },
          { label: 'Pengajuan Mandiri', value: stats.mandiri, icon: 'ri-hand-coin-line', color: '#00CFE8', bg: '#E0F9FC' },
        ].map(s => (
          <Grid item xs={6} sm={3} key={s.label}>
            <Card sx={{ height: '100%' }}>
              <CardContent className='flex items-center gap-3'>
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
              <DebouncedInput fullWidth value={globalFilter} onChange={v => { setGlobalFilter(v); setPage(0) }}
                              placeholder='Cari indikator...'
                              InputProps={{ startAdornment: <InputAdornment position='start'><i className='ri-search-line' /></InputAdornment> }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size='small'>
                <InputLabel>Kategori</InputLabel>
                <Select label='Kategori' value={categoryFilter}
                        onChange={e => { setCategoryFilter(e.target.value); setPage(0) }}>
                  <MenuItem value=''>Semua Kategori</MenuItem>
                  {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size='small'>
                <InputLabel>Variabel</InputLabel>
                <Select label='Variabel' value={variableFilter}
                        onChange={e => { setVariableFilter(e.target.value); setPage(0) }}>
                  <MenuItem value=''>Semua Variabel</MenuItem>
                  {variables.map(v => <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size='small'>
                <InputLabel>Status</InputLabel>
                <Select label='Status' value={statusFilter}
                        onChange={e => { setStatusFilter(e.target.value); setPage(0) }}>
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
        // Mobile — Card List
        <div>
          {data.length === 0 ? (
            <Card>
              <CardContent className='text-center py-10'>
                <i className='ri-inbox-line text-5xl opacity-30 block mb-2' />
                <Typography variant='body2' color='text.secondary'>Tidak ada indikator ditemukan</Typography>
              </CardContent>
            </Card>
          ) : data.map(row => (
            <IndicatorMobileCard key={row.id} row={row}
                                 onEdit={handleOpenEdit} onDelete={setDeleteTarget} />
          ))}
          <TablePagination
            component='div' count={total} page={page}
            rowsPerPage={pageSize} rowsPerPageOptions={[10, 25, 50]}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={e => { setPageSize(parseInt(e.target.value)); setPage(0) }}
            labelRowsPerPage='Baris:'
          />
        </div>
      ) : (
        // Desktop — Table
        <Card>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  Nama Indikator
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  Variabel / Kategori
                </TableCell>
                <TableCell align='center' sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  Nilai
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  Pengajuan Mandiri
                </TableCell>
                <TableCell align='center' sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  Status
                </TableCell>
                <TableCell align='center' sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  Aksi
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align='center' sx={{ py: 8 }}>
                    <i className='ri-inbox-line text-5xl opacity-30 block mb-2' />
                    <Typography variant='body2' color='text.secondary'>Tidak ada indikator ditemukan</Typography>
                  </TableCell>
                </TableRow>
              ) : data.map(row => {
                const rule = row.self_submission_rule
                const isPlus = row.value > 0
                return (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography variant='body2' fontWeight={500}>{row.name}</Typography>
                      {row.description && (
                        <Typography variant='caption' color='text.secondary'
                                    sx={{ display: 'block', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>{row.variable?.name}</Typography>
                      <Typography variant='caption' color='text.secondary'>{row.variable?.category?.name}</Typography>
                    </TableCell>
                    <TableCell align='center'>
                      <Chip
                        label={isPlus ? `+${Math.abs(row.value)}` : `-${Math.abs(row.value)}`}
                        size='small'
                        color={isPlus ? 'success' : 'error'}
                        variant='tonal'
                        sx={{ fontWeight: 700, minWidth: 56 }}
                      />
                    </TableCell>
                    <TableCell>
                      {rule
                        ? <Chip label={`Ya · ${rule.cooldown_days} hari`} size='small' color='info' variant='tonal' />
                        : <Chip label='Tidak' size='small' variant='tonal' />
                      }
                    </TableCell>
                    <TableCell align='center'>
                      <Chip
                        label={row.is_active ? 'Aktif' : 'Nonaktif'}
                        size='small'
                        color={row.is_active ? 'success' : 'default'}
                        variant='tonal'
                      />
                    </TableCell>
                    <TableCell align='center'>
                      <div className='flex items-center justify-center gap-1'>
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
          <Typography variant='h6'>{editData ? 'Edit Indikator' : 'Tambah Indikator'}</Typography>
          <IconButton onClick={() => setDrawerOpen(false)}><i className='ri-close-line' /></IconButton>
        </div>
        <form onSubmit={handleSubmit(handleSave)} className='flex flex-col gap-4 p-4 overflow-y-auto'>
          <Controller name='variable_id' control={control}
                      rules={{ required: 'Variabel wajib dipilih' }}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.variable_id}>
                          <InputLabel>Variabel</InputLabel>
                          <Select {...field} label='Variabel'>
                            {variables.map(v => <MenuItem key={v.id} value={v.id}>{v.name} — {v.category?.name}</MenuItem>)}
                          </Select>
                        </FormControl>
                      )}
          />
          <Controller name='name' control={control}
                      rules={{ required: 'Nama wajib diisi' }}
                      render={({ field }) => (
                        <TextField {...field} fullWidth label='Nama Indikator' multiline rows={2}
                                   error={!!errors.name} helperText={errors.name?.message} />
                      )}
          />
          <Controller name='description' control={control}
                      render={({ field }) => (
                        <TextField {...field} fullWidth label='Deskripsi (opsional)' multiline rows={2} />
                      )}
          />
          <Controller name='value_abs' control={control}
                      rules={{ required: 'Nilai wajib diisi', min: { value: 0, message: 'Min 0' } }}
                      render={({ field }) => (
                        <TextField {...field} fullWidth label='Nilai (angka positif)' type='number'
                                   inputProps={{ step: '0.01', min: 0 }}
                                   helperText={errors.value_abs?.message || 'Tanda + atau − ditentukan dari variabel'}
                                   error={!!errors.value_abs} />
                      )}
          />

          <Divider />

          <Controller name='has_cooldown' control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={<Switch checked={field.value} onChange={e => { field.onChange(e.target.checked); if (!e.target.checked) setValue('cooldown_days', '') }} />}
                          label='Bisa diajukan mandiri oleh mahasiswa'
                        />
                      )}
          />
          {hasCooldown && (
            <Controller name='cooldown_days' control={control}
                        rules={{ required: 'Cooldown wajib diisi', min: { value: 1, message: 'Min 1 hari' } }}
                        render={({ field }) => (
                          <TextField {...field} fullWidth label='Cooldown (hari)' type='number'
                                     inputProps={{ min: 1 }}
                                     helperText={errors.cooldown_days?.message || 'Jeda hari sebelum bisa diajukan lagi'}
                                     error={!!errors.cooldown_days} />
                        )}
            />
          )}

          {editData && (
            <>
              <Divider />
              <Controller name='is_active' control={control}
                          render={({ field }) => (
                            <FormControlLabel
                              control={<Switch checked={field.value} onChange={e => field.onChange(e.target.checked)} />}
                              label='Indikator Aktif'
                            />
                          )}
              />
            </>
          )}

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
        <DialogTitle>Hapus Indikator?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Hapus indikator <strong>{deleteTarget?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
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

      {/* Toast */}
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

export default NimenIndicatorsView
