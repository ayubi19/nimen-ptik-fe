import NimenSprintApprovalView from '@/views/nimen-sprint/NimenSprintApprovalView'

export const metadata = { title: 'Approval Sprint' }

export default function SprintApprovalPage({ params }) {
  return <NimenSprintApprovalView sprintId={params.id} />
}
