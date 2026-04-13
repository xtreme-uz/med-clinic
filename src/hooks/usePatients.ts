import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { Admission, Patient, Reservation } from '@/types'

export type PatientReservation = Reservation & {
  bed: { bed_number: string; room: { room_number: string; department: { name: string } } }
}
export type PatientAdmission = Admission & {
  bed: { bed_number: string; room: { room_number: string; department: { name: string } } }
  attending_doctor: { full_name: string } | null
}

export function usePatient(id: string | undefined) {
  return useQuery({
    queryKey: ['patient', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Patient
    },
  })
}

export function usePatientReservations(patientId: string | undefined) {
  return useQuery({
    queryKey: ['patient-reservations', patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select(
          '*, bed:beds(bed_number, room:rooms(room_number, department:departments(name)))',
        )
        .eq('patient_id', patientId!)
        .order('check_in_date', { ascending: false })
      if (error) throw error
      return data as unknown as PatientReservation[]
    },
  })
}

export function usePatientAdmissions(patientId: string | undefined) {
  return useQuery({
    queryKey: ['patient-admissions', patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admissions')
        .select(
          '*, bed:beds(bed_number, room:rooms(room_number, department:departments(name))), attending_doctor:profiles!admissions_attending_doctor_id_fkey(full_name)',
        )
        .eq('patient_id', patientId!)
        .order('admitted_at', { ascending: false })
      if (error) throw error
      return data as unknown as PatientAdmission[]
    },
  })
}

export function usePatients(search?: string) {
  return useQuery({
    queryKey: ['patients', search ?? ''],
    queryFn: async () => {
      let q = supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      if (search && search.trim()) {
        const term = `%${search.trim()}%`
        q = q.or(
          `first_name.ilike.${term},last_name.ilike.${term},phone.ilike.${term},passport_number.ilike.${term}`,
        )
      }
      const { data, error } = await q
      if (error) throw error
      return data as Patient[]
    },
  })
}

export type NewPatient = Omit<Patient, 'id' | 'created_at' | 'updated_at' | 'created_by'>

export function useCreatePatient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: NewPatient) => {
      const { data, error } = await supabase
        .from('patients')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data as Patient
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients'] })
    },
  })
}

export function useUpdatePatient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<NewPatient> }) => {
      const { data, error } = await supabase
        .from('patients')
        .update(patch)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Patient
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['patients'] })
      qc.invalidateQueries({ queryKey: ['patient', vars.id] })
    },
  })
}
