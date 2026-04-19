'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
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
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Box from '@mui/material/Box'
import { useForm, Controller } from 'react-hook-form'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable, getSortedRowModel } from '@tanstack/react-table'
import { nimenIndicatorApi, nimenVariableApi, nimenCategoryApi } from '@/libs/api/nimenMasterDataApi'
import tableStyles from '@core/styles/table.module.css'

const columnHelper = createColumnHelper()

const DebouncedInput = ({ value: initialValue, onChange, debounce = 400, ...props }) => {
  const [value, setValue] = useState(initialValue)
  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange }, [onChange])
  useEffect(() => setValue(initialValue), [initialValue])
  useEffect(() => {
    const t = setTimeout(() => onChangeRef.current(value), debounce)
    return () => clearTimeout(t)
  }, [value, debounce])
  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} size='small' />
}

const NimenIndicatorsView = () => {
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
  const [formLoading, setFormLoading] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })
  // valueSign: 'PLUS' atau 'MINUS' untuk prefix nilai
  const [valueSign, setValueSign] = useState('PLUS')

  const showToast = useCallback((message, severity = 'success') => {
    setToast({ open: true, message, severity })
  }, [])

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: { variable_id: '', name: '', description: '', value_abs: '', cooldown_days: '', has_cooldown: false, is_active: true }
  })

  const hasCooldown = watch('has_cooldown')
  const valueAbs = watch('value_abs')

  // Computed preview nilai
  const previewValue = useMemo(() => {
    const abs = parseFloat(valueAbs)
    if (isNaN(abs) || abs <= 0) return null
    return valueSign === 'PLUS' ? abs : -abs
  }, [valueAbs, valueSign])

  useEffect(() => {
    nimenCategoryApi.getAll({ page_size: 100, is_active: true })
      .then(res => setCategories(res.data.data.data || []))
      .catch(() => {})
    nimenVariableApi.getAll({ page_size: 100, is_active: true })
      .then(res => setVariables(res.data.data.data || []))
      .catch(() => {})
  }, [])

  // Filter variabel berdasarkan kategori yang dipilih
  const filteredVariables = useMemo(() => {
    if (!categoryFilter) return variables
    return variables.filter(v => v.category_id === parseInt(categoryFilter))
  }, [variables, categoryFilter])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page: page + 1, page_size: pageSize }
      if (globalFilter) params.search = globalFilter
      if (categoryFilter) params.category_id = categoryFilter
      if (variableFilter) params.variable_id = variableFilter
      if (statusFilter !== '') params.is_active = statusFilter
      const res = await nimenIndicatorApi.getAll(params)
      setData(res.data.data.data || [])
      setTotal(res.data.data.pagination?.total || 0)
    } catch (err) {
      showToast(err.message || 'Gagal memuat data', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, globalFilter, categoryFilter, variableFilter, statusFilter, showToast])

  useEffect(() => { fetchData() }, [fetchData])

  const handleOpenEdit = useCallback((row) => {
    setEditData(row)
    const absVal = Math.abs(row.value)
    const sign = row.value >= 0 ? 'PLUS' : 'MINUS'
    setValueSign(sign)
    reset({
      variable_id: row.variable_id,
      name: row.name,
      description: row.description || '',
      value_abs: absVal.toString(),
      has_cooldown: !!row.self_submission_rule,
      cooldown_days: row.self_submission_rule?.cooldown_days?.toString() || '',
      is_active: row.is_active,
    })
    setDrawerOpen(true)
  }, [reset])

  const handleOpenCreate = useCallback(() => {
    setEditData(null)
    setValueSign('PLUS')
    reset({ variable_id: '', name: '', description: '', value_abs: '', cooldown_days: '', has_cooldown: false, is_active: true })
    setDrawerOpen(true)
  }, [reset])

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false)
    setEditData(null)
  }, [])

  const handleSubmitForm = useCallback(async (values) => {
    setFormLoading(true)
    try {
      const abs = parseFloat(values.value_abs)
      const finalValue = valueSign === 'PLUS' ? abs : -abs
      const payload = {
        variable_id: parseInt(values.variable_id),
        name: values.name,
        description: values.description || null,
        value: finalValue,
        cooldown_days: values.has_cooldown && values.cooldown_days ? parseInt(values.cooldown_days) : null,
        ...(editData && { is_active: values.is_active })
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
    } catch (err) {
      showToast(err.message || 'Terjadi kesalahan', 'error')
    } finally {
      setFormLoading(false)
    }
  }, [editData, fetchData, showToast, valueSign])

  const handleDelete = useCallback(async () => {
    setDeleteLoading(true)
    try {
      await nimenIndicatorApi.delete(deleteTarget.id)
      showToast('Indikator berhasil dihapus')
      setDeleteOpen(false)
      fetchData()
    } catch (err) {
      showToast(err.message || 'Gagal menghapus', 'error')
    } finally {
      setDeleteLoading(false)
    }
  }, [deleteTarget, fetchData, showToast])

  const columns = useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Nama Indikator',
      cell: ({ row }) => (
        <div>
          <Typography className='font-medium' color='text.primary'>{row.original.name}</Typography>
          {row.original.description && (
            <Typography variant='caption' color='text.secondary'>{row.original.description}</Typography>
          )}
        </div>
      )
    }),
    columnHelper.accessor('variable', {
      header: 'Variabel / Kategori',
      cell: ({ row }) => {
        const v = row.original.variable
        if (!v) return '-'
        return (
          <div>
            <Typography variant='body2' className='font-medium'>{v.name}</Typography>
            {v.category && (
              <Chip
                label={v.category.name}
                color={v.category.type === 'PLUS' ? 'success' : 'error'}
                size='small' variant='tonal' sx={{ mt: 0.5 }}
              />
            )}
          </div>
        )
      }
    }),
    columnHelper.accessor('value', {
      header: 'Nilai',
      cell: ({ row }) => {
        const val = row.original.value
        const isPlus = val >= 0
        return (
          <Chip
            label={isPlus ? `+${val}` : `${val}`}
            color={isPlus ? 'success' : 'error'}
            size='small'
            sx={{ fontWeight: 700, minWidth: 60 }}
          />
        )
      }
    }),
    columnHelper.accessor('self_submission_rule', {
      header: 'Pengajuan Mandiri',
      cell: ({ row }) => {
        const rule = row.original.self_submission_rule
        if (!rule) return <Chip label='Tidak' color='secondary' size='small' variant='tonal' />
        return <Chip label={`Ya • ${rule.cooldown_days} hari`} color='info' size='small' variant='tonal' />
      }
    }),
    columnHelper.accessor('is_active', {
      header: 'Status',
      cell: ({ row }) => (
        <Chip label={row.original.is_active ? 'Aktif' : 'Nonaktif'} color={row.original.is_active ? 'success' : 'secondary'} size='small' variant='tonal' />
      )
    }),
    columnHelper.display({
      id: 'actions', header: 'Aksi',
      cell: ({ row }) => (
        <div className='flex items-center gap-0.5'>
          <IconButton size='small' onClick={() => handleOpenEdit(row.original)}><i className='ri-edit-line text-[22px]' /></IconButton>
          <IconButton size='small' onClick={() => { setDeleteTarget(row.original); setDeleteOpen(true) }}><i className='ri-delete-bin-7-line text-[22px]' /></IconButton>
        </div>
      )
    })
  ], [handleOpenEdit])

  const table = useReactTable({
    data, columns, manualPagination: true, manualFiltering: true,
    rowCount: total, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel()
  })

  return (
    <>
      <Card>
        <CardHeader title='Indikator Nilai NIMEN' sx={{ pb: 0 }}
                    action={<Button variant='contained' startIcon={<i className='ri-add-line' />} onClick={handleOpenCreate}>Tambah Indikator</Button>}
        />
        <div className='flex flex-wrap justify-between gap-4 p-6'>
          <div className='flex flex-wrap items-center gap-4'>
            <FormControl size='small' sx={{ minWidth: 180 }}>
              <InputLabel>Kategori</InputLabel>
              <Select label='Kategori' value={categoryFilter} onChange={e => {
                setCategoryFilter(e.target.value)
                setVariableFilter('')
                setPage(0)
              }}>
                <MenuItem value=''>Semua</MenuItem>
                {categories.map(c => (
                  <MenuItem key={c.id} value={c.id}>
                    <div className='flex items-center gap-2'>
                      <i className={c.type === 'PLUS' ? 'ri-add-circle-line text-success-main' : 'ri-indeterminate-circle-line text-error-main'} style={{ fontSize: 14 }} />
                      {c.name}
                    </div>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size='small' sx={{ minWidth: 220 }}>
              <InputLabel>Variabel</InputLabel>
              <Select label='Variabel' value={variableFilter} onChange={e => { setVariableFilter(e.target.value); setPage(0) }}>
                <MenuItem value=''>Semua</MenuItem>
                {filteredVariables.map(v => (
                  <MenuItem key={v.id} value={v.id}>
                    <div className='flex flex-col'>
                      <Typography variant='body2' fontWeight={600}>{v.name}</Typography>
                      {v.description && (
                        <Typography variant='caption' color='text.secondary'>{v.description}</Typography>
                      )}
                    </div>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size='small' sx={{ minWidth: 140 }}>
              <InputLabel>Status</InputLabel>
              <Select label='Status' value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0) }}>
                <MenuItem value=''>Semua</MenuItem>
                <MenuItem value='true'>Aktif</MenuItem>
                <MenuItem value='false'>Nonaktif</MenuItem>
              </Select>
            </FormControl>
          </div>
          <DebouncedInput value={globalFilter} onChange={val => { setGlobalFilter(val); setPage(0) }}
                          placeholder='Cari indikator...'
                          InputProps={{ startAdornment: <InputAdornment position='start'><i className='ri-search-line' /></InputAdornment> }}
                          sx={{ minWidth: 240 }}
          />
        </div>
        <Divider />
        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>{table.getHeaderGroups().map(hg => <tr key={hg.id}>{hg.headers.map(h => <th key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</th>)}</tr>)}</thead>
            <tbody>
            {loading ? (
              <tr><td colSpan={columns.length} className='text-center py-10'><CircularProgress size={32} /></td></tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr><td colSpan={columns.length} className='text-center py-10'><Typography color='text.secondary'>Tidak ada data ditemukan</Typography></td></tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id}>{row.getVisibleCells().map(cell => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>
              ))
            )}
            </tbody>
          </table>
        </div>
        <TablePagination component='div' count={total} page={page} rowsPerPage={pageSize}
                         onPageChange={(_, p) => setPage(p)} onRowsPerPageChange={e => { setPageSize(parseInt(e.target.value)); setPage(0) }}
                         rowsPerPageOptions={[10, 25, 50]} labelRowsPerPage='Baris per halaman:'
                         labelDisplayedRows={({ from, to, count }) => `${from}–${to} dari ${count}`}
        />
      </Card>

      {/* Drawer Form */}
      <Drawer open={drawerOpen} anchor='right' variant='temporary' onClose={handleCloseDrawer}
              ModalProps={{ keepMounted: true }} sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 440 } } }}>
        <div className='flex items-center justify-between pli-6 plb-5'>
          <Typography variant='h5'>{editData ? 'Edit Indikator' : 'Tambah Indikator'}</Typography>
          <IconButton onClick={handleCloseDrawer}><i className='ri-close-line text-2xl' /></IconButton>
        </div>
        <Divider />
        <div className='p-6'>
          <form onSubmit={handleSubmit(handleSubmitForm)} className='flex flex-col gap-5'>

            {/* Pilih variabel */}
            <Controller name='variable_id' control={control} rules={{ required: 'Variabel wajib dipilih' }}
                        render={({ field }) => (
                          <FormControl fullWidth error={!!errors.variable_id}>
                            <InputLabel>Variabel</InputLabel>
                            <Select {...field} label='Variabel'>
                              {variables.map(v => (
                                <MenuItem key={v.id} value={v.id}>
                                  <div className='flex flex-col'>
                                    <div className='flex items-center gap-2'>
                                      {v.category && (
                                        <i className={v.category.type === 'PLUS' ? 'ri-add-circle-line text-success-main' : 'ri-indeterminate-circle-line text-error-main'} />
                                      )}
                                      <Typography variant='body2' fontWeight={600}>{v.name}</Typography>
                                      {v.category && <Typography variant='caption' color='text.secondary'>• {v.category.name}</Typography>}
                                    </div>
                                    {v.description && (
                                      <Typography variant='caption' color='text.secondary' sx={{ ml: 3 }}>{v.description}</Typography>
                                    )}
                                  </div>
                                </MenuItem>
                              ))}
                            </Select>
                            {errors.variable_id && <Typography variant='caption' color='error'>{errors.variable_id.message}</Typography>}
                          </FormControl>
                        )}
            />

            {/* Nama indikator */}
            <Controller name='name' control={control} rules={{ required: 'Nama wajib diisi', minLength: { value: 2, message: 'Min 2 karakter' } }}
                        render={({ field }) => (
                          <TextField {...field} fullWidth multiline rows={3} label='Nama Indikator' placeholder='Contoh: Tidak melaksanakan perintah dinas'
                                     error={!!errors.name} helperText={errors.name?.message} />
                        )}
            />

            {/* Nilai — toggle prefix + input angka */}
            <div>
              <Typography variant='subtitle2' color='text.secondary' className='mb-2'>Nilai Poin</Typography>
              <div className='flex gap-2 items-start'>
                <ToggleButtonGroup exclusive value={valueSign} onChange={(_, val) => { if (val) setValueSign(val) }} size='small' sx={{ flexShrink: 0 }}>
                  <ToggleButton value='PLUS' color='success' sx={{ px: 2, fontWeight: 700 }}>+</ToggleButton>
                  <ToggleButton value='MINUS' color='error' sx={{ px: 2, fontWeight: 700 }}>−</ToggleButton>
                </ToggleButtonGroup>
                <Controller name='value_abs' control={control}
                            rules={{
                              required: 'Nilai wajib diisi',
                              validate: v => (parseFloat(v) > 0) || 'Nilai harus lebih dari 0'
                            }}
                            render={({ field }) => (
                              <TextField {...field} fullWidth label='Angka nilai' type='number'
                                         inputProps={{ min: 0.01, step: 0.01 }}
                                         placeholder='0.30'
                                         error={!!errors.value_abs} helperText={errors.value_abs?.message}
                                         InputProps={{
                                           startAdornment: (
                                             <InputAdornment position='start'>
                                               <Typography fontWeight={700} color={valueSign === 'PLUS' ? 'success.main' : 'error.main'}>
                                                 {valueSign === 'PLUS' ? '+' : '−'}
                                               </Typography>
                                             </InputAdornment>
                                           )
                                         }}
                              />
                            )}
                />
              </div>
              {previewValue !== null && (
                <Box className='flex items-center gap-2 mt-2 p-2 rounded' sx={{ bgcolor: valueSign === 'PLUS' ? 'success.light' : 'error.light' }}>
                  <Typography variant='body2'>
                    Nilai yang tersimpan: <strong>{valueSign === 'PLUS' ? '+' : ''}{previewValue}</strong>
                  </Typography>
                </Box>
              )}
            </div>

            {/* Deskripsi */}
            <Controller name='description' control={control}
                        render={({ field }) => (
                          <TextField {...field} fullWidth multiline rows={2} label='Deskripsi (opsional)' />
                        )}
            />

            {/* Self submission rule */}
            <div className='flex flex-col gap-3 p-4 rounded-lg border border-divider'>
              <Controller name='has_cooldown' control={control}
                          render={({ field }) => (
                            <FormControlLabel
                              control={<Switch {...field} checked={field.value} />}
                              label={
                                <div>
                                  <Typography variant='body2' fontWeight={600}>Izinkan Pengajuan Mandiri</Typography>
                                  <Typography variant='caption' color='text.secondary'>Mahasiswa bisa submit dokumen sendiri tanpa sprint</Typography>
                                </div>
                              }
                            />
                          )}
              />
              {hasCooldown && (
                <Controller name='cooldown_days' control={control}
                            rules={{ required: 'Wajib diisi', min: { value: 1, message: 'Min 1 hari' } }}
                            render={({ field }) => (
                              <TextField {...field} fullWidth size='small' label='Jeda pengajuan (hari)'
                                         type='number' inputProps={{ min: 1 }} placeholder='Contoh: 90 untuk donor darah'
                                         error={!!errors.cooldown_days} helperText={errors.cooldown_days?.message}
                                         InputProps={{ endAdornment: <InputAdornment position='end'>hari</InputAdornment> }}
                              />
                            )}
                />
              )}
            </div>

            {editData && (
              <Controller name='is_active' control={control}
                          render={({ field }) => (
                            <FormControlLabel control={<Switch {...field} checked={field.value} />} label='Status Aktif' />
                          )}
              />
            )}

            <div className='flex gap-4 mt-2'>
              <Button fullWidth type='submit' variant='contained' disabled={formLoading}
                      startIcon={formLoading ? <CircularProgress size={16} color='inherit' /> : null}>
                {formLoading ? 'Menyimpan...' : 'Simpan'}
              </Button>
              <Button fullWidth variant='tonal' color='secondary' onClick={handleCloseDrawer} disabled={formLoading}>Batal</Button>
            </div>
          </form>
        </div>
      </Drawer>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Hapus Indikator</DialogTitle>
        <DialogContent>
          <DialogContentText>Hapus indikator <strong>{deleteTarget?.name}</strong>? Indikator yang sudah digunakan dalam entri nilai tidak dapat dihapus.</DialogContentText>
        </DialogContent>
        <DialogActions className='pli-5 plb-4'>
          <Button onClick={() => setDeleteOpen(false)} variant='tonal' color='secondary' disabled={deleteLoading}>Batal</Button>
          <Button onClick={handleDelete} variant='contained' color='error' disabled={deleteLoading}
                  startIcon={deleteLoading ? <CircularProgress size={16} color='inherit' /> : null}>
            {deleteLoading ? 'Menghapus...' : 'Hapus'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast(t => ({ ...t, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity={toast.severity} variant='filled' onClose={() => setToast(t => ({ ...t, open: false }))}>{toast.message}</Alert>
      </Snackbar>
    </>
  )
}

export default NimenIndicatorsView
