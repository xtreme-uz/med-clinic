import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAdmissions, useDischarge } from '@/hooks/useAdmissions'
import { SkeletonRows } from '@/components/ui/Skeleton'
import { EmptyRow } from '@/components/ui/EmptyState'
import { BedDouble } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import type { AdmissionStatus } from '@/types'

const statusLabel: Record<AdmissionStatus, string> = {
  active: 'Yotqizilgan',
  discharged: 'Chiqarilgan',
  transferred: 'Ko\u2018chirildi',
}

const statusClass: Record<AdmissionStatus, string> = {
  active: 'bg-green-100 text-green-800',
  discharged: 'bg-slate-200 text-slate-700',
  transferred: 'bg-blue-100 text-blue-800',
}

function fmtDateTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' })
}

export function AdmissionsPage() {
  const [filter, setFilter] = useState<AdmissionStatus | 'all'>('active')
  const profile = useAuthStore((s) => s.profile)
  const { data, isLoading } = useAdmissions(filter === 'all' ? undefined : filter)
  const discharge = useDischarge()

  async function onDischarge(id: string) {
    if (!profile) return
    const summary = window.prompt('Chiqarish xulosasi:')
    if (!summary) return
    try {
      await discharge.mutateAsync({ id, summary, discharged_by: profile.id })
      toast.success('Chiqarildi')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xato')
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Yotqizishlar</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as AdmissionStatus | 'all')}
          className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
        >
          <option value="active">Faol</option>
          <option value="discharged">Chiqarilgan</option>
          <option value="transferred">Ko'chirildi</option>
          <option value="all">Hammasi</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
            <tr>
              <th className="px-4 py-2">Bemor</th>
              <th className="px-4 py-2">Bo'lim / Karavot</th>
              <th className="px-4 py-2">Shifokor</th>
              <th className="px-4 py-2">Yotqizilgan</th>
              <th className="px-4 py-2">Chiqarilgan</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <SkeletonRows cols={7} />
            ) : data?.length ? (
              data.map((a) => (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">
                    {a.patient.last_name} {a.patient.first_name}
                    <div className="text-xs text-slate-500">{a.patient.phone}</div>
                  </td>
                  <td className="px-4 py-2">
                    {a.bed.room.department.name}
                    <div className="text-xs text-slate-500">
                      Xona {a.bed.room.room_number} · Karavot #{a.bed.bed_number}
                    </div>
                  </td>
                  <td className="px-4 py-2">{a.attending_doctor?.full_name ?? '—'}</td>
                  <td className="px-4 py-2">{fmtDateTime(a.admitted_at)}</td>
                  <td className="px-4 py-2">{fmtDateTime(a.discharged_at)}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded px-2 py-0.5 text-xs ${statusClass[a.status]}`}>
                      {statusLabel[a.status]}
                    </span>
                  </td>
                  <td className="space-x-3 px-4 py-2 text-right">
                    {a.status === 'active' && (
                      <button
                        onClick={() => onDischarge(a.id)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Chiqarish
                      </button>
                    )}
                    {a.status !== 'active' && (
                      <a
                        href={`#/admissions/${a.id}/print`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-slate-600 hover:underline"
                      >
                        Chop etish
                      </a>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <EmptyRow cols={7} icon={BedDouble} title="Yotqizish yo'q" />
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
