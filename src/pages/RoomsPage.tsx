import { useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import {
  useRooms,
  useSaveRoom,
  useDeleteRoom,
  type RoomInput,
  type RoomWithDepartment,
} from '@/hooks/useRooms'
import { useDepartments } from '@/hooks/useDepartments'
import { Modal } from '@/components/ui/Modal'
import { SkeletonRows } from '@/components/ui/Skeleton'
import { EmptyRow } from '@/components/ui/EmptyState'
import { DoorOpen } from 'lucide-react'

const empty: RoomInput = {
  department_id: '',
  room_number: '',
  room_type: 'standard',
  floor: null,
  is_active: true,
}

export function RoomsPage() {
  const [filterDept, setFilterDept] = useState<string | null>(null)
  const { data: departments } = useDepartments(true)
  const { data, isLoading } = useRooms(filterDept)
  const save = useSaveRoom()
  const del = useDeleteRoom()
  const [editing, setEditing] = useState<(RoomInput & { id?: string }) | null>(null)

  function startCreate() {
    setEditing({ ...empty, department_id: filterDept ?? departments?.[0]?.id ?? '' })
  }
  function startEdit(r: RoomWithDepartment) {
    setEditing({
      id: r.id,
      department_id: r.department_id,
      room_number: r.room_number,
      room_type: r.room_type,
      floor: r.floor,
      is_active: r.is_active,
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

  async function onDelete(r: RoomWithDepartment) {
    if (!window.confirm(`O'chirish: xona ${r.room_number}?`)) return
    try {
      await del.mutateAsync(r.id)
      toast.success('O\u2018chirildi')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xato')
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Xonalar</h2>
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
            disabled={!departments?.length}
            className="rounded bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
          >
            + Yangi xona
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
            <tr>
              <th className="px-4 py-2">Bo'lim</th>
              <th className="px-4 py-2">Xona №</th>
              <th className="px-4 py-2">Turi</th>
              <th className="px-4 py-2">Qavat</th>
              <th className="px-4 py-2">Faol</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <SkeletonRows cols={6} />
            ) : data?.length ? (
              data.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">{r.department.name}</td>
                  <td className="px-4 py-2 font-medium">{r.room_number}</td>
                  <td className="px-4 py-2">{r.room_type}</td>
                  <td className="px-4 py-2">{r.floor ?? '—'}</td>
                  <td className="px-4 py-2">
                    {r.is_active ? (
                      <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">
                        Ha
                      </span>
                    ) : (
                      <span className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                        Yo'q
                      </span>
                    )}
                  </td>
                  <td className="space-x-3 px-4 py-2 text-right">
                    <button
                      onClick={() => startEdit(r)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Tahrirlash
                    </button>
                    <button
                      onClick={() => onDelete(r)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      O'chirish
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <EmptyRow cols={6} icon={DoorOpen} title="Xona yo'q" />
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Xonani tahrirlash' : 'Yangi xona'}
      >
        {editing && (
          <form onSubmit={onSubmit} className="space-y-3 text-sm">
            <label className="block">
              <span className="text-xs text-slate-600">Bo'lim</span>
              <select
                required
                value={editing.department_id}
                onChange={(e) => setEditing({ ...editing, department_id: e.target.value })}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              >
                {departments?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-slate-600">Xona raqami</span>
              <input
                required
                value={editing.room_number}
                onChange={(e) => setEditing({ ...editing, room_number: e.target.value })}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-600">Turi</span>
              <select
                value={editing.room_type}
                onChange={(e) => setEditing({ ...editing, room_type: e.target.value })}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              >
                <option value="standard">Standart</option>
                <option value="vip">VIP</option>
                <option value="icu">ICU</option>
                <option value="isolation">Izolyatsiya</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-slate-600">Qavat</span>
              <input
                type="number"
                value={editing.floor ?? ''}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    floor: e.target.value === '' ? null : Number(e.target.value),
                  })
                }
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editing.is_active}
                onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
              />
              <span className="text-xs text-slate-600">Faol</span>
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
