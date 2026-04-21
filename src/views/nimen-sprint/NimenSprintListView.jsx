'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import Tooltip from '@mui/material/Tooltip'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable, getSortedRowModel } from '@tanstack/react-table'
import { nimenSprintApi } from '@/libs/api/nimenSprintApi'
import { batchApi } from '@/libs/api/masterDataApi'
import tableStyles from '@core/styles/table.module.css'

const columnHelper = createColumnHelper()

const DebouncedInput = ({ value: initialValue, onChange, debounce = 400, ...props }) => {
  const [value, setValue] = useState(initialValue)
  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange }, [onChange])
  useEffect(() => setValue(initialValue), [initialValue])
  useEffect(() => {
    const t = setTimeout(() => onChangeRef.current(value), debounce)
    return () => clearTimeout(t)
  }, [value, debounce])
  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} size='small' />
}

const STATUS_CONFIG = {
  DRAFT_ADMIN:           { label: 'Draft Admin',          color: 'secondary' },
  SENT_TO_COORDINATOR:   { label: 'Menunggu Koordinator', color: 'warning'   },
  COORDINATOR_SUBMITTED: { label: 'Revisi Masuk',         color: 'info'      },
  ACTIVE:                { label: 'Aktif',                color: 'success'   },
  APPROVAL_PENDING:      { label: 'Approval Pending',     color: 'warning'   },
  CLOSED:                { label: 'Selesai',              color: 'secondary' },
}

