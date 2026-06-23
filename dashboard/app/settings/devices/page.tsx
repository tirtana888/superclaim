import { ControlListPage } from '@/components/control-list-page';

export default function DevicesPage() {
  return (
    <ControlListPage
      title="Device registry"
      apiPath="/devices"
      columns={[
        { key: 'serial_number', label: 'Serial' },
        { key: 'device_category', label: 'Category' },
        { key: 'purchase_date', label: 'Purchased' },
        { key: 'source', label: 'Source' },
      ]}
    />
  );
}
