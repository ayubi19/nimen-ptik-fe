'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import TablePagination from '@mui/material/TablePagination'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import LinearProgress from '@mui/material/LinearProgress'
import Tooltip from '@mui/material/Tooltip'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import { nimenRankingApi } from '@/libs/api/nimenRankingApi'
import { batchApi } from '@/libs/api/masterDataApi'
import { exportBatchPDF, exportBatchXLSX } from '@/utils/exportUtils'
import { getInitials } from '@/utils/getInitials'

const MEDAL_COLORS = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' }

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

const RankingView = () => {
  const [batches, setBatches] = useState([])
  const [batchID, setBatchID] = useState('')
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(50)

  // Dialog riwayat nilai
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyStudent, setHistoryStudent] = useState(null)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    batchApi.getAllActive()
      .then(res => {
        const list = res.data.data || []
        setBatches(list)
        if (list.length > 0) setBatchID(list[0].id)
      })
      .catch(() => {})
  }, [])

  const fetchRankings = useCallback(async () => {
    if (!batchID) return
    setLoading(true)
    try {
      const res = await nimenRankingApi.getRankings({
        batch_id: batchID,
        search,
        page: page + 1,
        page_size: pageSize,
      })
      setRows(res.data.data.data || [])
      setTotal(res.data.data.pagination?.total || 0)
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [batchID, search, page, pageSize])

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

  const [exportLoading, setExportLoading] = useState('')

  const selectedBatch = batches.find(b => b.id === batchID)

  const handleExportPDF = useCallback(async () => {
    if (!batchID || rows.length === 0) return
    setExportLoading('pdf')
    try {
      // Fetch semua data tanpa pagination untuk export
      const res = await nimenRankingApi.getRankings({ batch_id: batchID, page: 1, page_size: 9999 })
      const allRows = res.data.data?.data || []
      await exportBatchPDF(allRows, {
        name: selectedBatch?.name || batchID,
        max_value: allRows[0]?.max_value || 95,
      })
    } catch (e) { console.error(e) }
    finally { setExportLoading('') }
  }, [batchID, rows, selectedBatch])

  const handleExportXLSX = useCallback(async () => {
    if (!batchID || rows.length === 0) return
    setExportLoading('xlsx')
    try {
      const res = await nimenRankingApi.getRankings({ batch_id: batchID, page: 1, page_size: 9999 })
      const allRows = res.data.data?.data || []
      await exportBatchXLSX(allRows, {
        name: selectedBatch?.name || batchID,
        max_value: allRows[0]?.max_value || 95,
      })
    } catch (e) { console.error(e) }
    finally { setExportLoading('') }
  }, [batchID, rows, selectedBatch])

  return (
    <>
      <Card>
        <CardHeader
          title='Peringkat NIMEN'
          subheader='Ranking mahasiswa berdasarkan total nilai aktif per angkatan'
          action={
            <div className='flex items-center gap-2 pr-1'>
              <Typography variant='caption' color='text.secondary'>
                {total} mahasiswa
              </Typography>
              {rows.length > 0 && (
                <ButtonGroup variant='tonal' size='small' disabled={!!exportLoading}>
                  <Tooltip title='Export PDF'>
                    <Button color='error'
                      startIcon={exportLoading === 'pdf'
                        ? <CircularProgress size={12} color='inherit' />
                        : <i className='ri-file-pdf-line' />}
                      onClick={handleExportPDF}>
                      PDF
                    </Button>
                  </Tooltip>
                  <Tooltip title='Export Excel'>
                    <Button color='success'
                      startIcon={exportLoading === 'xlsx'
                        ? <CircularProgress size={12} color='inherit' />
                        : <i className='ri-file-excel-line' />}
                      onClick={handleExportXLSX}>
                      Excel
                    </Button>
                  </Tooltip>
                </ButtonGroup>
              )}
            </div>
          }
        />
        <div className='flex flex-wrap items-center gap-4 px-6 pb-4'>
          <FormControl size='small' sx={{ minWidth: 200 }}>
            <InputLabel>Angkatan</InputLabel>
            <Select label='Angkatan' value={batchID} onChange={e => { setBatchID(e.target.value); setPage(0) }}>
              {batches.map(b => (
                <MenuItem key={b.id} value={b.id}>{b.name} ({b.year})</MenuItem>
              ))}
            </Select>
          </FormControl>
          <DebouncedInput
            value={search}
            onChange={v => { setSearch(v); setPage(0) }}
            placeholder='Cari nama atau NIM...'
            InputProps={{ startAdornment: <InputAdornment position='start'><i className='ri-search-line' /></InputAdornment> }}
            sx={{ minWidth: 240 }}
          />
        </div>
        <Divider />

        {loading ? (
          <Box className='flex justify-center py-10'><CircularProgress /></Box>
        ) : rows.length === 0 ? (
          <Box className='flex flex-col items-center py-10 gap-2' sx={{ color: 'text.secondary' }}>
            <i className='ri-bar-chart-line text-5xl opacity-30' />
            <Typography variant='body2'>
              {batchID ? 'Belum ada data ranking untuk angkatan ini.' : 'Pilih angkatan untuk melihat ranking.'}
            </Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={60} align='center'>No.</TableCell>
                <TableCell>Mahasiswa</TableCell>
                <TableCell>Sindikat</TableCell>
                <TableCell>Total Nilai</TableCell>
                <TableCell align='center'>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(row => {
                const medal = MEDAL_COLORS[row.rank_position]
                const pct = Math.min((row.total_value / row.max_value) * 100, 100)

                return (
                  <TableRow key={row.student_id} hover
                    sx={row.rank_position <= 3 ? { bgcolor: `${medal}11` } : {}}>
                    <TableCell align='center'>
                      {row.rank_position <= 3 ? (
                        <Typography variant='h6' sx={{ color: medal }}>
                          {row.rank_position === 1 ? '🥇' : row.rank_position === 2 ? '🥈' : '🥉'}
                        </Typography>
                      ) : (
                        <Typography variant='body2' color='text.secondary' fontWeight={600}>
                          {row.rank_position}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Avatar sx={{ width: 36, height: 36, fontSize: 13,
                          bgcolor: medal || 'primary.main',
                          color: medal ? '#333' : 'white' }}>
                          {getInitials(row.full_name)}
                        </Avatar>
                        <div>
                          <Typography variant='body2' fontWeight={600}>{row.full_name}</Typography>
                          <Typography variant='caption' color='text.secondary'>{row.nim}</Typography>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>{row.syndicate_name}</Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 200 }}>
                      <div className='flex items-center gap-2 mb-1'>
                        <Typography variant='body2' fontWeight={700}>
                          {row.total_value.toFixed(2)}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          / {row.max_value.toFixed(0)}
                        </Typography>
                        {row.total_value >= row.max_value && (
                          <Chip label='Maks' color='success' size='small' variant='tonal' />
                        )}
                      </div>
                      <LinearProgress
                        variant='determinate'
                        value={pct}
                        color={pct >= 100 ? 'success' : pct >= 70 ? 'primary' : 'warning'}
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
                )
              })}
            </TableBody>
          </Table>
        )}

        <TablePagination
          component='div'
          count={total}
          page={page}
          rowsPerPage={pageSize}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={e => { setPageSize(parseInt(e.target.value)); setPage(0) }}
          rowsPerPageOptions={[20, 50, 100]}
          labelRowsPerPage='Baris per halaman:'
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} dari ${count}`}
        />
      </Card>

      {/* Dialog Riwayat Nilai */}
      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>
          <div className='flex items-center justify-between'>
            <div>
              <Typography variant='h6'>Riwayat Nilai</Typography>
              {historyStudent && (
                <Typography variant='caption' color='text.secondary'>
                  {historyStudent.full_name} • {historyStudent.nim} • Peringkat #{historyStudent.rank_position}
                </Typography>
              )}
            </div>
            <IconButton onClick={() => setHistoryOpen(false)}>
              <i className='ri-close-line' />
            </IconButton>
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
              {/* Ringkasan total */}
              <Box sx={{ px: 3, py: 2, bgcolor: 'background.default' }}>
                <div className='flex items-center gap-4'>
                  <div>
                    <Typography variant='caption' color='text.secondary'>Total Nilai Aktif</Typography>
                    <Typography variant='h5' fontWeight={700} color='primary.main'>
                      {historyStudent?.total_value?.toFixed(2)}
                    </Typography>
                  </div>
                  <Divider orientation='vertical' flexItem />
                  <div>
                    <Typography variant='caption' color='text.secondary'>Jumlah Entri</Typography>
                    <Typography variant='h5' fontWeight={700}>{history.length}</Typography>
                  </div>
                  <Divider orientation='vertical' flexItem />
                  <div>
                    <Typography variant='caption' color='text.secondary'>Nilai Positif</Typography>
                    <Typography variant='h5' fontWeight={700} color='success.main'>
                      +{history.filter(h => h.value > 0).reduce((s, h) => s + h.value, 0).toFixed(2)}
                    </Typography>
                  </div>
                  <Divider orientation='vertical' flexItem />
                  <div>
                    <Typography variant='caption' color='text.secondary'>Nilai Negatif</Typography>
                    <Typography variant='h5' fontWeight={700} color='error.main'>
                      {history.filter(h => h.value < 0).reduce((s, h) => s + h.value, 0).toFixed(2)}
                    </Typography>
                  </div>
                </div>
              </Box>
              <Divider />
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Tanggal</TableCell>
                    <TableCell>Indikator</TableCell>
                    <TableCell>Kategori</TableCell>
                    <TableCell align='right'>Nilai</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Typography variant='caption'>
                          {new Date(entry.event_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>{entry.indicator?.name}</Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {entry.indicator?.variable?.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='caption' color='text.secondary'>
                          {entry.indicator?.variable?.category?.name}
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Typography
                          variant='body2'
                          fontWeight={700}
                          color={entry.value >= 0 ? 'success.main' : 'error.main'}
                        >
                          {entry.value >= 0 ? `+${entry.value}` : entry.value}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={entry.status === 'VALID' ? 'Valid' : 'Dispensasi'}
                          color={entry.status === 'VALID' ? 'success' : 'info'}
                          size='small'
                          variant='tonal'
                        />
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
