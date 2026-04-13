-- Schedule hourly expiry via pg_cron. Calls the RPC directly (no need to hop
-- through the Edge Function) so it works offline and doesn't need secrets.
-- If you prefer the Edge Function path, unschedule this and use `supabase
-- functions deploy expire-reservations` + an external scheduler.

CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire_old_reservations_hourly') THEN
        PERFORM cron.schedule(
            'expire_old_reservations_hourly',
            '0 * * * *',
            $cron$SELECT expire_old_reservations();$cron$
        );
    END IF;
END $$;
