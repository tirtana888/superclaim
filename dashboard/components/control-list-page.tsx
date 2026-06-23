'use client';

import { useCallback, useEffect, useState } from 'react';

type Row = Record<string, unknown>;

export function ControlListPage({
  title,
  apiPath,
  columns,
  headerAction,
  rowActions,
  reloadKey = 0,
}: {
  title: string;
  apiPath: string;
  columns: { key: string; label: string }[];
  headerAction?: React.ReactNode;
  rowActions?: (row: Row, reload: () => void) => React.ReactNode;
  reloadKey?: number;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const res = await fetch(`/api/control${apiPath}`);
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data?.detail?.message ?? 'Failed to load');
      return;
    }
    const listKey = Object.keys(data).find((k) => Array.isArray(data[k]));
    setRows(listKey ? (data[listKey] as Row[]) : []);
  }, [apiPath]);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {headerAction}
      </div>
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
              {rowActions && <th className="px-4 py-2 text-left font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={String(row.id ?? i)} className="border-t border-[hsl(var(--border))]">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-2">
                    {String(row[c.key] ?? '—')}
                  </td>
                ))}
                {rowActions && (
                  <td className="px-4 py-2">{rowActions(row, () => void load())}</td>
                )}
              </tr>
            ))}
            {rows.length === 0 && !error && !loading && (
              <tr>
                <td
                  colSpan={columns.length + (rowActions ? 1 : 0)}
                  className="px-4 py-6 text-center text-[hsl(var(--muted-foreground))]"
                >
                  No data yet
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td
                  colSpan={columns.length + (rowActions ? 1 : 0)}
                  className="px-4 py-6 text-center text-[hsl(var(--muted-foreground))]"
                >
                  Loading…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
