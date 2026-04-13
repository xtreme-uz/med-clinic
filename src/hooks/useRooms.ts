import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { Room } from '@/types'

export type RoomWithDepartment = Room & { department: { name: string } }

export function useRooms(departmentId?: string | null) {
  return useQuery({
    queryKey: ['rooms', departmentId ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('rooms')
        .select('*, department:departments(name)')
        .order('room_number')
      if (departmentId) q = q.eq('department_id', departmentId)
      const { data, error } = await q
      if (error) throw error
      return data as unknown as RoomWithDepartment[]
    },
  })
}

export interface RoomInput {
  department_id: string
  room_number: string
  room_type: string
  floor: number | null
  is_active: boolean
}

export function useSaveRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: RoomInput & { id?: string }) => {
      const { error } = id
        ? await supabase.from('rooms').update(input).eq('id', id)
        : await supabase.from('rooms').insert(input)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  })
}

export function useDeleteRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('rooms').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  })
}