const NimenSprintListView = () => {
  const router = useRouter()
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [batches, setBatches] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [batchFilter, setBatchFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const showToast = useCallback((message, severity = 'success') => {
    setToast({ open: true, message, severity })
  }, [])

  useEffect(() => {
    batchApi.getAllActive().then(res => setBatches(res.data.data || [])).catch(() => {})
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page: page + 1, page_size: pageSize }
      if (globalFilter) params.search = globalFilter
      if (batchFilter) params.batch_id = batchFilter
      if (statusFilter) params.status = statusFilter
      const res = await nimenSprintApi.getAll(params)
      setData(res.data.data.data || [])
      setTotal(res.data.data.pagination?.total || 0)
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
      setDeleteOpen(false)
      fetchData()
    } catch (err) {
      showToast(err.message || 'Gagal menghapus', 'error')
    } finally {
      setDeleteLoading(false)
    }
  }, [deleteTarget, fetchData, showToast])

  const columns = useMemo(() => [
    columnHelper.accessor('sprint_number', {
      header: 'No. Sprint',
      cell: ({ row }) => (
        <Typography variant='body2' fontWeight={600} color='primary.main'>
          {row.original.sprint_number}
        </Typography>
      )
    }),
    columnHelper.accessor('title', {
      header: 'Kegiatan',
      cell: ({ row }) => (
        <div>
          <Typography variant='body2' fontWeight={600} color='text.primary'>{row.original.title}</Typography>
          <Typography variant='caption' color='text.secondary'>
            <i className='ri-map-pin-line' style={{ marginRight: 4 }} />
            {row.original.location || '-'}
          </Typography>
        </div>
      )
    }),
    columnHelper.accessor('batch', {
      header: 'Angkatan',
      cell: ({ row }) => (
        <Chip label={row.original.batch?.name || '-'} size='small' color='primary' variant='tonal' />
      )
    }),
    columnHelper.accessor('event_date', {
      header: 'Tanggal Kegiatan',
      cell: ({ row }) => (
        <div>
          <Typography variant='body2'>
            {new Date(row.original.event_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            Deadline: {new Date(row.original.submission_deadline).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
          </Typography>
        </div>
      )
    }),
    columnHelper.accessor('indicator', {
      header: 'Indikator Nilai',
      cell: ({ row }) => {
        const indicator = row.original.indicator
        if (!indicator) return '-'
        const isPlus = indicator.value >= 0
        return (
          <div>
            <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
              {indicator.variable?.category?.name}
            </Typography>
            <Chip
              label={isPlus ? `+${indicator.value}` : `${indicator.value}`}
              color={isPlus ? 'success' : 'error'}
              size='small'
              sx={{ fontWeight: 700 }}
            />
          </div>
        )
      }
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: ({ row }) => {
        const cfg = STATUS_CONFIG[row.original.status] || { label: row.original.status, color: 'default' }
        return <Chip label={cfg.label} color={cfg.color} size='small' variant='tonal' />
      }
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <div className='flex items-center gap-0.5'>
          <Tooltip title='Detail & Peserta'>
            <IconButton size='small' onClick={() => router.push(`/nimen/sprints/${row.original.id}`)}>
              <i className='ri-eye-line text-[22px]' />
            </IconButton>
          </Tooltip>
          {row.original.status === 'DRAFT_ADMIN' && (
            <>
              <Tooltip title='Edit'>
                <IconButton size='small' onClick={() => router.push(`/nimen/sprints/${row.original.id}/edit`)}>
                  <i className='ri-edit-line text-[22px]' />
                </IconButton>
              </Tooltip>
              <Tooltip title='Hapus'>
                <IconButton size='small' onClick={() => { setDeleteTarget(row.original); setDeleteOpen(true) }}>
                  <i className='ri-delete-bin-7-line text-[22px]' />
                </IconButton>
              </Tooltip>
            </>
          )}
        </div>
      )
    })
  ], [router])

  const table = useReactTable({
    data, columns, manualPagination: true, manualFiltering: true,
    rowCount: total, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel()
  })

  return (
    <>
      <Card>
        <CardHeader title='Daftar Sprint NIMEN' sx={{ pb: 0 }}
          action={
            <Button variant='contained' startIcon={<i className='ri-add-line' />}
              onClick={() => router.push('/nimen/sprints/create')}>
              Buat Sprint
            </Button>
          }
        />
        <div className='flex flex-wrap justify-between gap-4 p-6'>
          <div className='flex flex-wrap items-center gap-4'>
            <FormControl size='small' sx={{ minWidth: 160 }}>
              <InputLabel>Angkatan</InputLabel>
              <Select label='Angkatan' value={batchFilter} onChange={e => { setBatchFilter(e.target.value); setPage(0) }}>
                <MenuItem value=''>Semua</MenuItem>
                {batches.map(b => <MenuItem key={b.id} value={b.id}>{b.name} ({b.year})</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size='small' sx={{ minWidth: 180 }}>
              <InputLabel>Status</InputLabel>
              <Select label='Status' value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0) }}>
                <MenuItem value=''>Semua</MenuItem>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <MenuItem key={key} value={key}>{cfg.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
          <DebouncedInput value={globalFilter} onChange={val => { setGlobalFilter(val); setPage(0) }}
            placeholder='Cari sprint...'
            InputProps={{ startAdornment: <InputAdornment position='start'><i className='ri-search-line' /></InputAdornment> }}
            sx={{ minWidth: 240 }}
          />
        </div>
        <Divider />
        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>{hg.headers.map(h => <th key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</th>)}</tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length} className='text-center py-10'><CircularProgress size={32} /></td></tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr><td colSpan={columns.length} className='text-center py-10'><Typography color='text.secondary'>Tidak ada data ditemukan</Typography></td></tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id}>{row.getVisibleCells().map(cell => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <TablePagination component='div' count={total} page={page} rowsPerPage={pageSize}
          onPageChange={(_, p) => setPage(p)} onRowsPerPageChange={e => { setPageSize(parseInt(e.target.value)); setPage(0) }}
          rowsPerPageOptions={[10, 25, 50]} labelRowsPerPage='Baris per halaman:'
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} dari ${count}`}
        />
      </Card>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Hapus Sprint</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Hapus sprint <strong>{deleteTarget?.sprint_number} — {deleteTarget?.title}</strong>? Semua data peserta akan ikut terhapus.
          </DialogContentText>
        </DialogContent>
        <DialogActions className='pli-5 plb-4'>
          <Button onClick={() => setDeleteOpen(false)} variant='tonal' color='secondary' disabled={deleteLoading}>Batal</Button>
          <Button onClick={handleDelete} variant='contained' color='error' disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={16} color='inherit' /> : null}>
            {deleteLoading ? 'Menghapus...' : 'Hapus'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast(t => ({ ...t, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity={toast.severity} variant='filled' onClose={() => setToast(t => ({ ...t, open: false }))}>{toast.message}</Alert>
      </Snackbar>
    </>
  )
}

export default NimenSprintListView
