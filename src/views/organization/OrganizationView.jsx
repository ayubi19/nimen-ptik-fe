'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import DialogContentText from '@mui/material/DialogContentText'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import InputAdornment from '@mui/material/InputAdornment'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Autocomplete from '@mui/material/Autocomplete'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import Avatar from '@mui/material/Avatar'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import TablePagination from '@mui/material/TablePagination'
import { useForm, Controller } from 'react-hook-form'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import 'dayjs/locale/id'
import { studentPositionApi, positionAssignmentApi } from '@/libs/api/organizationApi'
import { batchApi } from '@/libs/api/masterDataApi'
import { studentsApi } from '@/libs/api/studentsApi'
import { getInitials } from '@/utils/getInitials'

dayjs.locale('id')

// ─── Tab Master Jabatan ───────────────────────────────────────────────────────

const PositionMasterTab = () => {
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editData, setEditData] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const showToast = useCallback((msg, severity = 'success') => {
    setToast({ open: true, message: msg, severity })
  }, [])

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { name: '', display_name: '', description: '', is_active: true }
  })

  const fetchPositions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await studentPositionApi.getAll({})
      setPositions(res.data.data || [])
    } catch (err) {
      showToast(err.message || 'Gagal memuat data', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { fetchPositions() }, [fetchPositions])

  const handleOpenCreate = useCallback(() => {
    setEditData(null)
    reset({ name: '', display_name: '', description: '', is_active: true })
    setDrawerOpen(true)
  }, [reset])

  const handleOpenEdit = useCallback((pos) => {
    setEditData(pos)
    reset({
      name: pos.name,
      display_name: pos.display_name,
      description: pos.description || '',
      is_active: pos.is_active,
    })
    setDrawerOpen(true)
  }, [reset])

  const handleSubmitForm = useCallback(async (values) => {
    setFormLoading(true)
    try {
      if (editData) {
        await studentPositionApi.update(editData.id, {
          display_name: values.display_name,
          description: values.description || '',
          is_active: values.is_active,
        })
        showToast('Jabatan berhasil diperbarui')
      } else {
        await studentPositionApi.create({
          name: values.name,
          display_name: values.display_name,
          description: values.description || '',
        })
        showToast('Jabatan berhasil dibuat')
      }
      setDrawerOpen(false)
      fetchPositions()
    } catch (err) {
      showToast(err.message || 'Terjadi kesalahan', 'error')
    } finally {
      setFormLoading(false)
    }
  }, [editData, fetchPositions, showToast])

  return (
    <>
      <div className='flex justify-between items-center mb-4'>
        <Typography variant='body2' color='text.secondary'>
          {positions.length} jabatan terdaftar
        </Typography>
        <Button variant='contained' size='small' startIcon={<i className='ri-add-line' />}
          onClick={handleOpenCreate}>
          Tambah Jabatan
        </Button>
      </div>

      {loading ? (
        <Box className='flex justify-center py-10'><CircularProgress /></Box>
      ) : (
        <div className='flex flex-col gap-3'>
          {positions.map(pos => (
            <Box key={pos.id} className='flex items-center justify-between p-4 rounded-lg border'
              sx={{ borderColor: 'divider' }}>
              <div>
                <div className='flex items-center gap-2'>
                  <Typography variant='body1' fontWeight={600}>{pos.display_name}</Typography>
                  <Chip label={pos.is_active ? 'Aktif' : 'Nonaktif'}
                    color={pos.is_active ? 'success' : 'secondary'} size='small' variant='tonal' />
                </div>
                <Typography variant='caption' color='text.secondary'>
                  <code>{pos.name}</code>
                  {pos.description && ` — ${pos.description}`}
                </Typography>
              </div>
              <IconButton size='small' onClick={() => handleOpenEdit(pos)}>
                <i className='ri-edit-line' />
              </IconButton>
            </Box>
          ))}
        </div>
      )}

      {/* Drawer Form */}
      <Drawer open={drawerOpen} anchor='right' variant='temporary' onClose={() => setDrawerOpen(false)}
        ModalProps={{ keepMounted: true }} sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 420 } } }}>
        <div className='flex items-center justify-between pli-6 plb-5'>
          <Typography variant='h5'>{editData ? 'Edit Jabatan' : 'Tambah Jabatan'}</Typography>
          <IconButton onClick={() => setDrawerOpen(false)}><i className='ri-close-line text-2xl' /></IconButton>
        </div>
        <Divider />
        <div className='p-6'>
          <form onSubmit={handleSubmit(handleSubmitForm)} className='flex flex-col gap-5'>
            {!editData && (
              <Controller name='name' control={control}
                rules={{ required: 'Wajib diisi', pattern: { value: /^[a-z0-9_]+$/, message: 'Hanya huruf kecil, angka, dan underscore' } }}
                render={({ field }) => (
                  <TextField {...field} fullWidth label='Kode Jabatan' placeholder='contoh: ketua_angkatan'
                    helperText={errors.name?.message || 'Huruf kecil, angka, underscore. Tidak bisa diubah setelah dibuat.'}
                    error={!!errors.name} />
                )}
              />
            )}
            <Controller name='display_name' control={control}
              rules={{ required: 'Nama tampilan wajib diisi' }}
              render={({ field }) => (
                <TextField {...field} fullWidth label='Nama Jabatan'
                  placeholder='contoh: Ketua Angkatan'
                  error={!!errors.display_name} helperText={errors.display_name?.message} />
              )}
            />
            <Controller name='description' control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth multiline rows={2} label='Deskripsi (opsional)' />
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
              <Button fullWidth variant='tonal' color='secondary' onClick={() => setDrawerOpen(false)}>Batal</Button>
            </div>
          </form>
        </div>
      </Drawer>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast(t => ({ ...t, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity={toast.severity} variant='filled' onClose={() => setToast(t => ({ ...t, open: false }))}>{toast.message}</Alert>
      </Snackbar>
    </>
  )
}

// ─── Tab Struktur Organisasi ──────────────────────────────────────────────────

const OrganizationStructureTab = () => {
  const [batches, setBatches] = useState([])
  const [selectedBatch, setSelectedBatch] = useState('')
  const [positions, setPositions] = useState([])
  const [assignments, setAssignments] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize] = useState(20)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editData, setEditData] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')
  const [studentOptions, setStudentOptions] = useState([])
  const [studentLoading, setStudentLoading] = useState(false)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const showToast = useCallback((msg, severity = 'success') => {
    setToast({ open: true, message: msg, severity })
  }, [])

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { user_id: '', user_obj: null, position_id: '', period_start: null, period_end: null, notes: '', is_active: true }
  })

  useEffect(() => {
    batchApi.getAllActive().then(res => setBatches(res.data.data || [])).catch(() => {})
    studentPositionApi.getAll({ is_active: true }).then(res => setPositions(res.data.data || [])).catch(() => {})
  }, [])

  const fetchAssignments = useCallback(async () => {
    if (!selectedBatch) return
    setLoading(true)
    try {
      const res = await positionAssignmentApi.getByBatch(selectedBatch, { page: page + 1, page_size: pageSize })
      setAssignments(res.data.data.data || [])
      setTotal(res.data.data.pagination?.total || 0)
    } catch (err) {
      showToast(err.message || 'Gagal memuat data', 'error')
    } finally {
      setLoading(false)
    }
  }, [selectedBatch, page, pageSize, showToast])

  useEffect(() => { fetchAssignments() }, [fetchAssignments])

  // Search mahasiswa dengan debounce
  useEffect(() => {
    if (studentSearch.length < 2) return
    setStudentLoading(true)
    const t = setTimeout(() => {
      studentsApi.getAll({ search: studentSearch, page_size: 20, batch_id: selectedBatch || undefined })
        .then(res => setStudentOptions(res.data.data.data || []))
        .catch(() => {})
        .finally(() => setStudentLoading(false))
    }, 400)
    return () => clearTimeout(t)
  }, [studentSearch, selectedBatch])

  const handleOpenCreate = useCallback(() => {
    setEditData(null)
    reset({ user_id: '', user_obj: null, position_id: '', period_start: null, period_end: null, notes: '', is_active: true })
    setDrawerOpen(true)
  }, [reset])

  const handleOpenEdit = useCallback((a) => {
    setEditData(a)
    reset({
      user_id: a.user_id,
      position_id: a.position_id,
      period_start: a.period_start ? dayjs(a.period_start) : null,
      period_end: a.period_end ? dayjs(a.period_end) : null,
      notes: a.notes || '',
      is_active: a.is_active,
    })
    setDrawerOpen(true)
  }, [reset])

  const handleSubmitForm = useCallback(async (values) => {
    setFormLoading(true)
    try {
      if (editData) {
        await positionAssignmentApi.update(editData.id, {
          period_end: values.period_end ? dayjs(values.period_end).format('YYYY-MM-DD') : '',
          notes: values.notes || '',
          is_active: values.is_active,
        })
        showToast('Assignment berhasil diperbarui')
      } else {
        await positionAssignmentApi.assign({
          user_id: parseInt(values.user_id),
          position_id: parseInt(values.position_id),
          batch_id: parseInt(selectedBatch),
          period_start: values.period_start ? dayjs(values.period_start).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
          period_end: values.period_end ? dayjs(values.period_end).format('YYYY-MM-DD') : '',
          notes: values.notes || '',
        })
        showToast('Jabatan berhasil di-assign')
      }
      setDrawerOpen(false)
      fetchAssignments()
    } catch (err) {
      showToast(err.message || 'Terjadi kesalahan', 'error')
    } finally {
      setFormLoading(false)
    }
  }, [editData, selectedBatch, fetchAssignments, showToast])

  const handleDelete = useCallback(async () => {
    setDeleteLoading(true)
    try {
      await positionAssignmentApi.remove(deleteTarget.id)
      showToast('Assignment berhasil dihapus')
      setDeleteOpen(false)
      fetchAssignments()
    } catch (err) {
      showToast(err.message || 'Gagal menghapus', 'error')
    } finally {
      setDeleteLoading(false)
    }
  }, [deleteTarget, fetchAssignments, showToast])

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale='id'>
      {/* Pilih Angkatan */}
      <div className='flex flex-wrap items-center justify-between gap-4 mb-4'>
        <FormControl size='small' sx={{ minWidth: 200 }}>
          <InputLabel>Pilih Angkatan</InputLabel>
          <Select label='Pilih Angkatan' value={selectedBatch}
            onChange={e => { setSelectedBatch(e.target.value); setPage(0) }}>
            {batches.map(b => <MenuItem key={b.id} value={b.id}>{b.name} ({b.year})</MenuItem>)}
          </Select>
        </FormControl>
        {selectedBatch && (
          <Button variant='contained' size='small' startIcon={<i className='ri-user-star-line' />}
            onClick={handleOpenCreate}>
            Assign Jabatan
          </Button>
        )}
      </div>

      {!selectedBatch ? (
        <Box className='flex flex-col items-center py-12 gap-2' sx={{ color: 'text.secondary' }}>
          <i className='ri-organization-chart text-5xl opacity-30' />
          <Typography variant='body2'>Pilih angkatan untuk melihat struktur organisasi</Typography>
        </Box>
      ) : loading ? (
        <Box className='flex justify-center py-10'><CircularProgress /></Box>
      ) : assignments.length === 0 ? (
        <Box className='flex flex-col items-center py-12 gap-2' sx={{ color: 'text.secondary' }}>
          <i className='ri-user-star-line text-5xl opacity-30' />
          <Typography variant='body2'>Belum ada struktur organisasi untuk angkatan ini</Typography>
          <Button variant='contained' size='small' startIcon={<i className='ri-add-line' />}
            onClick={handleOpenCreate}>
            Assign Jabatan Pertama
          </Button>
        </Box>
      ) : (
        <>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Mahasiswa</TableCell>
                <TableCell>NIM</TableCell>
                <TableCell>Jabatan</TableCell>
                <TableCell>Periode</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align='center'>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assignments.map(a => (
                <TableRow key={a.id}>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <Avatar sx={{ width: 32, height: 32, fontSize: 12 }}>
                        {getInitials(a.user?.full_name || '')}
                      </Avatar>
                      <Typography variant='body2' fontWeight={600}>{a.user?.full_name}</Typography>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2'>{a.user?.student_profile?.nim || '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={a.position?.display_name || '-'} size='small' color='primary' variant='tonal' />
                  </TableCell>
                  <TableCell>
                    <Typography variant='caption'>
                      {a.period_start ? dayjs(a.period_start).format('DD/MM/YYYY') : '-'}
                      {a.period_end && ` – ${dayjs(a.period_end).format('DD/MM/YYYY')}`}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={a.is_active ? 'Aktif' : 'Nonaktif'}
                      color={a.is_active ? 'success' : 'secondary'} size='small' variant='tonal' />
                  </TableCell>
                  <TableCell align='center'>
                    <div className='flex items-center justify-center gap-0.5'>
                      <IconButton size='small' onClick={() => handleOpenEdit(a)}>
                        <i className='ri-edit-line text-[22px]' />
                      </IconButton>
                      <IconButton size='small' onClick={() => { setDeleteTarget(a); setDeleteOpen(true) }}>
                        <i className='ri-delete-bin-7-line text-[22px]' />
                      </IconButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination component='div' count={total} page={page} rowsPerPage={pageSize}
            onPageChange={(_, p) => setPage(p)} rowsPerPageOptions={[20]}
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} dari ${count}`}
          />
        </>
      )}

      {/* Drawer Assign */}
      <Drawer open={drawerOpen} anchor='right' variant='temporary' onClose={() => setDrawerOpen(false)}
        ModalProps={{ keepMounted: true }} sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 440 } } }}>
        <div className='flex items-center justify-between pli-6 plb-5'>
          <Typography variant='h5'>{editData ? 'Edit Assignment' : 'Assign Jabatan'}</Typography>
          <IconButton onClick={() => setDrawerOpen(false)}><i className='ri-close-line text-2xl' /></IconButton>
        </div>
        <Divider />
        <div className='p-6'>
          <form onSubmit={handleSubmit(handleSubmitForm)} className='flex flex-col gap-5'>
            {!editData && (
              <>
                {/* Cari mahasiswa */}
                <Controller name='user_id' control={control} rules={{ required: 'Mahasiswa wajib dipilih' }}
                  render={({ field }) => (
                    <Autocomplete
                      options={studentOptions}
                      loading={studentLoading}
                      getOptionLabel={opt => opt.full_name || ''}
                      isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                      onInputChange={(_, val) => setStudentSearch(val)}
                      onChange={(_, val) => field.onChange(val?.id || '')}
                      renderOption={(props, opt) => (
                        <li {...props} key={opt.id}>
                          <div className='flex items-center gap-2'>
                            <Avatar sx={{ width: 28, height: 28, fontSize: 11 }}>{getInitials(opt.full_name || '')}</Avatar>
                            <div>
                              <Typography variant='body2' fontWeight={600}>{opt.full_name}</Typography>
                              <Typography variant='caption' color='text.secondary'>{opt.student_profile?.nim}</Typography>
                            </div>
                          </div>
                        </li>
                      )}
                      renderInput={params => (
                        <TextField {...params} label='Cari Mahasiswa' placeholder='Ketik nama atau NIM...'
                          error={!!errors.user_id} helperText={errors.user_id?.message || 'Cari dari angkatan yang dipilih'}
                          InputProps={{ ...params.InputProps, endAdornment: (<>{studentLoading ? <CircularProgress size={16} /> : null}{params.InputProps.endAdornment}</>) }}
                        />
                      )}
                    />
                  )}
                />

                {/* Jabatan */}
                <Controller name='position_id' control={control} rules={{ required: 'Jabatan wajib dipilih' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.position_id}>
                      <InputLabel>Jabatan</InputLabel>
                      <Select {...field} label='Jabatan'>
                        {positions.map(p => <MenuItem key={p.id} value={p.id}>{p.display_name}</MenuItem>)}
                      </Select>
                      {errors.position_id && <Typography variant='caption' color='error'>{errors.position_id.message}</Typography>}
                    </FormControl>
                  )}
                />

                {/* Tanggal mulai */}
                <Controller name='period_start' control={control} rules={{ required: 'Tanggal mulai wajib diisi' }}
                  render={({ field }) => (
                    <DatePicker label='Tanggal Mulai Jabatan' value={field.value} onChange={field.onChange}
                      format='DD/MM/YYYY'
                      slotProps={{ textField: { fullWidth: true, error: !!errors.period_start, helperText: errors.period_start?.message } }}
                    />
                  )}
                />
              </>
            )}

            {/* Tanggal selesai (opsional, bisa di create maupun edit) */}
            <Controller name='period_end' control={control}
              render={({ field }) => (
                <DatePicker label='Tanggal Selesai (opsional)' value={field.value} onChange={field.onChange}
                  format='DD/MM/YYYY'
                  slotProps={{ textField: { fullWidth: true, helperText: 'Kosongkan jika masih menjabat' } }}
                />
              )}
            />

            <Controller name='notes' control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth multiline rows={2} label='Catatan (opsional)' />
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
              <Button fullWidth variant='tonal' color='secondary' onClick={() => setDrawerOpen(false)}>Batal</Button>
            </div>
          </form>
        </div>
      </Drawer>

      {/* Dialog Hapus */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Hapus Assignment</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Hapus jabatan <strong>{deleteTarget?.position?.display_name}</strong> dari <strong>{deleteTarget?.user?.full_name}</strong>?
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
    </LocalizationProvider>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────

const OrganizationView = () => {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <Card>
      <CardHeader title='Struktur Organisasi Mahasiswa' />
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ px: 6, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label='Struktur Organisasi' icon={<i className='ri-organization-chart' />} iconPosition='start' />
        <Tab label='Master Jabatan' icon={<i className='ri-list-settings-line' />} iconPosition='start' />
      </Tabs>
      <CardContent>
        {activeTab === 0 && <OrganizationStructureTab />}
        {activeTab === 1 && <PositionMasterTab />}
      </CardContent>
    </Card>
  )
}

export default OrganizationView
