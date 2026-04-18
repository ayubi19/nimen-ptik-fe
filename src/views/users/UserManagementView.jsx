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
import Tooltip from '@mui/material/Tooltip'
import { useForm, Controller } from 'react-hook-form'
import {
  createColumnHelper, flexRender, getCoreRowModel,
  useReactTable, getSortedRowModel
} from '@tanstack/react-table'
import CustomAvatar from '@core/components/mui/Avatar'
import { getInitials } from '@/utils/getInitials'
import { userManagementApi } from '@/libs/api/userManagementApi'
import tableStyles from '@core/styles/table.module.css'

const columnHelper = createColumnHelper()

// Role yang tersedia untuk dibuat via user management
// (student & student_pic hanya via onboarding Telegram)
const AVAILABLE_ROLES = [
  { value: 'admin_nimen', label: 'Admin NIMEN' },
  { value: 'admin_initiative', label: 'Admin Inisiatif' },
  { value: 'viewer', label: 'Viewer' },
]

const ROLE_COLORS = {
  admin_nimen: 'primary',
  admin_initiative: 'warning',
  student: 'success',
  student_pic: 'info',
  viewer: 'secondary',
}

const ROLE_LABELS = {
  admin_nimen: 'Admin NIMEN',
  admin_initiative: 'Admin Inisiatif',
  student: 'Mahasiswa',
  student_pic: 'Mahasiswa PIC',
  viewer: 'Viewer',
}

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

