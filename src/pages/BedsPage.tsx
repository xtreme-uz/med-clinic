import { useMemo, useState } from 'react'
import { useDepartments } from '@/hooks/useDepartments'
import { useBeds } from '@/hooks/useBeds'
import { BedCard } from '@/components/beds/BedCard'
import { BedStatusBadge } from '@/components/beds/BedStatusBadge'
import { Modal } from '@/components/ui/Modal'
import { ReservationForm } from '@/components/reservations/ReservationForm'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonBlock } from '@/components/ui/Skeleton'
import { BedDouble } from 'lucide-react'
import type { BedWithRoom } from '@/types'

export function BedsPage() {
  const { data: departments } = useDepartments()
  const [departmentId, setDepartmentId] = useState<string | null>(null)
  const { data: beds, isLoading } = useBeds({ departmentId })
  const [selected, setSelected] = useState<BedWithRoom | null>(null)

  const grouped = useMemo(() => {
    const map = new Map<string, { roomLabel: string; beds: BedWithRoom[] }>()
    for (const bed of beds ?? []) {
      const key = bed.room.id
      if (!map.has(key)) {
        map.set(key, {
          roomLabel: `${bed.room.department.name} · Xona ${bed.room.room_number} (${bed.room.room_type})`,
          beds: [],
        })
      }
      map.get(key)!.beds.push(bed)
    }
    return Array.from(map.values())
  }, [beds])

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Karavotlar</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Bo'lim:</span>
          <select
            value={departmentId ?? ''}
            onChange={(e) => setDepartmentId(e.target.value || null)}
            className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
          >
            <option value="">Hammasi</option>
            {departments?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <BedStatusBadge status="free" />
        <BedStatusBadge status="reserved" />
        <BedStatusBadge status="occupied" />
        <BedStatusBadge status="maintenance" />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <div className="rounded-lg bg-white shadow-sm">
          <EmptyState icon={BedDouble} title="Karavotlar topilmadi" />
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((g) => (
            <div key={g.roomLabel} className="rounded-lg bg-white p-4 shadow-sm">
              <div className="mb-3 text-sm font-medium text-slate-700">{g.roomLabel}</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                {g.beds.map((bed) => (
                  <BedCard key={bed.id} bed={bed} onClick={setSelected} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Karavotni band qilish"
        size="lg"
      >
        {selected && (
          <ReservationForm
            bed={selected}
            roomBeds={grouped.find((g) => g.beds.some((b) => b.id === selected.id))?.beds}
            onDone={() => setSelected(null)}
          />
        )}
      </Modal>
    </div>
  )
}
