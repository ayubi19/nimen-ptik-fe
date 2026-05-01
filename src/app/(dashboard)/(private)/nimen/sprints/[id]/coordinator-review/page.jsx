import NimenSprintCoordinatorReviewView from '@/views/nimen-sprint/NimenSprintCoordinatorReviewView'

export const metadata = { title: 'Review Peserta Sprint' }

export default async function Page({ params }) {
  const { id } = await params
  return <NimenSprintCoordinatorReviewView sprintId={id} />
}
