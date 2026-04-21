import NimenSprintCoordinatorReviewView from '@/views/nimen-sprint/NimenSprintCoordinatorReviewView'

export const metadata = { title: 'Review Peserta Sprint' }

export default function Page({ params }) {
  return <NimenSprintCoordinatorReviewView sprintId={params.id} />
}
