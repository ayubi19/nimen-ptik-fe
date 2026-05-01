import NimenSprintFormView from '@/views/nimen-sprint/NimenSprintFormView'

export const metadata = { title: 'Edit Sprint NIMEN' }

export default async function Page({ params }) {
  const { id } = await params
  return <NimenSprintFormView sprintId={id} />
}
