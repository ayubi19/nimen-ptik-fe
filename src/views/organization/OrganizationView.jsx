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
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Snackbar from '@mui/material/Snackbar'
import Switch from '@mui/material/Switch'
import Tab from '@mui/material/Tab'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Autocomplete from '@mui/material/Autocomplete'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { useForm, Controller } from 'react-hook-form'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import 'dayjs/locale/id'
import { studentPositionApi, positionAssignmentApi } from '@/libs/api/organizationApi'
import { nimenIndicatorApi } from '@/libs/api/nimenMasterDataApi'
import { batchApi } from '@/libs/api/masterDataApi'
import { studentsApi } from '@/libs/api/studentsApi'
import { getInitials } from '@/utils/getInitials'

dayjs.locale('id')

// ── Assignment Mobile Card — PWA Native style ─────────────────────────────────
const AssignmentMobileCard = ({ a, onEdit, onDelete }) => {
  const isActive = a.is_active
  return (
    <Box sx={{
      background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)',
      borderRadius: '12px', padding: '12px', mb: '10px',
    }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', mb: '10px' }}>
        <Avatar sx={{
          width: 40, height: 40, borderRadius: '12px !important',
          background: 'linear-gradient(145deg, #E63946, #6D0E13)',
          boxShadow: '0 3px 8px rgba(180,0,30,0.22), inset 0 1px 0 rgba(255,180,180,0.35)',
          fontSize: 11, fontWeight: 500, flexShrink: 0,
        }}>
          {getInitials(a.user?.full_name || '')}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#3B1010', lineHeight: 1.3 }} noWrap>
            {a.user?.full_name || '—'}
          </Typography>
          <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>
            {a.user?.student_profile?.nim || '—'}
          </Typography>
        </Box>
        <Box sx={{
          bgcolor: isActive ? '#E1F5EE' : '#F1EFE8',
          borderRadius: '6px', px: 1, py: '3px', flexShrink: 0,
        }}>
          <Typography sx={{ fontSize: '10px', fontWeight: 500, color: isActive ? '#0F6E56' : '#5F5E5A' }}>
            {isActive ? 'Aktif' : 'Nonaktif'}
          </Typography>
        </Box>
      </Box>

      {/* Meta */}
      <Box sx={{
        py: '8px',
        borderTop: '0.5px solid rgba(180,100,100,0.1)',
        borderBottom: '0.5px solid rgba(180,100,100,0.1)',
        mb: '10px', display: 'flex', flexDirection: 'column', gap: '4px',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i className='ri-shield-star-line' style={{ fontSize: '12px', color: '#9A5A5A', flexShrink: 0 }} />
          <Typography sx={{ fontSize: '11px', fontWeight: 500, color: '#3B1010' }}>
            {a.position?.display_name || '—'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i className='ri-calendar-line' style={{ fontSize: '12px', color: '#9A5A5A', flexShrink: 0 }} />
          <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>
            {a.period_start ? dayjs(a.period_start).format('DD/MM/YYYY') : '—'}
            {a.period_end ? ` – ${dayjs(a.period_end).format('DD/MM/YYYY')}` : ' – sekarang'}
          </Typography>
        </Box>
      </Box>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: '6px' }}>
        <Box component='button' onClick={() => onEdit(a)} sx={{
          flex: 1, py: '5px', borderRadius: '8px', fontSize: '10px', fontWeight: 500,
          border: '0.5px solid rgba(180,100,100,0.18)',
          background: 'rgba(255,255,255,0.72)',
          boxShadow: '0 2px 6px rgba(139,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.9)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
          color: '#444441',
        }}>
          <i className='ri-edit-line' style={{ fontSize: '11px' }} /> Edit
        </Box>
        <Box component='button' onClick={() => onDelete(a)} sx={{
          flex: 1, py: '5px', borderRadius: '8px', fontSize: '10px', fontWeight: 500,
          border: '0.5px solid rgba(163,45,45,0.2)',
          background: '#FCEBEB', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
          color: '#A32D2D',
        }}>
          <i className='ri-delete-bin-line' style={{ fontSize: '11px' }} /> Hapus
        </Box>
      </Box>
    </Box>
  )
}

// ── Tab Struktur Organisasi ───────────────────────────────────────────────────
const OrganizationStructureTab = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [batches, setBatches]           = useState([])
  const [selectedBatch, setSelectedBatch] = useState('')
  const [positions, setPositions]       = useState([])
  const [assignments, setAssignments]   = useState([])
  const [total, setTotal]               = useState(0)
  const [loading, setLoading]           = useState(false)
  const [page, setPage]                 = useState(0)
  const [pageSize, setPageSize]         = useState(20)
  const [drawerOpen, setDrawerOpen]     = useState(false)
  const [editData, setEditData]         = useState(null)
  const [formLoading, setFormLoading]   = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')
  const [studentOptions, setStudentOptions] = useState([])
  const [studentLoading, setStudentLoading] = useState(false)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const showToast = useCallback((msg, severity = 'success') =>
    setToast({ open: true, message: msg, severity }), [])

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { user_id: '', position_id: '', period_start: null, period_end: null, notes: '', is_active: true }
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

  // Debounce search mahasiswa
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
    reset({ user_id: '', position_id: '', period_start: null, period_end: null, notes: '', is_active: true })
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
      setDeleteTarget(null)
      fetchAssignments()
    } catch (err) {
      showToast(err.message || 'Gagal menghapus', 'error')
    } finally {
      setDeleteLoading(false)
    }
  }, [deleteTarget, fetchAssignments, showToast])

  const totalAktif = assignments.filter(a => a.is_active).length

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale='id'>

      {/* Filter PWA + Tombol */}
      <Box sx={{
        background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)',
        borderRadius: '12px', p: '10px 12px', mb: '10px',
        display: 'flex', gap: '8px', alignItems: 'center',
      }}>
        <FormControl size='small' sx={{ flex: 1 }}>
          <Select
            displayEmpty
            value={selectedBatch}
            onChange={e => { setSelectedBatch(e.target.value); setPage(0) }}
            renderValue={val => {
              const b = batches.find(x => x.id === val)
              return b ? `${b.name} (${b.year})` : 'Pilih Angkatan'
            }}
            sx={{
              borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0',
              '& .MuiOutlinedInput-notchedOutline': { border: '0.5px solid rgba(180,100,100,0.15)' },
              '& .MuiSelect-select': { py: '7px', px: '10px' },
            }}
          >
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
        {selectedBatch && (
          <Box component='button' onClick={handleOpenCreate} sx={{
            display: 'flex', alignItems: 'center', gap: '4px',
            px: '10px', py: '7px', borderRadius: '8px', cursor: 'pointer',
            background: 'linear-gradient(145deg, #E63946, #6D0E13)',
            boxShadow: '0 4px 10px rgba(180,0,30,0.25)',
            border: 'none', flexShrink: 0,
          }}>
            <i className='ri-user-star-line' style={{ fontSize: '14px', color: '#fff' }} />
            <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#fff' }}>Assign</Typography>
          </Box>
        )}
      </Box>

      {/* Stats crystal — hanya tampil kalau sudah pilih angkatan */}
      {selectedBatch && assignments.length > 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', mb: '10px' }}>
          {[
            { label: 'Total Pejabat', value: total,      icon: 'ri-group-line' },
            { label: 'Aktif',         value: totalAktif, icon: 'ri-checkbox-circle-line' },
          ].map(s => (
            <Box key={s.label} sx={{
              background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)',
              borderRadius: '12px', padding: '10px 12px',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
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
                <Typography sx={{ fontSize: '20px', fontWeight: 500, color: '#3B1010', lineHeight: 1 }}>{s.value}</Typography>
                <Typography sx={{ fontSize: '10px', color: '#9A5A5A', mt: '2px', lineHeight: 1.3 }}>{s.label}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Content */}
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
          <Typography variant='body2'>Belum ada pejabat untuk angkatan ini</Typography>
          <Button variant='contained' size='small' startIcon={<i className='ri-add-line' />}
                  onClick={handleOpenCreate}>
            Assign Jabatan Pertama
          </Button>
        </Box>
      ) : isMobile ? (
        // ── Mobile: Card List ──
        <>
          {assignments.map(a => (
            <AssignmentMobileCard key={a.id} a={a}
                                  onEdit={handleOpenEdit} onDelete={setDeleteTarget} />
          ))}
          <TablePagination component='div' count={total} page={page} rowsPerPage={pageSize}
                           onPageChange={(_, p) => setPage(p)}
                           onRowsPerPageChange={e => { setPageSize(parseInt(e.target.value)); setPage(0) }}
                           rowsPerPageOptions={[20, 50]}
                           labelRowsPerPage='Baris:'
                           labelDisplayedRows={({ from, to, count }) => `${from}–${to} dari ${count}`}
          />
        </>
      ) : (
        // ── Desktop: Table ──
        <Card>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                {['Mahasiswa', 'NIM', 'Jabatan', 'Periode', 'Status', 'Aksi'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {assignments.map(a => (
                <TableRow key={a.id} hover>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <Avatar sx={{ width: 32, height: 32, fontSize: 12 }}>
                        {getInitials(a.user?.full_name || '')}
                      </Avatar>
                      <Typography variant='body2' fontWeight={600}>{a.user?.full_name || '—'}</Typography>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2'>{a.user?.student_profile?.nim || '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={a.position?.display_name || '—'} size='small' color='primary' variant='tonal' />
                  </TableCell>
                  <TableCell>
                    <Typography variant='caption'>
                      {a.period_start ? dayjs(a.period_start).format('DD/MM/YYYY') : '—'}
                      {a.period_end ? ` – ${dayjs(a.period_end).format('DD/MM/YYYY')}` : ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={a.is_active ? 'Aktif' : 'Nonaktif'}
                          color={a.is_active ? 'success' : 'secondary'} size='small' variant='tonal' />
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-0.5'>
                      <IconButton size='small' onClick={() => handleOpenEdit(a)}>
                        <i className='ri-edit-line text-[20px]' />
                      </IconButton>
                      <IconButton size='small' color='error' onClick={() => setDeleteTarget(a)}>
                        <i className='ri-delete-bin-line text-[20px]' />
                      </IconButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination component='div' count={total} page={page} rowsPerPage={pageSize}
                           onPageChange={(_, p) => setPage(p)}
                           onRowsPerPageChange={e => { setPageSize(parseInt(e.target.value)); setPage(0) }}
                           rowsPerPageOptions={[20, 50]}
                           labelRowsPerPage='Baris per halaman:'
                           labelDisplayedRows={({ from, to, count }) => `${from}–${to} dari ${count}`}
          />
        </Card>
      )}

      {/* Drawer Assign */}
      <Drawer anchor='right' open={drawerOpen} onClose={() => setDrawerOpen(false)}
              PaperProps={{ sx: { width: { xs: '100%', sm: 440 } } }}>
        <div className='flex items-center justify-between p-4 border-b'>
          <Typography variant='h6'>{editData ? 'Edit Assignment' : 'Assign Jabatan'}</Typography>
          <IconButton onClick={() => setDrawerOpen(false)}><i className='ri-close-line' /></IconButton>
        </div>
        <form onSubmit={handleSubmit(handleSubmitForm)} className='flex flex-col gap-4 p-4 overflow-y-auto'>
          {!editData && (
            <>
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
                          <FormControlLabel
                            control={<Switch checked={field.value} onChange={e => field.onChange(e.target.checked)} />}
                            label='Status Aktif'
                          />
                        )}
            />
          )}
          <div className='flex gap-2 mt-2'>
            <Button fullWidth variant='tonal' color='secondary'
                    onClick={() => setDrawerOpen(false)} disabled={formLoading}>Batal</Button>
            <Button fullWidth variant='contained' type='submit' disabled={formLoading}
                    startIcon={formLoading ? <CircularProgress size={16} color='inherit' /> : null}>
              {formLoading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Dialog Hapus */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth='xs' fullWidth>
        <DialogTitle>Hapus Assignment?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Hapus jabatan <strong>{deleteTarget?.position?.display_name}</strong> dari <strong>{deleteTarget?.user?.full_name}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions className='p-4 gap-2'>
          <Button variant='tonal' color='secondary' onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>Batal</Button>
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
               onClose={() => setToast(t => ({ ...t, open: false }))}>{toast.message}</Alert>
      </Snackbar>
    </LocalizationProvider>
  )
}

// ── Tab Master Jabatan ────────────────────────────────────────────────────────
const PositionMasterTab = () => {
  const [positions, setPositions]   = useState([])
  const [indicators, setIndicators] = useState([])
  const [loading, setLoading]       = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editData, setEditData]     = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const showToast = useCallback((msg, severity = 'success') =>
    setToast({ open: true, message: msg, severity }), [])

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { name: '', display_name: '', description: '', indicator_id: '', is_active: true }
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

  useEffect(() => {
    // Ambil indikator kategori AUTOMATIC (nilai jabatan) untuk dipilih
    nimenIndicatorApi.getAll({ page: 1, page_size: 100, is_active: true })
      .then(res => setIndicators(res.data.data?.data || []))
      .catch(() => {})
  }, [])

  const handleOpenCreate = useCallback(() => {
    setEditData(null)
    reset({ name: '', display_name: '', description: '', is_active: true })
    setDrawerOpen(true)
  }, [reset])

  const handleOpenEdit = useCallback((pos) => {
    setEditData(pos)
    reset({ name: pos.name, display_name: pos.display_name, description: pos.description || '', indicator_id: pos.indicator_id || '', is_active: pos.is_active })
    setDrawerOpen(true)
  }, [reset])

  const handleSubmitForm = useCallback(async (values) => {
    setFormLoading(true)
    try {
      if (editData) {
        await studentPositionApi.update(editData.id, {
          display_name: values.display_name,
          description: values.description || '',
          indicator_id: values.indicator_id ? parseInt(values.indicator_id) : null,
          is_active: values.is_active,
        })
        showToast('Jabatan berhasil diperbarui')
      } else {
        await studentPositionApi.create({
          name: values.name,
          display_name: values.display_name,
          description: values.description || '',
          indicator_id: values.indicator_id ? parseInt(values.indicator_id) : null,
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
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        mb: '10px',
      }}>
        <Typography sx={{ fontSize: '12px', color: '#9A5A5A' }}>
          {positions.length} jabatan terdaftar
        </Typography>
        <Box component='button' onClick={handleOpenCreate} sx={{
          display: 'flex', alignItems: 'center', gap: '4px',
          px: '12px', py: '7px', borderRadius: '8px', cursor: 'pointer',
          background: 'linear-gradient(145deg, #E63946, #6D0E13)',
          boxShadow: '0 4px 10px rgba(180,0,30,0.25)',
          border: 'none',
        }}>
          <i className='ri-add-line' style={{ fontSize: '14px', color: '#fff' }} />
          <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#fff' }}>Tambah Jabatan</Typography>
        </Box>
      </Box>

      {loading ? (
        <Box className='flex justify-center py-10'><CircularProgress /></Box>
      ) : (
        <div className='flex flex-col gap-3'>
          {positions.map(pos => (
            <Box key={pos.id} sx={{
              background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)',
              borderRadius: '12px', padding: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
            }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {/* Nama + status */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', mb: '4px' }}>
                  <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#3B1010' }}>
                    {pos.display_name}
                  </Typography>
                  <Box sx={{
                    bgcolor: pos.is_active ? '#E1F5EE' : '#F1EFE8',
                    borderRadius: '6px', px: '6px', py: '2px',
                  }}>
                    <Typography sx={{ fontSize: '9px', fontWeight: 500, color: pos.is_active ? '#0F6E56' : '#5F5E5A' }}>
                      {pos.is_active ? 'Aktif' : 'Nonaktif'}
                    </Typography>
                  </Box>
                  {pos.indicator_id
                    ? <Box sx={{ bgcolor: '#E6F1FB', borderRadius: '6px', px: '6px', py: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <i className='ri-calendar-check-line' style={{ fontSize: '9px', color: '#185FA5' }} />
                      <Typography sx={{ fontSize: '9px', fontWeight: 500, color: '#185FA5' }}>Ada nilai bulanan</Typography>
                    </Box>
                    : <Box sx={{ bgcolor: '#FAEEDA', borderRadius: '6px', px: '6px', py: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <i className='ri-alert-line' style={{ fontSize: '9px', color: '#BA7517' }} />
                      <Typography sx={{ fontSize: '9px', fontWeight: 500, color: '#BA7517' }}>Belum ada nilai</Typography>
                    </Box>
                  }
                </Box>
                {/* Kode jabatan */}
                <Typography sx={{ fontSize: '10px', color: '#9A5A5A', fontFamily: 'monospace' }}>
                  {pos.name}{pos.description ? ` — ${pos.description}` : ''}
                </Typography>
              </Box>
              {/* Edit button */}
              <Box component='button' onClick={() => handleOpenEdit(pos)} sx={{
                width: 32, height: 32, borderRadius: '8px', flexShrink: 0,
                background: 'rgba(255,255,255,0.72)',
                border: '0.5px solid rgba(180,100,100,0.18)',
                boxShadow: '0 2px 6px rgba(139,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.9)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className='ri-edit-line' style={{ fontSize: '14px', color: '#8B2020' }} />
              </Box>
            </Box>
          ))}
        </div>
      )}

      {/* Drawer */}
      <Drawer anchor='right' open={drawerOpen} onClose={() => setDrawerOpen(false)}
              PaperProps={{ sx: { width: { xs: '100%', sm: 420 } } }}>
        <div className='flex items-center justify-between p-4 border-b'>
          <Typography variant='h6'>{editData ? 'Edit Jabatan' : 'Tambah Jabatan'}</Typography>
          <IconButton onClick={() => setDrawerOpen(false)}><i className='ri-close-line' /></IconButton>
        </div>
        <form onSubmit={handleSubmit(handleSubmitForm)} className='flex flex-col gap-4 p-4'>
          {!editData && (
            <Controller name='name' control={control}
                        rules={{ required: 'Wajib diisi', pattern: { value: /^[a-z0-9_]+$/, message: 'Hanya huruf kecil, angka, underscore' } }}
                        render={({ field }) => (
                          <TextField {...field} fullWidth label='Kode Jabatan' placeholder='contoh: ketua_angkatan'
                                     helperText={errors.name?.message || 'Tidak bisa diubah setelah dibuat'}
                                     error={!!errors.name} />
                        )}
            />
          )}
          <Controller name='display_name' control={control}
                      rules={{ required: 'Nama tampilan wajib diisi' }}
                      render={({ field }) => (
                        <TextField {...field} fullWidth label='Nama Jabatan' placeholder='contoh: Ketua Angkatan'
                                   error={!!errors.display_name} helperText={errors.display_name?.message} />
                      )}
          />
          <Controller name='description' control={control}
                      render={({ field }) => (
                        <TextField {...field} fullWidth multiline rows={2} label='Deskripsi (opsional)' />
                      )}
          />
          <Controller name='indicator_id' control={control}
                      render={({ field }) => (
                        <Autocomplete
                          options={[{ id: '', name: 'Tidak ada nilai bulanan', value: null, variable: null }, ...indicators]}
                          getOptionLabel={opt => opt.name || ''}
                          isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                          value={indicators.find(ind => ind.id === parseInt(field.value)) || (field.value === '' ? { id: '', name: 'Tidak ada nilai bulanan' } : null)}
                          onChange={(_, val) => field.onChange(val?.id || '')}
                          renderOption={(props, opt) => (
                            <li {...props} key={opt.id}>
                              {opt.id === '' ? (
                                <Typography variant='body2' color='text.secondary'>Tidak ada nilai bulanan</Typography>
                              ) : (
                                <div>
                                  <Typography variant='body2'>{opt.name}</Typography>
                                  <Typography variant='caption' color='text.secondary'>
                                    {opt.value > 0 ? `+${opt.value}` : opt.value} · {opt.variable?.name}
                                  </Typography>
                                </div>
                              )}
                            </li>
                          )}
                          renderInput={params => (
                            <TextField {...params} label='Indikator Nilai Bulanan (opsional)'
                                       placeholder='Cari indikator...'
                                       helperText='Indikator ini diberikan otomatis setiap bulan kepada pejabat dengan jabatan ini'
                            />
                          )}
                        />
                      )}
          />
          {editData && (
            <Controller name='is_active' control={control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={<Switch checked={field.value} onChange={e => field.onChange(e.target.checked)} />}
                            label='Status Aktif'
                          />
                        )}
            />
          )}
          <div className='flex gap-2 mt-2'>
            <Button fullWidth variant='tonal' color='secondary'
                    onClick={() => setDrawerOpen(false)} disabled={formLoading}>Batal</Button>
            <Button fullWidth variant='contained' type='submit' disabled={formLoading}
                    startIcon={formLoading ? <CircularProgress size={16} color='inherit' /> : null}>
              {formLoading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Drawer>

      <Snackbar open={toast.open} autoHideDuration={4000}
                onClose={() => setToast(t => ({ ...t, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity={toast.severity} variant='filled'
               onClose={() => setToast(t => ({ ...t, open: false }))}>{toast.message}</Alert>
      </Snackbar>
    </>
  )
}

// ── Main View ─────────────────────────────────────────────────────────────────
const OrganizationView = () => {
  const [activeTab, setActiveTab] = useState(0)

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
        }} onClick={() => window.history.back()}>
          <i className='ri-arrow-left-s-line' style={{ fontSize: '20px', color: '#8B2020', position: 'relative', zIndex: 1 }} />
        </Box>
        <Box>
          <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>Mahasiswa</Typography>
          <Typography sx={{ fontSize: '16px', fontWeight: 500, color: '#3B1010' }}>Struktur Organisasi</Typography>
        </Box>
      </Box>

      {/* Tab — PWA native style */}
      <Box sx={{
        display: 'flex', gap: '8px', mb: '12px',
        background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)',
        borderRadius: '12px', p: '6px',
      }}>
        {[
          { label: 'Struktur Organisasi', icon: 'ri-organization-chart' },
          { label: 'Master Jabatan',      icon: 'ri-list-settings-line' },
        ].map((t, i) => (
          <Box key={t.label} onClick={() => setActiveTab(i)} sx={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '6px', py: '8px', borderRadius: '8px', cursor: 'pointer',
            background: activeTab === i
              ? 'linear-gradient(145deg, #E63946, #6D0E13)'
              : 'transparent',
            boxShadow: activeTab === i
              ? '0 4px 10px rgba(180,0,30,0.25), inset 0 1px 0 rgba(255,180,180,0.45)'
              : 'none',
            transition: 'all 0.2s',
          }}>
            <i className={t.icon} style={{ fontSize: '14px', color: activeTab === i ? 'rgba(255,255,255,0.92)' : '#9A5A5A' }} />
            <Typography sx={{ fontSize: '11px', fontWeight: 500, color: activeTab === i ? '#fff' : '#9A5A5A' }}>
              {t.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {activeTab === 0 && <OrganizationStructureTab />}
      {activeTab === 1 && <PositionMasterTab />}
    </>
  )
}

export default OrganizationView
