import NimenSprintDetailView from '@/views/nimen-sprint/NimenSprintDetailView'

export const metadata = { title: 'Detail Sprint NIMEN' }

export default function Page({ params }) {
  return <NimenSprintDetailView sprintId={params.id} />
}
