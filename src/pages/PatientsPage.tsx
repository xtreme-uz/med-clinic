import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { usePatients } from '@/hooks/usePatients'
import { formatDate } from '@/lib/dateUtils'
import { Modal } from '@/components/ui/Modal'
import { SkeletonRows } from '@/components/ui/Skeleton'
import { EmptyRow } from '@/components/ui/EmptyState'
import { Users } from 'lucide-react'
import { PatientForm } from '@/components/patients/PatientForm'

export function PatientsPage() {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const { data, isLoading } = usePatients(search)
  const navigate = useNavigate()

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Bemorlar</h2>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 rounded bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
        >
          <Plus className="h-4 w-4" /> Yangi bemor
        </button>
      </div>
      <input
        placeholder="Qidirish: ism, telefon, passport"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full max-w-md rounded border border-slate-300 px-3 py-2"
      />
      <Modal open={open} onClose={() => setOpen(false)} title="Yangi bemor" size="lg">
        <PatientForm
          onDone={(id) => {
            setOpen(false)
            navigate(`/patients/${id}`)
          }}
        />
      </Modal>
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
            <tr>
              <th className="px-4 py-2">FIO</th>
              <th className="px-4 py-2">Tug'ilgan sana</th>
              <th className="px-4 py-2">Jinsi</th>
              <th className="px-4 py-2">Telefon</th>
              <th className="px-4 py-2">Passport</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <SkeletonRows cols={5} />
            ) : data?.length ? (
              data.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => navigate(`/patients/${p.id}`)}
                  className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-2">
                    {p.last_name} {p.first_name} {p.middle_name ?? ''}
                  </td>
                  <td className="px-4 py-2">{formatDate(p.birth_date)}</td>
                  <td className="px-4 py-2">{p.gender === 'male' ? 'Erkak' : 'Ayol'}</td>
                  <td className="px-4 py-2">{p.phone}</td>
                  <td className="px-4 py-2">{p.passport_number ?? '—'}</td>
                </tr>
              ))
            ) : (
              <EmptyRow cols={5} icon={Users} title="Bemor topilmadi" />
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
