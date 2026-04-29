import NimenSprintDetailView from '@/views/nimen-sprint/NimenSprintDetailView'

export const metadata = { title: 'Detail Sprint NIMEN' }

export default async function Page({ params }) {
  const { id } = await params
  return <NimenSprintDetailView sprintId={id} />
}
