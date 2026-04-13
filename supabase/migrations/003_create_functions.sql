-- ==========================================
-- Auto-update updated_at
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- Recompute bed status from current state.
-- Maintenance is sticky and is never overwritten by this helper.
-- ==========================================
CREATE OR REPLACE FUNCTION recompute_bed_status(p_bed_id UUID)
RETURNS VOID AS $$
DECLARE
    v_status bed_status;
    v_current bed_status;
BEGIN
    SELECT status INTO v_current FROM beds WHERE id = p_bed_id;
    IF v_current = 'maintenance' THEN
        RETURN;
    END IF;

    IF EXISTS (
        SELECT 1 FROM admissions
        WHERE bed_id = p_bed_id AND status = 'active'
    ) THEN
        v_status := 'occupied';
    ELSIF EXISTS (
        SELECT 1 FROM reservations
        WHERE bed_id = p_bed_id
          AND status IN ('confirmed', 'pending')
          AND check_out_date > CURRENT_DATE
    ) THEN
        v_status := 'reserved';
    ELSE
        v_status := 'free';
    END IF;

    UPDATE beds SET status = v_status WHERE id = p_bed_id AND status <> v_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- Expire stale pending reservations.
-- Business rule: pending referrals auto-expire 24h after creation, OR if check-in date has passed.
-- ==========================================
CREATE OR REPLACE FUNCTION expire_old_reservations()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
    r RECORD;
BEGIN
    FOR r IN
        SELECT id, bed_id FROM reservations
        WHERE status = 'pending'
          AND (check_in_date < CURRENT_DATE OR created_at < now() - INTERVAL '24 hours')
    LOOP
        UPDATE reservations SET status = 'expired', updated_at = now() WHERE id = r.id;
        PERFORM recompute_bed_status(r.bed_id);
    END LOOP;
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- Generic audit logger
-- ==========================================
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (user_id, action, entity_type, entity_id, old_data, new_data)
    VALUES (
        auth.uid(),
        TG_TABLE_NAME || '.' || lower(TG_OP),
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- Dashboard stats
-- ==========================================
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
    SELECT json_build_object(
        'total_beds', (SELECT count(*) FROM beds),
        'free_beds', (SELECT count(*) FROM beds WHERE status = 'free'),
        'reserved_beds', (SELECT count(*) FROM beds WHERE status = 'reserved'),
        'occupied_beds', (SELECT count(*) FROM beds WHERE status = 'occupied'),
        'maintenance_beds', (SELECT count(*) FROM beds WHERE status = 'maintenance'),
        'pending_reservations', (SELECT count(*) FROM reservations WHERE status = 'pending'),
        'today_checkins', (
            SELECT count(*) FROM reservations
            WHERE check_in_date = CURRENT_DATE AND status IN ('confirmed', 'checked_in')
        ),
        'today_checkouts', (
            SELECT count(*) FROM admissions
            WHERE status = 'discharged'
              AND discharged_at >= date_trunc('day', now())
              AND discharged_at <  date_trunc('day', now()) + INTERVAL '1 day'
        ),
        'active_admissions', (SELECT count(*) FROM admissions WHERE status = 'active'),
        'occupancy_rate', (
            SELECT ROUND(
                (count(*) FILTER (WHERE status = 'occupied'))::DECIMAL /
                NULLIF(count(*), 0) * 100, 1
            ) FROM beds
        )
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
