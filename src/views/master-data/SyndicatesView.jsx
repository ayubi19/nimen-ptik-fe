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
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import { useForm, Controller } from 'react-hook-form'
import {
  createColumnHelper, flexRender, getCoreRowModel,
  useReactTable, getSortedRowModel
} from '@tanstack/react-table'
import { syndicateApi } from '@/libs/api/masterDataApi'
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

const SyndicatesView = () => {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [globalFilter, setGlobalFilter] = useState('')
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
    defaultValues: { name: '', code: '', is_active: true }
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page: page + 1, page_size: pageSize }
      if (globalFilter) params.search = globalFilter
      if (statusFilter !== '') params.is_active = statusFilter
      const res = await syndicateApi.getAll(params)
      setData(res.data.data.data || [])
      setTotal(res.data.data.pagination?.total || 0)
    } catch (err) {
      showToast(err.message || 'Gagal memuat data', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, globalFilter, statusFilter, showToast])

  useEffect(() => { fetchData() }, [fetchData])

  const handleOpenEdit = useCallback((row) => {
    setEditData(row)
    reset({ name: row.name, code: row.code || '', is_active: row.is_active })
    setDrawerOpen(true)
  }, [reset])

  const columns = useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Nama Sindikat',
      cell: ({ row }) => <Typography className='font-medium' color='text.primary'>{row.original.name}</Typography>
    }),
    columnHelper.accessor('code', {
      header: 'Kode',
      cell: ({ row }) => row.original.code
        ? <Chip label={row.original.code} size='small' variant='tonal' color='primary' />
        : <Typography color='text.disabled' variant='body2'>—</Typography>
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

  const handleOpenCreate = useCallback(() => {
    setEditData(null)
    reset({ name: '', code: '', is_active: true })
    setDrawerOpen(true)
  }, [reset])

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false)
    setEditData(null)
  }, [])

  const handleSubmitForm = useCallback(async (values) => {
    setFormLoading(true)
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
      setEditData(null)
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
      await syndicateApi.delete(deleteTarget.id)
      showToast('Sindikat berhasil dihapus')
      setDeleteOpen(false)
      fetchData()
    } catch (err) {
      showToast(err.message || 'Gagal menghapus', 'error')
    } finally {
      setDeleteLoading(false)
    }
  }, [deleteTarget, fetchData, showToast])

  return (
    <>
      <Card>
        <CardHeader title='Sindikat' sx={{ pb: 0 }}
                    action={
                      <Button variant='contained' startIcon={<i className='ri-add-line' />} onClick={handleOpenCreate}>
                        Tambah Sindikat
                      </Button>
                    }
        />
        <div className='flex flex-wrap justify-between gap-4 p-6'>
          <div className='flex flex-wrap items-center gap-4'>
            <FormControl size='small' sx={{ minWidth: 150 }}>
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
            placeholder='Cari sindikat...'
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

      <Drawer open={drawerOpen} anchor='right' variant='temporary' onClose={handleCloseDrawer}
              ModalProps={{ keepMounted: true }} sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}>
        <div className='flex items-center justify-between pli-6 plb-5'>
          <Typography variant='h5'>{editData ? 'Edit Sindikat' : 'Tambah Sindikat'}</Typography>
          <IconButton onClick={handleCloseDrawer}><i className='ri-close-line text-2xl' /></IconButton>
        </div>
        <Divider />
        <div className='p-6'>
          <form onSubmit={handleSubmit(handleSubmitForm)} className='flex flex-col gap-5'>
            <Controller name='name' control={control}
                        rules={{ required: 'Nama sindikat wajib diisi', minLength: { value: 2, message: 'Minimal 2 karakter' } }}
                        render={({ field }) => (
                          <TextField {...field} fullWidth label='Nama Sindikat' placeholder='Contoh: Sindikat A'
                                     error={!!errors.name} helperText={errors.name?.message} />
                        )}
            />
            <Controller name='code' control={control}
                        render={({ field }) => (
                          <TextField {...field} fullWidth label='Kode (opsional)' placeholder='Contoh: SND-A' inputProps={{ maxLength: 20 }} />
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
              <Button fullWidth variant='tonal' color='secondary' onClick={handleCloseDrawer} disabled={formLoading}>
                Batal
              </Button>
            </div>
          </form>
        </div>
      </Drawer>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Hapus Sindikat</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Hapus sindikat <strong>{deleteTarget?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
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

export default SyndicatesView
