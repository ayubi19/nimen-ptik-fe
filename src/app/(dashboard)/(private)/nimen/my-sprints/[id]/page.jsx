import MySprintDetailView from '@/views/nimen-sprint/MySprintDetailView'

export const metadata = { title: 'Detail Sprint Saya' }

export default async function MySprintDetailPage({ params }) {
  const { id } = await params
  return <MySprintDetailView sprintId={id} />
}
