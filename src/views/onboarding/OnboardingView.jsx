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
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import { useForm, Controller } from 'react-hook-form'
import {
  createColumnHelper, flexRender, getCoreRowModel,
  useReactTable, getSortedRowModel
} from '@tanstack/react-table'
import { onboardingApi, telegramAdminApi } from '@/libs/api/onboardingApi'
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

const statusMap = {
  PENDING: { label: 'Menunggu', color: 'warning' },
  APPROVED: { label: 'Disetujui', color: 'success' },
  REJECTED: { label: 'Ditolak', color: 'error' },
}

const OnboardingView = () => {
  // ── Table state ──
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [globalFilter, setGlobalFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  // ── Master data options ──
  const [syndicates, setSyndicates] = useState([])
  const [batches, setBatches] = useState([])
  const [academicStatuses, setAcademicStatuses] = useState([])

  // ── Approve drawer ──
  const [approveOpen, setApproveOpen] = useState(false)
  const [approveTarget, setApproveTarget] = useState(null)
  const [approveLoading, setApproveLoading] = useState(false)

  // ── Reject dialog ──
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectLoading, setRejectLoading] = useState(false)

  // ── Detail drawer ──
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailData, setDetailData] = useState(null)

  // ── Register Telegram drawer ──
  const [telegramDrawerOpen, setTelegramDrawerOpen] = useState(false)
  const [telegramForm, setTelegramForm] = useState({ telegram_user_id: '', telegram_username: '' })
  const [telegramLoading, setTelegramLoading] = useState(false)

  // ── Toast ──
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })
  const showToast = useCallback((message, severity = 'success') => {
    setToast({ open: true, message, severity })
  }, [])

  // ── Forms ──
  const {
    control: approveControl,
    handleSubmit: handleApproveSubmit,
    reset: resetApprove,
    formState: { errors: approveErrors }
  } = useForm({
    defaultValues: {
      syndicate_id: '', batch_id: '', academic_status_id: '',
      nim: '', gender: 'M', religion: 'Islam', marital_status: 'SINGLE'
    }
  })

  const {
    control: rejectControl,
    handleSubmit: handleRejectSubmit,
    reset: resetReject,
    formState: { errors: rejectErrors }
  } = useForm({
    defaultValues: { reason: '' }
  })

  // ── Load master data options ──
  useEffect(() => {
    syndicateApi.getAllActive().then(r => setSyndicates(r.data.data || [])).catch(() => {})
    batchApi.getAllActive().then(r => setBatches(r.data.data || [])).catch(() => {})
    academicStatusApi.getAllActive().then(r => setAcademicStatuses(r.data.data || [])).catch(() => {})
  }, [])

  // ── Fetch registrations ──
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page: page + 1, page_size: pageSize }
      if (globalFilter) params.search = globalFilter
      if (statusFilter) params.status = statusFilter
      const res = await onboardingApi.getAll(params)
      setData(res.data.data.data || [])
      setTotal(res.data.data.pagination?.total || 0)
    } catch (err) {
      showToast(err.message || 'Gagal memuat data', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, globalFilter, statusFilter, showToast])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Handlers ──
  const handleOpenApprove = useCallback((row) => {
    setApproveTarget(row)
    resetApprove({
      syndicate_id: '', batch_id: '', academic_status_id: '',
      nim: row.nim, gender: 'M', religion: 'Islam', marital_status: 'SINGLE',
    })
    setApproveOpen(true)
  }, [resetApprove])

  const handleOpenReject = useCallback((row) => {
    setRejectTarget(row)
    resetReject({ reason: '' })
    setRejectOpen(true)
  }, [resetReject])

  const handleApprove = useCallback(async (values) => {
    setApproveLoading(true)
    try {
      await onboardingApi.approve(approveTarget.id, {
        syndicate_id: parseInt(values.syndicate_id),
        batch_id: parseInt(values.batch_id),
        academic_status_id: parseInt(values.academic_status_id),
        nim: values.nim,
        gender: values.gender,
        religion: values.religion,
        marital_status: values.marital_status,
      })
      showToast('Registrasi disetujui dan akun berhasil dibuat')
      setApproveOpen(false)
      fetchData()
    } catch (err) {
      showToast(err.message || 'Gagal menyetujui', 'error')
    } finally {
      setApproveLoading(false)
    }
  }, [approveTarget, fetchData, showToast])

  const handleReject = useCallback(async (values) => {
    setRejectLoading(true)
    try {
      await onboardingApi.reject(rejectTarget.id, { reason: values.reason })
      showToast('Registrasi berhasil ditolak')
      setRejectOpen(false)
      fetchData()
    } catch (err) {
      showToast(err.message || 'Gagal menolak', 'error')
    } finally {
      setRejectLoading(false)
    }
  }, [rejectTarget, fetchData, showToast])

  const handleRegisterTelegram = useCallback(async () => {
    if (!telegramForm.telegram_user_id) return
    setTelegramLoading(true)
    try {
      await telegramAdminApi.registerAdmin({
        telegram_user_id: parseInt(telegramForm.telegram_user_id),
        telegram_username: telegramForm.telegram_username || null,
      })
      showToast('Telegram berhasil didaftarkan untuk notifikasi')
      setTelegramDrawerOpen(false)
      setTelegramForm({ telegram_user_id: '', telegram_username: '' })
    } catch (err) {
      showToast(err.message || 'Gagal mendaftarkan Telegram', 'error')
    } finally {
      setTelegramLoading(false)
    }
  }, [telegramForm, showToast])

  // ── Columns ──
  const columns = useMemo(() => [
    columnHelper.accessor('full_name', {
      header: 'Nama',
      cell: ({ row }) => (
        <div>
          <Typography className='font-medium' color='text.primary'>{row.original.full_name}</Typography>
          <Typography variant='body2' color='text.secondary'>{row.original.nim}</Typography>
        </div>
      )
    }),
    columnHelper.accessor('email', {
      header: 'Kontak',
      cell: ({ row }) => (
        <div>
          <Typography variant='body2'>{row.original.email}</Typography>
          <Typography variant='body2' color='text.secondary'>{row.original.phone}</Typography>
        </div>
      )
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: ({ row }) => {
        const s = statusMap[row.original.status] || { label: row.original.status, color: 'default' }
        return <Chip label={s.label} color={s.color} size='small' variant='tonal' />
      }
    }),
    columnHelper.accessor('created_at', {
      header: 'Tanggal Daftar',
      cell: ({ row }) => (
        <Typography variant='body2'>
          {new Date(row.original.created_at).toLocaleDateString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric'
          })}
        </Typography>
      )
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <div className='flex items-center gap-0.5'>
          <Tooltip title='Lihat Detail'>
            <IconButton size='small' onClick={() => { setDetailData(row.original); setDetailOpen(true) }}>
              <i className='ri-eye-line text-[22px]' />
            </IconButton>
          </Tooltip>
          {row.original.status === 'PENDING' && (
            <>
              <Tooltip title='Setujui'>
                <IconButton size='small' color='success' onClick={() => handleOpenApprove(row.original)}>
                  <i className='ri-checkbox-circle-line text-[22px]' />
                </IconButton>
              </Tooltip>
              <Tooltip title='Tolak'>
                <IconButton size='small' color='error' onClick={() => handleOpenReject(row.original)}>
                  <i className='ri-close-circle-line text-[22px]' />
                </IconButton>
              </Tooltip>
            </>
          )}
        </div>
      )
    })
  ], [handleOpenApprove, handleOpenReject])

  const table = useReactTable({
    data, columns, manualPagination: true, manualFiltering: true,
    rowCount: total, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel()
  })

  return (
    <>
      {/* ── Main Card ── */}
      <Card>
        <CardHeader
          title='Onboarding Mahasiswa'
          subheader='Kelola pendaftaran mahasiswa via Telegram'
          sx={{ pb: 0 }}
          action={
            <Button
              variant='tonal'
              color='secondary'
              startIcon={<i className='ri-telegram-line' />}
              onClick={() => setTelegramDrawerOpen(true)}
            >
              Daftarkan Telegram Saya
            </Button>
          }
        />
        <div className='flex flex-wrap justify-between gap-4 p-6'>
          <FormControl size='small' sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select label='Status' value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0) }}>
              <MenuItem value=''>Semua</MenuItem>
              <MenuItem value='PENDING'>Menunggu</MenuItem>
              <MenuItem value='APPROVED'>Disetujui</MenuItem>
              <MenuItem value='REJECTED'>Ditolak</MenuItem>
            </Select>
          </FormControl>
          <DebouncedInput
            value={globalFilter}
            onChange={val => { setGlobalFilter(val); setPage(0) }}
            placeholder='Cari nama, NIM, email...'
            InputProps={{ startAdornment: <InputAdornment position='start'><i className='ri-search-line' /></InputAdornment> }}
            sx={{ minWidth: 260 }}
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
              <tr><td colSpan={columns.length} className='text-center py-10'><Typography color='text.secondary'>Tidak ada data</Typography></td></tr>
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
              ModalProps={{ keepMounted: true }} sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 420 } } }}>
        <div className='flex items-center justify-between pli-6 plb-5'>
          <Typography variant='h5'>Detail Pendaftaran</Typography>
          <IconButton onClick={() => setDetailOpen(false)}><i className='ri-close-line text-2xl' /></IconButton>
        </div>
        <Divider />
        {detailData && (
          <div className='p-6 flex flex-col gap-4'>
            <Box className='flex items-center justify-between'>
              <Typography variant='body2' color='text.secondary'>Status</Typography>
              <Chip
                label={statusMap[detailData.status]?.label || detailData.status}
                color={statusMap[detailData.status]?.color || 'default'}
                size='small' variant='tonal'
              />
            </Box>
            <Divider />
            {[
              { label: 'NIM', value: detailData.nim },
              { label: 'Nama Lengkap', value: detailData.full_name },
              { label: 'Tempat Lahir', value: detailData.birth_place },
              { label: 'Tanggal Lahir', value: detailData.birth_date ? new Date(detailData.birth_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-' },
              { label: 'Telepon', value: detailData.phone },
              { label: 'Email', value: detailData.email },
              { label: 'Telegram', value: detailData.telegram_username ? `@${detailData.telegram_username}` : '-' },
              { label: 'Tanggal Daftar', value: new Date(detailData.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) },
            ].map(({ label, value }) => (
              <Box key={label} className='flex items-start justify-between gap-4'>
                <Typography variant='body2' color='text.secondary' sx={{ minWidth: 130 }}>{label}</Typography>
                <Typography variant='body2' className='text-right'>{value}</Typography>
              </Box>
            ))}
            {detailData.rejection_reason && (
              <>
                <Divider />
                <Box>
                  <Typography variant='body2' color='text.secondary' className='mb-1'>Alasan Penolakan</Typography>
                  <Typography variant='body2' color='error'>{detailData.rejection_reason}</Typography>
                </Box>
              </>
            )}
            {detailData.status === 'PENDING' && (
              <div className='flex gap-3 mt-2'>
                <Button fullWidth variant='contained' color='success'
                        startIcon={<i className='ri-checkbox-circle-line' />}
                        onClick={() => { setDetailOpen(false); handleOpenApprove(detailData) }}>
                  Setujui
                </Button>
                <Button fullWidth variant='tonal' color='error'
                        startIcon={<i className='ri-close-circle-line' />}
                        onClick={() => { setDetailOpen(false); handleOpenReject(detailData) }}>
                  Tolak
                </Button>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* ── Approve Drawer ── */}
      <Drawer open={approveOpen} anchor='right' variant='temporary' onClose={() => setApproveOpen(false)}
              ModalProps={{ keepMounted: true }} sx={{ '& .MuiDrawer-paper': { width: { xs: 320, sm: 480 } } }}>
        <div className='flex items-center justify-between pli-6 plb-5'>
          <div>
            <Typography variant='h5'>Setujui Pendaftaran</Typography>
            {approveTarget && <Typography variant='body2' color='text.secondary'>{approveTarget.full_name}</Typography>}
          </div>
          <IconButton onClick={() => setApproveOpen(false)}><i className='ri-close-line text-2xl' /></IconButton>
        </div>
        <Divider />
        <div className='p-6'>
          <form onSubmit={handleApproveSubmit(handleApprove)} className='flex flex-col gap-5'>
            <Box className='p-4 rounded-lg' sx={{ bgcolor: 'action.hover' }}>
              <Typography variant='body2' color='text.secondary' className='mb-2'>Data dari mahasiswa</Typography>
              <Grid container spacing={1}>
                {[
                  ['Tempat Lahir', approveTarget?.birth_place],
                  ['Tanggal Lahir', approveTarget?.birth_date ? new Date(approveTarget.birth_date).toLocaleDateString('id-ID') : '-'],
                  ['Telepon', approveTarget?.phone],
                  ['Email', approveTarget?.email],
                ].map(([label, value]) => (
                  <Grid item xs={6} key={label}>
                    <Typography variant='caption' color='text.secondary'>{label}</Typography>
                    <Typography variant='body2'>{value}</Typography>
                  </Grid>
                ))}
              </Grid>
            </Box>
            <Divider><Typography variant='caption' color='text.secondary'>Lengkapi data berikut</Typography></Divider>
            <Controller name='nim' control={approveControl} rules={{ required: 'NIM wajib diisi' }}
                        render={({ field }) => (
                          <TextField {...field} fullWidth label='NIM (konfirmasi/koreksi)'
                                     error={!!approveErrors.nim} helperText={approveErrors.nim?.message} />
                        )}
            />
            <Controller name='syndicate_id' control={approveControl} rules={{ required: 'Sindikat wajib dipilih' }}
                        render={({ field }) => (
                          <FormControl fullWidth error={!!approveErrors.syndicate_id}>
                            <InputLabel>Sindikat</InputLabel>
                            <Select {...field} label='Sindikat'>
                              {syndicates.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                            </Select>
                            {approveErrors.syndicate_id && <Typography variant='caption' color='error' sx={{ ml: 1.75, mt: 0.5 }}>{approveErrors.syndicate_id.message}</Typography>}
                          </FormControl>
                        )}
            />
            <Controller name='batch_id' control={approveControl} rules={{ required: 'Angkatan wajib dipilih' }}
                        render={({ field }) => (
                          <FormControl fullWidth error={!!approveErrors.batch_id}>
                            <InputLabel>Angkatan</InputLabel>
                            <Select {...field} label='Angkatan'>
                              {batches.map(b => <MenuItem key={b.id} value={b.id}>{b.name} ({b.year})</MenuItem>)}
                            </Select>
                            {approveErrors.batch_id && <Typography variant='caption' color='error' sx={{ ml: 1.75, mt: 0.5 }}>{approveErrors.batch_id.message}</Typography>}
                          </FormControl>
                        )}
            />
            <Controller name='academic_status_id' control={approveControl} rules={{ required: 'Status akademik wajib dipilih' }}
                        render={({ field }) => (
                          <FormControl fullWidth error={!!approveErrors.academic_status_id}>
                            <InputLabel>Status Akademik</InputLabel>
                            <Select {...field} label='Status Akademik'>
                              {academicStatuses.map(a => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
                            </Select>
                            {approveErrors.academic_status_id && <Typography variant='caption' color='error' sx={{ ml: 1.75, mt: 0.5 }}>{approveErrors.academic_status_id.message}</Typography>}
                          </FormControl>
                        )}
            />
            <Grid container spacing={3}>
              <Grid item xs={6}>
                <Controller name='gender' control={approveControl} rules={{ required: 'Wajib dipilih' }}
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
                <Controller name='marital_status' control={approveControl} rules={{ required: 'Wajib dipilih' }}
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
            <Controller name='religion' control={approveControl} rules={{ required: 'Agama wajib diisi' }}
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
            <div className='flex gap-4 mt-2'>
              <Button fullWidth type='submit' variant='contained' color='success' disabled={approveLoading}
                      startIcon={approveLoading ? <CircularProgress size={16} color='inherit' /> : <i className='ri-checkbox-circle-line' />}>
                {approveLoading ? 'Memproses...' : 'Setujui & Buat Akun'}
              </Button>
              <Button fullWidth variant='tonal' color='secondary' onClick={() => setApproveOpen(false)} disabled={approveLoading}>
                Batal
              </Button>
            </div>
          </form>
        </div>
      </Drawer>

      {/* ── Reject Dialog ── */}
      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Tolak Pendaftaran</DialogTitle>
        <DialogContent>
          <DialogContentText className='mb-4'>
            Tolak pendaftaran <strong>{rejectTarget?.full_name}</strong> ({rejectTarget?.nim})?
            Mahasiswa akan mendapat notifikasi via Telegram.
          </DialogContentText>
          <form id='reject-form' onSubmit={handleRejectSubmit(handleReject)}>
            <Controller name='reason' control={rejectControl}
                        rules={{ required: 'Alasan wajib diisi', minLength: { value: 5, message: 'Minimal 5 karakter' } }}
                        render={({ field }) => (
                          <TextField {...field} fullWidth multiline rows={3} label='Alasan Penolakan'
                                     placeholder='Tuliskan alasan penolakan yang jelas untuk mahasiswa...'
                                     error={!!rejectErrors.reason} helperText={rejectErrors.reason?.message} />
                        )}
            />
          </form>
        </DialogContent>
        <DialogActions className='pli-5 plb-4'>
          <Button onClick={() => setRejectOpen(false)} variant='tonal' color='secondary' disabled={rejectLoading}>Batal</Button>
          <Button type='submit' form='reject-form' variant='contained' color='error' disabled={rejectLoading}
                  startIcon={rejectLoading ? <CircularProgress size={16} color='inherit' /> : null}>
            {rejectLoading ? 'Memproses...' : 'Tolak Pendaftaran'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Register Telegram Drawer ── */}
      <Drawer open={telegramDrawerOpen} anchor='right' variant='temporary'
              onClose={() => setTelegramDrawerOpen(false)}
              ModalProps={{ keepMounted: true }}
              sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}>
        <div className='flex items-center justify-between pli-6 plb-5'>
          <div>
            <Typography variant='h5'>Daftarkan Telegram</Typography>
            <Typography variant='body2' color='text.secondary'>Untuk menerima notifikasi registrasi baru</Typography>
          </div>
          <IconButton onClick={() => setTelegramDrawerOpen(false)}><i className='ri-close-line text-2xl' /></IconButton>
        </div>
        <Divider />
        <div className='p-6 flex flex-col gap-5'>
          <Alert severity='info' variant='tonal'>
            Cara mendapatkan Telegram User ID: buka Telegram, cari <strong>@userinfobot</strong>, lalu kirim pesan apapun. Bot akan membalas dengan ID kamu.
          </Alert>
          <TextField
            fullWidth
            label='Telegram User ID'
            type='number'
            value={telegramForm.telegram_user_id}
            onChange={e => setTelegramForm(f => ({ ...f, telegram_user_id: e.target.value }))}
            placeholder='Contoh: 123456789'
          />
          <TextField
            fullWidth
            label='Username Telegram (opsional)'
            value={telegramForm.telegram_username}
            onChange={e => setTelegramForm(f => ({ ...f, telegram_username: e.target.value }))}
            placeholder='Contoh: ayubi (tanpa @)'
            InputProps={{
              startAdornment: <InputAdornment position='start'>@</InputAdornment>
            }}
          />
          <div className='flex gap-4 mt-2'>
            <Button fullWidth variant='contained' disabled={!telegramForm.telegram_user_id || telegramLoading}
                    onClick={handleRegisterTelegram}
                    startIcon={telegramLoading ? <CircularProgress size={16} color='inherit' /> : <i className='ri-telegram-line' />}>
              {telegramLoading ? 'Mendaftarkan...' : 'Daftarkan'}
            </Button>
            <Button fullWidth variant='tonal' color='secondary'
                    onClick={() => setTelegramDrawerOpen(false)} disabled={telegramLoading}>
              Batal
            </Button>
          </div>
        </div>
      </Drawer>

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

export default OnboardingView
