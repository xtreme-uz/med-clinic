import { useMemo, useState } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useDepartments } from '@/hooks/useDepartments'
import { useBeds } from '@/hooks/useBeds'
import { useReservationsRange } from '@/hooks/useReservations'
import { todayISO } from '@/lib/dateUtils'

const DAYS = 14

export function ReservationCalendar() {
  const [departmentId, setDepartmentId] = useState<string>('')
  const [start, setStart] = useState<string>(todayISO())

  const { data: departments } = useDepartments()
  const { data: beds } = useBeds({ departmentId: departmentId || null })

  const days = useMemo(
    () => Array.from({ length: DAYS }, (_, i) => format(addDays(parseISO(start), i), 'yyyy-MM-dd')),
    [start],
  )
  const to = days[days.length - 1]

  const { data: reservations } = useReservationsRange({
    departmentId: departmentId || undefined,
    from: start,
    to,
  })

  const cellMap = useMemo(() => {
    const m = new Map<string, { label: string; status: string }>()
    if (!reservations) return m
    for (const r of reservations) {
      for (const d of days) {
        if (d >= r.check_in_date && d < r.check_out_date) {
          m.set(`${r.bed_id}|${d}`, {
            label: `${r.patient.last_name} ${r.patient.first_name[0]}.`,
            status: r.status,
          })
        }
      }
    }
    return m
  }, [reservations, days])

  function shift(delta: number) {
    setStart(format(addDays(parseISO(start), delta), 'yyyy-MM-dd'))
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <select
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
        >
          <option value="">Barcha bo'limlar</option>
          {departments?.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1">
          <button
            onClick={() => shift(-DAYS)}
            className="rounded border border-slate-300 p-1 hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          />
          <button
            onClick={() => shift(DAYS)}
            className="rounded border border-slate-300 p-1 hover:bg-slate-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setStart(todayISO())}
            className="ml-2 text-xs text-blue-600 hover:underline"
          >
            Bugun
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full text-xs">
          <thead className="bg-slate-100">
            <tr>
              <th className="sticky left-0 z-10 bg-slate-100 px-3 py-2 text-left">Karavot</th>
              {days.map((d) => (
                <th key={d} className="whitespace-nowrap px-2 py-2 font-normal text-slate-600">
                  {format(parseISO(d), 'dd.MM')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {beds?.length ? (
              beds.map((b) => (
                <tr key={b.id} className="border-t border-slate-100">
                  <td className="sticky left-0 z-10 bg-white px-3 py-1.5 whitespace-nowrap">
                    {b.room.department.name} · {b.room.room_number} · #{b.bed_number}
                  </td>
                  {days.map((d) => {
                    const cell = cellMap.get(`${b.id}|${d}`)
                    const cls = cell
                      ? cell.status === 'checked_in'
                        ? 'bg-green-200'
                        : cell.status === 'pending'
                          ? 'bg-yellow-200'
                          : 'bg-blue-200'
                      : ''
                    return (
                      <td
                        key={d}
                        title={cell?.label}
                        className={`min-w-[70px] border-l border-slate-100 px-1 py-1.5 ${cls}`}
                      >
                        {cell && <span className="truncate text-[10px]">{cell.label}</span>}
                      </td>
                    )
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={DAYS + 1} className="px-4 py-6 text-center text-slate-500">
                  Karavot yo'q
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
