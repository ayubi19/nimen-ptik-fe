'use client'

import { useEffect, useState, useCallback } from 'react'
import Alert from '@mui/material/Alert'
import Autocomplete from '@mui/material/Autocomplete'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import 'dayjs/locale/id'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Snackbar from '@mui/material/Snackbar'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useSession } from 'next-auth/react'
import { violationApi } from '@/libs/api/violationApi'
import { batchApi, syndicateApi } from '@/libs/api/masterDataApi'
import { nimenIndicatorApi } from '@/libs/api/nimenMasterDataApi'
import { studentsApi } from '@/libs/api/studentsApi'

const fmtDate = (str) => {
  if (!str) return '-'
  return new Date(str).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

const AVATAR_COLORS = ['#E6F1FB', '#E1F5EE', '#FAEEDA', '#FCEBEB', '#EEEDFE']
const AVATAR_TEXT   = ['#0C447C', '#085041', '#633806', '#791F1F', '#3C3489']
const avatarColor   = (name = '') => {
  const i = (name.charCodeAt(0) || 0) % AVATAR_COLORS.length
  return { bg: AVATAR_COLORS[i], color: AVATAR_TEXT[i] }
}

// ── Standard Select Angkatan — PWA native ─────────────────────────────────────
const nativeSelectSx = {
  borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0',
  '& .MuiOutlinedInput-notchedOutline': { border: '0.5px solid rgba(180,100,100,0.15)' },
  '& .MuiSelect-select': { py: '7px', px: '10px' },
}

function BatchSelect({ batches, value, onChange, includeAll = true }) {
  return (
    <FormControl fullWidth size='small'>
      <Select
        displayEmpty
        value={value}
        onChange={e => onChange(e.target.value)}
        renderValue={val => {
          const b = batches.find(x => x.id === val || String(x.id) === String(val))
          return b ? `${b.name} (${b.year})` : (includeAll ? 'Semua Angkatan' : 'Pilih Angkatan')
        }}
        sx={nativeSelectSx}>
        {includeAll && <MenuItem value=''>Semua Angkatan</MenuItem>}
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
  )
}

// ── Avatar — crystal ──────────────────────────────────────────────────────────
function Avatar({ name, size = 36 }) {
  return (
    <Box sx={{
      width: size, height: size, borderRadius: `${size * 0.3}px`, flexShrink: 0,
      background: 'linear-gradient(145deg, #E63946, #6D0E13)',
      boxShadow: '0 3px 8px rgba(180,0,30,0.22), inset 0 1px 0 rgba(255,180,180,0.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.32, fontWeight: 500, color: 'rgba(255,255,255,0.92)',
      position: 'relative', overflow: 'hidden',
    }}>
      {getInitials(name)}
    </Box>
  )
}

// ── Student Cell ──────────────────────────────────────────────────────────────
function StudentCell({ name, nim, batch }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Avatar name={name} />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant='body2' fontWeight={500} noWrap>{name}</Typography>
        <Typography variant='caption' color='text.secondary'>{nim}</Typography>
      </Box>
    </Box>
  )
}

