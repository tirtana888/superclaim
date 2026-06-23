'use client';

import { useState } from 'react';

import { ControlListPage } from '@/components/control-list-page';

export default function CredentialsPage() {
  const [showForm, setShowForm] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [label, setLabel] = useState('');
  const [createdSecret, setCreatedSecret] = useState<{
    key_id: string;
    secret: string;
    label: string | null;
  } | null>(null);

  async function createCredential(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    const res = await fetch('/api/control/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: label.trim() || null }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setFormError(data?.detail?.message ?? 'Failed to create API key');
      return;
    }
    setShowForm(false);
    setLabel('');
    setCreatedSecret({
      key_id: String(data.key_id),
      secret: String(data.secret),
      label: data.label ? String(data.label) : null,
    });
    setReloadKey((k) => k + 1);
  }

  function copyText(text: string) {
    void navigator.clipboard.writeText(text);
  }

  return (
    <div className="space-y-4">
      {createdSecret && (
        <div className="space-y-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
          <h2 className="font-medium text-amber-200">API key created — copy secret now</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            The secret is shown only once. Store it securely.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[hsl(var(--muted-foreground))]">Key ID:</span>
              <code className="rounded bg-black/30 px-2 py-1">{createdSecret.key_id}</code>
              <button
                type="button"
                onClick={() => copyText(createdSecret.key_id)}
                className="text-emerald-400 hover:underline"
              >
                Copy
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[hsl(var(--muted-foreground))]">Secret:</span>
              <code className="break-all rounded bg-black/30 px-2 py-1">{createdSecret.secret}</code>
              <button
                type="button"
                onClick={() => copyText(createdSecret.secret)}
                className="text-emerald-400 hover:underline"
              >
                Copy
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCreatedSecret(null)}
            className="rounded-lg border border-[hsl(var(--border))] px-3 py-1.5 text-sm"
          >
            Dismiss
          </button>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={(e) => void createCredential(e)}
          className="space-y-3 rounded-xl border border-emerald-600/30 bg-emerald-600/5 p-4"
        >
          <h2 className="font-medium">New API key</h2>
          {formError && <p className="text-sm text-red-400">{formError}</p>}
          <input
            className="w-full rounded-lg border border-[hsl(var(--border))] bg-transparent px-3 py-2 text-sm"
            placeholder="Label (optional, e.g. Production website)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Use headers <code>X-API-Key-Id</code> and <code>X-API-Secret</code> for{' '}
            <code>POST /v1/claims/analyze</code>.
          </p>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create API key'}
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
        title="API credentials"
        apiPath="/credentials"
        reloadKey={reloadKey}
        columns={[
          { key: 'key_id', label: 'Key ID' },
          { key: 'label', label: 'Label' },
          { key: 'status', label: 'Status' },
          { key: 'last_used_at', label: 'Last used' },
        ]}
        headerAction={
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            + New API key
          </button>
        }
      />
    </div>
  );
}
