'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import { nimenSprintApi } from '@/libs/api/nimenSprintApi'
import { nimenAttachmentApi, nimenParticipantDocApi } from '@/libs/api/nimenDocumentApi'
import DocumentManager from '@/components/nimen/DocumentManager'

const MySprintDetailView = ({ sprintId }) => {
  const router = useRouter()
  const [sprint, setSprint] = useState(null)
  const [attachments, setAttachments] = useState([])
  const [myDocData, setMyDocData] = useState({ participant: null, documents: [] })
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const showToast = useCallback((message, severity = 'success') => {
    setToast({ open: true, message, severity })
  }, [])

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

  // Upload dokumen mahasiswa
  const handleUpload = useCallback(async (file) => {
    await nimenParticipantDocApi.upload(sprintId, file)
    showToast('Dokumen berhasil diupload')
    fetchData()
  }, [sprintId, fetchData, showToast])

  // Hapus dokumen mahasiswa
  const handleDelete = useCallback(async (docId) => {
    await nimenParticipantDocApi.delete(sprintId, docId)
    showToast('Dokumen berhasil dihapus')
    fetchData()
  }, [sprintId, fetchData, showToast])

  // Presign dokumen mahasiswa
  const handlePresign = useCallback(async (docId) => {
    return nimenParticipantDocApi.getPresignedURL(sprintId, docId)
  }, [sprintId])

  // Presign attachment sprint
  const handleAttachmentPresign = useCallback(async (attachId) => {
    return nimenAttachmentApi.getPresignedURL(sprintId, attachId)
  }, [sprintId])

  if (loading) return <Box className='flex justify-center py-20'><CircularProgress /></Box>
  if (!sprint) return null

  const now = new Date()
  const eventDate = new Date(sprint.event_date)
  const deadline = new Date(sprint.submission_deadline)
  const isActive = sprint.status === 'ACTIVE'
  const canUpload = isActive && now >= eventDate && now <= deadline
  const isDeadlinePassed = now > deadline
  const isBeforeEvent = now < eventDate

  const participant = myDocData?.participant
  const myDocuments = myDocData?.documents || []

  return (
    <>
      <Grid container spacing={6}>

        {/* Info Sprint */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <div className='flex items-start justify-between gap-4 flex-wrap'>
                <div>
                  <Typography variant='h5' className='mb-1'>{sprint.title}</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    <i className='ri-file-list-3-line mr-1' />{sprint.sprint_number}
                  </Typography>
                  <Typography variant='body2' color='text.secondary' className='mt-1'>
                    <i className='ri-calendar-line mr-1' />
                    {eventDate.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                  </Typography>
                  {sprint.location && (
                    <Typography variant='body2' color='text.secondary'>
                      <i className='ri-map-pin-line mr-1' />{sprint.location}
                    </Typography>
                  )}
                </div>
                <div className='flex flex-col items-end gap-2'>
                  <Chip
                    label={sprint.indicator?.value >= 0 ? `+${sprint.indicator?.value}` : `${sprint.indicator?.value}`}
                    color={sprint.indicator?.value >= 0 ? 'success' : 'error'}
                    sx={{ fontWeight: 700, fontSize: 16, height: 36 }}
                  />
                  {participant && (
                    <Chip
                      label={participant.approval_status === 'VALID' ? 'Nilai Valid' :
                             participant.approval_status === 'DISPENSED' ? 'Dispensasi' :
                             participant.approval_status === 'REJECTED_NO_DOC' ? 'Dokumen Kurang' :
                             participant.approval_status === 'REJECTED_PUNISHMENT' ? 'Punishment' : 'Menunggu'}
                      color={participant.approval_status === 'VALID' || participant.approval_status === 'DISPENSED' ? 'success' :
                             participant.approval_status?.startsWith('REJECTED') ? 'error' : 'warning'}
                      size='small'
                      variant='tonal'
                    />
                  )}
                  <Button variant='tonal' color='secondary' size='small'
                    startIcon={<i className='ri-arrow-left-line' />}
                    onClick={() => router.push('/nimen/my-sprints')}>
                    Kembali
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>

        {/* Info Batas Waktu */}
        {isActive && (
          <Grid item xs={12}>
            {isBeforeEvent && (
              <Alert severity='info' icon={<i className='ri-time-line' />}>
                Pengumpulan dokumen dibuka setelah tanggal kegiatan (<strong>{eventDate.toLocaleDateString('id-ID')}</strong>).
              </Alert>
            )}
            {canUpload && (
              <Alert severity='success' icon={<i className='ri-upload-cloud-line' />}>
                Pengumpulan dokumen <strong>sedang dibuka</strong> sampai{' '}
                <strong>{deadline.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>.
              </Alert>
            )}
            {isDeadlinePassed && (
              <Alert severity='warning' icon={<i className='ri-lock-line' />}>
                Batas pengumpulan dokumen sudah lewat. Dokumen tidak bisa ditambah atau dihapus.
              </Alert>
            )}
          </Grid>
        )}

        {/* Dokumen Penunjang Sprint (dari admin) */}
        {attachments.length > 0 && (
          <Grid item xs={12} md={5}>
            <Card className='h-full'>
              <CardHeader
                title='Dokumen Penunjang Sprint'
                subheader='Dokumen yang dilampirkan admin sebagai referensi'
                titleTypographyProps={{ variant: 'subtitle1' }}
              />
              <Divider />
              <CardContent>
                <DocumentManager
                  documents={attachments}
                  onGetPresignedURL={handleAttachmentPresign}
                  canUpload={false}
                  canDelete={false}
                  emptyText='Tidak ada dokumen penunjang.'
                />
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Dokumen Peserta (upload mahasiswa) */}
        <Grid item xs={12} md={attachments.length > 0 ? 7 : 12}>
          <Card>
            <CardHeader
              title='Dokumen Kamu'
              subheader={canUpload
                ? 'Upload bukti keikutsertaan kamu di sprint ini'
                : isDeadlinePassed
                  ? 'Batas waktu sudah lewat'
                  : 'Pengumpulan belum dibuka'
              }
              titleTypographyProps={{ variant: 'subtitle1' }}
            />
            <Divider />
            <CardContent>
              <DocumentManager
                documents={myDocuments}
                onUpload={handleUpload}
                onDelete={handleDelete}
                onGetPresignedURL={handlePresign}
                canUpload={canUpload}
                canDelete={canUpload}
                uploadHint={canUpload ? `Deadline: ${deadline.toLocaleDateString('id-ID')}` : ''}
                emptyText='Kamu belum mengupload dokumen apapun.'
              />
            </CardContent>
          </Card>
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
