'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import { nimenParticipantDocApi } from '@/libs/api/nimenDocumentApi'

const APPROVAL_CONFIG = {
  PENDING:             { label: 'Menunggu',          color: 'warning'   },
  VALID:               { label: 'Valid',             color: 'success'   },
  DISPENSED:           { label: 'Dispensasi',        color: 'info'      },
  REJECTED_NO_DOC:     { label: 'Dokumen Kurang',    color: 'error'     },
  REJECTED_PUNISHMENT: { label: 'Punishment',        color: 'error'     },
}

const SPRINT_STATUS_CONFIG = {
  ACTIVE:           { label: 'Aktif',    color: 'success'   },
  APPROVAL_PENDING: { label: 'Approval', color: 'warning'   },
  CLOSED:           { label: 'Selesai',  color: 'secondary' },
}

const MySprintListView = () => {
  const router = useRouter()
  const [sprints, setSprints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const res = await nimenParticipantDocApi.getMySprints()
      setSprints(res.data.data || [])
    } catch (err) {
      setError(err.message || 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <Card>
      <CardHeader
        title='Sprint Saya'
        subheader='Daftar sprint yang kamu ikuti sebagai peserta'
      />
      <Divider />
      {error && <Alert severity='error' sx={{ m: 2 }}>{error}</Alert>}
      {loading ? (
        <Box className='flex justify-center py-10'><CircularProgress /></Box>
      ) : sprints.length === 0 ? (
        <Box className='flex flex-col items-center py-10 gap-2' sx={{ color: 'text.secondary' }}>
          <i className='ri-calendar-check-line text-5xl opacity-30' />
          <Typography variant='body2'>Kamu belum terdaftar di sprint manapun.</Typography>
        </Box>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Kegiatan</TableCell>
              <TableCell>Tanggal</TableCell>
              <TableCell>Nilai</TableCell>
              <TableCell>Dokumen</TableCell>
              <TableCell>Status Nilai</TableCell>
              <TableCell align='center'>Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sprints.map(s => {
              const approvalCfg = APPROVAL_CONFIG[s.approval_status] || { label: s.approval_status, color: 'default' }
              const sprintCfg = SPRINT_STATUS_CONFIG[s.sprint_status] || { label: s.sprint_status, color: 'default' }
              const isActive = s.sprint_status === 'ACTIVE'
              const deadline = new Date(s.submission_deadline)
              const now = new Date()
              const isDeadlinePassed = now > deadline
              const isBeforeEvent = now < new Date(s.event_date)

              return (
                <TableRow key={s.sprint_id} hover>
                  <TableCell>
                    <Typography variant='body2' fontWeight={600}>{s.title}</Typography>
                    <Typography variant='caption' color='text.secondary'>{s.sprint_number}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2'>
                      {new Date(s.event_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Typography>
                    <Typography variant='caption' color={isDeadlinePassed ? 'error.main' : 'text.secondary'}>
                      Deadline: {deadline.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={s.indicator_value >= 0 ? `+${s.indicator_value}` : `${s.indicator_value}`}
                      color={s.indicator_value >= 0 ? 'success' : 'error'}
                      size='small'
                      variant='tonal'
                      sx={{ fontWeight: 700 }}
                    />
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-1'>
                      <Chip
                        label={`${s.document_count} file`}
                        size='small'
                        color={s.document_submitted ? 'success' : 'warning'}
                        variant='tonal'
                        icon={<i className={s.document_submitted ? 'ri-checkbox-circle-line' : 'ri-time-line'} />}
                      />
                      {isActive && !isDeadlinePassed && !isBeforeEvent && (
                        <Chip label='Bisa Upload' size='small' color='info' variant='tonal' />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip label={approvalCfg.label} color={approvalCfg.color} size='small' variant='tonal' />
                  </TableCell>
                  <TableCell align='center'>
                    <Tooltip title='Lihat detail & upload dokumen'>
                      <IconButton size='small' onClick={() => router.push(`/nimen/my-sprints/${s.sprint_id}`)}>
                        <i className='ri-eye-line text-[22px]' />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </Card>
  )
}

export default MySprintListView
