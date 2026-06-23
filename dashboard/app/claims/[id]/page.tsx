import { ClaimDetailPage } from '@/components/claim-detail-page';

export default function ClaimPage({ params }: { params: { id: string } }) {
  return <ClaimDetailPage claimId={params.id} />;
}
