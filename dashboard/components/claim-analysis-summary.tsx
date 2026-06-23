import type { AnalysisResult } from '@/lib/types';
import {
  decisionHeadline,
  getOcrSummary,
  getPolicyRules,
  getVisionSummary,
  reasonSeverityClass,
} from '@/lib/analysis';

interface ClaimAnalysisSummaryProps {
  analysis: AnalysisResult;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <span className="text-sm text-[hsl(var(--muted-foreground))]">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export function ClaimAnalysisSummary({ analysis }: ClaimAnalysisSummaryProps) {
  const vision = getVisionSummary(analysis);
  const ocr = getOcrSummary(analysis);
  const policyRules = getPolicyRules(analysis);
  const failedRules = policyRules.filter((rule) => !rule.passed);
  const isReject = analysis.decision === 'REJECT';

  return (
    <div className="space-y-4">
      <div
        className={
          isReject
            ? 'rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4'
            : analysis.decision === 'APPROVE'
              ? 'rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4'
              : 'rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4'
        }
      >
        <p className="text-sm font-semibold">{decisionHeadline(analysis.decision)}</p>
        {analysis.reasons.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {analysis.reasons.map((reason) => (
              <li key={reason.code} className="text-sm">
                <span className={`font-medium ${reasonSeverityClass(reason.severity)}`}>
                  {reason.code}
                </span>
                <span className="mx-2 text-[hsl(var(--muted-foreground))]">·</span>
                {reason.description}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            Tidak ada alasan spesifik tercatat.
          </p>
        )}
      </div>

      {isReject && failedRules.length > 0 && (
        <div className="card border-red-500/20">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-red-400">
            Aturan polis yang gagal
          </h3>
          <ul className="space-y-2">
            {failedRules.map((rule) => (
              <li
                key={rule.rule_id}
                className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm"
              >
                <span className="font-medium text-red-300">{rule.rule_id}</span>
                <span className="mx-2 text-[hsl(var(--muted-foreground))]">·</span>
                {rule.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
            Analisis foto (Gemini Vision)
          </h3>
          {vision ? (
            <div className="space-y-2">
              <DetailRow label="Jenis kerusakan" value={vision.damageType} />
              <DetailRow label="Tingkat kerusakan" value={vision.severity} />
              <DetailRow label="Perangkat terdeteksi" value={vision.device} />
              <DetailRow
                label="Confidence AI"
                value={`${(vision.confidence * 100).toFixed(0)}%`}
              />
            </div>
          ) : (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Analisis vision tidak tersedia.
            </p>
          )}
        </div>

        <div className="card">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
            OCR serial (Mistral)
          </h3>
          {ocr ? (
            <div className="space-y-2">
              <DetailRow
                label="Serial ditemukan"
                value={ocr.serials.length > 0 ? ocr.serials.join(', ') : 'Tidak ada'}
              />
              <DetailRow label="Best match" value={ocr.bestMatch ?? '—'} />
              <DetailRow
                label="Cocok dengan input"
                value={
                  ocr.matchWithInput === null
                    ? '—'
                    : ocr.matchWithInput
                      ? 'Ya'
                      : 'Tidak'
                }
              />
              <DetailRow
                label="Confidence OCR"
                value={`${(ocr.confidence * 100).toFixed(0)}%`}
              />
            </div>
          ) : (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Analisis OCR tidak tersedia.
            </p>
          )}
        </div>
      </div>

      {policyRules.length > 0 && (
        <div className="card">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
            Evaluasi polis
          </h3>
          <ul className="space-y-2">
            {policyRules.map((rule) => (
              <li
                key={rule.rule_id}
                className={`rounded-lg border px-4 py-3 text-sm ${
                  rule.passed
                    ? 'border-emerald-500/20 bg-emerald-500/5'
                    : 'border-red-500/20 bg-red-500/5'
                }`}
              >
                <span
                  className={`font-medium ${rule.passed ? 'text-emerald-400' : 'text-red-400'}`}
                >
                  {rule.passed ? 'PASS' : 'FAIL'}
                </span>
                <span className="mx-2 text-[hsl(var(--muted-foreground))]">·</span>
                <span className="font-medium">{rule.rule_id}</span>
                <span className="mx-2 text-[hsl(var(--muted-foreground))]">·</span>
                {rule.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.duplicate_detected && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Duplikat gambar terdeteksi pada klaim ini.
        </div>
      )}
    </div>
  );
}