// ── Card Pelanggaran Nilai ────────────────────────────────────────────────────
function ViolationValueCard({ isMobile, batches, showToast, isAdmin, studentID }) {
  const [rows, setRows]       = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(false)
  const [search, setSearch]     = useState('')
  const [batchID, setBatchID]   = useState('')
  const [syndicateID, setSyndicateID] = useState('')
  const [syndicates, setSyndicates]   = useState([])
  const [page, setPage]         = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [openDialog, setOpenDialog] = useState(false)

  // Form state
  const [students, setStudents]     = useState([])
  const [indicator, setIndicator]   = useState(null)
  const [indicators, setIndicators] = useState([])
  const [eventDate, setEventDate]   = useState('')
  const [notes, setNotes]           = useState('')
  const [saving, setSaving]         = useState(false)

  // Load sindikat saat batch dipilih
  useEffect(() => {
    if (!isAdmin || !batchID) { setSyndicates([]); setSyndicateID(''); return }
    syndicateApi.getAll({ is_active: true, page_size: 100 })
      .then(res => setSyndicates(res.data.data?.data || []))
      .catch(() => {})
  }, [isAdmin, batchID])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await violationApi.getValues({
        search, batch_id: batchID || undefined,
        syndicate_id: syndicateID || undefined,
        student_id: studentID || undefined,
        page: page + 1, page_size: pageSize,
      })
      setRows(res.data.data || [])
      setTotal(res.data.total || 0)
    } catch { showToast('Gagal memuat data pelanggaran nilai', 'error') }
    finally { setLoading(false) }
  }, [search, batchID, syndicateID, studentID, page, pageSize, showToast])

  useEffect(() => { fetchData() }, [fetchData])

  const loadIndicators = useCallback(async () => {
    try {
      const res = await nimenIndicatorApi.getAll({ is_active: true, page_size: 100 })
      const all = res.data.data?.data || []
      setIndicators(all.filter(i => i.value < 0))
    } catch {}
  }, [])

  const [formBatchID, setFormBatchID] = useState('')
  const [studentOptions, setStudentOptions] = useState([])

  const loadStudents = useCallback(async (batchId) => {
    if (!batchId) { setStudentOptions([]); setStudent(null); return }
    try {
      const res = await studentsApi.getAll({ batch_id: batchId, page_size: 100 })
      setStudentOptions(res.data.data?.data || [])
    } catch {}
  }, [])

  const handleOpenDialog = () => {
    loadIndicators()
    setStudents([]); setIndicator(null); setEventDate(''); setNotes('')
    // Pre-fill angkatan dari filter yang sudah dipilih
    const initialBatch = batchID || ''
    setFormBatchID(initialBatch)
    if (initialBatch) loadStudents(initialBatch)
    else setStudentOptions([])
    setOpenDialog(true)
  }

  const handleSave = async () => {
    if (!students.length || !indicator || !eventDate) {
      showToast('Mohon lengkapi semua field wajib', 'error')
      return
    }
    setSaving(true)
    try {
      await Promise.all(students.map(s => violationApi.createValue({
        student_id:   s.id,
        indicator_id: indicator.id,
        event_date:   eventDate,
        notes,
      })))
      showToast(`Pelanggaran nilai berhasil dicatat untuk ${students.length} mahasiswa`)
      setOpenDialog(false)
      fetchData()
    } catch (e) {
      showToast(e?.response?.data?.message || 'Gagal menyimpan', 'error')
    } finally { setSaving(false) }
  }

  return (
    <>
      <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: '12px', borderBottom: '0.5px solid rgba(180,100,100,0.1)' }}>
          <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#3B1010' }}>Pelanggaran Nilai</Typography>
          {isAdmin && (
            <Box component='button' onClick={handleOpenDialog} sx={{
              display: 'flex', alignItems: 'center', gap: '4px', px: '10px', py: '5px',
              borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: 'linear-gradient(145deg, #E63946, #6D0E13)',
              boxShadow: '0 3px 8px rgba(180,0,30,0.22)',
            }}>
              <i className='ri-add-line' style={{ fontSize: '13px', color: '#fff' }} />
              <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#fff' }}>Input</Typography>
            </Box>
          )}
        </Box>

        {/* Filter — hanya admin */}
        {isAdmin && (
          <Box sx={{ px: 2, py: '10px', display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '0.5px solid rgba(180,100,100,0.1)' }}>
            <BatchSelect batches={batches} value={batchID}
                         onChange={v => { setBatchID(v); setSyndicateID(''); setPage(0) }} />
            <FormControl fullWidth size='small' disabled={!batchID}>
              <Select displayEmpty value={syndicateID}
                      onChange={e => { setSyndicateID(e.target.value); setPage(0) }}
                      renderValue={val => syndicates.find(s => String(s.id) === String(val))?.name || 'Semua Sindikat'}
                      sx={nativeSelectSx}>
                <MenuItem value=''>Semua Sindikat</MenuItem>
                {syndicates.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField size='small' placeholder='Cari nama / NIM...' value={search}
                       onChange={e => { setSearch(e.target.value); setPage(0) }}
                       sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15)' } }, '& input': { py: '7px', px: '10px', fontSize: '12px' } }}
                       InputProps={{ startAdornment: <InputAdornment position='start'><i className='ri-search-line' style={{ fontSize: '14px', color: '#9A5A5A' }} /></InputAdornment> }} />
          </Box>
        )}

        {/* Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
        ) : isMobile ? (
          <Box>
            {rows.length === 0
              ? <Box sx={{ py: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <i className='ri-file-list-3-line' style={{ fontSize: 32, opacity: 0.3 }} />
                <Typography sx={{ fontSize: '12px', color: '#9A5A5A' }}>Tidak ada data</Typography>
              </Box>
              : rows.map((r, i) => (
                <Box key={r.id} sx={{
                  px: 2, py: '12px',
                  borderBottom: i < rows.length - 1 ? '0.5px solid rgba(180,100,100,0.08)' : 'none',
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', mb: '8px' }}>
                    <Avatar name={r.full_name} size={36} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#3B1010', lineHeight: 1.3 }} noWrap>{r.full_name}</Typography>
                      <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>{r.nim}</Typography>
                    </Box>
                    <Box sx={{ bgcolor: '#FCEBEB', borderRadius: '6px', px: '8px', py: '3px', flexShrink: 0 }}>
                      <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#A32D2D' }}>{r.value}</Typography>
                    </Box>
                  </Box>
                  <Typography sx={{ fontSize: '11px', color: '#9A5A5A', mb: '6px' }}>
                    {r.indicator_name} · {fmtDate(r.event_date)}
                  </Typography>
                  <Box sx={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    bgcolor: r.punishment_active ? '#FCEBEB' : '#F1EFE8',
                    borderRadius: '6px', px: '7px', py: '2px',
                  }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: r.punishment_active ? '#A32D2D' : '#5F5E5A' }} />
                    <Typography sx={{ fontSize: '9px', fontWeight: 500, color: r.punishment_active ? '#A32D2D' : '#5F5E5A' }}>
                      {r.punishment_active ? 'Sanksi Aktif' : 'Selesai'}
                    </Typography>
                  </Box>
                </Box>
              ))}
          </Box>
        ) : (
          // Desktop: table
          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Mahasiswa</TableCell>
                  <TableCell>Indikator</TableCell>
                  <TableCell align='center'>Nilai</TableCell>
                  <TableCell>Tanggal</TableCell>
                  <TableCell>Status Sanksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow><TableCell colSpan={5} align='center'>
                    <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <i className='ri-file-list-3-line' style={{ fontSize: 32, opacity: 0.3 }} />
                      <Typography variant='caption' color='text.secondary'>Tidak ada data</Typography>
                    </Box>
                  </TableCell></TableRow>
                ) : rows.map(r => (
                  <TableRow key={r.id} hover>
                    <TableCell><StudentCell name={r.full_name} nim={r.nim} /></TableCell>
                    <TableCell>
                      <Typography variant='caption' color='text.secondary' sx={{ maxWidth: 160, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.indicator_name}
                      </Typography>
                    </TableCell>
                    <TableCell align='center'>
                      <Chip label={r.value} size='small' color='error' variant='tonal' />
                    </TableCell>
                    <TableCell>
                      <Typography variant='caption' color='text.secondary'>{fmtDate(r.event_date)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={r.punishment_active ? 'Aktif' : 'Selesai'}
                        size='small'
                        color={r.punishment_active ? 'error' : 'default'}
                        variant='tonal'
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <TablePagination
          component='div' count={total} page={page} rowsPerPage={pageSize}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={e => { setPageSize(+e.target.value); setPage(0) }}
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage='Per halaman'
        />
      </Box>

      {/* Dialog Input Pelanggaran Nilai */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}
              fullWidth maxWidth='sm' fullScreen={isMobile}>
        <DialogTitle>Input Pelanggaran Nilai</DialogTitle>
        <Divider />
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2.5 }}>
          <BatchSelect batches={batches} value={formBatchID}
                       onChange={v => { setFormBatchID(v); loadStudents(v) }}
                       includeAll={false} />
          <Autocomplete
            multiple size='small'
            options={studentOptions}
            getOptionLabel={s => s.full_name || ''}
            isOptionEqualToValue={(opt, val) => opt.id === val.id}
            value={students}
            onChange={(_, val) => setStudents(val)}
            disabled={!formBatchID}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    bgcolor: avatarColor(option.full_name).bg, color: avatarColor(option.full_name).color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 500,
                  }}>
                    {getInitials(option.full_name)}
                  </Box>
                  <Box>
                    <Typography variant='body2' fontWeight={500}>{option.full_name}</Typography>
                    <Typography variant='caption' color='text.secondary'>{option.student_profile?.nim || '—'}</Typography>
                  </Box>
                </Box>
              </li>
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const tagProps = getTagProps({ index })
                return (
                  <Chip {...tagProps} key={option.id} label={option.full_name}
                        size='small' color='primary' variant='tonal' />
                )
              })
            }
            renderInput={params => (
              <TextField {...params} label='Mahasiswa *'
                         placeholder={formBatchID ? 'Pilih satu atau lebih mahasiswa...' : 'Pilih angkatan dulu'} />
            )}
          />
          <Autocomplete
            options={indicators}
            getOptionLabel={o => `${o.name} (${o.value})`}
            value={indicator}
            onChange={(_, v) => setIndicator(v)}
            isOptionEqualToValue={(o, v) => o.id === v?.id}
            renderInput={params => <TextField {...params} label='Indikator (nilai negatif) *' size='small' />}
            noOptionsText='Tidak ada indikator negatif'
          />
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale='id'>
            <DatePicker label='Tanggal Kejadian *'
                        value={eventDate ? dayjs(eventDate) : null}
                        onChange={v => setEventDate(v ? v.format('YYYY-MM-DD') : '')}
                        format='DD/MM/YYYY'
                        slotProps={{ textField: { fullWidth: true, size: 'small' } }} />
          </LocalizationProvider>
          <TextField label='Keterangan (opsional)' size='small' multiline rows={2}
                     value={notes} onChange={e => setNotes(e.target.value)} />
          <Box sx={{ bgcolor: '#FAEEDA', borderRadius: 1, p: 1.5 }}>
            <Typography variant='caption' sx={{ color: '#633806' }}>
              Pelanggaran akan langsung sah dan berdampak ke nilai, ranking, dan punishment mahasiswa.
            </Typography>
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button variant='tonal' color='secondary' onClick={() => setOpenDialog(false)}>Batal</Button>
          <Button variant='contained' color='error' onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={16} /> : 'Simpan Pelanggaran'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

