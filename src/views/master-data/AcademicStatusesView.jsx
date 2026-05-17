'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import Box from '@mui/material/Box'
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
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Switch from '@mui/material/Switch'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { useForm, Controller } from 'react-hook-form'
import { academicStatusApi } from '@/libs/api/masterDataApi'

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
const StatusMobileCard = ({ status, onEdit, onDelete }) => (
  <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', padding: '12px', mb: '10px' }}>
    {/* Header */}
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '8px' }}>
      <Box>
        <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#3B1010', lineHeight: 1.3 }}>
          {status.name}
        </Typography>
        {status.code && (
          <Typography sx={{ fontSize: '10px', color: '#9A5A5A' }}>Kode: {status.code}</Typography>
        )}
      </Box>
      <Box sx={{ bgcolor: status.is_active ? '#E1F5EE' : '#F1EFE8', borderRadius: '6px', px: 1, py: '3px', flexShrink: 0 }}>
        <Typography sx={{ fontSize: '10px', fontWeight: 500, color: status.is_active ? '#0F6E56' : '#5F5E5A' }}>
          {status.is_active ? 'Aktif' : 'Nonaktif'}
        </Typography>
      </Box>
    </Box>

    {/* Actions */}
    <Box sx={{ display: 'flex', gap: '6px', borderTop: '0.5px solid rgba(180,100,100,0.1)', pt: '8px', mt: '4px' }}>
      <Box component='button' onClick={() => onEdit(status)} sx={{
        flex: 1, py: '5px', borderRadius: '8px', fontSize: '10px', fontWeight: 500,
        border: '0.5px solid rgba(180,100,100,0.18)', background: 'rgba(255,255,255,0.72)',
        boxShadow: '0 2px 6px rgba(139,0,0,0.07)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#444441',
      }}>
        <i className='ri-edit-line' style={{ fontSize: '11px' }} /> Edit
      </Box>
      <Box component='button' onClick={() => onDelete(status)} sx={{
        flex: 1, py: '5px', borderRadius: '8px', fontSize: '10px', fontWeight: 500,
        border: '0.5px solid rgba(163,45,45,0.2)', background: '#FCEBEB', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#A32D2D',
      }}>
        <i className='ri-delete-bin-line' style={{ fontSize: '11px' }} /> Hapus
      </Box>
    </Box>
  </Box>
)

