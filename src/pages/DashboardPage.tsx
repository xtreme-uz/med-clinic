import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { todayISO } from '@/lib/dateUtils'
import type { DashboardStats } from '@/types'

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dashboard_stats')
      if (error) throw error
      return data as DashboardStats
    },
  })

  const today = todayISO()
  const { data: checkinsToday } = useQuery({
    queryKey: ['dash-checkins-today', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select(
          'id, check_in_date, patient:patients(first_name, last_name), bed:beds(bed_number, room:rooms(room_number, department:departments(name)))',
        )
        .eq('check_in_date', today)
        .in('status', ['confirmed', 'checked_in'])
        .order('created_at', { ascending: false })
        .limit(10)
      if (error) throw error
      return data as unknown as DashRow[]
    },
  })

  const { data: dischargesUpcoming } = useQuery({
    queryKey: ['dash-discharges-upcoming', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select(
          'id, check_out_date, patient:patients(first_name, last_name), bed:beds(bed_number, room:rooms(room_number, department:departments(name)))',
        )
        .gte('check_out_date', today)
        .eq('status', 'checked_in')
        .order('check_out_date')
        .limit(10)
      if (error) throw error
      return data as unknown as DashRow[]
    },
  })

  const { data: recentAdmissions } = useQuery({
    queryKey: ['dash-recent-admissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admissions')
        .select(
          'id, admitted_at, status, patient:patients(first_name, last_name), bed:beds(bed_number, room:rooms(room_number, department:departments(name)))',
        )
        .order('admitted_at', { ascending: false })
        .limit(8)
      if (error) throw error
      return data as unknown as (DashRow & { admitted_at: string; status: string })[]
    },
  })

  if (isLoading) return <div>Yuklanmoqda…</div>
  if (!data) return <div>Ma'lumot yo'q</div>

  return (
    <div>
      <h2 className="mb-4 text-2xl font-semibold">Dashboard</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Jami karavotlar" value={data.total_beds} />
        <Stat label="Bo'sh" value={data.free_beds} accent="text-green-600" />
        <Stat label="Band qilingan" value={data.reserved_beds} accent="text-yellow-600" />
        <Stat label="Yotqizilgan" value={data.occupied_beds} accent="text-red-600" />
        <Stat label="Ta'mirda" value={data.maintenance_beds} accent="text-slate-500" />
        <Stat label="Bandlik %" value={`${data.occupancy_rate ?? 0}%`} />
        <Stat label="Bugungi check-in" value={data.today_checkins} />
        <Stat label="Pending bandlovlar" value={data.pending_reservations} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Panel title="Bugungi yotqizishlar">
          <RowList rows={checkinsToday ?? []} empty="Bugun yotqizish yo'q" />
        </Panel>
        <Panel title="Yaqin chiqishlar">
          <RowList
            rows={dischargesUpcoming ?? []}
            empty="Kutilayotgan chiqish yo'q"
            secondary={(r) => `→ ${r.check_out_date}`}
          />
        </Panel>
        <Panel title="So'nggi yotqizishlar" link="/admissions">
          <RowList
            rows={recentAdmissions ?? []}
            empty="Yaqinda yotqizish bo'lmagan"
            secondary={(r) =>
              new Date(r.admitted_at!).toLocaleString('uz-UZ', {
                dateStyle: 'short',
                timeStyle: 'short',
              })
            }
          />
        </Panel>
      </div>
    </div>
  )
}

interface DashRow {
  id: string
  check_in_date?: string
  check_out_date?: string
  admitted_at?: string
  patient: { first_name: string; last_name: string }
  bed: { bed_number: string; room: { room_number: string; department: { name: string } } }
}

function Panel({
  title,
  link,
  children,
}: {
  title: string
  link?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        {link && (
          <Link to={link} className="text-xs text-blue-600 hover:underline">
            Hammasi
          </Link>
        )}
      </div>
      {children}
    </div>
  )
}

function RowList({
  rows,
  empty,
  secondary,
}: {
  rows: DashRow[]
  empty: string
  secondary?: (r: DashRow) => string
}) {
  if (!rows.length) return <div className="py-2 text-xs text-slate-500">{empty}</div>
  return (
    <ul className="divide-y divide-slate-100 text-sm">
      {rows.map((r) => (
        <li key={r.id} className="flex items-start justify-between py-2">
          <div>
            <div className="font-medium">
              {r.patient.last_name} {r.patient.first_name}
            </div>
            <div className="text-xs text-slate-500">
              {r.bed.room.department.name} · Xona {r.bed.room.room_number} · #{r.bed.bed_number}
            </div>
          </div>
          {secondary && <div className="text-xs text-slate-500">{secondary(r)}</div>}
        </li>
      ))}
    </ul>
  )
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string
  value: number | string
  accent?: string
}) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${accent ?? 'text-slate-800'}`}>{value}</div>
    </div>
  )
}
