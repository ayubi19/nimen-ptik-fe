'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Snackbar from '@mui/material/Snackbar'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { nimenSprintApi } from '@/libs/api/nimenSprintApi'
import { nimenParticipantDocApi } from '@/libs/api/nimenDocumentApi'
import { getInitials } from '@/utils/getInitials'
import DocumentManager from '@/components/nimen/DocumentManager'

const DECISION_OPTIONS = [
  { value: 'VALID',               label: 'Terima — Nilai Masuk',          color: 'success' },
  { value: 'DISPENSED',           label: 'Dispensasi — Nilai Masuk',      color: 'info'    },
  { value: 'REJECTED_NO_DOC',     label: 'Tolak — Dokumen Tidak Lengkap', color: 'error'   },
  { value: 'REJECTED_PUNISHMENT', label: 'Tolak — Punishment Aktif',      color: 'error'   },
]

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—'

// ── Mobile Card — PWA native ─────────────────────────────────────────────────
const ParticipantMobileCard = ({ item, showKendala, onViewDocs, onManual }) => (
  <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', p: '12px', mb: '10px' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', mb: '8px' }}>
      <Box sx={{ width: 38, height: 38, borderRadius: '10px', flexShrink: 0, background: 'linear-gradient(145deg, #E63946, #6D0E13)', boxShadow: '0 3px 8px rgba(180,0,30,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.92)' }}>
        {getInitials(item.student_name)}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#3B1010', lineHeight: 1.3 }} noWrap>{item.student_name}</Typography>
        <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>{item.nim}</Typography>
      </Box>
      <Box sx={{ bgcolor: item.document_submitted ? '#E1F5EE' : '#FCEBEB', borderRadius: '6px', px: '7px', py: '2px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '3px' }}>
        <i className={item.document_submitted ? 'ri-checkbox-circle-line' : 'ri-close-circle-line'} style={{ fontSize: '11px', color: item.document_submitted ? '#0F6E56' : '#A32D2D' }} />
        <Typography sx={{ fontSize: '10px', fontWeight: 500, color: item.document_submitted ? '#0F6E56' : '#A32D2D' }}>{item.document_count} file</Typography>
      </Box>
    </Box>
    {showKendala && (
      <Box sx={{ bgcolor: '#FCEBEB', borderRadius: '8px', p: '8px', mb: '8px' }}>
        <Typography sx={{ fontSize: '11px', color: '#A32D2D', fontWeight: 500 }}>
          <i className='ri-error-warning-line' /> {item.block_reason}
        </Typography>
        {item.has_active_punishment && (
          <Typography sx={{ fontSize: '10px', color: '#9A5A5A', mt: '2px' }}>Punishment s/d {fmtDate(item.punishment_end_date)}</Typography>
        )}
      </Box>
    )}
    <Box sx={{ display: 'flex', gap: '6px' }}>
      {item.document_count > 0 && (
        <Box component='button' onClick={() => onViewDocs(item)} sx={{ flex: 1, py: '6px', borderRadius: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.72)', border: '0.5px solid rgba(180,100,100,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          <i className='ri-folder-open-line' style={{ fontSize: '12px', color: '#185FA5' }} />
          <Typography sx={{ fontSize: '11px', fontWeight: 500, color: '#3B1010' }}>Dokumen</Typography>
        </Box>
      )}
      <Box component='button' onClick={() => onManual(item)} sx={{ flex: 1, py: '6px', borderRadius: '8px', cursor: 'pointer', background: showKendala ? 'linear-gradient(145deg, #E63946, #6D0E13)' : 'rgba(255,255,255,0.72)', border: showKendala ? 'none' : '0.5px solid rgba(180,100,100,0.18)', boxShadow: showKendala ? '0 3px 8px rgba(180,0,30,0.2)' : '0 2px 6px rgba(139,0,0,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
        <i className={showKendala ? 'ri-edit-box-line' : 'ri-settings-3-line'} style={{ fontSize: '12px', color: showKendala ? '#fff' : '#444441' }} />
        <Typography sx={{ fontSize: '11px', fontWeight: showKendala ? 600 : 500, color: showKendala ? '#fff' : '#3B1010' }}>{showKendala ? 'Putuskan' : 'Manual'}</Typography>
      </Box>
    </Box>
  </Box>
)

// ── Main View ─────────────────────────────────────────────────────────────────
const NimenSprintApprovalView = ({ sprintId }) => {
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [summary, setSummary]         = useState(null)
  const [loading, setLoading]         = useState(true)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const [manualOpen, setManualOpen]       = useState(false)
  const [manualTarget, setManualTarget]   = useState(null)
  const [manualDecision, setManualDecision] = useState('')
  const [manualReason, setManualReason]   = useState('')
  const [manualLoading, setManualLoading] = useState(false)

  const [docOpen, setDocOpen]     = useState(false)
  const [docTarget, setDocTarget] = useState(null)
  const [docs, setDocs]           = useState([])
  const [docLoading, setDocLoading] = useState(false)

  const showToast = useCallback((message, severity = 'success') =>
    setToast({ open: true, message, severity }), [])

  const fetchSummary = useCallback(async () => {
    setLoading(true)
    try {
      const res = await nimenSprintApi.getApprovalSummary(sprintId)
      setSummary(res.data.data)
    } catch (err) {
      // 409 = sprint sudah tidak ACTIVE (selesai di-approve / status berubah)
      // Redirect ke detail sprint agar tidak stuck di halaman yang tidak bisa diakses
      if (err?.message?.includes('harus berstatus') || err?.message?.includes('sudah diproses')) {
        showToast('Sprint sudah selesai diproses, kembali ke detail sprint', 'info')
        setTimeout(() => router.push(`/nimen/sprints/${sprintId}`), 1500)
        return
      }
      showToast(err.message || 'Gagal memuat data', 'error')
    } finally {
      setLoading(false)
    }
  }, [sprintId, showToast, router])

  useEffect(() => { fetchSummary() }, [fetchSummary])

  const handleBulkApprove = useCallback(async () => {
    setBulkLoading(true)
    try {
      const res = await nimenSprintApi.bulkApprove(sprintId)
      showToast(`${res.data.data.approved} peserta berhasil di-approve`)
      fetchSummary()
    } catch (err) {
      showToast(err.message || 'Gagal bulk approve', 'error')
    } finally {
      setBulkLoading(false)
    }
  }, [sprintId, fetchSummary, showToast])

  const handleOpenManual = useCallback((item) => {
    setManualTarget(item)
    setManualDecision(!item.document_submitted ? 'REJECTED_NO_DOC' : item.has_active_punishment ? 'REJECTED_PUNISHMENT' : '')
    setManualReason('')
    setManualOpen(true)
  }, [])

  const handleManualSubmit = useCallback(async () => {
    if (!manualDecision) { showToast('Pilih keputusan terlebih dahulu', 'error'); return }
    if ((manualDecision === 'DISPENSED' || manualDecision.startsWith('REJECTED')) && !manualReason) {
      showToast('Alasan wajib diisi', 'error'); return
    }
    setManualLoading(true)
    try {
      await nimenSprintApi.approveParticipant(sprintId, {
        participant_id: manualTarget.participant_id,
        decision: manualDecision,
        reason: manualReason,
      })
      showToast('Peserta berhasil diproses')
      setManualOpen(false)
      fetchSummary()
    } catch (err) {
      showToast(err.message || 'Gagal memproses peserta', 'error')
    } finally {
      setManualLoading(false)
    }
  }, [sprintId, manualTarget, manualDecision, manualReason, fetchSummary, showToast])

  const handleViewDocs = useCallback(async (item) => {
    setDocTarget(item)
    setDocLoading(true)
    setDocOpen(true)
    try {
      const res = await nimenParticipantDocApi.getParticipantDocuments(sprintId, item.student_id)
      setDocs(res.data.data?.documents || [])
    } catch { setDocs([]) }
    finally { setDocLoading(false) }
  }, [sprintId])

  const handleGetPresignedURL = useCallback(async (docId) =>
      nimenParticipantDocApi.getParticipantDocPresignedURL(sprintId, docTarget?.student_id, docId),
    [sprintId, docTarget])

  if (loading) return <Box className='flex justify-center py-20'><CircularProgress /></Box>
  if (!summary) return null

  const totalPending = (summary.auto_approve?.length || 0) + (summary.needs_action?.length || 0)
  const allProcessed = totalPending === 0

  const renderParticipants = (items, showKendala) => {
    if (isMobile) return (
      <Box sx={{ p: 2 }}>
        {items.map(item => (
          <ParticipantMobileCard
            key={item.participant_id}
            item={item}
            showKendala={showKendala}
            onViewDocs={handleViewDocs}
            onManual={handleOpenManual}
          />
        ))}
      </Box>
    )

    return (
      <Table size='small'>
        <TableHead>
          <TableRow sx={{ bgcolor: 'action.hover' }}>
            {(showKendala
                ? ['Peserta', 'NIM', 'Kendala', 'Dokumen', 'Aksi']
                : ['Peserta', 'NIM', 'Dokumen', 'Aksi']
            ).map(h => (
              <TableCell key={h} sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                {h}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map(item => (
            <TableRow key={item.participant_id} hover>
              <TableCell>
                <div className='flex items-center gap-2'>
                  <Avatar sx={{ width: 30, height: 30, fontSize: 11 }}>{getInitials(item.student_name)}</Avatar>
                  <Typography variant='body2' fontWeight={600}>{item.student_name}</Typography>
                </div>
              </TableCell>
              <TableCell><Typography variant='body2'>{item.nim}</Typography></TableCell>
              {showKendala && (
                <TableCell>
                  <Typography variant='caption' color='error.main'>
                    <i className='ri-error-warning-line mr-1' />{item.block_reason}
                  </Typography>
                  {item.has_active_punishment && (
                    <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                      s/d {fmtDate(item.punishment_end_date)}
                    </Typography>
                  )}
                </TableCell>
              )}
              <TableCell align='center'>
                <Chip
                  label={`${item.document_count} file`}
                  size='small'
                  color={item.document_submitted ? 'success' : 'error'}
                  variant='tonal'
                />
              </TableCell>
              <TableCell align='center'>
                <div className='flex justify-center gap-1'>
                  {item.document_count > 0 && (
                    <Tooltip title='Lihat dokumen'>
                      <IconButton size='small' onClick={() => handleViewDocs(item)}>
                        <i className='ri-folder-open-line text-[18px]' />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title={showKendala ? 'Beri keputusan' : 'Proses manual'}>
                    <IconButton size='small' color={showKendala ? 'warning' : 'default'} onClick={() => handleOpenManual(item)}>
                      <i className={`${showKendala ? 'ri-edit-box-line' : 'ri-settings-3-line'} text-[18px]`} />
                    </IconButton>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  return (
    <>
      {/* Topbar PWA */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', mb: '14px' }}>
        <Box sx={{ width: 34, height: 34, borderRadius: '10px', background: 'rgba(255,255,255,0.72)', border: '0.5px solid rgba(180,100,100,0.18)', boxShadow: '0 3px 10px rgba(139,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', position: 'relative', overflow: 'hidden', '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)' } }} onClick={() => router.push(`/nimen/sprints/${sprintId}`)}>
          <i className='ri-arrow-left-s-line' style={{ fontSize: '20px', color: '#8B2020', position: 'relative', zIndex: 1 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>NIMEN › Sprint</Typography>
          <Typography sx={{ fontSize: '16px', fontWeight: 500, color: '#3B1010' }}>Approval Sprint</Typography>
        </Box>
        {!allProcessed && summary.auto_approve?.length > 0 && (
          <Box component='button' onClick={handleBulkApprove} disabled={bulkLoading} sx={{ display: 'flex', alignItems: 'center', gap: '5px', px: '10px', py: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'linear-gradient(145deg, #0F6E56, #0a4a3a)', boxShadow: '0 3px 8px rgba(15,110,86,0.25)' }}>
            {bulkLoading ? <CircularProgress size={12} sx={{ color: '#fff' }} /> : <i className='ri-check-double-line' style={{ fontSize: '13px', color: '#fff' }} />}
            <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#fff' }}>{bulkLoading ? '...' : `Setujui ${summary.auto_approve.length}`}</Typography>
          </Box>
        )}
      </Box>

      {/* Sprint info card */}
      <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', p: '12px 14px', mb: '10px' }}>
        <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#3B1010', mb: '4px' }}>{summary.sprint_number} — {summary.title}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Box sx={{ bgcolor: summary.is_positive ? '#E1F5EE' : '#FCEBEB', borderRadius: '6px', px: '8px', py: '3px' }}>
            <Typography sx={{ fontSize: '11px', fontWeight: 700, color: summary.is_positive ? '#0F6E56' : '#A32D2D' }}>
              {summary.indicator_value >= 0 ? `+${summary.indicator_value}` : `${summary.indicator_value}`}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>
            {totalPending} menunggu · {summary.auto_approve?.length || 0} siap diapprove
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={4}>

        {/* Spacer for grid structure */}
        <Grid item xs={12} sx={{ display: 'none' }} />

        {allProcessed && (
          <Grid item xs={12}>
            <Alert severity='success' icon={<i className='ri-checkbox-circle-line' />}>
              Semua peserta sudah diproses. Sprint akan otomatis ditutup.
            </Alert>
          </Grid>
        )}

        {/* Siap Diapprove */}
        {summary.auto_approve?.length > 0 && (
          <Grid item xs={12}>
            <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: '10px', borderBottom: '0.5px solid rgba(180,100,100,0.1)' }}>
                <Box>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#3B1010' }}>Siap Diapprove</Typography>
                  <Typography sx={{ fontSize: '10px', color: '#9A5A5A' }}>Dokumen lengkap, tidak sedang punishment</Typography>
                </Box>
                <Box sx={{ bgcolor: '#E1F5EE', borderRadius: '6px', px: '8px', py: '3px' }}>
                  <Typography sx={{ fontSize: '10px', fontWeight: 600, color: '#0F6E56' }}>{summary.auto_approve.length}</Typography>
                </Box>
              </Box>
              {renderParticipants(summary.auto_approve, false)}
            </Box>
          </Grid>
        )}

        {/* Butuh Keputusan Manual */}
        {summary.needs_action?.length > 0 && (
          <Grid item xs={12}>
            <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: '10px', borderBottom: '0.5px solid rgba(180,100,100,0.1)' }}>
                <Box>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#3B1010' }}>Butuh Keputusan Manual</Typography>
                  <Typography sx={{ fontSize: '10px', color: '#9A5A5A' }}>Dokumen tidak ada / masa hukuman</Typography>
                </Box>
                <Box sx={{ bgcolor: '#FAEEDA', borderRadius: '6px', px: '8px', py: '3px' }}>
                  <Typography sx={{ fontSize: '10px', fontWeight: 600, color: '#BA7517' }}>{summary.needs_action.length}</Typography>
                </Box>
              </Box>
              {renderParticipants(summary.needs_action, true)}
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Dialog Manual Approval */}
      <Dialog open={manualOpen} onClose={() => setManualOpen(false)} maxWidth='sm' fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ pb: 1 }}>
          <div className='flex items-center justify-between'>
            <div>
              <Typography variant='h6'>Keputusan Manual</Typography>
              <Typography variant='caption' color='text.secondary'>{manualTarget?.student_name}</Typography>
            </div>
            <IconButton onClick={() => setManualOpen(false)}><i className='ri-close-line' /></IconButton>
          </div>
        </DialogTitle>
        <Divider />
        <DialogContent className='flex flex-col gap-4 pt-4'>
          {manualTarget?.has_active_punishment && (
            <Alert severity='warning'>
              Sedang dalam masa hukuman sampai <strong>{fmtDate(manualTarget.punishment_end_date)}</strong>.
              Pilih <em>Dispensasi</em> jika ingin tetap memberikan nilai.
            </Alert>
          )}
          {!manualTarget?.document_submitted && (
            <Alert severity='error'>Mahasiswa tidak mengumpulkan dokumen.</Alert>
          )}
          <FormControl fullWidth>
            <InputLabel>Keputusan</InputLabel>
            <Select label='Keputusan' value={manualDecision} onChange={e => setManualDecision(e.target.value)}>
              {DECISION_OPTIONS.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>
                  <Chip label={opt.label} color={opt.color} size='small' variant='tonal' sx={{ pointerEvents: 'none' }} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField fullWidth multiline rows={3}
                     label={manualDecision === 'DISPENSED' ? 'Alasan dispensasi (wajib)'
                       : manualDecision?.startsWith('REJECTED') ? 'Alasan penolakan (wajib)'
                         : 'Catatan (opsional)'}
                     value={manualReason}
                     onChange={e => setManualReason(e.target.value)}
          />
        </DialogContent>
        <Divider />
        <DialogActions className='p-4 gap-2'>
          <Button variant='tonal' color='secondary' onClick={() => setManualOpen(false)} disabled={manualLoading}>
            Batal
          </Button>
          <Button variant='contained'
                  color={manualDecision === 'VALID' || manualDecision === 'DISPENSED' ? 'success' : 'error'}
                  onClick={handleManualSubmit}
                  disabled={manualLoading || !manualDecision}
                  startIcon={manualLoading ? <CircularProgress size={16} color='inherit' /> : null}>
            {manualLoading ? 'Menyimpan...' : 'Konfirmasi'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Lihat Dokumen */}
      <Dialog open={docOpen} onClose={() => setDocOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle sx={{ pr: 6 }}>
          Dokumen — {docTarget?.student_name}
          <IconButton sx={{ position: 'absolute', right: 8, top: 8 }} onClick={() => setDocOpen(false)}>
            <i className='ri-close-line' />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <DocumentManager
            documents={docs}
            onGetPresignedURL={handleGetPresignedURL}
            canUpload={false}
            canDelete={false}
            loading={docLoading}
            emptyText='Tidak ada dokumen yang diupload.'
          />
        </DialogContent>
      </Dialog>

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

export default NimenSprintApprovalView
