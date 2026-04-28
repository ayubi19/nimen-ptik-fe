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
import { studentsApi } from '@/libs/api/studentsApi'
import { nimenRankingApi } from '@/libs/api/nimenRankingApi'
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
const IndicatorSection = ({ indicatorName, categoryName, indicatorValue, entries, isMobile }) => {
  const [expanded, setExpanded] = useState(false)

  const sourceType = entries[0]?.source_type
  const cfg = SOURCE_CONFIG[sourceType] || { label: sourceType, bg: '#F4F4F4', text: '#5F5E5A', icon: 'ri-file-list-line' }
  const isPlus = indicatorValue >= 0

  const visibleEntries = expanded ? entries : entries.slice(0, MAX_VISIBLE)
  const hasMore = entries.length > MAX_VISIBLE

  return (
    <Card className='mb-4' sx={{ overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ px: 3, py: 1.5, bgcolor: isPlus ? '#E6F9EE' : '#FFE9EA' }}>
        <div className='flex items-start justify-between gap-3'>
          <div className='flex items-start gap-2 flex-1'>
            <i className={cfg.icon} style={{ fontSize: 18, color: cfg.text, marginTop: 2, flexShrink: 0 }} />
            <div>
              <Typography variant='body2' fontWeight={700} color='text.primary'>
                {indicatorName}
              </Typography>
              <div className='flex items-center gap-2 mt-0.5 flex-wrap'>
                <Typography variant='caption' color='text.secondary'>{categoryName}</Typography>
                <Chip label={cfg.label} size='small'
                      sx={{ bgcolor: cfg.bg, color: cfg.text, fontWeight: 600, fontSize: 10, height: 18 }} />
                <Typography variant='caption' color='text.secondary'>
                  {entries.length} peserta
                </Typography>
              </div>
            </div>
          </div>
          {/* Nilai per indikator — bukan dijumlah, langsung dari indikator */}
          <Chip
            label={fmtVal(indicatorValue)}
            size='small'
            color={isPlus ? 'success' : 'error'}
            variant='tonal'
            sx={{ fontWeight: 700, flexShrink: 0 }}
          />
        </div>
      </Box>

      {/* Daftar peserta */}
      {isMobile ? (
        <>
          <div className='px-3 py-3 flex flex-col gap-2'>
            {visibleEntries.map(e => (
              <Box key={e.id} className='flex items-center justify-between gap-2 p-2 rounded-lg'
                   sx={{ bgcolor: 'action.hover' }}>
                <div className='flex items-center gap-2 flex-1 min-w-0'>
                  <Avatar sx={{ width: 28, height: 28, fontSize: 10, flexShrink: 0 }}>
                    {getInitials(e.student?.full_name || '')}
                  </Avatar>
                  <div className='min-w-0'>
                    <Typography variant='body2' fontWeight={500} noWrap>
                      {e.student?.full_name || '—'}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {e.student?.student_profile?.nim || '—'} · {fmtDate(e.event_date)}
                    </Typography>
                  </div>
                </div>
                {e.status === 'DISPENSED' && (
                  <Chip label='Dispensasi' size='small' color='info' variant='tonal' sx={{ fontSize: 10, flexShrink: 0 }} />
                )}
              </Box>
            ))}
          </div>
          {hasMore && (
            <Box className='px-3 pb-3'>
              <Button fullWidth variant='tonal' color='secondary' size='small'
                      onClick={() => setExpanded(v => !v)}
                      startIcon={<i className={expanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} />}>
                {expanded ? 'Sembunyikan' : `Lihat ${entries.length - MAX_VISIBLE} peserta lainnya`}
              </Button>
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
    </Card>
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
  const [dateFrom, setDateFrom]         = useState('')
  const [dateTo, setDateTo]             = useState('')
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
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo

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

  // ── MAHASISWA VIEW ──────────────────────────────────────────────────────────
  if (!isAdmin) {

    return (
      <>
        <div className='flex items-center gap-2 mb-6'>
          <Typography variant='caption' color='text.secondary'>NIMEN</Typography>
          <i className='ri-arrow-right-s-line text-sm opacity-50' />
          <Typography variant='caption' fontWeight={500} color='text.primary'>Rekap Nilai Saya</Typography>
        </div>

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
            <Grid container spacing={4} className='mb-6'>
              {[
                { label: 'Total Kegiatan', value: myGrouped.length, icon: 'ri-list-check-line', color: '#FF4C51', bg: '#FFE9EA' },
                { label: 'Total Entri',    value: myEntries.length, icon: 'ri-medal-line',      color: '#28C76F', bg: '#E6F9EE' },
              ].map(s => (
                <Grid item xs={6} key={s.label}>
                  <Card>
                    <CardContent className='flex items-center gap-3' sx={{ p: '12px !important' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 8, flexShrink: 0, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className={s.icon} style={{ fontSize: 22, color: s.color }} />
                      </div>
                      <div>
                        <Typography variant='h5' fontWeight={600} lineHeight={1.2}>{s.value}</Typography>
                        <Typography variant='body2' color='text.secondary' sx={{ fontSize: { xs: 11, sm: 13 } }}>{s.label}</Typography>
                      </div>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {pagedMyGrouped.map((g, idx) => (
              <IndicatorSection key={idx} {...g} isMobile={isMobile} />
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
    <>
      <div className='flex items-center gap-2 mb-6'>
        <Typography variant='caption' color='text.secondary'>NIMEN</Typography>
        <i className='ri-arrow-right-s-line text-sm opacity-50' />
        <Typography variant='caption' fontWeight={500} color='text.primary'>Rekap Nilai</Typography>
      </div>

      {/* Filter Card */}
      <Card className='mb-6'>
        <CardContent>
          <Typography variant='subtitle1' fontWeight={600} className='mb-4'>Filter Rekap Nilai</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size='small'>
                <InputLabel>Angkatan</InputLabel>
                <Select
                  label='Angkatan'
                  value={batchID}
                  onChange={e => { setBatchID(e.target.value); setHasLoaded(false) }}
                  renderValue={val => {
                    const b = batches.find(x => x.id === parseInt(val))
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
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth size='small'>
                <InputLabel>Sumber Nilai</InputLabel>
                <Select label='Sumber Nilai' value={sourceFilter}
                        onChange={e => setSourceFilter(e.target.value)}>
                  <MenuItem value=''>Semua Sumber</MenuItem>
                  <MenuItem value='SPRINT'>Sprint</MenuItem>
                  <MenuItem value='AUTOMATIC'>Nilai Jabatan</MenuItem>
                  <MenuItem value='SELF_SUBMISSION'>Pengajuan Mandiri</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                multiple
                size='small'
                options={students}
                loading={studentsLoading}
                getOptionLabel={s => s.full_name || ''}
                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                value={selectedStudents}
                onChange={(_, val) => setSelectedStudents(val)}
                disabled={!batchID}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <div className='flex items-center gap-2'>
                      <Avatar sx={{ width: 28, height: 28, fontSize: 10 }}>
                        {getInitials(option.full_name || '')}
                      </Avatar>
                      <div>
                        <Typography variant='body2' fontWeight={500}>{option.full_name}</Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {option.student_profile?.nim || '—'}
                        </Typography>
                      </div>
                    </div>
                  </li>
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const tagProps = getTagProps({ index })
                    return (
                      <Chip
                        {...tagProps}
                        key={option.id}
                        label={option.full_name}
                        size='small'
                        color='primary'
                        variant='tonal'
                      />
                    )
                  })
                }
                renderInput={params => (
                  <TextField {...params} label='Nama Mahasiswa'
                             placeholder={batchID ? 'Pilih satu atau lebih mahasiswa...' : 'Pilih angkatan dulu'}
                             InputProps={{
                               ...params.InputProps,
                               endAdornment: (
                                 <>
                                   {studentsLoading ? <CircularProgress size={14} /> : null}
                                   {params.InputProps.endAdornment}
                                 </>
                               ),
                             }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField fullWidth size='small' type='date' label='Dari Tanggal'
                         value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                         InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size='small' type='date' label='Sampai Tanggal'
                         value={dateTo} onChange={e => setDateTo(e.target.value)}
                         InputLabelProps={{ shrink: true }}
                         inputProps={{ min: dateFrom || undefined }} />
            </Grid>

            <Grid item xs={12}>
              <Button fullWidth variant='contained' onClick={handleTampilkan}
                      disabled={loading || !batchID}
                      startIcon={loading ? <CircularProgress size={16} color='inherit' /> : <i className='ri-search-line' />}>
                {loading ? 'Memuat...' : 'Tampilkan'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Empty state awal */}
      {!hasLoaded && !loading && (
        <Card>
          <CardContent className='text-center py-16'>
            <i className='ri-bar-chart-grouped-line text-6xl opacity-20 block mb-3' />
            <Typography variant='body1' color='text.secondary'>
              Pilih angkatan dan klik <strong>Tampilkan</strong> untuk melihat rekap nilai.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Info + Stats */}
      {hasLoaded && (
        <>
          {infoMsg && (
            <Alert severity='info' icon={<i className='ri-information-line' />} className='mb-4'>
              {infoMsg}
            </Alert>
          )}

          <Grid container spacing={4} className='mb-6'>
            {[
              { label: 'Mahasiswa',      value: new Set(entries.map(e => e.student_id)).size, icon: 'ri-group-line',  color: '#FF4C51', bg: '#FFE9EA' },
              { label: 'Jenis Kegiatan', value: grouped.length,                               icon: 'ri-stack-line', color: '#7367F0', bg: '#F3EDFF' },
            ].map(s => (
              <Grid item xs={6} key={s.label}>
                <Card sx={{ height: '100%' }}>
                  <CardContent className='flex items-center gap-3' sx={{ p: '12px !important' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 8, flexShrink: 0, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className={s.icon} style={{ fontSize: 22, color: s.color }} />
                    </div>
                    <div>
                      <Typography variant='h4' fontWeight={600} lineHeight={1.2}>{s.value}</Typography>
                      <Typography variant='body2' color='text.secondary' sx={{ fontSize: { xs: 10, sm: 12 } }}>
                        {s.label}
                      </Typography>
                    </div>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Empty result */}
      {hasLoaded && entries.length === 0 && (
        <Card>
          <CardContent className='text-center py-12'>
            <i className='ri-inbox-line text-5xl opacity-30 block mb-2' />
            <Typography variant='body2' color='text.secondary'>
              Tidak ada entri nilai yang ditemukan untuk filter yang dipilih.
            </Typography>
          </CardContent>
        </Card>
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
  )
}

export default NimenRekapView
