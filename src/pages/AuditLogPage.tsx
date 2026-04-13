import { Fragment, useState } from 'react'
import { useAuditLog } from '@/hooks/useAuditLog'
import { SkeletonRows } from '@/components/ui/Skeleton'
import { EmptyRow } from '@/components/ui/EmptyState'
import { ScrollText } from 'lucide-react'

const ENTITY_OPTIONS = [
  { value: '', label: 'Barcha obyektlar' },
  { value: 'reservations', label: 'Bandlovlar' },
  { value: 'admissions', label: 'Yotqizishlar' },
  { value: 'patients', label: 'Bemorlar' },
  { value: 'beds', label: 'Karavotlar' },
  { value: 'departments', label: "Bo'limlar" },
  { value: 'rooms', label: 'Xonalar' },
  { value: 'profiles', label: 'Xodimlar' },
]

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'medium' })
}

export function AuditLogPage() {
  const [entityType, setEntityType] = useState<string>('')
  const { data, isLoading } = useAuditLog({ entityType: entityType || null })
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Audit Log</h2>
        <select
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
        >
          {ENTITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
            <tr>
              <th className="px-4 py-2">Vaqt</th>
              <th className="px-4 py-2">Foydalanuvchi</th>
              <th className="px-4 py-2">Harakat</th>
              <th className="px-4 py-2">Obyekt</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <SkeletonRows cols={5} />
            ) : data?.length ? (
              data.map((e) => (
                <Fragment key={e.id}>
                  <tr className="border-t border-slate-100">
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-slate-600">
                      {fmtDateTime(e.created_at)}
                    </td>
                    <td className="px-4 py-2">
                      {e.user?.full_name ?? '—'}
                      {e.user?.role && (
                        <span className="ml-1 text-xs text-slate-500">({e.user.role})</span>
                      )}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">{e.action}</td>
                    <td className="px-4 py-2 font-mono text-xs text-slate-600">
                      {e.entity_type}
                      <div className="text-[10px] text-slate-400">{e.entity_id.slice(0, 8)}…</div>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {expanded === e.id ? 'Yopish' : "Ma'lumot"}
                      </button>
                    </td>
                  </tr>
                  {expanded === e.id && (
                    <tr className="bg-slate-50">
                      <td colSpan={5} className="px-4 py-3">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <div className="mb-1 font-semibold text-slate-600">Old</div>
                            <pre className="max-h-64 overflow-auto rounded bg-white p-2 text-[11px]">
                              {JSON.stringify(e.old_data, null, 2) || '—'}
                            </pre>
                          </div>
                          <div>
                            <div className="mb-1 font-semibold text-slate-600">New</div>
                            <pre className="max-h-64 overflow-auto rounded bg-white p-2 text-[11px]">
                              {JSON.stringify(e.new_data, null, 2) || '—'}
                            </pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            ) : (
              <EmptyRow cols={5} icon={ScrollText} title="Log yo'q" />
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
