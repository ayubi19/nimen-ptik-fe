'use client'
import { useVisibilityRefetch } from '@/hooks/useVisibilityRefetch'

import { useEffect, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { nimenParticipantDocApi } from '@/libs/api/nimenDocumentApi'

const APPROVAL_CONFIG = {
  PENDING:             { label: 'Menunggu',       color: 'warning'   },
  VALID:               { label: 'Valid',           color: 'success'   },
  DISPENSED:           { label: 'Dispensasi',      color: 'info'      },
  REJECTED_NO_DOC:     { label: 'Dokumen Kurang',  color: 'error'     },
  REJECTED_PUNISHMENT: { label: 'Punishment',      color: 'error'     },
}

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—'

// ── Mobile Card ───────────────────────────────────────────────────────────────
const SprintMobileCard = ({ s, onDetail }) => {
  const approvalCfg = APPROVAL_CONFIG[s.approval_status] || { label: s.approval_status, color: 'default' }
  const deadline = new Date(s.submission_deadline)
  const now = new Date()
  const isDeadlinePassed = now > deadline
  const isBeforeEvent = now < new Date(s.event_date)
  const isActive = s.sprint_status === 'ACTIVE'
  const canUpload = isActive && !isDeadlinePassed && !isBeforeEvent

  return (
    <Card className='mb-3' variant='outlined'>
      <CardContent sx={{ p: '12px !important' }}>
        {/* Header */}
        <div className='flex items-start justify-between gap-2 mb-2'>
          <div className='flex-1 min-w-0'>
            <Typography variant='body2' fontWeight={700} noWrap>{s.title}</Typography>
            <Typography variant='caption' color='primary.main'>{s.sprint_number}</Typography>
          </div>
          <Chip label={approvalCfg.label} color={approvalCfg.color} size='small' variant='tonal' sx={{ flexShrink: 0 }} />
        </div>

        {/* Info baris */}
        <div className='flex flex-wrap gap-2 mb-2'>
          <Chip
            label={fmtDate(s.event_date)}
            size='small' variant='tonal'
            icon={<i className='ri-calendar-line' />}
          />
          <Chip
            label={s.indicator_value >= 0 ? `+${s.indicator_value}` : `${s.indicator_value}`}
            color={s.indicator_value >= 0 ? 'success' : 'error'}
            size='small' variant='tonal'
            sx={{ fontWeight: 700 }}
          />
          <Chip
            label={`${s.document_count} file`}
            size='small'
            color={s.document_submitted ? 'success' : 'warning'}
            variant='tonal'
            icon={<i className={s.document_submitted ? 'ri-checkbox-circle-line' : 'ri-time-line'} />}
          />
          {canUpload && (
            <Chip label='Bisa Upload' size='small' color='info' variant='tonal' />
          )}
        </div>

        {/* Deadline */}
        <Typography variant='caption' color={isDeadlinePassed ? 'error.main' : 'text.secondary'}>
          <i className='ri-time-line mr-1' />
          Deadline: {fmtDate(s.submission_deadline)}
          {isDeadlinePassed && ' (Lewat)'}
        </Typography>

        <Divider className='my-2' />
        <Button fullWidth size='small' variant='tonal' color='secondary'
                startIcon={<i className='ri-eye-line' />}
                onClick={() => onDetail(s.sprint_id)}>
          Lihat Detail & Upload Dokumen
        </Button>
      </CardContent>
    </Card>
  )
}

// ── Main View ─────────────────────────────────────────────────────────────────
const MySprintListView = () => {
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

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

  useVisibilityRefetch(fetchData)


  const handleDetail = useCallback((id) => {
    router.push(`/nimen/my-sprints/${id}`)
  }, [router])

  return (
    <>
      {/* Breadcrumb */}
      <div className='flex items-center gap-2 mb-6'>
        <Typography variant='caption' color='text.secondary'>NIMEN</Typography>
        <i className='ri-arrow-right-s-line text-sm opacity-50' />
        <Typography variant='caption' fontWeight={500} color='text.primary'>Sprint Saya</Typography>
      </div>

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
        ) : isMobile ? (
          // ── Mobile: Card List ──
          <Box sx={{ p: 2 }}>
            {sprints.map(s => (
              <SprintMobileCard key={s.sprint_id} s={s} onDetail={handleDetail} />
            ))}
          </Box>
        ) : (
          // ── Desktop: Table ──
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                {['Kegiatan', 'Tanggal', 'Nilai', 'Dokumen', 'Status Nilai', 'Aksi'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sprints.map(s => {
                const approvalCfg = APPROVAL_CONFIG[s.approval_status] || { label: s.approval_status, color: 'default' }
                const deadline = new Date(s.submission_deadline)
                const now = new Date()
                const isDeadlinePassed = now > deadline
                const isBeforeEvent = now < new Date(s.event_date)
                const isActive = s.sprint_status === 'ACTIVE'

                return (
                  <TableRow key={s.sprint_id} hover>
                    <TableCell>
                      <Typography variant='body2' fontWeight={600}>{s.title}</Typography>
                      <Typography variant='caption' color='text.secondary'>{s.sprint_number}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>{fmtDate(s.event_date)}</Typography>
                      <Typography variant='caption' color={isDeadlinePassed ? 'error.main' : 'text.secondary'}>
                        Deadline: {fmtDate(s.submission_deadline)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={s.indicator_value >= 0 ? `+${s.indicator_value}` : `${s.indicator_value}`}
                        color={s.indicator_value >= 0 ? 'success' : 'error'}
                        size='small' variant='tonal' sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-1 flex-wrap'>
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
                        <IconButton size='small' onClick={() => handleDetail(s.sprint_id)}>
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
    </>
  )
}

export default MySprintListView
