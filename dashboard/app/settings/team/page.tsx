import { ControlListPage } from '@/components/control-list-page';

export default function TeamPage() {
  return (
    <ControlListPage
      title="Team"
      apiPath="/team"
      columns={[
        { key: 'email', label: 'Email' },
        { key: 'role', label: 'Role' },
        { key: 'status', label: 'Status' },
      ]}
    />
  );
}
