import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAdmission } from '@/hooks/useAdmissions'
import { formatDate } from '@/lib/dateUtils'

function fmtDateTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' })
}

export function DischargePrintPage() {
  const { id } = useParams<{ id: string }>()
  const { data: a, isLoading } = useAdmission(id)

  useEffect(() => {
    if (a) setTimeout(() => window.print(), 300)
  }, [a])

  if (isLoading) return <div className="p-8">Yuklanmoqda…</div>
  if (!a) return <div className="p-8">Yotqizish topilmadi</div>

  const nights =
    a.discharged_at
      ? Math.max(
          1,
          Math.round(
            (new Date(a.discharged_at).getTime() - new Date(a.admitted_at).getTime()) /
              86400000,
          ),
        )
      : 0
  const total = nights * Number(a.bed.daily_price)

  return (
    <div className="mx-auto max-w-3xl bg-white p-10 text-sm text-slate-900 print:p-0">
      <style>{`@media print { @page { margin: 1.5cm; } .no-print { display: none; } }`}</style>
      <div className="no-print mb-4 flex justify-end">
        <button
          onClick={() => window.print()}
          className="rounded bg-slate-800 px-3 py-1.5 text-white"
        >
          Chop etish
        </button>
      </div>

      <header className="mb-6 border-b border-slate-300 pb-4">
        <h1 className="text-xl font-bold">CHIQARISH XULOSASI</h1>
        <div className="text-xs text-slate-600">Klinika Booking · {a.bed.room.department.name}</div>
      </header>

      <Section title="Bemor">
        <Row label="FIO">
          {a.patient.last_name} {a.patient.first_name} {a.patient.middle_name ?? ''}
        </Row>
        <Row label="Tug'ilgan sana">{formatDate(a.patient.birth_date)}</Row>
        <Row label="Jinsi">{a.patient.gender === 'male' ? 'Erkak' : 'Ayol'}</Row>
        <Row label="Telefon">{a.patient.phone}</Row>
        <Row label="Passport">{a.patient.passport_number ?? '—'}</Row>
        <Row label="Manzil">{a.patient.address ?? '—'}</Row>
      </Section>

      <Section title="Yotqizish">
        <Row label="Bo'lim">{a.bed.room.department.name}</Row>
        <Row label="Joy">
          Xona {a.bed.room.room_number} · Karavot #{a.bed.bed_number}
        </Row>
        <Row label="Shifokor">{a.attending_doctor?.full_name ?? '—'}</Row>
        <Row label="Yotqizilgan">{fmtDateTime(a.admitted_at)}</Row>
        <Row label="Chiqarilgan">{fmtDateTime(a.discharged_at)}</Row>
        <Row label="Davomiyligi">{nights} kun</Row>
      </Section>

      <Section title="Tashxis">
        <p className="whitespace-pre-wrap">{a.diagnosis ?? '—'}</p>
      </Section>

      {a.treatment_notes && (
        <Section title="Davolash izohlari">
          <p className="whitespace-pre-wrap">{a.treatment_notes}</p>
        </Section>
      )}

      <Section title="Chiqarish xulosasi">
        <p className="whitespace-pre-wrap">{a.discharge_summary ?? '—'}</p>
      </Section>

      <Section title="To'lov">
        <Row label="Kunlik narx">
          {Number(a.bed.daily_price).toLocaleString('uz-UZ')} so'm
        </Row>
        <Row label="Jami">
          <strong>{total.toLocaleString('uz-UZ')} so'm</strong>
        </Row>
      </Section>

      <div className="mt-12 grid grid-cols-2 gap-12 text-sm">
        <Sign label="Shifokor" />
        <Sign label="Bemor" />
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h2 className="mb-2 border-b border-slate-200 pb-1 text-sm font-semibold uppercase tracking-wide text-slate-700">
        {title}
      </h2>
      <div className="space-y-1">{children}</div>
    </section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="text-slate-500">{label}</div>
      <div className="col-span-2">{children}</div>
    </div>
  )
}

function Sign({ label }: { label: string }) {
  return (
    <div>
      <div className="mt-8 border-t border-slate-400 pt-1 text-xs text-slate-600">{label}</div>
    </div>
  )
}
