'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
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
import { nimenRankingApi } from '@/libs/api/nimenRankingApi'
import { batchApi, syndicateApi } from '@/libs/api/masterDataApi'
import { exportBatchPDF, exportBatchXLSX } from '@/utils/exportUtils'
import { getInitials } from '@/utils/getInitials'

const MEDAL_COLORS = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' }
const MEDAL_EMOJI  = { 1: '🥇', 2: '🥈', 3: '🥉' }

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

// ── Mobile Card ───────────────────────────────────────────────────────────────
const RankingMobileCard = ({ row, onViewHistory }) => {
  const medal = MEDAL_COLORS[row.rank_position]
  const pct = Math.min((row.total_value / (row.max_value || 95)) * 100, 100)

  return (
    <Card className='mb-3' sx={{ borderLeft: medal ? `4px solid ${medal}` : undefined }}>
      <CardContent sx={{ p: '12px !important' }}>
        <div className='flex items-start justify-between gap-2 mb-2'>
          <div className='flex items-center gap-2 flex-1 min-w-0'>
            <Box sx={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              bgcolor: medal || 'primary.main',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {row.rank_position <= 3 ? (
                <Typography sx={{ fontSize: 16 }}>{MEDAL_EMOJI[row.rank_position]}</Typography>
              ) : (
                <Typography variant='caption' fontWeight={700} sx={{ color: '#fff' }}>
                  {row.rank_position}
                </Typography>
              )}
            </Box>
            <div className='min-w-0'>
              <Typography variant='body2' fontWeight={600} noWrap>{row.full_name || '—'}</Typography>
              <Typography variant='caption' color='text.secondary'>
                {row.nim || '—'} · {row.syndicate_name || '—'}
              </Typography>
            </div>
          </div>
          <div className='flex items-center gap-1 flex-shrink-0'>
            <Typography variant='body2' fontWeight={700} color='primary.main'>
              {row.total_value?.toFixed(2)}
            </Typography>
            <Tooltip title='Riwayat nilai'>
              <IconButton size='small' onClick={() => onViewHistory(row)}>
                <i className='ri-history-line text-[18px]' />
              </IconButton>
            </Tooltip>
          </div>
        </div>
        <LinearProgress
          variant='determinate'
          value={pct}
          color={pct >= 100 ? 'success' : pct >= 70 ? 'primary' : 'warning'}
          sx={{ height: 4, borderRadius: 2 }}
        />
        <div className='flex justify-between mt-1'>
          <Typography variant='caption' color='text.secondary'>0</Typography>
          <Typography variant='caption' color='text.secondary'>/ {row.max_value?.toFixed(0) || '—'}</Typography>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Main View ─────────────────────────────────────────────────────────────────
const RankingView = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [batches, setBatches]           = useState([])
  const [batchID, setBatchID]           = useState('')
  const [syndicates, setSyndicates]     = useState([])
  const [syndicateID, setSyndicateID]   = useState('')
  const [rows, setRows]                 = useState([])
  const [total, setTotal]               = useState(0)
  const [loading, setLoading]           = useState(false)
  const [search, setSearch]             = useState('')
  const [page, setPage]                 = useState(0)
  const [pageSize, setPageSize]         = useState(50)
  const [exportLoading, setExportLoading] = useState('')

  const [historyOpen, setHistoryOpen]       = useState(false)
  const [historyStudent, setHistoryStudent] = useState(null)
  const [history, setHistory]               = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // Load batches
  useEffect(() => {
    batchApi.getAllActive()
      .then(res => {
        const list = res.data.data || []
        setBatches(list)
        if (list.length > 0) setBatchID(list[0].id)
      })
      .catch(() => {})
  }, [])

  // Load sindikat saat batch dipilih
  useEffect(() => {
    if (!batchID) { setSyndicates([]); return }
    syndicateApi.getAll({ is_active: true, page_size: 100 })
      .then(res => setSyndicates(res.data.data?.data || []))
      .catch(() => {})
  }, [batchID])

  // Fetch rankings
  const fetchRankings = useCallback(async () => {
    if (!batchID) return
    setLoading(true)
    try {
      const params = { batch_id: batchID, search, page: page + 1, page_size: pageSize }
      if (syndicateID) params.syndicate_id = syndicateID
      const res = await nimenRankingApi.getRankings(params)
      setRows(res.data.data.data || [])
      setTotal(res.data.data.pagination?.total || 0)
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [batchID, syndicateID, search, page, pageSize])

  useEffect(() => { fetchRankings() }, [fetchRankings])

  const handleViewHistory = useCallback(async (row) => {
    setHistoryStudent(row)
    setHistoryLoading(true)
    setHistoryOpen(true)
    try {
      const res = await nimenRankingApi.getValueHistory(row.student_id)
      setHistory(res.data.data || [])
    } catch {
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  const selectedBatch = batches.find(b => b.id === batchID)

  const handleExportPDF = useCallback(async () => {
    if (!batchID || rows.length === 0) return
    setExportLoading('pdf')
    try {
      const params = { batch_id: batchID, page: 1, page_size: 9999 }
      if (syndicateID) params.syndicate_id = syndicateID
      const res = await nimenRankingApi.getRankings(params)
      const allRows = res.data.data?.data || []
      await exportBatchPDF(allRows, { name: selectedBatch?.name || batchID, max_value: allRows[0]?.max_value || 95 })
    } catch (e) { console.error(e) }
    finally { setExportLoading('') }
  }, [batchID, syndicateID, rows, selectedBatch])

  const handleExportXLSX = useCallback(async () => {
    if (!batchID || rows.length === 0) return
    setExportLoading('xlsx')
    try {
      const params = { batch_id: batchID, page: 1, page_size: 9999 }
      if (syndicateID) params.syndicate_id = syndicateID
      const res = await nimenRankingApi.getRankings(params)
      const allRows = res.data.data?.data || []
      await exportBatchXLSX(allRows, { name: selectedBatch?.name || batchID, max_value: allRows[0]?.max_value || 95 })
    } catch (e) { console.error(e) }
    finally { setExportLoading('') }
  }, [batchID, syndicateID, rows, selectedBatch])

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

  return (
    <>
      {/* Breadcrumb */}
      <div className='flex items-center gap-2 mb-6'>
        <Typography variant='caption' color='text.secondary'>NIMEN</Typography>
        <i className='ri-arrow-right-s-line text-sm opacity-50' />
        <Typography variant='caption' fontWeight={500} color='text.primary'>Peringkat</Typography>
      </div>

      {/* Filter + Export */}
      <Card className='mb-6'>
        <CardContent>
          <Grid container spacing={3} alignItems='center'>
            {/* Angkatan */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size='small'>
                <InputLabel>Angkatan</InputLabel>
                <Select label='Angkatan' value={batchID}
                        onChange={e => { setBatchID(e.target.value); setSyndicateID(''); setPage(0) }}>
                  {batches.map(b => (
                    <MenuItem key={b.id} value={b.id}>{b.name} ({b.year})</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Sindikat */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size='small'>
                <InputLabel>Sindikat</InputLabel>
                <Select label='Sindikat' value={syndicateID}
                        onChange={e => { setSyndicateID(e.target.value); setPage(0) }}
                        disabled={!batchID}>
                  <MenuItem value=''>Semua Sindikat</MenuItem>
                  {syndicates.map(s => (
                    <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Search */}
            <Grid item xs={12} md={4}>
              <DebouncedInput fullWidth value={search}
                              onChange={v => { setSearch(v); setPage(0) }}
                              placeholder='Cari nama atau NIM...'
                              InputProps={{ startAdornment: <InputAdornment position='start'><i className='ri-search-line' /></InputAdornment> }}
              />
            </Grid>

            {/* Export */}
            <Grid item xs={12} md={2}>
              {rows.length > 0 && (
                <ButtonGroup fullWidth variant='tonal' size='small' disabled={!!exportLoading}>
                  <Tooltip title='Export PDF'>
                    <Button color='error'
                            startIcon={exportLoading === 'pdf' ? <CircularProgress size={12} color='inherit' /> : <i className='ri-file-pdf-line' />}
                            onClick={handleExportPDF}>PDF</Button>
                  </Tooltip>
                  <Tooltip title='Export Excel'>
                    <Button color='success'
                            startIcon={exportLoading === 'xlsx' ? <CircularProgress size={12} color='inherit' /> : <i className='ri-file-excel-line' />}
                            onClick={handleExportXLSX}>Excel</Button>
                  </Tooltip>
                </ButtonGroup>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Stats */}
      <Grid container spacing={4} className='mb-6'>
        {[
          { label: 'Total Mahasiswa', value: total, icon: 'ri-group-line', color: '#FF4C51', bg: '#FFE9EA' },
          {
            label: syndicateID
              ? (syndicates.find(s => s.id === parseInt(syndicateID))?.name || 'Sindikat')
              : (selectedBatch?.name || '—'),
            value: syndicateID ? 'Per Sindikat' : 'Per Angkatan',
            icon: syndicateID ? 'ri-shield-star-line' : 'ri-building-line',
            color: '#7367F0', bg: '#F3EDFF'
          },
        ].map(s => (
          <Grid item xs={6} key={s.label}>
            <Card>
              <CardContent className='flex items-center gap-3' sx={{ p: '12px !important' }}>
                <div style={{ width: 44, height: 44, borderRadius: 8, flexShrink: 0, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={s.icon} style={{ fontSize: 22, color: s.color }} />
                </div>
                <div className='min-w-0'>
                  <Typography variant='h5' fontWeight={600} lineHeight={1.2}>{s.value}</Typography>
                  <Typography variant='body2' color='text.secondary' sx={{ fontSize: { xs: 11, sm: 13 } }} noWrap>
                    {s.label}
                  </Typography>
                </div>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Content */}
      {loading ? (
        <Box className='flex justify-center py-10'><CircularProgress /></Box>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className='text-center py-12'>
            <i className='ri-bar-chart-line text-5xl opacity-30 block mb-2' />
            <Typography variant='body2' color='text.secondary'>
              {batchID ? 'Belum ada data ranking untuk filter yang dipilih.' : 'Pilih angkatan untuk melihat ranking.'}
            </Typography>
          </CardContent>
        </Card>
      ) : isMobile ? (
        <>
          {rows.map(row => (
            <RankingMobileCard key={String(row.student_id)} row={row} onViewHistory={handleViewHistory} />
          ))}
          <TablePagination component='div' count={total} page={page} rowsPerPage={pageSize}
                           onPageChange={(_, p) => setPage(p)}
                           onRowsPerPageChange={e => { setPageSize(parseInt(e.target.value)); setPage(0) }}
                           rowsPerPageOptions={[20, 50, 100]}
                           labelRowsPerPage='Baris:'
                           labelDisplayedRows={({ from, to, count }) => `${from}–${to} dari ${count}`}
          />
        </>
      ) : (
        <Card>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                {['No.', 'Mahasiswa', 'Sindikat', 'Total Nilai', 'Aksi'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(row => (
                <TableRow
                  key={String(row.student_id)}
                  hover
                  sx={MEDAL_COLORS[row.rank_position] ? { bgcolor: `${MEDAL_COLORS[row.rank_position]}11` } : {}}>
                  <TableCell width={60} align='center'>
                    {row.rank_position <= 3 ? (
                      <Typography variant='h6'>{MEDAL_EMOJI[row.rank_position]}</Typography>
                    ) : (
                      <Typography variant='body2' color='text.secondary' fontWeight={600}>
                        {row.rank_position}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <Avatar sx={{
                        width: 36, height: 36, fontSize: 13,
                        bgcolor: MEDAL_COLORS[row.rank_position] || 'primary.main',
                        color: MEDAL_COLORS[row.rank_position] ? '#333' : 'white',
                      }}>
                        {getInitials(row.full_name || '')}
                      </Avatar>
                      <div>
                        <Typography variant='body2' fontWeight={600}>{row.full_name || '—'}</Typography>
                        <Typography variant='caption' color='text.secondary'>{row.nim || '—'}</Typography>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2'>{row.syndicate_name || '—'}</Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 200 }}>
                    <div className='flex items-center gap-2 mb-1'>
                      <Typography variant='body2' fontWeight={700}>{row.total_value?.toFixed(2)}</Typography>
                      <Typography variant='caption' color='text.secondary'>/ {row.max_value?.toFixed(0)}</Typography>
                      {row.total_value >= row.max_value && (
                        <Chip label='Maks' color='success' size='small' variant='tonal' />
                      )}
                    </div>
                    <LinearProgress
                      variant='determinate'
                      value={Math.min((row.total_value / (row.max_value || 95)) * 100, 100)}
                      color={Math.min((row.total_value / (row.max_value || 95)) * 100, 100) >= 100 ? 'success' : Math.min((row.total_value / (row.max_value || 95)) * 100, 100) >= 70 ? 'primary' : 'warning'}
                      sx={{ height: 5, borderRadius: 3 }}
                    />
                  </TableCell>
                  <TableCell align='center'>
                    <Tooltip title='Lihat riwayat nilai'>
                      <IconButton size='small' onClick={() => handleViewHistory(row)}>
                        <i className='ri-history-line text-[20px]' />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination component='div' count={total} page={page} rowsPerPage={pageSize}
                           onPageChange={(_, p) => setPage(p)}
                           onRowsPerPageChange={e => { setPageSize(parseInt(e.target.value)); setPage(0) }}
                           rowsPerPageOptions={[20, 50, 100]}
                           labelRowsPerPage='Baris per halaman:'
                           labelDisplayedRows={({ from, to, count }) => `${from}–${to} dari ${count}`}
          />
        </Card>
      )}

      {/* Dialog Riwayat Nilai */}
      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>
          <div className='flex items-center justify-between'>
            <div>
              <Typography variant='h6'>Riwayat Nilai</Typography>
              {historyStudent && (
                <Typography variant='caption' color='text.secondary'>
                  {historyStudent.full_name || '—'} · {historyStudent.nim || '—'} · Peringkat #{historyStudent.rank_position}
                </Typography>
              )}
            </div>
            <IconButton onClick={() => setHistoryOpen(false)}><i className='ri-close-line' /></IconButton>
          </div>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 0 }}>
          {historyLoading ? (
            <Box className='flex justify-center py-8'><CircularProgress /></Box>
          ) : history.length === 0 ? (
            <Box className='flex flex-col items-center py-8 gap-2' sx={{ color: 'text.secondary' }}>
              <i className='ri-inbox-line text-4xl opacity-30' />
              <Typography variant='body2'>Belum ada riwayat nilai.</Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ px: 3, py: 2, bgcolor: 'background.default' }}>
                <div className='flex flex-wrap items-center gap-4'>
                  {[
                    { label: 'Total Nilai Aktif', value: historyStudent?.total_value?.toFixed(2), color: 'primary.main' },
                    { label: 'Jumlah Entri',      value: history.length,                          color: undefined },
                    { label: 'Nilai Positif',     value: `+${history.filter(h => h.value > 0).reduce((s, h) => s + h.value, 0).toFixed(2)}`, color: 'success.main' },
                    { label: 'Nilai Negatif',     value: history.filter(h => h.value < 0).reduce((s, h) => s + h.value, 0).toFixed(2), color: 'error.main' },
                  ].map((s, i) => (
                    <div key={s.label} className='flex items-center gap-3'>
                      {i > 0 && <Divider orientation='vertical' flexItem />}
                      <div>
                        <Typography variant='caption' color='text.secondary'>{s.label}</Typography>
                        <Typography variant='h5' fontWeight={700} color={s.color}>{s.value}</Typography>
                      </div>
                    </div>
                  ))}
                </div>
              </Box>
              <Divider />
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    {['Tanggal', 'Indikator', 'Kategori', 'Nilai', 'Status'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Typography variant='caption'>{fmtDate(entry.event_date)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>{entry.indicator?.name}</Typography>
                        <Typography variant='caption' color='text.secondary'>{entry.indicator?.variable?.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='caption' color='text.secondary'>
                          {entry.indicator?.variable?.category?.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2' fontWeight={700}
                                    color={entry.value >= 0 ? 'success.main' : 'error.main'}>
                          {entry.value >= 0 ? `+${entry.value}` : entry.value}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={entry.status === 'VALID' ? 'Valid' : 'Dispensasi'}
                              color={entry.status === 'VALID' ? 'success' : 'info'}
                              size='small' variant='tonal' />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default RankingView
