import { useEffect } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { BedStatus, BedWithRoom } from '@/types'

interface Options {
  departmentId?: string | null
}

export function useBeds({ departmentId }: Options = {}) {
  const queryClient = useQueryClient()
  const key = ['beds', departmentId ?? 'all']

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      let q = supabase
        .from('beds')
        .select('*, room:rooms!inner(*, department:departments!inner(*))')
        .order('bed_number')
      if (departmentId) {
        q = q.eq('room.department_id', departmentId)
      }
      const { data, error } = await q
      if (error) throw error
      return data as unknown as BedWithRoom[]
    },
  })

  useEffect(() => {
    const channel = supabase
      .channel('beds-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'beds' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['beds'] })
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reservations' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['beds'] })
          queryClient.invalidateQueries({ queryKey: ['reservations'] })
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [queryClient])

  return query
}

export interface BedInput {
  room_id: string
  bed_number: string
  daily_price: number
  status: BedStatus
  notes: string | null
}

export function useSaveBed() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: BedInput & { id?: string }) => {
      const { error } = id
        ? await supabase.from('beds').update(input).eq('id', id)
        : await supabase.from('beds').insert(input)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['beds'] }),
  })
}

export function useDeleteBed() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('beds').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['beds'] }),
  })
}
