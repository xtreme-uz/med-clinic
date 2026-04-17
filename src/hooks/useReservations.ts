import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { Reservation } from '@/types'

export function useReservationsRange(params: {
  departmentId?: string
  from: string
  to: string
}) {
  const { departmentId, from, to } = params
  return useQuery({
    queryKey: ['reservations-range', departmentId ?? '', from, to],
    queryFn: async () => {
      let q = supabase
        .from('reservations')
        .select(
          'id, patient_id, bed_id, department_id, check_in_date, check_out_date, status, patient:patients(first_name, last_name)',
        )
        .neq('status', 'cancelled')
        .lte('check_in_date', to)
        .gte('check_out_date', from)
      if (departmentId) q = q.eq('department_id', departmentId)
      const { data, error } = await q
      if (error) throw error
      return data as unknown as Array<{
        id: string
        patient_id: string
        bed_id: string
        department_id: string
        check_in_date: string
        check_out_date: string
        status: Reservation['status']
        patient: { first_name: string; last_name: string }
      }>
    },
  })
}

export function useReservations() {
  return useQuery({
    queryKey: ['reservations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select(
          '*, patient:patients(*), bed:beds(*, room:rooms(*, department:departments(*)))',
        )
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return data as unknown as (Reservation & {
        patient: { first_name: string; last_name: string; phone: string }
        bed: {
          bed_number: string
          room: { room_number: string; department: { name: string } }
        }
      })[]
    },
  })
}

export interface NewReservation {
  patient_id: string
  bed_id: string
  department_id: string
  doctor_id?: string | null
  check_in_date: string
  check_out_date: string
  diagnosis_preliminary?: string | null
  referral_number?: string | null
  notes?: string | null
  price_adjustment?: number
}

export function useCreateReservation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (
      input:
        | (NewReservation & { reserved_by: string; status?: 'confirmed' | 'pending' })
        | (NewReservation & { reserved_by: string; status?: 'confirmed' | 'pending' })[],
    ) => {
      const rows = Array.isArray(input)
        ? input.map((r) => ({ status: 'confirmed' as const, ...r }))
        : [{ status: 'confirmed' as const, ...input }]
      const { data, error } = await supabase
        .from('reservations')
        .insert(rows)
        .select()
      if (error) {
        if (error.code === '23P01') {
          throw new Error('Tanlangan kunlarda karavot(lar) allaqachon band qilingan.')
        }
        throw error
      }
      return data as Reservation[]
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservations'] })
      qc.invalidateQueries({ queryKey: ['beds'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export function useCancelReservation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase
        .from('reservations')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservations'] })
      qc.invalidateQueries({ queryKey: ['beds'] })
    },
  })
}
