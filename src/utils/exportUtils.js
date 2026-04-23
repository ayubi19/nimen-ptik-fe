/**
 * exportUtils.js
 * Utility untuk export data NIMEN ke PDF dan XLSX
 * Menggunakan: jspdf + jspdf-autotable (PDF), xlsx/SheetJS (XLSX)
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric'
  })
}

const formatValue = (val) => {
  const n = parseFloat(val)
  return n >= 0 ? `+${n.toFixed(2)}` : n.toFixed(2)
}

const SOURCE_LABEL = {
  SPRINT: 'Sprint',
  SELF_SUBMISSION: 'Pengajuan Mandiri',
  AUTOMATIC: 'Otomatis',
}

const STATUS_LABEL = {
  VALID: 'Valid',
  DISPENSED: 'Dispensasi',
}

// ─── Export Per Mahasiswa ─────────────────────────────────────────────────────

/**
 * exportStudentPDF — rekap nilai 1 mahasiswa ke PDF
 * @param {object} student — data dari GET /students/:id
 * @param {array}  history — data dari GET /nimen/rankings/student/:id
 * @param {object} ranking — row dari GET /nimen/rankings
 */
export const exportStudentPDF = async (student, history, ranking) => {
  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const profile = student.student_profile
  const pageW = doc.internal.pageSize.getWidth()

  // ── Header ──
  doc.setFontSize(14)
  doc.setFont(undefined, 'bold')
  doc.text('REKAP NILAI MENTAL MAHASISWA (NIMEN)', pageW / 2, 18, { align: 'center' })
  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  doc.text('STIK PTIK', pageW / 2, 24, { align: 'center' })

  doc.setLineWidth(0.5)
  doc.line(14, 28, pageW - 14, 28)

  // ── Info Mahasiswa ──
  doc.setFontSize(10)
  doc.setFont(undefined, 'bold')
  doc.text('DATA MAHASISWA', 14, 35)
  doc.setFont(undefined, 'normal')

  const info = [
    ['Nama',        student.full_name],
    ['NIM',         profile?.nim || '—'],
    ['Angkatan',    profile?.batch?.name || '—'],
    ['Sindikat',    profile?.syndicate?.name || '—'],
    ['Status',      student.is_active ? 'Aktif' : 'Non-aktif'],
  ]

  let y = 40
  info.forEach(([label, value]) => {
    doc.setFont(undefined, 'bold')
    doc.text(`${label}:`, 14, y)
    doc.setFont(undefined, 'normal')
    doc.text(value, 55, y)
    y += 6
  })

  // ── Ringkasan Nilai ──
  y += 3
  doc.setFont(undefined, 'bold')
  doc.text('RINGKASAN NILAI', 14, y)
  y += 5

  const totalValue = history.reduce((s, e) => s + e.value, 0)
  const summaryData = [
    ['Total Nilai', formatValue(totalValue), ranking ? `#${ranking.rank_position} dari angkatan` : '—'],
  ]
  autoTable(doc, {
    startY: y,
    head: [['Keterangan', 'Total Nilai', 'Peringkat Angkatan']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [114, 103, 240], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  })

  // ── Riwayat Nilai ──
  y = doc.lastAutoTable.finalY + 8
  doc.setFont(undefined, 'bold')
  doc.text('RIWAYAT NILAI', 14, y)

  const rows = history.map(e => [
    formatDate(e.event_date),
    e.indicator?.name || '—',
    e.indicator?.variable?.category?.name || '—',
    SOURCE_LABEL[e.source_type] || e.source_type,
    formatValue(e.value),
    STATUS_LABEL[e.status] || e.status,
  ])

  autoTable(doc, {
    startY: y + 4,
    head: [['Tanggal', 'Indikator', 'Kategori', 'Sumber', 'Nilai', 'Status']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [114, 103, 240], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 25 },
      4: { halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  })

  // ── Footer ──
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont(undefined, 'normal')
    doc.text(
      `Dicetak: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} — Halaman ${i} dari ${pageCount}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    )
  }

  doc.save(`NIMEN_${profile?.nim || student.id}_${student.full_name.replace(/\s+/g, '_')}.pdf`)
}

/**
 * exportStudentXLSX — rekap nilai 1 mahasiswa ke XLSX
 */
export const exportStudentXLSX = async (student, history, ranking) => {
  const XLSX = await import('xlsx')
  const profile = student.student_profile
  const wb = XLSX.utils.book_new()

  // Sheet 1: Info mahasiswa
  const infoData = [
    ['REKAP NILAI MENTAL MAHASISWA (NIMEN)'],
    [],
    ['Nama', student.full_name],
    ['NIM', profile?.nim || '—'],
    ['Angkatan', profile?.batch?.name || '—'],
    ['Sindikat', profile?.syndicate?.name || '—'],
    ['Status', student.is_active ? 'Aktif' : 'Non-aktif'],
    [],
    ['Total Nilai', history.reduce((s, e) => s + e.value, 0).toFixed(2)],
    ['Peringkat Angkatan', ranking ? `#${ranking.rank_position}` : '—'],
    ['Dicetak', new Date().toLocaleDateString('id-ID')],
  ]
  const wsInfo = XLSX.utils.aoa_to_sheet(infoData)
  wsInfo['!cols'] = [{ wch: 20 }, { wch: 40 }]
  XLSX.utils.book_append_sheet(wb, wsInfo, 'Profil')

  // Sheet 2: Riwayat nilai
  const header = ['Tanggal', 'Indikator', 'Variabel', 'Kategori', 'Sumber', 'Nilai', 'Status']
  const rows = history.map(e => [
    formatDate(e.event_date),
    e.indicator?.name || '—',
    e.indicator?.variable?.name || '—',
    e.indicator?.variable?.category?.name || '—',
    SOURCE_LABEL[e.source_type] || e.source_type,
    parseFloat(e.value),
    STATUS_LABEL[e.status] || e.status,
  ])
  const wsHistory = XLSX.utils.aoa_to_sheet([header, ...rows])
  wsHistory['!cols'] = [
    { wch: 15 }, { wch: 40 }, { wch: 25 }, { wch: 20 },
    { wch: 20 }, { wch: 10 }, { wch: 12 },
  ]
  XLSX.utils.book_append_sheet(wb, wsHistory, 'Riwayat Nilai')

  XLSX.writeFile(wb, `NIMEN_${profile?.nim || student.id}_${student.full_name.replace(/\s+/g, '_')}.xlsx`)
}

// ─── Export Per Angkatan ──────────────────────────────────────────────────────

/**
 * exportBatchPDF — rekap ranking seluruh angkatan ke PDF
 * @param {array}  rows    — data dari GET /nimen/rankings
 * @param {object} batch   — { name, year, max_nimen_value }
 */
export const exportBatchPDF = async (rows, batch) => {
  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()

  // ── Header ──
  doc.setFontSize(14)
  doc.setFont(undefined, 'bold')
  doc.text('REKAPITULASI NILAI MENTAL MAHASISWA (NIMEN)', pageW / 2, 18, { align: 'center' })
  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  doc.text(`Angkatan: ${batch.name} | Nilai Maksimum: ${batch.max_value}`, pageW / 2, 24, { align: 'center' })
  doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`, pageW / 2, 30, { align: 'center' })
  doc.line(14, 33, pageW - 14, 33)

  // ── Tabel ──
  const tableRows = rows.map(r => [
    r.rank_position,
    r.full_name,
    r.nim,
    r.syndicate_name || '—',
    r.total_value?.toFixed(2),
    `${Math.min((r.total_value / r.max_value) * 100, 100).toFixed(1)}%`,
  ])

  autoTable(doc, {
    startY: 36,
    head: [['No.', 'Nama', 'NIM', 'Sindikat', 'Total Nilai', '% Maks']],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [114, 103, 240], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      4: { halign: 'right' },
      5: { halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  })

  // ── Footer ──
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.text(
      `Halaman ${i} dari ${pageCount}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    )
  }

  doc.save(`NIMEN_Rekap_${batch.name.replace(/\s+/g, '_')}.pdf`)
}

