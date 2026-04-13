import { useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { useBeds, useSaveBed, useDeleteBed, type BedInput } from '@/hooks/useBeds'
import { useRooms } from '@/hooks/useRooms'
import { useDepartments } from '@/hooks/useDepartments'
import { Modal } from '@/components/ui/Modal'
import { SkeletonRows } from '@/components/ui/Skeleton'
import { EmptyRow } from '@/components/ui/EmptyState'
import { BedDouble } from 'lucide-react'
import type { BedStatus, BedWithRoom } from '@/types'

const statusLabel: Record<BedStatus, string> = {
  free: 'Bo\u2018sh',
  reserved: 'Band qilingan',
  occupied: 'Yotqizilgan',
  maintenance: "Ta'mirda",
}

const empty: BedInput = {
  room_id: '',
  bed_number: '',
  daily_price: 0,
  status: 'free',
  notes: null,
}

export function BedsManagePage() {
  const [filterDept, setFilterDept] = useState<string | null>(null)
  const { data: departments } = useDepartments(true)
  const { data: rooms } = useRooms(filterDept)
  const { data: beds, isLoading } = useBeds({ departmentId: filterDept })
  const save = useSaveBed()
  const del = useDeleteBed()
  const [editing, setEditing] = useState<(BedInput & { id?: string }) | null>(null)

  function startCreate() {
    setEditing({ ...empty, room_id: rooms?.[0]?.id ?? '' })
  }
  function startEdit(b: BedWithRoom) {
    setEditing({
      id: b.id,
      room_id: b.room_id,
      bed_number: b.bed_number,
      daily_price: Number(b.daily_price),
      status: b.status,
      notes: b.notes,
    })
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!editing) return
    try {
      await save.mutateAsync(editing)
      toast.success('Saqlandi')
      setEditing(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xato')
    }
  }

  async function onDelete(b: BedWithRoom) {
    if (!window.confirm(`O'chirish: karavot #${b.bed_number}?`)) return
    try {
      await del.mutateAsync(b.id)
      toast.success('O\u2018chirildi')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xato')
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Karavotlar (boshqaruv)</h2>
        <div className="flex items-center gap-2">
          <select
            value={filterDept ?? ''}
            onChange={(e) => setFilterDept(e.target.value || null)}
            className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
          >
            <option value="">Barcha bo'limlar</option>
            {departments?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <button
            onClick={startCreate}
            disabled={!rooms?.length}
            className="rounded bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
          >
            + Yangi karavot
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
            <tr>
              <th className="px-4 py-2">Bo'lim / Xona</th>
              <th className="px-4 py-2">Karavot №</th>
              <th className="px-4 py-2">Kunlik narx</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Izoh</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <SkeletonRows cols={6} />
            ) : beds?.length ? (
              beds.map((b) => (
                <tr key={b.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">
                    {b.room.department.name}
                    <div className="text-xs text-slate-500">Xona {b.room.room_number}</div>
                  </td>
                  <td className="px-4 py-2 font-medium">{b.bed_number}</td>
                  <td className="px-4 py-2">
                    {Number(b.daily_price).toLocaleString('uz-UZ')} so'm
                  </td>
                  <td className="px-4 py-2 text-xs">{statusLabel[b.status]}</td>
                  <td className="px-4 py-2 text-xs text-slate-500">{b.notes ?? '—'}</td>
                  <td className="space-x-3 px-4 py-2 text-right">
                    <button
                      onClick={() => startEdit(b)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Tahrirlash
                    </button>
                    <button
                      onClick={() => onDelete(b)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      O'chirish
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <EmptyRow cols={6} icon={BedDouble} title="Karavot yo'q" />
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Karavotni tahrirlash' : 'Yangi karavot'}
      >
        {editing && (
          <form onSubmit={onSubmit} className="space-y-3 text-sm">
            <label className="block">
              <span className="text-xs text-slate-600">Xona</span>
              <select
                required
                value={editing.room_id}
                onChange={(e) => setEditing({ ...editing, room_id: e.target.value })}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              >
                {rooms?.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.department.name} · Xona {r.room_number}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-slate-600">Karavot raqami</span>
              <input
                required
                value={editing.bed_number}
                onChange={(e) => setEditing({ ...editing, bed_number: e.target.value })}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-600">Kunlik narx (so'm)</span>
              <input
                type="number"
                min="0"
                step="1000"
                required
                value={editing.daily_price}
                onChange={(e) =>
                  setEditing({ ...editing, daily_price: Number(e.target.value) })
                }
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-600">Status</span>
              <select
                value={editing.status}
                onChange={(e) =>
                  setEditing({ ...editing, status: e.target.value as BedStatus })
                }
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              >
                <option value="free">{statusLabel.free}</option>
                <option value="maintenance">{statusLabel.maintenance}</option>
              </select>
              <span className="mt-1 block text-xs text-slate-500">
                Band/Yotqizilgan holat avtomatik tarzda aniqlanadi.
              </span>
            </label>
            <label className="block">
              <span className="text-xs text-slate-600">Izoh</span>
              <textarea
                value={editing.notes ?? ''}
                onChange={(e) => setEditing({ ...editing, notes: e.target.value || null })}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              />
            </label>
            <button
              type="submit"
              disabled={save.isPending}
              className="w-full rounded bg-slate-800 px-3 py-2 text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {save.isPending ? 'Saqlanmoqda…' : 'Saqlash'}
            </button>
          </form>
        )}
      </Modal>
    </div>
  )
}
