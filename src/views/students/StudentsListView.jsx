'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
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
import Grid from '@mui/material/Grid'
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
import Box from '@mui/material/Box'
import { useForm, Controller } from 'react-hook-form'
import {
  createColumnHelper, flexRender, getCoreRowModel,
  useReactTable, getSortedRowModel
} from '@tanstack/react-table'
import CustomAvatar from '@core/components/mui/Avatar'
import { getInitials } from '@/utils/getInitials'
import { studentsApi } from '@/libs/api/studentsApi'
import { syndicateApi, batchApi, academicStatusApi } from '@/libs/api/masterDataApi'
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

const StudentsListView = () => {
  const router = useRouter()
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [globalFilter, setGlobalFilter] = useState('')
  const [syndicateFilter, setSyndicateFilter] = useState('')
  const [batchFilter, setBatchFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  // Summary counts
  const [summary, setSummary] = useState({ total: 0, active: 0, inactive: 0 })

  // Master data options
  const [syndicates, setSyndicates] = useState([])
  const [batches, setBatches] = useState([])
  const [academicStatuses, setAcademicStatuses] = useState([])

  // Detail drawer
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailData, setDetailData] = useState(null)

  // Edit drawer
  const [editOpen, setEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [editLoading, setEditLoading] = useState(false)

  // Toggle active dialog
  const [toggleOpen, setToggleOpen] = useState(false)
  const [toggleTarget, setToggleTarget] = useState(null)
  const [toggleLoading, setToggleLoading] = useState(false)

  // Toast
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })
  const showToast = useCallback((message, severity = 'success') => {
    setToast({ open: true, message, severity })
  }, [])

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      syndicate_id: '', batch_id: '', academic_status_id: '',
      gender: '', religion: '', marital_status: '', phone: '', address: '', city: ''
    }
  })

  // Load master data
  useEffect(() => {
    syndicateApi.getAllActive().then(r => setSyndicates(r.data.data || [])).catch(() => {})
    batchApi.getAllActive().then(r => setBatches(r.data.data || [])).catch(() => {})
    academicStatusApi.getAllActive().then(r => setAcademicStatuses(r.data.data || [])).catch(() => {})
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page: page + 1, page_size: pageSize }
      if (globalFilter) params.search = globalFilter
      if (syndicateFilter) params.syndicate_id = syndicateFilter
      if (batchFilter) params.batch_id = batchFilter
      if (statusFilter !== '') params.is_active = statusFilter
      const res = await studentsApi.getAll(params)
      const students = res.data.data.data || []
      const pagination = res.data.data.pagination || {}
      setData(students)
      setTotal(pagination.total || 0)
      // Hitung summary dari response
      setSummary(prev => ({ ...prev, total: pagination.total || 0 }))
    } catch (err) {
      showToast(err.message || 'Gagal memuat data', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, globalFilter, syndicateFilter, batchFilter, statusFilter, showToast])

  useEffect(() => { fetchData() }, [fetchData])

  const handleOpenEdit = useCallback((student) => {
    setEditTarget(student)
    reset({
      syndicate_id: student.student_profile?.syndicate_id || '',
      batch_id: student.student_profile?.batch_id || '',
      academic_status_id: student.student_profile?.academic_status_id || '',
      gender: student.student_profile?.gender || '',
      religion: student.student_profile?.religion || '',
      marital_status: student.student_profile?.marital_status || '',
      phone: student.student_profile?.phone || '',
      address: student.student_profile?.address || '',
      city: student.student_profile?.city || '',
    })
    setEditOpen(true)
  }, [reset])

  const handleEdit = useCallback(async (values) => {
    setEditLoading(true)
    try {
      await studentsApi.update(editTarget.id, {
        syndicate_id: parseInt(values.syndicate_id),
        batch_id: parseInt(values.batch_id),
        academic_status_id: parseInt(values.academic_status_id),
        gender: values.gender,
        religion: values.religion,
        marital_status: values.marital_status,
        phone: values.phone || null,
        address: values.address || null,
        city: values.city || null,
      })
      showToast('Data mahasiswa berhasil diperbarui')
      setEditOpen(false)
      fetchData()
    } catch (err) {
      showToast(err.message || 'Gagal memperbarui data', 'error')
    } finally {
      setEditLoading(false)
    }
  }, [editTarget, fetchData, showToast])

  const handleToggleActive = useCallback(async () => {
    setToggleLoading(true)
    try {
      await studentsApi.toggleActive(toggleTarget.id)
      showToast(`Akun mahasiswa berhasil ${toggleTarget.is_active ? 'dinonaktifkan' : 'diaktifkan'}`)
      setToggleOpen(false)
      fetchData()
    } catch (err) {
      showToast(err.message || 'Gagal mengubah status', 'error')
    } finally {
      setToggleLoading(false)
    }
  }, [toggleTarget, fetchData, showToast])

  const columns = useMemo(() => [
    columnHelper.accessor('full_name', {
      header: 'Mahasiswa',
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
    columnHelper.accessor('student_profile.nim', {
      header: 'NIM',
      cell: ({ row }) => (
        <Typography variant='body2' className='font-medium'>
          {row.original.student_profile?.nim || '-'}
        </Typography>
      )
    }),
    columnHelper.accessor('student_profile.syndicate', {
      header: 'Sindikat',
      cell: ({ row }) => (
        <Chip
          label={row.original.student_profile?.syndicate?.name || '-'}
          size='small' variant='tonal' color='primary'
        />
      )
    }),
    columnHelper.accessor('student_profile.batch', {
      header: 'Angkatan',
      cell: ({ row }) => (
        <Typography variant='body2'>
          {row.original.student_profile?.batch?.year || '-'}
        </Typography>
      )
    }),
    columnHelper.accessor('student_profile.academic_status', {
      header: 'Status Akademik',
      cell: ({ row }) => (
        <Typography variant='body2'>
          {row.original.student_profile?.academic_status?.name || '-'}
        </Typography>
      )
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
          <Tooltip title='Lihat Profil & Nilai'>
            <IconButton size='small' color='primary' onClick={() => router.push(`/students/${row.original.id}`)}>
              <i className='ri-user-line' />
            </IconButton>
          </Tooltip>
          <Tooltip title='Detail'>
            <IconButton size='small' onClick={() => { setDetailData(row.original); setDetailOpen(true) }}>
              <i className='ri-eye-line text-[22px]' />
            </IconButton>
          </Tooltip>
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
      {/* ── Stats Cards ── */}
      <Grid container spacing={6} className='mb-6'>
        {[
          { title: 'Total Mahasiswa', value: total, icon: 'ri-group-line', color: 'primary' },
          { title: 'Aktif', value: summary.active, icon: 'ri-user-follow-line', color: 'success' },
          { title: 'Nonaktif', value: summary.inactive, icon: 'ri-user-unfollow-line', color: 'error' },
        ].map((stat, i) => (
          <Grid item xs={12} sm={4} key={i}>
            <Card>
              <CardContent className='flex justify-between gap-1'>
                <div className='flex flex-col gap-1'>
                  <Typography color='text.secondary'>{stat.title}</Typography>
                  <Typography variant='h4'>{stat.value}</Typography>
                </div>
                <CustomAvatar color={stat.color} skin='light' variant='rounded' size={42}>
                  <i className={`${stat.icon} text-[26px]`} />
                </CustomAvatar>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Table Card ── */}
      <Card>
        <CardHeader title='Daftar Mahasiswa' sx={{ pb: 0 }} />
        <div className='flex flex-wrap justify-between gap-4 p-6'>
          <div className='flex flex-wrap items-center gap-4'>
            <FormControl size='small' sx={{ minWidth: 140 }}>
              <InputLabel>Sindikat</InputLabel>
              <Select label='Sindikat' value={syndicateFilter} onChange={e => { setSyndicateFilter(e.target.value); setPage(0) }}>
                <MenuItem value=''>Semua</MenuItem>
                {syndicates.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size='small' sx={{ minWidth: 130 }}>
              <InputLabel>Angkatan</InputLabel>
              <Select label='Angkatan' value={batchFilter} onChange={e => { setBatchFilter(e.target.value); setPage(0) }}>
                <MenuItem value=''>Semua</MenuItem>
                {batches.map(b => <MenuItem key={b.id} value={b.id}>{b.year}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size='small' sx={{ minWidth: 120 }}>
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
            placeholder='Cari nama, NIM...'
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
              <tr><td colSpan={columns.length} className='text-center py-10'><Typography color='text.secondary'>Tidak ada data mahasiswa</Typography></td></tr>
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

      {/* ── Detail Drawer ── */}
      <Drawer open={detailOpen} anchor='right' variant='temporary' onClose={() => setDetailOpen(false)}
              ModalProps={{ keepMounted: true }} sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 440 } } }}>
        <div className='flex items-center justify-between pli-6 plb-5'>
          <Typography variant='h5'>Detail Mahasiswa</Typography>
          <IconButton onClick={() => setDetailOpen(false)}><i className='ri-close-line text-2xl' /></IconButton>
        </div>
        <Divider />
        {detailData && (
          <div className='p-6 flex flex-col gap-6'>
            {/* Profile header */}
            <div className='flex flex-col items-center gap-3'>
              <CustomAvatar skin='light' color='primary' size={80} className='text-3xl'>
                {getInitials(detailData.full_name)}
              </CustomAvatar>
              <div className='text-center'>
                <Typography variant='h5'>{detailData.full_name}</Typography>
                <Typography variant='body2' color='text.secondary'>{detailData.student_profile?.nim}</Typography>
              </div>
              <div className='flex gap-2'>
                <Chip
                  label={detailData.is_active ? 'Aktif' : 'Nonaktif'}
                  color={detailData.is_active ? 'success' : 'secondary'}
                  size='small' variant='tonal'
                />
                <Chip
                  label={detailData.student_profile?.academic_status?.name || '-'}
                  size='small' variant='tonal' color='info'
                />
              </div>
            </div>
            <Divider />
            {/* Akademik */}
            <div>
              <Typography variant='subtitle2' color='text.secondary' className='mb-3 uppercase tracking-wider text-xs'>
                Informasi Akademik
              </Typography>
              <div className='flex flex-col gap-2'>
                {[
                  { label: 'Sindikat', value: detailData.student_profile?.syndicate?.name || '-', icon: 'ri-team-line' },
                  { label: 'Angkatan', value: detailData.student_profile?.batch?.year || '-', icon: 'ri-calendar-line' },
                  { label: 'Status Akademik', value: detailData.student_profile?.academic_status?.name || '-', icon: 'ri-graduation-cap-line' },
                ].map(({ label, value, icon }) => (
                  <Box key={label} className='flex items-center gap-3'>
                    <CustomAvatar skin='light' color='primary' variant='rounded' size={32}>
                      <i className={`${icon} text-base`} />
                    </CustomAvatar>
                    <div>
                      <Typography variant='caption' color='text.secondary'>{label}</Typography>
                      <Typography variant='body2' className='font-medium'>{value}</Typography>
                    </div>
                  </Box>
                ))}
              </div>
            </div>
            <Divider />
            {/* Personal */}
            <div>
              <Typography variant='subtitle2' color='text.secondary' className='mb-3 uppercase tracking-wider text-xs'>
                Informasi Personal
              </Typography>
              <div className='flex flex-col gap-2'>
                {[
                  { label: 'Email', value: detailData.email || '-', icon: 'ri-mail-line' },
                  { label: 'Telepon', value: detailData.student_profile?.phone || '-', icon: 'ri-phone-line' },
                  { label: 'Tempat Lahir', value: detailData.student_profile?.birth_place || '-', icon: 'ri-map-pin-line' },
                  { label: 'Tanggal Lahir', value: detailData.student_profile?.birth_date ? new Date(detailData.student_profile.birth_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-', icon: 'ri-cake-line' },
                  { label: 'Jenis Kelamin', value: detailData.student_profile?.gender === 'M' ? 'Laki-laki' : detailData.student_profile?.gender === 'F' ? 'Perempuan' : '-', icon: 'ri-user-line' },
                  { label: 'Agama', value: detailData.student_profile?.religion || '-', icon: 'ri-heart-line' },
                  { label: 'Kota', value: detailData.student_profile?.city || '-', icon: 'ri-building-line' },
                ].map(({ label, value, icon }) => (
                  <Box key={label} className='flex items-center gap-3'>
                    <CustomAvatar skin='light' color='secondary' variant='rounded' size={32}>
                      <i className={`${icon} text-base`} />
                    </CustomAvatar>
                    <div>
                      <Typography variant='caption' color='text.secondary'>{label}</Typography>
                      <Typography variant='body2' className='font-medium'>{value}</Typography>
                    </div>
                  </Box>
                ))}
              </div>
            </div>
            <div className='flex gap-3 mt-2'>
              <Button fullWidth variant='contained'
                      startIcon={<i className='ri-edit-line' />}
                      onClick={() => { setDetailOpen(false); handleOpenEdit(detailData) }}>
                Edit Data
              </Button>
              <Button fullWidth variant='tonal'
                      color={detailData.is_active ? 'error' : 'success'}
                      onClick={() => { setDetailOpen(false); setToggleTarget(detailData); setToggleOpen(true) }}>
                {detailData.is_active ? 'Nonaktifkan' : 'Aktifkan'}
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* ── Edit Drawer ── */}
      <Drawer open={editOpen} anchor='right' variant='temporary' onClose={() => setEditOpen(false)}
              ModalProps={{ keepMounted: true }} sx={{ '& .MuiDrawer-paper': { width: { xs: 320, sm: 480 } } }}>
        <div className='flex items-center justify-between pli-6 plb-5'>
          <div>
            <Typography variant='h5'>Edit Data Mahasiswa</Typography>
            {editTarget && <Typography variant='body2' color='text.secondary'>{editTarget.full_name}</Typography>}
          </div>
          <IconButton onClick={() => setEditOpen(false)}><i className='ri-close-line text-2xl' /></IconButton>
        </div>
        <Divider />
        <div className='p-6'>
          <form onSubmit={handleSubmit(handleEdit)} className='flex flex-col gap-5'>
            <Typography variant='subtitle2' color='text.secondary' className='uppercase tracking-wider text-xs'>
              Data Akademik
            </Typography>
            <Controller name='syndicate_id' control={control} rules={{ required: 'Wajib dipilih' }}
                        render={({ field }) => (
                          <FormControl fullWidth error={!!errors.syndicate_id}>
                            <InputLabel>Sindikat</InputLabel>
                            <Select {...field} label='Sindikat'>
                              {syndicates.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                            </Select>
                          </FormControl>
                        )}
            />
            <Controller name='batch_id' control={control} rules={{ required: 'Wajib dipilih' }}
                        render={({ field }) => (
                          <FormControl fullWidth error={!!errors.batch_id}>
                            <InputLabel>Angkatan</InputLabel>
                            <Select {...field} label='Angkatan'>
                              {batches.map(b => <MenuItem key={b.id} value={b.id}>{b.name} ({b.year})</MenuItem>)}
                            </Select>
                          </FormControl>
                        )}
            />
            <Controller name='academic_status_id' control={control} rules={{ required: 'Wajib dipilih' }}
                        render={({ field }) => (
                          <FormControl fullWidth error={!!errors.academic_status_id}>
                            <InputLabel>Status Akademik</InputLabel>
                            <Select {...field} label='Status Akademik'>
                              {academicStatuses.map(a => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
                            </Select>
                          </FormControl>
                        )}
            />
            <Divider><Typography variant='caption' color='text.secondary'>Data Personal</Typography></Divider>
            <Grid container spacing={3}>
              <Grid item xs={6}>
                <Controller name='gender' control={control} rules={{ required: 'Wajib dipilih' }}
                            render={({ field }) => (
                              <FormControl fullWidth>
                                <InputLabel>Jenis Kelamin</InputLabel>
                                <Select {...field} label='Jenis Kelamin'>
                                  <MenuItem value='M'>Laki-laki</MenuItem>
                                  <MenuItem value='F'>Perempuan</MenuItem>
                                </Select>
                              </FormControl>
                            )}
                />
              </Grid>
              <Grid item xs={6}>
                <Controller name='marital_status' control={control} rules={{ required: 'Wajib dipilih' }}
                            render={({ field }) => (
                              <FormControl fullWidth>
                                <InputLabel>Status Pernikahan</InputLabel>
                                <Select {...field} label='Status Pernikahan'>
                                  <MenuItem value='SINGLE'>Belum Menikah</MenuItem>
                                  <MenuItem value='MARRIED'>Menikah</MenuItem>
                                </Select>
                              </FormControl>
                            )}
                />
              </Grid>
            </Grid>
            <Controller name='religion' control={control} rules={{ required: 'Wajib dipilih' }}
                        render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel>Agama</InputLabel>
                            <Select {...field} label='Agama'>
                              {['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'].map(r => (
                                <MenuItem key={r} value={r}>{r}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
            />
            <Controller name='phone' control={control}
                        render={({ field }) => (
                          <TextField {...field} fullWidth label='Nomor Telepon' placeholder='08xxx' />
                        )}
            />
            <Controller name='city' control={control}
                        render={({ field }) => (
                          <TextField {...field} fullWidth label='Kota' placeholder='Jakarta' />
                        )}
            />
            <Controller name='address' control={control}
                        render={({ field }) => (
                          <TextField {...field} fullWidth multiline rows={2} label='Alamat' placeholder='Jl. ...' />
                        )}
            />
            <div className='flex gap-4 mt-2'>
              <Button fullWidth type='submit' variant='contained' disabled={editLoading}
                      startIcon={editLoading ? <CircularProgress size={16} color='inherit' /> : null}>
                {editLoading ? 'Menyimpan...' : 'Simpan'}
              </Button>
              <Button fullWidth variant='tonal' color='secondary' onClick={() => setEditOpen(false)} disabled={editLoading}>
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
              ? `Nonaktifkan akun ${toggleTarget?.full_name}? Mahasiswa tidak bisa login selama akun nonaktif.`
              : `Aktifkan kembali akun ${toggleTarget?.full_name}?`
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions className='pli-5 plb-4'>
          <Button onClick={() => setToggleOpen(false)} variant='tonal' color='secondary' disabled={toggleLoading}>
            Batal
          </Button>
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

      {/* ── Toast ── */}
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

export default StudentsListView
