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

// ── Mobile Card — PWA native ─────────────────────────────────────────────────
const APPROVAL_BADGE = {
  PENDING:             { bg: '#FAEEDA', color: '#BA7517' },
  VALID:               { bg: '#E1F5EE', color: '#0F6E56' },
  DISPENSED:           { bg: '#E6F1FB', color: '#185FA5' },
  REJECTED_NO_DOC:     { bg: '#FCEBEB', color: '#A32D2D' },
  REJECTED_PUNISHMENT: { bg: '#FCEBEB', color: '#A32D2D' },
}

const SprintMobileCard = ({ s, onDetail }) => {
  const approvalCfg = APPROVAL_CONFIG[s.approval_status] || { label: s.approval_status }
  const badge = APPROVAL_BADGE[s.approval_status] || { bg: '#F1EFE8', color: '#5F5E5A' }
  const deadline = new Date(s.submission_deadline)
  const now = new Date()
  const isDeadlinePassed = now > deadline
  const isPlus = s.indicator_value >= 0
  const canUpload = s.sprint_status === 'ACTIVE' && !isDeadlinePassed && now >= new Date(s.event_date)

  return (
    <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', overflow: 'hidden', mb: '10px' }}>
      <Box sx={{ px: 2, py: '10px', borderBottom: '0.5px solid rgba(180,100,100,0.1)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#EB3D47', mb: '2px' }}>{s.sprint_number}</Typography>
          <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#3B1010', lineHeight: 1.3 }} noWrap>{s.title}</Typography>
        </Box>
        <Box sx={{ bgcolor: badge.bg, borderRadius: '6px', px: '8px', py: '3px', flexShrink: 0 }}>
          <Typography sx={{ fontSize: '10px', fontWeight: 500, color: badge.color }}>{approvalCfg.label}</Typography>
        </Box>
      </Box>
      <Box sx={{ px: 2, py: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px', borderBottom: '0.5px solid rgba(180,100,100,0.1)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <i className='ri-calendar-line' style={{ fontSize: '11px', color: '#9A5A5A' }} />
          <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>{fmtDate(s.event_date)}</Typography>
        </Box>
        <Box sx={{ bgcolor: isPlus ? '#E1F5EE' : '#FCEBEB', borderRadius: '5px', px: '6px', py: '1px' }}>
          <Typography sx={{ fontSize: '10px', fontWeight: 700, color: isPlus ? '#0F6E56' : '#A32D2D' }}>
            {isPlus ? `+${s.indicator_value}` : `${s.indicator_value}`}
          </Typography>
        </Box>
        <Box sx={{ bgcolor: s.document_submitted ? '#E1F5EE' : '#FAEEDA', borderRadius: '5px', px: '6px', py: '1px', display: 'flex', alignItems: 'center', gap: '3px' }}>
          <i className={s.document_submitted ? 'ri-checkbox-circle-line' : 'ri-time-line'} style={{ fontSize: '10px', color: s.document_submitted ? '#0F6E56' : '#BA7517' }} />
          <Typography sx={{ fontSize: '10px', fontWeight: 500, color: s.document_submitted ? '#0F6E56' : '#BA7517' }}>{s.document_count} file</Typography>
        </Box>
        {canUpload && (
          <Box sx={{ bgcolor: '#E6F1FB', borderRadius: '5px', px: '6px', py: '1px' }}>
            <Typography sx={{ fontSize: '10px', fontWeight: 500, color: '#185FA5' }}>Bisa Upload</Typography>
          </Box>
        )}
        <Typography sx={{ fontSize: '10px', color: isDeadlinePassed ? '#A32D2D' : '#9A5A5A', width: '100%' }}>
          <i className='ri-time-line' /> Deadline: {fmtDate(s.submission_deadline)}{isDeadlinePassed ? ' (Lewat)' : ''}
        </Typography>
      </Box>
      <Box sx={{ px: 2, py: '10px' }}>
        <Box component='button' onClick={() => onDetail(s.sprint_id)} sx={{ width: '100%', py: '7px', borderRadius: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.72)', border: '0.5px solid rgba(180,100,100,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
          <i className='ri-eye-line' style={{ fontSize: '13px', color: '#185FA5' }} />
          <Typography sx={{ fontSize: '12px', fontWeight: 500, color: '#3B1010' }}>Lihat Detail & Upload Dokumen</Typography>
        </Box>
      </Box>
    </Box>
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

  const pathname = usePathname()
  useEffect(() => { fetchData() }, [pathname, fetchData])


  const handleDetail = useCallback((id) => {
    router.push(`/nimen/my-sprints/${id}`)
  }, [router])

  return (
    <>
      {/* Topbar PWA */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', mb: '14px' }}>
        <Box sx={{ width: 34, height: 34, borderRadius: '10px', background: 'rgba(255,255,255,0.72)', border: '0.5px solid rgba(180,100,100,0.18)', boxShadow: '0 3px 10px rgba(139,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', position: 'relative', overflow: 'hidden', '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)' } }} onClick={() => window.history.back()}>
          <i className='ri-arrow-left-s-line' style={{ fontSize: '20px', color: '#8B2020', position: 'relative', zIndex: 1 }} />
        </Box>
        <Box>
          <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>NIMEN</Typography>
          <Typography sx={{ fontSize: '16px', fontWeight: 500, color: '#3B1010' }}>Sprint Saya</Typography>
        </Box>
      </Box>

      <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ px: 2, py: '12px', borderBottom: '0.5px solid rgba(180,100,100,0.1)' }}>
          <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#3B1010' }}>Sprint Saya</Typography>
          <Typography sx={{ fontSize: '10px', color: '#9A5A5A' }}>Daftar sprint yang kamu ikuti sebagai peserta</Typography>
        </Box>

        {error && <Alert severity='error' sx={{ m: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: '40px' }}><CircularProgress size={24} sx={{ color: '#EB3D47' }} /></Box>
        ) : sprints.length === 0 ? (
          <Box sx={{ py: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <i className='ri-calendar-check-line' style={{ fontSize: 40, opacity: 0.25 }} />
            <Typography sx={{ fontSize: '12px', color: '#9A5A5A' }}>Kamu belum terdaftar di sprint manapun.</Typography>
          </Box>
        ) : isMobile ? (
          <Box sx={{ p: '12px' }}>
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
      </Box>
    </>
  )
}

export default MySprintListView
