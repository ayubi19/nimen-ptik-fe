'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputLabel from '@mui/material/InputLabel'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Switch from '@mui/material/Switch'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import Box from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { useForm, Controller } from 'react-hook-form'
import { nimenVariableApi, nimenCategoryApi } from '@/libs/api/nimenMasterDataApi'

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
const VariableMobileCard = ({ row, onEdit, onDelete }) => {
  const cat = row.category
  const isPlus = cat?.type === 'PLUS'
  return (
    <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', padding: '12px', mb: '10px' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', mb: '8px' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#3B1010', lineHeight: 1.3 }} noWrap>{row.name}</Typography>
          {row.description && <Typography sx={{ fontSize: '10px', color: '#9A5A5A', mt: '2px' }}>{row.description}</Typography>}
        </Box>
        <Box sx={{ bgcolor: row.is_active ? '#E1F5EE' : '#F1EFE8', borderRadius: '6px', px: 1, py: '3px', flexShrink: 0 }}>
          <Typography sx={{ fontSize: '10px', fontWeight: 500, color: row.is_active ? '#0F6E56' : '#5F5E5A' }}>{row.is_active ? 'Aktif' : 'Nonaktif'}</Typography>
        </Box>
      </Box>
      {cat && (
        <Box sx={{ py: '6px', borderTop: '0.5px solid rgba(180,100,100,0.1)', borderBottom: '0.5px solid rgba(180,100,100,0.1)', mb: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i className={isPlus ? 'ri-add-circle-line' : 'ri-indeterminate-circle-line'} style={{ fontSize: '12px', color: isPlus ? '#0F6E56' : '#A32D2D' }} />
          <Typography sx={{ fontSize: '11px', color: isPlus ? '#0F6E56' : '#A32D2D', fontWeight: 500 }}>{cat.name}</Typography>
        </Box>
      )}
      <Box sx={{ display: 'flex', gap: '6px' }}>
        <Box component='button' onClick={() => onEdit(row)} sx={{ flex: 1, py: '5px', borderRadius: '8px', cursor: 'pointer', border: '0.5px solid rgba(180,100,100,0.18)', background: 'rgba(255,255,255,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '10px', fontWeight: 500, color: '#444441' }}>
          <i className='ri-edit-line' style={{ fontSize: '11px' }} /> Edit
        </Box>
        <Box component='button' onClick={() => onDelete(row)} sx={{ flex: 1, py: '5px', borderRadius: '8px', cursor: 'pointer', border: '0.5px solid rgba(163,45,45,0.2)', background: '#FCEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '10px', fontWeight: 500, color: '#A32D2D' }}>
          <i className='ri-delete-bin-line' style={{ fontSize: '11px' }} /> Hapus
        </Box>
      </Box>
    </Box>
  )
}

// ── Main View ─────────────────────────────────────────────────────────────────
const NimenVariablesView = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [data, setData]             = useState([])
  const [total, setTotal]           = useState(0)
  const [loading, setLoading]       = useState(false)
  const [categories, setCategories] = useState([])
  const [globalFilter, setGlobalFilter]   = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter]   = useState('')
  const [page, setPage]             = useState(0)
  const [pageSize, setPageSize]     = useState(10)
  const [stats, setStats]           = useState({ total: 0, plus: 0, minus: 0 })

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editData, setEditData]     = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const showToast = useCallback((msg, severity = 'success') =>
    setToast({ open: true, message: msg, severity }), [])

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { category_id: '', name: '', description: '', is_active: true }
  })

  // Load kategori untuk dropdown & filter
  useEffect(() => {
    nimenCategoryApi.getAll({ page_size: 100, is_active: true })
      .then(res => setCategories(res.data.data.data || []))
      .catch(() => {})
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const res = await nimenVariableApi.getAll({ page: 1, page_size: 100 })
      const all = res.data.data?.data || []
      const totalAll = res.data.data?.pagination?.total || 0
      setStats({
        total: totalAll,
        plus:  all.filter(v => v.category?.type === 'PLUS').length,
        minus: all.filter(v => v.category?.type === 'MINUS').length,
      })
    } catch {}
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page: page + 1, page_size: pageSize }
      if (globalFilter)  params.search      = globalFilter
      if (categoryFilter) params.category_id = categoryFilter
      if (statusFilter !== '') params.is_active = statusFilter
      const res = await nimenVariableApi.getAll(params)
      setData(res.data.data.data || [])
      setTotal(res.data.data.pagination?.total || 0)
    } catch (err) {
      showToast(err.message || 'Gagal memuat data', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, globalFilter, categoryFilter, statusFilter, showToast])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { fetchStats() }, [fetchStats])

  const handleOpenCreate = useCallback(() => {
    setEditData(null)
    reset({ category_id: '', name: '', description: '', is_active: true })
    setDrawerOpen(true)
  }, [reset])

  const handleOpenEdit = useCallback((row) => {
    setEditData(row)
    reset({
      category_id: row.category_id,
      name: row.name,
      description: row.description || '',
      is_active: row.is_active,
    })
    setDrawerOpen(true)
  }, [reset])

  const handleSubmitForm = useCallback(async (values) => {
    setFormLoading(true)
    try {
      const payload = {
        category_id: parseInt(values.category_id),
        name: values.name,
        description: values.description || null,
        ...(editData && { is_active: values.is_active })
      }
      if (editData) {
        await nimenVariableApi.update(editData.id, payload)
        showToast('Variabel berhasil diperbarui')
      } else {
        await nimenVariableApi.create(payload)
        showToast('Variabel berhasil dibuat')
      }
      setDrawerOpen(false)
      fetchData()
      fetchStats()
    } catch (err) {
      showToast(err.message || 'Terjadi kesalahan', 'error')
    } finally {
      setFormLoading(false)
    }
  }, [editData, fetchData, fetchStats, showToast])

  const handleDelete = useCallback(async () => {
    setDeleteLoading(true)
    try {
      await nimenVariableApi.delete(deleteTarget.id)
      showToast('Variabel berhasil dihapus')
      setDeleteTarget(null)
      fetchData()
      fetchStats()
    } catch (err) {
      showToast(err.message || 'Gagal menghapus', 'error')
    } finally {
      setDeleteLoading(false)
    }
  }, [deleteTarget, fetchData, fetchStats, showToast])

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
            <Typography sx={{ fontSize: '16px', fontWeight: 500, color: '#3B1010' }}>Variabel Nilai</Typography>
          </Box>
        </Box>
        <Box component='button' onClick={handleOpenCreate} sx={{ display: 'flex', alignItems: 'center', gap: '5px', px: '12px', py: '7px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: 'linear-gradient(145deg, #E63946, #6D0E13)', boxShadow: '0 4px 10px rgba(180,0,30,0.25)' }}>
          <i className='ri-add-line' style={{ fontSize: '14px', color: '#fff' }} />
          <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>Tambah</Typography>
        </Box>
      </Box>

      {/* Stats — 2x2 crystal */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', mb: '10px' }}>
        {[
          { label: 'Total Variabel',    value: stats.total, icon: 'ri-node-tree' },
          { label: 'Penambahan Nilai',  value: stats.plus,  icon: 'ri-arrow-up-circle-line' },
          { label: 'Pengurangan Nilai', value: stats.minus, icon: 'ri-arrow-down-circle-line' },
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
        <DebouncedInput fullWidth value={globalFilter} onChange={v => { setGlobalFilter(v); setPage(0) }} placeholder='Cari variabel...'
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15) !important' } }, '& input': { py: '7px', px: '10px', fontSize: '12px' } }}
                        InputProps={{ startAdornment: <InputAdornment position='start'><i className='ri-search-line' style={{ color: '#9A5A5A', fontSize: '14px' }} /></InputAdornment> }} />
        <Box sx={{ display: 'flex', gap: '8px' }}>
          <FormControl size='small' sx={{ flex: 1 }}>
            <Select displayEmpty value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(0) }}
                    renderValue={val => categories.find(c => c.id === val)?.name || 'Semua Kategori'}
                    sx={{ borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0', '& .MuiOutlinedInput-notchedOutline': { border: '0.5px solid rgba(180,100,100,0.15) !important' }, '& .MuiSelect-select': { py: '7px', px: '10px' } }}>
              <MenuItem value=''>Semua Kategori</MenuItem>
              {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size='small' sx={{ flex: 1 }}>
            <Select displayEmpty value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0) }}
                    renderValue={val => val === 'true' ? 'Aktif' : val === 'false' ? 'Nonaktif' : 'Semua Status'}
                    sx={{ borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0', '& .MuiOutlinedInput-notchedOutline': { border: '0.5px solid rgba(180,100,100,0.15) !important' }, '& .MuiSelect-select': { py: '7px', px: '10px' } }}>
              <MenuItem value=''>Semua Status</MenuItem>
              <MenuItem value='true'>Aktif</MenuItem>
              <MenuItem value='false'>Nonaktif</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Content */}
      {loading ? (
        <div className='flex justify-center py-10'><CircularProgress /></div>
      ) : isMobile ? (
        // ── Mobile: Card List ──
        <div>
          {data.length === 0 ? (
            <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', py: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <i className='ri-node-tree' style={{ fontSize: 40, opacity: 0.25 }} />
              <Typography sx={{ fontSize: '12px', color: '#9A5A5A' }}>Tidak ada variabel ditemukan</Typography>
            </Box>
          ) : data.map(row => (
            <VariableMobileCard key={row.id} row={row}
                                onEdit={handleOpenEdit} onDelete={setDeleteTarget} />
          ))}
          <TablePagination
            component='div' count={total} page={page}
            rowsPerPage={pageSize} rowsPerPageOptions={[10, 25, 50]}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={e => { setPageSize(parseInt(e.target.value)); setPage(0) }}
            labelRowsPerPage='Baris:'
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} dari ${count}`}
          />
        </div>
      ) : (
        // ── Desktop: Table ──
        <Card>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                {['Nama Variabel', 'Kategori', 'Deskripsi', 'Status', 'Aksi'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align='center' sx={{ py: 8 }}>
                    <i className='ri-node-tree text-5xl opacity-30 block mb-2' />
                    <Typography variant='body2' color='text.secondary'>Tidak ada variabel ditemukan</Typography>
                  </TableCell>
                </TableRow>
              ) : data.map(row => {
                const cat = row.category
                const isPlus = cat?.type === 'PLUS'
                return (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography variant='body2' fontWeight={600}>{row.name}</Typography>
                    </TableCell>
                    <TableCell>
                      {cat ? (
                        <Chip
                          label={cat.name}
                          size='small'
                          color={isPlus ? 'success' : 'error'}
                          variant='tonal'
                          icon={<i className={isPlus ? 'ri-add-circle-line' : 'ri-indeterminate-circle-line'} />}
                        />
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' color='text.secondary'
                                  sx={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.description || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.is_active ? 'Aktif' : 'Nonaktif'}
                        size='small'
                        color={row.is_active ? 'success' : 'default'}
                        variant='tonal'
                      />
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-1'>
                        <IconButton size='small' onClick={() => handleOpenEdit(row)}>
                          <i className='ri-edit-line text-[18px]' />
                        </IconButton>
                        <IconButton size='small' color='error' onClick={() => setDeleteTarget(row)}>
                          <i className='ri-delete-bin-line text-[18px]' />
                        </IconButton>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <TablePagination
            component='div' count={total} page={page}
            rowsPerPage={pageSize} rowsPerPageOptions={[10, 25, 50]}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={e => { setPageSize(parseInt(e.target.value)); setPage(0) }}
            labelRowsPerPage='Baris per halaman:'
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} dari ${count}`}
          />
        </Card>
      )}

      {/* Drawer Form — PWA native */}
      <Drawer anchor='right' open={drawerOpen} onClose={() => setDrawerOpen(false)}
              PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, bgcolor: '#F5F2F0' } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: '14px 16px', bgcolor: '#fff', borderBottom: '0.5px solid rgba(180,100,100,0.15)' }}>
          <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#3B1010' }}>{editData ? 'Edit Variabel' : 'Tambah Variabel'}</Typography>
          <Box component='button' onClick={() => setDrawerOpen(false)} sx={{ width: 30, height: 30, borderRadius: '8px', border: 'none', cursor: 'pointer', background: '#F5F2F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className='ri-close-line' style={{ fontSize: '16px', color: '#9A5A5A' }} />
          </Box>
        </Box>
        <Box component='form' onSubmit={handleSubmit(handleSubmitForm)} sx={{ display: 'flex', flexDirection: 'column', gap: '10px', p: '14px', overflowY: 'auto' }}>
          <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', p: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Controller name='category_id' control={control} rules={{ required: 'Kategori wajib dipilih' }}
                        render={({ field }) => (
                          <FormControl fullWidth size='small'>
                            <Select displayEmpty {...field} renderValue={val => categories.find(c => c.id === val)?.name || 'Pilih Kategori'}
                                    sx={{ borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0', '& .MuiOutlinedInput-notchedOutline': { border: '0.5px solid rgba(180,100,100,0.15) !important' }, '& .MuiSelect-select': { py: '10px', px: '12px' } }}>
                              {categories.map(c => (
                                <MenuItem key={c.id} value={c.id}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <i className={c.type === 'PLUS' ? 'ri-add-circle-line' : 'ri-indeterminate-circle-line'} style={{ color: c.type === 'PLUS' ? '#0F6E56' : '#A32D2D' }} />
                                    {c.name}
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
            />
            <Controller name='name' control={control} rules={{ required: 'Nama wajib diisi', minLength: { value: 2, message: 'Min 2 karakter' } }}
                        render={({ field }) => (
                          <TextField {...field} fullWidth size='small' placeholder='Nama Variabel'
                                     error={!!errors.name} helperText={errors.name?.message}
                                     sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15) !important' } }, '& input': { py: '10px', px: '12px', fontSize: '12px' } }} />
                        )}
            />
            <Controller name='description' control={control}
                        render={({ field }) => (
                          <TextField {...field} fullWidth size='small' multiline rows={2} placeholder='Deskripsi (opsional)'
                                     sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15) !important' } }, '& textarea': { fontSize: '12px' } }} />
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
          </Box>
          <Box sx={{ display: 'flex', gap: '8px' }}>
            <Box component='button' type='button' onClick={() => setDrawerOpen(false)} disabled={formLoading} sx={{ flex: 1, py: '10px', borderRadius: '10px', cursor: 'pointer', background: '#fff', border: '0.5px solid rgba(180,100,100,0.18)', boxShadow: '0 2px 6px rgba(139,0,0,0.07)' }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#9A5A5A' }}>Batal</Typography>
            </Box>
            <Box component='button' type='submit' disabled={formLoading} sx={{ flex: 2, py: '10px', borderRadius: '10px', cursor: 'pointer', border: 'none', background: formLoading ? '#ccc' : 'linear-gradient(145deg, #E63946, #6D0E13)', boxShadow: '0 4px 10px rgba(180,0,30,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              {formLoading && <CircularProgress size={14} sx={{ color: '#fff' }} />}
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{formLoading ? 'Menyimpan...' : 'Simpan'}</Typography>
            </Box>
          </Box>
        </Box>
      </Drawer>

      {/* Dialog Hapus */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth='xs' fullWidth>
        <DialogTitle>Hapus Variabel?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Hapus variabel <strong>{deleteTarget?.name}</strong>? Variabel yang masih memiliki indikator tidak dapat dihapus.
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

export default NimenVariablesView
