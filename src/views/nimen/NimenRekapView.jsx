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
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { batchApi } from '@/libs/api/masterDataApi'
import { studentsApi } from '@/libs/api/studentsApi'
import { nimenRankingApi } from '@/libs/api/nimenRankingApi'
import { getInitials } from '@/utils/getInitials'

const SOURCE_CONFIG = {
  SPRINT:          { label: 'Sprint',            color: 'success', bg: '#E6F9EE', text: '#1B7A47' },
  AUTOMATIC:       { label: 'Nilai Jabatan',     color: 'info',    bg: '#E0F9FC', text: '#0891B2' },
  SELF_SUBMISSION: { label: 'Pengajuan Mandiri', color: 'warning', bg: '#FFF3E8', text: '#B36B00' },
}

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—'

const fmtVal = (v) => v >= 0 ? `+${v}` : `${v}`

// ── Section per sumber ────────────────────────────────────────────────────────
const EntrySection = ({ sourceType, entries, isMobile }) => {
  const cfg = SOURCE_CONFIG[sourceType] || { label: sourceType, color: 'default', bg: '#F4F4F4', text: '#5F5E5A' }
  const total = entries.reduce((s, e) => s + e.value, 0)

  return (
    <Card className='mb-4'>
      <CardContent className='pb-2'>
        <div className='flex items-center justify-between mb-2'>
          <div className='flex items-center gap-2'>
            <Chip label={cfg.label} size='small'
                  sx={{ bgcolor: cfg.bg, color: cfg.text, fontWeight: 600, fontSize: 11 }} />
            <Typography variant='caption' color='text.secondary'>
              {entries.length} entri
            </Typography>
          </div>
          <Typography variant='body2' fontWeight={600}
                      sx={{ color: total >= 0 ? 'success.main' : 'error.main' }}>
            {fmtVal(parseFloat(total.toFixed(2)))}
          </Typography>
        </div>
      </CardContent>

      {isMobile ? (
        <div className='px-4 pb-4 flex flex-col gap-2'>
          {entries.map(e => (
            <Card key={e.id} variant='outlined'>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <div className='flex items-start justify-between gap-2'>
                  <div className='flex items-center gap-2 flex-1'>
                    <Avatar sx={{ width: 28, height: 28, fontSize: 10 }}>
                      {getInitials(e.student?.full_name || '')}
                    </Avatar>
                    <div>
                      <Typography variant='body2' fontWeight={500}>
                        {e.student?.full_name || '—'}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {e.indicator?.name}
                      </Typography>
                      <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                        {fmtDate(e.event_date)}
                      </Typography>
                    </div>
                  </div>
                  <Chip label={fmtVal(e.value)} size='small'
                        color={e.value >= 0 ? 'success' : 'error'} variant='tonal'
                        sx={{ fontWeight: 700 }} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Table size='small'>
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              {['Mahasiswa', 'NIM', 'Indikator', 'Tanggal', 'Nilai', 'Status'].map(h => (
                <TableCell key={h} sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map(e => (
              <TableRow key={e.id} hover>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <Avatar sx={{ width: 30, height: 30, fontSize: 10 }}>
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
                  <Typography variant='body2'>{e.indicator?.name}</Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {e.indicator?.variable?.category?.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant='caption'>{fmtDate(e.event_date)}</Typography>
                </TableCell>
                <TableCell>
                  <Chip label={fmtVal(e.value)} size='small'
                        color={e.value >= 0 ? 'success' : 'error'} variant='tonal'
                        sx={{ fontWeight: 700 }} />
                </TableCell>
                <TableCell>
                  <Chip label={e.status === 'DISPENSED' ? 'Dispensasi' : 'Valid'}
                        size='small'
                        color={e.status === 'DISPENSED' ? 'info' : 'success'}
                        variant='tonal' />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  )
}

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
  const isAdmin = isDeveloper || roles.includes('admin_nimen')
  const studentId = session?.user?.id

  // Admin state
  const [batches, setBatches] = useState([])
  const [batchID, setBatchID] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [studentFilter, setStudentFilter] = useState(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [students, setStudents] = useState([])
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [infoMsg, setInfoMsg] = useState('')

  // Mahasiswa state
  const [myEntries, setMyEntries] = useState([])
  const [myLoading, setMyLoading] = useState(false)

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

  // Load students when batch changes
  useEffect(() => {
    if (!batchID) return
    studentsApi?.getAll({ batch_id: batchID, page: 1, page_size: 200 })
      .then(r => setStudents(r.data.data?.data || []))
      .catch(() => {})
  }, [batchID])

  const handleTampilkan = useCallback(async () => {
    if (!batchID) return
    setLoading(true)
    setHasLoaded(false)
    try {
      const params = {}
      if (sourceFilter) params.source_type = sourceFilter
      if (studentFilter) params.student_id = studentFilter.id
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo

      const res = await nimenRankingApi.getBatchEntries(batchID, params)
      const data = res.data.data || []
      setEntries(data)
      setHasLoaded(true)

      const batch = batches.find(b => b.id === parseInt(batchID))
      if (studentFilter) {
        setInfoMsg(`Menampilkan rekap nilai atas nama ${studentFilter.full_name} (${studentFilter.student_profile?.nim || '—'})`)
      } else {
        setInfoMsg(`Menampilkan rekap nilai seluruh mahasiswa angkatan ${batch?.name || ''}`)
      }
    } catch {
      setInfoMsg('')
    } finally {
      setLoading(false)
    }
  }, [batchID, sourceFilter, studentFilter, dateFrom, dateTo, batches])

  // Group entries by source_type
  const grouped = useMemo(() => {
    const g = {}
    entries.forEach(e => {
      const src = e.source_type || 'UNKNOWN'
      if (!g[src]) g[src] = []
      g[src].push(e)
    })
    return g
  }, [entries])

  const selectedBatch = batches.find(b => b.id === parseInt(batchID))

  // ── MAHASISWA VIEW ──────────────────────────────────────────────────────────
  if (!isAdmin) {
    const myGrouped = {}
    myEntries.forEach(e => {
      const src = e.source_type || 'UNKNOWN'
      if (!myGrouped[src]) myGrouped[src] = []
      myGrouped[src].push(e)
    })
    const myTotal = myEntries.reduce((s, e) => s + e.value, 0)

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
            {/* Stats */}
            <Grid container spacing={4} className='mb-6'>
              {[
                { label: 'Total Entri', value: myEntries.length, icon: 'ri-list-check-line', color: '#FF4C51', bg: '#FFE9EA' },
                { label: 'Total Nilai', value: fmtVal(parseFloat(myTotal.toFixed(2))), icon: 'ri-medal-line', color: '#28C76F', bg: '#E6F9EE' },
              ].map(s => (
                <Grid item xs={6} key={s.label}>
                  <Card>
                    <CardContent className='flex items-center gap-3'>
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

            {Object.entries(myGrouped).map(([src, items]) => (
              <EntrySection key={src} sourceType={src} entries={items} isMobile={isMobile} />
            ))}
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
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size='small'>
                <InputLabel>Angkatan</InputLabel>
                <Select label='Angkatan' value={batchID}
                        onChange={e => { setBatchID(e.target.value); setHasLoaded(false); setStudentFilter(null) }}
                        renderValue={val => {
                          const b = batches.find(x => x.id === parseInt(val))
                          if (!b) return ''
                          return `${b.name} · ke-${b.batch_number} (${b.year}) · ${b.program_type || 'S1'}`
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
            <Grid item xs={12} sm={4}>
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
            <Grid item xs={12} sm={4}>
              <Autocomplete
                size='small'
                options={students}
                getOptionLabel={s => `${s.full_name} (${s.student_profile?.nim || '—'})`}
                value={studentFilter}
                onChange={(_, val) => setStudentFilter(val)}
                disabled={!batchID}
                renderInput={params => (
                  <TextField {...params} label='Mahasiswa (opsional)'
                             placeholder={batchID ? 'Pilih mahasiswa...' : 'Pilih angkatan dulu'} />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size='small' type='date' label='Dari Tanggal'
                         value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                         InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size='small' type='date' label='Sampai Tanggal'
                         value={dateTo} onChange={e => setDateTo(e.target.value)}
                         InputLabelProps={{ shrink: true }}
                         inputProps={{ min: dateFrom || undefined }} />
            </Grid>
            <Grid item xs={12} sm={4}>
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
              Pilih angkatan dan klik <strong>Tampilkan</strong> untuk melihat rekap nilai,
              atau pilih mahasiswa tertentu untuk melihat nilai individu.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Info banner */}
      {hasLoaded && infoMsg && (
        <Alert severity='info' icon={<i className='ri-information-line' />} className='mb-4'>
          {infoMsg}
          {selectedBatch && (
            <span className='ml-1'>
              · <strong>{selectedBatch.program_type || 'S1'}</strong>
            </span>
          )}
        </Alert>
      )}

      {/* Stats */}
      {hasLoaded && (
        <Grid container spacing={4} className='mb-6'>
          {[
            { label: 'Total Mahasiswa', value: new Set(entries.map(e => e.student_id)).size, icon: 'ri-group-line', color: '#FF4C51', bg: '#FFE9EA' },
            { label: 'Total Sumber Kegiatan', value: Object.keys(grouped).length, icon: 'ri-stack-line', color: '#7367F0', bg: '#F3EDFF' },
          ].map(s => (
            <Grid item xs={6} key={s.label}>
              <Card>
                <CardContent className='flex items-center gap-3'>
                  <div style={{ width: 44, height: 44, borderRadius: 8, flexShrink: 0, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={s.icon} style={{ fontSize: 22, color: s.color }} />
                  </div>
                  <div>
                    <Typography variant='h5' fontWeight={600} lineHeight={1.2}>{s.value}</Typography>
                    <Typography variant='body2' color='text.secondary' sx={{ fontSize: { xs: 10, sm: 12 } }}>
                      {s.label}
                    </Typography>
                  </div>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
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

      {/* Grouped sections */}
      {hasLoaded && Object.entries(grouped).map(([src, items]) => (
        <EntrySection key={src} sourceType={src} entries={items} isMobile={isMobile} />
      ))}
    </>
  )
}

export default NimenRekapView
