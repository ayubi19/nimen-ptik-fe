import NimenSprintApprovalView from '@/views/nimen-sprint/NimenSprintApprovalView'

export const metadata = { title: 'Approval Sprint' }

export default async function SprintApprovalPage({ params }) {
  const { id } = await params
  return <NimenSprintApprovalView sprintId={id} />
}
