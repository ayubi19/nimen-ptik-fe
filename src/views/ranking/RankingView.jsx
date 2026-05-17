'use client'
import { useVisibilityRefetch } from '@/hooks/useVisibilityRefetch'

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

// ── Mobile Card — PWA native ─────────────────────────────────────────────────
const RankingMobileCard = ({ row, onViewHistory }) => {
  const medal = MEDAL_COLORS[row.rank_position]
  const pct = Math.min((row.total_value / (row.max_value || 95)) * 100, 100)
  const isTop3 = row.rank_position <= 3

  return (
    <Box sx={{
      background: '#fff',
      border: medal ? `1px solid rgba(180,100,100,0.15)` : '0.5px solid rgba(180,100,100,0.15)',
      borderLeft: medal ? `3px solid ${medal}` : undefined,
      borderRadius: '12px', padding: '12px', mb: '10px',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', mb: '10px' }}>
        {/* Rank badge */}
        <Box sx={{
          width: 38, height: 38, borderRadius: '10px', flexShrink: 0,
          background: isTop3
            ? (row.rank_position === 1 ? 'linear-gradient(135deg, #FFD700, #FFA500)'
              : row.rank_position === 2 ? 'linear-gradient(135deg, #C0C0C0, #A8A8A8)'
                : 'linear-gradient(135deg, #CD7F32, #A0522D)')
            : 'linear-gradient(145deg, #E63946, #6D0E13)',
          boxShadow: '0 3px 8px rgba(0,0,0,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isTop3
            ? <Typography sx={{ fontSize: '18px', lineHeight: 1 }}>{MEDAL_EMOJI[row.rank_position]}</Typography>
            : <Typography sx={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.92)' }}>{row.rank_position}</Typography>
          }
        </Box>

        {/* Info */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#3B1010', lineHeight: 1.3 }} noWrap>
            {row.full_name || '—'}
          </Typography>
          <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>
            {row.nim || '—'} · {row.syndicate_name || '—'}
          </Typography>
        </Box>

        {/* Nilai + history */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#EB3D47' }}>
            {row.total_value?.toFixed(2)}
          </Typography>
          <Box component='button' onClick={() => onViewHistory(row)} sx={{
            width: 28, height: 28, borderRadius: '8px', cursor: 'pointer',
            background: 'rgba(255,255,255,0.72)', border: '0.5px solid rgba(180,100,100,0.18)',
            boxShadow: '0 2px 6px rgba(139,0,0,0.07)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className='ri-history-line' style={{ fontSize: '14px', color: '#9A5A5A' }} />
          </Box>
        </Box>
      </Box>

      {/* Progress bar */}
      <LinearProgress variant='determinate' value={pct}
                      sx={{
                        height: 4, borderRadius: 2,
                        bgcolor: 'rgba(180,100,100,0.1)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: pct >= 100 ? '#0F6E56' : pct >= 70 ? '#EB3D47' : '#BA7517',
                          borderRadius: 2,
                        }
                      }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: '3px' }}>
        <Typography sx={{ fontSize: '10px', color: '#9A5A5A' }}>0</Typography>
        <Typography sx={{ fontSize: '10px', color: '#9A5A5A' }}>/ {row.max_value?.toFixed(0) || '—'}</Typography>
      </Box>
    </Box>
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
  // Refetch saat tab visible dengan cooldown 30 detik
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

  useEffect(() => { refetchAll() }, [pathname, refetchAll])
  useVisibilityRefetch(refetchAll)
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
      VIOLATION:       { label: 'Pelanggaran',        color: 'error'   },
    }
    const maxValue = myRanking?.max_value || 95
    const totalValue = myRanking?.total_value || 0
    const pct = Math.min((totalValue / maxValue) * 100, 100)
    const rank = myRanking?.rank_position
    const totalStudents = myRanking?.total || 0

    const bySource = myHistory.reduce((acc, e) => {
      // Nilai negatif dari AUTOMATIC = pelanggaran, tampilkan terpisah
      const key = e.source_type === 'AUTOMATIC' && e.value < 0 ? 'VIOLATION' : e.source_type
      acc[key] = (acc[key] || 0) + e.value
      return acc
    }, {})

    return (
      <>
        {/* Topbar PWA */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', mb: '14px' }}>
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
            <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>NIMEN</Typography>
            <Typography sx={{ fontSize: '16px', fontWeight: 500, color: '#3B1010' }}>Peringkat Saya</Typography>
          </Box>
        </Box>

        {myLoading ? (
          <Box className='flex justify-center py-20'><CircularProgress /></Box>
        ) : (
          <Grid container spacing={4}>

            {/* Hero Card — PWA native */}
            <Grid item xs={12}>
              <Box sx={{
                background: 'linear-gradient(135deg, #EB3D47 0%, #8B0000 100%)',
                borderRadius: '12px', p: '16px', color: '#fff',
                position: 'relative', overflow: 'hidden',
              }}>
                <Box sx={{ position: 'absolute', top: -20, right: 15, width: 90, height: 90, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {/* Rank badge */}
                  <Box sx={{
                    width: 72, height: 72, borderRadius: '16px', flexShrink: 0,
                    background: rank <= 3
                      ? (rank === 1 ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                        : rank === 2 ? 'linear-gradient(135deg, #C0C0C0, #A8A8A8)'
                          : 'linear-gradient(135deg, #CD7F32, #A0522D)')
                      : 'rgba(255,255,255,0.2)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                  }}>
                    {rank && rank <= 3
                      ? <Typography sx={{ fontSize: '36px', lineHeight: 1 }}>{rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}</Typography>
                      : <>
                        <Typography sx={{ fontSize: '9px', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Peringkat</Typography>
                        <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{rank || '—'}</Typography>
                        {totalStudents > 0 && <Typography sx={{ fontSize: '9px', color: 'rgba(255,255,255,0.75)' }}>dari {totalStudents}</Typography>}
                      </>
                    }
                  </Box>
                  {/* Info */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '6px', mb: '4px' }}>
                      <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                        {totalValue.toFixed(2)}
                      </Typography>
                      <Typography sx={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>/ {maxValue.toFixed(0)}</Typography>
                    </Box>
                    <LinearProgress variant='determinate' value={pct} sx={{
                      height: 6, borderRadius: 3, mb: '4px',
                      bgcolor: 'rgba(255,255,255,0.2)',
                      '& .MuiLinearProgress-bar': { bgcolor: '#fff', borderRadius: 3 }
                    }} />
                    <Typography sx={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)' }}>
                      {pct.toFixed(1)}% dari maksimum
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>

            {/* Rincian per Sumber — PWA native */}
            {Object.keys(bySource).length > 0 && (
              <Grid item xs={12} md={4}>
                <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
                  <Box sx={{ px: 2, py: '10px', borderBottom: '0.5px solid rgba(180,100,100,0.1)' }}>
                    <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#3B1010' }}>Rincian per Sumber</Typography>
                  </Box>
                  <Box sx={{ p: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {Object.entries(bySource).map(([src, val]) => {
                      const cfg = SOURCE_CONFIG[src] || { label: src }
                      const srcBadge = {
                        SPRINT:          { bg: '#E6F1FB', color: '#185FA5' },
                        SELF_SUBMISSION: { bg: '#EEEDFE', color: '#534AB7' },
                        AUTOMATIC:       { bg: '#E1F5EE', color: '#0F6E56' },
                        VIOLATION:       { bg: '#FCEBEB', color: '#A32D2D' },
                      }[src] || { bg: '#F1EFE8', color: '#5F5E5A' }
                      const srcPct = Math.min(Math.abs(val) / maxValue * 100, 100)
                      return (
                        <Box key={src}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '5px' }}>
                            <Box sx={{ bgcolor: srcBadge.bg, borderRadius: '6px', px: '7px', py: '3px' }}>
                              <Typography sx={{ fontSize: '10px', fontWeight: 500, color: srcBadge.color }}>{cfg.label}</Typography>
                            </Box>
                            <Typography sx={{ fontSize: '13px', fontWeight: 700, color: val >= 0 ? '#0F6E56' : '#A32D2D' }}>
                              {val >= 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}
                            </Typography>
                          </Box>
                          <LinearProgress variant='determinate' value={srcPct} sx={{
                            height: 5, borderRadius: 2,
                            bgcolor: 'rgba(180,100,100,0.1)',
                            '& .MuiLinearProgress-bar': { bgcolor: val >= 0 ? '#0F6E56' : '#A32D2D', borderRadius: 2 }
                          }} />
                        </Box>
                      )
                    })}
                  </Box>
                </Box>
              </Grid>
            )}

            {/* Riwayat Nilai — PWA native */}
            <Grid item xs={12} md={Object.keys(bySource).length > 0 ? 8 : 12}>
              <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: '10px', borderBottom: '0.5px solid rgba(180,100,100,0.1)' }}>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#3B1010' }}>Riwayat Nilai</Typography>
                  <Box sx={{ bgcolor: '#F5F2F0', borderRadius: '6px', px: '8px', py: '2px' }}>
                    <Typography sx={{ fontSize: '10px', fontWeight: 500, color: '#9A5A5A' }}>{myHistory.length} entri</Typography>
                  </Box>
                </Box>
                {myHistory.length === 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: '40px', gap: '8px' }}>
                    <i className='ri-inbox-line' style={{ fontSize: '40px', opacity: 0.3 }} />
                    <Typography sx={{ fontSize: '12px', color: '#9A5A5A' }}>Belum ada riwayat nilai.</Typography>
                  </Box>
                ) : isMobile ? (
                  <Box>
                    {myHistory.map((e, i) => {
                      const isPlus = e.value >= 0
                      const kegiatanLabel = e.source_type === 'AUTOMATIC'
                        ? 'Otomatis'
                        : e.source_type === 'SELF_SUBMISSION'
                          ? 'Pengajuan Mandiri'
                          : e.sprint_participant?.sprint?.title || '—'
                      return (
                        <Box key={e.id} sx={{
                          py: '10px', px: 2,
                          borderBottom: i < myHistory.length - 1 ? '0.5px solid rgba(180,100,100,0.08)' : 'none',
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', mb: '4px' }}>
                            <Typography sx={{ fontSize: '12px', fontWeight: 500, color: '#3B1010', flex: 1, minWidth: 0, lineHeight: 1.3 }} noWrap>
                              {e.indicator?.name}
                            </Typography>
                            <Typography sx={{ fontSize: '13px', fontWeight: 700, flexShrink: 0, color: isPlus ? '#0F6E56' : '#A32D2D' }}>
                              {isPlus ? `+${e.value}` : e.value}
                            </Typography>
                          </Box>
                          <Typography sx={{ fontSize: '10px', color: '#9A5A5A' }}>
                            {e.indicator?.variable?.category?.name} · {new Date(e.event_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} · {kegiatanLabel}
                          </Typography>
                        </Box>
                      )
                    })}
                  </Box>
                ) : (
                  <Table size='small'>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        {['Tanggal', 'Indikator', 'Kategori', 'Kegiatan', 'Nilai'].map(h => (
                          <TableCell key={h} sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {myHistory.map(e => {
                        const isPlus = e.value >= 0
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
                              <Typography variant='caption' color='text.secondary'>
                                {e.source_type === 'AUTOMATIC'
                                  ? 'Otomatis'
                                  : e.source_type === 'SELF_SUBMISSION'
                                    ? 'Pengajuan Mandiri'
                                    : e.sprint_participant?.sprint?.title || '—'}
                              </Typography>
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
              </Box>
            </Grid>
          </Grid>
        )}
      </>
    )
  }

  return (
    <>
      {/* Topbar PWA admin */}
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
            <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>NIMEN</Typography>
            <Typography sx={{ fontSize: '16px', fontWeight: 500, color: '#3B1010' }}>Peringkat</Typography>
          </Box>
        </Box>
        {/* Export buttons */}
        {isAdmin && rows.length > 0 && (
          <Box sx={{ display: 'flex', gap: '6px' }}>
            <Box component='button' onClick={handleExportPDF} disabled={!!exportLoading} sx={{
              display: 'flex', alignItems: 'center', gap: '4px', px: '10px', py: '6px',
              borderRadius: '8px', cursor: 'pointer',
              background: 'rgba(255,255,255,0.72)', border: '0.5px solid rgba(180,100,100,0.18)',
              boxShadow: '0 2px 6px rgba(139,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.9)',
            }}>
              {exportLoading === 'pdf' ? <CircularProgress size={12} sx={{ color: '#A32D2D' }} /> : <i className='ri-file-pdf-line' style={{ fontSize: '14px', color: '#A32D2D' }} />}
              <Typography sx={{ fontSize: '11px', fontWeight: 500, color: '#A32D2D' }}>PDF</Typography>
            </Box>
            <Box component='button' onClick={handleExportXLSX} disabled={!!exportLoading} sx={{
              display: 'flex', alignItems: 'center', gap: '4px', px: '10px', py: '6px',
              borderRadius: '8px', cursor: 'pointer',
              background: 'rgba(255,255,255,0.72)', border: '0.5px solid rgba(180,100,100,0.18)',
              boxShadow: '0 2px 6px rgba(139,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.9)',
            }}>
              {exportLoading === 'xlsx' ? <CircularProgress size={12} sx={{ color: '#0F6E56' }} /> : <i className='ri-file-excel-line' style={{ fontSize: '14px', color: '#0F6E56' }} />}
              <Typography sx={{ fontSize: '11px', fontWeight: 500, color: '#0F6E56' }}>Excel</Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* Filter — PWA native */}
      <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', p: '10px 12px', mb: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {isAdmin && (
          <FormControl fullWidth size='small'>
            <Select displayEmpty value={batchID}
                    onChange={e => { setBatchID(e.target.value); setSyndicateID(''); setPage(0) }}
                    renderValue={val => { const b = batches.find(x => String(x.id) === String(val)); return b ? `${b.name} (${b.year})` : 'Pilih Angkatan' }}
                    sx={{ borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0', '& .MuiOutlinedInput-notchedOutline': { border: '0.5px solid rgba(180,100,100,0.15)' }, '& .MuiSelect-select': { py: '7px', px: '10px' } }}>
              {batches.map(b => (
                <MenuItem key={b.id} value={b.id}>
                  <Box>
                    <Typography variant='body2' fontWeight={500}>{b.name}</Typography>
                    <Typography variant='caption' color='text.secondary'>Angkatan ke-{b.batch_number} · {b.year} · {b.program_type || 'S1'}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        {isAdmin && (
          <FormControl fullWidth size='small'>
            <Select displayEmpty value={syndicateID}
                    onChange={e => { setSyndicateID(e.target.value); setPage(0) }}
                    disabled={!batchID}
                    renderValue={val => syndicates.find(s => String(s.id) === String(val))?.name || 'Semua Sindikat'}
                    sx={{ borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0', '& .MuiOutlinedInput-notchedOutline': { border: '0.5px solid rgba(180,100,100,0.15)' }, '& .MuiSelect-select': { py: '7px', px: '10px' } }}>
              <MenuItem value=''>Semua Sindikat</MenuItem>
              {syndicates.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </Select>
          </FormControl>
        )}
        <DebouncedInput fullWidth value={search}
                        onChange={v => { setSearch(v); setPage(0) }}
                        placeholder='Cari nama atau NIM...'
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15)' } }, '& .MuiOutlinedInput-input': { py: '7px', px: '10px' } }}
                        InputProps={{ startAdornment: <InputAdornment position='start'><i className='ri-search-line' style={{ color: '#9A5A5A', fontSize: '14px' }} /></InputAdornment> }}
        />
      </Box>

      {/* Stats — crystal 2x2 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', mb: '10px' }}>
        {[
          { label: 'Total Mahasiswa', value: total, icon: 'ri-group-line' },
          {
            label: syndicateID
              ? (syndicates.find(s => String(s.id) === String(syndicateID))?.name || 'Sindikat')
              : `${selectedBatch?.program_type || 'S1'} · ${selectedBatch?.year || '—'}`,
            value: syndicateID ? 'Sindikat' : 'Angkatan',
            icon: syndicateID ? 'ri-shield-star-line' : 'ri-building-line',
          },
        ].map(s => (
          <Box key={s.label} sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
              background: 'linear-gradient(145deg, #E63946, #6D0E13)',
              boxShadow: '0 4px 10px rgba(180,0,30,0.25), inset 0 1px 0 rgba(255,180,180,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', overflow: 'hidden',
              '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '45%', borderRadius: '12px 12px 0 0', background: 'linear-gradient(180deg, rgba(255,200,200,0.32) 0%, transparent 100%)' }
            }}>
              <i className={s.icon} style={{ fontSize: '20px', color: 'rgba(255,255,255,0.92)', position: 'relative', zIndex: 1 }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: '20px', fontWeight: 500, color: '#3B1010', lineHeight: 1 }} noWrap>{s.value}</Typography>
              <Typography sx={{ fontSize: '10px', color: '#9A5A5A', mt: '2px', lineHeight: 1.3 }} noWrap>{s.label}</Typography>
            </Box>
          </Box>
        ))}
      </Box>

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
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Avatar sx={{
                width: 40, height: 40, fontSize: 12, borderRadius: '12px !important',
                background: 'linear-gradient(145deg, #E63946, #6D0E13)',
                boxShadow: '0 3px 8px rgba(180,0,30,0.22)',
              }}>
                {getInitials(historyStudent?.full_name || '')}
              </Avatar>
              <Box>
                <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#3B1010', lineHeight: 1.3 }}>
                  {historyStudent?.full_name || '—'}
                </Typography>
                <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>
                  {historyStudent?.nim || '—'} · #{historyStudent?.rank_position}
                </Typography>
              </Box>
            </Box>
            <Box component='button' onClick={() => setHistoryOpen(false)} sx={{
              width: 30, height: 30, borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: '#F5F2F0', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className='ri-close-line' style={{ fontSize: '16px', color: '#9A5A5A' }} />
            </Box>
          </Box>
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
              {/* Stats bar — crystal */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', p: '14px', borderBottom: '0.5px solid rgba(180,100,100,0.1)' }}>
                {[
                  { label: 'Total Nilai',   value: historyStudent?.total_value?.toFixed(2), icon: 'ri-medal-line' },
                  { label: 'Jumlah Entri',  value: history.length, icon: 'ri-file-list-3-line' },
                  { label: 'Nilai Positif', value: `+${history.filter(h => h.value > 0).reduce((s, h) => s + h.value, 0).toFixed(2)}`, icon: 'ri-arrow-up-circle-line' },
                  { label: 'Nilai Negatif', value: history.filter(h => h.value < 0).reduce((s, h) => s + h.value, 0).toFixed(2) || '0.00', icon: 'ri-arrow-down-circle-line' },
                ].map(s => (
                  <Box key={s.label} sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Box sx={{
                      width: 40, height: 40, borderRadius: '10px', flexShrink: 0,
                      background: 'linear-gradient(145deg, #E63946, #6D0E13)',
                      boxShadow: '0 3px 8px rgba(180,0,30,0.2), inset 0 1px 0 rgba(255,180,180,0.4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative', overflow: 'hidden',
                      '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(180deg, rgba(255,200,200,0.25) 0%, transparent 100%)' }
                    }}>
                      <i className={s.icon} style={{ fontSize: '18px', color: 'rgba(255,255,255,0.92)', position: 'relative', zIndex: 1 }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '10px', color: '#9A5A5A' }}>{s.label}</Typography>
                      <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#3B1010', lineHeight: 1.2 }}>{s.value}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>

              {isMobile ? (
                // Mobile history — PWA native list
                <Box sx={{ px: '14px', py: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {history.map(entry => {
                    const isPlus = entry.value >= 0
                    const srcBadge = {
                      SPRINT:          { bg: '#E6F1FB', color: '#185FA5' },
                      SELF_SUBMISSION: { bg: '#EEEDFE', color: '#534AB7' },
                      AUTOMATIC:       { bg: '#E1F5EE', color: '#0F6E56' },
                    }[entry.source_type] || { bg: '#F1EFE8', color: '#5F5E5A' }
                    const srcLabel = { SPRINT: 'Sprint', SELF_SUBMISSION: 'Pengajuan', AUTOMATIC: 'Otomatis' }[entry.source_type] || entry.source_type
                    return (
                      <Box key={entry.id} sx={{
                        background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)',
                        borderRadius: '10px', padding: '10px 12px',
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', mb: '5px' }}>
                          <Typography sx={{ fontSize: '12px', fontWeight: 500, color: '#3B1010', flex: 1, lineHeight: 1.3 }} noWrap>
                            {entry.indicator?.name}
                          </Typography>
                          <Typography sx={{ fontSize: '13px', fontWeight: 700, flexShrink: 0, color: isPlus ? '#0F6E56' : '#A32D2D' }}>
                            {isPlus ? `+${entry.value}` : entry.value}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <Typography sx={{ fontSize: '10px', color: '#9A5A5A' }}>{fmtDate(entry.event_date)}</Typography>
                          <Box sx={{ bgcolor: srcBadge.bg, borderRadius: '5px', px: '6px', py: '2px' }}>
                            <Typography sx={{ fontSize: '9px', fontWeight: 500, color: srcBadge.color }}>{srcLabel}</Typography>
                          </Box>
                          <Box sx={{ bgcolor: entry.status === 'VALID' ? '#E1F5EE' : '#E6F1FB', borderRadius: '5px', px: '6px', py: '2px' }}>
                            <Typography sx={{ fontSize: '9px', fontWeight: 500, color: entry.status === 'VALID' ? '#0F6E56' : '#185FA5' }}>
                              {entry.status === 'VALID' ? 'Valid' : 'Dispensasi'}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    )
                  })}
                </Box>
              ) : (
                // Desktop history — table redesign
                <Table size='small'>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      {['Tanggal', 'Indikator', 'Kegiatan', 'Nilai', 'Status'].map(h => (
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
                            <Typography variant='caption' color='text.secondary'>
                              {entry.source_type === 'AUTOMATIC'
                                ? 'Otomatis'
                                : entry.source_type === 'SELF_SUBMISSION'
                                  ? 'Pengajuan Mandiri'
                                  : entry.sprint_participant?.sprint?.title || '—'}
                            </Typography>
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
