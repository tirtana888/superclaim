'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import { PolicyTestPanel } from '@/components/policy-builder/test-panel';
import { RuleEditor } from '@/components/policy-builder/rule-editor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DEFAULT_POLICY_CONFIG } from '@/lib/policy-preview';
import { bffRequest } from '@/lib/api';
import type { Policy, PolicyConfig } from '@/lib/types';

function asConfig(rules: Policy['rules_json']): PolicyConfig {
  const r = rules as PolicyConfig;
  return {
    warranty_months: r.warranty_months ?? DEFAULT_POLICY_CONFIG.warranty_months,
    covered_device_categories: r.covered_device_categories ?? DEFAULT_POLICY_CONFIG.covered_device_categories,
    covered_damage_types: r.covered_damage_types ?? DEFAULT_POLICY_CONFIG.covered_damage_types,
    max_claims_per_serial: r.max_claims_per_serial ?? DEFAULT_POLICY_CONFIG.max_claims_per_serial,
    cooling_period_days: r.cooling_period_days ?? DEFAULT_POLICY_CONFIG.cooling_period_days,
  };
}

export default function PolicyBuilderPage({ params }: { params: { id: string } }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['policy', params.id],
    queryFn: () => bffRequest<Policy>(`/api/control/policies/${params.id}`),
  });
  const [config, setConfig] = useState<PolicyConfig | null>(null);
  const [saving, setSaving] = useState(false);

  const activeConfig = config ?? (data ? asConfig(data.rules_json) : null);

  async function saveDraft() {
    if (!activeConfig) return;
    setSaving(true);
    try {
      await bffRequest(`/api/control/policies/${params.id}`, {
        method: 'PATCH',
        body: { rules_json: activeConfig },
      });
      toast.success('Policy saved');
      await qc.invalidateQueries({ queryKey: ['policy', params.id] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function activate() {
    try {
      await bffRequest(`/api/control/policies/${params.id}/activate`, { method: 'POST' });
      toast.success('Policy activated');
      await qc.invalidateQueries({ queryKey: ['policy', params.id] });
      await qc.invalidateQueries({ queryKey: ['policies'] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Activate failed');
    }
  }

  async function newVersion() {
    try {
      const p = await bffRequest<Policy>(`/api/control/policies/${params.id}/versions`, { method: 'POST' });
      toast.success('New draft version created');
      window.location.href = `/policies/${p.id}`;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    }
  }

  if (isLoading || !data || !activeConfig) {
    return <p className="text-sm text-muted-foreground">Loading policy…</p>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link href="/policies" className="text-sm text-primary hover:underline">
          ← Back to policies
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{data.name}</h1>
          <Badge variant="secondary">{data.status}</Badge>
          <span className="text-sm text-muted-foreground">v{data.version}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void saveDraft()} disabled={saving || data.status !== 'draft'}>
          {saving ? 'Saving…' : 'Save draft'}
        </Button>
        {data.status === 'draft' && (
          <Button variant="outline" onClick={() => void activate()}>
            Activate
          </Button>
        )}
        <Button variant="outline" onClick={() => void newVersion()}>
          New version
        </Button>
      </div>

      <RuleEditor config={activeConfig} onChange={setConfig} />
      <PolicyTestPanel config={activeConfig} />
    </div>
  );
}
