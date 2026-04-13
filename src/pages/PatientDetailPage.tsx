import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil } from 'lucide-react'
import {
  usePatient,
  usePatientAdmissions,
  usePatientReservations,
} from '@/hooks/usePatients'
import { formatDate } from '@/lib/dateUtils'
import { Modal } from '@/components/ui/Modal'
import { PatientForm } from '@/components/patients/PatientForm'
import type { AdmissionStatus, ReservationStatus } from '@/types'

const reservationStatusLabel: Record<ReservationStatus, string> = {
  pending: 'Kutilmoqda',
  confirmed: 'Tasdiqlangan',
  cancelled: 'Bekor qilingan',
  expired: 'Muddati o\u2018tgan',
  checked_in: 'Yotqizilgan',
}

const admissionStatusLabel: Record<AdmissionStatus, string> = {
  active: 'Faol',
  discharged: 'Chiqarilgan',
  transferred: 'Ko\u2018chirildi',
}

function fmtDateTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' })
}

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [edit, setEdit] = useState(false)
  const { data: patient, isLoading } = usePatient(id)
  const { data: reservations } = usePatientReservations(id)
  const { data: admissions } = usePatientAdmissions(id)

  if (isLoading) return <div>Yuklanmoqda…</div>
  if (!patient) return <div>Bemor topilmadi</div>

  return (
    <div>
      <Link
        to="/patients"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" /> Bemorlar
      </Link>

      <Modal open={edit} onClose={() => setEdit(false)} title="Bemorni tahrirlash" size="lg">
        <PatientForm patient={patient} onDone={() => setEdit(false)} />
      </Modal>

      <div className="mb-6 rounded-lg bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <h2 className="text-2xl font-semibold">
            {patient.last_name} {patient.first_name} {patient.middle_name ?? ''}
          </h2>
          <button
            onClick={() => setEdit(true)}
            className="inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
          >
            <Pencil className="h-3 w-3" /> Tahrirlash
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-3">
          <Field label="Tug'ilgan sana" value={formatDate(patient.birth_date)} />
          <Field label="Jinsi" value={patient.gender === 'male' ? 'Erkak' : 'Ayol'} />
          <Field label="Telefon" value={patient.phone} />
          <Field label="Qo'shimcha tel" value={patient.phone_secondary ?? '—'} />
          <Field label="Passport" value={patient.passport_number ?? '—'} />
          <Field label="Qon guruhi" value={patient.blood_type ?? '—'} />
          <Field label="Manzil" value={patient.address ?? '—'} />
          <Field
            label="Favqulodda aloqa"
            value={
              patient.emergency_contact_name
                ? `${patient.emergency_contact_name} · ${patient.emergency_contact_phone ?? ''}`
                : '—'
            }
          />
          <Field label="Allergiya" value={patient.allergies ?? '—'} />
          <Field label="Surunkali kasalliklar" value={patient.chronic_conditions ?? '—'} />
          {patient.notes && <Field label="Izohlar" value={patient.notes} wide />}
        </div>
      </div>

      <Section title="Yotqizishlar tarixi">
        {admissions?.length ? (
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
              <tr>
                <th className="px-4 py-2">Bo'lim / Karavot</th>
                <th className="px-4 py-2">Shifokor</th>
                <th className="px-4 py-2">Yotqizilgan</th>
                <th className="px-4 py-2">Chiqarilgan</th>
                <th className="px-4 py-2">Tashxis</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {admissions.map((a) => (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">
                    {a.bed.room.department.name}
                    <div className="text-xs text-slate-500">
                      Xona {a.bed.room.room_number} · #{a.bed.bed_number}
                    </div>
                  </td>
                  <td className="px-4 py-2">{a.attending_doctor?.full_name ?? '—'}</td>
                  <td className="px-4 py-2">{fmtDateTime(a.admitted_at)}</td>
                  <td className="px-4 py-2">{fmtDateTime(a.discharged_at)}</td>
                  <td className="px-4 py-2">{a.diagnosis ?? '—'}</td>
                  <td className="px-4 py-2">{admissionStatusLabel[a.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty>Yotqizish yo'q</Empty>
        )}
      </Section>

      <Section title="Bandlovlar tarixi">
        {reservations?.length ? (
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
              <tr>
                <th className="px-4 py-2">Bo'lim / Karavot</th>
                <th className="px-4 py-2">Kirish</th>
                <th className="px-4 py-2">Chiqish</th>
                <th className="px-4 py-2">Tashxis</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">
                    {r.bed.room.department.name}
                    <div className="text-xs text-slate-500">
                      Xona {r.bed.room.room_number} · #{r.bed.bed_number}
                    </div>
                  </td>
                  <td className="px-4 py-2">{formatDate(r.check_in_date)}</td>
                  <td className="px-4 py-2">{formatDate(r.check_out_date)}</td>
                  <td className="px-4 py-2">{r.diagnosis_preliminary ?? '—'}</td>
                  <td className="px-4 py-2">{reservationStatusLabel[r.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty>Bandlov yo'q</Empty>
        )}
      </Section>
    </div>
  )
}

function Field({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? 'col-span-2 md:col-span-3' : ''}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-slate-800">{value}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">{children}</div>
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="px-4 py-6 text-center text-sm text-slate-500">{children}</div>
}
