'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import { nimenSprintApi } from '@/libs/api/nimenSprintApi'
import { getInitials } from '@/utils/getInitials'

const NimenSprintCoordinatorReviewView = ({ sprintId }) => {
  const router = useRouter()
  const [sprint, setSprint] = useState(null)
  const [participants, setParticipants] = useState([]) // daftar peserta saat ini (bisa dimodifikasi)
  const [availableStudents, setAvailableStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [note, setNote] = useState('')

  // Swap dialog
  const [swapOpen, setSwapOpen] = useState(false)
  const [swapTarget, setSwapTarget] = useState(null) // peserta yang akan diganti
  const [swapSearch, setSwapSearch] = useState('')
  const [swapLoading, setSwapLoading] = useState(false)

  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })
  const showToast = useCallback((msg, severity = 'success') => {
    setToast({ open: true, message: msg, severity })
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const [sprintRes, participantRes, availableRes] = await Promise.all([
        nimenSprintApi.getById(sprintId),
        nimenSprintApi.getParticipants(sprintId),
        nimenSprintApi.getAvailableStudents(sprintId),
      ])
      setSprint(sprintRes.data.data)
      setParticipants(participantRes.data.data || [])
      setAvailableStudents(availableRes.data.data || [])
    } catch (err) {
      showToast(err.message || 'Gagal memuat data', 'error')
    } finally {
      setLoading(false)
    }
  }, [sprintId, showToast])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Swap peserta ──
  const handleOpenSwap = useCallback((participant) => {
    setSwapTarget(participant)
    setSwapSearch('')
    setSwapOpen(true)
  }, [])

  const handleSwap = useCallback((newStudent) => {
    // Ganti peserta di state lokal (belum submit ke BE)
    setParticipants(prev => prev.map(p =>
      p.id === swapTarget.id
        ? { ...p, student_id: newStudent.student_id, student: { id: newStudent.student_id, full_name: newStudent.full_name, student_profile: { nim: newStudent.nim } } }
        : p
    ))
    // Pindahkan mahasiswa lama ke available, hapus mahasiswa baru dari available
    setAvailableStudents(prev => {
      const filtered = prev.filter(s => s.student_id !== newStudent.student_id)
      return [...filtered, {
        student_id: swapTarget.student_id,
        full_name: swapTarget.student?.full_name,
        nim: swapTarget.student?.student_profile?.nim,
      }]
    })
    setSwapOpen(false)
    setSwapTarget(null)
    showToast(`${swapTarget.student?.full_name} diganti dengan ${newStudent.full_name}`, 'info')
  }, [swapTarget, showToast])

  const handleSubmit = useCallback(async () => {
    setSubmitLoading(true)
    try {
      const studentIDs = participants.map(p => p.student_id)
      await nimenSprintApi.coordinatorSubmit(sprintId, {
        student_ids: studentIDs,
        note: note,
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

  if (loading) return <div className='flex justify-center py-20'><CircularProgress /></div>
  if (!sprint) return null

  return (
    <>
      <Grid container spacing={6}>

        {/* Header */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <div className='flex items-start justify-between gap-4'>
                <div>
                  <Typography variant='h5' className='mb-1'>Review Daftar Peserta</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    <i className='ri-file-list-3-line mr-1' />{sprint.sprint_number} — {sprint.title}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    <i className='ri-calendar-line mr-1' />
                    {new Date(sprint.event_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </Typography>
                </div>
                <Button variant='tonal' color='secondary' startIcon={<i className='ri-arrow-left-line' />}
                  onClick={() => router.back()}>
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
            Klik tombol <strong>Ganti</strong> pada baris peserta yang ingin diganti.
          </Alert>
        </Grid>

        {/* Tabel Peserta */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title={
                <div className='flex items-center gap-3'>
                  <span>Daftar Peserta</span>
                  <Chip label={`${participants.length} / ${sprint.participant_quota}`}
                    size='small' color='primary' variant='tonal' />
                </div>
              }
            />
            <Divider />
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width={50}>#</TableCell>
                  <TableCell>Nama</TableCell>
                  <TableCell>NIM</TableCell>
                  <TableCell>Sindikat</TableCell>
                  <TableCell align='center' width={100}>Ganti</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {participants.map((p, idx) => {
                  const student = p.student
                  const profile = student?.student_profile
                  return (
                    <TableRow key={p.id || idx}>
                      <TableCell>
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
                      <TableCell><Typography variant='body2'>{profile?.nim || '-'}</Typography></TableCell>
                      <TableCell><Typography variant='body2'>{profile?.syndicate?.name || '-'}</Typography></TableCell>
                      <TableCell align='center'>
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
          </Card>
        </Grid>

        {/* Catatan & Submit */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title='Catatan & Submit' subheader='Tambahkan catatan untuk admin sebelum submit (opsional)' />
            <Divider />
            <CardContent>
              <Grid container spacing={4} alignItems='flex-end'>
                <Grid item xs={12} md={8}>
                  <TextField fullWidth multiline rows={3}
                    label='Catatan untuk admin (opsional)'
                    placeholder='Contoh: Peserta nomor 3 diganti karena sedang tugas luar kota'
                    value={note}
                    onChange={e => setNote(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button fullWidth variant='contained' color='success' size='large'
                    onClick={handleSubmit} disabled={submitLoading}
                    startIcon={submitLoading ? <CircularProgress size={18} color='inherit' /> : <i className='ri-send-plane-line' />}>
                    {submitLoading ? 'Mengirim...' : 'Submit ke Admin'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Dialog Swap ── */}
      <Dialog open={swapOpen} onClose={() => setSwapOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>
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
            <Box className='flex flex-col items-center py-6 gap-2' sx={{ color: 'text.secondary' }}>
              <i className='ri-user-search-line text-4xl opacity-30' />
              <Typography variant='body2'>Tidak ada mahasiswa tersedia</Typography>
            </Box>
          ) : (
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Nama</TableCell>
                  <TableCell>NIM</TableCell>
                  <TableCell align='center'>Pilih</TableCell>
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
                    <TableCell align='center'>
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

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast(t => ({ ...t, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity={toast.severity} variant='filled' onClose={() => setToast(t => ({ ...t, open: false }))}>{toast.message}</Alert>
      </Snackbar>
    </>
  )
}

export default NimenSprintCoordinatorReviewView
