'use client';

import { useEffect, useState } from 'react';

type Row = Record<string, unknown>;

export function ControlListPage({
  title,
  apiPath,
  columns,
}: {
  title: string;
  apiPath: string;
  columns: { key: string; label: string }[];
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/control${apiPath}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data?.detail?.message ?? 'Failed to load');
        return;
      }
      const listKey = Object.keys(data).find((k) => Array.isArray(data[k]));
      setRows(listKey ? (data[listKey] as Row[]) : []);
    })();
  }, [apiPath]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="overflow-x-auto rounded-xl border border-[hsl(var(--border))]">
        <table className="min-w-full text-sm">
          <thead className="bg-[hsl(var(--muted))]/30">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-2 text-left font-medium">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-[hsl(var(--border))]">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-2">
                    {String(row[c.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && !error && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-6 text-center text-[hsl(var(--muted-foreground))]">
                  No data yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