// ── Card Catatan Pelanggaran ───────────────────────────────────────────────────
function ViolationNoteCard({ isMobile, batches, showToast, isAdmin, studentID }) {
  const [rows, setRows]       = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(false)
  const [search, setSearch]     = useState('')
  const [batchID, setBatchID]   = useState('')
  const [syndicateID, setSyndicateID] = useState('')
  const [syndicates, setSyndicates]   = useState([])
  const [page, setPage]         = useState(0)
  const [pageSize, setPageSize]       = useState(10)
  const [openDialog, setOpenDialog]   = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Form state
  const [students, setStudents]       = useState([])
  const [studentOptions, setStudentOptions] = useState([])
  const [eventDate, setEventDate]     = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving]           = useState(false)

  useEffect(() => {
    if (!isAdmin || !batchID) { setSyndicates([]); setSyndicateID(''); return }
    syndicateApi.getAll({ is_active: true, page_size: 100 })
      .then(res => setSyndicates(res.data.data?.data || []))
      .catch(() => {})
  }, [isAdmin, batchID])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await violationApi.getNotes({
        search, batch_id: batchID || undefined,
        syndicate_id: syndicateID || undefined,
        student_id: studentID || undefined,
        page: page + 1, page_size: pageSize,
      })
      setRows(res.data.data || [])
      setTotal(res.data.total || 0)
    } catch { showToast('Gagal memuat catatan pelanggaran', 'error') }
    finally { setLoading(false) }
  }, [search, batchID, syndicateID, studentID, page, pageSize, showToast])

  useEffect(() => { fetchData() }, [fetchData])

  const [formBatchID, setFormBatchID] = useState('')

  const loadStudents = useCallback(async (batchId) => {
    if (!batchId) { setStudentOptions([]); setStudents([]); return }
    try {
      const res = await studentsApi.getAll({ batch_id: batchId, page_size: 100 })
      setStudentOptions(res.data.data?.data || [])
    } catch {}
  }, [])

  const handleSave = async () => {
    if (!students.length || !eventDate || !description.trim()) {
      showToast('Mohon lengkapi semua field wajib', 'error')
      return
    }
    setSaving(true)
    try {
      await Promise.all(students.map(s => violationApi.createNote({
        student_id:  s.id,
        event_date:  eventDate,
        description: description.trim(),
      })))
      showToast(`Catatan berhasil disimpan untuk ${students.length} mahasiswa`)
      setOpenDialog(false)
      fetchData()
    } catch (e) {
      showToast(e?.response?.data?.message || 'Gagal menyimpan', 'error')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await violationApi.deleteNote(deleteTarget.id)
      showToast('Catatan berhasil dihapus')
      setDeleteTarget(null)
      fetchData()
    } catch { showToast('Gagal menghapus catatan', 'error') }
  }

  return (
    <>
      <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: '12px', borderBottom: '0.5px solid rgba(180,100,100,0.1)' }}>
          <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#3B1010' }}>Catatan Pelanggaran</Typography>
          {isAdmin && (
            <Box component='button' onClick={() => {
              setStudents([]); setEventDate(''); setDescription('')
              const initialBatch = batchID || ''
              setFormBatchID(initialBatch)
              if (initialBatch) loadStudents(initialBatch)
              else setStudentOptions([])
              setOpenDialog(true)
            }} sx={{
              display: 'flex', alignItems: 'center', gap: '4px', px: '10px', py: '5px',
              borderRadius: '8px', cursor: 'pointer',
              background: 'rgba(255,255,255,0.72)', border: '0.5px solid rgba(180,100,100,0.18)',
              boxShadow: '0 2px 6px rgba(139,0,0,0.07)',
            }}>
              <i className='ri-add-line' style={{ fontSize: '13px', color: '#8B2020' }} />
              <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#8B2020' }}>Tambah</Typography>
            </Box>
          )}
        </Box>

        {/* Filter — hanya admin */}
        {isAdmin && (
          <Box sx={{ px: 2, py: '10px', display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '0.5px solid rgba(180,100,100,0.1)' }}>
            <BatchSelect batches={batches} value={batchID}
                         onChange={v => { setBatchID(v); setSyndicateID(''); setPage(0) }} />
            <FormControl fullWidth size='small' disabled={!batchID}>
              <Select displayEmpty value={syndicateID}
                      onChange={e => { setSyndicateID(e.target.value); setPage(0) }}
                      renderValue={val => syndicates.find(s => String(s.id) === String(val))?.name || 'Semua Sindikat'}
                      sx={nativeSelectSx}>
                <MenuItem value=''>Semua Sindikat</MenuItem>
                {syndicates.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField size='small' placeholder='Cari nama / NIM...' value={search}
                       onChange={e => { setSearch(e.target.value); setPage(0) }}
                       sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15)' } }, '& input': { py: '7px', px: '10px', fontSize: '12px' } }}
                       InputProps={{ startAdornment: <InputAdornment position='start'><i className='ri-search-line' style={{ fontSize: '14px', color: '#9A5A5A' }} /></InputAdornment> }} />
          </Box>
        )}

        {/* Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
        ) : isMobile ? (
          <Box>
            {rows.length === 0
              ? <Box sx={{ py: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <i className='ri-file-list-3-line' style={{ fontSize: 32, opacity: 0.3 }} />
                <Typography sx={{ fontSize: '12px', color: '#9A5A5A' }}>Tidak ada catatan</Typography>
              </Box>
              : rows.map((r, i) => (
                <Box key={r.id} sx={{
                  px: 2, py: '12px',
                  borderBottom: i < rows.length - 1 ? '0.5px solid rgba(180,100,100,0.08)' : 'none',
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', mb: '6px' }}>
                    <Avatar name={r.full_name} size={36} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#3B1010', lineHeight: 1.3 }} noWrap>{r.full_name}</Typography>
                      <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>{r.nim}</Typography>
                    </Box>
                    {isAdmin && (
                      <Box component='button' onClick={() => setDeleteTarget(r)} sx={{
                        width: 28, height: 28, borderRadius: '8px', border: 'none', cursor: 'pointer',
                        bgcolor: '#FCEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <i className='ri-delete-bin-line' style={{ fontSize: '14px', color: '#A32D2D' }} />
                      </Box>
                    )}
                  </Box>
                  <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>
                    {r.description} · {fmtDate(r.event_date)}
                  </Typography>
                </Box>
              ))}
          </Box>
        ) : (
          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Mahasiswa</TableCell>
                  <TableCell>Keterangan</TableCell>
                  <TableCell>Tanggal</TableCell>
                  <TableCell>Dicatat oleh</TableCell>
                  {isAdmin && <TableCell align='center'>Aksi</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow><TableCell colSpan={isAdmin ? 5 : 4} align='center'>
                    <Typography variant='caption' color='text.secondary'>Tidak ada catatan</Typography>
                  </TableCell></TableRow>
                ) : rows.map(r => (
                  <TableRow key={r.id} hover>
                    <TableCell><StudentCell name={r.full_name} nim={r.nim} /></TableCell>
                    <TableCell>
                      <Typography variant='caption' color='text.secondary'
                                  sx={{ maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='caption' color='text.secondary'>{fmtDate(r.event_date)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='caption' color='text.secondary'>{r.recorded_by}</Typography>
                    </TableCell>
                    {isAdmin && <TableCell align='center'>
                      <Tooltip title='Hapus catatan'>
                        <IconButton size='small' color='error' onClick={() => setDeleteTarget(r)}>
                          <i className='ri-delete-bin-line' style={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <TablePagination
          component='div' count={total} page={page} rowsPerPage={pageSize}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={e => { setPageSize(+e.target.value); setPage(0) }}
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage='Per halaman'
        />
      </Box>

      {/* Dialog Tambah Catatan */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}
              fullWidth maxWidth='sm' fullScreen={isMobile}>
        <DialogTitle>Tambah Catatan Pelanggaran</DialogTitle>
        <Divider />
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2.5 }}>
          <BatchSelect batches={batches} value={formBatchID}
                       onChange={v => { setFormBatchID(v); loadStudents(v) }}
                       includeAll={false} />
          <Autocomplete
            multiple size='small'
            options={studentOptions}
            getOptionLabel={s => s.full_name || ''}
            isOptionEqualToValue={(opt, val) => opt.id === val.id}
            value={students}
            onChange={(_, val) => setStudents(val)}
            disabled={!formBatchID}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    bgcolor: avatarColor(option.full_name).bg, color: avatarColor(option.full_name).color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 500,
                  }}>
                    {getInitials(option.full_name)}
                  </Box>
                  <Box>
                    <Typography variant='body2' fontWeight={500}>{option.full_name}</Typography>
                    <Typography variant='caption' color='text.secondary'>{option.student_profile?.nim || '—'}</Typography>
                  </Box>
                </Box>
              </li>
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const tagProps = getTagProps({ index })
                return (
                  <Chip {...tagProps} key={option.id} label={option.full_name}
                        size='small' color='primary' variant='tonal' />
                )
              })
            }
            renderInput={params => (
              <TextField {...params} label='Mahasiswa *'
                         placeholder={formBatchID ? 'Pilih satu atau lebih mahasiswa...' : 'Pilih angkatan dulu'} />
            )}
          />
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale='id'>
            <DatePicker label='Tanggal Kejadian *'
                        value={eventDate ? dayjs(eventDate) : null}
                        onChange={v => setEventDate(v ? v.format('YYYY-MM-DD') : '')}
                        format='DD/MM/YYYY'
                        slotProps={{ textField: { fullWidth: true, size: 'small' } }} />
          </LocalizationProvider>
          <TextField label='Keterangan *' size='small' multiline rows={3}
                     value={description} onChange={e => setDescription(e.target.value)}
                     placeholder='Deskripsikan pelanggaran...' />
          <Box sx={{ bgcolor: '#E1F5EE', borderRadius: 1, p: 1.5 }}>
            <Typography variant='caption' sx={{ color: '#085041' }}>
              Catatan ini tidak berdampak ke nilai mental mahasiswa, hanya sebagai rekam jejak.
            </Typography>
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button variant='tonal' color='secondary' onClick={() => setOpenDialog(false)}>Batal</Button>
          <Button variant='contained' onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={16} /> : 'Simpan Catatan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Konfirmasi Hapus */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth='xs' fullWidth>
        <DialogTitle>Hapus Catatan?</DialogTitle>
        <DialogContent>
          <Typography variant='body2'>
            Catatan pelanggaran untuk <strong>{deleteTarget?.full_name}</strong> akan dihapus permanen.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button variant='tonal' color='secondary' onClick={() => setDeleteTarget(null)}>Batal</Button>
          <Button variant='contained' color='error' onClick={handleDelete}>Hapus</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