/**
 * exportBatchXLSX — rekap ranking seluruh angkatan ke XLSX
 */
export const exportBatchXLSX = async (rows, batch) => {
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()

  const header = ['Peringkat', 'Nama', 'NIM', 'Sindikat', 'Total Nilai', '% Maks']
  const data = rows.map(r => [
    r.rank_position,
    r.full_name,
    r.nim,
    r.syndicate_name || '—',
    parseFloat(r.total_value?.toFixed(2)),
    parseFloat(Math.min((r.total_value / r.max_value) * 100, 100).toFixed(1)),
  ])

  // Tambah baris info di atas
  const info = [
    [`REKAPITULASI NIMEN — ${batch.name}`],
    [`Nilai Maksimum: ${batch.max_value} | Total: ${rows.length} Mahasiswa`],
    [`Dicetak: ${new Date().toLocaleDateString('id-ID')}`],
    [],
    header,
    ...data,
  ]

  const ws = XLSX.utils.aoa_to_sheet(info)
  ws['!cols'] = [
    { wch: 10 }, { wch: 35 }, { wch: 15 },
    { wch: 20 }, { wch: 12 }, { wch: 10 },
  ]
  XLSX.utils.book_append_sheet(wb, ws, `Rekap ${batch.name}`)
  XLSX.writeFile(wb, `NIMEN_Rekap_${batch.name.replace(/\s+/g, '_')}.xlsx`)
}
