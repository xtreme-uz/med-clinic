import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export interface AuditEntry {
  id: string
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string
  old_data: unknown
  new_data: unknown
  created_at: string
  user: { full_name: string; role: string } | null
}

interface Options {
  entityType?: string | null
  limit?: number
}

export function useAuditLog({ entityType, limit = 200 }: Options = {}) {
  return useQuery({
    queryKey: ['audit-log', entityType ?? 'all', limit],
    queryFn: async () => {
      let q = supabase
        .from('audit_log')
        .select('*, user:profiles(full_name,role)')
        .order('created_at', { ascending: false })
        .limit(limit)
      if (entityType) q = q.eq('entity_type', entityType)
      const { data, error } = await q
      if (error) throw error
      return data as unknown as AuditEntry[]
    },
  })
}
