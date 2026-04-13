-- Fix: tr_reservation_change was BEFORE INSERT, so recompute_bed_status ran
-- before the new row existed and couldn't see it. Split responsibilities:
--   BEFORE: mutate NEW (set cancelled_at)
--   AFTER:  recompute bed status with the row visible

DROP TRIGGER IF EXISTS tr_reservation_change ON reservations;
DROP FUNCTION IF EXISTS on_reservation_change();

CREATE OR REPLACE FUNCTION on_reservation_before()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
        NEW.cancelled_at := COALESCE(NEW.cancelled_at, now());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION on_reservation_after()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM recompute_bed_status(NEW.bed_id);
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.bed_id <> OLD.bed_id THEN
            PERFORM recompute_bed_status(OLD.bed_id);
        END IF;
        PERFORM recompute_bed_status(NEW.bed_id);
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM recompute_bed_status(OLD.bed_id);
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_reservation_before
    BEFORE UPDATE ON reservations
    FOR EACH ROW EXECUTE FUNCTION on_reservation_before();

CREATE TRIGGER tr_reservation_after
    AFTER INSERT OR UPDATE OR DELETE ON reservations
    FOR EACH ROW EXECUTE FUNCTION on_reservation_after();
