'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import { nimenSprintApi } from '@/libs/api/nimenSprintApi'

const CoordinatorSprintListView = () => {
  const router = useRouter()
  const [sprints, setSprints] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const showToast = useCallback((msg, severity = 'success') => {
    setToast({ open: true, message: msg, severity })
  }, [])

  const fetchSprints = useCallback(async () => {
    setLoading(true)
    try {
      // Ambil sprint dengan status DRAFT_PEJABAT yang koordinatornya adalah user ini
      const res = await nimenSprintApi.getAll({ status: 'DRAFT_PEJABAT', as_coordinator: true })
      setSprints(res.data.data.data || [])
    } catch (err) {
      showToast(err.message || 'Gagal memuat data', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { fetchSprints() }, [fetchSprints])

  return (
    <>
      <Card>
        <CardHeader
          title='Sprint Perlu Direview'
          subheader='Daftar sprint yang dikirim admin kepadamu untuk direview daftar pesertanya'
        />
        <Divider />
        {loading ? (
          <Box className='flex justify-center py-16'><CircularProgress /></Box>
        ) : sprints.length === 0 ? (
          <Box className='flex flex-col items-center justify-center py-16 gap-3' sx={{ color: 'text.secondary' }}>
            <i className='ri-checkbox-circle-line text-6xl opacity-30' />
            <Typography variant='body1'>Tidak ada sprint yang perlu direview saat ini</Typography>
            <Typography variant='body2'>Admin akan mengirim notifikasi Telegram saat ada sprint baru</Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>No. Sprint</TableCell>
                <TableCell>Kegiatan</TableCell>
                <TableCell>Angkatan</TableCell>
                <TableCell>Tanggal Kegiatan</TableCell>
                <TableCell>Kuota</TableCell>
                <TableCell align='center'>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sprints.map(sprint => (
                <TableRow key={sprint.id}>
                  <TableCell>
                    <Typography variant='body2' fontWeight={600} color='primary.main'>
                      {sprint.sprint_number}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2' fontWeight={600}>{sprint.title}</Typography>
                    {sprint.location && (
                      <Typography variant='caption' color='text.secondary'>
                        <i className='ri-map-pin-line mr-1' />{sprint.location}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip label={sprint.batch?.name || '-'} size='small' color='primary' variant='tonal' />
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2'>
                      {new Date(sprint.event_date).toLocaleDateString('id-ID', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={`${sprint.participant_quota} peserta`} size='small' variant='tonal' />
                  </TableCell>
                  <TableCell align='center'>
                    <Button
                      variant='contained'
                      size='small'
                      color='warning'
                      startIcon={<i className='ri-edit-box-line' />}
                      onClick={() => router.push(`/nimen/sprints/${sprint.id}/coordinator-review`)}
                    >
                      Review Peserta
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast(t => ({ ...t, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity={toast.severity} variant='filled' onClose={() => setToast(t => ({ ...t, open: false }))}>{toast.message}</Alert>
      </Snackbar>
    </>
  )
}

export default CoordinatorSprintListView
