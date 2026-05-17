'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Collapse from '@mui/material/Collapse'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Pagination from '@mui/material/Pagination'
import Select from '@mui/material/Select'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { batchApi } from '@/libs/api/masterDataApi'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import 'dayjs/locale/id'
import { studentsApi } from '@/libs/api/studentsApi'
import { nimenRankingApi } from '@/libs/api/nimenRankingApi'
import { exportRekapPDF, exportRekapXLSX } from '@/utils/exportUtils'
import { getInitials } from '@/utils/getInitials'

const SOURCE_CONFIG = {
  SPRINT:          { label: 'Sprint',            bg: '#E6F9EE', text: '#1B7A47', icon: 'ri-run-line' },
  AUTOMATIC:       { label: 'Nilai Jabatan',     bg: '#E0F9FC', text: '#0891B2', icon: 'ri-user-star-line' },
  SELF_SUBMISSION: { label: 'Pengajuan Mandiri', bg: '#FFF3E8', text: '#B36B00', icon: 'ri-file-add-line' },
}

const MAX_VISIBLE = 10

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—'

const fmtVal = (v) => v >= 0 ? `+${v}` : `${v}`

// ── Section per Indikator ─────────────────────────────────────────────────────
const IndicatorSection = ({ indicatorName, categoryName, indicatorValue, entries, isMobile, showStudent = true }) => {
  const [expanded, setExpanded] = useState(false)

  const sourceType = entries[0]?.source_type
  const cfg = SOURCE_CONFIG[sourceType] || { label: sourceType, bg: '#F4F4F4', text: '#5F5E5A', icon: 'ri-file-list-line' }
  const isPlus = indicatorValue >= 0

  const visibleEntries = expanded ? entries : entries.slice(0, MAX_VISIBLE)
  const hasMore = entries.length > MAX_VISIBLE

  return (
    <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', overflow: 'hidden', mb: '10px' }}>
      {/* Header */}
      <Box sx={{ px: 2, py: '10px', borderBottom: '0.5px solid rgba(180,100,100,0.1)', bgcolor: isPlus ? 'rgba(15,110,86,0.04)' : 'rgba(163,45,45,0.04)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1, minWidth: 0 }}>
          <i className={cfg.icon} style={{ fontSize: '16px', color: cfg.text, marginTop: 2, flexShrink: 0 }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#3B1010', lineHeight: 1.3 }} noWrap>
              {indicatorName}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '5px', mt: '3px', flexWrap: 'wrap' }}>
              <Typography sx={{ fontSize: '10px', color: '#9A5A5A' }}>{categoryName}</Typography>
              <Box sx={{ bgcolor: cfg.bg, borderRadius: '5px', px: '5px', py: '1px' }}>
                <Typography sx={{ fontSize: '9px', fontWeight: 600, color: cfg.text }}>{cfg.label}</Typography>
              </Box>
              <Typography sx={{ fontSize: '10px', color: '#9A5A5A' }}>{entries.length} peserta</Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ bgcolor: isPlus ? '#E1F5EE' : '#FCEBEB', borderRadius: '6px', px: '8px', py: '3px', flexShrink: 0 }}>
          <Typography sx={{ fontSize: '11px', fontWeight: 700, color: isPlus ? '#0F6E56' : '#A32D2D' }}>
            {fmtVal(indicatorValue)}
          </Typography>
        </Box>
      </Box>

      {/* Daftar peserta */}
      {isMobile ? (
        <>
          <Box>
            {visibleEntries.map((e, i) => (
              <Box key={e.id} sx={{
                display: 'flex', alignItems: 'center', gap: '10px', px: 2, py: '10px',
                borderBottom: i < visibleEntries.length - 1 ? '0.5px solid rgba(180,100,100,0.08)' : 'none',
              }}>
                {showStudent && (
                  <Box sx={{ width: 32, height: 32, borderRadius: '9px', flexShrink: 0, background: 'linear-gradient(145deg, #E63946, #6D0E13)', boxShadow: '0 2px 6px rgba(180,0,30,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 500, color: 'rgba(255,255,255,0.92)' }}>
                    {getInitials(e.student?.full_name || '')}
                  </Box>
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {showStudent ? (
                    <>
                      <Typography sx={{ fontSize: '12px', fontWeight: 500, color: '#3B1010', lineHeight: 1.3 }} noWrap>
                        {e.student?.full_name || '—'}
                      </Typography>
                      <Typography sx={{ fontSize: '10px', color: '#9A5A5A' }}>
                        {e.student?.student_profile?.nim || '—'} · {fmtDate(e.event_date)}
                      </Typography>
                    </>
                  ) : (
                    <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>{fmtDate(e.event_date)}</Typography>
                  )}
                </Box>
                {e.status === 'DISPENSED' && (
                  <Box sx={{ bgcolor: '#E6F1FB', borderRadius: '5px', px: '6px', py: '2px', flexShrink: 0 }}>
                    <Typography sx={{ fontSize: '9px', fontWeight: 500, color: '#185FA5' }}>Dispensasi</Typography>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
          {hasMore && (
            <Box sx={{ px: 2, pb: '10px' }}>
              <Box component='button' onClick={() => setExpanded(v => !v)} sx={{
                width: '100%', py: '7px', borderRadius: '8px', cursor: 'pointer',
                background: 'rgba(255,255,255,0.72)', border: '0.5px solid rgba(180,100,100,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
              }}>
                <i className={expanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} style={{ fontSize: '14px', color: '#9A5A5A' }} />
                <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>
                  {expanded ? 'Sembunyikan' : `Lihat ${entries.length - MAX_VISIBLE} peserta lainnya`}
                </Typography>
              </Box>
            </Box>
          )}
        </>
      ) : (
        <>
          <Table size='small'>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                {['#', 'Mahasiswa', 'NIM', 'Sindikat', 'Tanggal', 'Status'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleEntries.map((e, idx) => (
                <TableRow key={e.id} hover>
                  <TableCell width={40}>
                    <Typography variant='caption' color='text.secondary'>{idx + 1}</Typography>
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <Avatar sx={{ width: 28, height: 28, fontSize: 10 }}>
                        {getInitials(e.student?.full_name || '')}
                      </Avatar>
                      <Typography variant='body2' fontWeight={500}>
                        {e.student?.full_name || '—'}
                      </Typography>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Typography variant='caption' color='text.secondary'>
                      {e.student?.student_profile?.nim || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant='caption' color='text.secondary'>
                      {e.student?.student_profile?.syndicate?.name || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant='caption'>{fmtDate(e.event_date)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={e.status === 'DISPENSED' ? 'Dispensasi' : 'Valid'}
                      size='small'
                      color={e.status === 'DISPENSED' ? 'info' : 'success'}
                      variant='tonal'
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {hasMore && (
            <Box className='px-4 py-2 flex justify-center'>
              <Button variant='tonal' color='secondary' size='small'
                      onClick={() => setExpanded(v => !v)}
                      startIcon={<i className={expanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} />}>
                {expanded ? 'Sembunyikan' : `Lihat ${entries.length - MAX_VISIBLE} peserta lainnya`}
              </Button>
            </Box>
          )}
        </>
      )}
    </Box>
  )
}

const PAGE_SIZE = 10

// ── Main View ─────────────────────────────────────────────────────────────────
const NimenRekapView = () => {
  const { data: session } = useSession()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const roles = session?.user?.roles || []
  const jwtPayload = session?.user?.accessToken
    ? (() => { try { return JSON.parse(atob(session.user.accessToken.split('.')[1])) } catch { return {} } })()
    : {}
  const isDeveloper = jwtPayload?.is_developer === true
  const isAdmin = isDeveloper || roles.some(r => (typeof r === 'string' ? r : r.name) === 'admin_nimen')
  const studentId = session?.user?.id

  const [batches, setBatches]           = useState([])
  const [batchID, setBatchID]           = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [selectedStudents, setSelectedStudents] = useState([])
  const [dateFrom, setDateFrom]         = useState(null)
  const [dateTo, setDateTo]             = useState(null)
  const [students, setStudents]         = useState([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [entries, setEntries]           = useState([])
  const [loading, setLoading]           = useState(false)
  const [hasLoaded, setHasLoaded]       = useState(false)
  const [infoMsg, setInfoMsg]           = useState('')
  const [page, setPage]                 = useState(1)

  const [myEntries, setMyEntries]       = useState([])
  const [myLoading, setMyLoading]       = useState(false)
  const [myPage, setMyPage]             = useState(1)
  const [exportLoading, setExportLoading] = useState('')

  useEffect(() => {
    if (isAdmin) {
      batchApi.getAll({ page: 1, page_size: 100 })
        .then(r => setBatches(r.data.data?.data || []))
    } else if (studentId) {
      setMyLoading(true)
      nimenRankingApi.getValueHistory(studentId)
        .then(r => setMyEntries(r.data.data || []))
        .finally(() => setMyLoading(false))
    }
  }, [isAdmin, studentId])

  useEffect(() => {
    if (!batchID) { setStudents([]); return }
    setStudentsLoading(true)
    setSelectedStudents([]);

    // Fetch semua mahasiswa dengan pagination loop (BE max 100 per page)
    (async () => {
      try {
        let all = []
        let currentPage = 1
        while (true) {
          const res = await studentsApi.getAll({
            batch_id: parseInt(batchID),
            page: currentPage,
            page_size: 100,
          })
          const items = res.data.data?.data || []
          all = [...all, ...items]
          const pagination = res.data.data?.pagination
          if (!pagination || currentPage >= pagination.total_pages) break
          currentPage++
        }
        setStudents(all)
      } catch {}
      finally { setStudentsLoading(false) }
    })()
  }, [batchID])

  const handleTampilkan = useCallback(async () => {
    if (!batchID) return
    setLoading(true)
    setHasLoaded(false)
    setPage(1)
    try {
      const params = {}
      if (sourceFilter) params.source_type = sourceFilter
      if (selectedStudents.length === 1) params.student_id = selectedStudents[0].id
      if (dateFrom) params.date_from = dayjs(dateFrom).format('YYYY-MM-DD')
      if (dateTo) params.date_to = dayjs(dateTo).format('YYYY-MM-DD')

      const res = await nimenRankingApi.getBatchEntries(batchID, params)
      let data = res.data.data || []

      if (selectedStudents.length > 1) {
        const ids = new Set(selectedStudents.map(s => s.id))
        data = data.filter(e => ids.has(e.student_id))
      }

      setEntries(data)
      setHasLoaded(true)

      const batch = batches.find(b => b.id === parseInt(batchID))
      if (selectedStudents.length > 0) {
        setInfoMsg(`Rekap nilai ${selectedStudents.length} mahasiswa terpilih — angkatan ${batch?.name || ''}`)
      } else {
        setInfoMsg(`Rekap nilai seluruh mahasiswa — angkatan ${batch?.name || ''}`)
      }
    } catch {
      setInfoMsg('')
    } finally {
      setLoading(false)
    }
  }, [batchID, sourceFilter, selectedStudents, dateFrom, dateTo, batches])

  // Group per indikator — nilai diambil dari indikator bukan dijumlah
  const grouped = useMemo(() => {
    const g = {}
    entries.forEach(e => {
      const key = e.indicator_id || 'unknown'
      if (!g[key]) g[key] = {
        indicatorName:  e.indicator?.name || '—',
        categoryName:   e.indicator?.variable?.category?.name || '—',
        indicatorValue: e.indicator?.value ?? e.value, // nilai dari indikator
        entries: [],
      }
      g[key].entries.push(e)
    })
    return Object.values(g).sort((a, b) => b.indicatorValue - a.indicatorValue)
  }, [entries])

  // Pagination untuk grouped sections
  const totalPages = Math.ceil(grouped.length / PAGE_SIZE)
  const pagedGrouped = grouped.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // ── useMemo mahasiswa (harus di luar conditional) ──────────────────────────
  const myGrouped = useMemo(() => {
    const g = {}
    myEntries.forEach(e => {
      const key = e.indicator_id || 'unknown'
      if (!g[key]) g[key] = {
        indicatorName:  e.indicator?.name || '—',
        categoryName:   e.indicator?.variable?.category?.name || '—',
        indicatorValue: e.indicator?.value ?? e.value,
        entries: [],
      }
      g[key].entries.push(e)
    })
    return Object.values(g).sort((a, b) => b.indicatorValue - a.indicatorValue)
  }, [myEntries])

  const totalMyPages = Math.ceil(myGrouped.length / PAGE_SIZE)
  const pagedMyGrouped = myGrouped.slice((myPage - 1) * PAGE_SIZE, myPage * PAGE_SIZE)

  // ── Export handlers — harus di atas conditional return ─────────────────────
  const handleExportPDF = useCallback(async () => {
    if (!entries.length || exportLoading) return
    setExportLoading('pdf')
    try {
      const batch = batches.find(b => b.id === parseInt(batchID))
      const filterInfo = {
        batchName: batch?.name || '',
        source:    sourceFilter,
        students:  selectedStudents,
        dateFrom:  dateFrom ? dateFrom.format('YYYY-MM-DD') : '',
        dateTo:    dateTo   ? dateTo.format('YYYY-MM-DD')   : '',
      }
      await exportRekapPDF(entries, grouped, filterInfo)
    } catch (e) { console.error(e) }
    finally { setExportLoading('') }
  }, [entries, grouped, batches, batchID, sourceFilter, selectedStudents, dateFrom, dateTo, exportLoading])

  const handleExportXLSX = useCallback(async () => {
    if (!entries.length || exportLoading) return
    setExportLoading('xlsx')
    try {
      const batch = batches.find(b => b.id === parseInt(batchID))
      const filterInfo = {
        batchName: batch?.name || '',
        source:    sourceFilter,
        students:  selectedStudents,
        dateFrom:  dateFrom ? dateFrom.format('YYYY-MM-DD') : '',
        dateTo:    dateTo   ? dateTo.format('YYYY-MM-DD')   : '',
      }
      await exportRekapXLSX(entries, grouped, filterInfo)
    } catch (e) { console.error(e) }
    finally { setExportLoading('') }
  }, [entries, grouped, batches, batchID, sourceFilter, selectedStudents, dateFrom, dateTo, exportLoading])

  // ── MAHASISWA VIEW ──────────────────────────────────────────────────────────
  if (!isAdmin) {

    return (
      <>
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
            <Typography sx={{ fontSize: '16px', fontWeight: 500, color: '#3B1010' }}>Rekap Nilai Saya</Typography>
          </Box>
        </Box>

        {myLoading ? (
          <div className='flex justify-center py-10'><CircularProgress /></div>
        ) : myEntries.length === 0 ? (
          <Card>
            <CardContent className='text-center py-16'>
              <i className='ri-inbox-line text-6xl opacity-20 block mb-3' />
              <Typography variant='body1' color='text.secondary'>
                Belum ada nilai yang tercatat untuk akun Anda.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', mb: '10px' }}>
              {[
                { label: 'Total Kegiatan', value: myGrouped.length, icon: 'ri-todo-line' },
                { label: 'Total Entri',    value: myEntries.length, icon: 'ri-medal-line' },
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

            {pagedMyGrouped.map((g, idx) => (
              <IndicatorSection key={idx} {...g} isMobile={isMobile} showStudent={false} />
            ))}

            {totalMyPages > 1 && (
              <div className='flex justify-center mt-4'>
                <Pagination count={totalMyPages} page={myPage}
                            onChange={(_, p) => { setMyPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                            color='primary' shape='rounded' />
              </div>
            )}
          </>
        )}
      </>
    )
  }

  // ── ADMIN VIEW ──────────────────────────────────────────────────────────────
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale='id'>
      <>
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
            <Typography sx={{ fontSize: '16px', fontWeight: 500, color: '#3B1010' }}>Rekap Nilai</Typography>
          </Box>
        </Box>
        {/* Export buttons — hanya tampil setelah ada data */}
        {hasLoaded && entries.length > 0 && (
          <Box sx={{ display: 'flex', gap: '6px', mb: '10px', justifyContent: 'flex-end' }}>
            <Box component='button' onClick={handleExportPDF} disabled={!!exportLoading} sx={{
              display: 'flex', alignItems: 'center', gap: '5px', px: '10px', py: '6px',
              borderRadius: '8px', cursor: 'pointer', border: '0.5px solid rgba(163,45,45,0.25)',
              background: '#FFF0F0', opacity: exportLoading ? 0.6 : 1,
            }}>
              {exportLoading === 'pdf'
                ? <CircularProgress size={12} sx={{ color: '#A32D2D' }} />
                : <i className='ri-file-pdf-line' style={{ fontSize: '14px', color: '#A32D2D' }} />}
              <Typography sx={{ fontSize: '11px', fontWeight: 500, color: '#A32D2D' }}>PDF</Typography>
            </Box>
            <Box component='button' onClick={handleExportXLSX} disabled={!!exportLoading} sx={{
              display: 'flex', alignItems: 'center', gap: '5px', px: '10px', py: '6px',
              borderRadius: '8px', cursor: 'pointer', border: '0.5px solid rgba(15,110,86,0.25)',
              background: '#F0FBF6', opacity: exportLoading ? 0.6 : 1,
            }}>
              {exportLoading === 'xlsx'
                ? <CircularProgress size={12} sx={{ color: '#0F6E56' }} />
                : <i className='ri-file-excel-line' style={{ fontSize: '14px', color: '#0F6E56' }} />}
              <Typography sx={{ fontSize: '11px', fontWeight: 500, color: '#0F6E56' }}>Excel</Typography>
            </Box>
          </Box>
        )}

        {/* Filter Card — PWA native */}
        <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', p: '12px', mb: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#9A5A5A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Filter Rekap Nilai
          </Typography>
          {/* Angkatan */}
          <FormControl fullWidth size='small' error={false}>
            <Select displayEmpty value={batchID}
                    onChange={e => { setBatchID(e.target.value); setHasLoaded(false) }}
                    renderValue={val => { const b = batches.find(x => x.id === parseInt(val)); return b ? `${b.name} (${b.year})` : 'Pilih Angkatan' }}
                    sx={{ borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0',
                      '& .MuiOutlinedInput-notchedOutline': { border: '0.5px solid rgba(180,100,100,0.15) !important' },
                      '& .MuiSelect-select': { py: '7px', px: '10px' } }}>
              {batches.map(b => (
                <MenuItem key={b.id} value={b.id}>
                  <Box><Typography variant='body2' fontWeight={500}>{b.name}</Typography><Typography variant='caption' color='text.secondary'>Angkatan ke-{b.batch_number} · {b.year}</Typography></Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {/* Sumber + Mahasiswa */}
          <Box sx={{ display: 'flex', gap: '8px' }}>
            <FormControl size='small' sx={{ flex: 1 }}>
              <Select displayEmpty value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
                      renderValue={val => ({ SPRINT: 'Sprint', AUTOMATIC: 'Nilai Jabatan', SELF_SUBMISSION: 'Pengajuan' }[val] || 'Semua Sumber')}
                      sx={{ borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0', '& .MuiOutlinedInput-notchedOutline': { border: '0.5px solid rgba(180,100,100,0.15) !important' }, '& .MuiSelect-select': { py: '7px', px: '10px' } }}>
                <MenuItem value=''>Semua Sumber</MenuItem>
                <MenuItem value='SPRINT'>Sprint</MenuItem>
                <MenuItem value='AUTOMATIC'>Nilai Jabatan</MenuItem>
                <MenuItem value='SELF_SUBMISSION'>Pengajuan Mandiri</MenuItem>
              </Select>
            </FormControl>
          </Box>
          {/* Autocomplete mahasiswa */}
          <Autocomplete multiple size='small' options={students} loading={studentsLoading}
                        getOptionLabel={s => s.full_name || ''} isOptionEqualToValue={(opt, val) => opt.id === val.id}
                        value={selectedStudents} onChange={(_, val) => setSelectedStudents(val)} disabled={!batchID}
                        renderOption={(props, option) => (
                          <li {...props} key={option.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 28, height: 28, fontSize: 10 }}>{getInitials(option.full_name || '')}</Avatar>
                              <Box>
                                <Typography variant='body2' fontWeight={500}>{option.full_name}</Typography>
                                <Typography variant='caption' color='text.secondary'>{option.student_profile?.nim || '—'}</Typography>
                              </Box>
                            </Box>
                          </li>
                        )}
                        renderTags={(value, getTagProps) => value.map((option, index) => {
                          const tagProps = getTagProps({ index })
                          return <Chip {...tagProps} key={option.id} label={option.full_name} size='small' color='primary' variant='tonal' />
                        })}
                        renderInput={params => (
                          <TextField {...params} placeholder={batchID ? 'Cari mahasiswa...' : 'Pilih angkatan dulu'}
                                     sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15)' } } }}
                                     InputProps={{ ...params.InputProps, endAdornment: <>{studentsLoading ? <CircularProgress size={14} /> : null}{params.InputProps.endAdornment}</> }}
                          />
                        )}
          />
          {/* Tanggal */}
          <Box sx={{ display: 'flex', gap: '8px' }}>
            <DatePicker
              value={dateFrom}
              onChange={val => setDateFrom(val)}
              format='DD/MM/YYYY'
              slotProps={{ textField: {
                  size: 'small', placeholder: 'Dari Tanggal', fullWidth: true,
                  sx: { flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15) !important' } }, '& input': { py: '7px', px: '10px', fontSize: '12px' } }
                }}}
            />
            <DatePicker
              value={dateTo}
              onChange={val => setDateTo(val)}
              format='DD/MM/YYYY'
              minDate={dateFrom || undefined}
              slotProps={{ textField: {
                  size: 'small', placeholder: 'Sampai Tanggal', fullWidth: true,
                  sx: { flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15) !important' } }, '& input': { py: '7px', px: '10px', fontSize: '12px' } }
                }}}
            />
          </Box>
          {/* Tombol Tampilkan */}
          <Box component='button' onClick={handleTampilkan} disabled={loading || !batchID} sx={{
            width: '100%', py: '10px', borderRadius: '10px', border: 'none',
            cursor: (!batchID || loading) ? 'not-allowed' : 'pointer',
            background: (!batchID || loading) ? 'rgba(180,100,100,0.2)' : 'linear-gradient(145deg, #E63946, #6D0E13)',
            boxShadow: (!batchID || loading) ? 'none' : '0 4px 10px rgba(180,0,30,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}>
            {loading ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <i className='ri-search-line' style={{ fontSize: '14px', color: '#fff' }} />}
            <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{loading ? 'Memuat...' : 'Tampilkan'}</Typography>
          </Box>
        </Box>

        {/* Empty state awal */}
        {!hasLoaded && !loading && (
          <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', py: '40px', px: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <i className='ri-bar-chart-grouped-line' style={{ fontSize: 40, opacity: 0.25 }} />
              <Typography sx={{ fontSize: '12px', color: '#9A5A5A', textAlign: 'center' }}>
                Pilih angkatan dan klik <strong>Tampilkan</strong> untuk melihat rekap nilai.
              </Typography>
            </Box>
          </Box>
        )}

        {/* Info + Stats */}
        {hasLoaded && (
          <>
            {infoMsg && (
              <Alert severity='info' icon={<i className='ri-information-line' />} className='mb-4'>
                {infoMsg}
              </Alert>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', mb: '10px' }}>
              {[
                { label: 'Mahasiswa',      value: new Set(entries.map(e => e.student_id)).size, icon: 'ri-group-line' },
                { label: 'Jenis Kegiatan', value: grouped.length,                               icon: 'ri-stack-line' },
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
          </>
        )}

        {/* Empty result */}
        {hasLoaded && entries.length === 0 && (
          <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', py: '40px', px: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <i className='ri-inbox-line' style={{ fontSize: 40, opacity: 0.25 }} />
              <Typography sx={{ fontSize: '12px', color: '#9A5A5A', textAlign: 'center' }}>
                Tidak ada entri nilai yang ditemukan untuk filter yang dipilih.
              </Typography>
            </Box>
          </Box>
        )}

        {/* Grouped per indikator dengan pagination */}
        {hasLoaded && pagedGrouped.map((g, idx) => (
          <IndicatorSection key={idx} {...g} isMobile={isMobile} />
        ))}

        {hasLoaded && totalPages > 1 && (
          <div className='flex justify-center mt-4 mb-6'>
            <Pagination count={totalPages} page={page}
                        onChange={(_, p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                        color='primary' shape='rounded' />
          </div>
        )}
      </>
    </LocalizationProvider>
  )
}

export default NimenRekapView
