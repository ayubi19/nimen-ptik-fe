'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import LinearProgress from '@mui/material/LinearProgress'
import Alert from '@mui/material/Alert'
import Tooltip from '@mui/material/Tooltip'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { studentsApi } from '@/libs/api/studentsApi'
import { nimenRankingApi } from '@/libs/api/nimenRankingApi'
import { exportStudentPDF, exportStudentXLSX } from '@/utils/exportUtils'
import { getInitials } from '@/utils/getInitials'

const SOURCE_CONFIG = {
  SPRINT:          { label: 'Sprint',            color: 'primary' },
  SELF_SUBMISSION: { label: 'Pengajuan Mandiri', color: 'info'    },
  AUTOMATIC:       { label: 'Otomatis',          color: 'success' },
}

const STATUS_CONFIG = {
  VALID:     { label: 'Valid',      color: 'success' },
  DISPENSED: { label: 'Dispensasi', color: 'info'    },
}

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—'

const InfoRow = ({ label, value }) => (
  <div className='flex justify-between py-2 border-b last:border-0'>
    <Typography variant='body2' color='text.secondary'>{label}</Typography>
    <Typography variant='body2' fontWeight={500} sx={{ textAlign: 'right', wordBreak: 'break-all', ml: 2 }}>
      {value || '—'}
    </Typography>
  </div>
)

// ── Mobile: Riwayat Card — PWA native ────────────────────────────────────────
const SOURCE_BADGE = {
  SPRINT:          { bg: '#E6F1FB', color: '#185FA5' },
  SELF_SUBMISSION: { bg: '#EEEDFE', color: '#534AB7' },
  AUTOMATIC:       { bg: '#E1F5EE', color: '#0F6E56' },
}

const HistoryMobileCard = ({ entry }) => {
  const srcCfg = SOURCE_CONFIG[entry.source_type] || { label: entry.source_type }
  const srcBadge = SOURCE_BADGE[entry.source_type] || { bg: '#F1EFE8', color: '#5F5E5A' }
  const isPlus = entry.value >= 0

  return (
    <Box sx={{
      py: '10px', px: 2,
      borderBottom: '0.5px solid rgba(180,100,100,0.08)',
      '&:last-child': { borderBottom: 'none' },
    }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', mb: '5px' }}>
        <Typography sx={{ fontSize: '12px', fontWeight: 500, color: '#3B1010', flex: 1, minWidth: 0, lineHeight: 1.3 }} noWrap>
          {entry.indicator?.name}
        </Typography>
        <Typography sx={{ fontSize: '13px', fontWeight: 700, flexShrink: 0, color: isPlus ? '#0F6E56' : '#A32D2D' }}>
          {isPlus ? `+${entry.value}` : entry.value}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: '10px', color: '#9A5A5A', mb: '6px' }}>
        {entry.indicator?.variable?.category?.name} · {entry.indicator?.variable?.name}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <Typography sx={{ fontSize: '10px', color: '#9A5A5A' }}>{fmtDate(entry.event_date)}</Typography>
        <Box sx={{ bgcolor: srcBadge.bg, borderRadius: '5px', px: '6px', py: '2px' }}>
          <Typography sx={{ fontSize: '9px', fontWeight: 500, color: srcBadge.color }}>{srcCfg.label}</Typography>
        </Box>
      </Box>
    </Box>
  )
}

