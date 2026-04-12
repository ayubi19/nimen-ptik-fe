// Navigasi sidebar untuk Nimen PTIK
// Label menggunakan bahasa Indonesia sesuai kebutuhan sistem

const verticalMenuData = () => [
  {
    label: 'Dashboard',
    icon: 'ri-home-smile-line',
    href: '/dashboard'
  },

  // ── Akademik ──
  {
    label: 'Akademik',
    isSection: true,
    children: [
      {
        label: 'NIMEN',
        icon: 'ri-medal-line',
        href: '/nimen'
      },
      {
        label: 'Inisiatif',
        icon: 'ri-lightbulb-line',
        children: [
          { label: 'Semua Inisiatif', href: '/initiative' },
        ]
      },
      {
        label: 'Peringkat',
        icon: 'ri-bar-chart-line',
        href: '/ranking'
      },
    ]
  },

  // ── Mahasiswa ──
  {
    label: 'Mahasiswa',
    isSection: true,
    children: [
      {
        label: 'Daftar Mahasiswa',
        icon: 'ri-group-line',
        href: '/students/list'
      },
      {
        label: 'Pelanggaran',
        icon: 'ri-error-warning-line',
        href: '/violation'
      },
    ]
  },

  // ── Jadwal ──
  {
    label: 'Jadwal',
    isSection: true,
    children: [
      {
        label: 'Jadwal Kegiatan',
        icon: 'ri-calendar-line',
        href: '/schedule'
      },
    ]
  },

  // ── Master Data ──
  {
    label: 'Master Data',
    isSection: true,
    children: [
      {
        label: 'Master Data',
        icon: 'ri-database-2-line',
        children: [
          { label: 'Sindikat', href: '/master-data/syndicates' },
          { label: 'Angkatan', href: '/master-data/batches' },
          { label: 'Status Akademik', href: '/master-data/academic-statuses' },
        ]
      },
    ]
  },
]

export default verticalMenuData
