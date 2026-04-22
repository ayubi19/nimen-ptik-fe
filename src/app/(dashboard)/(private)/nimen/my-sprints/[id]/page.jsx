import MySprintDetailView from '@/views/nimen-sprint/MySprintDetailView'

export const metadata = { title: 'Detail Sprint Saya' }

export default function MySprintDetailPage({ params }) {
  return <MySprintDetailView sprintId={params.id} />
}