// ── Main View ─────────────────────────────────────────────────────────────────
const AcademicStatusesView = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [data, setData]               = useState([])
  const [loading, setLoading]         = useState(false)
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [drawerOpen, setDrawerOpen]   = useState(false)
  const [editData, setEditData]       = useState(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const showToast = useCallback((msg, severity = 'success') =>
    setToast({ open: true, message: msg, severity }), [])

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { name: '', code: '', is_active: true }
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await academicStatusApi.getAll({ page: 1, page_size: 100 })
      setData(res.data.data?.data || [])
    } catch {
      showToast('Gagal memuat data status akademik', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { fetchData() }, [fetchData])

  const handleOpenCreate = useCallback(() => {
    setEditData(null)
    reset({ name: '', code: '', is_active: true })
    setDrawerOpen(true)
  }, [reset])

  const handleOpenEdit = useCallback((row) => {
    setEditData(row)
    reset({ name: row.name, code: row.code || '', is_active: row.is_active })
    setDrawerOpen(true)
  }, [reset])

  const handleSave = useCallback(async (values) => {
    setSaveLoading(true)
    try {
      const payload = { name: values.name, code: values.code || null, ...(editData && { is_active: values.is_active }) }
      if (editData) {
        await academicStatusApi.update(editData.id, payload)
        showToast('Status akademik berhasil diperbarui')
      } else {
        await academicStatusApi.create(payload)
        showToast('Status akademik berhasil dibuat')
      }
      setDrawerOpen(false)
      fetchData()
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan', 'error')
    } finally {
      setSaveLoading(false)
    }
  }, [editData, fetchData, showToast])

  const handleDelete = useCallback(async () => {
    setDeleteLoading(true)
    try {
      await academicStatusApi.delete(deleteTarget.id)
      showToast('Status akademik berhasil dihapus')
      setDeleteTarget(null)
      fetchData()
    } catch (err) {
      showToast(err.message || 'Gagal menghapus', 'error')
    } finally {
      setDeleteLoading(false)
    }
  }, [deleteTarget, fetchData, showToast])

  const filtered = useMemo(() => data.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || (statusFilter === 'aktif' ? s.is_active : !s.is_active)
    return matchSearch && matchStatus
  }), [data, search, statusFilter])

  const totalAktif    = data.filter(s => s.is_active).length
  const totalNonaktif = data.filter(s => !s.is_active).length

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
            <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>Master Data</Typography>
            <Typography sx={{ fontSize: '16px', fontWeight: 500, color: '#3B1010' }}>Status Akademik</Typography>
          </Box>
        </Box>
        <Box component='button' onClick={handleOpenCreate} sx={{
          display: 'flex', alignItems: 'center', gap: '5px', px: '12px', py: '7px',
          borderRadius: '10px', border: 'none', cursor: 'pointer',
          background: 'linear-gradient(145deg, #E63946, #6D0E13)',
          boxShadow: '0 4px 10px rgba(180,0,30,0.25)',
        }}>
          <i className='ri-add-line' style={{ fontSize: '14px', color: '#fff' }} />
          <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>Tambah</Typography>
        </Box>
      </Box>

      {/* Stats — 2 crystal cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', mb: '10px' }}>
        {[
          { label: 'Aktif',    value: totalAktif,    icon: 'ri-checkbox-circle-line' },
          { label: 'Nonaktif', value: totalNonaktif, icon: 'ri-close-circle-line' },
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
      <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', p: '10px 12px', mb: '10px', display: 'flex', gap: '8px' }}>
        <DebouncedInput fullWidth value={search} onChange={setSearch}
                        placeholder='Cari nama status...'
                        sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15) !important' } }, '& input': { py: '7px', px: '10px', fontSize: '12px' } }}
                        InputProps={{ startAdornment: <InputAdornment position='start'><i className='ri-search-line' style={{ color: '#9A5A5A', fontSize: '14px' }} /></InputAdornment> }}
        />
        <FormControl size='small' sx={{ flexShrink: 0, minWidth: 110 }}>
          <Select displayEmpty value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                  renderValue={val => val === 'aktif' ? 'Aktif' : val === 'nonaktif' ? 'Nonaktif' : 'Semua'}
                  sx={{ borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0', '& .MuiOutlinedInput-notchedOutline': { border: '0.5px solid rgba(180,100,100,0.15) !important' }, '& .MuiSelect-select': { py: '7px', px: '10px' } }}>
            <MenuItem value=''>Semua</MenuItem>
            <MenuItem value='aktif'>Aktif</MenuItem>
            <MenuItem value='nonaktif'>Nonaktif</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
      ) : isMobile ? (
        filtered.length === 0 ? (
          <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', py: 8 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <i className='ri-graduation-cap-line' style={{ fontSize: 48, opacity: 0.3 }} />
              <Typography variant='body2' color='text.secondary'>Tidak ada status akademik ditemukan</Typography>
            </Box>
          </Box>
        ) : filtered.map(s => (
          <StatusMobileCard key={s.id} status={s} onEdit={handleOpenEdit} onDelete={setDeleteTarget} />
        ))
      ) : (
        <Card>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                {['Nama Status', 'Kode', 'Status', 'Aksi'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} sx={{ py: 8 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <i className='ri-graduation-cap-line' style={{ fontSize: 48, opacity: 0.3 }} />
                      <Typography variant='body2' color='text.secondary'>Tidak ada status akademik ditemukan</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : filtered.map(s => (
                <TableRow key={s.id} hover>
                  <TableCell>
                    <Typography variant='body2' fontWeight={500}>{s.name}</Typography>
                  </TableCell>
                  <TableCell>
                    {s.code
                      ? <Chip label={s.code} size='small' variant='tonal' />
                      : <Typography variant='caption' color='text.secondary'>—</Typography>}
                  </TableCell>
                  <TableCell>
                    <Chip label={s.is_active ? 'Aktif' : 'Nonaktif'} size='small'
                          color={s.is_active ? 'success' : 'default'} variant='tonal' />
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-1'>
                      <IconButton size='small' onClick={() => handleOpenEdit(s)}>
                        <i className='ri-edit-line text-[18px]' />
                      </IconButton>
                      <IconButton size='small' color='error' onClick={() => setDeleteTarget(s)}>
                        <i className='ri-delete-bin-line text-[18px]' />
                      </IconButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Drawer Create/Edit — PWA native */}
      <Drawer anchor='right' open={drawerOpen} onClose={() => setDrawerOpen(false)}
              PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, bgcolor: '#F5F2F0' } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: '14px 16px', bgcolor: '#fff', borderBottom: '0.5px solid rgba(180,100,100,0.15)' }}>
          <Box>
            <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#3B1010' }}>
              {editData ? 'Edit Status Akademik' : 'Tambah Status Akademik'}
            </Typography>
            {editData && <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>{editData.name}</Typography>}
          </Box>
          <Box component='button' onClick={() => setDrawerOpen(false)} sx={{ width: 30, height: 30, borderRadius: '8px', border: 'none', cursor: 'pointer', background: '#F5F2F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className='ri-close-line' style={{ fontSize: '16px', color: '#9A5A5A' }} />
          </Box>
        </Box>

        <Box component='form' onSubmit={handleSubmit(handleSave)} sx={{ display: 'flex', flexDirection: 'column', gap: '10px', p: '14px', overflowY: 'auto' }}>
          <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', p: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Controller name='name' control={control} rules={{ required: 'Nama status wajib diisi' }}
                        render={({ field }) => (
                          <TextField {...field} fullWidth size='small' placeholder='Nama Status (contoh: Aktif, Cuti, Lulus)'
                                     label='Nama Status'
                                     error={!!errors.name} helperText={errors.name?.message}
                                     sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15)' } }, '& input': { py: '10px', px: '12px', fontSize: '12px' } }} />
                        )}
            />
            <Controller name='code' control={control}
                        render={({ field }) => (
                          <TextField {...field} fullWidth size='small' placeholder='Kode (opsional, contoh: AKT)'
                                     label='Kode'
                                     inputProps={{ maxLength: 20 }}
                                     helperText='Kode singkat sebagai identifikasi'
                                     sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15)' } }, '& input': { py: '10px', px: '12px', fontSize: '12px' } }} />
                        )}
            />
            {editData && (
              <Controller name='is_active' control={control}
                          render={({ field }) => (
                            <FormControlLabel
                              control={<Switch checked={field.value} onChange={e => field.onChange(e.target.checked)} />}
                              label={<Typography sx={{ fontSize: '13px', color: '#3B1010' }}>Status Aktif</Typography>}
                            />
                          )}
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: '8px' }}>
            <Box component='button' type='button' onClick={() => setDrawerOpen(false)} disabled={saveLoading}
                 sx={{ flex: 1, py: '10px', borderRadius: '10px', cursor: 'pointer', background: '#fff', border: '0.5px solid rgba(180,100,100,0.18)', boxShadow: '0 2px 6px rgba(139,0,0,0.07)' }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#9A5A5A' }}>Batal</Typography>
            </Box>
            <Box component='button' type='submit' disabled={saveLoading}
                 sx={{ flex: 2, py: '10px', borderRadius: '10px', cursor: 'pointer', border: 'none', background: saveLoading ? '#ccc' : 'linear-gradient(145deg, #E63946, #6D0E13)', boxShadow: '0 4px 10px rgba(180,0,30,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              {saveLoading && <CircularProgress size={14} sx={{ color: '#fff' }} />}
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                {saveLoading ? 'Menyimpan...' : editData ? 'Simpan Perubahan' : 'Buat Status'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Drawer>

      {/* Dialog Hapus */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth='xs' fullWidth>
        <DialogTitle>Hapus Status Akademik?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Hapus <strong>{deleteTarget?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
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
               onClose={() => setToast(t => ({ ...t, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  )
}

export default AcademicStatusesView
