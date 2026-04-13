import { useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import {
  useDepartments,
  useSaveDepartment,
  useDeleteDepartment,
  type DepartmentInput,
} from '@/hooks/useDepartments'
import { Modal } from '@/components/ui/Modal'
import { SkeletonRows } from '@/components/ui/Skeleton'
import { EmptyRow } from '@/components/ui/EmptyState'
import { Building2 } from 'lucide-react'
import type { Department } from '@/types'

const empty: DepartmentInput = { name: '', description: null, floor: null, is_active: true }

export function DepartmentsPage() {
  const { data, isLoading } = useDepartments(true)
  const save = useSaveDepartment()
  const del = useDeleteDepartment()
  const [editing, setEditing] = useState<(DepartmentInput & { id?: string }) | null>(null)

  function startCreate() {
    setEditing({ ...empty })
  }
  function startEdit(d: Department) {
    setEditing({
      id: d.id,
      name: d.name,
      description: d.description,
      floor: d.floor,
      is_active: d.is_active,
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

  async function onDelete(d: Department) {
    if (!window.confirm(`O'chirish: ${d.name}?`)) return
    try {
      await del.mutateAsync(d.id)
      toast.success('O\u2018chirildi')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xato')
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Bo'limlar</h2>
        <button
          onClick={startCreate}
          className="rounded bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
        >
          + Yangi bo'lim
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
            <tr>
              <th className="px-4 py-2">Nomi</th>
              <th className="px-4 py-2">Qavat</th>
              <th className="px-4 py-2">Tavsif</th>
              <th className="px-4 py-2">Faol</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <SkeletonRows cols={5} />
            ) : data?.length ? (
              data.map((d) => (
                <tr key={d.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium">{d.name}</td>
                  <td className="px-4 py-2">{d.floor ?? '—'}</td>
                  <td className="px-4 py-2 text-slate-600">{d.description ?? '—'}</td>
                  <td className="px-4 py-2">
                    {d.is_active ? (
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
                      onClick={() => startEdit(d)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Tahrirlash
                    </button>
                    <button
                      onClick={() => onDelete(d)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      O'chirish
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <EmptyRow cols={5} icon={Building2} title="Bo'lim yo'q" />
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Bo'limni tahrirlash" : "Yangi bo'lim"}
      >
        {editing && (
          <form onSubmit={onSubmit} className="space-y-3 text-sm">
            <label className="block">
              <span className="text-xs text-slate-600">Nomi</span>
              <input
                required
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              />
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
            <label className="block">
              <span className="text-xs text-slate-600">Tavsif</span>
              <textarea
                value={editing.description ?? ''}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value || null })
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
