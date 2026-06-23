'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import type { ClaimRow } from '@/lib/types';
import { formatMs, formatUsd, statusBadgeClass } from '@/lib/utils';

interface ClaimDetailViewProps {
  claim: ClaimRow;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
        {title}
      </h3>
      {children}
    </div>
  );
}

function JsonBlock({ data }: { data: Record<string, unknown> | undefined }) {
  if (!data || Object.keys(data).length === 0) {
    return <p className="text-sm text-[hsl(var(--muted-foreground))]">No data</p>;
  }
  return (
    <pre className="overflow-x-auto rounded-lg bg-[hsl(var(--muted))]/50 p-4 text-xs leading-relaxed">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export function ClaimDetailView({ claim }: ClaimDetailViewProps) {
  const analysis = claim.metadata?.analysis_result;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{claim.external_claim_id}</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {claim.device_category} · {claim.serial_number_input ?? 'No serial'}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <span className={statusBadgeClass(claim.status)}>{claim.status}</span>
          {analysis && (
            <span className={statusBadgeClass(analysis.decision)}>{analysis.decision}</span>
          )}
        </div>
      </div>

      {!analysis ? (
        <div className="card text-[hsl(var(--muted-foreground))]">
          {claim.status === 'processing' ? (
            <>Claim is still processing. This page auto-refreshes every 3 seconds.</>
          ) : (
            <>
              Processing finished (status: <strong>{claim.status}</strong>) but analysis
              details are not available yet. Try refreshing the page.
            </>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="card">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Confidence</p>
              <p className="text-2xl font-semibold">{analysis.confidence_score.toFixed(2)}</p>
            </div>
            <div className="card">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Fraud score</p>
              <p className="text-2xl font-semibold">{analysis.fraud_score.toFixed(2)}</p>
            </div>
            <div className="card">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Processing</p>
              <p className="text-2xl font-semibold">{formatMs(analysis.processing_time_ms)}</p>
            </div>
            <div className="card">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">AI cost</p>
              <p className="text-2xl font-semibold">{formatUsd(analysis.ai_cost_usd)}</p>
            </div>
          </div>

          <Section title="Reasons">
            <ul className="space-y-2">
              {analysis.reasons.map((reason) => (
                <li
                  key={reason.code}
                  className="rounded-lg border border-[hsl(var(--border))] px-4 py-3 text-sm"
                >
                  <span className="font-medium text-emerald-400">{reason.code}</span>
                  <span className="mx-2 text-[hsl(var(--muted-foreground))]">·</span>
                  {reason.description}
                </li>
              ))}
            </ul>
          </Section>

          <div className="grid gap-4 lg:grid-cols-2">
            <Section title="Vision (Gemini)">
              <JsonBlock data={analysis.vision_result} />
            </Section>
            <Section title="OCR (Mistral)">
              <JsonBlock data={analysis.ocr_result} />
            </Section>
            <Section title="Policy">
              <JsonBlock data={analysis.policy_result} />
            </Section>
            <Section title="Duplicate / metadata">
              <p className="mb-2 text-sm">
                Duplicate detected:{' '}
                <strong>{analysis.duplicate_detected ? 'Yes' : 'No'}</strong>
              </p>
              <JsonBlock data={claim.metadata as Record<string, unknown>} />
            </Section>
          </div>
        </>
      )}
    </div>
  );
}
