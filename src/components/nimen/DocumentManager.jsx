'use client'

import { useCallback, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'

const MAX_FILES = 10
const MAX_SIZE_MB = 10
const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'xlsx', 'jpg', 'jpeg', 'png', 'webp']
const VIEWABLE_TYPES = ['pdf', 'jpg', 'jpeg', 'png', 'webp']
const IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'webp']

const FILE_ICONS = {
  pdf:  { icon: 'ri-file-pdf-2-line',  color: '#e53935' },
  docx: { icon: 'ri-file-word-line',   color: '#1976d2' },
  xlsx: { icon: 'ri-file-excel-line',  color: '#388e3c' },
  jpg:  { icon: 'ri-image-line',       color: '#f57c00' },
  jpeg: { icon: 'ri-image-line',       color: '#f57c00' },
  png:  { icon: 'ri-image-line',       color: '#f57c00' },
  webp: { icon: 'ri-image-line',       color: '#f57c00' },
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * DocumentManager — komponen reusable untuk upload, tampil, dan preview dokumen
 *
 * Props:
 * - documents: array dokumen yang sudah ada
 * - onUpload(file): async fn → dipanggil saat user upload file
 * - onDelete(docId): async fn → dipanggil saat user hapus file
 * - onGetPresignedURL(docId): async fn → return { data: { data: { url } } }
 * - canUpload: boolean — apakah user boleh upload
 * - canDelete: boolean — apakah user boleh hapus
 * - uploadHint: string — teks petunjuk di bawah tombol upload
 * - emptyText: string — teks saat tidak ada dokumen
 */
const DocumentManager = ({
                           documents = [],
                           onUpload,
                           onDelete,
                           onGetPresignedURL,
                           canUpload = false,
                           canDelete = false,
                           uploadHint = '',
                           emptyText = 'Belum ada dokumen.',
                           loading = false,
                         }) => {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerURL, setViewerURL] = useState('')
  const [viewerType, setViewerType] = useState('')
  const [viewerName, setViewerName] = useState('')
  const [viewerLoading, setViewerLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    // Validasi client-side
    const ext = file.name.split('.').pop().toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(`Tipe file .${ext} tidak diizinkan`)
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Ukuran file maksimal ${MAX_SIZE_MB}MB`)
      return
    }
    if (documents.length >= MAX_FILES) {
      setError(`Maksimal ${MAX_FILES} file`)
      return
    }

    setError('')
    setUploading(true)
    try {
      await onUpload(file)
    } catch (err) {
      setError(err.message || 'Gagal mengupload file')
    } finally {
      setUploading(false)
    }
  }, [documents.length, onUpload])

  const handleDelete = useCallback(async (docId) => {
    setDeletingId(docId)
    try {
      await onDelete(docId)
    } catch (err) {
      setError(err.message || 'Gagal menghapus dokumen')
    } finally {
      setDeletingId(null)
    }
  }, [onDelete])

  const handleView = useCallback(async (doc) => {
    const ext = doc.file_type?.toLowerCase()
    if (!VIEWABLE_TYPES.includes(ext)) return

    setViewerLoading(true)
    setViewerName(doc.file_name)
    setViewerType(ext)
    setViewerOpen(true)

    try {
      const res = await onGetPresignedURL(doc.id)
      const rawUrl = res.data.data.url
      // Jika URL relatif (/api/v1/...), prepend dengan API base URL
      const serveUrl = rawUrl.startsWith('/')
        ? `${process.env.NEXT_PUBLIC_API_URL}${rawUrl}`
        : rawUrl
      setViewerURL(serveUrl)
    } catch (err) {
      setError(err.message || 'Gagal membuka file')
      setViewerOpen(false)
    } finally {
      setViewerLoading(false)
    }
  }, [onGetPresignedURL])

  const handleDownload = useCallback(async (doc) => {
    try {
      const res = await onGetPresignedURL(doc.id)
      const rawUrl = res.data.data.url
      const serveUrl = rawUrl.startsWith('/')
        ? `${process.env.NEXT_PUBLIC_API_URL}${rawUrl}`
        : rawUrl
      window.open(serveUrl, '_blank')
    } catch (err) {
      setError(err.message || 'Gagal mendownload file')
    }
  }, [onGetPresignedURL])

  return (
    <Box>
      {/* Upload area */}
      {canUpload && (
        <Box className='mb-3'>
          <input
            ref={fileInputRef}
            type='file'
            hidden
            accept='.pdf,.docx,.xlsx,.jpg,.jpeg,.png,.webp'
            onChange={handleFileChange}
          />
          <Button
            variant='tonal'
            color='primary'
            size='small'
            startIcon={uploading
              ? <CircularProgress size={14} color='inherit' />
              : <i className='ri-upload-2-line' />
            }
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || documents.length >= MAX_FILES}
          >
            {uploading ? 'Mengupload...' : 'Upload Dokumen'}
          </Button>
          <Typography variant='caption' color='text.secondary' sx={{ ml: 2 }}>
            {documents.length}/{MAX_FILES} file
            {uploadHint && ` · ${uploadHint}`}
          </Typography>
        </Box>
      )}

      {uploading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {error && (
        <Alert severity='error' onClose={() => setError('')} sx={{ mb: 2 }} size='small'>
          {error}
        </Alert>
      )}

      {/* Daftar dokumen */}
      {loading ? (
        <Box className='flex justify-center py-4'><CircularProgress size={24} /></Box>
      ) : documents.length === 0 ? (
        <Box className='flex flex-col items-center py-6 gap-1' sx={{ color: 'text.secondary' }}>
          <i className='ri-folder-open-line text-4xl opacity-30' />
          <Typography variant='caption'>{emptyText}</Typography>
        </Box>
      ) : (
        <List dense disablePadding>
          {documents.map(doc => {
            const ext = doc.file_type?.toLowerCase()
            const fileIcon = FILE_ICONS[ext] || { icon: 'ri-file-line', color: '#757575' }
            const isViewable = VIEWABLE_TYPES.includes(ext)
            const isImage = IMAGE_TYPES.includes(ext)

            return (
              <ListItem
                key={doc.id}
                disablePadding
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 0.5,
                  px: 1.5,
                  py: 0.5,
                }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <i className={fileIcon.icon} style={{ color: fileIcon.color, fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant='body2' noWrap sx={{ maxWidth: 260 }}>
                      {doc.file_name}
                    </Typography>
                  }
                  secondary={
                    <Typography variant='caption' color='text.secondary'>
                      {formatFileSize(doc.file_size)}
                      {doc.created_at && ` · ${new Date(doc.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                    </Typography>
                  }
                />
                <Box className='flex items-center gap-0.5 ml-2'>
                  {isViewable && (
                    <Tooltip title={isImage ? 'Lihat gambar' : 'Buka PDF'}>
                      <IconButton size='small' onClick={() => handleView(doc)}>
                        <i className='ri-eye-line text-[18px]' />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title='Download'>
                    <IconButton size='small' onClick={() => handleDownload(doc)}>
                      <i className='ri-download-line text-[18px]' />
                    </IconButton>
                  </Tooltip>
                  {canDelete && (
                    <Tooltip title='Hapus'>
                      <IconButton
                        size='small'
                        color='error'
                        onClick={() => handleDelete(doc.id)}
                        disabled={deletingId === doc.id}
                      >
                        {deletingId === doc.id
                          ? <CircularProgress size={14} />
                          : <i className='ri-delete-bin-7-line text-[18px]' />
                        }
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </ListItem>
            )
          })}
        </List>
      )}

      {/* Viewer Dialog */}
      <Dialog
        open={viewerOpen}
        onClose={() => { setViewerOpen(false); setViewerURL('') }}
        maxWidth='lg'
        fullWidth
      >
        <DialogTitle>
          <div className='flex items-center justify-between'>
            <Typography variant='subtitle1' noWrap sx={{ maxWidth: '80%' }}>
              {viewerName}
            </Typography>
            <IconButton onClick={() => { setViewerOpen(false); setViewerURL('') }}>
              <i className='ri-close-line' />
            </IconButton>
          </div>
        </DialogTitle>
        <DialogContent sx={{ p: 0, minHeight: 500 }}>
          {viewerLoading ? (
            <Box className='flex justify-center items-center' sx={{ height: 500 }}>
              <CircularProgress />
            </Box>
          ) : viewerURL ? (
            IMAGE_TYPES.includes(viewerType) ? (
              <Box className='flex justify-center p-4'>
                {/* Pakai <img> biasa — URL sudah aman via BE proxy, tidak perlu next/image */}
                <img
                  src={viewerURL}
                  alt={viewerName}
                  style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
                />
              </Box>
            ) : (
              <iframe
                src={viewerURL}
                title={viewerName}
                width='100%'
                height='700px'
                style={{ border: 'none' }}
              />
            )
          ) : null}
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export default DocumentManager
