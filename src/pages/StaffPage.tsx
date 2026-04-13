import { useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { useStaff, useUpdateStaff, type StaffRow, type StaffUpdate } from '@/hooks/useStaff'
import { useDepartments } from '@/hooks/useDepartments'
import { Modal } from '@/components/ui/Modal'
import { SkeletonRows } from '@/components/ui/Skeleton'
import { EmptyRow } from '@/components/ui/EmptyState'
import { UserRound } from 'lucide-react'
import type { UserRole } from '@/types'

const roleLabel: Record<UserRole, string> = {
  admin: 'Admin',
  doctor: 'Shifokor',
  registrar: 'Registrator',
}

export function StaffPage() {
  const { data, isLoading } = useStaff()
  const { data: departments } = useDepartments(true)
  const update = useUpdateStaff()
  const [editing, setEditing] = useState<(StaffUpdate & { id: string }) | null>(null)

  function startEdit(s: StaffRow) {
    setEditing({
      id: s.id,
      full_name: s.full_name,
      role: s.role,
      phone: s.phone,
      department_id: s.department_id,
      is_active: s.is_active,
    })
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!editing) return
    try {
      await update.mutateAsync(editing)
      toast.success('Saqlandi')
      setEditing(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xato')
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Xodimlar</h2>
      </div>

      <div className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        Yangi xodim qo'shish uchun Supabase Studio orqali Auth bo'limida user yarating,
        keyin shu sahifada profilni tahrirlang (rol, bo'lim, telefon).
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
            <tr>
              <th className="px-4 py-2">FIO</th>
              <th className="px-4 py-2">Rol</th>
              <th className="px-4 py-2">Bo'lim</th>
              <th className="px-4 py-2">Telefon</th>
              <th className="px-4 py-2">Faol</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <SkeletonRows cols={6} />
            ) : data?.length ? (
              data.map((s) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium">{s.full_name}</td>
                  <td className="px-4 py-2">{roleLabel[s.role]}</td>
                  <td className="px-4 py-2">{s.department?.name ?? '—'}</td>
                  <td className="px-4 py-2">{s.phone ?? '—'}</td>
                  <td className="px-4 py-2">
                    {s.is_active ? (
                      <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">
                        Ha
                      </span>
                    ) : (
                      <span className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                        Yo'q
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => startEdit(s)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Tahrirlash
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <EmptyRow cols={6} icon={UserRound} title="Xodim yo'q" />
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Xodimni tahrirlash"
      >
        {editing && (
          <form onSubmit={onSubmit} className="space-y-3 text-sm">
            <label className="block">
              <span className="text-xs text-slate-600">FIO</span>
              <input
                required
                value={editing.full_name}
                onChange={(e) => setEditing({ ...editing, full_name: e.target.value })}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-600">Rol</span>
              <select
                value={editing.role}
                onChange={(e) =>
                  setEditing({ ...editing, role: e.target.value as UserRole })
                }
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              >
                <option value="admin">Admin</option>
                <option value="doctor">Shifokor</option>
                <option value="registrar">Registrator</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-slate-600">Bo'lim</span>
              <select
                value={editing.department_id ?? ''}
                onChange={(e) =>
                  setEditing({ ...editing, department_id: e.target.value || null })
                }
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              >
                <option value="">—</option>
                {departments?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-slate-600">Telefon</span>
              <input
                value={editing.phone ?? ''}
                onChange={(e) => setEditing({ ...editing, phone: e.target.value || null })}
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
              disabled={update.isPending}
              className="w-full rounded bg-slate-800 px-3 py-2 text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {update.isPending ? 'Saqlanmoqda…' : 'Saqlash'}
            </button>
          </form>
        )}
      </Modal>
    </div>
  )
}
