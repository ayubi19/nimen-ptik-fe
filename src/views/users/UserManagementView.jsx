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

// ── Mobile Card — PWA native ─────────────────────────────────────────────────
const ROLE_BADGE = {
  admin_nimen:      { bg: '#E6F1FB', color: '#185FA5' },
  admin_initiative: { bg: '#FAEEDA', color: '#BA7517' },
  student:          { bg: '#E1F5EE', color: '#0F6E56' },
  student_pic:      { bg: '#EEEDFE', color: '#534AB7' },
  viewer:           { bg: '#F1EFE8', color: '#5F5E5A' },
}

const UserMobileCard = ({ user, onEdit, onToggle, onDelete }) => (
  <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', padding: '12px', mb: '10px' }}>
    {/* Header */}
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', mb: '10px' }}>
      <Box sx={{
        width: 40, height: 40, borderRadius: '12px', flexShrink: 0,
        background: 'linear-gradient(145deg, #E63946, #6D0E13)',
        boxShadow: '0 3px 8px rgba(180,0,30,0.22), inset 0 1px 0 rgba(255,180,180,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.92)',
        position: 'relative', overflow: 'hidden',
      }}>
        {getInitials(user.full_name || user.username)}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#3B1010', lineHeight: 1.3 }} noWrap>
          {user.full_name || user.username}
        </Typography>
        <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }} noWrap>{user.username}</Typography>
      </Box>
      <Box sx={{ bgcolor: user.is_active ? '#E1F5EE' : '#F1EFE8', borderRadius: '6px', px: 1, py: '3px', flexShrink: 0 }}>
        <Typography sx={{ fontSize: '10px', fontWeight: 500, color: user.is_active ? '#0F6E56' : '#5F5E5A' }}>
          {user.is_active ? 'Aktif' : 'Nonaktif'}
        </Typography>
      </Box>
    </Box>

    {/* Meta */}
    <Box sx={{ py: '8px', borderTop: '0.5px solid rgba(180,100,100,0.1)', borderBottom: '0.5px solid rgba(180,100,100,0.1)', mb: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <i className='ri-mail-line' style={{ fontSize: '12px', color: '#9A5A5A', flexShrink: 0 }} />
        <Typography sx={{ fontSize: '11px', color: '#3B1010' }} noWrap>{user.email || '—'}</Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
        {(user.roles || []).map(r => {
          const b = ROLE_BADGE[r] || { bg: '#F1EFE8', color: '#5F5E5A' }
          return (
            <Box key={r} sx={{ bgcolor: b.bg, borderRadius: '6px', px: '7px', py: '2px' }}>
              <Typography sx={{ fontSize: '10px', fontWeight: 500, color: b.color }}>
                {ROLE_LABELS[r] || r}
              </Typography>
            </Box>
          )
        })}
      </Box>
    </Box>

    {/* Actions */}
    <Box sx={{ display: 'flex', gap: '6px' }}>
      <Box component='button' onClick={() => onEdit(user)} sx={{
        flex: 1, py: '5px', borderRadius: '8px', fontSize: '10px', fontWeight: 500,
        border: '0.5px solid rgba(180,100,100,0.18)', background: 'rgba(255,255,255,0.72)',
        boxShadow: '0 2px 6px rgba(139,0,0,0.07)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#444441',
      }}>
        <i className='ri-edit-line' style={{ fontSize: '11px' }} /> Edit
      </Box>
      <Box component='button' onClick={() => onToggle(user)} sx={{
        flex: 1, py: '5px', borderRadius: '8px', fontSize: '10px', fontWeight: 500,
        border: `0.5px solid ${user.is_active ? 'rgba(163,45,45,0.2)' : 'rgba(15,110,86,0.2)'}`,
        background: user.is_active ? '#FCEBEB' : '#E1F5EE', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
        color: user.is_active ? '#A32D2D' : '#0F6E56',
      }}>
        <i className={user.is_active ? 'ri-forbid-line' : 'ri-checkbox-circle-line'} style={{ fontSize: '11px' }} />
        {user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
      </Box>
      <Box component='button' onClick={() => onDelete(user)} sx={{
        px: '10px', py: '5px', borderRadius: '8px', fontSize: '10px', fontWeight: 500,
        border: '0.5px solid rgba(163,45,45,0.2)', background: '#FCEBEB', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <i className='ri-delete-bin-line' style={{ fontSize: '13px', color: '#A32D2D' }} />
      </Box>
    </Box>
  </Box>
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
  const [showPassword, setShowPassword] = useState(false)
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
    setShowPassword(false)
    reset({ full_name: '', email: '', username: '', password: '', role: 'viewer' })
    setDrawerOpen(true)
  }, [reset])

  const handleOpenEdit = useCallback((user) => {
    setEditData(user)
    setShowPassword(false)
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
      {/* Topbar PWA */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', mb: '14px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Box sx={{
            width: 34, height: 34, borderRadius: '10px',
            background: 'rgba(255,255,255,0.72)', border: '0.5px solid rgba(180,100,100,0.18)',
            boxShadow: '0 3px 10px rgba(139,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, cursor: 'pointer', position: 'relative', overflow: 'hidden',
            '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)' }
          }} onClick={() => window.history.back()}>
            <i className='ri-arrow-left-s-line' style={{ fontSize: '20px', color: '#8B2020', position: 'relative', zIndex: 1 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>Administrasi</Typography>
            <Typography sx={{ fontSize: '16px', fontWeight: 500, color: '#3B1010' }}>Manajemen User</Typography>
          </Box>
        </Box>
        <Box component='button' onClick={handleOpenCreate} sx={{
          display: 'flex', alignItems: 'center', gap: '5px', px: '12px', py: '7px',
          borderRadius: '10px', border: 'none', cursor: 'pointer',
          background: 'linear-gradient(145deg, #E63946, #6D0E13)',
          boxShadow: '0 4px 10px rgba(180,0,30,0.25)',
        }}>
          <i className='ri-add-line' style={{ fontSize: '14px', color: '#fff' }} />
          <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>Tambah User</Typography>
        </Box>
      </Box>

      {/* Filter — PWA native */}
      <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', p: '10px 12px', mb: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Box sx={{ display: 'flex', gap: '8px' }}>
          <FormControl size='small' sx={{ flex: 1 }}>
            <Select displayEmpty value={roleFilter}
                    onChange={e => { setRoleFilter(e.target.value); setPage(0) }}
                    renderValue={val => ROLE_LABELS[val] || 'Semua Role'}
                    sx={{ borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0', '& .MuiOutlinedInput-notchedOutline': { border: '0.5px solid rgba(180,100,100,0.15)' }, '& .MuiSelect-select': { py: '7px', px: '10px' } }}>
              <MenuItem value=''>Semua Role</MenuItem>
              {Object.entries(ROLE_LABELS).map(([key, label]) => (
                <MenuItem key={key} value={key}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size='small' sx={{ flex: 1 }}>
            <Select displayEmpty value={statusFilter}
                    onChange={e => { setStatusFilter(e.target.value); setPage(0) }}
                    renderValue={val => val === 'true' ? 'Aktif' : val === 'false' ? 'Nonaktif' : 'Semua Status'}
                    sx={{ borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0', '& .MuiOutlinedInput-notchedOutline': { border: '0.5px solid rgba(180,100,100,0.15)' }, '& .MuiSelect-select': { py: '7px', px: '10px' } }}>
              <MenuItem value=''>Semua Status</MenuItem>
              <MenuItem value='true'>Aktif</MenuItem>
              <MenuItem value='false'>Nonaktif</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <DebouncedInput fullWidth value={globalFilter}
                        onChange={v => { setGlobalFilter(v); setPage(0) }}
                        placeholder='Cari nama, username...'
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15)' } }, '& .MuiOutlinedInput-input': { py: '7px', px: '10px' } }}
                        InputProps={{ startAdornment: <InputAdornment position='start'><i className='ri-search-line' style={{ color: '#9A5A5A', fontSize: '14px' }} /></InputAdornment> }}
        />
      </Box>

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

      {/* Drawer Create/Edit — PWA native */}
      <Drawer anchor='right' open={drawerOpen} onClose={() => setDrawerOpen(false)}
              PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, bgcolor: '#F5F2F0' } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: '14px 16px', bgcolor: '#fff', borderBottom: '0.5px solid rgba(180,100,100,0.15)' }}>
          <Box>
            <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#3B1010' }}>{editData ? 'Edit User' : 'Tambah User'}</Typography>
            {editData && <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>{editData.username}</Typography>}
          </Box>
          <Box component='button' onClick={() => setDrawerOpen(false)} sx={{ width: 30, height: 30, borderRadius: '8px', border: 'none', cursor: 'pointer', background: '#F5F2F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className='ri-close-line' style={{ fontSize: '16px', color: '#9A5A5A' }} />
          </Box>
        </Box>

        <Box component='form' onSubmit={handleSubmit(handleSave)} sx={{ display: 'flex', flexDirection: 'column', gap: '10px', p: '14px', overflowY: 'auto' }}>
          <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', p: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Controller name='full_name' control={control} rules={{ required: 'Nama wajib diisi' }}
                        render={({ field }) => (
                          <TextField {...field} fullWidth size='small' placeholder='Nama Lengkap'
                                     error={!!errors.full_name} helperText={errors.full_name?.message}
                                     sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15)' } }, '& input': { py: '10px', px: '12px', fontSize: '12px' } }} />
                        )}
            />
            <Controller name='email' control={control} rules={{ required: 'Email wajib diisi' }}
                        render={({ field }) => (
                          <TextField {...field} fullWidth size='small' placeholder='Email' type='email'
                                     error={!!errors.email} helperText={errors.email?.message}
                                     sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15)' } }, '& input': { py: '10px', px: '12px', fontSize: '12px' } }} />
                        )}
            />
            {!editData && (
              <Controller name='username' control={control} rules={{ required: 'Username wajib diisi' }}
                          render={({ field }) => (
                            <TextField {...field} fullWidth size='small' placeholder='Username'
                                       error={!!errors.username} helperText={errors.username?.message}
                                       sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15)' } }, '& input': { py: '10px', px: '12px', fontSize: '12px' } }} />
                          )}
              />
            )}

            {/* Password field */}
            {!editData ? (
              /* Tambah user: tampilkan password sementara, disabled, dengan show/hide */
              <Box sx={{ position: 'relative' }}>
                <TextField
                  fullWidth size='small'
                  placeholder='Password Sementara'
                  value='Nimen@2025'
                  disabled
                  type={showPassword ? 'text' : 'password'}
                  helperText='User wajib mengganti password saat login pertama'
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton size='small' onClick={() => setShowPassword(p => !p)} edge='end'
                                    sx={{ color: '#9A5A5A' }}>
                          <i className={`ri-${showPassword ? 'eye-off' : 'eye'}-line`} style={{ fontSize: '16px' }} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15)' } }, '& input': { py: '10px', px: '12px', fontSize: '12px' } }}
                />
              </Box>
            ) : (
              /* Edit user: password opsional dengan show/hide */
              <Controller name='password' control={control} rules={{}}
                          render={({ field }) => (
                            <TextField {...field} fullWidth size='small'
                                       placeholder='Password Baru (opsional)'
                                       type={showPassword ? 'text' : 'password'}
                                       error={!!errors.password} helperText={errors.password?.message}
                                       InputProps={{
                                         endAdornment: (
                                           <InputAdornment position='end'>
                                             <IconButton size='small' onClick={() => setShowPassword(p => !p)} edge='end'
                                                         sx={{ color: '#9A5A5A' }}>
                                               <i className={`ri-${showPassword ? 'eye-off' : 'eye'}-line`} style={{ fontSize: '16px' }} />
                                             </IconButton>
                                           </InputAdornment>
                                         )
                                       }}
                                       sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15)' } }, '& input': { py: '10px', px: '12px', fontSize: '12px' } }} />
                          )}
              />
            )}

            <Controller name='role' control={control} rules={{ required: 'Role wajib dipilih' }}
                        render={({ field }) => (
                          <FormControl fullWidth size='small'>
                            <Select displayEmpty {...field}
                                    renderValue={val => ROLE_LABELS[val] || 'Pilih Role'}
                                    sx={{ borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0', '& .MuiOutlinedInput-notchedOutline': { border: '0.5px solid rgba(180,100,100,0.15)' }, '& .MuiSelect-select': { py: '10px', px: '12px' } }}>
                              {editData && !AVAILABLE_ROLES.find(r => r.value === field.value) && (
                                <MenuItem value={field.value} disabled>{ROLE_LABELS[field.value] || field.value}</MenuItem>
                              )}
                              {AVAILABLE_ROLES.map(r => (
                                <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: '8px' }}>
            <Box component='button' type='button' onClick={() => setDrawerOpen(false)} disabled={saveLoading} sx={{ flex: 1, py: '10px', borderRadius: '10px', cursor: 'pointer', background: '#fff', border: '0.5px solid rgba(180,100,100,0.18)', boxShadow: '0 2px 6px rgba(139,0,0,0.07)' }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#9A5A5A' }}>Batal</Typography>
            </Box>
            <Box component='button' type='submit' disabled={saveLoading} sx={{ flex: 2, py: '10px', borderRadius: '10px', cursor: 'pointer', border: 'none', background: saveLoading ? '#ccc' : 'linear-gradient(145deg, #E63946, #6D0E13)', boxShadow: '0 4px 10px rgba(180,0,30,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              {saveLoading && <CircularProgress size={14} sx={{ color: '#fff' }} />}
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                {saveLoading ? 'Menyimpan...' : editData ? 'Simpan Perubahan' : 'Buat User'}
              </Typography>
            </Box>
          </Box>
        </Box>
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
