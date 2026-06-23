'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { previewPolicyRules, type PolicyTestInput } from '@/lib/policy-preview';
import type { PolicyConfig } from '@/lib/types';

export function PolicyTestPanel({ config }: { config: PolicyConfig }) {
  const [input, setInput] = useState<PolicyTestInput>({
    device_category: 'smartphone',
    damage_type: 'screen',
    purchase_date: '2025-01-01',
    claim_date: '2025-06-01',
    prior_claims: 0,
  });

  const rules = previewPolicyRules(config, input);
  const allPassed = rules.every((r) => r.passed);

  return (
    <div className="space-y-4 rounded-xl border border-border p-5">
      <div>
        <h3 className="font-medium">Test policy</h3>
        <p className="text-sm text-muted-foreground">Preview which rules pass for a sample claim</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Device category</Label>
          <Input value={input.device_category} onChange={(e) => setInput({ ...input, device_category: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Damage type</Label>
          <Input value={input.damage_type} onChange={(e) => setInput({ ...input, damage_type: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Purchase date</Label>
          <Input type="date" value={input.purchase_date} onChange={(e) => setInput({ ...input, purchase_date: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Claim date</Label>
          <Input type="date" value={input.claim_date} onChange={(e) => setInput({ ...input, claim_date: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Prior claims on serial</Label>
          <Input type="number" min={0} value={input.prior_claims} onChange={(e) => setInput({ ...input, prior_claims: Number(e.target.value) })} />
        </div>
      </div>
      <p className="text-sm">
        Overall:{' '}
        <Badge variant={allPassed ? 'default' : 'destructive'}>{allPassed ? 'Would pass policy' : 'Would fail policy'}</Badge>
      </p>
      <div className="space-y-2">
        {rules.map((r) => (
          <div key={r.rule_id} className="flex justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm">
            <span>{r.rule_id}</span>
            <Badge variant={r.passed ? 'default' : 'destructive'}>{r.passed ? 'Pass' : 'Fail'}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
