import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { Department } from '@/types'

export function useDepartments(includeInactive = false) {
  return useQuery({
    queryKey: ['departments', includeInactive],
    queryFn: async () => {
      let q = supabase.from('departments').select('*').order('name')
      if (!includeInactive) q = q.eq('is_active', true)
      const { data, error } = await q
      if (error) throw error
      return data as Department[]
    },
  })
}

export interface DepartmentInput {
  name: string
  description: string | null
  floor: number | null
  is_active: boolean
}

export function useSaveDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: DepartmentInput & { id?: string }) => {
      const { error } = id
        ? await supabase.from('departments').update(input).eq('id', id)
        : await supabase.from('departments').insert(input)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  })
}

export function useDeleteDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('departments').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  })
}
