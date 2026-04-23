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
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import LinearProgress from '@mui/material/LinearProgress'
import Alert from '@mui/material/Alert'
import { studentsApi } from '@/libs/api/studentsApi'
import { nimenRankingApi } from '@/libs/api/nimenRankingApi'
import { getInitials } from '@/utils/getInitials'

const SOURCE_CONFIG = {
  SPRINT:          { label: 'Sprint',             color: 'primary' },
  SELF_SUBMISSION: { label: 'Pengajuan Mandiri',  color: 'info'    },
  AUTOMATIC:       { label: 'Otomatis',           color: 'success' },
}

const STATUS_CONFIG = {
  VALID:     { label: 'Valid',       color: 'success' },
  DISPENSED: { label: 'Dispensasi', color: 'info'    },
}

const InfoRow = ({ label, value }) => (
  <div className='flex justify-between py-2 border-b last:border-0'>
    <Typography variant='body2' color='text.secondary'>{label}</Typography>
    <Typography variant='body2' fontWeight={500}>{value || '—'}</Typography>
  </div>
)

const StudentProfileView = ({ studentId }) => {
  const router = useRouter()
  const [student, setStudent] = useState(null)
  const [history, setHistory] = useState([])
  const [ranking, setRanking] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const studentRes = await studentsApi.getById(studentId)
      const s = studentRes.data.data
      setStudent(s)

      // Fetch nilai history dan ranking paralel
      const [historyRes, rankingRes] = await Promise.allSettled([
        nimenRankingApi.getValueHistory(studentId),
        s.student_profile?.batch_id
          ? nimenRankingApi.getRankings({ batch_id: s.student_profile.batch_id, page: 1, page_size: 999 })
          : Promise.resolve(null),
      ])

      if (historyRes.status === 'fulfilled') {
        setHistory(historyRes.value.data.data || [])
      }

      if (rankingRes.status === 'fulfilled' && rankingRes.value) {
        const rows = rankingRes.value.data.data?.data || []
        const myRank = rows.find(r => r.student_id === parseInt(studentId))
        setRanking(myRank || null)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => { fetchAll() }, [fetchAll])

  if (loading) return <Box className='flex justify-center py-20'><CircularProgress /></Box>
  if (!student) return (
    <Alert severity='error'>Mahasiswa tidak ditemukan.</Alert>
  )

  const profile = student.student_profile
  const totalValue = history.reduce((s, e) => s + e.value, 0)
  const maxValue = ranking?.max_value || 95
  const pct = Math.min((totalValue / maxValue) * 100, 100)

  // Hitung ringkasan per sumber
  const bySource = history.reduce((acc, e) => {
    acc[e.source_type] = (acc[e.source_type] || 0) + e.value
    return acc
  }, {})

  return (
    <Grid container spacing={6}>

      {/* Tombol kembali */}
      <Grid item xs={12}>
        <Button variant='tonal' color='secondary' size='small'
          startIcon={<i className='ri-arrow-left-line' />}
          onClick={() => router.back()}>
          Kembali
        </Button>
      </Grid>

      {/* Kolom kiri — Info mahasiswa */}
      <Grid item xs={12} md={4}>
        <div className='flex flex-col gap-6'>

          {/* Kartu profil */}
          <Card>
            <CardContent className='flex flex-col items-center gap-3 pt-6'>
              <Avatar
                src={profile?.photo ? `https://cdn.aplikasikorwa.com/${profile.photo}` : undefined}
                sx={{ width: 80, height: 80, fontSize: 28 }}>
                {getInitials(student.full_name)}
              </Avatar>
              <div className='text-center'>
                <Typography variant='h6' fontWeight={700}>{student.full_name}</Typography>
                <Typography variant='body2' color='text.secondary'>{profile?.nim}</Typography>
              </div>
              <div className='flex gap-2 flex-wrap justify-center'>
                <Chip label={profile?.batch?.name || '—'} color='primary' size='small' variant='tonal' />
                <Chip label={profile?.syndicate?.name || '—'} size='small' variant='tonal' />
                <Chip
                  label={student.is_active ? 'Aktif' : 'Non-aktif'}
                  color={student.is_active ? 'success' : 'error'}
                  size='small' variant='tonal'
                />
              </div>
            </CardContent>
            <Divider />
            <CardContent>
              <InfoRow label='Username' value={student.username} />
              <InfoRow label='Email' value={student.email} />
              <InfoRow label='Jenis Kelamin' value={profile?.gender === 'M' ? 'Laki-laki' : 'Perempuan'} />
              <InfoRow label='Agama' value={profile?.religion} />
              <InfoRow label='Status Pernikahan'
                value={profile?.marital_status === 'SINGLE' ? 'Belum Menikah' : 'Menikah'} />
              <InfoRow label='Tempat Lahir' value={profile?.birth_place} />
              <InfoRow label='Tanggal Lahir'
                value={profile?.birth_date
                  ? new Date(profile.birth_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
                  : null} />
              <InfoRow label='No. HP' value={profile?.phone} />
              <InfoRow label='Kota' value={profile?.city} />
              <InfoRow label='Status Akademik' value={profile?.academic_status?.name} />
            </CardContent>
          </Card>

          {/* Kartu ranking & total nilai */}
          <Card>
            <CardHeader title='Nilai NIMEN' titleTypographyProps={{ variant: 'subtitle1' }} />
            <Divider />
            <CardContent className='flex flex-col gap-3'>
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
                      <Typography variant='h4' fontWeight={700}>
                        #{ranking.rank_position}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        Peringkat Angkatan
                      </Typography>
                    </div>
                  </div>
                  <LinearProgress
                    variant='determinate'
                    value={pct}
                    color={pct >= 100 ? 'success' : pct >= 70 ? 'primary' : 'warning'}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
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
            </CardContent>
          </Card>
        </div>
      </Grid>

      {/* Kolom kanan — Riwayat nilai */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardHeader
            title='Riwayat Nilai'
            subheader={`${history.length} entri nilai tercatat`}
          />
          <Divider />
          {history.length === 0 ? (
            <Box className='flex flex-col items-center py-10 gap-2' sx={{ color: 'text.secondary' }}>
              <i className='ri-inbox-line text-5xl opacity-30' />
              <Typography variant='body2'>Belum ada riwayat nilai.</Typography>
            </Box>
          ) : (
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Tanggal</TableCell>
                  <TableCell>Indikator</TableCell>
                  <TableCell>Kategori</TableCell>
                  <TableCell>Sumber</TableCell>
                  <TableCell align='right'>Nilai</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map(entry => {
                  const srcCfg = SOURCE_CONFIG[entry.source_type] || { label: entry.source_type, color: 'default' }
                  const stsCfg = STATUS_CONFIG[entry.status] || { label: entry.status, color: 'default' }
                  return (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Typography variant='caption'>
                          {new Date(entry.event_date).toLocaleDateString('id-ID', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })}
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
        </Card>
      </Grid>
    </Grid>
  )
}

export default StudentProfileView
