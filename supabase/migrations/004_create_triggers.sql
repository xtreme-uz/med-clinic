-- updated_at triggers
CREATE TRIGGER tr_profiles_updated BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_departments_updated BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_rooms_updated BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_beds_updated BEFORE UPDATE ON beds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_patients_updated BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_reservations_updated BEFORE UPDATE ON reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_admissions_updated BEFORE UPDATE ON admissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==========================================
-- Reservation status -> bed status (delegated to recompute_bed_status)
-- ==========================================
CREATE OR REPLACE FUNCTION on_reservation_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM recompute_bed_status(NEW.bed_id);
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.bed_id <> OLD.bed_id THEN
            PERFORM recompute_bed_status(OLD.bed_id);
        END IF;
        PERFORM recompute_bed_status(NEW.bed_id);
        IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
            NEW.cancelled_at := COALESCE(NEW.cancelled_at, now());
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM recompute_bed_status(OLD.bed_id);
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_reservation_change
    BEFORE INSERT OR UPDATE OR DELETE ON reservations
    FOR EACH ROW EXECUTE FUNCTION on_reservation_change();

-- ==========================================
-- Admission insert/discharge -> bed status.
-- BEFORE so we can mutate NEW.discharged_at on discharge.
-- ==========================================
CREATE OR REPLACE FUNCTION on_admission_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND NEW.status = 'discharged' AND OLD.status = 'active' THEN
        NEW.discharged_at := COALESCE(NEW.discharged_at, now());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_admission_before
    BEFORE INSERT OR UPDATE ON admissions
    FOR EACH ROW EXECUTE FUNCTION on_admission_change();

CREATE OR REPLACE FUNCTION on_admission_after()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM recompute_bed_status(NEW.bed_id);
    -- Mark linked reservation as checked_in on admission insert
    IF TG_OP = 'INSERT' AND NEW.reservation_id IS NOT NULL THEN
        UPDATE reservations SET status = 'checked_in'
        WHERE id = NEW.reservation_id AND status <> 'checked_in';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_admission_after
    AFTER INSERT OR UPDATE ON admissions
    FOR EACH ROW EXECUTE FUNCTION on_admission_after();

-- Audit triggers
CREATE TRIGGER tr_audit_reservations AFTER INSERT OR UPDATE OR DELETE ON reservations
    FOR EACH ROW EXECUTE FUNCTION log_audit();
CREATE TRIGGER tr_audit_admissions AFTER INSERT OR UPDATE OR DELETE ON admissions
    FOR EACH ROW EXECUTE FUNCTION log_audit();
CREATE TRIGGER tr_audit_beds AFTER UPDATE ON beds
    FOR EACH ROW EXECUTE FUNCTION log_audit();
