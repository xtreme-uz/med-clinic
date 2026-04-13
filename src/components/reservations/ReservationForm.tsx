import { useMemo, useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { usePatients, useCreatePatient } from '@/hooks/usePatients'
import { useCreateReservation } from '@/hooks/useReservations'
import { nightsBetween, todayISO } from '@/lib/dateUtils'
import type { BedWithRoom, Gender } from '@/types'

interface Props {
  bed: BedWithRoom
  onDone: () => void
}

export function ReservationForm({ bed, onDone }: Props) {
  const profile = useAuthStore((s) => s.profile)
  const [search, setSearch] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [showNewPatient, setShowNewPatient] = useState(false)
  const [checkIn, setCheckIn] = useState(todayISO())
  const [checkOut, setCheckOut] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [referral, setReferral] = useState('')

  const { data: patients } = usePatients(search)
  const createPatient = useCreatePatient()
  const createReservation = useCreateReservation()

  const nights = useMemo(
    () => (checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0),
    [checkIn, checkOut],
  )
  const total = nights * Number(bed.daily_price)

  // New patient state
  const [np, setNp] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    birth_date: '',
    gender: 'male' as Gender,
    phone: '',
    passport_number: '',
  })

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!profile) return

    let patientId = selectedPatientId
    if (showNewPatient) {
      try {
        const created = await createPatient.mutateAsync({
          first_name: np.first_name,
          last_name: np.last_name,
          middle_name: np.middle_name || null,
          birth_date: np.birth_date,
          gender: np.gender,
          phone: np.phone,
          passport_number: np.passport_number || null,
          phone_secondary: null,
          address: null,
          emergency_contact_name: null,
          emergency_contact_phone: null,
          blood_type: null,
          allergies: null,
          chronic_conditions: null,
          notes: null,
        })
        patientId = created.id
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Bemor yaratilmadi')
        return
      }
    }
    if (!patientId) {
      toast.error('Bemorni tanlang yoki yangi yarating')
      return
    }
    if (!checkOut || nights < 1) {
      toast.error('Sanalarni to\u2018g\u2018ri kiriting')
      return
    }
    try {
      await createReservation.mutateAsync({
        patient_id: patientId,
        bed_id: bed.id,
        department_id: bed.room.department.id,
        reserved_by: profile.id,
        check_in_date: checkIn,
        check_out_date: checkOut,
        diagnosis_preliminary: diagnosis || null,
        referral_number: referral || null,
        status: profile.role === 'doctor' ? 'pending' : 'confirmed',
      })
      toast.success('Band qilindi')
      onDone()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xato')
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 text-sm">
      <div className="rounded bg-slate-50 p-3">
        <div className="text-xs text-slate-500">Karavot</div>
        <div>
          {bed.room.department.name} / Xona {bed.room.room_number} / Karavot #{bed.bed_number}
        </div>
        <div className="text-xs text-slate-500">
          Kunlik narx: {Number(bed.daily_price).toLocaleString('uz-UZ')} so'm
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600">Bemor</label>
        {!showNewPatient ? (
          <>
            <input
              type="text"
              placeholder="Ism / familiya / telefon / passport"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            />
            <div className="mt-1 max-h-32 overflow-auto rounded border border-slate-200">
              {patients?.length ? (
                patients.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    className={`flex w-full justify-between px-3 py-1.5 text-left hover:bg-slate-100 ${selectedPatientId === p.id ? 'bg-slate-100 font-medium' : ''}`}
                  >
                    <span>
                      {p.last_name} {p.first_name}
                    </span>
                    <span className="text-xs text-slate-500">{p.phone}</span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-xs text-slate-500">Bemor topilmadi</div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowNewPatient(true)}
              className="mt-2 text-xs text-blue-600 hover:underline"
            >
              + Yangi bemor yaratish
            </button>
          </>
        ) : (
          <div className="mt-1 space-y-2 rounded border border-slate-200 p-3">
            <div className="grid grid-cols-2 gap-2">
              <input
                required
                placeholder="Familiya"
                value={np.last_name}
                onChange={(e) => setNp({ ...np, last_name: e.target.value })}
                className="rounded border border-slate-300 px-2 py-1.5"
              />
              <input
                required
                placeholder="Ism"
                value={np.first_name}
                onChange={(e) => setNp({ ...np, first_name: e.target.value })}
                className="rounded border border-slate-300 px-2 py-1.5"
              />
              <input
                required
                type="date"
                value={np.birth_date}
                onChange={(e) => setNp({ ...np, birth_date: e.target.value })}
                className="rounded border border-slate-300 px-2 py-1.5"
              />
              <select
                value={np.gender}
                onChange={(e) => setNp({ ...np, gender: e.target.value as Gender })}
                className="rounded border border-slate-300 px-2 py-1.5"
              >
                <option value="male">Erkak</option>
                <option value="female">Ayol</option>
              </select>
              <input
                required
                placeholder="Telefon"
                value={np.phone}
                onChange={(e) => setNp({ ...np, phone: e.target.value })}
                className="rounded border border-slate-300 px-2 py-1.5"
              />
              <input
                placeholder="Passport"
                value={np.passport_number}
                onChange={(e) => setNp({ ...np, passport_number: e.target.value })}
                className="rounded border border-slate-300 px-2 py-1.5"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowNewPatient(false)}
              className="text-xs text-slate-500 hover:underline"
            >
              ← Mavjud bemorni tanlash
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-slate-600">Check-in</span>
          <input
            type="date"
            required
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-xs text-slate-600">Check-out</span>
          <input
            type="date"
            required
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-xs text-slate-600">Dastlabki tashxis</span>
        <input
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="block">
        <span className="text-xs text-slate-600">Yo'llanma raqami</span>
        <input
          value={referral}
          onChange={(e) => setReferral(e.target.value)}
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
        />
      </label>

      <div className="flex items-center justify-between rounded bg-slate-50 p-3">
        <div className="text-xs text-slate-500">{nights} kun</div>
        <div className="text-base font-semibold">{total.toLocaleString('uz-UZ')} so'm</div>
      </div>

      <button
        type="submit"
        disabled={createReservation.isPending}
        className="w-full rounded bg-slate-800 px-3 py-2 text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {createReservation.isPending ? 'Saqlanmoqda…' : 'Band qilish'}
      </button>
    </form>
  )
}
