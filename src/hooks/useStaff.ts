import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { Profile } from '@/types'

export type StaffRow = Profile & {
  department: { name: string } | null
}

export function useStaff() {
  return useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, department:departments(name)')
        .order('full_name')
      if (error) throw error
      return data as unknown as StaffRow[]
    },
  })
}

export interface StaffUpdate {
  full_name: string
  phone: string | null
  department_id: string | null
  is_active: boolean
}

export function useUpdateStaff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: StaffUpdate & { id: string }) => {
      const { error } = await supabase.from('profiles').update(input).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  })
}
