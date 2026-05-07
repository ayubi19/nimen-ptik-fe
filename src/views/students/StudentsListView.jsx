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

// ── PWA Student Card styles ───────────────────────────────────────────────────
const pwaCardStyles = {
  card: {
    background: '#fff',
    border: '0.5px solid rgba(180,100,100,0.15)',
    borderRadius: '12px',
    padding: '12px',
    marginBottom: '10px',
    overflow: 'hidden',
  },
  avatar: {
    width: 40, height: 40, borderRadius: '12px',
    background: 'linear-gradient(145deg, #E63946, #6D0E13)',
    boxShadow: '0 3px 8px rgba(180,0,30,0.22), inset 0 1px 0 rgba(255,180,180,0.35)',
    fontSize: 11, fontWeight: 500,
    color: 'rgba(255,255,255,0.92)',
    flexShrink: 0,
    position: 'relative', overflow: 'hidden',
  },
  actionBtn: {
    flex: 1, padding: '5px 0', borderRadius: '8px',
    fontSize: '10px', fontWeight: 500, textAlign: 'center',
    border: '0.5px solid rgba(180,100,100,0.18)',
    background: 'rgba(255,255,255,0.72)',
    boxShadow: '0 2px 6px rgba(139,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.9)',
    cursor: 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: '4px', minWidth: 0,
  },
  nonaktifBtn: {
    width: '100%', padding: '5px 0', fontSize: '10px',
    color: '#A32D2D', border: '0.5px solid rgba(163,45,45,0.2)',
    background: '#FCEBEB', borderRadius: '8px',
    textAlign: 'center', fontWeight: 500, cursor: 'pointer',
    marginTop: '8px',
  },
}

