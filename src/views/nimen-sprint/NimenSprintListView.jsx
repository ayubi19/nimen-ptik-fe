'use client'
import { useVisibilityRefetch } from '@/hooks/useVisibilityRefetch'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
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

// ── Mobile Card — PWA native ─────────────────────────────────────────────────
const STATUS_BADGE = {
  DRAFT_ADMIN:      { bg: '#F1EFE8', color: '#5F5E5A' },
  DRAFT_PEJABAT:    { bg: '#FAEEDA', color: '#BA7517' },
  REVIEW_SUBMITTED: { bg: '#E6F1FB', color: '#185FA5' },
  ACTIVE:           { bg: '#E1F5EE', color: '#0F6E56' },
  APPROVAL_PENDING: { bg: '#FAEEDA', color: '#BA7517' },
  CLOSED:           { bg: '#F1EFE8', color: '#5F5E5A' },
}

const SprintMobileCard = ({ sprint, onDelete, router }) => {
  const cfg = STATUS_CONFIG[sprint.status] || { label: sprint.status }
  const badge = STATUS_BADGE[sprint.status] || { bg: '#F1EFE8', color: '#5F5E5A' }
  const indicator = sprint.indicator
  const isPlus = (indicator?.value ?? 0) >= 0
  const isDraft = sprint.status === 'DRAFT_ADMIN'

  return (
    <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', overflow: 'hidden', mb: '10px' }}>
      <Box sx={{ px: 2, py: '10px', borderBottom: '0.5px solid rgba(180,100,100,0.1)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#EB3D47', mb: '2px' }} noWrap>{sprint.sprint_number}</Typography>
          <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#3B1010', lineHeight: 1.3 }} noWrap>{sprint.title}</Typography>
        </Box>
        <Box sx={{ bgcolor: badge.bg, borderRadius: '6px', px: '8px', py: '3px', flexShrink: 0 }}>
          <Typography sx={{ fontSize: '10px', fontWeight: 500, color: badge.color }}>{cfg.label}</Typography>
        </Box>
      </Box>
      <Box sx={{ px: 2, py: '10px', display: 'flex', flexDirection: 'column', gap: '5px', borderBottom: '0.5px solid rgba(180,100,100,0.1)' }}>
        {sprint.location && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <i className='ri-map-pin-line' style={{ fontSize: '11px', color: '#9A5A5A', flexShrink: 0 }} />
            <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }} noWrap>{sprint.location}</Typography>
          </Box>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <i className='ri-calendar-line' style={{ fontSize: '11px', color: '#9A5A5A', flexShrink: 0 }} />
          <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>{fmtDate(sprint.event_date)} · Deadline: {fmtDate(sprint.submission_deadline)}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', mt: '2px' }}>
          {sprint.batch && (
            <Box sx={{ bgcolor: '#FAEEDA', borderRadius: '6px', px: '7px', py: '2px' }}>
              <Typography sx={{ fontSize: '10px', fontWeight: 500, color: '#BA7517' }}>{sprint.batch.name}</Typography>
            </Box>
          )}
          {indicator && (
            <Box sx={{ bgcolor: isPlus ? '#E1F5EE' : '#FCEBEB', borderRadius: '6px', px: '7px', py: '2px' }}>
              <Typography sx={{ fontSize: '10px', fontWeight: 700, color: isPlus ? '#0F6E56' : '#A32D2D' }}>
                {isPlus ? `+${indicator.value}` : `${indicator.value}`}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
      <Box sx={{ px: 2, py: '10px', display: 'flex', gap: '6px' }}>
        <Box component='button' onClick={() => router.push(`/nimen/sprints/${sprint.id}`)} sx={{ flex: 1, py: '6px', borderRadius: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.72)', border: '0.5px solid rgba(180,100,100,0.18)', boxShadow: '0 2px 6px rgba(139,0,0,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          <i className='ri-eye-line' style={{ fontSize: '12px', color: '#185FA5' }} />
          <Typography sx={{ fontSize: '11px', fontWeight: 500, color: '#3B1010' }}>Detail</Typography>
        </Box>
        {isDraft && (
          <>
            <Box component='button' onClick={() => router.push(`/nimen/sprints/${sprint.id}/edit`)} sx={{ flex: 1, py: '6px', borderRadius: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.72)', border: '0.5px solid rgba(180,100,100,0.18)', boxShadow: '0 2px 6px rgba(139,0,0,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <i className='ri-edit-line' style={{ fontSize: '12px', color: '#444441' }} />
              <Typography sx={{ fontSize: '11px', fontWeight: 500, color: '#3B1010' }}>Edit</Typography>
            </Box>
            <Box component='button' onClick={() => onDelete(sprint)} sx={{ px: '12px', py: '6px', borderRadius: '8px', cursor: 'pointer', border: '0.5px solid rgba(163,45,45,0.2)', background: '#FCEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className='ri-delete-bin-line' style={{ fontSize: '13px', color: '#A32D2D' }} />
            </Box>
          </>
        )}
      </Box>
    </Box>
  )
}

// ── Main View ─────────────────────────────────────────────────────────────────
const NimenSprintListView = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [data, setData]             = useState([])
  const [total, setTotal]           = useState(0)
  const [loading, setLoading]       = useState(false)
  const [batches, setBatches]       = useState([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [batchFilter, setBatchFilter]   = useState('')
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || '')
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
  // Refetch saat tab visible dengan cooldown 30 detik
  useVisibilityRefetch(fetchData)

  const pathname = usePathname()
  useEffect(() => { fetchData() }, [pathname, fetchData])



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
      {/* Topbar PWA */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', mb: '14px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Box sx={{ width: 34, height: 34, borderRadius: '10px', background: 'rgba(255,255,255,0.72)', border: '0.5px solid rgba(180,100,100,0.18)', boxShadow: '0 3px 10px rgba(139,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', position: 'relative', overflow: 'hidden', '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)' } }} onClick={() => window.history.back()}>
            <i className='ri-arrow-left-s-line' style={{ fontSize: '20px', color: '#8B2020', position: 'relative', zIndex: 1 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>NIMEN</Typography>
            <Typography sx={{ fontSize: '16px', fontWeight: 500, color: '#3B1010' }}>Daftar Sprint</Typography>
          </Box>
        </Box>
        <Box component='button' onClick={() => router.push('/nimen/sprints/create')} sx={{ display: 'flex', alignItems: 'center', gap: '5px', px: '12px', py: '7px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: 'linear-gradient(145deg, #E63946, #6D0E13)', boxShadow: '0 4px 10px rgba(180,0,30,0.25)' }}>
          <i className='ri-add-line' style={{ fontSize: '14px', color: '#fff' }} />
          <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>Buat Sprint</Typography>
        </Box>
      </Box>

      {/* Stats — 2x2 crystal */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', mb: '10px' }}>
        {[
          { label: 'Total Sprint', value: total,                                              icon: 'ri-flag-line' },
          { label: 'Aktif',        value: data.filter(d => d.status === 'ACTIVE').length,     icon: 'ri-checkbox-circle-line' },
          { label: 'Draft',        value: data.filter(d => d.status === 'DRAFT_ADMIN').length, icon: 'ri-draft-line' },
          { label: 'Selesai',      value: data.filter(d => d.status === 'CLOSED').length,     icon: 'ri-check-double-line' },
        ].map(s => (
          <Box key={s.label} sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', flexShrink: 0, background: 'linear-gradient(145deg, #E63946, #6D0E13)', boxShadow: '0 4px 10px rgba(180,0,30,0.25), inset 0 1px 0 rgba(255,180,180,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '45%', borderRadius: '12px 12px 0 0', background: 'linear-gradient(180deg, rgba(255,200,200,0.32) 0%, transparent 100%)' } }}>
              <i className={s.icon} style={{ fontSize: '20px', color: 'rgba(255,255,255,0.92)', position: 'relative', zIndex: 1 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '20px', fontWeight: 500, color: '#3B1010', lineHeight: 1 }}>{s.value}</Typography>
              <Typography sx={{ fontSize: '10px', color: '#9A5A5A', mt: '2px' }}>{s.label}</Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Filter — PWA native */}
      <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', p: '10px 12px', mb: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <FormControl fullWidth size='small'>
          <Select displayEmpty value={batchFilter} onChange={e => { setBatchFilter(e.target.value); setPage(0) }}
                  renderValue={val => { const b = batches.find(x => String(x.id) === String(val)); return b ? `${b.name} (${b.year})` : 'Semua Angkatan' }}
                  sx={{ borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0', '& .MuiOutlinedInput-notchedOutline': { border: '0.5px solid rgba(180,100,100,0.15) !important' }, '& .MuiSelect-select': { py: '7px', px: '10px' } }}>
            <MenuItem value=''>Semua Angkatan</MenuItem>
            {batches.map(b => (
              <MenuItem key={b.id} value={b.id}>
                <Box><Typography variant='body2' fontWeight={500}>{b.name}</Typography><Typography variant='caption' color='text.secondary'>Angkatan ke-{b.batch_number} · {b.year}</Typography></Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth size='small'>
          <Select displayEmpty value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0) }}
                  renderValue={val => STATUS_CONFIG[val]?.label || 'Semua Status'}
                  sx={{ borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0', '& .MuiOutlinedInput-notchedOutline': { border: '0.5px solid rgba(180,100,100,0.15) !important' }, '& .MuiSelect-select': { py: '7px', px: '10px' } }}>
            <MenuItem value=''>Semua Status</MenuItem>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <MenuItem key={key} value={key}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <i className={cfg.icon} style={{ fontSize: '14px', color: '#9A5A5A' }} />
                  <span>{cfg.label}</span>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <DebouncedInput fullWidth value={globalFilter} onChange={val => { setGlobalFilter(val); setPage(0) }} placeholder='Cari sprint...'
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15) !important' } }, '& input': { py: '7px', px: '10px', fontSize: '12px' } }}
                        InputProps={{ startAdornment: <InputAdornment position='start'><i className='ri-search-line' style={{ color: '#9A5A5A', fontSize: '14px' }} /></InputAdornment> }}
        />
      </Box>

      {/* Content */}
      {loading ? (
        <Box className='flex justify-center py-10'><CircularProgress /></Box>
      ) : isMobile ? (
        // Mobile — Card List
        <>
          {data.length === 0 ? (
            <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', py: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <i className='ri-flag-line' style={{ fontSize: 40, opacity: 0.25 }} />
              <Typography sx={{ fontSize: '12px', color: '#9A5A5A' }}>Tidak ada sprint ditemukan</Typography>
            </Box>
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
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                      <i className='ri-flag-line' style={{ fontSize: 48, opacity: 0.3 }} />
                      <Typography variant='body2' color='text.secondary'>Tidak ada sprint ditemukan</Typography>
                    </Box>
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
