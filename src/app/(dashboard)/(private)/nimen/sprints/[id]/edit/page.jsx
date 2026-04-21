import NimenSprintFormView from '@/views/nimen-sprint/NimenSprintFormView'

export const metadata = { title: 'Edit Sprint NIMEN' }

export default function Page({ params }) {
  return <NimenSprintFormView sprintId={params.id} />
}