// ── Main View ─────────────────────────────────────────────────────────────────
export default function ViolationView() {
  const [batches, setBatches] = useState([])
  const [toast, setToast]     = useState({ open: false, message: '', severity: 'success' })
  const isMobile              = useMediaQuery(theme => theme.breakpoints.down('md'))
  const { data: session }     = useSession()

  const jwtPayload = session?.user?.accessToken
    ? (() => { try { return JSON.parse(atob(session.user.accessToken.split('.')[1])) } catch { return {} } })()
    : {}
  const isDeveloper = jwtPayload?.is_developer === true
  const roles       = session?.user?.roles || []
  const isAdmin     = isDeveloper || roles.some(r => (typeof r === 'string' ? r : r.name) === 'admin_nimen')
  const studentID   = !isAdmin ? session?.user?.id : null

  const showToast = useCallback((msg, severity = 'success') =>
    setToast({ open: true, message: msg, severity }), [])

  useEffect(() => {
    batchApi.getAllActive()
      .then(res => setBatches(res.data.data || []))
      .catch(() => {})
  }, [])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Topbar PWA */}
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
          <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>AKADEMIK</Typography>
          <Typography sx={{ fontSize: '16px', fontWeight: 500, color: '#3B1010' }}>Pelanggaran</Typography>
        </Box>
      </Box>

      <ViolationValueCard isMobile={isMobile} batches={batches} showToast={showToast}
                          isAdmin={isAdmin} studentID={studentID} />
      <ViolationNoteCard isMobile={isMobile} batches={batches} showToast={showToast}
                         isAdmin={isAdmin} studentID={studentID} />

      <Snackbar open={toast.open} autoHideDuration={4000}
                onClose={() => setToast(p => ({ ...p, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity={toast.severity} onClose={() => setToast(p => ({ ...p, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