// ── Mobile Card — PWA Native style ────────────────────────────────────────────
const StudentMobileCard = ({ student, onDetail, onEdit, onToggle, router }) => {
  const profile = student.student_profile
  const initials = getInitials(student.full_name)

  const statusCfg = student.is_active
    ? { label: 'Aktif',    bg: '#E1F5EE', color: '#0F6E56' }
    : { label: 'Nonaktif', bg: '#F1EFE8', color: '#5F5E5A' }

  return (
    <Box sx={pwaCardStyles.card}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', mb: '10px' }}>
        <Avatar sx={pwaCardStyles.avatar}>{initials}</Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#3B1010', lineHeight: 1.3 }} noWrap>
            {student.full_name}
          </Typography>
          <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>
            {profile?.nim || '—'}
          </Typography>
        </Box>
        <Box sx={{ bgcolor: statusCfg.bg, borderRadius: '6px', px: 1, py: '3px', flexShrink: 0 }}>
          <Typography sx={{ fontSize: '10px', fontWeight: 500, color: statusCfg.color }}>
            {statusCfg.label}
          </Typography>
        </Box>
      </Box>

      {/* Meta info */}
      <Box sx={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px',
        py: '8px',
        borderTop: '0.5px solid rgba(180,100,100,0.1)',
        borderBottom: '0.5px solid rgba(180,100,100,0.1)',
        mb: '10px',
      }}>
        {[
          { label: 'Sindikat',        value: profile?.syndicate?.name },
          { label: 'Angkatan',        value: profile?.batch?.name ? `${profile.batch.name.split(' ').slice(0,2).join(' ')}...` : '—' },
          { label: 'Status Akademik', value: profile?.academic_status?.name },
          { label: 'Program',         value: profile?.batch?.program_type || '—' },
        ].map(m => (
          <Box key={m.label}>
            <Typography sx={{ fontSize: '9px', color: '#9A5A5A' }}>{m.label}</Typography>
            <Typography sx={{ fontSize: '11px', fontWeight: 500, color: '#3B1010' }} noWrap>
              {m.value || '—'}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: '6px', mb: '0px' }}>
        <Box
          component='button'
          sx={{ ...pwaCardStyles.actionBtn, color: '#8B2020' }}
          onClick={() => router.push(`/students/${student.id}`)}
        >
          <i className='ri-user-line' style={{ fontSize: '11px' }} />
          Profil & Nilai
        </Box>
        <Box
          component='button'
          sx={{ ...pwaCardStyles.actionBtn, color: '#185FA5' }}
          onClick={() => onDetail(student)}
        >
          <i className='ri-eye-line' style={{ fontSize: '11px' }} />
          Detail
        </Box>
        <Box
          component='button'
          sx={{ ...pwaCardStyles.actionBtn, color: '#444441' }}
          onClick={() => onEdit(student)}
        >
          <i className='ri-edit-line' style={{ fontSize: '11px' }} />
          Edit
        </Box>
      </Box>

      <Box
        component='button'
        sx={{ ...pwaCardStyles.nonaktifBtn }}
        onClick={() => onToggle(student)}
      >
        {student.is_active ? 'Nonaktifkan' : 'Aktifkan'}
      </Box>
    </Box>
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
      {/* Topbar PWA style */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', mb: '14px' }}>
        <Box sx={{
          width: 34, height: 34, borderRadius: '10px',
          background: 'rgba(255,255,255,0.72)',
          border: '0.5px solid rgba(180,100,100,0.18)',
          boxShadow: '0 3px 10px rgba(139,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, cursor: 'pointer', position: 'relative', overflow: 'hidden',
          '&::before': {
            content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)',
          }
        }} onClick={() => router.back()}>
          <i className='ri-arrow-left-s-line' style={{ fontSize: '20px', color: '#8B2020', position: 'relative', zIndex: 1 }} />
        </Box>
        <Box>
          <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>Mahasiswa</Typography>
          <Typography sx={{ fontSize: '16px', fontWeight: 500, color: '#3B1010' }}>Daftar Mahasiswa</Typography>
        </Box>
      </Box>

      {/* Stats — 2x2 grid, crystal icons, label lengkap */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', mb: '10px' }}>
        {[
          { label: 'Total Mahasiswa',     value: stats.total,     icon: 'ri-group-line' },
          { label: 'Mahasiswa Aktif',     value: stats.active,    icon: 'ri-user-follow-line' },
          { label: 'Mahasiswa Lulus',     value: stats.graduated, icon: 'ri-graduation-cap-line' },
          { label: 'Mahasiswa Drop Out',  value: stats.dropout,   icon: 'ri-user-unfollow-line' },
        ].map(s => (
          <Box key={s.label} sx={{
            background: '#fff',
            border: '0.5px solid rgba(180,100,100,0.15)',
            borderRadius: '12px',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            {/* Crystal icon */}
            <Box sx={{
              width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
              background: 'linear-gradient(145deg, #E63946, #6D0E13)',
              boxShadow: '0 4px 10px rgba(180,0,30,0.25), inset 0 1px 0 rgba(255,180,180,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', overflow: 'hidden',
              '&::before': {
                content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
                borderRadius: '12px 12px 0 0',
                background: 'linear-gradient(180deg, rgba(255,200,200,0.32) 0%, transparent 100%)',
              }
            }}>
              <i className={s.icon} style={{ fontSize: '20px', color: 'rgba(255,255,255,0.92)', position: 'relative', zIndex: 1 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '20px', fontWeight: 500, color: '#3B1010', lineHeight: 1 }}>
                {s.value}
              </Typography>
              <Typography sx={{ fontSize: '10px', color: '#9A5A5A', mt: '2px', lineHeight: 1.3 }}>
                {s.label}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Filter — PWA native style */}
      <Box sx={{
        background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)',
        borderRadius: '12px', p: '10px 12px', mb: '10px',
        display: 'flex', flexDirection: 'column', gap: '8px',
      }}>
        {/* Angkatan — full width karena nilainya panjang */}
        <FormControl fullWidth size='small'>
          <Select
            displayEmpty
            value={batchFilter}
            onChange={e => { setBatchFilter(e.target.value); setPage(0) }}
            renderValue={val => {
              const b = batches.find(x => x.id === val)
              return b ? `${b.name} (${b.year})` : 'Semua Angkatan'
            }}
            sx={{
              borderRadius: '8px', fontSize: '12px',
              bgcolor: '#F5F2F0', border: 'none',
              '& .MuiOutlinedInput-notchedOutline': { border: '0.5px solid rgba(180,100,100,0.15)' },
              '& .MuiSelect-select': { py: '7px', px: '10px' },
            }}
          >
            <MenuItem value=''>Semua Angkatan</MenuItem>
            {batches.map(b => (
              <MenuItem key={b.id} value={b.id}>
                <Box>
                  <Typography variant='body2' fontWeight={500}>{b.name}</Typography>
                  <Typography variant='caption' color='text.secondary'>Angkatan ke-{b.batch_number} · {b.year}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Sindikat + Status Akademik — dibagi 2 */}
        <Box sx={{ display: 'flex', gap: '8px' }}>
          <FormControl size='small' sx={{ flex: 1 }}>
            <Select
              displayEmpty
              value={syndicateFilter}
              onChange={e => { setSyndicateFilter(e.target.value); setPage(0) }}
              renderValue={val => syndicates.find(x => x.id === val)?.name || 'Sindikat'}
              sx={{
                borderRadius: '8px', fontSize: '12px',
                bgcolor: '#F5F2F0',
                '& .MuiOutlinedInput-notchedOutline': { border: '0.5px solid rgba(180,100,100,0.15)' },
                '& .MuiSelect-select': { py: '7px', px: '10px' },
              }}
            >
              <MenuItem value=''>Semua Sindikat</MenuItem>
              {syndicates.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size='small' sx={{ flex: 1 }}>
            <Select
              displayEmpty
              value={academicStatusFilter}
              onChange={e => { setAcademicStatusFilter(e.target.value); setPage(0) }}
              renderValue={val => academicStatuses.find(x => x.id === val)?.name || 'Status'}
              sx={{
                borderRadius: '8px', fontSize: '12px',
                bgcolor: '#F5F2F0',
                '& .MuiOutlinedInput-notchedOutline': { border: '0.5px solid rgba(180,100,100,0.15)' },
                '& .MuiSelect-select': { py: '7px', px: '10px' },
              }}
            >
              <MenuItem value=''>Semua Status</MenuItem>
              {academicStatuses.map(a => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>

        {/* Search */}
        <DebouncedInput
          fullWidth
          value={globalFilter}
          onChange={v => { setGlobalFilter(v); setPage(0) }}
          placeholder='Cari nama atau NIM...'
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0',
              '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15)' },
            },
            '& .MuiOutlinedInput-input': { py: '7px', px: '10px' },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <i className='ri-search-line' style={{ color: '#9A5A5A', fontSize: '14px' }} />
              </InputAdornment>
            )
          }}
        />
      </Box>

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
                  <Typography variant='body2' color='text.secondary'>Tidak ada mahasiswa ditemukan.</Typography>
                </Box>
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
                      <Typography variant='body2' color='text.secondary'>Tidak ada mahasiswa ditemukan.</Typography>
                    </Box>
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

      {/* Drawer Detail — PWA native */}
      <Drawer anchor='right' open={detailOpen} onClose={() => setDetailOpen(false)}
              PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, bgcolor: '#F5F2F0' } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: '14px 16px', bgcolor: '#fff', borderBottom: '0.5px solid rgba(180,100,100,0.15)' }}>
          <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#3B1010' }}>Detail Mahasiswa</Typography>
          <Box component='button' onClick={() => setDetailOpen(false)} sx={{
            width: 30, height: 30, borderRadius: '8px', border: 'none', cursor: 'pointer',
            background: '#F5F2F0', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className='ri-close-line' style={{ fontSize: '16px', color: '#9A5A5A' }} />
          </Box>
        </Box>

        {detailData && (
          <Box sx={{ p: '14px', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
            {/* Avatar hero */}
            <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', p: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <Avatar sx={{
                width: 64, height: 64, fontSize: 20, borderRadius: '16px !important',
                background: 'linear-gradient(145deg, #E63946, #6D0E13)',
                boxShadow: '0 5px 14px rgba(180,0,30,0.28), inset 0 1px 0 rgba(255,180,180,0.45)',
              }}>
                {getInitials(detailData.full_name)}
              </Avatar>
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#3B1010' }}>{detailData.full_name}</Typography>
                <Typography sx={{ fontSize: '12px', color: '#9A5A5A' }}>{detailData.student_profile?.nim || '—'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: '6px' }}>
                <Box sx={{ bgcolor: detailData.is_active ? '#E1F5EE' : '#FCEBEB', borderRadius: '6px', px: '8px', py: '3px' }}>
                  <Typography sx={{ fontSize: '10px', fontWeight: 500, color: detailData.is_active ? '#0F6E56' : '#A32D2D' }}>
                    {detailData.is_active ? 'Aktif' : 'Nonaktif'}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: '#E6F1FB', borderRadius: '6px', px: '8px', py: '3px' }}>
                  <Typography sx={{ fontSize: '10px', fontWeight: 500, color: '#185FA5' }}>
                    {detailData.student_profile?.academic_status?.name || '—'}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Informasi Akademik */}
            <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
              <Box sx={{ px: 2, py: '10px', borderBottom: '0.5px solid rgba(180,100,100,0.1)' }}>
                <Typography sx={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9A5A5A' }}>Informasi Akademik</Typography>
              </Box>
              {[
                { label: 'Sindikat',        value: detailData.student_profile?.syndicate?.name, icon: 'ri-team-line' },
                { label: 'Angkatan',        value: detailData.student_profile?.batch?.year,     icon: 'ri-calendar-line' },
                { label: 'Status Akademik', value: detailData.student_profile?.academic_status?.name, icon: 'ri-graduation-cap-line' },
              ].map((r, i, arr) => (
                <Box key={r.label} sx={{ display: 'flex', alignItems: 'center', gap: '12px', px: 2, py: '10px', borderBottom: i < arr.length - 1 ? '0.5px solid rgba(180,100,100,0.08)' : 'none' }}>
                  <Box sx={{ width: 32, height: 32, borderRadius: '10px', background: 'linear-gradient(145deg, #E63946, #6D0E13)', boxShadow: '0 3px 8px rgba(180,0,30,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={r.icon} style={{ fontSize: '15px', color: 'rgba(255,255,255,0.92)' }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '10px', color: '#9A5A5A' }}>{r.label}</Typography>
                    <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#3B1010' }}>{r.value || '—'}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* Informasi Personal */}
            <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
              <Box sx={{ px: 2, py: '10px', borderBottom: '0.5px solid rgba(180,100,100,0.1)' }}>
                <Typography sx={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9A5A5A' }}>Informasi Personal</Typography>
              </Box>
              {[
                { label: 'Email',          value: detailData.email,                                                     icon: 'ri-mail-line' },
                { label: 'Telepon',        value: detailData.student_profile?.phone,                                    icon: 'ri-phone-line' },
                { label: 'Jenis Kelamin',  value: detailData.student_profile?.gender === 'M' ? 'Laki-laki' : detailData.student_profile?.gender === 'F' ? 'Perempuan' : null, icon: 'ri-user-line' },
                { label: 'Agama',          value: detailData.student_profile?.religion,                                 icon: 'ri-heart-line' },
                { label: 'Tanggal Lahir',  value: fmtDate(detailData.student_profile?.birth_date),                     icon: 'ri-cake-line' },
                { label: 'Kota',           value: detailData.student_profile?.city,                                     icon: 'ri-building-line' },
              ].filter(r => r.value).map((r, i, arr) => (
                <Box key={r.label} sx={{ display: 'flex', alignItems: 'center', gap: '12px', px: 2, py: '10px', borderBottom: i < arr.length - 1 ? '0.5px solid rgba(180,100,100,0.08)' : 'none' }}>
                  <Box sx={{ width: 32, height: 32, borderRadius: '10px', background: '#F5F2F0', border: '0.5px solid rgba(180,100,100,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={r.icon} style={{ fontSize: '15px', color: '#9A5A5A' }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '10px', color: '#9A5A5A' }}>{r.label}</Typography>
                    <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#3B1010', wordBreak: 'break-all' }}>{r.value}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* Action buttons */}
            <Box sx={{ display: 'flex', gap: '8px' }}>
              <Box component='button' onClick={() => { setDetailOpen(false); handleOpenEdit(detailData) }} sx={{
                flex: 1, py: '10px', borderRadius: '10px', cursor: 'pointer', border: 'none',
                background: 'linear-gradient(145deg, #E63946, #6D0E13)',
                boxShadow: '0 4px 10px rgba(180,0,30,0.25), inset 0 1px 0 rgba(255,180,180,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}>
                <i className='ri-edit-line' style={{ fontSize: '14px', color: '#fff' }} />
                <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>Edit Data</Typography>
              </Box>
              <Box component='button' onClick={() => { setDetailOpen(false); setToggleTarget(detailData); setToggleOpen(true) }} sx={{
                flex: 1, py: '10px', borderRadius: '10px', cursor: 'pointer',
                bgcolor: detailData.is_active ? '#FCEBEB' : '#E1F5EE',
                border: `0.5px solid ${detailData.is_active ? 'rgba(163,45,45,0.2)' : 'rgba(15,110,86,0.2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}>
                <i className={detailData.is_active ? 'ri-user-unfollow-line' : 'ri-user-follow-line'} style={{ fontSize: '14px', color: detailData.is_active ? '#A32D2D' : '#0F6E56' }} />
                <Typography sx={{ fontSize: '12px', fontWeight: 600, color: detailData.is_active ? '#A32D2D' : '#0F6E56' }}>
                  {detailData.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </Drawer>

      {/* Drawer Edit — PWA native */}
      <Drawer anchor='right' open={editOpen} onClose={() => setEditOpen(false)}
              PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, bgcolor: '#F5F2F0' } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: '14px 16px', bgcolor: '#fff', borderBottom: '0.5px solid rgba(180,100,100,0.15)' }}>
          <Box>
            <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#3B1010' }}>Edit Data Mahasiswa</Typography>
            {editTarget && <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>{editTarget.full_name}</Typography>}
          </Box>
          <Box component='button' onClick={() => setEditOpen(false)} sx={{ width: 30, height: 30, borderRadius: '8px', border: 'none', cursor: 'pointer', background: '#F5F2F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className='ri-close-line' style={{ fontSize: '16px', color: '#9A5A5A' }} />
          </Box>
        </Box>
        <Box component='form' onSubmit={handleSubmit(handleEdit)} sx={{ display: 'flex', flexDirection: 'column', gap: '10px', p: '14px', overflowY: 'auto' }}>
          <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: '10px', borderBottom: '0.5px solid rgba(180,100,100,0.1)' }}>
              <Typography sx={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9A5A5A' }}>Data Akademik</Typography>
            </Box>
            <Box sx={{ p: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Controller name='syndicate_id' control={control} rules={{ required: 'Wajib dipilih' }}
                          render={({ field }) => (
                            <FormControl fullWidth size='small'>
                              <Select displayEmpty {...field} renderValue={val => syndicates.find(s => s.id === val)?.name || 'Pilih Sindikat'}
                                      sx={{ borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0', '& .MuiOutlinedInput-notchedOutline': { border: '0.5px solid rgba(180,100,100,0.15)' }, '& .MuiSelect-select': { py: '10px', px: '12px' } }}>
                                {syndicates.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                              </Select>
                            </FormControl>
                          )}
              />
              <Controller name='batch_id' control={control} rules={{ required: 'Wajib dipilih' }}
                          render={({ field }) => (
                            <FormControl fullWidth size='small'>
                              <Select displayEmpty {...field}
                                      renderValue={val => { const b = batches.find(x => x.id === val); return b ? `${b.name} (${b.year})` : 'Pilih Angkatan' }}
                                      sx={{ borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0', '& .MuiOutlinedInput-notchedOutline': { border: '0.5px solid rgba(180,100,100,0.15)' }, '& .MuiSelect-select': { py: '10px', px: '12px' } }}>
                                {batches.map(b => (
                                  <MenuItem key={b.id} value={b.id}>
                                    <Box><Typography variant='body2' fontWeight={500}>{b.name}</Typography><Typography variant='caption' color='text.secondary'>Angkatan ke-{b.batch_number} · {b.year}</Typography></Box>
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          )}
              />
              <Controller name='academic_status_id' control={control} rules={{ required: 'Wajib dipilih' }}
                          render={({ field }) => (
                            <FormControl fullWidth size='small'>
                              <Select displayEmpty {...field} renderValue={val => academicStatuses.find(a => a.id === val)?.name || 'Pilih Status Akademik'}
                                      sx={{ borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0', '& .MuiOutlinedInput-notchedOutline': { border: '0.5px solid rgba(180,100,100,0.15)' }, '& .MuiSelect-select': { py: '10px', px: '12px' } }}>
                                {academicStatuses.map(a => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
                              </Select>
                            </FormControl>
                          )}
              />
            </Box>
          </Box>
          <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: '10px', borderBottom: '0.5px solid rgba(180,100,100,0.1)' }}>
              <Typography sx={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9A5A5A' }}>Data Personal</Typography>
            </Box>
            <Box sx={{ p: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Box sx={{ display: 'flex', gap: '8px' }}>
                <Controller name='gender' control={control} rules={{ required: true }}
                            render={({ field }) => (
                              <FormControl fullWidth size='small' sx={{ flex: 1 }}>
                                <Select displayEmpty {...field} renderValue={val => val === 'M' ? 'Laki-laki' : val === 'F' ? 'Perempuan' : 'Jenis Kelamin'}
                                        sx={{ borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0', '& .MuiOutlinedInput-notchedOutline': { border: '0.5px solid rgba(180,100,100,0.15)' }, '& .MuiSelect-select': { py: '10px', px: '12px' } }}>
                                  <MenuItem value='M'>Laki-laki</MenuItem>
                                  <MenuItem value='F'>Perempuan</MenuItem>
                                </Select>
                              </FormControl>
                            )}
                />
                <Controller name='marital_status' control={control} rules={{ required: true }}
                            render={({ field }) => (
                              <FormControl fullWidth size='small' sx={{ flex: 1 }}>
                                <Select displayEmpty {...field} renderValue={val => val === 'SINGLE' ? 'Belum Menikah' : val === 'MARRIED' ? 'Menikah' : 'Status Nikah'}
                                        sx={{ borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0', '& .MuiOutlinedInput-notchedOutline': { border: '0.5px solid rgba(180,100,100,0.15)' }, '& .MuiSelect-select': { py: '10px', px: '12px' } }}>
                                  <MenuItem value='SINGLE'>Belum Menikah</MenuItem>
                                  <MenuItem value='MARRIED'>Menikah</MenuItem>
                                </Select>
                              </FormControl>
                            )}
                />
              </Box>
              <Controller name='religion' control={control} rules={{ required: true }}
                          render={({ field }) => (
                            <FormControl fullWidth size='small'>
                              <Select displayEmpty {...field} renderValue={val => val || 'Agama'}
                                      sx={{ borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0', '& .MuiOutlinedInput-notchedOutline': { border: '0.5px solid rgba(180,100,100,0.15)' }, '& .MuiSelect-select': { py: '10px', px: '12px' } }}>
                                {['Islam','Kristen','Katolik','Hindu','Buddha','Konghucu'].map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                              </Select>
                            </FormControl>
                          )}
              />
              <Controller name='phone' control={control}
                          render={({ field }) => (
                            <TextField {...field} fullWidth size='small' placeholder='Nomor Telepon'
                                       sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15)' } }, '& input': { py: '10px', px: '12px', fontSize: '12px' } }} />
                          )}
              />
              <Controller name='city' control={control}
                          render={({ field }) => (
                            <TextField {...field} fullWidth size='small' placeholder='Kota'
                                       sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15)' } }, '& input': { py: '10px', px: '12px', fontSize: '12px' } }} />
                          )}
              />
              <Controller name='address' control={control}
                          render={({ field }) => (
                            <TextField {...field} fullWidth size='small' multiline rows={2} placeholder='Alamat'
                                       sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15)' } }, '& textarea': { fontSize: '12px' } }} />
                          )}
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: '8px' }}>
            <Box component='button' type='button' onClick={() => setEditOpen(false)} disabled={editLoading} sx={{ flex: 1, py: '10px', borderRadius: '10px', cursor: 'pointer', background: '#fff', border: '0.5px solid rgba(180,100,100,0.18)', boxShadow: '0 2px 6px rgba(139,0,0,0.07)' }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#9A5A5A' }}>Batal</Typography>
            </Box>
            <Box component='button' type='submit' disabled={editLoading} sx={{ flex: 2, py: '10px', borderRadius: '10px', cursor: 'pointer', border: 'none', background: editLoading ? '#ccc' : 'linear-gradient(145deg, #E63946, #6D0E13)', boxShadow: '0 4px 10px rgba(180,0,30,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              {editLoading && <CircularProgress size={14} sx={{ color: '#fff' }} />}
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{editLoading ? 'Menyimpan...' : 'Simpan'}</Typography>
            </Box>
          </Box>
        </Box>
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
