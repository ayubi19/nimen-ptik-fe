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
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Snackbar from '@mui/material/Snackbar'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { nimenSprintApi } from '@/libs/api/nimenSprintApi'
import { getInitials } from '@/utils/getInitials'

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  : '—'

const NimenSprintCoordinatorReviewView = ({ sprintId }) => {
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [sprint, setSprint]                   = useState(null)
  const [participants, setParticipants]       = useState([])
  const [availableStudents, setAvailableStudents] = useState([])
  const [loading, setLoading]                 = useState(true)
  const [submitLoading, setSubmitLoading]     = useState(false)
  const [note, setNote]                       = useState('')

  const [swapOpen, setSwapOpen]     = useState(false)
  const [swapTarget, setSwapTarget] = useState(null)
  const [swapSearch, setSwapSearch] = useState('')

  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })
  const showToast = useCallback((msg, severity = 'success') =>
    setToast({ open: true, message: msg, severity }), [])

  const fetchData = useCallback(async () => {
    try {
      const [reviewRes, availableRes] = await Promise.all([
        nimenSprintApi.getCoordinatorReview(sprintId),
        nimenSprintApi.getAvailableStudents(sprintId),
      ])
      const d = reviewRes.data.data
      setSprint({
        sprint_number:     d.sprint_number,
        title:             d.title,
        event_date:        d.event_date,
        participant_quota: d.participant_quota,
      })
      setParticipants(d.participants.map(p => ({
        id:         p.student_id,
        student_id: p.student_id,
        student: {
          id:         p.student_id,
          full_name:  p.full_name,
          student_profile: {
            nim:      p.nim,
            syndicate: p.syndicate_name ? { name: p.syndicate_name } : null,
          },
        },
        change_type: p.change_type,
      })))
      setAvailableStudents(availableRes.data.data || [])
    } catch (err) {
      showToast(err.message || 'Gagal memuat data', 'error')
    } finally {
      setLoading(false)
    }
  }, [sprintId, showToast])

  useEffect(() => { fetchData() }, [fetchData])

  const handleOpenSwap = useCallback((p) => {
    setSwapTarget(p)
    setSwapSearch('')
    setSwapOpen(true)
  }, [])

  const handleSwap = useCallback((newStudent) => {
    setParticipants(prev => prev.map(p =>
      p.id === swapTarget.id
        ? { ...p, student_id: newStudent.student_id, student: { id: newStudent.student_id, full_name: newStudent.full_name, student_profile: { nim: newStudent.nim } } }
        : p
    ))
    setAvailableStudents(prev => {
      const filtered = prev.filter(s => s.student_id !== newStudent.student_id)
      return [...filtered, {
        student_id: swapTarget.student_id,
        full_name:  swapTarget.student?.full_name,
        nim:        swapTarget.student?.student_profile?.nim,
      }]
    })
    setSwapOpen(false)
    showToast(`${swapTarget.student?.full_name} diganti dengan ${newStudent.full_name}`, 'info')
  }, [swapTarget, showToast])

  const handleSubmit = useCallback(async () => {
    setSubmitLoading(true)
    try {
      await nimenSprintApi.coordinatorSubmit(sprintId, {
        participant_ids: participants.map(p => p.student_id),
        note,
      })
      showToast('Revisi peserta berhasil disubmit ke admin')
      setTimeout(() => router.push(`/nimen/sprints/${sprintId}`), 1000)
    } catch (err) {
      showToast(err.message || 'Gagal submit revisi', 'error')
    } finally {
      setSubmitLoading(false)
    }
  }, [sprintId, participants, note, router, showToast])

  const filteredAvailable = availableStudents.filter(s =>
    s.full_name?.toLowerCase().includes(swapSearch.toLowerCase()) ||
    s.nim?.includes(swapSearch)
  )

  if (loading) return <Box className='flex justify-center py-20'><CircularProgress /></Box>
  if (!sprint) return null

  return (
    <>
      {/* Topbar PWA */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', mb: '14px' }}>
        <Box sx={{ width: 34, height: 34, borderRadius: '10px', background: 'rgba(255,255,255,0.72)', border: '0.5px solid rgba(180,100,100,0.18)', boxShadow: '0 3px 10px rgba(139,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', position: 'relative', overflow: 'hidden', '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)' } }} onClick={() => router.back()}>
          <i className='ri-arrow-left-s-line' style={{ fontSize: '20px', color: '#8B2020', position: 'relative', zIndex: 1 }} />
        </Box>
        <Box>
          <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>NIMEN › Sprint</Typography>
          <Typography sx={{ fontSize: '16px', fontWeight: 500, color: '#3B1010' }}>Review Koordinator</Typography>
        </Box>
      </Box>

      <Grid container spacing={4}>

        {/* Header — native */}
        <Grid item xs={12}>
          <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', p: '12px 14px' }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#3B1010', mb: '4px' }}>Review Daftar Peserta</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', mb: '4px' }}>
                  <Box sx={{ bgcolor: '#E6F1FB', borderRadius: '6px', px: '7px', py: '2px' }}>
                    <Typography sx={{ fontSize: '10px', fontWeight: 500, color: '#185FA5' }}>{sprint.sprint_number}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: '12px', color: '#9A5A5A' }} noWrap>{sprint.title}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <i className='ri-calendar-line' style={{ fontSize: '11px', color: '#9A5A5A' }} />
                  <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>{fmtDate(sprint.event_date)}</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Grid>

        {/* Petunjuk */}
        <Grid item xs={12}>
          <Alert severity='info' icon={<i className='ri-information-line' />}>
            Kamu dapat mengganti peserta dengan mahasiswa lain dari <strong>angkatan yang sama</strong>.
            Jumlah peserta tidak boleh berubah (<strong>{sprint.participant_quota} orang</strong>).
            Klik tombol <strong>Ganti</strong> pada peserta yang ingin diganti.
          </Alert>
        </Grid>

        {/* Daftar Peserta */}
        <Grid item xs={12}>
          <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', px: 2, py: '12px', borderBottom: '0.5px solid rgba(180,100,100,0.1)' }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#3B1010' }}>Daftar Peserta</Typography>
              <Box sx={{ bgcolor: '#E6F1FB', borderRadius: '6px', px: '8px', py: '3px' }}>
                <Typography sx={{ fontSize: '10px', fontWeight: 600, color: '#185FA5' }}>{participants.length} / {sprint.participant_quota}</Typography>
              </Box>
            </Box>

            {isMobile ? (
              <Box>
                {participants.map((p, idx) => {
                  const student = p.student
                  const profile = student?.student_profile
                  const isAdded = p.change_type === 'ADDED'
                  return (
                    <Box key={p.id || idx} sx={{ display: 'flex', alignItems: 'center', gap: '10px', px: 2, py: '12px', borderBottom: '0.5px solid rgba(180,100,100,0.08)', bgcolor: isAdded ? 'rgba(15,110,86,0.04)' : 'transparent' }}>
                      <Typography sx={{ fontSize: '10px', color: '#9A5A5A', width: 18, flexShrink: 0 }}>{idx + 1}</Typography>
                      <Box sx={{ width: 36, height: 36, borderRadius: '10px', flexShrink: 0, background: 'linear-gradient(145deg, #E63946, #6D0E13)', boxShadow: '0 3px 8px rgba(180,0,30,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.92)' }}>
                        {getInitials(student?.full_name || '')}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#3B1010', lineHeight: 1.3 }} noWrap>{student?.full_name}</Typography>
                        <Typography sx={{ fontSize: '10px', color: '#9A5A5A' }}>{profile?.nim || '—'}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        {isAdded && <Box sx={{ bgcolor: '#E1F5EE', borderRadius: '5px', px: '5px', py: '1px' }}><Typography sx={{ fontSize: '9px', fontWeight: 500, color: '#0F6E56' }}>Ditambah</Typography></Box>}
                        <Box component='button' onClick={() => handleOpenSwap(p)} sx={{ px: '8px', py: '4px', borderRadius: '7px', border: 'none', cursor: 'pointer', background: 'linear-gradient(145deg, #E63946, #6D0E13)', boxShadow: '0 2px 6px rgba(180,0,30,0.2)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <i className='ri-arrow-left-right-line' style={{ fontSize: '11px', color: '#fff' }} />
                          <Typography sx={{ fontSize: '10px', fontWeight: 600, color: '#fff' }}>Ganti</Typography>
                        </Box>
                      </Box>
                    </Box>
                  )
                })}
              </Box>
            ) : (
              // ── Desktop: Table ──
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    {['#', 'Nama', 'NIM', 'Sindikat', 'Perubahan', 'Aksi'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {participants.map((p, idx) => {
                    const student = p.student
                    const profile = student?.student_profile
                    return (
                      <TableRow key={p.id || idx} hover
                                sx={p.change_type === 'ADDED' ? { bgcolor: 'success.lighter' } : {}}>
                        <TableCell width={50}>
                          <Typography variant='body2' color='text.secondary'>{idx + 1}</Typography>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <Avatar sx={{ width: 32, height: 32, fontSize: 12 }}>
                              {getInitials(student?.full_name || '')}
                            </Avatar>
                            <Typography variant='body2' fontWeight={600}>{student?.full_name}</Typography>
                          </div>
                        </TableCell>
                        <TableCell><Typography variant='body2'>{profile?.nim || '—'}</Typography></TableCell>
                        <TableCell><Typography variant='body2'>{profile?.syndicate?.name || '—'}</Typography></TableCell>
                        <TableCell>
                          {p.change_type === 'ADDED'
                            ? <Chip label='Ditambah' color='success' size='small' variant='tonal' />
                            : p.change_type === 'REMOVED'
                              ? <Chip label='Dihapus' color='error' size='small' variant='tonal' />
                              : <Chip label='Original' color='default' size='small' variant='tonal' />
                          }
                        </TableCell>
                        <TableCell>
                          <Button size='small' variant='tonal' color='warning'
                                  startIcon={<i className='ri-swap-line' />}
                                  onClick={() => handleOpenSwap(p)}>
                            Ganti
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </Box>
        </Grid>

        {/* Catatan & Submit */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title='Catatan & Submit'
                        subheader='Tambahkan catatan untuk admin sebelum submit (opsional)' />
            <Divider />
            <CardContent>
              <div className='flex flex-col gap-4'>
                <TextField fullWidth multiline rows={3}
                           label='Catatan untuk admin (opsional)'
                           placeholder='Contoh: Peserta nomor 3 diganti karena sedang tugas luar kota'
                           value={note}
                           onChange={e => setNote(e.target.value)}
                />
                <Button fullWidth variant='contained' color='success'
                        size={isMobile ? 'large' : 'medium'}
                        onClick={handleSubmit} disabled={submitLoading}
                        startIcon={submitLoading
                          ? <CircularProgress size={18} color='inherit' />
                          : <i className='ri-send-plane-line' />}>
                  {submitLoading ? 'Mengirim...' : 'Submit ke Admin'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Dialog Ganti Peserta ── */}
      <Dialog open={swapOpen} onClose={() => setSwapOpen(false)}
              maxWidth='sm' fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ pb: 1 }}>
          <div className='flex items-center justify-between'>
            <div>
              <Typography variant='h6'>Ganti Peserta</Typography>
              <Typography variant='caption' color='text.secondary'>
                Mengganti: <strong>{swapTarget?.student?.full_name}</strong>
              </Typography>
            </div>
            <IconButton onClick={() => setSwapOpen(false)}><i className='ri-close-line' /></IconButton>
          </div>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <TextField fullWidth size='small' className='mb-4'
                     placeholder='Cari nama atau NIM...'
                     value={swapSearch}
                     onChange={e => setSwapSearch(e.target.value)}
                     InputProps={{ startAdornment: <InputAdornment position='start'><i className='ri-search-line' /></InputAdornment> }}
          />
          {filteredAvailable.length === 0 ? (
            <Box className='flex flex-col items-center py-8 gap-2' sx={{ color: 'text.secondary' }}>
              <i className='ri-user-search-line text-4xl opacity-30' />
              <Typography variant='body2'>Tidak ada mahasiswa tersedia</Typography>
            </Box>
          ) : isMobile ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredAvailable.map(s => (
                <Box key={s.student_id} onClick={() => handleSwap(s)} sx={{ display: 'flex', alignItems: 'center', gap: '10px', p: '10px 12px', borderRadius: '10px', border: '0.5px solid rgba(180,100,100,0.15)', cursor: 'pointer', bgcolor: '#fff', '&:active': { opacity: 0.7 } }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: '10px', flexShrink: 0, background: 'linear-gradient(145deg, #E63946, #6D0E13)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.92)' }}>
                    {getInitials(s.full_name || '')}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#3B1010' }} noWrap>{s.full_name}</Typography>
                    <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>{s.nim}</Typography>
                  </Box>
                  <i className='ri-arrow-right-s-line' style={{ fontSize: '16px', color: '#9A5A5A', opacity: 0.5 }} />
                </Box>
              ))}
            </Box>
          ) : (
            // Desktop: table
            <Table size='small'>
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  {['Nama', 'NIM', 'Aksi'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAvailable.map(s => (
                  <TableRow key={s.student_id} hover>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Avatar sx={{ width: 28, height: 28, fontSize: 11 }}>
                          {getInitials(s.full_name || '')}
                        </Avatar>
                        <Typography variant='body2'>{s.full_name}</Typography>
                      </div>
                    </TableCell>
                    <TableCell><Typography variant='body2'>{s.nim}</Typography></TableCell>
                    <TableCell>
                      <Button size='small' variant='contained' onClick={() => handleSwap(s)}>
                        Pilih
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
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

export default NimenSprintCoordinatorReviewView
