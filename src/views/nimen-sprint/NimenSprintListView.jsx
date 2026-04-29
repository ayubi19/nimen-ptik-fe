'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Alert from '@mui/material/Alert'
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
import { nimenSprintApi } from '@/libs/api/nimenSprintApi'
import { batchApi } from '@/libs/api/masterDataApi'

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

const STATUS_CONFIG = {
  DRAFT_ADMIN:      { label: 'Draft',               color: 'secondary', icon: 'ri-draft-line' },
  DRAFT_PEJABAT:    { label: 'Menunggu Koordinator', color: 'warning',   icon: 'ri-time-line' },
  REVIEW_SUBMITTED: { label: 'Revisi Masuk',         color: 'info',      icon: 'ri-file-list-line' },
  ACTIVE:           { label: 'Aktif',                color: 'success',   icon: 'ri-checkbox-circle-line' },
  APPROVAL_PENDING: { label: 'Approval Pending',     color: 'warning',   icon: 'ri-loader-line' },
  CLOSED:           { label: 'Selesai',              color: 'secondary', icon: 'ri-check-double-line' },
}

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—'

// ── Mobile Card ───────────────────────────────────────────────────────────────
const SprintMobileCard = ({ sprint, onDelete, router }) => {
  const cfg = STATUS_CONFIG[sprint.status] || { label: sprint.status, color: 'default' }
  const indicator = sprint.indicator
  const isPlus = (indicator?.value ?? 0) >= 0

  return (
    <Card className='mb-3' sx={{ overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5, bgcolor: 'action.hover' }}>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex-1 min-w-0'>
            <Typography variant='body2' fontWeight={700} color='primary.main' noWrap>
              {sprint.sprint_number}
            </Typography>
            <Typography variant='body2' fontWeight={600} color='text.primary' noWrap>
              {sprint.title}
            </Typography>
          </div>
          <Chip label={cfg.label} color={cfg.color} size='small' variant='tonal' sx={{ flexShrink: 0 }} />
        </div>
      </Box>
      <CardContent sx={{ pt: 1.5, pb: '12px !important' }}>
        <div className='flex flex-col gap-1 mb-3'>
          {sprint.location && (
            <div className='flex items-center gap-1'>
              <i className='ri-map-pin-line text-xs' style={{ color: 'var(--mui-palette-text-secondary)' }} />
              <Typography variant='caption' color='text.secondary'>{sprint.location}</Typography>
            </div>
          )}
          <div className='flex items-center gap-1'>
            <i className='ri-calendar-line text-xs' style={{ color: 'var(--mui-palette-text-secondary)' }} />
            <Typography variant='caption' color='text.secondary'>
              {fmtDate(sprint.event_date)} · Deadline: {fmtDate(sprint.submission_deadline)}
            </Typography>
          </div>
          <div className='flex items-center gap-2 flex-wrap mt-1'>
            {sprint.batch && (
              <Chip label={sprint.batch.name} size='small' color='primary' variant='tonal' />
            )}
            {indicator && (
              <Chip
                label={isPlus ? `+${indicator.value}` : `${indicator.value}`}
                color={isPlus ? 'success' : 'error'}
                size='small' variant='tonal'
                sx={{ fontWeight: 700 }}
              />
            )}
          </div>
        </div>
        <Divider className='mb-2' />
        <div className='flex gap-2'>
          <Button fullWidth variant='tonal' size='small' color='primary'
                  startIcon={<i className='ri-eye-line' />}
                  onClick={() => router.push(`/nimen/sprints/${sprint.id}`)}>
            Detail
          </Button>
          {sprint.status === 'DRAFT_ADMIN' && (
            <>
              <Button fullWidth variant='tonal' size='small' color='secondary'
                      startIcon={<i className='ri-edit-line' />}
                      onClick={() => router.push(`/nimen/sprints/${sprint.id}/edit`)}>
                Edit
              </Button>
              <Button fullWidth variant='tonal' size='small' color='error'
                      startIcon={<i className='ri-delete-bin-line' />}
                      onClick={() => onDelete(sprint)}>
                Hapus
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Main View ─────────────────────────────────────────────────────────────────
const NimenSprintListView = () => {
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [data, setData]             = useState([])
  const [total, setTotal]           = useState(0)
  const [loading, setLoading]       = useState(false)
  const [batches, setBatches]       = useState([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [batchFilter, setBatchFilter]   = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage]             = useState(0)
  const [pageSize, setPageSize]     = useState(10)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const showToast = useCallback((msg, severity = 'success') =>
    setToast({ open: true, message: msg, severity }), [])

  useEffect(() => {
    batchApi.getAllActive()
      .then(res => setBatches(res.data.data || []))
      .catch(() => {})
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page: page + 1, page_size: pageSize }
      if (globalFilter) params.search = globalFilter
      if (batchFilter)  params.batch_id = batchFilter
      if (statusFilter) params.status = statusFilter
      const res = await nimenSprintApi.getAll(params)
      setData(res.data.data?.data || [])
      setTotal(res.data.data?.pagination?.total || 0)
    } catch (err) {
      showToast(err.message || 'Gagal memuat data', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, globalFilter, batchFilter, statusFilter, showToast])

  useEffect(() => { fetchData() }, [fetchData])

  const handleDelete = useCallback(async () => {
    setDeleteLoading(true)
    try {
      await nimenSprintApi.delete(deleteTarget.id)
      showToast('Sprint berhasil dihapus')
      setDeleteTarget(null)
      fetchData()
    } catch (err) {
      showToast(err.message || 'Gagal menghapus', 'error')
    } finally {
      setDeleteLoading(false)
    }
  }, [deleteTarget, fetchData, showToast])

  // Stats
  const statuses = Object.values(STATUS_CONFIG)
  const totalByStatus = Object.entries(STATUS_CONFIG).reduce((acc, [key]) => {
    acc[key] = data.filter(d => d.status === key).length
    return acc
  }, {})

  return (
    <>
      {/* Breadcrumb */}
      <div className='flex items-center gap-2 mb-6'>
        <Typography variant='caption' color='text.secondary'>NIMEN</Typography>
        <i className='ri-arrow-right-s-line text-sm opacity-50' />
        <Typography variant='caption' fontWeight={500} color='text.primary'>Daftar Sprint</Typography>
      </div>

      {/* Header */}
      <div className='flex items-center justify-between mb-6 flex-wrap gap-3'>
        <div />
        <Button variant='contained' startIcon={<i className='ri-add-line' />}
                onClick={() => router.push('/nimen/sprints/create')}
                sx={{ width: { xs: '100%', sm: 'auto' } }}>
          Buat Sprint
        </Button>
      </div>

      {/* Stats */}
      <Grid container spacing={3} className='mb-6'>
        {[
          { label: 'Total Sprint', value: total, icon: 'ri-flag-line', color: '#7367F0', bg: '#F3EDFF' },
          { label: 'Aktif', value: data.filter(d => d.status === 'ACTIVE').length, icon: 'ri-checkbox-circle-line', color: '#28C76F', bg: '#E6F9EE' },
          { label: 'Draft', value: data.filter(d => d.status === 'DRAFT_ADMIN').length, icon: 'ri-draft-line', color: '#A8AAAE', bg: '#F4F4F4' },
          { label: 'Selesai', value: data.filter(d => d.status === 'CLOSED').length, icon: 'ri-check-double-line', color: '#00CFE8', bg: '#E0F9FC' },
        ].map(s => (
          <Grid item xs={6} sm={3} key={s.label}>
            <Card>
              <CardContent className='flex items-center gap-3'>
                <div style={{
                  width: 44, height: 44, borderRadius: 8, flexShrink: 0,
                  background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className={s.icon} style={{ fontSize: 22, color: s.color }} />
                </div>
                <div>
                  <Typography variant='h4' fontWeight={600} lineHeight={1.2}>{s.value}</Typography>
                  <Typography variant='body2' color='text.secondary' sx={{ fontSize: { xs: 11, sm: 13 } }}>
                    {s.label}
                  </Typography>
                </div>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filter */}
      <Card className='mb-6'>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size='small'>
                <InputLabel>Angkatan</InputLabel>
                <Select label='Angkatan' value={batchFilter}
                        onChange={e => { setBatchFilter(e.target.value); setPage(0) }}
                        renderValue={val => {
                          const b = batches.find(x => x.id === val || String(x.id) === String(val))
                          if (!b) return 'Semua Angkatan'
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
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size='small'>
                <InputLabel>Status</InputLabel>
                <Select label='Status' value={statusFilter}
                        onChange={e => { setStatusFilter(e.target.value); setPage(0) }}>
                  <MenuItem value=''>Semua Status</MenuItem>
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <MenuItem key={key} value={key}>
                      <Chip label={cfg.label} color={cfg.color} size='small' variant='tonal' />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <DebouncedInput fullWidth value={globalFilter}
                              onChange={val => { setGlobalFilter(val); setPage(0) }}
                              placeholder='Cari sprint...'
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
              <CardContent className='text-center py-12'>
                <i className='ri-flag-line text-5xl opacity-30 block mb-2' />
                <Typography variant='body2' color='text.secondary'>Tidak ada sprint ditemukan</Typography>
              </CardContent>
            </Card>
          ) : data.map(sprint => (
            <SprintMobileCard key={sprint.id} sprint={sprint}
                              onDelete={setDeleteTarget} router={router} />
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
                {['No. Sprint', 'Kegiatan', 'Angkatan', 'Tanggal', 'Nilai', 'Status', 'Aksi'].map(h => (
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
                    <i className='ri-flag-line text-5xl opacity-30 block mb-2' />
                    <Typography variant='body2' color='text.secondary'>Tidak ada sprint ditemukan</Typography>
                  </TableCell>
                </TableRow>
              ) : data.map(sprint => {
                const cfg = STATUS_CONFIG[sprint.status] || { label: sprint.status, color: 'default' }
                const indicator = sprint.indicator
                const isPlus = (indicator?.value ?? 0) >= 0
                return (
                  <TableRow key={sprint.id} hover>
                    <TableCell>
                      <Typography variant='body2' fontWeight={700} color='primary.main'>
                        {sprint.sprint_number}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 260 }}>
                      <Typography variant='body2' fontWeight={600} noWrap>{sprint.title}</Typography>
                      {sprint.location && (
                        <div className='flex items-center gap-1 mt-0.5'>
                          <i className='ri-map-pin-line text-xs' style={{ color: 'var(--mui-palette-text-secondary)' }} />
                          <Typography variant='caption' color='text.secondary' noWrap>{sprint.location}</Typography>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {sprint.batch && (
                        <Chip label={sprint.batch.name} size='small' color='primary' variant='tonal' />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>{fmtDate(sprint.event_date)}</Typography>
                      <Typography variant='caption' color='text.secondary'>
                        Deadline: {fmtDate(sprint.submission_deadline)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {indicator ? (
                        <Chip
                          label={isPlus ? `+${indicator.value}` : `${indicator.value}`}
                          color={isPlus ? 'success' : 'error'}
                          size='small' variant='tonal'
                          sx={{ fontWeight: 700 }}
                        />
                      ) : (
                        <Typography variant='caption' color='text.secondary'>—</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={cfg.label} color={cfg.color} size='small' variant='tonal' />
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-0.5'>
                        <Tooltip title='Detail & Peserta'>
                          <IconButton size='small' onClick={() => router.push(`/nimen/sprints/${sprint.id}`)}>
                            <i className='ri-eye-line text-[20px]' />
                          </IconButton>
                        </Tooltip>
                        {sprint.status === 'DRAFT_ADMIN' && (
                          <>
                            <Tooltip title='Edit'>
                              <IconButton size='small' onClick={() => router.push(`/nimen/sprints/${sprint.id}/edit`)}>
                                <i className='ri-edit-line text-[20px]' />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='Hapus'>
                              <IconButton size='small' color='error' onClick={() => setDeleteTarget(sprint)}>
                                <i className='ri-delete-bin-line text-[20px]' />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
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

      {/* Dialog Hapus */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth='xs' fullWidth>
        <DialogTitle>Hapus Sprint?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Hapus sprint <strong>{deleteTarget?.sprint_number} — {deleteTarget?.title}</strong>?
            Semua data peserta akan ikut terhapus.
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

export default NimenSprintListView
