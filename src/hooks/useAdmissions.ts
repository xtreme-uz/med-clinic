import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { Admission, AdmissionStatus } from '@/types'

export type AdmissionWithRelations = Admission & {
  patient: { first_name: string; last_name: string; phone: string }
  bed: {
    bed_number: string
    room: { room_number: string; department: { name: string } }
  }
  attending_doctor: { full_name: string } | null
}

export function useAdmission(id: string | undefined) {
  return useQuery({
    queryKey: ['admission', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admissions')
        .select(
          '*, patient:patients(*), bed:beds(bed_number, daily_price, room:rooms(room_number, department:departments(name))), attending_doctor:profiles!admissions_attending_doctor_id_fkey(full_name)',
        )
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as unknown as AdmissionWithRelations & {
        patient: import('@/types').Patient
        bed: AdmissionWithRelations['bed'] & { daily_price: number }
      }
    },
  })
}

export function useAdmissions(status?: AdmissionStatus) {
  return useQuery({
    queryKey: ['admissions', status ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('admissions')
        .select(
          '*, patient:patients(first_name,last_name,phone), bed:beds(bed_number, room:rooms(room_number, department:departments(name))), attending_doctor:profiles!admissions_attending_doctor_id_fkey(full_name)',
        )
        .order('admitted_at', { ascending: false })
        .limit(100)
      if (status) q = q.eq('status', status)
      const { data, error } = await q
      if (error) throw error
      return data as unknown as AdmissionWithRelations[]
    },
  })
}

export interface CheckInInput {
  reservation_id?: string | null
  patient_id: string
  bed_id: string
  department_id: string
  attending_doctor_id?: string | null
  diagnosis?: string | null
}

export function useCheckIn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CheckInInput & { admitted_by: string }) => {
      const { data, error } = await supabase
        .from('admissions')
        .insert({ status: 'active', ...input })
        .select()
        .single()
      if (error) throw error
      return data as Admission
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admissions'] })
      qc.invalidateQueries({ queryKey: ['reservations'] })
      qc.invalidateQueries({ queryKey: ['beds'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export function useDischarge() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      summary,
      discharged_by,
    }: {
      id: string
      summary: string
      discharged_by: string
    }) => {
      const { error } = await supabase
        .from('admissions')
        .update({ status: 'discharged', discharge_summary: summary, discharged_by })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admissions'] })
      qc.invalidateQueries({ queryKey: ['beds'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}
