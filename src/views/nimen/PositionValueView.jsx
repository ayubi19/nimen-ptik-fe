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
      showToast('Pilih minimal 1 mahasiswa untuk diberikan nilai', 'error')
      return
    }

    setGrantLoading(true)
    try {
      await nimenPositionValueApi.grant({ month, batch_id: parseInt(batchID), student_ids: studentIDs })
      showToast(`Nilai berhasil diberikan ke ${studentIDs.length} mahasiswa`)
      handlePreview()
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Gagal memberikan nilai', 'error')
    } finally {
      setGrantLoading(false)
    }
  }, [checked, month, batchID, handlePreview, showToast])

  const eligibleItems    = preview?.items?.filter(i => !i.already_granted) || []
  const grantedItems     = preview?.items?.filter(i => i.already_granted) || []
  const eligiblePejabat  = eligibleItems.filter(i => !i.is_non_position)
  const eligibleNonPos   = eligibleItems.filter(i => i.is_non_position)
  const checkedCount = Object.values(checked).filter(Boolean).length
  const allChecked = eligibleItems.length > 0 && eligibleItems.every(i => checked[i.user_id])
  const someChecked = eligibleItems.some(i => checked[i.user_id])

  const selectedBatch = batches.find(b => b.id === parseInt(batchID))

  return (
    <>
      {/* Topbar PWA */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', mb: '14px' }}>
        <Box sx={{
          width: 34, height: 34, borderRadius: '10px',
          background: 'rgba(255,255,255,0.72)', border: '0.5px solid rgba(180,100,100,0.18)',
          boxShadow: '0 3px 10px rgba(139,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, cursor: 'pointer', position: 'relative', overflow: 'hidden',
          '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)' }
        }} onClick={() => window.history.back()}>
          <i className='ri-arrow-left-s-line' style={{ fontSize: '20px', color: '#8B2020', position: 'relative', zIndex: 1 }} />
        </Box>
        <Box>
          <Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>NIMEN</Typography>
          <Typography sx={{ fontSize: '16px', fontWeight: 500, color: '#3B1010' }}>Nilai Jabatan Bulanan</Typography>
        </Box>
      </Box>

      {/* Filter Card — PWA native */}
      <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', p: '12px 14px', mb: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#9A5A5A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Pilih Angkatan & Bulan
        </Typography>
        <FormControl fullWidth size='small'>
          <Select displayEmpty value={batchID}
                  onChange={e => { setBatchID(e.target.value); setPreview(null) }}
                  renderValue={val => {
                    const b = batches.find(x => x.id === parseInt(val))
                    return b ? `${b.name} (${b.year})` : 'Pilih Angkatan'
                  }}
                  sx={{ borderRadius: '8px', fontSize: '12px', bgcolor: '#F5F2F0', '& .MuiOutlinedInput-notchedOutline': { border: '0.5px solid rgba(180,100,100,0.15)' }, '& .MuiSelect-select': { py: '7px', px: '10px' } }}>
            {batches.map(b => (
              <MenuItem key={b.id} value={b.id}>
                <Box>
                  <Typography variant='body2' fontWeight={500}>{b.name}</Typography>
                  <Typography variant='caption' color='text.secondary'>Angkatan ke-{b.batch_number} · {b.year}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField fullWidth size='small' type='month'
                   value={month} onChange={e => { setMonth(e.target.value); setPreview(null) }}
                   InputLabelProps={{ shrink: true }}
                   sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F5F2F0', '& fieldset': { border: '0.5px solid rgba(180,100,100,0.15)' } }, '& input': { py: '7px', px: '10px', fontSize: '12px' } }}
        />
        <Box component='button' onClick={handlePreview} disabled={previewLoading || !batchID} sx={{
          width: '100%', py: '10px', borderRadius: '10px', border: 'none', cursor: (!batchID || previewLoading) ? 'not-allowed' : 'pointer',
          background: (!batchID || previewLoading) ? 'rgba(180,100,100,0.2)' : 'linear-gradient(145deg, #E63946, #6D0E13)',
          boxShadow: (!batchID || previewLoading) ? 'none' : '0 4px 10px rgba(180,0,30,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        }}>
          {previewLoading
            ? <CircularProgress size={14} sx={{ color: '#fff' }} />
            : <i className='ri-eye-line' style={{ fontSize: '14px', color: '#fff' }} />
          }
          <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
            {previewLoading ? 'Memuat...' : 'Preview'}
          </Typography>
        </Box>
      </Box>

      {/* Empty state */}
      {!preview && !previewLoading && (
        <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', py: '40px', px: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <i className='ri-medal-line' style={{ fontSize: 40, opacity: 0.25 }} />
            <Typography sx={{ fontSize: '12px', color: '#9A5A5A', textAlign: 'center' }}>
              Pilih angkatan dan bulan, lalu klik <strong>Preview</strong> untuk melihat
              daftar pejabat yang akan mendapat nilai jabatan.
            </Typography>
          </Box>
        </Box>
      )}

      {/* Preview Result */}
      {preview && (
        <>
          {/* Info bar — PWA native */}
          <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', p: '12px 14px', mb: '10px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', mb: '8px', flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '5px', bgcolor: '#E6F1FB', borderRadius: '6px', px: '8px', py: '4px' }}>
                <i className='ri-calendar-line' style={{ fontSize: '11px', color: '#185FA5' }} />
                <Typography sx={{ fontSize: '11px', fontWeight: 500, color: '#185FA5' }}>
                  {fmtMonth(month)} · {preview.batch_name}
                </Typography>
              </Box>
              {preview.all_granted ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '5px', bgcolor: '#E1F5EE', borderRadius: '6px', px: '8px', py: '4px' }}>
                  <i className='ri-checkbox-circle-line' style={{ fontSize: '11px', color: '#0F6E56' }} />
                  <Typography sx={{ fontSize: '11px', fontWeight: 500, color: '#0F6E56' }}>Semua sudah mendapat nilai</Typography>
                </Box>
              ) : (
                <>
                  <Box sx={{ bgcolor: '#FAEEDA', borderRadius: '6px', px: '8px', py: '4px' }}>
                    <Typography sx={{ fontSize: '11px', fontWeight: 500, color: '#BA7517' }}>{preview.total_eligible} belum mendapat</Typography>
                  </Box>
                  {grantedItems.length > 0 && (
                    <Box sx={{ bgcolor: '#E1F5EE', borderRadius: '6px', px: '8px', py: '4px' }}>
                      <Typography sx={{ fontSize: '11px', fontWeight: 500, color: '#0F6E56' }}>{grantedItems.length} sudah</Typography>
                    </Box>
                  )}
                </>
              )}
            </Box>
            {!preview.all_granted && eligibleItems.length > 0 && (
              <Box component='button' onClick={handleGrant} disabled={grantLoading || checkedCount === 0} sx={{
                width: '100%', py: '9px', borderRadius: '9px', border: 'none',
                cursor: (grantLoading || checkedCount === 0) ? 'not-allowed' : 'pointer',
                background: (grantLoading || checkedCount === 0) ? 'rgba(180,100,100,0.15)' : 'linear-gradient(145deg, #E63946, #6D0E13)',
                boxShadow: (grantLoading || checkedCount === 0) ? 'none' : '0 4px 10px rgba(180,0,30,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}>
                {grantLoading
                  ? <CircularProgress size={14} sx={{ color: '#fff' }} />
                  : <i className='ri-gift-line' style={{ fontSize: '14px', color: '#fff' }} />
                }
                <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>
                  {grantLoading ? 'Memberikan...' : `Berikan Nilai ke ${checkedCount} Mahasiswa`}
                </Typography>
              </Box>
            )}
          </Box>

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
            <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', overflow: 'hidden', mb: '10px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: '10px', borderBottom: '0.5px solid rgba(180,100,100,0.1)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#3B1010' }}>
                    Belum Mendapat Nilai ({eligibleItems.length})
                  </Typography>
                  {eligiblePejabat.length > 0 && (
                    <Box sx={{ bgcolor: '#EAF3DE', borderRadius: '6px', px: '6px', py: '2px' }}>
                      <Typography sx={{ fontSize: '10px', fontWeight: 500, color: '#27500A' }}>{eligiblePejabat.length} pejabat</Typography>
                    </Box>
                  )}
                  {eligibleNonPos.length > 0 && (
                    <Box sx={{ bgcolor: '#FAEEDA', borderRadius: '6px', px: '6px', py: '2px' }}>
                      <Typography sx={{ fontSize: '10px', fontWeight: 500, color: '#633806' }}>{eligibleNonPos.length} non-pejabat</Typography>
                    </Box>
                  )}
                </Box>
                <FormControlLabel
                  control={
                    <Checkbox checked={allChecked} indeterminate={someChecked && !allChecked}
                              onChange={e => handleToggleAll(e.target.checked)} size='small'
                              sx={{ color: '#8B2020', '&.Mui-checked': { color: '#8B2020' } }}
                    />
                  }
                  label={<Typography sx={{ fontSize: '11px', color: '#9A5A5A' }}>Pilih Semua</Typography>}
                />
              </Box>

              {isMobile ? (
                <Box>
                  {eligibleItems.map((item, i) => (
                    <Box key={item.user_id}
                         onClick={() => setChecked(p => ({ ...p, [item.user_id]: !p[item.user_id] }))}
                         sx={{
                           display: 'flex', alignItems: 'center', gap: '10px', px: 2, py: '12px', cursor: 'pointer',
                           bgcolor: checked[item.user_id] ? 'rgba(235,61,71,0.04)' : 'transparent',
                           borderBottom: i < eligibleItems.length - 1 ? '0.5px solid rgba(180,100,100,0.08)' : 'none',
                           '&:active': { opacity: 0.7 },
                         }}>
                      <Checkbox checked={!!checked[item.user_id]}
                                onChange={e => { e.stopPropagation(); setChecked(p => ({ ...p, [item.user_id]: e.target.checked })) }}
                                size='small' sx={{ p: '4px', color: '#8B2020', '&.Mui-checked': { color: '#8B2020' } }}
                      />
                      <Box sx={{ width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
                        background: 'linear-gradient(145deg, #E63946, #6D0E13)',
                        boxShadow: '0 3px 8px rgba(180,0,30,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.92)',
                      }}>
                        {getInitials(item.full_name)}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#3B1010', lineHeight: 1.3 }} noWrap>{item.full_name}</Typography>
                        <Typography sx={{ fontSize: '10px', color: '#9A5A5A' }}>{item.nim}</Typography>
                        <Box sx={{ display: 'flex', gap: '5px', mt: '4px', flexWrap: 'wrap' }}>
                          <Box sx={{ bgcolor: '#F1EFE8', borderRadius: '5px', px: '6px', py: '2px' }}>
                            <Typography sx={{ fontSize: '9px', fontWeight: 500, color: '#5F5E5A' }}>{item.position_name}</Typography>
                          </Box>
                          <Box sx={{ bgcolor: '#E1F5EE', borderRadius: '5px', px: '6px', py: '2px' }}>
                            <Typography sx={{ fontSize: '9px', fontWeight: 700, color: '#0F6E56' }}>+{item.value}</Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
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
            </Box>
          )}

          {/* Already granted list */}
          {grantedItems.length > 0 && (
            <Box sx={{ background: '#fff', border: '0.5px solid rgba(180,100,100,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
              <Box sx={{ px: 2, py: '10px', borderBottom: '0.5px solid rgba(180,100,100,0.1)' }}>
                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#9A5A5A' }}>
                  Sudah Mendapat Nilai ({grantedItems.length})
                </Typography>
              </Box>
              {isMobile ? (
                <Box>
                  {grantedItems.map((item, i) => (
                    <Box key={item.user_id} sx={{
                      display: 'flex', alignItems: 'center', gap: '10px', px: 2, py: '12px', opacity: 0.65,
                      borderBottom: i < grantedItems.length - 1 ? '0.5px solid rgba(180,100,100,0.08)' : 'none',
                    }}>
                      <Box sx={{ width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
                        background: 'linear-gradient(145deg, #E63946, #6D0E13)',
                        boxShadow: '0 3px 8px rgba(180,0,30,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.92)',
                      }}>
                        {getInitials(item.full_name)}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#3B1010' }} noWrap>{item.full_name}</Typography>
                        <Typography sx={{ fontSize: '10px', color: '#9A5A5A' }}>{item.position_name}</Typography>
                      </Box>
                      <Box sx={{ bgcolor: '#E1F5EE', borderRadius: '6px', px: '8px', py: '3px', flexShrink: 0 }}>
                        <Typography sx={{ fontSize: '9px', fontWeight: 600, color: '#0F6E56' }}>✓ Sudah</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
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
            </Box>
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
