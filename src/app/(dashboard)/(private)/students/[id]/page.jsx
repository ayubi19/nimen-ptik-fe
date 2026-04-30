import StudentProfileView from '@/views/students/StudentProfileView'

export const metadata = { title: 'Profil Mahasiswa' }

export default async function StudentProfilePage({ params }) {
  const { id } = await params
  return <StudentProfileView studentId={id} />
}
