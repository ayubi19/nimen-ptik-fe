'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
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
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Snackbar from '@mui/material/Snackbar'
import Switch from '@mui/material/Switch'
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
import { studentsApi } from '@/libs/api/studentsApi'
import { syndicateApi, batchApi, academicStatusApi } from '@/libs/api/masterDataApi'

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

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  : '—'

// ── Mobile Card ───────────────────────────────────────────────────────────────
const StudentMobileCard = ({ student, onDetail, onEdit, onToggle, router }) => {
  const profile = student.student_profile
  return (
    <Card className='mb-3' sx={{ overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ px: 2, py: 1.5, bgcolor: 'action.hover' }}>
        <div className='flex items-center gap-2 justify-between'>
          <div className='flex items-center gap-2 flex-1 min-w-0'>
            <Avatar sx={{ width: 38, height: 38, fontSize: 13, flexShrink: 0, bgcolor: 'primary.main' }}>
              {getInitials(student.full_name)}
            </Avatar>
            <div className='min-w-0'>
              <Typography variant='body2' fontWeight={700} noWrap>{student.full_name}</Typography>
              <Typography variant='caption' color='text.secondary'>{profile?.nim || '—'}</Typography>
            </div>
          </div>
          <Chip label={student.is_active ? 'Aktif' : 'Nonaktif'}
                color={student.is_active ? 'success' : 'default'} size='small' variant='tonal' sx={{ flexShrink: 0 }} />
        </div>
      </Box>
      {/* Body */}
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Grid container spacing={1.5} className='mb-2'>
          {[
            { icon: 'ri-shield-star-line', label: 'Sindikat', value: profile?.syndicate?.name },
            { icon: 'ri-calendar-line',    label: 'Angkatan', value: profile?.batch?.year ? `${profile.batch.name} (${profile.batch.year})` : null },
            { icon: 'ri-graduation-cap-line', label: 'Status Akademik', value: profile?.academic_status?.name },
            { icon: 'ri-user-2-line',      label: 'Program', value: profile?.batch?.program_type },
          ].map(r => r.value ? (
            <Grid item xs={6} key={r.label}>
              <div className='flex items-center gap-1.5'>
                <i className={`${r.icon} text-xs`} style={{ color: 'var(--mui-palette-text-secondary)', flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <Typography variant='caption' color='text.secondary' sx={{ display: 'block', fontSize: 10 }}>{r.label}</Typography>
                  <Typography variant='caption' fontWeight={500} noWrap sx={{ display: 'block' }}>{r.value}</Typography>
                </div>
              </div>
            </Grid>
          ) : null)}
        </Grid>
        <Divider className='mb-1.5' />
        <div className='flex gap-1.5 flex-wrap'>
          <Button size='small' variant='tonal' color='primary'
                  startIcon={<i className='ri-user-line' />}
                  onClick={() => router.push(`/students/${student.id}`)}>
            Profil & Nilai
          </Button>
          <Button size='small' variant='tonal' color='secondary'
                  startIcon={<i className='ri-eye-line' />}
                  onClick={() => onDetail(student)}>
            Detail
          </Button>
          <Button size='small' variant='tonal' color='secondary'
                  startIcon={<i className='ri-edit-line' />}
                  onClick={() => onEdit(student)}>
            Edit
          </Button>
          <Button size='small' variant='tonal'
                  color={student.is_active ? 'error' : 'success'}
                  onClick={() => onToggle(student)}>
            {student.is_active ? 'Nonaktifkan' : 'Aktifkan'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Main View ─────────────────────────────────────────────────────────────────
const StudentsListView = () => {
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [data, setData]           = useState([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(false)
  const [globalFilter, setGlobalFilter] = useState('')
  const [syndicateFilter, setSyndicateFilter] = useState('')
  const [batchFilter, setBatchFilter]         = useState('')
  const [academicStatusFilter, setAcademicStatusFilter] = useState('')
  const [page, setPage]           = useState(0)
  const [pageSize, setPageSize]   = useState(10)

  const [syndicates, setSyndicates]         = useState([])
  const [batches, setBatches]               = useState([])
  const [academicStatuses, setAcademicStatuses] = useState([])

  const [detailOpen, setDetailOpen]   = useState(false)
  const [detailData, setDetailData]   = useState(null)
  const [editOpen, setEditOpen]       = useState(false)
  const [editTarget, setEditTarget]   = useState(null)
  const [editLoading, setEditLoading] = useState(false)
  const [toggleOpen, setToggleOpen]   = useState(false)
  const [toggleTarget, setToggleTarget] = useState(null)
  const [toggleLoading, setToggleLoading] = useState(false)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const showToast = useCallback((msg, severity = 'success') =>
    setToast({ open: true, message: msg, severity }), [])

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      syndicate_id: '', batch_id: '', academic_status_id: '',
      gender: '', religion: '', marital_status: '', phone: '', address: '', city: ''
    }
  })

  const [stats, setStats] = useState({ total: 0, s1: 0, s2: 0, active: 0, graduated: 0, dropout: 0 })

  useEffect(() => {
    syndicateApi.getAllActive().then(r => setSyndicates(r.data.data || [])).catch(() => {})
    batchApi.getAllActive().then(r => setBatches(r.data.data || [])).catch(() => {})
    academicStatusApi.getAllActive().then(r => setAcademicStatuses(r.data.data || [])).catch(() => {})

    // Fetch stats dari endpoint summary
    const fetchStats = async () => {
      try {
        const res = await studentsApi.getSummary()
        const d = res.data.data
        setStats({
          total:     d.total     || 0,
          s1:        d.s1        || 0,
          s2:        d.s2        || 0,
          active:    d.active    || 0,
          graduated: d.graduated || 0,
          dropout:   d.drop_out  || 0,
        })
      } catch {}
    }
    fetchStats()
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page: page + 1, page_size: pageSize }
      if (globalFilter)         params.search              = globalFilter
      if (syndicateFilter)      params.syndicate_id        = syndicateFilter
      if (batchFilter)          params.batch_id             = batchFilter
      if (academicStatusFilter) params.academic_status_id  = academicStatusFilter
      const res = await studentsApi.getAll(params)
      setData(res.data.data?.data || [])
      setTotal(res.data.data?.pagination?.total || 0)
    } catch (err) {
      showToast(err.message || 'Gagal memuat data', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, globalFilter, syndicateFilter, batchFilter, academicStatusFilter, showToast])

  useEffect(() => { fetchData() }, [fetchData])

  const handleOpenEdit = useCallback((student) => {
    setEditTarget(student)
    const p = student.student_profile
    reset({
      syndicate_id: p?.syndicate_id || '',
      batch_id: p?.batch_id || '',
      academic_status_id: p?.academic_status_id || '',
      gender: p?.gender || '',
      religion: p?.religion || '',
      marital_status: p?.marital_status || '',
      phone: p?.phone || '',
      address: p?.address || '',
      city: p?.city || '',
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
        gender: values.gender, religion: values.religion,
        marital_status: values.marital_status,
        phone: values.phone || null,
        address: values.address || null,
        city: values.city || null,
      })
      showToast('Data mahasiswa berhasil diperbarui')
      setEditOpen(false); fetchData()
    } catch (err) {
      showToast(err.message || 'Gagal memperbarui', 'error')
    } finally { setEditLoading(false) }
  }, [editTarget, fetchData, showToast])

  const handleToggleActive = useCallback(async () => {
    setToggleLoading(true)
    try {
      await studentsApi.toggleActive(toggleTarget.id)
      showToast(`Akun berhasil ${toggleTarget.is_active ? 'dinonaktifkan' : 'diaktifkan'}`)
      setToggleOpen(false); fetchData()
    } catch (err) {
      showToast(err.message || 'Gagal mengubah status', 'error')
    } finally { setToggleLoading(false) }
  }, [toggleTarget, fetchData, showToast])

  return (
    <>
      {/* Breadcrumb */}
      <div className='flex items-center gap-2 mb-6'>
        <Typography variant='caption' color='text.secondary'>Mahasiswa</Typography>
        <i className='ri-arrow-right-s-line text-sm opacity-50' />
        <Typography variant='caption' fontWeight={500} color='text.primary'>Daftar Mahasiswa</Typography>
      </div>

      {/* Stats — 6 card, 2 per row */}
      <Grid container spacing={4} className='mb-6'>
        {[
          { label: 'Total Mahasiswa', value: stats.total,     icon: 'ri-group-line',            color: '#7367F0', bg: '#F3EDFF' },
          { label: 'Mahasiswa S1',    value: stats.s1,        icon: 'ri-user-2-line',           color: '#00CFE8', bg: '#E0F9FC' },
          { label: 'Mahasiswa S2',    value: stats.s2,        icon: 'ri-user-star-line',        color: '#FF9F43', bg: '#FFF3E8' },
          { label: 'Aktif',           value: stats.active,    icon: 'ri-user-follow-line',      color: '#28C76F', bg: '#E6F9EE' },
          { label: 'Lulus',           value: stats.graduated, icon: 'ri-graduation-cap-line',   color: '#1E9BE9', bg: '#E8F4FE' },
          { label: 'Drop Out',        value: stats.dropout,   icon: 'ri-user-unfollow-line',    color: '#EA5455', bg: '#FFEDED' },
        ].map(s => (
          <Grid item xs={6} sm={4} key={s.label}>
            <Card>
              <CardContent sx={{ p: "0 !important" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: "12px", p: "12px" }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                    background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className={s.icon} style={{ fontSize: 20, color: s.color }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <Typography variant='h5' fontWeight={600} lineHeight={1.2}>{s.value}</Typography>
                    <Typography variant='caption' color='text.secondary'
                                sx={{ display: 'block', fontSize: { xs: 10, sm: 12 }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.label}
                    </Typography>
                  </div>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filter */}
      <Card className='mb-6'>
        <CardContent>
          <Grid container spacing={3}>
            {/* Row 1: Angkatan + Sindikat */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size='small'>
                <InputLabel>Angkatan</InputLabel>
                <Select label='Angkatan' value={batchFilter}
                        onChange={e => { setBatchFilter(e.target.value); setPage(0) }}
                        renderValue={val => {
                          const b = batches.find(x => x.id === val)
                          if (!b) return ''
                          return (
                            <div className='flex items-center justify-between gap-2'>
                              <Typography variant='body2' fontWeight={500} noWrap>{b.name}</Typography>
                              <Chip label={b.program_type || 'S1'} size='small' variant='tonal'
                                    color={b.program_type === 'S2' ? 'info' : 'success'} sx={{ flexShrink: 0 }} />
                            </div>
                          )
                        }}>
                  <MenuItem value=''>Semua Angkatan</MenuItem>
                  {batches.map(b => (
                    <MenuItem key={b.id} value={b.id}>
                      <div className='flex items-center justify-between w-full gap-2'>
                        <div>
                          <Typography variant='body2' fontWeight={500}>{b.name}</Typography>
                          <Typography variant='caption' color='text.secondary'>
                            Angkatan ke-{b.batch_number} · {b.year}
                          </Typography>
                        </div>
                        <Chip label={b.program_type || 'S1'} size='small' variant='tonal'
                              color={b.program_type === 'S2' ? 'info' : 'success'} />
                      </div>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size='small'>
                <InputLabel>Sindikat</InputLabel>
                <Select label='Sindikat' value={syndicateFilter}
                        onChange={e => { setSyndicateFilter(e.target.value); setPage(0) }}>
                  <MenuItem value=''>Semua Sindikat</MenuItem>
                  {syndicates.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            {/* Row 2: Status Akademik + Search */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size='small'>
                <InputLabel>Status Akademik</InputLabel>
                <Select label='Status Akademik' value={academicStatusFilter}
                        onChange={e => { setAcademicStatusFilter(e.target.value); setPage(0) }}>
                  <MenuItem value=''>Semua Status</MenuItem>
                  {academicStatuses.map(a => (
                    <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <DebouncedInput fullWidth value={globalFilter}
                              onChange={v => { setGlobalFilter(v); setPage(0) }}
                              placeholder='Cari nama atau NIM...'
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
        // Mobile — Card List
        <>
          {data.length === 0 ? (
            <Card>
              <CardContent sx={{ py: 12 }}>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                  <i className='ri-group-line' style={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
                <Typography variant='body2' color='text.secondary'>Tidak ada mahasiswa ditemukan.</Typography>
              </CardContent>
            </Card>
          ) : data.map(s => (
            <StudentMobileCard key={s.id} student={s}
                               onDetail={st => { setDetailData(st); setDetailOpen(true) }}
                               onEdit={handleOpenEdit}
                               onToggle={st => { setToggleTarget(st); setToggleOpen(true) }}
                               router={router}
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
        // Desktop — Table
        <Card>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                {['Mahasiswa', 'NIM', 'Sindikat', 'Angkatan', 'Status Akademik', 'Status', 'Aksi'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align='center' sx={{ py: 8 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                      <i className='ri-group-line' style={{ fontSize: 48, opacity: 0.3 }} />
                    </Box>
                    <Typography variant='body2' color='text.secondary'>Tidak ada mahasiswa ditemukan.</Typography>
                  </TableCell>
                </TableRow>
              ) : data.map(s => {
                const p = s.student_profile
                return (
                  <TableRow key={s.id} hover>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Avatar sx={{ width: 32, height: 32, fontSize: 12, bgcolor: 'primary.main' }}>
                          {getInitials(s.full_name)}
                        </Avatar>
                        <div>
                          <Typography variant='body2' fontWeight={600}>{s.full_name}</Typography>
                          <Typography variant='caption' color='text.secondary'>{s.username}</Typography>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Typography variant='body2'>{p?.nim || '—'}</Typography></TableCell>
                    <TableCell>
                      <Chip label={p?.syndicate?.name || '—'} size='small' color='primary' variant='tonal' />
                    </TableCell>
                    <TableCell><Typography variant='body2'>{p?.batch?.year || '—'}</Typography></TableCell>
                    <TableCell><Typography variant='body2'>{p?.academic_status?.name || '—'}</Typography></TableCell>
                    <TableCell>
                      <Chip label={s.is_active ? 'Aktif' : 'Nonaktif'}
                            color={s.is_active ? 'success' : 'default'} size='small' variant='tonal' />
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-0.5'>
                        <Tooltip title='Lihat Profil & Nilai'>
                          <IconButton size='small' color='primary'
                                      onClick={() => router.push(`/students/${s.id}`)}>
                            <i className='ri-user-line text-[18px]' />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title='Detail'>
                          <IconButton size='small'
                                      onClick={() => { setDetailData(s); setDetailOpen(true) }}>
                            <i className='ri-eye-line text-[18px]' />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title='Edit'>
                          <IconButton size='small' onClick={() => handleOpenEdit(s)}>
                            <i className='ri-edit-line text-[18px]' />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={s.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
                          <IconButton size='small' color={s.is_active ? 'error' : 'success'}
                                      onClick={() => { setToggleTarget(s); setToggleOpen(true) }}>
                            <i className={`ri-${s.is_active ? 'forbid' : 'checkbox-circle'}-line text-[18px]`} />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
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

      {/* Drawer Detail */}
      <Drawer anchor='right' open={detailOpen} onClose={() => setDetailOpen(false)}
              PaperProps={{ sx: { width: { xs: '100%', sm: 420 } } }}>
        <div className='flex items-center justify-between p-4 border-b'>
          <Typography variant='h6'>Detail Mahasiswa</Typography>
          <IconButton onClick={() => setDetailOpen(false)}><i className='ri-close-line' /></IconButton>
        </div>
        {detailData && (
          <div className='p-4 flex flex-col gap-4 overflow-y-auto'>
            {/* Header profil */}
            <div className='flex flex-col items-center gap-2 py-2'>
              <Avatar sx={{ width: 72, height: 72, fontSize: 24, bgcolor: 'primary.main' }}>
                {getInitials(detailData.full_name)}
              </Avatar>
              <div className='text-center'>
                <Typography variant='h6' fontWeight={600}>{detailData.full_name}</Typography>
                <Typography variant='caption' color='text.secondary'>
                  {detailData.student_profile?.nim || '—'}
                </Typography>
              </div>
              <div className='flex gap-2'>
                <Chip label={detailData.is_active ? 'Aktif' : 'Nonaktif'}
                      color={detailData.is_active ? 'success' : 'default'} size='small' variant='tonal' />
                <Chip label={detailData.student_profile?.academic_status?.name || '—'}
                      size='small' variant='tonal' color='info' />
              </div>
            </div>
            <Divider />

            {/* Akademik */}
            <div>
              <Typography variant='caption' color='text.secondary'
                          sx={{ textTransform: 'uppercase', letterSpacing: '.08em', fontSize: 10, fontWeight: 600, display: 'block', mb: 1.5 }}>
                Informasi Akademik
              </Typography>
              {[
                { label: 'Sindikat', value: detailData.student_profile?.syndicate?.name, icon: 'ri-team-line' },
                { label: 'Angkatan', value: detailData.student_profile?.batch?.year, icon: 'ri-calendar-line' },
                { label: 'Status Akademik', value: detailData.student_profile?.academic_status?.name, icon: 'ri-graduation-cap-line' },
              ].map(r => (
                <div key={r.label} className='flex items-center gap-3 mb-2'>
                  <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: 'primary.light', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`${r.icon} text-sm`} style={{ color: 'var(--mui-palette-primary-main)' }} />
                  </Box>
                  <div>
                    <Typography variant='caption' color='text.secondary'>{r.label}</Typography>
                    <Typography variant='body2' fontWeight={500}>{r.value || '—'}</Typography>
                  </div>
                </div>
              ))}
            </div>
            <Divider />

            {/* Personal */}
            <div>
              <Typography variant='caption' color='text.secondary'
                          sx={{ textTransform: 'uppercase', letterSpacing: '.08em', fontSize: 10, fontWeight: 600, display: 'block', mb: 1.5 }}>
                Informasi Personal
              </Typography>
              {[
                { label: 'Email', value: detailData.email, icon: 'ri-mail-line' },
                { label: 'Telepon', value: detailData.student_profile?.phone, icon: 'ri-phone-line' },
                { label: 'Jenis Kelamin', value: detailData.student_profile?.gender === 'M' ? 'Laki-laki' : detailData.student_profile?.gender === 'F' ? 'Perempuan' : null, icon: 'ri-user-line' },
                { label: 'Agama', value: detailData.student_profile?.religion, icon: 'ri-heart-line' },
                { label: 'Tanggal Lahir', value: fmtDate(detailData.student_profile?.birth_date), icon: 'ri-cake-line' },
                { label: 'Kota', value: detailData.student_profile?.city, icon: 'ri-building-line' },
              ].map(r => (
                <div key={r.label} className='flex items-center gap-3 mb-2'>
                  <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`${r.icon} text-sm`} />
                  </Box>
                  <div>
                    <Typography variant='caption' color='text.secondary'>{r.label}</Typography>
                    <Typography variant='body2' fontWeight={500}>{r.value || '—'}</Typography>
                  </div>
                </div>
              ))}
            </div>

            <div className='flex gap-2 mt-2'>
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

      {/* Drawer Edit */}
      <Drawer anchor='right' open={editOpen} onClose={() => setEditOpen(false)}
              PaperProps={{ sx: { width: { xs: '100%', sm: 480 } } }}>
        <div className='flex items-center justify-between p-4 border-b'>
          <div>
            <Typography variant='h6'>Edit Data Mahasiswa</Typography>
            {editTarget && <Typography variant='caption' color='text.secondary'>{editTarget.full_name}</Typography>}
          </div>
          <IconButton onClick={() => setEditOpen(false)}><i className='ri-close-line' /></IconButton>
        </div>
        <form onSubmit={handleSubmit(handleEdit)} className='flex flex-col gap-4 p-4 overflow-y-auto'>
          <Typography variant='caption' color='text.secondary'
                      sx={{ textTransform: 'uppercase', letterSpacing: '.08em', fontSize: 10, fontWeight: 600 }}>
            Data Akademik
          </Typography>
          <Controller name='syndicate_id' control={control} rules={{ required: 'Wajib dipilih' }}
                      render={({ field }) => (
                        <FormControl fullWidth size='small' error={!!errors.syndicate_id}>
                          <InputLabel>Sindikat</InputLabel>
                          <Select {...field} label='Sindikat'>
                            {syndicates.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                          </Select>
                        </FormControl>
                      )}
          />
          <Controller name='batch_id' control={control} rules={{ required: 'Wajib dipilih' }}
                      render={({ field }) => (
                        <FormControl fullWidth size='small' error={!!errors.batch_id}>
                          <InputLabel>Angkatan</InputLabel>
                          <Select {...field} label='Angkatan'>
                            {batches.map(b => <MenuItem key={b.id} value={b.id}>{b.name} ({b.year})</MenuItem>)}
                          </Select>
                        </FormControl>
                      )}
          />
          <Controller name='academic_status_id' control={control} rules={{ required: 'Wajib dipilih' }}
                      render={({ field }) => (
                        <FormControl fullWidth size='small' error={!!errors.academic_status_id}>
                          <InputLabel>Status Akademik</InputLabel>
                          <Select {...field} label='Status Akademik'>
                            {academicStatuses.map(a => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
                          </Select>
                        </FormControl>
                      )}
          />
          <Divider><Typography variant='caption'>Data Personal</Typography></Divider>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Controller name='gender' control={control} rules={{ required: true }}
                          render={({ field }) => (
                            <FormControl fullWidth size='small'>
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
              <Controller name='marital_status' control={control} rules={{ required: true }}
                          render={({ field }) => (
                            <FormControl fullWidth size='small'>
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
          <Controller name='religion' control={control} rules={{ required: true }}
                      render={({ field }) => (
                        <FormControl fullWidth size='small'>
                          <InputLabel>Agama</InputLabel>
                          <Select {...field} label='Agama'>
                            {['Islam','Kristen','Katolik','Hindu','Buddha','Konghucu'].map(r => (
                              <MenuItem key={r} value={r}>{r}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
          />
          <Controller name='phone' control={control}
                      render={({ field }) => (
                        <TextField {...field} fullWidth size='small' label='Nomor Telepon' placeholder='08xxx' />
                      )}
          />
          <Controller name='city' control={control}
                      render={({ field }) => (
                        <TextField {...field} fullWidth size='small' label='Kota' />
                      )}
          />
          <Controller name='address' control={control}
                      render={({ field }) => (
                        <TextField {...field} fullWidth size='small' multiline rows={2} label='Alamat' />
                      )}
          />
          <div className='flex gap-2 mt-2'>
            <Button fullWidth variant='tonal' color='secondary'
                    onClick={() => setEditOpen(false)} disabled={editLoading}>Batal</Button>
            <Button fullWidth variant='contained' type='submit' disabled={editLoading}
                    startIcon={editLoading ? <CircularProgress size={16} color='inherit' /> : null}>
              {editLoading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Dialog Toggle Active */}
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
        <DialogActions className='p-4 gap-2'>
          <Button variant='tonal' color='secondary' onClick={() => setToggleOpen(false)} disabled={toggleLoading}>
            Batal
          </Button>
          <Button variant='contained' color={toggleTarget?.is_active ? 'error' : 'success'}
                  onClick={handleToggleActive} disabled={toggleLoading}
                  startIcon={toggleLoading ? <CircularProgress size={16} color='inherit' /> : null}>
            {toggleLoading ? 'Memproses...' : toggleTarget?.is_active ? 'Nonaktifkan' : 'Aktifkan'}
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

export default StudentsListView
