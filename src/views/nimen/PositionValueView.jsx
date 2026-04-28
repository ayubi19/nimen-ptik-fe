'use client'

import { useCallback, useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
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
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { batchApi } from '@/libs/api/masterDataApi'
import { nimenPositionValueApi } from '@/libs/api/nimenMasterDataApi'
import { getInitials } from '@/utils/getInitials'

const fmtMonth = (m) => {
  if (!m) return ''
  const [y, mo] = m.split('-')
  const names = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
  return `${names[parseInt(mo) - 1]} ${y}`
}

const PositionValueView = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [batches, setBatches] = useState([])
  const [batchID, setBatchID] = useState('')
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [preview, setPreview] = useState(null)
  const [checked, setChecked] = useState({}) // user_id → boolean
  const [previewLoading, setPreviewLoading] = useState(false)
  const [grantLoading, setGrantLoading] = useState(false)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const showToast = useCallback((msg, severity = 'success') =>
    setToast({ open: true, message: msg, severity }), [])

  useEffect(() => {
    batchApi.getAll({ page: 1, page_size: 100 })
      .then(r => setBatches(r.data.data?.data || []))
  }, [])

  const handlePreview = useCallback(async () => {
    if (!batchID) { showToast('Pilih angkatan terlebih dahulu', 'error'); return }
    setPreviewLoading(true)
    setPreview(null)
    try {
      const res = await nimenPositionValueApi.getPreview({ batch_id: batchID, month })
      const data = res.data.data
      setPreview(data)
      // Default: semua yang belum dapat → checked
      const init = {}
      data.items?.forEach(item => {
        init[item.user_id] = !item.already_granted
      })
      setChecked(init)
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Gagal memuat preview', 'error')
    } finally {
      setPreviewLoading(false)
    }
  }, [batchID, month, showToast])

  const handleToggleAll = useCallback((val) => {
    const next = {}
    preview?.items?.forEach(item => {
      if (!item.already_granted) next[item.user_id] = val
    })
    setChecked(prev => ({ ...prev, ...next }))
  }, [preview])

  const handleGrant = useCallback(async () => {
    const studentIDs = Object.entries(checked)
      .filter(([, v]) => v)
      .map(([k]) => parseInt(k))

    if (studentIDs.length === 0) {
      showToast('Pilih minimal 1 pejabat untuk diberikan nilai', 'error')
      return
    }

    setGrantLoading(true)
    try {
      await nimenPositionValueApi.grant({ month, batch_id: parseInt(batchID), student_ids: studentIDs })
      showToast(`Nilai jabatan berhasil diberikan ke ${studentIDs.length} pejabat`)
      handlePreview()
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Gagal memberikan nilai', 'error')
    } finally {
      setGrantLoading(false)
    }
  }, [checked, month, batchID, handlePreview, showToast])

  const eligibleItems = preview?.items?.filter(i => !i.already_granted) || []
  const grantedItems = preview?.items?.filter(i => i.already_granted) || []
  const checkedCount = Object.values(checked).filter(Boolean).length
  const allChecked = eligibleItems.length > 0 && eligibleItems.every(i => checked[i.user_id])
  const someChecked = eligibleItems.some(i => checked[i.user_id])

  const selectedBatch = batches.find(b => b.id === parseInt(batchID))

  return (
    <>
      {/* Breadcrumb */}
      <div className='flex items-center gap-2 mb-6'>
        <Typography variant='caption' color='text.secondary'>NIMEN</Typography>
        <i className='ri-arrow-right-s-line text-sm opacity-50' />
        <Typography variant='caption' fontWeight={500} color='text.primary'>Nilai Jabatan Bulanan</Typography>
      </div>

      {/* Filter Card */}
      <Card className='mb-6'>
        <CardContent>
          <Typography variant='subtitle1' fontWeight={600} className='mb-4'>
            Pilih Angkatan & Bulan
          </Typography>
          <Grid container spacing={3} alignItems='flex-end'>
            <Grid item xs={12} sm={5}>
              <FormControl fullWidth size='small'>
                <InputLabel>Angkatan</InputLabel>
                <Select label='Angkatan' value={batchID}
                        onChange={e => { setBatchID(e.target.value); setPreview(null) }}
                        renderValue={(val) => {
                          const b = batches.find(x => x.id === parseInt(val))
                          if (!b) return ''
                          return `${b.name} · ke-${b.batch_number} (${b.year}) · ${b.program_type || 'S1'}`
                        }}>
                  {batches.map(b => (
                    <MenuItem key={b.id} value={b.id}>
                      <div className='flex items-center justify-between w-full gap-2'>
                        <div>
                          <Typography variant='body2' fontWeight={500}>{b.name}</Typography>
                          <Typography variant='caption' color='text.secondary'>
                            Angkatan ke-{b.batch_number} · {b.year}
                          </Typography>
                        </div>
                        <Chip label={b.program_type || 'S1'} size='small' variant='tonal'
                              color={b.program_type === 'S2' ? 'info' : 'success'} />
                      </div>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size='small' type='month' label='Bulan'
                         value={month} onChange={e => { setMonth(e.target.value); setPreview(null) }}
                         InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button fullWidth variant='contained' onClick={handlePreview}
                      disabled={previewLoading || !batchID}
                      startIcon={previewLoading
                        ? <CircularProgress size={16} color='inherit' />
                        : <i className='ri-eye-line' />}>
                {previewLoading ? 'Memuat...' : 'Preview'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Empty state */}
      {!preview && !previewLoading && (
        <Card>
          <CardContent className='text-center py-16'>
            <i className='ri-medal-line text-6xl opacity-20 block mb-3' />
            <Typography variant='body1' color='text.secondary'>
              Pilih angkatan dan bulan, lalu klik <strong>Preview</strong> untuk melihat
              daftar pejabat yang akan mendapat nilai jabatan.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Preview Result */}
      {preview && (
        <>
          {/* Info bar */}
          <Card className='mb-4'>
            <CardContent>
              <div className='flex items-center justify-between flex-wrap gap-3'>
                <div className='flex items-center gap-3 flex-wrap'>
                  <Chip
                    icon={<i className='ri-calendar-line' />}
                    label={`${fmtMonth(month)} · ${preview.batch_name}`}
                    color='primary' variant='tonal'
                  />
                  {preview.all_granted ? (
                    <Chip icon={<i className='ri-checkbox-circle-line' />}
                          label='Seluruh pejabat aktif telah menerima nilai jabatan pada periode ini'
                          color='success' variant='tonal' />
                  ) : (
                    <>
                      <Chip label={`${preview.total_eligible} belum mendapat nilai`} color='warning' variant='tonal' />
                      {grantedItems.length > 0 && (
                        <Chip label={`${grantedItems.length} sudah mendapat nilai`} color='success' variant='tonal' />
                      )}
                    </>
                  )}
                </div>
                {!preview.all_granted && eligibleItems.length > 0 && (
                  <Button variant='contained' onClick={handleGrant}
                          disabled={grantLoading || checkedCount === 0}
                          startIcon={grantLoading
                            ? <CircularProgress size={16} color='inherit' />
                            : <i className='ri-gift-line' />}>
                    {grantLoading ? 'Memberikan...' : `Berikan Nilai ke ${checkedCount} Pejabat`}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tidak ada pejabat sama sekali */}
          {preview && preview.items?.length === 0 && (
            <Alert severity='warning' icon={<i className='ri-user-unfollow-line' />} className='mb-4'>
              <strong>Tidak ditemukan pejabat aktif.</strong> Angkatan{' '}
              <strong>{preview.batch_name}</strong> belum memiliki mahasiswa dengan jabatan aktif
              pada periode ini. Pastikan struktur organisasi angkatan telah dikonfigurasi melalui
              menu <strong>Struktur Organisasi</strong>.
            </Alert>
          )}

          {/* All granted message */}
          {preview.all_granted && (
            <Alert severity='success' icon={<i className='ri-checkbox-circle-fill' />} className='mb-4'>
              <strong>Pemberian nilai jabatan telah selesai.</strong> Seluruh pejabat aktif pada angkatan{' '}
              <strong>{preview.batch_name}</strong> telah menerima nilai jabatan untuk periode{' '}
              <strong>{fmtMonth(month)}</strong>. Tidak ada tindakan lebih lanjut yang diperlukan.
            </Alert>
          )}

          {/* Eligible list */}
          {eligibleItems.length > 0 && (
            <Card className='mb-4'>
              <CardContent className='pb-2'>
                <div className='flex items-center justify-between mb-3'>
                  <Typography variant='subtitle2' fontWeight={600}>
                    Belum Mendapat Nilai ({eligibleItems.length} pejabat)
                  </Typography>
                  <div className='flex items-center gap-2'>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={allChecked}
                          indeterminate={someChecked && !allChecked}
                          onChange={e => handleToggleAll(e.target.checked)}
                          size='small'
                        />
                      }
                      label={<Typography variant='caption'>Pilih Semua</Typography>}
                    />
                  </div>
                </div>
              </CardContent>

              {isMobile ? (
                // Mobile cards
                <div className='px-4 pb-4 flex flex-col gap-3'>
                  {eligibleItems.map(item => (
                    <Card key={item.user_id} variant='outlined'
                          sx={{ borderColor: checked[item.user_id] ? 'primary.main' : 'divider' }}>
                      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <div className='flex items-start gap-3'>
                          <Checkbox
                            checked={!!checked[item.user_id]}
                            onChange={e => setChecked(p => ({ ...p, [item.user_id]: e.target.checked }))}
                            size='small' sx={{ mt: -0.5 }}
                          />
                          <div className='flex-1'>
                            <Typography variant='body2' fontWeight={600}>{item.full_name}</Typography>
                            <Typography variant='caption' color='text.secondary'>{item.nim}</Typography>
                            <div className='flex items-center gap-2 mt-1 flex-wrap'>
                              <Chip label={item.position_name} size='small' variant='tonal' />
                              <Chip label={`+${item.value}`} size='small' color='success' variant='tonal' />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                // Desktop table
                <Table size='small'>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell padding='checkbox' sx={{ pl: 2 }}>
                        <Checkbox
                          checked={allChecked}
                          indeterminate={someChecked && !allChecked}
                          onChange={e => handleToggleAll(e.target.checked)}
                          size='small'
                        />
                      </TableCell>
                      {['Nama', 'NIM', 'Jabatan', 'Nilai'].map(h => (
                        <TableCell key={h} sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {eligibleItems.map(item => (
                      <TableRow key={item.user_id} hover
                                sx={{ cursor: 'pointer', bgcolor: checked[item.user_id] ? 'action.selected' : 'inherit' }}
                                onClick={() => setChecked(p => ({ ...p, [item.user_id]: !p[item.user_id] }))}>
                        <TableCell padding='checkbox' sx={{ pl: 2 }}>
                          <Checkbox checked={!!checked[item.user_id]} size='small'
                                    onChange={e => { e.stopPropagation(); setChecked(p => ({ ...p, [item.user_id]: e.target.checked })) }} />
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <Avatar sx={{ width: 32, height: 32, fontSize: 11 }}>
                              {getInitials(item.full_name)}
                            </Avatar>
                            <Typography variant='body2' fontWeight={500}>{item.full_name}</Typography>
                          </div>
                        </TableCell>
                        <TableCell><Typography variant='body2'>{item.nim}</Typography></TableCell>
                        <TableCell><Typography variant='body2'>{item.position_name}</Typography></TableCell>
                        <TableCell>
                          <Chip label={`+${item.value}`} size='small' color='success' variant='tonal'
                                sx={{ fontWeight: 700 }} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          )}

          {/* Already granted list */}
          {grantedItems.length > 0 && (
            <Card>
              <CardContent className='pb-2'>
                <Typography variant='subtitle2' fontWeight={600} color='text.secondary' className='mb-3'>
                  Sudah Mendapat Nilai ({grantedItems.length} pejabat)
                </Typography>
              </CardContent>
              {isMobile ? (
                <div className='px-4 pb-4 flex flex-col gap-2'>
                  {grantedItems.map(item => (
                    <Card key={item.user_id} variant='outlined' sx={{ opacity: 0.6 }}>
                      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <div className='flex items-center justify-between'>
                          <div>
                            <Typography variant='body2' fontWeight={500}>{item.full_name}</Typography>
                            <Typography variant='caption' color='text.secondary'>{item.position_name}</Typography>
                          </div>
                          <Chip label='Sudah' size='small' color='success' variant='tonal' />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Table size='small'>
                  <TableBody>
                    {grantedItems.map(item => (
                      <TableRow key={item.user_id} sx={{ opacity: 0.6 }}>
                        <TableCell sx={{ pl: 7.5 }}>
                          <div className='flex items-center gap-2'>
                            <Avatar sx={{ width: 32, height: 32, fontSize: 11 }}>
                              {getInitials(item.full_name)}
                            </Avatar>
                            <Typography variant='body2'>{item.full_name}</Typography>
                          </div>
                        </TableCell>
                        <TableCell><Typography variant='body2' color='text.secondary'>{item.nim}</Typography></TableCell>
                        <TableCell><Typography variant='body2' color='text.secondary'>{item.position_name}</Typography></TableCell>
                        <TableCell>
                          <Chip label='Sudah mendapat nilai' size='small' color='success' variant='tonal' />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <Divider />
            </Card>
          )}
        </>
      )}

      <Snackbar open={toast.open} autoHideDuration={5000}
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

export default PositionValueView
