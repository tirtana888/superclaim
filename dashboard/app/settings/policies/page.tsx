'use client';

import { useState } from 'react';

import { ControlListPage } from '@/components/control-list-page';

function splitCsv(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function PoliciesPage() {
  const [showForm, setShowForm] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [name, setName] = useState('');
  const [warrantyMonths, setWarrantyMonths] = useState('12');
  const [categories, setCategories] = useState('smartphone, tablet, laptop');
  const [damageTypes, setDamageTypes] = useState('screen, battery, water');
  const [maxClaims, setMaxClaims] = useState('2');
  const [coolingDays, setCoolingDays] = useState('30');

  async function createPolicy(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    const res = await fetch('/api/control/policies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        rules_json: {
          warranty_months: Number(warrantyMonths),
          covered_device_categories: splitCsv(categories),
          covered_damage_types: splitCsv(damageTypes),
          max_claims_per_serial: Number(maxClaims),
          cooling_period_days: Number(coolingDays),
        },
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setFormError(data?.detail?.message ?? 'Failed to create policy');
      return;
    }
    setShowForm(false);
    setName('');
    setReloadKey((k) => k + 1);
  }

  async function activatePolicy(id: string, reload: () => void) {
    const res = await fetch(`/api/control/policies/${id}/activate`, { method: 'POST' });
    if (!res.ok) {
      const data = await res.json();
      alert(data?.detail?.message ?? 'Activate failed');
      return;
    }
    reload();
    setReloadKey((k) => k + 1);
  }

  return (
    <div className="space-y-4">
      {showForm && (
        <form
          onSubmit={(e) => void createPolicy(e)}
          className="space-y-3 rounded-xl border border-emerald-600/30 bg-emerald-600/5 p-4"
        >
          <h2 className="font-medium">New policy</h2>
          {formError && <p className="text-sm text-red-400">{formError}</p>}
          <input
            className="w-full rounded-lg border border-[hsl(var(--border))] bg-transparent px-3 py-2 text-sm"
            placeholder="Policy name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Warranty (months)
              <input
                type="number"
                min={1}
                className="mt-1 w-full rounded-lg border border-[hsl(var(--border))] bg-transparent px-3 py-2"
                value={warrantyMonths}
                onChange={(e) => setWarrantyMonths(e.target.value)}
              />
            </label>
            <label className="text-sm">
              Max claims per serial
              <input
                type="number"
                min={1}
                className="mt-1 w-full rounded-lg border border-[hsl(var(--border))] bg-transparent px-3 py-2"
                value={maxClaims}
                onChange={(e) => setMaxClaims(e.target.value)}
              />
            </label>
            <label className="text-sm sm:col-span-2">
              Device categories (comma-separated)
              <input
                className="mt-1 w-full rounded-lg border border-[hsl(var(--border))] bg-transparent px-3 py-2"
                value={categories}
                onChange={(e) => setCategories(e.target.value)}
              />
            </label>
            <label className="text-sm sm:col-span-2">
              Covered damage types (comma-separated)
              <input
                className="mt-1 w-full rounded-lg border border-[hsl(var(--border))] bg-transparent px-3 py-2"
                value={damageTypes}
                onChange={(e) => setDamageTypes(e.target.value)}
              />
            </label>
            <label className="text-sm">
              Cooling period (days)
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded-lg border border-[hsl(var(--border))] bg-transparent px-3 py-2"
                value={coolingDays}
                onChange={(e) => setCoolingDays(e.target.value)}
              />
            </label>
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            New policies start as <strong>draft</strong>. Activate from the table when ready.
          </p>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Create policy'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-[hsl(var(--border))] px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <ControlListPage
        title="Policies"
        apiPath="/policies"
        reloadKey={reloadKey}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'external_policy_id', label: 'ID' },
          { key: 'version', label: 'Ver' },
          { key: 'status', label: 'Status' },
        ]}
        headerAction={
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            + New policy
          </button>
        }
        rowActions={(row, reload) =>
          row.status === 'draft' ? (
            <button
              type="button"
              onClick={() => void activatePolicy(String(row.id), reload)}
              className="text-sm text-emerald-400 hover:underline"
            >
              Activate
            </button>
          ) : null
        }
      />
    </div>
  );
}
