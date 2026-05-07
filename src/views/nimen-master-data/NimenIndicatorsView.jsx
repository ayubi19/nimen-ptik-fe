'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Avatar from '@mui/material/Avatar'
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
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { useForm, Controller } from 'react-hook-form'
import { nimenIndicatorApi, nimenVariableApi, nimenCategoryApi } from '@/libs/api/nimenMasterDataApi'

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
const IndicatorMobileCard = ({ row, onEdit, onDelete }) => {
  const rule = row.self_submission_rule
  const isPlus = row.value > 0
  return (
    <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', padding: '12px', mb: '10px' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', mb: '8px' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#3B1010', lineHeight: 1.3 }}>{row.name}</Typography>
          <Typography sx={{ fontSize: '10px', color: '#9A5A5A', mt: '2px' }}>{row.variable?.category?.name} · {row.variable?.name}</Typography>
        </Box>
        <Box sx={{ bgcolor: row.is_active ? '#E1F5EE' : '#F1EFE8', borderRadius: '6px', px: 1, py: '3px', flexShrink: 0 }}>
          <Typography sx={{ fontSize: '10px', fontWeight: 500, color: row.is_active ? '#0F6E56' : '#5F5E5A' }}>{row.is_active ? 'Aktif' : 'Nonaktif'}</Typography>
        </Box>
      </Box>
      <Box sx={{ py: '7px', borderTop: '0.5px solid rgba(180,100,100,0.1)', borderBottom: '0.5px solid rgba(180,100,100,0.1)', mb: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <Box sx={{ bgcolor: isPlus ? '#E1F5EE' : '#FCEBEB', borderRadius: '6px', px: '8px', py: '3px' }}>
          <Typography sx={{ fontSize: '12px', fontWeight: 700, color: isPlus ? '#0F6E56' : '#A32D2D' }}>
            {isPlus ? `+${Math.abs(row.value)}` : `-${Math.abs(row.value)}`}
          </Typography>
        </Box>
        {rule
          ? <Box sx={{ bgcolor: '#E6F1FB', borderRadius: '6px', px: '7px', py: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <i className='ri-hand-coin-line' style={{ fontSize: '11px', color: '#185FA5' }} />
            <Typography sx={{ fontSize: '10px', fontWeight: 500, color: '#185FA5' }}>Pengajuan · {rule.cooldown_days} hari</Typography>
          </Box>
          : <Typography sx={{ fontSize: '10px', color: '#9A5A5A' }}>Tidak ada pengajuan mandiri</Typography>
        }
      </Box>
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

const NimenIndicatorsView = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [variables, setVariables] = useState([])
  const [categories, setCategories] = useState([])
  const [categoryFilter, setCategoryFilter] = useState('')
  const [globalFilter, setGlobalFilter] = useState('')
  const [variableFilter, setVariableFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editData, setEditData] = useState(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const showToast = useCallback((msg, severity = 'success') =>
    setToast({ open: true, message: msg, severity }), [])

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      variable_id: '', name: '', description: '', value_abs: '',
      cooldown_days: '', has_cooldown: false, is_active: true
    }
  })
  const hasCooldown = watch('has_cooldown')

  const [stats, setStats] = useState({ total: 0, plus: 0, minus: 0, mandiri: 0 })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page: page + 1, page_size: pageSize,
        search: globalFilter || undefined,
        variable_id: variableFilter || undefined,
        category_id: categoryFilter || undefined,
        is_active: statusFilter === '' ? undefined : statusFilter === 'aktif',
      }
      const res = await nimenIndicatorApi.getAll(params)
      setData(res.data.data?.data || [])
      setTotal(res.data.data?.pagination?.total || 0)
    } catch { showToast('Gagal memuat data', 'error') }
    finally { setLoading(false) }
  }, [page, pageSize, globalFilter, variableFilter, categoryFilter, statusFilter, showToast])

  // Fetch stats terpisah — tanpa filter, ambil semua untuk hitung summary
  const fetchStats = useCallback(async () => {
    try {
      const res = await nimenIndicatorApi.getAll({ page: 1, page_size: 100 })
      const all = res.data.data?.data || []
      const totalAll = res.data.data?.pagination?.total || 0
      setStats({
        total: totalAll,
        plus: all.filter(d => d.value > 0).length,
        minus: all.filter(d => d.value < 0).length,
        mandiri: all.filter(d => d.self_submission_rule).length,
      })
    } catch { }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { fetchStats() }, [fetchStats])

  useEffect(() => {
    nimenVariableApi.getAll({ page: 1, page_size: 100 })
      .then(r => setVariables(r.data.data?.data || []))
    nimenCategoryApi.getAll({ page: 1, page_size: 100 })
      .then(r => setCategories(r.data.data?.data || []))
  }, [])

  const handleOpenEdit = useCallback((row) => {
    setEditData(row)
    reset({
      variable_id: row.variable_id || '',
      name: row.name || '',
      description: row.description || '',
      value_abs: Math.abs(row.value)?.toString() || '',
      has_cooldown: !!row.self_submission_rule,
      cooldown_days: row.self_submission_rule?.cooldown_days?.toString() || '',
      is_active: row.is_active ?? true,
    })
    setDrawerOpen(true)
  }, [reset])

  const handleOpenCreate = useCallback(() => {
    setEditData(null)
    reset({ variable_id: '', name: '', description: '', value_abs: '', cooldown_days: '', has_cooldown: false, is_active: true })
    setDrawerOpen(true)
  }, [reset])

  const handleSave = useCallback(async (values) => {
    setSaveLoading(true)
    try {
      const selectedVar = variables.find(v => v.id === parseInt(values.variable_id))
      const isReduction = selectedVar?.name?.toLowerCase().includes('pengurangan')
      const value = isReduction ? -Math.abs(parseFloat(values.value_abs)) : Math.abs(parseFloat(values.value_abs))

      const payload = {
        variable_id: parseInt(values.variable_id),
        name: values.name,
        description: values.description,
        value,
        is_active: values.is_active,
        cooldown_days: values.has_cooldown && values.cooldown_days ? parseInt(values.cooldown_days) : null,
      }
      if (editData) {
        await nimenIndicatorApi.update(editData.id, payload)
        showToast('Indikator berhasil diperbarui')
      } else {
        await nimenIndicatorApi.create(payload)
        showToast('Indikator berhasil dibuat')
      }
      setDrawerOpen(false)
      fetchData()
      fetchStats()
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan', 'error')
    } finally { setSaveLoading(false) }
  }, [editData, variables, fetchData, fetchStats, showToast])

  const handleDelete = useCallback(async () => {
    setDeleteLoading(true)
    try {
      await nimenIndicatorApi.delete(deleteTarget.id)
      showToast('Indikator berhasil dihapus')
      setDeleteTarget(null)
      fetchData()
      fetchStats()
    } catch (err) {
      showToast(err.message || 'Gagal menghapus', 'error')
    } finally { setDeleteLoading(false) }
  }, [deleteTarget, fetchData, fetchStats, showToast])

  // Stats — total dari API, plus/minus/mandiri dari semua data halaman ini
  // Untuk akurasi penuh perlu fetch semua, tapi approximation dari current page OK

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
            <Typography sx={{ fontSize: '16px', fontWeight: 500, color: '#3B1010' }}>Indikator Nilai</Typography>
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
          { label: 'Total Indikator',   value: stats.total,   icon: 'ri-list-check-line' },
          { label: 'Penambahan Nilai',  value: stats.plus,    icon: 'ri-arrow-up-circle-line' },
          { label: 'Pengurangan Nilai', value: stats.minus,   icon: 'ri-arrow-down-circle-line' },
          { label: 'Pengajuan Mandiri', value: stats.mandiri, icon: 'ri-hand-coin-line' },
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
        <DebouncedInput fullWidth value={globalFilter} onChange={v => { setGlobalFilter(v); setPage(0) }} placeholder='Cari indikator...'
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
            <Select displayEmpty value={variableFilter} onChange={e => { setVariableFilter(e.target.value); setPage(0) }}
                    renderValue={val => variables.find(v => v.id === val)?.name || 'Semua Variabel'}
                    sx={{ borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0', '& .MuiOutlinedInput-notchedOutline': { border: '0.5px solid rgba(180,100,100,0.15) !important' }, '& .MuiSelect-select': { py: '7px', px: '10px' } }}>
              <MenuItem value=''>Semua Variabel</MenuItem>
              {variables.map(v => <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size='small' sx={{ flex: 1 }}>
            <Select displayEmpty value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0) }}
                    renderValue={val => val === 'aktif' ? 'Aktif' : val === 'nonaktif' ? 'Nonaktif' : 'Status'}
                    sx={{ borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0', '& .MuiOutlinedInput-notchedOutline': { border: '0.5px solid rgba(180,100,100,0.15) !important' }, '& .MuiSelect-select': { py: '7px', px: '10px' } }}>
              <MenuItem value=''>Semua Status</MenuItem>
              <MenuItem value='aktif'>Aktif</MenuItem>
              <MenuItem value='nonaktif'>Nonaktif</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Content */}
      {loading ? (
        <div className='flex justify-center py-10'><CircularProgress /></div>
      ) : isMobile ? (
        // Mobile — Card List
        <div>
          {data.length === 0 ? (
            <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', py: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <i className='ri-inbox-line' style={{ fontSize: 40, opacity: 0.25 }} />
              <Typography sx={{ fontSize: '12px', color: '#9A5A5A' }}>Tidak ada indikator ditemukan</Typography>
            </Box>
          ) : data.map(row => (
            <IndicatorMobileCard key={row.id} row={row}
                                 onEdit={handleOpenEdit} onDelete={setDeleteTarget} />
          ))}
          <TablePagination
            component='div' count={total} page={page}
            rowsPerPage={pageSize} rowsPerPageOptions={[10, 25, 50]}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={e => { setPageSize(parseInt(e.target.value)); setPage(0) }}
            labelRowsPerPage='Baris:'
          />
        </div>
      ) : (
        // Desktop — Table
        <Card>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  Nama Indikator
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  Variabel / Kategori
                </TableCell>
                <TableCell align='center' sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  Nilai
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  Pengajuan Mandiri
                </TableCell>
                <TableCell align='center' sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  Status
                </TableCell>
                <TableCell align='center' sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  Aksi
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align='center' sx={{ py: 8 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                      <i className='ri-inbox-line' style={{ fontSize: 48, opacity: 0.3 }} />
                      <Typography variant='body2' color='text.secondary'>Tidak ada indikator ditemukan</Typography>
                    </Box>

                  </TableCell>
                </TableRow>
              ) : data.map(row => {
                const rule = row.self_submission_rule
                const isPlus = row.value > 0
                return (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography variant='body2' fontWeight={500}>{row.name}</Typography>
                      {row.description && (
                        <Typography variant='caption' color='text.secondary'
                                    sx={{ display: 'block', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>{row.variable?.name}</Typography>
                      <Typography variant='caption' color='text.secondary'>{row.variable?.category?.name}</Typography>
                    </TableCell>
                    <TableCell align='center'>
                      <Chip
                        label={isPlus ? `+${Math.abs(row.value)}` : `-${Math.abs(row.value)}`}
                        size='small'
                        color={isPlus ? 'success' : 'error'}
                        variant='tonal'
                        sx={{ fontWeight: 700, minWidth: 56 }}
                      />
                    </TableCell>
                    <TableCell>
                      {rule
                        ? <Chip label={`Ya · ${rule.cooldown_days} hari`} size='small' color='info' variant='tonal' />
                        : <Chip label='Tidak' size='small' variant='tonal' />
                      }
                    </TableCell>
                    <TableCell align='center'>
                      <Chip
                        label={row.is_active ? 'Aktif' : 'Nonaktif'}
                        size='small'
                        color={row.is_active ? 'success' : 'default'}
                        variant='tonal'
                      />
                    </TableCell>
                    <TableCell align='center'>
                      <div className='flex items-center justify-center gap-1'>
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
          <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#3B1010' }}>{editData ? 'Edit Indikator' : 'Tambah Indikator'}</Typography>
          <Box component='button' onClick={() => setDrawerOpen(false)} sx={{ width: 30, height: 30, borderRadius: '8px', border: 'none', cursor: 'pointer', background: '#F5F2F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className='ri-close-line' style={{ fontSize: '16px', color: '#9A5A5A' }} />
          </Box>
        </Box>
        <Box component='form' onSubmit={handleSubmit(handleSave)} sx={{ display: 'flex', flexDirection: 'column', gap: '10px', p: '14px', overflowY: 'auto' }}>
          <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', p: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Controller name='variable_id' control={control} rules={{ required: 'Variabel wajib dipilih' }}
                        render={({ field }) => (
                          <FormControl fullWidth size='small'>
                            <Select displayEmpty {...field} renderValue={val => { const v = variables.find(x => x.id === val); return v ? `${v.name} — ${v.category?.name}` : 'Pilih Variabel' }}
                                    sx={{ borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0', '& .MuiOutlinedInput-notchedOutline': { border: '0.5px solid rgba(180,100,100,0.15) !important' }, '& .MuiSelect-select': { py: '10px', px: '12px' } }}>
                              {variables.map(v => <MenuItem key={v.id} value={v.id}>{v.name} — {v.category?.name}</MenuItem>)}
                            </Select>
                          </FormControl>
                        )}
            />
            <Controller name='name' control={control} rules={{ required: 'Nama wajib diisi' }}
                        render={({ field }) => (
                          <TextField {...field} fullWidth size='small' multiline rows={2} placeholder='Nama Indikator'
                                     error={!!errors.name} helperText={errors.name?.message}
                                     sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15) !important' } }, '& textarea': { fontSize: '12px' } }} />
                        )}
            />
            <Controller name='description' control={control}
                        render={({ field }) => (
                          <TextField {...field} fullWidth size='small' multiline rows={2} placeholder='Deskripsi (opsional)'
                                     sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15) !important' } }, '& textarea': { fontSize: '12px' } }} />
                        )}
            />
            <Controller name='value_abs' control={control} rules={{ required: 'Nilai wajib diisi', min: { value: 0, message: 'Min 0' } }}
                        render={({ field }) => (
                          <TextField {...field} fullWidth size='small' type='number' placeholder='Nilai (angka positif)'
                                     inputProps={{ step: '0.01', min: 0 }}
                                     helperText={errors.value_abs?.message || 'Tanda + atau − ditentukan dari variabel'}
                                     error={!!errors.value_abs}
                                     sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15) !important' } }, '& input': { py: '10px', px: '12px', fontSize: '12px' } }} />
                        )}
            />
          </Box>

          {/* Pengajuan mandiri */}
          <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', p: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Controller name='has_cooldown' control={control}
                        render={({ field }) => (
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                              <Typography sx={{ fontSize: '12px', fontWeight: 500, color: '#3B1010' }}>Pengajuan Mandiri</Typography>
                              <Typography sx={{ fontSize: '10px', color: '#9A5A5A' }}>Mahasiswa dapat mengajukan sendiri</Typography>
                            </Box>
                            <Switch checked={field.value} onChange={e => { field.onChange(e.target.checked); if (!e.target.checked) setValue('cooldown_days', '') }}
                                    sx={{ '& .MuiSwitch-track': { bgcolor: field.value ? '#EB3D47 !important' : undefined } }} />
                          </Box>
                        )}
            />
            {hasCooldown && (
              <Controller name='cooldown_days' control={control} rules={{ required: 'Cooldown wajib diisi', min: { value: 1, message: 'Min 1 hari' } }}
                          render={({ field }) => (
                            <TextField {...field} fullWidth size='small' type='number' placeholder='Cooldown (hari)'
                                       inputProps={{ min: 1 }}
                                       helperText={errors.cooldown_days?.message || 'Jeda hari sebelum bisa diajukan lagi'}
                                       error={!!errors.cooldown_days}
                                       sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15) !important' } }, '& input': { py: '10px', px: '12px', fontSize: '12px' } }} />
                          )}
              />
            )}
            {editData && (
              <Controller name='is_active' control={control}
                          render={({ field }) => (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: '4px', borderTop: '0.5px solid rgba(180,100,100,0.1)' }}>
                              <Typography sx={{ fontSize: '12px', color: '#3B1010' }}>Indikator Aktif</Typography>
                              <Switch checked={field.value} onChange={e => field.onChange(e.target.checked)}
                                      sx={{ '& .MuiSwitch-track': { bgcolor: field.value ? '#EB3D47 !important' : undefined } }} />
                            </Box>
                          )}
              />
            )}
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
        <DialogTitle>Hapus Indikator?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Hapus indikator <strong>{deleteTarget?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
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

      {/* Toast */}
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

export default NimenIndicatorsView
