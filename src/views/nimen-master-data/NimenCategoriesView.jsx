'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
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
import FormControlLabel from '@mui/material/FormControlLabel'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import Box from '@mui/material/Box'
import { useForm, Controller } from 'react-hook-form'
import { nimenCategoryApi } from '@/libs/api/nimenMasterDataApi'

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

const TYPE_CONFIG = {
  PLUS:  { label: 'Penambahan',  color: '#28C76F', bg: '#E6F9EE', icon: 'ri-add-circle-line',            chipColor: 'success' },
  MINUS: { label: 'Pengurangan', color: '#FF4C51', bg: '#FFE9EA', icon: 'ri-indeterminate-circle-line',   chipColor: 'error'   },
}

const CategoryCard = ({ category, onEdit, onDelete }) => {
  const cfg = TYPE_CONFIG[category.type] || TYPE_CONFIG.PLUS
  return (
    <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: '10px', bgcolor: cfg.bg, borderBottom: '0.5px solid rgba(180,100,100,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(145deg, #E63946, #6D0E13)', boxShadow: '0 3px 8px rgba(180,0,30,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className={cfg.icon} style={{ fontSize: '18px', color: '#fff' }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#3B1010' }}>{category.name}</Typography>
            <Box sx={{ bgcolor: cfg.type === 'PLUS' ? '#E1F5EE' : '#FCEBEB', borderRadius: '5px', px: '6px', py: '1px', display: 'inline-block', mt: '2px' }}>
              <Typography sx={{ fontSize: '9px', fontWeight: 600, color: cfg.type === 'PLUS' ? '#0F6E56' : '#A32D2D' }}>{cfg.label}</Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ bgcolor: category.is_active ? '#E1F5EE' : '#F1EFE8', borderRadius: '6px', px: 1, py: '3px' }}>
          <Typography sx={{ fontSize: '10px', fontWeight: 500, color: category.is_active ? '#0F6E56' : '#5F5E5A' }}>{category.is_active ? 'Aktif' : 'Nonaktif'}</Typography>
        </Box>
      </Box>
      <Box sx={{ px: 2, py: '10px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '5px', mb: '8px' }}>
          <i className='ri-node-tree' style={{ fontSize: '12px', color: '#9A5A5A' }} />
          <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>{category.variable_count != null ? `${category.variable_count} variabel` : '—'}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: '6px', pt: '8px', borderTop: '0.5px solid rgba(180,100,100,0.1)' }}>
          <Box component='button' onClick={() => onEdit(category)} sx={{ flex: 1, py: '5px', borderRadius: '8px', cursor: 'pointer', border: '0.5px solid rgba(180,100,100,0.18)', background: 'rgba(255,255,255,0.72)', boxShadow: '0 2px 6px rgba(139,0,0,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '10px', fontWeight: 500, color: '#444441' }}>
            <i className='ri-edit-line' style={{ fontSize: '11px' }} /> Edit
          </Box>
          <Box component='button' onClick={() => onDelete(category)} sx={{ flex: 1, py: '5px', borderRadius: '8px', cursor: 'pointer', border: '0.5px solid rgba(163,45,45,0.2)', background: '#FCEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '10px', fontWeight: 500, color: '#A32D2D' }}>
            <i className='ri-delete-bin-line' style={{ fontSize: '11px' }} /> Hapus
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

const NimenCategoriesView = () => {
  const [data, setData]             = useState([])
  const [loading, setLoading]       = useState(false)
  const [search, setSearch]         = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editData, setEditData]     = useState(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const showToast = useCallback((msg, severity = 'success') => {
    setToast({ open: true, message: msg, severity })
  }, [])

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: { name: '', type: 'PLUS', is_active: true }
  })

  const selectedType = watch('type')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await nimenCategoryApi.getAll({ page: 1, page_size: 100 })
      setData(res.data.data?.data || [])
    } catch {
      showToast('Gagal memuat data kategori', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { fetchData() }, [fetchData])

  const handleOpenCreate = useCallback(() => {
    setEditData(null)
    reset({ name: '', type: 'PLUS', is_active: true })
    setDrawerOpen(true)
  }, [reset])

  const handleOpenEdit = useCallback((row) => {
    setEditData(row)
    reset({ name: row.name, type: row.type, is_active: row.is_active })
    setDrawerOpen(true)
  }, [reset])

  const handleSave = useCallback(async (values) => {
    setSaveLoading(true)
    try {
      const payload = { name: values.name, type: values.type, ...(editData && { is_active: values.is_active }) }
      if (editData) {
        await nimenCategoryApi.update(editData.id, payload)
        showToast('Kategori berhasil diperbarui')
      } else {
        await nimenCategoryApi.create(payload)
        showToast('Kategori berhasil dibuat')
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
      await nimenCategoryApi.delete(deleteTarget.id)
      showToast('Kategori berhasil dihapus')
      setDeleteTarget(null)
      fetchData()
    } catch (err) {
      showToast(err.message || 'Gagal menghapus', 'error')
    } finally {
      setDeleteLoading(false)
    }
  }, [deleteTarget, fetchData, showToast])

  const filtered = useMemo(() => data.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase())
    const matchType   = !typeFilter || c.type === typeFilter
    const matchStatus = !statusFilter || (statusFilter === 'aktif' ? c.is_active : !c.is_active)
    return matchSearch && matchType && matchStatus
  }), [data, search, typeFilter, statusFilter])

  const totalPlus    = data.filter(c => c.type === 'PLUS').length
  const totalMinus   = data.filter(c => c.type === 'MINUS').length

  return (
    <>
      {/* Topbar PWA */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', mb: '14px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Box sx={{ width: 34, height: 34, borderRadius: '10px', background: 'rgba(255,255,255,0.72)', border: '0.5px solid rgba(180,100,100,0.18)', boxShadow: '0 3px 10px rgba(139,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', position: 'relative', overflow: 'hidden', '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)' } }} onClick={() => window.history.back()}>
            <i className='ri-arrow-left-s-line' style={{ fontSize: '20px', color: '#8B2020', position: 'relative', zIndex: 1 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>Master Data NIMEN</Typography>
            <Typography sx={{ fontSize: '16px', fontWeight: 500, color: '#3B1010' }}>Kategori Nilai</Typography>
          </Box>
        </Box>
        <Box component='button' onClick={handleOpenCreate} sx={{ display: 'flex', alignItems: 'center', gap: '5px', px: '12px', py: '7px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: 'linear-gradient(145deg, #E63946, #6D0E13)', boxShadow: '0 4px 10px rgba(180,0,30,0.25)' }}>
          <i className='ri-add-line' style={{ fontSize: '14px', color: '#fff' }} />
          <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>Tambah</Typography>
        </Box>
      </Box>

      {/* Stats — 2x crystal */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', mb: '10px' }}>
        {[
          { label: 'Penambahan',  value: totalPlus,  icon: 'ri-add-circle-line' },
          { label: 'Pengurangan', value: totalMinus, icon: 'ri-indeterminate-circle-line' },
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
        <DebouncedInput fullWidth value={search} onChange={setSearch} placeholder='Cari nama kategori...'
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15) !important' } }, '& input': { py: '7px', px: '10px', fontSize: '12px' } }}
                        InputProps={{ startAdornment: <InputAdornment position='start'><i className='ri-search-line' style={{ color: '#9A5A5A', fontSize: '14px' }} /></InputAdornment> }} />
        <Box sx={{ display: 'flex', gap: '8px' }}>
          <FormControl size='small' sx={{ flex: 1 }}>
            <Select displayEmpty value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                    renderValue={val => val === 'PLUS' ? 'Penambahan' : val === 'MINUS' ? 'Pengurangan' : 'Semua Tipe'}
                    sx={{ borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0', '& .MuiOutlinedInput-notchedOutline': { border: '0.5px solid rgba(180,100,100,0.15) !important' }, '& .MuiSelect-select': { py: '7px', px: '10px' } }}>
              <MenuItem value=''>Semua Tipe</MenuItem>
              <MenuItem value='PLUS'>Penambahan</MenuItem>
              <MenuItem value='MINUS'>Pengurangan</MenuItem>
            </Select>
          </FormControl>
          <FormControl size='small' sx={{ flex: 1 }}>
            <Select displayEmpty value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    renderValue={val => val === 'aktif' ? 'Aktif' : val === 'nonaktif' ? 'Nonaktif' : 'Semua Status'}
                    sx={{ borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0', '& .MuiOutlinedInput-notchedOutline': { border: '0.5px solid rgba(180,100,100,0.15) !important' }, '& .MuiSelect-select': { py: '7px', px: '10px' } }}>
              <MenuItem value=''>Semua Status</MenuItem>
              <MenuItem value='aktif'>Aktif</MenuItem>
              <MenuItem value='nonaktif'>Nonaktif</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* List */}
      {loading ? (
        <div className='flex justify-center py-10'><CircularProgress /></div>
      ) : filtered.length === 0 ? (
        <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', py: '40px' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <i className='ri-node-tree' style={{ fontSize: 40, opacity: 0.25 }} />
            <Typography sx={{ fontSize: '12px', color: '#9A5A5A' }}>Tidak ada kategori ditemukan</Typography>
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {filtered.map(c => (
            <Box key={c.id} sx={{ mb: '10px' }}>
              <CategoryCard category={c} onEdit={handleOpenEdit} onDelete={setDeleteTarget} />
            </Box>
          ))}
        </Box>
      )}

      {/* Drawer — PWA native */}
      <Drawer anchor='right' open={drawerOpen} onClose={() => setDrawerOpen(false)}
              PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, bgcolor: '#F5F2F0' } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: '14px 16px', bgcolor: '#fff', borderBottom: '0.5px solid rgba(180,100,100,0.15)' }}>
          <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#3B1010' }}>{editData ? 'Edit Kategori' : 'Tambah Kategori'}</Typography>
          <Box component='button' onClick={() => setDrawerOpen(false)} sx={{ width: 30, height: 30, borderRadius: '8px', border: 'none', cursor: 'pointer', background: '#F5F2F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className='ri-close-line' style={{ fontSize: '16px', color: '#9A5A5A' }} />
          </Box>
        </Box>
        <Box component='form' onSubmit={handleSubmit(handleSave)} sx={{ display: 'flex', flexDirection: 'column', gap: '10px', p: '14px', overflowY: 'auto' }}>
          <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', p: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Toggle Tipe */}
            <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#9A5A5A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tipe Nilai</Typography>
            <Controller name='type' control={control}
                        render={({ field }) => (
                          <Box sx={{ display: 'flex', gap: '8px' }}>
                            {['PLUS', 'MINUS'].map(t => (
                              <Box key={t} component='button' type='button' onClick={() => field.onChange(t)} sx={{
                                flex: 1, py: '8px', borderRadius: '8px', cursor: 'pointer',
                                border: field.value === t ? 'none' : '0.5px solid rgba(180,100,100,0.2)',
                                background: field.value === t ? 'linear-gradient(145deg, #E63946, #6D0E13)' : '#F5F2F0',
                                boxShadow: field.value === t ? '0 3px 8px rgba(180,0,30,0.2)' : 'none',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                              }}>
                                <i className={t === 'PLUS' ? 'ri-add-circle-line' : 'ri-indeterminate-circle-line'} style={{ fontSize: '14px', color: field.value === t ? '#fff' : '#9A5A5A' }} />
                                <Typography sx={{ fontSize: '11px', fontWeight: 600, color: field.value === t ? '#fff' : '#9A5A5A' }}>{t === 'PLUS' ? 'Penambahan' : 'Pengurangan'}</Typography>
                              </Box>
                            ))}
                          </Box>
                        )}
            />
            <Controller name='name' control={control}
                        rules={{ required: 'Nama wajib diisi', minLength: { value: 2, message: 'Min 2 karakter' } }}
                        render={({ field }) => (
                          <TextField {...field} fullWidth size='small' placeholder='Nama Kategori'
                                     error={!!errors.name} helperText={errors.name?.message}
                                     sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15) !important' } }, '& input': { py: '10px', px: '12px', fontSize: '12px' } }} />
                        )}
            />
            {editData && (
              <Controller name='is_active' control={control}
                          render={({ field }) => (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: '4px' }}>
                              <Typography sx={{ fontSize: '12px', color: '#3B1010' }}>Status Aktif</Typography>
                              <Switch checked={field.value} onChange={e => field.onChange(e.target.checked)}
                                      sx={{ '& .MuiSwitch-track': { bgcolor: field.value ? '#EB3D47 !important' : undefined } }} />
                            </Box>
                          )}
              />
            )}
            {/* Preview */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', p: '8px', borderRadius: '8px', bgcolor: selectedType === 'PLUS' ? '#E1F5EE' : '#FCEBEB' }}>
              <i className={TYPE_CONFIG[selectedType]?.icon} style={{ fontSize: '16px', color: selectedType === 'PLUS' ? '#0F6E56' : '#A32D2D' }} />
              <Typography sx={{ fontSize: '11px', color: selectedType === 'PLUS' ? '#0F6E56' : '#A32D2D' }}>
                Nilai kategori ini bersifat <strong>{selectedType === 'PLUS' ? 'positif (+)' : 'negatif (–)'}</strong>
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: '8px' }}>
            <Box component='button' type='button' onClick={() => setDrawerOpen(false)} disabled={saveLoading} sx={{ flex: 1, py: '10px', borderRadius: '10px', cursor: 'pointer', background: '#fff', border: '0.5px solid rgba(180,100,100,0.18)', boxShadow: '0 2px 6px rgba(139,0,0,0.07)' }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#9A5A5A' }}>Batal</Typography>
            </Box>
            <Box component='button' type='submit' disabled={saveLoading} sx={{ flex: 2, py: '10px', borderRadius: '10px', cursor: 'pointer', border: 'none', background: saveLoading ? '#ccc' : 'linear-gradient(145deg, #E63946, #6D0E13)', boxShadow: '0 4px 10px rgba(180,0,30,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              {saveLoading && <CircularProgress size={14} sx={{ color: '#fff' }} />}
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{saveLoading ? 'Menyimpan...' : 'Simpan'}</Typography>
            </Box>
          </Box>
        </Box>
      </Drawer>

      {/* Dialog Hapus */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth='xs' fullWidth>
        <DialogTitle>Hapus Kategori?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Hapus <strong>{deleteTarget?.name}</strong>? Kategori yang masih memiliki variabel tidak dapat dihapus.
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

export default NimenCategoriesView
