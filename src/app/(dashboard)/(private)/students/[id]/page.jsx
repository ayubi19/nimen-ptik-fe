import StudentProfileView from '@/views/students/StudentProfileView'

export const metadata = { title: 'Profil Mahasiswa' }

export default function StudentProfilePage({ params }) {
  return <StudentProfileView studentId={params.id} />
}
