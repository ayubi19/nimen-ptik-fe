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
      {/* Breadcrumb */}
      <div className='flex items-center gap-2 mb-6'>
        <Typography variant='caption' color='text.secondary'>NIMEN › Sprint</Typography>
        <i className='ri-arrow-right-s-line text-sm opacity-50' />
        <Typography variant='caption' fontWeight={500} color='text.primary'>Review Koordinator</Typography>
      </div>

      <Grid container spacing={4}>

        {/* Header */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <div className='flex items-start justify-between gap-2'>
                <div className='flex-1 min-w-0'>
                  <Typography variant='h6' fontWeight={700} className='mb-1'>Review Daftar Peserta</Typography>
                  <div className='flex items-center gap-2 flex-wrap'>
                    <Chip label={sprint.sprint_number} size='small' color='primary' variant='tonal' />
                    <Typography variant='body2' color='text.secondary' noWrap>{sprint.title}</Typography>
                  </div>
                  <Typography variant='caption' color='text.secondary' sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <i className='ri-calendar-line' />{fmtDate(sprint.event_date)}
                  </Typography>
                </div>
                <Button variant='tonal' color='secondary' size='small'
                        startIcon={<i className='ri-arrow-left-line' />}
                        onClick={() => router.back()}
                        sx={{ flexShrink: 0 }}>
                  Batal
                </Button>
              </div>
            </CardContent>
          </Card>
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
          <Card>
            <CardHeader
              title={
                <div className='flex items-center gap-2'>
                  <span>Daftar Peserta</span>
                  <Chip label={`${participants.length} / ${sprint.participant_quota}`}
                        size='small' color='primary' variant='tonal' />
                </div>
              }
            />
            <Divider />

            {isMobile ? (
              // ── Mobile: Card List ──
              <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {participants.map((p, idx) => {
                  const student = p.student
                  const profile = student?.student_profile
                  return (
                    <Card key={p.id || idx} variant='outlined'
                          sx={p.change_type === 'ADDED' ? { borderColor: 'success.main', bgcolor: 'success.lighter' } : {}}>
                      <CardContent sx={{ p: '12px !important' }}>
                        <div className='flex items-center gap-2'>
                          <Typography variant='caption' color='text.secondary' sx={{ width: 20, flexShrink: 0 }}>
                            {idx + 1}
                          </Typography>
                          <Avatar sx={{ width: 36, height: 36, fontSize: 13, flexShrink: 0 }}>
                            {getInitials(student?.full_name || '')}
                          </Avatar>
                          <div className='flex-1 min-w-0'>
                            <Typography variant='body2' fontWeight={600} noWrap>{student?.full_name}</Typography>
                            <Typography variant='caption' color='text.secondary'>{profile?.nim || '—'}</Typography>
                          </div>
                          <Chip
                            label={p.change_type === 'ADDED' ? 'Ditambah' : p.change_type === 'REMOVED' ? 'Dihapus' : 'Original'}
                            color={p.change_type === 'ADDED' ? 'success' : p.change_type === 'REMOVED' ? 'error' : 'default'}
                            size='small' variant='tonal' sx={{ flexShrink: 0 }}
                          />
                        </div>
                        <Box className='mt-2'>
                          <Button fullWidth size='small' variant='tonal' color='warning'
                                  startIcon={<i className='ri-arrow-left-right-line' />}
                                  onClick={() => handleOpenSwap(p)}>
                            Ganti Peserta Ini
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
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
          </Card>
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
            // Mobile: card list
            <div className='flex flex-col gap-2'>
              {filteredAvailable.map(s => (
                <Box key={s.student_id}
                     onClick={() => handleSwap(s)}
                     sx={{
                       display: 'flex', alignItems: 'center', gap: 2, p: 1.5,
                       borderRadius: 2, border: 1, borderColor: 'divider',
                       cursor: 'pointer', '&:active': { bgcolor: 'action.selected' }
                     }}>
                  <Avatar sx={{ width: 36, height: 36, fontSize: 13, flexShrink: 0 }}>
                    {getInitials(s.full_name || '')}
                  </Avatar>
                  <div className='flex-1 min-w-0'>
                    <Typography variant='body2' fontWeight={600} noWrap>{s.full_name}</Typography>
                    <Typography variant='caption' color='text.secondary'>{s.nim}</Typography>
                  </div>
                  <i className='ri-arrow-right-line opacity-40' />
                </Box>
              ))}
            </div>
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
