import { ControlListPage } from '@/components/control-list-page';

export default function CredentialsPage() {
  return (
    <ControlListPage
      title="API credentials"
      apiPath="/credentials"
      columns={[
        { key: 'key_id', label: 'Key ID' },
        { key: 'label', label: 'Label' },
        { key: 'status', label: 'Status' },
        { key: 'last_used_at', label: 'Last used' },
      ]}
    />
  );
}
