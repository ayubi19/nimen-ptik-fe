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
import FormControlLabel from '@mui/material/FormControlLabel'
import FormControl from '@mui/material/FormControl'
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
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { useForm, Controller } from 'react-hook-form'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable, getSortedRowModel } from '@tanstack/react-table'
import { nimenCategoryApi } from '@/libs/api/nimenMasterDataApi'
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

const TYPE_CONFIG = {
  PLUS: { label: 'Penambahan', color: 'success', icon: 'ri-add-circle-line' },
  MINUS: { label: 'Pengurangan', color: 'error', icon: 'ri-indeterminate-circle-line' },
}

const NimenCategoriesView = () => {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [globalFilter, setGlobalFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
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

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { name: '', type: 'PLUS', is_active: true }
  })

  const selectedType = watch('type')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page: page + 1, page_size: pageSize }
      if (globalFilter) params.search = globalFilter
      if (typeFilter) params.type = typeFilter
      if (statusFilter !== '') params.is_active = statusFilter
      const res = await nimenCategoryApi.getAll(params)
      setData(res.data.data.data || [])
      setTotal(res.data.data.pagination?.total || 0)
    } catch (err) {
      showToast(err.message || 'Gagal memuat data', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, globalFilter, typeFilter, statusFilter, showToast])

  useEffect(() => { fetchData() }, [fetchData])

  const handleOpenEdit = useCallback((row) => {
    setEditData(row)
    reset({ name: row.name, type: row.type, is_active: row.is_active })
    setDrawerOpen(true)
  }, [reset])

  const handleOpenCreate = useCallback(() => {
    setEditData(null)
    reset({ name: '', type: 'PLUS', is_active: true })
    setDrawerOpen(true)
  }, [reset])

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false)
    setEditData(null)
  }, [])

  const handleSubmitForm = useCallback(async (values) => {
    setFormLoading(true)
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
      showToast(err.message || 'Terjadi kesalahan', 'error')
    } finally {
      setFormLoading(false)
    }
  }, [editData, fetchData, showToast])

  const handleDelete = useCallback(async () => {
    setDeleteLoading(true)
    try {
      await nimenCategoryApi.delete(deleteTarget.id)
      showToast('Kategori berhasil dihapus')
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
      header: 'Nama Kategori',
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <i className={`${TYPE_CONFIG[row.original.type]?.icon} text-xl text-${TYPE_CONFIG[row.original.type]?.color === 'success' ? 'success' : 'error'}-main`} />
          <Typography className='font-medium' color='text.primary'>{row.original.name}</Typography>
        </div>
      )
    }),
    columnHelper.accessor('type', {
      header: 'Tipe',
      cell: ({ row }) => {
        const cfg = TYPE_CONFIG[row.original.type]
        return <Chip label={cfg?.label || row.original.type} color={cfg?.color || 'default'} size='small' variant='tonal' />
      }
    }),
    columnHelper.accessor('is_active', {
      header: 'Status',
      cell: ({ row }) => (
        <Chip
          label={row.original.is_active ? 'Aktif' : 'Nonaktif'}
          color={row.original.is_active ? 'success' : 'secondary'}
          size='small' variant='tonal'
        />
      )
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <div className='flex items-center gap-0.5'>
          <IconButton size='small' onClick={() => handleOpenEdit(row.original)}>
            <i className='ri-edit-line text-[22px]' />
          </IconButton>
          <IconButton size='small' onClick={() => { setDeleteTarget(row.original); setDeleteOpen(true) }}>
            <i className='ri-delete-bin-7-line text-[22px]' />
          </IconButton>
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
        <CardHeader title='Kategori Nilai NIMEN' sx={{ pb: 0 }}
          action={
            <Button variant='contained' startIcon={<i className='ri-add-line' />} onClick={handleOpenCreate}>
              Tambah Kategori
            </Button>
          }
        />
        <div className='flex flex-wrap justify-between gap-4 p-6'>
          <div className='flex flex-wrap items-center gap-4'>
            <FormControl size='small' sx={{ minWidth: 160 }}>
              <InputLabel>Tipe</InputLabel>
              <Select label='Tipe' value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(0) }}>
                <MenuItem value=''>Semua</MenuItem>
                <MenuItem value='PLUS'>Penambahan</MenuItem>
                <MenuItem value='MINUS'>Pengurangan</MenuItem>
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
          <DebouncedInput
            value={globalFilter}
            onChange={val => { setGlobalFilter(val); setPage(0) }}
            placeholder='Cari kategori...'
            InputProps={{ startAdornment: <InputAdornment position='start'><i className='ri-search-line' /></InputAdornment> }}
            sx={{ minWidth: 240 }}
          />
        </div>
        <Divider />
        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>{hg.headers.map(h => <th key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</th>)}</tr>
              ))}
            </thead>
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
        <TablePagination
          component='div' count={total} page={page} rowsPerPage={pageSize}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={e => { setPageSize(parseInt(e.target.value)); setPage(0) }}
          rowsPerPageOptions={[10, 25, 50]}
          labelRowsPerPage='Baris per halaman:'
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} dari ${count}`}
        />
      </Card>

      {/* Drawer Form */}
      <Drawer open={drawerOpen} anchor='right' variant='temporary' onClose={handleCloseDrawer}
        ModalProps={{ keepMounted: true }} sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 420 } } }}>
        <div className='flex items-center justify-between pli-6 plb-5'>
          <Typography variant='h5'>{editData ? 'Edit Kategori' : 'Tambah Kategori'}</Typography>
          <IconButton onClick={handleCloseDrawer}><i className='ri-close-line text-2xl' /></IconButton>
        </div>
        <Divider />
        <div className='p-6'>
          <form onSubmit={handleSubmit(handleSubmitForm)} className='flex flex-col gap-5'>
            {/* Tipe nilai — toggle button PLUS/MINUS */}
            <div>
              <Typography variant='subtitle2' color='text.secondary' className='mb-2'>Tipe Nilai</Typography>
              <Controller name='type' control={control}
                render={({ field }) => (
                  <ToggleButtonGroup
                    exclusive
                    value={field.value}
                    onChange={(_, val) => { if (val) field.onChange(val) }}
                    fullWidth
                    size='small'
                  >
                    <ToggleButton value='PLUS' color='success'
                      sx={{ gap: 1, fontWeight: 600 }}>
                      <i className='ri-add-circle-line text-lg' />
                      Penambahan
                    </ToggleButton>
                    <ToggleButton value='MINUS' color='error'
                      sx={{ gap: 1, fontWeight: 600 }}>
                      <i className='ri-indeterminate-circle-line text-lg' />
                      Pengurangan
                    </ToggleButton>
                  </ToggleButtonGroup>
                )}
              />
            </div>

            <Controller name='name' control={control} rules={{ required: 'Nama wajib diisi', minLength: { value: 2, message: 'Min 2 karakter' } }}
              render={({ field }) => (
                <TextField {...field} fullWidth label='Nama Kategori' placeholder='Contoh: Kepemimpinan'
                  error={!!errors.name} helperText={errors.name?.message} />
              )}
            />

            {editData && (
              <Controller name='is_active' control={control}
                render={({ field }) => (
                  <FormControlLabel control={<Switch {...field} checked={field.value} />} label='Status Aktif' />
                )}
              />
            )}

            {/* Preview */}
            <div className={`flex items-center gap-2 p-3 rounded-lg border ${selectedType === 'PLUS' ? 'border-success-main bg-success-light' : 'border-error-main bg-error-light'}`}>
              <i className={`${TYPE_CONFIG[selectedType]?.icon} text-xl`} />
              <Typography variant='body2'>
                Nilai kategori ini akan bersifat <strong>{selectedType === 'PLUS' ? 'positif (+)' : 'negatif (–)'}</strong>
              </Typography>
            </div>

            <div className='flex gap-4 mt-2'>
              <Button fullWidth type='submit' variant='contained' disabled={formLoading}
                startIcon={formLoading ? <CircularProgress size={16} color='inherit' /> : null}>
                {formLoading ? 'Menyimpan...' : 'Simpan'}
              </Button>
              <Button fullWidth variant='tonal' color='secondary' onClick={handleCloseDrawer} disabled={formLoading}>
                Batal
              </Button>
            </div>
          </form>
        </div>
      </Drawer>

      {/* Dialog Hapus */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Hapus Kategori</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Hapus kategori <strong>{deleteTarget?.name}</strong>? Kategori yang masih memiliki variabel tidak dapat dihapus.
          </DialogContentText>
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

export default NimenCategoriesView
