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
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Switch from '@mui/material/Switch'
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import { useForm, Controller } from 'react-hook-form'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable, getSortedRowModel } from '@tanstack/react-table'
import { nimenVariableApi, nimenCategoryApi } from '@/libs/api/nimenMasterDataApi'
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

const NimenVariablesView = () => {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
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

  const showToast = useCallback((message, severity = 'success') => {
    setToast({ open: true, message, severity })
  }, [])

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { category_id: '', name: '', description: '', is_active: true }
  })

  // Load kategori untuk dropdown
  useEffect(() => {
    nimenCategoryApi.getAll({ page_size: 100, is_active: true })
      .then(res => setCategories(res.data.data.data || []))
      .catch(() => {})
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page: page + 1, page_size: pageSize }
      if (globalFilter) params.search = globalFilter
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

  const handleOpenCreate = useCallback(() => {
    setEditData(null)
    reset({ category_id: '', name: '', description: '', is_active: true })
    setDrawerOpen(true)
  }, [reset])

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false)
    setEditData(null)
  }, [])

  const handleSubmitForm = useCallback(async (values) => {
    setFormLoading(true)
    try {
      const payload = {
        category_id: parseInt(values.category_id),
        name: values.name,
        description: values.description || null,
        ...(editData && { is_active: values.is_active })
      }
      console.log('PAYLOAD:', JSON.stringify(payload))
      console.log('EDIT ID:', editData?.id)
      if (editData) {
        await nimenVariableApi.update(editData.id, payload)
        showToast('Variabel berhasil diperbarui')
      } else {
        await nimenVariableApi.create(payload)
        showToast('Variabel berhasil dibuat')
      }
      setDrawerOpen(false)
      fetchData()
    } catch (err) {
      showToast(err.message || 'Terjadi kesalahan', 'error')
    } finally {
      setFormLoading(false)
    }
  }, [editData, fetchData, showToast])

  const handleDelete = useCallback(async () => {
    setDeleteLoading(true)
    try {
      await nimenVariableApi.delete(deleteTarget.id)
      showToast('Variabel berhasil dihapus')
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
      header: 'Nama Variabel',
      cell: ({ row }) => <Typography className='font-medium' color='text.primary'>{row.original.name}</Typography>
    }),
    columnHelper.accessor('category', {
      header: 'Kategori',
      cell: ({ row }) => {
        const cat = row.original.category
        if (!cat) return '-'
        return (
          <Chip
            label={cat.name}
            color={cat.type === 'PLUS' ? 'success' : 'error'}
            size='small' variant='tonal'
            icon={<i className={cat.type === 'PLUS' ? 'ri-add-circle-line' : 'ri-indeterminate-circle-line'} />}
          />
        )
      }
    }),
    columnHelper.accessor('description', {
      header: 'Deskripsi',
      cell: ({ row }) => (
        <Typography variant='body2' color='text.secondary' sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {row.original.description || '-'}
        </Typography>
      )
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
        <CardHeader title='Variabel Nilai NIMEN' sx={{ pb: 0 }}
                    action={<Button variant='contained' startIcon={<i className='ri-add-line' />} onClick={handleOpenCreate}>Tambah Variabel</Button>}
        />
        <div className='flex flex-wrap justify-between gap-4 p-6'>
          <div className='flex flex-wrap items-center gap-4'>
            <FormControl size='small' sx={{ minWidth: 180 }}>
              <InputLabel>Kategori</InputLabel>
              <Select label='Kategori' value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(0) }}>
                <MenuItem value=''>Semua</MenuItem>
                {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
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
                          placeholder='Cari variabel...'
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

      <Drawer open={drawerOpen} anchor='right' variant='temporary' onClose={handleCloseDrawer}
              ModalProps={{ keepMounted: true }} sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 420 } } }}>
        <div className='flex items-center justify-between pli-6 plb-5'>
          <Typography variant='h5'>{editData ? 'Edit Variabel' : 'Tambah Variabel'}</Typography>
          <IconButton onClick={handleCloseDrawer}><i className='ri-close-line text-2xl' /></IconButton>
        </div>
        <Divider />
        <div className='p-6'>
          <form onSubmit={handleSubmit(handleSubmitForm)} className='flex flex-col gap-5'>
            <Controller name='category_id' control={control} rules={{ required: 'Kategori wajib dipilih' }}
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
                            {errors.category_id && <Typography variant='caption' color='error'>{errors.category_id.message}</Typography>}
                          </FormControl>
                        )}
            />
            <Controller name='name' control={control} rules={{ required: 'Nama wajib diisi', minLength: { value: 2, message: 'Min 2 karakter' } }}
                        render={({ field }) => (
                          <TextField {...field} fullWidth label='Nama Variabel' placeholder='Contoh: Kepemimpinan'
                                     error={!!errors.name} helperText={errors.name?.message} />
                        )}
            />
            <Controller name='description' control={control}
                        render={({ field }) => (
                          <TextField {...field} fullWidth multiline rows={3} label='Deskripsi (opsional)' placeholder='Deskripsi singkat variabel ini...' />
                        )}
            />
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
        <DialogTitle>Hapus Variabel</DialogTitle>
        <DialogContent>
          <DialogContentText>Hapus variabel <strong>{deleteTarget?.name}</strong>? Variabel yang masih memiliki indikator tidak dapat dihapus.</DialogContentText>
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

export default NimenVariablesView