const StudentProfileView = ({ studentId }) => {
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [student, setStudent]           = useState(null)
  const [history, setHistory]           = useState([])
  const [ranking, setRanking]           = useState(null)
  const [loading, setLoading]           = useState(true)
  const [exportLoading, setExportLoading] = useState('')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const studentRes = await studentsApi.getById(studentId)
      const s = studentRes.data.data
      setStudent(s)

      // Fetch history dan ranking secara paralel
      // Ranking: langsung filter by student_id agar tidak perlu fetch semua mahasiswa
      const [historyRes, rankingRes] = await Promise.allSettled([
        nimenRankingApi.getValueHistory(studentId),
        s.student_profile?.batch_id
          ? nimenRankingApi.getRankings({
            batch_id: s.student_profile.batch_id,
            page: 1,
            page_size: 999,
          })
          : Promise.resolve(null),
      ])

      if (historyRes.status === 'fulfilled') {
        setHistory(historyRes.value.data.data || [])
      }

      if (rankingRes.status === 'fulfilled' && rankingRes.value) {
        const rows = rankingRes.value.data.data?.data || []
        const myRank = rows.find(r => String(r.student_id) === String(studentId))
        setRanking(myRank || null)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleExportPDF = useCallback(async () => {
    setExportLoading('pdf')
    try { await exportStudentPDF(student, history, ranking) }
    catch (e) { console.error(e) }
    finally { setExportLoading('') }
  }, [student, history, ranking])

  const handleExportXLSX = useCallback(async () => {
    setExportLoading('xlsx')
    try { await exportStudentXLSX(student, history, ranking) }
    catch (e) { console.error(e) }
    finally { setExportLoading('') }
  }, [student, history, ranking])

  if (loading) return <Box className='flex justify-center py-20'><CircularProgress /></Box>
  if (!student) return <Alert severity='error'>Mahasiswa tidak ditemukan.</Alert>

  const profile    = student.student_profile
  const totalValue = history.reduce((s, e) => s + e.value, 0)
  const maxValue   = ranking?.max_value || 95
  const pct        = Math.min((totalValue / maxValue) * 100, 100)

  const bySource = history.reduce((acc, e) => {
    acc[e.source_type] = (acc[e.source_type] || 0) + e.value
    return acc
  }, {})

  return (
    <Grid container spacing={6}>

      {/* Topbar PWA style */}
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Box sx={{
              width: 34, height: 34, borderRadius: '10px',
              background: 'rgba(255,255,255,0.72)',
              border: '0.5px solid rgba(180,100,100,0.18)',
              boxShadow: '0 3px 10px rgba(139,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, cursor: 'pointer', position: 'relative', overflow: 'hidden',
              '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)' }
            }} onClick={() => router.back()}>
              <i className='ri-arrow-left-s-line' style={{ fontSize: '20px', color: '#8B2020', position: 'relative', zIndex: 1 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>Mahasiswa</Typography>
              <Typography sx={{ fontSize: '16px', fontWeight: 500, color: '#3B1010' }}>Profil & Nilai</Typography>
            </Box>
          </Box>
          {/* Export buttons — glass style */}
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
        </Box>
      </Grid>

      {/* Kolom kiri — Info mahasiswa */}
      <Grid item xs={12} md={4}>
        <div className='flex flex-col gap-6'>

          {/* Kartu profil — PWA native */}
          <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
            {/* Hero profil */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', pt: '20px', pb: '16px', px: 2 }}>
              <Avatar
                src={profile?.photo ? `https://cdn.aplikasikorwa.com/${profile.photo}` : undefined}
                sx={{
                  width: 72, height: 72, fontSize: 22, borderRadius: '18px !important',
                  background: 'linear-gradient(145deg, #E63946, #6D0E13)',
                  boxShadow: '0 5px 14px rgba(180,0,30,0.28), inset 0 1px 0 rgba(255,180,180,0.45)',
                }}>
                {getInitials(student.full_name)}
              </Avatar>
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#3B1010' }}>{student.full_name}</Typography>
                <Typography sx={{ fontSize: '12px', color: '#9A5A5A' }}>{profile?.nim}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {[
                  { label: profile?.batch?.name || '—', bg: '#FAEEDA', color: '#BA7517' },
                  { label: profile?.syndicate?.name || '—', bg: '#F1EFE8', color: '#5F5E5A' },
                  { label: student.is_active ? 'Aktif' : 'Nonaktif', bg: student.is_active ? '#E1F5EE' : '#FCEBEB', color: student.is_active ? '#0F6E56' : '#A32D2D' },
                ].map(b => (
                  <Box key={b.label} sx={{ bgcolor: b.bg, borderRadius: '6px', px: '8px', py: '3px' }}>
                    <Typography sx={{ fontSize: '10px', fontWeight: 500, color: b.color }}>{b.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Info rows */}
            <Box sx={{ borderTop: '0.5px solid rgba(180,100,100,0.1)', px: 2, py: 1 }}>
              {[
                { label: 'Username',          value: student.username },
                { label: 'Email',             value: student.email },
                { label: 'Jenis Kelamin',     value: profile?.gender === 'M' ? 'Laki-laki' : 'Perempuan' },
                { label: 'Agama',             value: profile?.religion },
                { label: 'Status Pernikahan', value: profile?.marital_status === 'SINGLE' ? 'Belum Menikah' : 'Menikah' },
                { label: 'Tempat Lahir',      value: profile?.birth_place },
                { label: 'Tanggal Lahir',     value: profile?.birth_date ? new Date(profile.birth_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : null },
                { label: 'No. HP',            value: profile?.phone },
                { label: 'Kota',              value: profile?.city },
                { label: 'Status Akademik',   value: profile?.academic_status?.name },
              ].map((r, i, arr) => (
                <Box key={r.label} sx={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  py: '9px', borderBottom: i < arr.length - 1 ? '0.5px solid rgba(180,100,100,0.08)' : 'none',
                }}>
                  <Typography sx={{ fontSize: '12px', color: '#9A5A5A' }}>{r.label}</Typography>
                  <Typography sx={{ fontSize: '12px', fontWeight: 500, color: '#3B1010', textAlign: 'right', wordBreak: 'break-all', ml: 2 }}>
                    {r.value || '—'}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Kartu Nilai NIMEN — PWA native */}
          <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: '12px', borderBottom: '0.5px solid rgba(180,100,100,0.1)' }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#3B1010' }}>Nilai NIMEN</Typography>
            </Box>
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {ranking ? (
                <>
                  <div className='flex items-center justify-between'>
                    <div>
                      <Typography variant='h4' fontWeight={700} color='primary.main'>
                        {ranking.total_value?.toFixed(2)}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        dari {maxValue.toFixed(0)} maksimum
                      </Typography>
                    </div>
                    <div className='text-right'>
                      <Typography variant='h4' fontWeight={700}>#{ranking.rank_position}</Typography>
                      <Typography variant='caption' color='text.secondary'>Peringkat Angkatan</Typography>
                    </div>
                  </div>
                  <LinearProgress variant='determinate' value={pct}
                                  color={pct >= 100 ? 'success' : pct >= 70 ? 'primary' : 'warning'}
                                  sx={{ height: 8, borderRadius: 4 }} />
                  <Divider />
                  <div className='flex flex-col gap-1'>
                    <Typography variant='caption' color='text.secondary' fontWeight={600}>
                      RINCIAN PER SUMBER
                    </Typography>
                    {Object.entries(bySource).map(([src, val]) => {
                      const cfg = SOURCE_CONFIG[src] || { label: src, color: 'default' }
                      return (
                        <div key={src} className='flex items-center justify-between'>
                          <Chip label={cfg.label} color={cfg.color} size='small' variant='tonal' />
                          <Typography variant='body2' fontWeight={600}
                                      color={val >= 0 ? 'success.main' : 'error.main'}>
                            {val >= 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}
                          </Typography>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <Typography variant='body2' color='text.secondary' className='text-center py-2'>
                  Belum ada data nilai.
                </Typography>
              )}
            </Box>
          </Box>
        </div>
      </Grid>

      {/* Kolom kanan — Riwayat nilai */}
      <Grid item xs={12} md={8}>
        <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: '12px', borderBottom: '0.5px solid rgba(180,100,100,0.1)' }}>
            <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#3B1010' }}>Riwayat Nilai</Typography>
            <Typography sx={{ fontSize: '10px', color: '#9A5A5A' }}>{history.length} entri</Typography>
          </Box>
          {history.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: '40px', gap: '8px', color: '#9A5A5A' }}>
              <i className='ri-inbox-line' style={{ fontSize: '40px', opacity: 0.3 }} />
              <Typography sx={{ fontSize: '12px', color: '#9A5A5A' }}>Belum ada riwayat nilai.</Typography>
            </Box>
          ) : isMobile ? (
            <Box>
              {history.map(entry => (
                <HistoryMobileCard key={entry.id} entry={entry} />
              ))}
            </Box>
          ) : (
            // ── Desktop: Table ──
            <Table size='small'>
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  {['Tanggal', 'Indikator', 'Kategori', 'Sumber', 'Nilai', 'Status'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map(entry => {
                  const srcCfg = SOURCE_CONFIG[entry.source_type] || { label: entry.source_type, color: 'default' }
                  const stsCfg = STATUS_CONFIG[entry.status]      || { label: entry.status,      color: 'default' }
                  return (
                    <TableRow key={entry.id} hover>
                      <TableCell>
                        <Typography variant='caption'>{fmtDate(entry.event_date)}</Typography>
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
                      <TableCell>
                        <Chip label={srcCfg.label} color={srcCfg.color} size='small' variant='tonal' />
                      </TableCell>
                      <TableCell align='right'>
                        <Typography variant='body2' fontWeight={700}
                                    color={entry.value >= 0 ? 'success.main' : 'error.main'}>
                          {entry.value >= 0 ? `+${entry.value}` : entry.value}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={stsCfg.label} color={stsCfg.color} size='small' variant='tonal' />
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
  )
}

export default StudentProfileView
