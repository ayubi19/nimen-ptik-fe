'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
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
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Snackbar from '@mui/material/Snackbar'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { useForm, Controller } from 'react-hook-form'
import { getInitials } from '@/utils/getInitials'
import { userManagementApi } from '@/libs/api/userManagementApi'

const AVAILABLE_ROLES = [
  { value: 'admin_nimen',      label: 'Admin NIMEN' },
  { value: 'admin_initiative', label: 'Admin Inisiatif' },
  { value: 'viewer',           label: 'Viewer' },
]

const ROLE_COLORS = {
  admin_nimen:      'primary',
  admin_initiative: 'warning',
  student:          'success',
  student_pic:      'info',
  viewer:           'secondary',
}

const ROLE_LABELS = {
  admin_nimen:      'Admin NIMEN',
  admin_initiative: 'Admin Inisiatif',
  student:          'Mahasiswa',
  student_pic:      'Mahasiswa PIC',
  viewer:           'Viewer',
}

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—'

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
const UserMobileCard = ({ user, onEdit, onToggle, onDelete }) => (
  <Card className='mb-3'>
    <CardContent sx={{ p: '12px !important' }}>
      <div className='flex items-start justify-between gap-2 mb-2'>
        <div className='flex items-center gap-2 flex-1 min-w-0'>
          <Avatar sx={{ width: 36, height: 36, fontSize: 13, flexShrink: 0 }}>
            {getInitials(user.full_name || user.username)}
          </Avatar>
          <div className='min-w-0'>
            <Typography variant='body2' fontWeight={600} noWrap>{user.full_name || user.username}</Typography>
            <Typography variant='caption' color='text.secondary' noWrap>{user.username}</Typography>
          </div>
        </div>
        <Chip label={user.is_active ? 'Aktif' : 'Nonaktif'}
              color={user.is_active ? 'success' : 'default'} size='small' variant='tonal' sx={{ flexShrink: 0 }} />
      </div>
      <div className='flex items-center gap-1 mb-1'>
        <i className='ri-mail-line text-xs' style={{ color: 'var(--mui-palette-text-secondary)' }} />
        <Typography variant='caption' color='text.secondary' noWrap>{user.email || '—'}</Typography>
      </div>
      <div className='flex items-center gap-2 mb-3 flex-wrap'>
        {(user.roles || []).map(r => (
          <Chip key={r} label={ROLE_LABELS[r] || r}
                color={ROLE_COLORS[r] || 'default'} size='small' variant='tonal' />
        ))}
      </div>
      <Divider className='mb-2' />
      <div className='flex gap-1.5 flex-wrap'>
        <Button size='small' variant='tonal' color='secondary'
                startIcon={<i className='ri-edit-line' />}
                onClick={() => onEdit(user)}>Edit</Button>
        <Button size='small' variant='tonal'
                color={user.is_active ? 'error' : 'success'}
                onClick={() => onToggle(user)}>
          {user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
        </Button>
        <Button size='small' variant='tonal' color='error'
                startIcon={<i className='ri-delete-bin-line' />}
                onClick={() => onDelete(user)}>Hapus</Button>
      </div>
    </CardContent>
  </Card>
)

// ── Main View ─────────────────────────────────────────────────────────────────
const UserManagementView = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [data, setData]         = useState([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(false)
  const [globalFilter, setGlobalFilter] = useState('')
  const [roleFilter, setRoleFilter]     = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage]         = useState(0)
  const [pageSize, setPageSize] = useState(10)

  const [drawerOpen, setDrawerOpen]     = useState(false)
  const [editData, setEditData]         = useState(null)
  const [saveLoading, setSaveLoading]   = useState(false)
  const [toggleTarget, setToggleTarget] = useState(null)
  const [toggleLoading, setToggleLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const showToast = useCallback((msg, severity = 'success') =>
    setToast({ open: true, message: msg, severity }), [])

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { full_name: '', email: '', username: '', password: '', role: 'viewer' }
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page: page + 1, page_size: pageSize }
      if (globalFilter) params.search    = globalFilter
      if (roleFilter)   params.role      = roleFilter
      if (statusFilter) params.is_active = statusFilter
      const res = await userManagementApi.getAll(params)
      setData(res.data.data?.data || [])
      setTotal(res.data.data?.pagination?.total || 0)
    } catch (err) {
      showToast(err.message || 'Gagal memuat data', 'error')
    } finally { setLoading(false) }
  }, [page, pageSize, globalFilter, roleFilter, statusFilter, showToast])

  useEffect(() => { fetchData() }, [fetchData])

  const handleOpenCreate = useCallback(() => {
    setEditData(null)
    reset({ full_name: '', email: '', username: '', password: '', role: 'viewer' })
    setDrawerOpen(true)
  }, [reset])

  const handleOpenEdit = useCallback((user) => {
    setEditData(user)
    reset({
      full_name: user.full_name || '',
      email:     user.email || '',
      username:  user.username || '',
      password:  '',
      role:      user.roles?.[0] || 'viewer',
    })
    setDrawerOpen(true)
  }, [reset])

  const handleSave = useCallback(async (values) => {
    setSaveLoading(true)
    try {
      if (editData) {
        await userManagementApi.update(editData.id, {
          full_name: values.full_name,
          email: values.email,
          role: values.role,
          ...(values.password ? { password: values.password } : {}),
        })
        showToast('User berhasil diperbarui')
      } else {
        await userManagementApi.create({
          full_name: values.full_name,
          email: values.email,
          username: values.username,
          password: values.password,
          role: values.role,
        })
        showToast('User berhasil dibuat')
      }
      setDrawerOpen(false); fetchData()
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan', 'error')
    } finally { setSaveLoading(false) }
  }, [editData, fetchData, showToast])

  const handleToggleActive = useCallback(async () => {
    setToggleLoading(true)
    try {
      await userManagementApi.toggleActive(toggleTarget.id)
      showToast(`Akun berhasil ${toggleTarget.is_active ? 'dinonaktifkan' : 'diaktifkan'}`)
      setToggleTarget(null); fetchData()
    } catch (err) {
      showToast(err.message || 'Gagal mengubah status', 'error')
    } finally { setToggleLoading(false) }
  }, [toggleTarget, fetchData, showToast])

  const handleDelete = useCallback(async () => {
    setDeleteLoading(true)
    try {
      await userManagementApi.delete(deleteTarget.id)
      showToast('User berhasil dihapus')
      setDeleteTarget(null); fetchData()
    } catch (err) {
      showToast(err.message || 'Gagal menghapus', 'error')
    } finally { setDeleteLoading(false) }
  }, [deleteTarget, fetchData, showToast])

  return (
    <>
      {/* Breadcrumb */}
      <div className='flex items-center gap-2 mb-6'>
        <Typography variant='caption' color='text.secondary'>Administrasi</Typography>
        <i className='ri-arrow-right-s-line text-sm opacity-50' />
        <Typography variant='caption' fontWeight={500} color='text.primary'>Manajemen User</Typography>
      </div>

      {/* Header */}
      <div className='flex items-center justify-between mb-6 flex-wrap gap-3'>
        <div />
        <Button variant='contained' startIcon={<i className='ri-add-line' />}
                onClick={handleOpenCreate}
                sx={{ width: { xs: '100%', sm: 'auto' } }}>
          Tambah User
        </Button>
      </div>

      {/* Filter */}
      <Card className='mb-6'>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size='small'>
                <InputLabel>Role</InputLabel>
                <Select label='Role' value={roleFilter}
                        onChange={e => { setRoleFilter(e.target.value); setPage(0) }}>
                  <MenuItem value=''>Semua Role</MenuItem>
                  {Object.entries(ROLE_LABELS).map(([key, label]) => (
                    <MenuItem key={key} value={key}>
                      <Chip label={label} color={ROLE_COLORS[key] || 'default'} size='small' variant='tonal' />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
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
            <Grid item xs={12} sm={4}>
              <DebouncedInput fullWidth value={globalFilter}
                              onChange={v => { setGlobalFilter(v); setPage(0) }}
                              placeholder='Cari nama, username...'
                              InputProps={{ startAdornment: <InputAdornment position='start'><i className='ri-search-line' /></InputAdornment> }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <Box className='flex justify-center py-10'><CircularProgress /></Box>
      ) : isMobile ? (
        <>
          {data.length === 0 ? (
            <Card>
              <CardContent sx={{ py: 6 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <i className='ri-user-settings-line' style={{ fontSize: 48, opacity: 0.3 }} />
                  <Typography variant='body2' color='text.secondary'>Tidak ada user ditemukan.</Typography>
                </Box>
              </CardContent>
            </Card>
          ) : data.map(u => (
            <UserMobileCard key={u.id} user={u}
                            onEdit={handleOpenEdit}
                            onToggle={u => { setToggleTarget(u) }}
                            onDelete={u => { setDeleteTarget(u) }}
            />
          ))}
          <TablePagination component='div' count={total} page={page} rowsPerPage={pageSize}
                           onPageChange={(_, p) => setPage(p)}
                           onRowsPerPageChange={e => { setPageSize(parseInt(e.target.value)); setPage(0) }}
                           rowsPerPageOptions={[10, 25, 50]}
                           labelRowsPerPage='Baris:'
                           labelDisplayedRows={({ from, to, count }) => `${from}–${to} dari ${count}`}
          />
        </>
      ) : (
        <Card>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                {['User', 'Email', 'Role', 'Status', 'Dibuat', 'Aksi'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 8 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <i className='ri-user-settings-line' style={{ fontSize: 48, opacity: 0.3 }} />
                      <Typography variant='body2' color='text.secondary'>Tidak ada user ditemukan.</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : data.map(u => (
                <TableRow key={u.id} hover>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <Avatar sx={{ width: 32, height: 32, fontSize: 12 }}>
                        {getInitials(u.full_name || u.username)}
                      </Avatar>
                      <div>
                        <Typography variant='body2' fontWeight={600}>{u.full_name || u.username}</Typography>
                        <Typography variant='caption' color='text.secondary'>{u.username}</Typography>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Typography variant='body2'>{u.email || '—'}</Typography></TableCell>
                  <TableCell>
                    <div className='flex flex-wrap gap-1'>
                      {(u.roles || []).map(r => (
                        <Chip key={r} label={ROLE_LABELS[r] || r}
                              color={ROLE_COLORS[r] || 'default'} size='small' variant='tonal' />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip label={u.is_active ? 'Aktif' : 'Nonaktif'}
                          color={u.is_active ? 'success' : 'default'} size='small' variant='tonal' />
                  </TableCell>
                  <TableCell><Typography variant='body2'>{fmtDate(u.created_at)}</Typography></TableCell>
                  <TableCell>
                    <div className='flex items-center gap-0.5'>
                      <Tooltip title='Edit'>
                        <IconButton size='small' onClick={() => handleOpenEdit(u)}>
                          <i className='ri-edit-line text-[18px]' />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={u.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
                        <IconButton size='small' color={u.is_active ? 'error' : 'success'}
                                    onClick={() => setToggleTarget(u)}>
                          <i className={`ri-${u.is_active ? 'forbid' : 'checkbox-circle'}-line text-[18px]`} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Hapus'>
                        <IconButton size='small' color='error' onClick={() => setDeleteTarget(u)}>
                          <i className='ri-delete-bin-line text-[18px]' />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination component='div' count={total} page={page} rowsPerPage={pageSize}
                           onPageChange={(_, p) => setPage(p)}
                           onRowsPerPageChange={e => { setPageSize(parseInt(e.target.value)); setPage(0) }}
                           rowsPerPageOptions={[10, 25, 50]}
                           labelRowsPerPage='Baris per halaman:'
                           labelDisplayedRows={({ from, to, count }) => `${from}–${to} dari ${count}`}
          />
        </Card>
      )}

      {/* Drawer Create/Edit */}
      <Drawer anchor='right' open={drawerOpen} onClose={() => setDrawerOpen(false)}
              PaperProps={{ sx: { width: { xs: '100%', sm: 420 } } }}>
        <div className='flex items-center justify-between p-4 border-b'>
          <div>
            <Typography variant='h6'>{editData ? 'Edit User' : 'Tambah User'}</Typography>
            {editData && <Typography variant='caption' color='text.secondary'>{editData.username}</Typography>}
          </div>
          <IconButton onClick={() => setDrawerOpen(false)}><i className='ri-close-line' /></IconButton>
        </div>
        <form onSubmit={handleSubmit(handleSave)} className='flex flex-col gap-4 p-4 overflow-y-auto'>
          <Controller name='full_name' control={control} rules={{ required: 'Nama wajib diisi' }}
                      render={({ field }) => (
                        <TextField {...field} fullWidth size='small' label='Nama Lengkap'
                                   error={!!errors.full_name} helperText={errors.full_name?.message} />
                      )}
          />
          <Controller name='email' control={control} rules={{ required: 'Email wajib diisi' }}
                      render={({ field }) => (
                        <TextField {...field} fullWidth size='small' label='Email' type='email'
                                   error={!!errors.email} helperText={errors.email?.message} />
                      )}
          />
          {!editData && (
            <Controller name='username' control={control} rules={{ required: 'Username wajib diisi' }}
                        render={({ field }) => (
                          <TextField {...field} fullWidth size='small' label='Username'
                                     error={!!errors.username} helperText={errors.username?.message} />
                        )}
            />
          )}
          <Controller name='password' control={control}
                      rules={editData ? {} : { required: 'Password wajib diisi', minLength: { value: 6, message: 'Minimal 6 karakter' } }}
                      render={({ field }) => (
                        <TextField {...field} fullWidth size='small' label={editData ? 'Password Baru (opsional)' : 'Password'}
                                   type='password' error={!!errors.password} helperText={errors.password?.message} />
                      )}
          />
          <Controller name='role' control={control} rules={{ required: 'Role wajib dipilih' }}
                      render={({ field }) => (
                        <FormControl fullWidth size='small' error={!!errors.role}>
                          <InputLabel>Role</InputLabel>
                          <Select {...field} label='Role'>
                            {/* Tampilkan role saat ini jika tidak ada di AVAILABLE_ROLES (misal: student) */}
                            {editData && !AVAILABLE_ROLES.find(r => r.value === field.value) && (
                              <MenuItem value={field.value} disabled>
                                <Chip label={ROLE_LABELS[field.value] || field.value}
                                      color={ROLE_COLORS[field.value] || 'default'} size='small' variant='tonal' />
                              </MenuItem>
                            )}
                            {AVAILABLE_ROLES.map(r => (
                              <MenuItem key={r.value} value={r.value}>
                                <Chip label={r.label} color={ROLE_COLORS[r.value] || 'default'} size='small' variant='tonal' />
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
          />
          <div className='flex gap-2 mt-2'>
            <Button fullWidth variant='tonal' color='secondary'
                    onClick={() => setDrawerOpen(false)} disabled={saveLoading}>Batal</Button>
            <Button fullWidth variant='contained' type='submit' disabled={saveLoading}
                    startIcon={saveLoading ? <CircularProgress size={16} color='inherit' /> : null}>
              {saveLoading ? 'Menyimpan...' : editData ? 'Simpan Perubahan' : 'Buat User'}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Dialog Toggle */}
      <Dialog open={!!toggleTarget} onClose={() => setToggleTarget(null)} maxWidth='xs' fullWidth>
        <DialogTitle>{toggleTarget?.is_active ? 'Nonaktifkan' : 'Aktifkan'} Akun</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {toggleTarget?.is_active
              ? `Nonaktifkan akun ${toggleTarget?.full_name || toggleTarget?.username}?`
              : `Aktifkan kembali akun ${toggleTarget?.full_name || toggleTarget?.username}?`}
          </DialogContentText>
        </DialogContent>
        <DialogActions className='p-4 gap-2'>
          <Button variant='tonal' color='secondary' onClick={() => setToggleTarget(null)} disabled={toggleLoading}>
            Batal
          </Button>
          <Button variant='contained' color={toggleTarget?.is_active ? 'error' : 'success'}
                  onClick={handleToggleActive} disabled={toggleLoading}
                  startIcon={toggleLoading ? <CircularProgress size={16} color='inherit' /> : null}>
            {toggleLoading ? 'Memproses...' : toggleTarget?.is_active ? 'Nonaktifkan' : 'Aktifkan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Delete */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth='xs' fullWidth>
        <DialogTitle>Hapus User?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Hapus akun <strong>{deleteTarget?.full_name || deleteTarget?.username}</strong>? Tindakan ini tidak dapat dibatalkan.
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

export default UserManagementView
