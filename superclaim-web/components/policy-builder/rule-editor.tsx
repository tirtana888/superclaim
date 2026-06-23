'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { joinCsvList, parseCsvList } from '@/lib/policy-preview';
import type { PolicyConfig } from '@/lib/types';

export function RuleEditor({
  config,
  onChange,
}: {
  config: PolicyConfig;
  onChange: (config: PolicyConfig) => void;
}) {
  return (
    <div className="space-y-4 rounded-xl border border-border p-5">
      <h3 className="font-medium">Policy rules</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Warranty (months)</Label>
          <Input
            type="number"
            min={1}
            value={config.warranty_months}
            onChange={(e) => onChange({ ...config, warranty_months: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Max claims per serial</Label>
          <Input
            type="number"
            min={1}
            value={config.max_claims_per_serial}
            onChange={(e) => onChange({ ...config, max_claims_per_serial: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Covered device categories (comma-separated)</Label>
          <Input
            value={joinCsvList(config.covered_device_categories)}
            onChange={(e) => onChange({ ...config, covered_device_categories: parseCsvList(e.target.value) })}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Covered damage types (comma-separated)</Label>
          <Input
            value={joinCsvList(config.covered_damage_types)}
            onChange={(e) => onChange({ ...config, covered_damage_types: parseCsvList(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Cooling period (days)</Label>
          <Input
            type="number"
            min={0}
            value={config.cooling_period_days}
            onChange={(e) => onChange({ ...config, cooling_period_days: Number(e.target.value) })}
          />
        </div>
      </div>
    </div>
  );
}
