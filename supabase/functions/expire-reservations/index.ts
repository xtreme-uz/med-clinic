// Edge Function: expire-reservations
// Schedules: run via Supabase pg_cron or an external scheduler (e.g. daily).
// Auth: expects a header `Authorization: Bearer <SERVICE_ROLE_KEY>` or
// the built-in cron invocation; the RPC itself is SECURITY DEFINER so the
// caller just needs to reach PostgREST with a valid JWT.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (_req) => {
  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !serviceKey) {
    return new Response(JSON.stringify({ error: 'missing env' }), { status: 500 })
  }

  const supabase = createClient(url, serviceKey)
  const { data, error } = await supabase.rpc('expire_old_reservations')

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ expired: data ?? 0 }), {
    headers: { 'content-type': 'application/json' },
  })
})