const UserManagementView = () => {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [globalFilter, setGlobalFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  // Drawer form (create & edit)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editData, setEditData] = useState(null) // null = create mode
  const [formLoading, setFormLoading] = useState(false)

  // Toggle active dialog
  const [toggleOpen, setToggleOpen] = useState(false)
  const [toggleTarget, setToggleTarget] = useState(null)
  const [toggleLoading, setToggleLoading] = useState(false)

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Toast
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })
  const showToast = useCallback((message, severity = 'success') => {
    setToast({ open: true, message, severity })
  }, [])

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { username: '', full_name: '', email: '', role: '' }
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page: page + 1, page_size: pageSize }
      if (globalFilter) params.search = globalFilter
      if (roleFilter) params.role = roleFilter
      if (statusFilter !== '') params.is_active = statusFilter
      const res = await userManagementApi.getAll(params)
      setData(res.data.data.data || [])
      setTotal(res.data.data.pagination?.total || 0)
    } catch (err) {
      showToast(err.message || 'Gagal memuat data', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, globalFilter, roleFilter, statusFilter, showToast])

  useEffect(() => { fetchData() }, [fetchData])

  const handleOpenCreate = useCallback(() => {
    setEditData(null)
    reset({ username: '', full_name: '', email: '', role: '' })
    setDrawerOpen(true)
  }, [reset])

  const handleOpenEdit = useCallback((row) => {
    setEditData(row)
    reset({
      username: row.username,
      full_name: row.full_name,
      email: row.email || '',
      role: row.roles?.[0] || '',
    })
    setDrawerOpen(true)
  }, [reset])

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false)
    setEditData(null)
  }, [])

  const handleSubmitForm = useCallback(async (values) => {
    setFormLoading(true)
    try {
      if (editData) {
        await userManagementApi.update(editData.id, {
          full_name: values.full_name,
          email: values.email || null,
          role: values.role,
        })
        showToast('User berhasil diperbarui')
      } else {
        await userManagementApi.create({
          username: values.username,
          full_name: values.full_name,
          email: values.email || null,
          role: values.role,
        })
        showToast('User berhasil dibuat. Password default: Nimen@2025')
      }
      handleCloseDrawer()
      fetchData()
    } catch (err) {
      showToast(err.message || 'Terjadi kesalahan', 'error')
    } finally {
      setFormLoading(false)
    }
  }, [editData, fetchData, handleCloseDrawer, showToast])

  const handleToggleActive = useCallback(async () => {
    setToggleLoading(true)
    try {
      await userManagementApi.toggleActive(toggleTarget.id)
      showToast(`Akun ${toggleTarget.full_name} berhasil ${toggleTarget.is_active ? 'dinonaktifkan' : 'diaktifkan'}`)
      setToggleOpen(false)
      fetchData()
    } catch (err) {
      showToast(err.message || 'Gagal mengubah status', 'error')
    } finally {
      setToggleLoading(false)
    }
  }, [toggleTarget, fetchData, showToast])

  const handleDelete = useCallback(async () => {
    setDeleteLoading(true)
    try {
      await userManagementApi.delete(deleteTarget.id)
      showToast('User berhasil dihapus')
      setDeleteOpen(false)
      fetchData()
    } catch (err) {
      showToast(err.message || 'Gagal menghapus user', 'error')
    } finally {
      setDeleteLoading(false)
    }
  }, [deleteTarget, fetchData, showToast])

  const columns = useMemo(() => [
    columnHelper.accessor('full_name', {
      header: 'User',
      cell: ({ row }) => (
        <div className='flex items-center gap-3'>
          <CustomAvatar skin='light' color='primary' size={34}>
            {getInitials(row.original.full_name)}
          </CustomAvatar>
          <div className='flex flex-col'>
            <Typography color='text.primary' className='font-medium'>{row.original.full_name}</Typography>
            <Typography variant='body2' color='text.secondary'>{row.original.username}</Typography>
          </div>
        </div>
      )
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: ({ row }) => (
        <Typography variant='body2' color={row.original.email ? 'text.primary' : 'text.disabled'}>
          {row.original.email || '—'}
        </Typography>
      )
    }),
    columnHelper.accessor('roles', {
      header: 'Role',
      cell: ({ row }) => {
        const role = row.original.roles?.[0]
        return role
          ? <Chip label={ROLE_LABELS[role] || role} color={ROLE_COLORS[role] || 'default'} size='small' variant='tonal' />
          : <Typography color='text.disabled' variant='body2'>—</Typography>
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
    columnHelper.accessor('created_at', {
      header: 'Dibuat',
      cell: ({ row }) => (
        <Typography variant='body2' color='text.secondary'>
          {row.original.created_at ? new Date(row.original.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
        </Typography>
      )
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <div className='flex items-center gap-0.5'>
          <Tooltip title='Edit'>
            <IconButton size='small' onClick={() => handleOpenEdit(row.original)}>
              <i className='ri-edit-line text-[22px]' />
            </IconButton>
          </Tooltip>
          <Tooltip title={row.original.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
            <IconButton
              size='small'
              color={row.original.is_active ? 'error' : 'success'}
              onClick={() => { setToggleTarget(row.original); setToggleOpen(true) }}
            >
              <i className={`ri-${row.original.is_active ? 'forbid' : 'checkbox-circle'}-line text-[22px]`} />
            </IconButton>
          </Tooltip>
          <Tooltip title='Hapus'>
            <IconButton size='small' color='error' onClick={() => { setDeleteTarget(row.original); setDeleteOpen(true) }}>
              <i className='ri-delete-bin-7-line text-[22px]' />
            </IconButton>
          </Tooltip>
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
        <CardHeader
          title='Manajemen User'
          sx={{ pb: 0 }}
          action={
            <Button variant='contained' startIcon={<i className='ri-add-line' />} onClick={handleOpenCreate}>
              Tambah User
            </Button>
          }
        />
        <div className='flex flex-wrap justify-between gap-4 p-6'>
          <div className='flex flex-wrap items-center gap-4'>
            <FormControl size='small' sx={{ minWidth: 160 }}>
              <InputLabel>Role</InputLabel>
              <Select label='Role' value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(0) }}>
                <MenuItem value=''>Semua Role</MenuItem>
                {AVAILABLE_ROLES.map(r => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
                <MenuItem value='student'>Mahasiswa</MenuItem>
                <MenuItem value='student_pic'>Mahasiswa PIC</MenuItem>
              </Select>
            </FormControl>
            <FormControl size='small' sx={{ minWidth: 130 }}>
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
            placeholder='Cari nama, username...'
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
              <tr><td colSpan={columns.length} className='text-center py-10'><Typography color='text.secondary'>Tidak ada data user</Typography></td></tr>
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

      {/* ── Form Drawer (Create & Edit) ── */}
      <Drawer open={drawerOpen} anchor='right' variant='temporary' onClose={handleCloseDrawer}
              ModalProps={{ keepMounted: true }} sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 420 } } }}>
        <div className='flex items-center justify-between pli-6 plb-5'>
          <div>
            <Typography variant='h5'>{editData ? 'Edit User' : 'Tambah User'}</Typography>
            {editData && <Typography variant='body2' color='text.secondary'>{editData.username}</Typography>}
          </div>
          <IconButton onClick={handleCloseDrawer}><i className='ri-close-line text-2xl' /></IconButton>
        </div>
        <Divider />
        <div className='p-6'>
          <form onSubmit={handleSubmit(handleSubmitForm)} className='flex flex-col gap-5'>

            {/* Username — hanya saat create */}
            {!editData && (
              <Controller name='username' control={control}
                          rules={{ required: 'Username wajib diisi', minLength: { value: 3, message: 'Minimal 3 karakter' } }}
                          render={({ field }) => (
                            <TextField {...field} fullWidth label='Username' placeholder='Contoh: john.doe'
                                       error={!!errors.username} helperText={errors.username?.message} />
                          )}
              />
            )}

            <Controller name='full_name' control={control}
                        rules={{ required: 'Nama lengkap wajib diisi', minLength: { value: 2, message: 'Minimal 2 karakter' } }}
                        render={({ field }) => (
                          <TextField {...field} fullWidth label='Nama Lengkap' placeholder='Contoh: John Doe'
                                     error={!!errors.full_name} helperText={errors.full_name?.message} />
                        )}
            />

            <Controller name='email' control={control}
                        rules={{ pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Format email tidak valid' } }}
                        render={({ field }) => (
                          <TextField {...field} fullWidth label='Email (opsional)' placeholder='john@example.com'
                                     error={!!errors.email} helperText={errors.email?.message} />
                        )}
            />

            <Controller name='role' control={control}
                        rules={{ required: 'Role wajib dipilih' }}
                        render={({ field }) => (
                          <FormControl fullWidth error={!!errors.role}>
                            <InputLabel>Role</InputLabel>
                            <Select {...field} label='Role'>
                              {AVAILABLE_ROLES.map(r => (
                                <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                              ))}
                            </Select>
                            {errors.role && <Typography variant='caption' color='error' className='mt-1 ml-3'>{errors.role.message}</Typography>}
                          </FormControl>
                        )}
            />

            {/* Info password default — hanya saat create */}
            {!editData && (
              <Alert severity='info' variant='outlined'>
                Password default: <strong>Nimen@2025</strong>. User wajib mengganti password saat login pertama.
              </Alert>
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

      {/* ── Toggle Active Dialog ── */}
      <Dialog open={toggleOpen} onClose={() => setToggleOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>{toggleTarget?.is_active ? 'Nonaktifkan' : 'Aktifkan'} Akun</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {toggleTarget?.is_active
              ? `Nonaktifkan akun ${toggleTarget?.full_name}? User tidak bisa login selama akun nonaktif.`
              : `Aktifkan kembali akun ${toggleTarget?.full_name}?`
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions className='pli-5 plb-4'>
          <Button onClick={() => setToggleOpen(false)} variant='tonal' color='secondary' disabled={toggleLoading}>Batal</Button>
          <Button
            onClick={handleToggleActive}
            variant='contained'
            color={toggleTarget?.is_active ? 'error' : 'success'}
            disabled={toggleLoading}
            startIcon={toggleLoading ? <CircularProgress size={16} color='inherit' /> : null}
          >
            {toggleLoading ? 'Memproses...' : toggleTarget?.is_active ? 'Nonaktifkan' : 'Aktifkan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Dialog ── */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Hapus User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Hapus user <strong>{deleteTarget?.full_name}</strong> ({deleteTarget?.username})? Tindakan ini tidak dapat dibatalkan.
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

      {/* ── Toast ── */}
      <Snackbar open={toast.open} autoHideDuration={4000}
                onClose={() => setToast(t => ({ ...t, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity={toast.severity} variant='filled' onClose={() => setToast(t => ({ ...t, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  )
}

export default UserManagementView
