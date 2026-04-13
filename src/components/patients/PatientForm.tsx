import { useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import {
  useCreatePatient,
  useUpdatePatient,
  type NewPatient,
} from '@/hooks/usePatients'
import type { Gender, Patient } from '@/types'

interface Props {
  patient?: Patient
  onDone: (id: string) => void
}

export function PatientForm({ patient, onDone }: Props) {
  const create = useCreatePatient()
  const update = useUpdatePatient()
  const [f, setF] = useState<NewPatient>({
    first_name: patient?.first_name ?? '',
    last_name: patient?.last_name ?? '',
    middle_name: patient?.middle_name ?? '',
    birth_date: patient?.birth_date ?? '',
    gender: (patient?.gender ?? 'male') as Gender,
    phone: patient?.phone ?? '',
    phone_secondary: patient?.phone_secondary ?? '',
    passport_number: patient?.passport_number ?? '',
    address: patient?.address ?? '',
    emergency_contact_name: patient?.emergency_contact_name ?? '',
    emergency_contact_phone: patient?.emergency_contact_phone ?? '',
    blood_type: patient?.blood_type ?? '',
    allergies: patient?.allergies ?? '',
    chronic_conditions: patient?.chronic_conditions ?? '',
    notes: patient?.notes ?? '',
  })

  function set<K extends keyof NewPatient>(k: K, v: NewPatient[K]) {
    setF({ ...f, [k]: v })
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const payload: NewPatient = {
      ...f,
      middle_name: f.middle_name || null,
      phone_secondary: f.phone_secondary || null,
      passport_number: f.passport_number || null,
      address: f.address || null,
      emergency_contact_name: f.emergency_contact_name || null,
      emergency_contact_phone: f.emergency_contact_phone || null,
      blood_type: f.blood_type || null,
      allergies: f.allergies || null,
      chronic_conditions: f.chronic_conditions || null,
      notes: f.notes || null,
    }
    try {
      if (patient) {
        await update.mutateAsync({ id: patient.id, patch: payload })
        toast.success('Saqlandi')
        onDone(patient.id)
      } else {
        const created = await create.mutateAsync(payload)
        toast.success('Bemor yaratildi')
        onDone(created.id)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xato')
    }
  }

  const pending = create.isPending || update.isPending

  return (
    <form onSubmit={onSubmit} className="space-y-3 text-sm">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Familiya" required value={f.last_name} onChange={(v) => set('last_name', v)} />
        <Field label="Ism" required value={f.first_name} onChange={(v) => set('first_name', v)} />
        <Field label="Otasining ismi" value={f.middle_name ?? ''} onChange={(v) => set('middle_name', v)} />
        <Field
          label="Tug'ilgan sana"
          type="date"
          required
          value={f.birth_date}
          onChange={(v) => set('birth_date', v)}
        />
        <label className="block">
          <span className="text-xs text-slate-600">Jinsi</span>
          <select
            value={f.gender}
            onChange={(e) => set('gender', e.target.value as Gender)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          >
            <option value="male">Erkak</option>
            <option value="female">Ayol</option>
          </select>
        </label>
        <Field label="Qon guruhi" value={f.blood_type ?? ''} onChange={(v) => set('blood_type', v)} />
        <Field label="Telefon" required value={f.phone} onChange={(v) => set('phone', v)} />
        <Field label="Qo'shimcha telefon" value={f.phone_secondary ?? ''} onChange={(v) => set('phone_secondary', v)} />
        <Field label="Passport" value={f.passport_number ?? ''} onChange={(v) => set('passport_number', v)} />
        <Field label="Manzil" value={f.address ?? ''} onChange={(v) => set('address', v)} />
        <Field
          label="Favqulodda aloqa: ism"
          value={f.emergency_contact_name ?? ''}
          onChange={(v) => set('emergency_contact_name', v)}
        />
        <Field
          label="Favqulodda aloqa: telefon"
          value={f.emergency_contact_phone ?? ''}
          onChange={(v) => set('emergency_contact_phone', v)}
        />
      </div>
      <Field label="Allergiya" value={f.allergies ?? ''} onChange={(v) => set('allergies', v)} />
      <Field
        label="Surunkali kasalliklar"
        value={f.chronic_conditions ?? ''}
        onChange={(v) => set('chronic_conditions', v)}
      />
      <label className="block">
        <span className="text-xs text-slate-600">Izohlar</span>
        <textarea
          value={f.notes ?? ''}
          onChange={(e) => set('notes', e.target.value)}
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          rows={2}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-slate-800 px-3 py-2 text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {pending ? 'Saqlanmoqda…' : patient ? 'Saqlash' : 'Yaratish'}
      </button>
    </form>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <label className="block">
      <span className="text-xs text-slate-600">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
      />
    </label>
  )
}
