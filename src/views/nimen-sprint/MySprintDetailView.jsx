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
import Grid from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import Snackbar from '@mui/material/Snackbar'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { nimenSprintApi } from '@/libs/api/nimenSprintApi'
import { nimenAttachmentApi, nimenParticipantDocApi } from '@/libs/api/nimenDocumentApi'
import DocumentManager from '@/components/nimen/DocumentManager'

const APPROVAL_CONFIG = {
  VALID:               { label: 'Nilai Valid',     color: 'success', icon: 'ri-checkbox-circle-line' },
  DISPENSED:           { label: 'Dispensasi',      color: 'info',    icon: 'ri-shield-check-line'    },
  REJECTED_NO_DOC:     { label: 'Dokumen Kurang',  color: 'error',   icon: 'ri-file-warning-line'    },
  REJECTED_PUNISHMENT: { label: 'Punishment',      color: 'error',   icon: 'ri-close-circle-line'    },
  PENDING:             { label: 'Menunggu',        color: 'warning', icon: 'ri-time-line'            },
}

const MySprintDetailView = ({ sprintId }) => {
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [sprint, setSprint]     = useState(null)
  const [attachments, setAttachments] = useState([])
  const [myDocData, setMyDocData] = useState({ participant: null, documents: [] })
  const [loading, setLoading]   = useState(true)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const showToast = useCallback((msg, severity = 'success') =>
    setToast({ open: true, message: msg, severity }), [])

  const fetchData = useCallback(async () => {
    try {
      const [sprintRes, attachRes, myDocRes] = await Promise.all([
        nimenSprintApi.getById(sprintId),
        nimenAttachmentApi.getAll(sprintId),
        nimenParticipantDocApi.getMyDocuments(sprintId),
      ])
      setSprint(sprintRes.data.data)
      setAttachments(attachRes.data.data || [])
      setMyDocData(myDocRes.data.data || { participant: null, documents: [] })
    } catch (err) {
      showToast(err.message || 'Gagal memuat data', 'error')
    } finally {
      setLoading(false)
    }
  }, [sprintId, showToast])

  useEffect(() => { fetchData() }, [fetchData])

  useVisibilityRefetch(fetchData)

  const pathname = usePathname()
  useEffect(() => { fetchData() }, [pathname, fetchData])


  const handleUpload = useCallback(async (file) => {
    await nimenParticipantDocApi.upload(sprintId, file)
    showToast('Dokumen berhasil diupload')
    fetchData()
  }, [sprintId, fetchData, showToast])

  const handleDelete = useCallback(async (docId) => {
    await nimenParticipantDocApi.delete(sprintId, docId)
    showToast('Dokumen berhasil dihapus')
    fetchData()
  }, [sprintId, fetchData, showToast])

  const handlePresign = useCallback(async (docId) =>
    nimenParticipantDocApi.getPresignedURL(sprintId, docId), [sprintId])

  const handleAttachmentPresign = useCallback(async (attachId) =>
    nimenAttachmentApi.getPresignedURL(sprintId, attachId), [sprintId])

  if (loading) return <Box className='flex justify-center py-20'><CircularProgress /></Box>
  if (!sprint) return null

  const now          = new Date()
  const eventDate    = new Date(sprint.event_date)
  const deadline     = new Date(sprint.submission_deadline)
  const isActive     = sprint.status === 'ACTIVE'
  const canUpload    = isActive && now >= eventDate && now <= deadline
  const isDeadlinePassed = now > deadline
  const isBeforeEvent    = now < eventDate

  const participant  = myDocData?.participant
  const myDocuments  = myDocData?.documents || []
  const approvalCfg  = APPROVAL_CONFIG[participant?.approval_status] || APPROVAL_CONFIG.PENDING
  const indicatorVal = sprint.indicator?.value ?? 0
  const isPlus       = indicatorVal >= 0

  const fmtDate = (d, opts) => new Date(d).toLocaleDateString('id-ID', opts || { day: '2-digit', month: 'long', year: 'numeric' })

  // Countdown deadline
  const msLeft  = deadline - now
  const daysLeft = Math.max(0, Math.floor(msLeft / (1000 * 60 * 60 * 24)))

  return (
    <>
      {/* Topbar PWA */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', mb: '14px' }}>
        <Box sx={{ width: 34, height: 34, borderRadius: '10px', background: 'rgba(255,255,255,0.72)', border: '0.5px solid rgba(180,100,100,0.18)', boxShadow: '0 3px 10px rgba(139,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', position: 'relative', overflow: 'hidden', '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)' } }} onClick={() => router.push('/nimen/my-sprints')}>
          <i className='ri-arrow-left-s-line' style={{ fontSize: '20px', color: '#8B2020', position: 'relative', zIndex: 1 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>Sprint Saya</Typography>
          <Typography sx={{ fontSize: '16px', fontWeight: 500, color: '#3B1010' }} noWrap>{sprint.title}</Typography>
        </Box>
      </Box>

      <Grid container spacing={4}>

        {/* ── Hero Card — PWA native ── */}
        <Grid item xs={12}>
          <Box sx={{ background: 'linear-gradient(135deg, #EB3D47 0%, #8B0000 100%)', borderRadius: '12px', p: '16px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ position: 'absolute', top: -20, right: 15, width: 90, height: 90, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', mb: '12px' }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#fff', lineHeight: 1.3, mb: '6px' }} noWrap>{sprint.title}</Typography>
                <Box sx={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: '6px', px: '8px', py: '3px' }}>
                    <Typography sx={{ fontSize: '10px', fontWeight: 500, color: '#fff' }}>{sprint.sprint_number}</Typography>
                  </Box>
                  {sprint.batch?.name && (
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: '6px', px: '8px', py: '3px' }}>
                      <Typography sx={{ fontSize: '10px', fontWeight: 500, color: '#fff' }}>{sprint.batch.name}</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
              <Box sx={{ width: 64, height: 64, borderRadius: '14px', background: isPlus ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Typography sx={{ fontSize: '22px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                  {isPlus ? `+${indicatorVal}` : indicatorVal}
                </Typography>
                <Typography sx={{ fontSize: '9px', color: 'rgba(255,255,255,0.7)' }}>poin</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className='ri-calendar-event-line' style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }} />
                <Typography sx={{ fontSize: '12px', color: 'rgba(255,255,255,0.9)' }}>
                  {fmtDate(sprint.event_date, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </Typography>
              </Box>
              {sprint.location && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className='ri-map-pin-line' style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }} />
                  <Typography sx={{ fontSize: '12px', color: 'rgba(255,255,255,0.9)' }}>{sprint.location}</Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className='ri-time-line' style={{ fontSize: '12px', color: isDeadlinePassed ? '#FFB3B3' : 'rgba(255,255,255,0.8)' }} />
                <Typography sx={{ fontSize: '12px', color: isDeadlinePassed ? '#FFB3B3' : 'rgba(255,255,255,0.9)' }}>
                  Deadline: {fmtDate(sprint.submission_deadline)}{canUpload ? ` · ${daysLeft} hari lagi` : ''}{isDeadlinePassed ? ' · Sudah lewat' : ''}
                </Typography>
              </Box>
              {participant && (
                <Box sx={{ mt: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className={approvalCfg.icon} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }} />
                  <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>{approvalCfg.label}</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Grid>

        {/* ── Alert Status Upload ── */}
        {isActive && (
          <Grid item xs={12}>
            {isBeforeEvent && (
              <Alert severity='info' icon={<i className='ri-time-line' />}>
                Pengumpulan dokumen dibuka setelah tanggal kegiatan{' '}
                (<strong>{fmtDate(sprint.event_date, { day: '2-digit', month: 'long', year: 'numeric' })}</strong>).
              </Alert>
            )}
            {canUpload && (
              <Alert severity='success' icon={<i className='ri-upload-cloud-line' />}>
                Pengumpulan dokumen <strong>sedang dibuka</strong> — deadline{' '}
                <strong>{fmtDate(sprint.submission_deadline)}</strong>
                {daysLeft > 0 && ` (${daysLeft} hari lagi)`}.
                <LinearProgress
                  variant='determinate'
                  value={Math.max(0, 100 - (msLeft / (deadline - eventDate)) * 100)}
                  color='success'
                  sx={{ mt: 1, borderRadius: 2, height: 4 }}
                />
              </Alert>
            )}
            {isDeadlinePassed && (
              <Alert severity='warning' icon={<i className='ri-lock-line' />}>
                Batas pengumpulan dokumen sudah lewat. Dokumen tidak bisa ditambah atau dihapus.
              </Alert>
            )}
          </Grid>
        )}

        {/* ── Dokumen Penunjang Sprint ── */}
        {attachments.length > 0 && (
          <Grid item xs={12} md={5}>
            <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', overflow: 'hidden', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', px: 2, py: '12px', borderBottom: '0.5px solid rgba(180,100,100,0.1)' }}>
                <Box sx={{ width: 34, height: 34, borderRadius: '10px', background: 'linear-gradient(145deg, #E63946, #6D0E13)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className='ri-file-list-3-line' style={{ fontSize: '16px', color: '#fff' }} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#3B1010' }}>Dokumen Penunjang</Typography>
                  <Typography sx={{ fontSize: '10px', color: '#9A5A5A' }}>Dilampirkan admin sebagai referensi</Typography>
                </Box>
              </Box>
              <Box sx={{ p: 2 }}>
                <DocumentManager
                  documents={attachments}
                  onGetPresignedURL={handleAttachmentPresign}
                  canUpload={false}
                  canDelete={false}
                  emptyText='Tidak ada dokumen penunjang.'
                />
              </Box>
            </Box>
          </Grid>
        )}

        {/* ── Dokumen Kamu ── */}
        <Grid item xs={12} md={attachments.length > 0 ? 7 : 12}>
          <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', px: 2, py: '12px', borderBottom: '0.5px solid rgba(180,100,100,0.1)' }}>
              <Box sx={{ width: 34, height: 34, borderRadius: '10px', background: canUpload ? 'linear-gradient(145deg, #E63946, #6D0E13)' : '#F1EFE8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className={canUpload ? 'ri-upload-cloud-2-line' : 'ri-lock-line'} style={{ fontSize: '16px', color: canUpload ? '#fff' : '#9A5A5A' }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#3B1010' }}>Dokumen Kamu</Typography>
                <Typography sx={{ fontSize: '10px', color: '#9A5A5A' }}>
                  {canUpload ? 'Upload bukti keikutsertaan kamu' : isDeadlinePassed ? 'Batas waktu sudah lewat' : 'Pengumpulan belum dibuka'}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ p: 2 }}>
              <DocumentManager
                documents={myDocuments}
                onUpload={handleUpload}
                onDelete={handleDelete}
                onGetPresignedURL={handlePresign}
                canUpload={canUpload}
                canDelete={canUpload}
                uploadHint={canUpload ? `Deadline: ${fmtDate(sprint.submission_deadline)}` : ''}
                emptyText='Kamu belum mengupload dokumen apapun.'
              />
            </Box>
          </Box>
        </Grid>

      </Grid>

      <Snackbar open={toast.open} autoHideDuration={4000}
                onClose={() => setToast(t => ({ ...t, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity={toast.severity} variant='filled'
               onClose={() => setToast(t => ({ ...t, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  )
}

export default MySprintDetailView
