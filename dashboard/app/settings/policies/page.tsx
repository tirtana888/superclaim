import { ControlListPage } from '@/components/control-list-page';

export default function PoliciesPage() {
  return (
    <ControlListPage
      title="Policies"
      apiPath="/policies"
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'external_policy_id', label: 'ID' },
        { key: 'version', label: 'Ver' },
        { key: 'status', label: 'Status' },
      ]}
    />
  );
}
