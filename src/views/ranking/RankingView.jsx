'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Alert from '@mui/material/Alert'
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
import { useSession } from 'next-auth/react'
import { profileApi } from '@/libs/api/profileApi'
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
            <IconButton size='small' onClick={() => onViewHistory(row)}>
              <i className='ri-history-line text-[18px]' />
            </IconButton>
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
  const { data: session } = useSession()

  const roles = session?.user?.roles || []
  const jwtPayload = session?.user?.accessToken
    ? (() => { try { return JSON.parse(atob(session.user.accessToken.split('.')[1])) } catch { return {} } })()
    : {}
  const isDeveloper = jwtPayload?.is_developer === true
  const isAdmin = isDeveloper || roles.some(r => (typeof r === 'string' ? r : r.name) === 'admin_nimen')
  const studentId = session?.user?.id

  const [batches, setBatches]         = useState([])
  const [batchID, setBatchID]         = useState('')
  const [syndicates, setSyndicates]   = useState([])
  const [syndicateID, setSyndicateID] = useState('')
  const [rows, setRows]               = useState([])
  const [total, setTotal]             = useState(0)
  const [loading, setLoading]         = useState(false)
  const [search, setSearch]           = useState('')
  const [page, setPage]               = useState(0)
  const [pageSize, setPageSize]       = useState(10)
  const [exportLoading, setExportLoading] = useState('')

  const [historyOpen, setHistoryOpen]       = useState(false)
  const [historyStudent, setHistoryStudent] = useState(null)
  const [history, setHistory]               = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // State khusus mahasiswa
  const [myRanking, setMyRanking]     = useState(null)
  const [myHistory, setMyHistory]     = useState([])
  const [myLoading, setMyLoading]     = useState(false)

  // Load batches — admin: semua angkatan, mahasiswa: auto-set dari profile
  useEffect(() => {
    if (isAdmin) {
      batchApi.getAllActive()
        .then(res => {
          const list = res.data.data || []
          setBatches(list)
          if (list.length > 0) setBatchID(String(list[0].id))
        })
        .catch(() => {})
    } else if (studentId) {
      // Mahasiswa: ambil batch_id dari profile
      profileApi.getProfile()
        .then(res => {
          const profile = res.data.data
          const batchId = profile?.student_profile?.batch_id
          if (batchId) setBatchID(String(batchId))
        })
        .catch(() => {})
    }
  }, [isAdmin, studentId])

  // Load sindikat saat batch dipilih (admin only)
  useEffect(() => {
    if (!isAdmin || !batchID) { setSyndicates([]); return }
    syndicateApi.getAll({ is_active: true, page_size: 100 })
      .then(res => setSyndicates(res.data.data?.data || []))
      .catch(() => {})
  }, [isAdmin, batchID])

  // Load data peringkat & riwayat untuk mahasiswa
  useEffect(() => {
    if (isAdmin || !studentId || !batchID) return
    setMyLoading(true)
    Promise.all([
      nimenRankingApi.getRankings({ batch_id: parseInt(batchID), page: 1, page_size: 999 }),
      nimenRankingApi.getValueHistory(studentId),
    ]).then(([rankRes, histRes]) => {
      const allRows = rankRes.data.data?.data || []
      const me = allRows.find(r => String(r.student_id) === String(studentId))
      setMyRanking({ ...me, total: allRows.length })
      setMyHistory(histRes.data.data || [])
    }).catch(() => {})
      .finally(() => setMyLoading(false))
  }, [isAdmin, studentId, batchID])

  // Fetch rankings
  const fetchRankings = useCallback(async () => {
    if (!batchID) return
    setLoading(true)
    try {
      const params = {
        batch_id: parseInt(batchID),
        page: page + 1,
        page_size: pageSize,
      }
      if (syndicateID) params.syndicate_id = parseInt(syndicateID)
      if (search) params.search = search
      const res = await nimenRankingApi.getRankings(params)
      setRows(res.data.data?.data || [])
      setTotal(res.data.data?.pagination?.total || 0)
    } catch {
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [batchID, syndicateID, search, page, pageSize])

  useEffect(() => { fetchRankings() }, [fetchRankings])

  // Refetch saat halaman mendapat fokus kembali atau navigasi dari notifikasi
  const pathname = usePathname()
  const refetchAll = useCallback(() => {
    fetchRankings()
    // Trigger ulang student data dengan update batchID (workaround untuk re-run useEffect)
    if (!isAdmin && studentId && batchID) {
      setMyLoading(true)
      Promise.all([
        nimenRankingApi.getRankings({ batch_id: parseInt(batchID), page: 1, page_size: 999 }),
        nimenRankingApi.getValueHistory(studentId),
      ]).then(([rankRes, histRes]) => {
        const allRows = rankRes.data.data?.data || []
        const me = allRows.find(r => String(r.student_id) === String(studentId))
        setMyRanking({ ...me, total: allRows.length })
        setMyHistory(histRes.data.data || [])
      }).catch(() => {}).finally(() => setMyLoading(false))
    }
  }, [fetchRankings, isAdmin, studentId, batchID])

  useEffect(() => {
    const onFocus = () => refetchAll()
    const onVisible = () => { if (document.visibilityState === 'visible') refetchAll() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refetchAll])

  useEffect(() => { refetchAll() }, [pathname, refetchAll])

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

  const selectedBatch = batches.find(b => String(b.id) === String(batchID))

  const fetchAllForExport = useCallback(async () => {
    const PAGE_SIZE = 100
    let allRows = []
    let currentPage = 1
    let hasMore = true
    while (hasMore) {
      const params = { batch_id: parseInt(batchID), page: currentPage, page_size: PAGE_SIZE }
      if (syndicateID) params.syndicate_id = parseInt(syndicateID)
      if (search) params.search = search
      const res = await nimenRankingApi.getRankings(params)
      const data = res.data.data?.data || []
      allRows = [...allRows, ...data]
      const totalCount = res.data.data?.pagination?.total || 0
      hasMore = allRows.length < totalCount && data.length > 0
      currentPage++
      if (currentPage > 50) break // safety cap
    }
    return allRows
  }, [batchID, syndicateID, search])

  const handleExportPDF = useCallback(async () => {
    if (!batchID || rows.length === 0) return
    setExportLoading('pdf')
    try {
      const allRows = await fetchAllForExport()
      await exportBatchPDF(allRows, { name: selectedBatch?.name || batchID, max_value: allRows[0]?.max_value || 95 })
    } catch (e) { console.error(e) }
    finally { setExportLoading('') }
  }, [batchID, rows, selectedBatch, fetchAllForExport])

  const handleExportXLSX = useCallback(async () => {
    if (!batchID || rows.length === 0) return
    setExportLoading('xlsx')
    try {
      const allRows = await fetchAllForExport()
      await exportBatchXLSX(allRows, { name: selectedBatch?.name || batchID, max_value: allRows[0]?.max_value || 95 })
    } catch (e) { console.error(e) }
    finally { setExportLoading('') }
  }, [batchID, rows, selectedBatch, fetchAllForExport])

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

  // ── Student Personal View ────────────────────────────────────────────────────
  if (!isAdmin) {
    const SOURCE_CONFIG = {
      SPRINT:          { label: 'Sprint',            color: 'primary' },
      SELF_SUBMISSION: { label: 'Pengajuan Mandiri', color: 'info'    },
      AUTOMATIC:       { label: 'Otomatis',          color: 'success' },
    }
    const maxValue = myRanking?.max_value || 95
    const totalValue = myRanking?.total_value || 0
    const pct = Math.min((totalValue / maxValue) * 100, 100)
    const rank = myRanking?.rank_position
    const totalStudents = myRanking?.total || 0

    const bySource = myHistory.reduce((acc, e) => {
      const key = e.source_type
      acc[key] = (acc[key] || 0) + e.value
      return acc
    }, {})

    return (
      <>
        {/* Breadcrumb */}
        <div className='flex items-center gap-2 mb-6'>
          <Typography variant='caption' color='text.secondary'>NIMEN</Typography>
          <i className='ri-arrow-right-s-line text-sm opacity-50' />
          <Typography variant='caption' fontWeight={500} color='text.primary'>Peringkat Saya</Typography>
        </div>

        {myLoading ? (
          <Box className='flex justify-center py-20'><CircularProgress /></Box>
        ) : (
          <Grid container spacing={4}>

            {/* Hero Card — Posisi */}
            <Grid item xs={12}>
              <Card sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.primary.main}05 100%)`,
                border: `1px solid ${theme.palette.primary.main}20`,
              }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <div className='flex items-start gap-4 flex-wrap'>
                    {/* Ranking badge */}
                    <Box sx={{
                      width: isMobile ? 80 : 100, height: isMobile ? 80 : 100,
                      borderRadius: 4, flexShrink: 0,
                      background: rank === 1 ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                        : rank === 2 ? 'linear-gradient(135deg, #C0C0C0, #A8A8A8)'
                          : rank === 3 ? 'linear-gradient(135deg, #CD7F32, #A0522D)'
                            : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      boxShadow: 3,
                    }}>
                      {rank && rank <= 3 ? (
                        <Typography sx={{ fontSize: isMobile ? 32 : 40 }}>
                          {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                        </Typography>
                      ) : (
                        <>
                          <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>
                            PERINGKAT
                          </Typography>
                          <Typography variant='h4' fontWeight={800} sx={{ color: '#fff', lineHeight: 1 }}>
                            {rank || '—'}
                          </Typography>
                          {totalStudents > 0 && (
                            <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>
                              dari {totalStudents}
                            </Typography>
                          )}
                        </>
                      )}
                    </Box>

                    {/* Info nilai */}
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 mb-1 flex-wrap'>
                        <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight={800} color='primary.main'>
                          {totalValue.toFixed(2)}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>/ {maxValue.toFixed(0)} poin</Typography>
                      </div>
                      {rank && rank <= 3 && (
                        <Typography variant='caption' color='text.secondary'>
                          Peringkat {rank} dari {totalStudents} mahasiswa
                        </Typography>
                      )}
                      <Box sx={{ mt: 1.5, mb: 0.5 }}>
                        <LinearProgress variant='determinate' value={pct}
                                        color={pct >= 100 ? 'success' : pct >= 70 ? 'primary' : 'warning'}
                                        sx={{ height: 10, borderRadius: 5 }} />
                      </Box>
                      <div className='flex justify-between'>
                        <Typography variant='caption' color='text.secondary'>0</Typography>
                        <Typography variant='caption' color='text.secondary' fontWeight={500}>
                          {pct.toFixed(1)}% dari maksimum
                        </Typography>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Grid>

            {/* Rincian per Sumber */}
            {Object.keys(bySource).length > 0 && (
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant='subtitle1' fontWeight={700} className='mb-3'>
                      Rincian per Sumber
                    </Typography>
                    <div className='flex flex-col gap-3'>
                      {Object.entries(bySource).map(([src, val]) => {
                        const cfg = SOURCE_CONFIG[src] || { label: src, color: 'default' }
                        const srcPct = Math.min(Math.abs(val) / maxValue * 100, 100)
                        return (
                          <div key={src}>
                            <div className='flex items-center justify-between mb-1'>
                              <Chip label={cfg.label} color={cfg.color} size='small' variant='tonal' />
                              <Typography variant='body2' fontWeight={700}
                                          color={val >= 0 ? 'success.main' : 'error.main'}>
                                {val >= 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}
                              </Typography>
                            </div>
                            <LinearProgress variant='determinate' value={srcPct}
                                            color={val >= 0 ? 'success' : 'error'}
                                            sx={{ height: 6, borderRadius: 3 }} />
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Riwayat Nilai */}
            <Grid item xs={12} md={Object.keys(bySource).length > 0 ? 8 : 12}>
              <Card>
                <CardContent sx={{ pb: '8px !important' }}>
                  <Typography variant='subtitle1' fontWeight={700} className='mb-3'>
                    Riwayat Nilai
                    <Chip label={myHistory.length} size='small' variant='tonal' sx={{ ml: 1 }} />
                  </Typography>
                  {myHistory.length === 0 ? (
                    <Box className='flex flex-col items-center py-8 gap-2' sx={{ color: 'text.secondary' }}>
                      <i className='ri-inbox-line text-5xl opacity-30' />
                      <Typography variant='body2'>Belum ada riwayat nilai.</Typography>
                    </Box>
                  ) : isMobile ? (
                    // Mobile: card list
                    <div className='flex flex-col gap-2'>
                      {myHistory.map(e => {
                        const isPlus = e.value >= 0
                        const srcCfg = SOURCE_CONFIG[e.source_type] || { label: e.source_type, color: 'default' }
                        return (
                          <Box key={e.id} sx={{ p: 1.5, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                            <div className='flex items-start justify-between gap-2'>
                              <div className='flex-1 min-w-0'>
                                <Typography variant='body2' fontWeight={600} noWrap>
                                  {e.indicator?.name}
                                </Typography>
                                <Typography variant='caption' color='text.secondary'>
                                  {e.indicator?.variable?.category?.name}
                                </Typography>
                              </div>
                              <Typography variant='body2' fontWeight={700} flexShrink={0}
                                          color={isPlus ? 'success.main' : 'error.main'}>
                                {isPlus ? `+${e.value}` : e.value}
                              </Typography>
                            </div>
                            <div className='flex items-center gap-2 mt-1 flex-wrap'>
                              <Typography variant='caption' color='text.secondary'>
                                {new Date(e.event_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </Typography>
                              <Chip label={srcCfg.label} color={srcCfg.color} size='small' variant='tonal'
                                    sx={{ height: 18, fontSize: 10 }} />
                            </div>
                          </Box>
                        )
                      })}
                    </div>
                  ) : (
                    // Desktop: table
                    <Table size='small'>
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                          {['Tanggal', 'Indikator', 'Kategori', 'Sumber', 'Nilai'].map(h => (
                            <TableCell key={h} sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                              {h}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {myHistory.map(e => {
                          const isPlus = e.value >= 0
                          const srcCfg = SOURCE_CONFIG[e.source_type] || { label: e.source_type, color: 'default' }
                          return (
                            <TableRow key={e.id} hover>
                              <TableCell>
                                <Typography variant='caption'>
                                  {new Date(e.event_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant='body2' fontWeight={500}>{e.indicator?.name}</Typography>
                                <Typography variant='caption' color='text.secondary'>{e.indicator?.variable?.name}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant='caption' color='text.secondary'>
                                  {e.indicator?.variable?.category?.name}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip label={srcCfg.label} color={srcCfg.color} size='small' variant='tonal' />
                              </TableCell>
                              <TableCell align='right'>
                                <Typography variant='body2' fontWeight={700}
                                            color={isPlus ? 'success.main' : 'error.main'}>
                                  {isPlus ? `+${e.value}` : e.value}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </>
    )
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className='flex items-center gap-2 mb-6'>
        <Typography variant='caption' color='text.secondary'>NIMEN</Typography>
        <i className='ri-arrow-right-s-line text-sm opacity-50' />
        <Typography variant='caption' fontWeight={500} color='text.primary'>Peringkat</Typography>
      </div>

      {/* Filter Card */}
      <Card className='mb-6'>
        <CardContent>
          <Grid container spacing={3} alignItems='center'>
            {/* Angkatan + Sindikat — hanya admin */}
            {isAdmin && <Grid item xs={12} sm={4}>
              <FormControl fullWidth size='small'>
                <InputLabel>Angkatan</InputLabel>
                <Select label='Angkatan' value={batchID}
                        onChange={e => { setBatchID(e.target.value); setSyndicateID(''); setPage(0) }}
                        renderValue={val => {
                          const b = batches.find(x => x.id === val || String(x.id) === String(val))
                          if (!b) return ''
                          return (
                            <div className='flex items-center justify-between gap-2'>
                              <Typography variant='body2' fontWeight={500} noWrap>{b.name}</Typography>
                              <Chip label={b.program_type || 'S1'} size='small' variant='tonal'
                                    color={b.program_type === 'S2' ? 'info' : 'success'}
                                    sx={{ flexShrink: 0 }} />
                            </div>
                          )
                        }}>
                  {batches.map(b => (
                    <MenuItem key={b.id} value={b.id}>
                      <div className='flex items-center justify-between w-full gap-2'>
                        <div>
                          <Typography variant='body2' fontWeight={500}>{b.name}</Typography>
                          <Typography variant='caption' color='text.secondary'>
                            Angkatan ke-{b.batch_number} · {b.year}
                          </Typography>
                        </div>
                        <Chip label={b.program_type || 'S1'} size='small' variant='tonal'
                              color={b.program_type === 'S2' ? 'info' : 'success'} />
                      </div>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>}

            {isAdmin && <Grid item xs={12} sm={4}>
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
            </Grid>}

            <Grid item xs={12} sm={isAdmin ? 4 : 12}>
              <DebouncedInput fullWidth value={search}
                              onChange={v => { setSearch(v); setPage(0) }}
                              placeholder='Cari nama atau NIM...'
                              InputProps={{ startAdornment: <InputAdornment position='start'><i className='ri-search-line' /></InputAdornment> }}
              />
            </Grid>

            {/* Export — hanya admin */}
            {isAdmin && rows.length > 0 && (
              <>
                <Grid item xs={12} sm={8} sx={{ display: { xs: 'none', sm: 'block' } }} />
                <Grid item xs={12} sm={4}>
                  <ButtonGroup fullWidth variant='tonal' size='small' disabled={!!exportLoading}>
                    <Tooltip title='Export PDF'>
                      <Button color='error'
                              startIcon={exportLoading === 'pdf'
                                ? <CircularProgress size={12} color='inherit' />
                                : <i className='ri-file-pdf-line' />}
                              onClick={handleExportPDF}>PDF</Button>
                    </Tooltip>
                    <Tooltip title='Export Excel'>
                      <Button color='success'
                              startIcon={exportLoading === 'xlsx'
                                ? <CircularProgress size={12} color='inherit' />
                                : <i className='ri-file-excel-line' />}
                              onClick={handleExportXLSX}>Excel</Button>
                    </Tooltip>
                  </ButtonGroup>
                </Grid>
              </>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Info angkatan untuk mahasiswa */}
      {!isAdmin && selectedBatch && (
        <Alert severity='info' icon={<i className='ri-group-line' />} className='mb-6'>
          Menampilkan peringkat angkatan <strong>{selectedBatch.name}</strong>
          {selectedBatch.program_type && ` · ${selectedBatch.program_type}`}
        </Alert>
      )}

      {/* Stats */}
      <Grid container spacing={4} className='mb-6'>
        {[
          { label: 'Total Mahasiswa', value: total, icon: 'ri-group-line', color: '#FF4C51', bg: '#FFE9EA' },
          {
            label: syndicateID
              ? (syndicates.find(s => s.id === parseInt(syndicateID))?.name || 'Sindikat')
              : `${selectedBatch?.program_type || 'S1'} · ${selectedBatch?.year || '—'}`,
            value: syndicateID ? 'Per Sindikat' : 'Per Angkatan',
            icon: syndicateID ? 'ri-shield-star-line' : 'ri-building-line',
            color: '#7367F0', bg: '#F3EDFF'
          },
        ].map(s => (
          <Grid item xs={6} key={s.label}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: '12px !important', height: '100%' }}>
                <div className='flex items-center gap-2'>
                  <div style={{
                    width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                    background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className={s.icon} style={{ fontSize: 20, color: s.color }} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <Typography variant='h5' fontWeight={600} lineHeight={1.2} noWrap>
                      {s.value}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'
                                sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.label}
                    </Typography>
                  </div>
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
          <CardContent sx={{ py: 6 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <i className='ri-bar-chart-line' style={{ fontSize: 48, opacity: 0.3 }} />
              <Typography variant='body2' color='text.secondary'>
                {batchID ? 'Belum ada data ranking untuk filter yang dipilih.' : 'Pilih angkatan untuk melihat ranking.'}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : isMobile ? (
        // Mobile — Card List
        <>
          {rows.map(row => (
            <RankingMobileCard key={String(row.student_id)} row={row} onViewHistory={handleViewHistory} />
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
                {['No.', 'Mahasiswa', 'Sindikat', 'Total Nilai', 'Aksi'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(row => (
                <TableRow key={String(row.student_id)} hover
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
                      color={
                        Math.min((row.total_value / (row.max_value || 95)) * 100, 100) >= 100
                          ? 'success'
                          : Math.min((row.total_value / (row.max_value || 95)) * 100, 100) >= 70
                            ? 'primary' : 'warning'
                      }
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
                           rowsPerPageOptions={[10, 25, 50]}
                           labelRowsPerPage='Baris per halaman:'
                           labelDisplayedRows={({ from, to, count }) => `${from}–${to} dari ${count}`}
          />
        </Card>
      )}

      {/* Dialog Riwayat Nilai */}
      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth='md' fullWidth
              fullScreen={isMobile}>
        <DialogTitle sx={{ pb: 1 }}>
          <div className='flex items-start justify-between gap-2'>
            <div className='flex items-center gap-3'>
              <Avatar sx={{ width: 44, height: 44, fontSize: 14, bgcolor: 'primary.main' }}>
                {getInitials(historyStudent?.full_name || '')}
              </Avatar>
              <div>
                <Typography variant='h6' fontWeight={600}>{historyStudent?.full_name || '—'}</Typography>
                <Typography variant='caption' color='text.secondary'>
                  {historyStudent?.nim || '—'} · {historyStudent?.syndicate_name || '—'} · Peringkat #{historyStudent?.rank_position}
                </Typography>
              </div>
            </div>
            <IconButton onClick={() => setHistoryOpen(false)} sx={{ mt: -0.5 }}>
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
              {/* Stats bar */}
              <Grid container spacing={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                {[
                  { label: 'Total Nilai', value: historyStudent?.total_value?.toFixed(2), color: '#7367F0', bg: '#F3EDFF', icon: 'ri-medal-line' },
                  { label: 'Jumlah Entri', value: history.length, color: '#00CFE8', bg: '#E0F9FC', icon: 'ri-list-check-line' },
                  { label: 'Nilai Positif', value: `+${history.filter(h => h.value > 0).reduce((s, h) => s + h.value, 0).toFixed(2)}`, color: '#28C76F', bg: '#E6F9EE', icon: 'ri-arrow-up-circle-line' },
                  { label: 'Nilai Negatif', value: history.filter(h => h.value < 0).reduce((s, h) => s + h.value, 0).toFixed(2) || '0.00', color: '#EA5455', bg: '#FFEDED', icon: 'ri-arrow-down-circle-line' },
                ].map((s, i) => (
                  <Grid item xs={6} sm={3} key={s.label}
                        sx={{ borderRight: i < 3 ? '1px solid' : 'none', borderColor: 'divider', p: 2 }}>
                    <div className='flex items-center gap-2'>
                      <div style={{
                        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                        background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <i className={s.icon} style={{ fontSize: 18, color: s.color }} />
                      </div>
                      <div>
                        <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>{s.label}</Typography>
                        <Typography variant='body1' fontWeight={700} sx={{ color: s.color, lineHeight: 1.2 }}>{s.value}</Typography>
                      </div>
                    </div>
                  </Grid>
                ))}
              </Grid>

              {isMobile ? (
                // Mobile history — card list
                <div className='p-3 flex flex-col gap-2'>
                  {history.map(entry => (
                    <Card key={entry.id} variant='outlined'>
                      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <div className='flex items-start justify-between gap-2'>
                          <div className='flex-1'>
                            <Typography variant='body2' fontWeight={500}>{entry.indicator?.name}</Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {entry.indicator?.variable?.category?.name} · {fmtDate(entry.event_date)}
                            </Typography>
                          </div>
                          <div className='flex items-center gap-1 flex-shrink-0'>
                            <Chip
                              label={entry.value >= 0 ? `+${entry.value}` : entry.value}
                              size='small' variant='tonal'
                              color={entry.value >= 0 ? 'success' : 'error'}
                              sx={{ fontWeight: 700 }}
                            />
                            <Chip
                              label={entry.status === 'VALID' ? 'Valid' : 'Dispensasi'}
                              size='small' variant='tonal'
                              color={entry.status === 'VALID' ? 'success' : 'info'}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                // Desktop history — table redesign
                <Table size='small'>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      {['Tanggal', 'Indikator', 'Sumber', 'Nilai', 'Status'].map(h => (
                        <TableCell key={h} sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {history.map(entry => {
                      const srcMap = {
                        SPRINT: { label: 'Sprint', color: 'success' },
                        AUTOMATIC: { label: 'Nilai Jabatan', color: 'info' },
                        SELF_SUBMISSION: { label: 'Pengajuan Mandiri', color: 'warning' },
                      }
                      const src = srcMap[entry.source_type] || { label: entry.source_type, color: 'default' }
                      return (
                        <TableRow key={entry.id} hover>
                          <TableCell sx={{ minWidth: 90 }}>
                            <Typography variant='caption'>{fmtDate(entry.event_date)}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant='body2' fontWeight={500}>{entry.indicator?.name}</Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {entry.indicator?.variable?.category?.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={src.label} color={src.color} size='small' variant='tonal' />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={entry.value >= 0 ? `+${entry.value}` : entry.value}
                              size='small' variant='tonal'
                              color={entry.value >= 0 ? 'success' : 'error'}
                              sx={{ fontWeight: 700 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={entry.status === 'VALID' ? 'Valid' : 'Dispensasi'}
                              color={entry.status === 'VALID' ? 'success' : 'info'}
                              size='small' variant='tonal'
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default RankingView
