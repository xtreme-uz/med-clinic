import { useState } from 'react'
import toast from 'react-hot-toast'
import { useReservations, useCancelReservation } from '@/hooks/useReservations'
import { useCheckIn } from '@/hooks/useAdmissions'
import { useAuthStore } from '@/store/authStore'
import { formatDate } from '@/lib/dateUtils'
import { ReservationCalendar } from '@/components/reservations/ReservationCalendar'
import { SkeletonRows } from '@/components/ui/Skeleton'
import { EmptyRow } from '@/components/ui/EmptyState'
import { CalendarDays } from 'lucide-react'
import type { ReservationStatus } from '@/types'

const statusLabel: Record<ReservationStatus, string> = {
  pending: 'Kutilmoqda',
  confirmed: 'Tasdiqlangan',
  checked_in: 'Yotqizilgan',
  cancelled: 'Bekor qilindi',
  expired: 'Muddati o\u2018tgan',
}

const statusClass: Record<ReservationStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  checked_in: 'bg-green-100 text-green-800',
  cancelled: 'bg-slate-200 text-slate-700',
  expired: 'bg-slate-200 text-slate-500',
}

export function ReservationsPage() {
  const profile = useAuthStore((s) => s.profile)
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const { data, isLoading } = useReservations()
  const cancel = useCancelReservation()
  const checkIn = useCheckIn()

  async function onCancel(id: string) {
    const reason = window.prompt('Bekor qilish sababi?')
    if (!reason) return
    try {
      await cancel.mutateAsync({ id, reason })
      toast.success('Bekor qilindi')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xato')
    }
  }

  async function onCheckIn(r: {
    id: string
    patient_id: string
    bed_id: string
    department_id: string
    diagnosis_preliminary: string | null
  }) {
    if (!profile) return
    try {
      await checkIn.mutateAsync({
        reservation_id: r.id,
        patient_id: r.patient_id,
        bed_id: r.bed_id,
        department_id: r.department_id,
        diagnosis: r.diagnosis_preliminary,
        admitted_by: profile.id,
      })
      toast.success('Yotqizildi')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xato')
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Bandlovlar</h2>
        <div className="inline-flex rounded border border-slate-300 text-sm">
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1 ${view === 'list' ? 'bg-slate-800 text-white' : 'bg-white'}`}
          >
            Ro'yxat
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`px-3 py-1 ${view === 'calendar' ? 'bg-slate-800 text-white' : 'bg-white'}`}
          >
            Kalendar
          </button>
        </div>
      </div>
      {view === 'calendar' ? (
        <ReservationCalendar />
      ) : (
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
            <tr>
              <th className="px-4 py-2">Bemor</th>
              <th className="px-4 py-2">Bo'lim / Karavot</th>
              <th className="px-4 py-2">Sanalar</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <SkeletonRows cols={5} />
            ) : data?.length ? (
              data.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">
                    {r.patient.last_name} {r.patient.first_name}
                    <div className="text-xs text-slate-500">{r.patient.phone}</div>
                  </td>
                  <td className="px-4 py-2">
                    {r.bed.room.department.name}
                    <div className="text-xs text-slate-500">
                      Xona {r.bed.room.room_number} · Karavot #{r.bed.bed_number}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    {formatDate(r.check_in_date)} → {formatDate(r.check_out_date)}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`rounded px-2 py-0.5 text-xs ${statusClass[r.status]}`}>
                      {statusLabel[r.status]}
                    </span>
                  </td>
                  <td className="space-x-3 px-4 py-2 text-right">
                    {r.status === 'confirmed' && (
                      <button
                        onClick={() => onCheckIn(r)}
                        className="text-xs text-green-700 hover:underline"
                      >
                        Yotqizish
                      </button>
                    )}
                    {(r.status === 'pending' || r.status === 'confirmed') && (
                      <button
                        onClick={() => onCancel(r.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Bekor qilish
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <EmptyRow cols={5} icon={CalendarDays} title="Bandlov yo'q" />
            )}
          </tbody>
        </table>
      </div>
      )}
    </div>
  )
}
