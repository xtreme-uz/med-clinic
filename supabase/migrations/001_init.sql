-- ==========================================
-- Extensions
-- ==========================================
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- Grants for Supabase REST API
-- ==========================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;

-- ==========================================
-- ENUMs
-- ==========================================
CREATE TYPE bed_status AS ENUM ('free', 'reserved', 'occupied', 'maintenance');
CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'cancelled', 'expired', 'checked_in');
CREATE TYPE admission_status AS ENUM ('active', 'discharged', 'transferred');
CREATE TYPE gender_type AS ENUM ('male', 'female');

-- ==========================================
-- TABLES (no FK to auth.users — self-contained schema)
-- ==========================================

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    floor INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone TEXT,
    department_id UUID REFERENCES departments(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    room_number TEXT NOT NULL,
    room_type TEXT NOT NULL DEFAULT 'standard',
    floor INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(department_id, room_number)
);

CREATE TABLE beds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    bed_number TEXT NOT NULL,
    status bed_status NOT NULL DEFAULT 'free',
    daily_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(room_id, bed_number)
);

CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    middle_name TEXT,
    birth_date DATE NOT NULL,
    gender gender_type NOT NULL,
    passport_number TEXT UNIQUE,
    phone TEXT NOT NULL,
    phone_secondary TEXT,
    address TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    blood_type TEXT,
    allergies TEXT,
    chronic_conditions TEXT,
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    bed_id UUID NOT NULL REFERENCES beds(id),
    department_id UUID NOT NULL REFERENCES departments(id),
    doctor_id UUID REFERENCES profiles(id),
    reserved_by UUID NOT NULL REFERENCES profiles(id),
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    status reservation_status NOT NULL DEFAULT 'pending',
    diagnosis_preliminary TEXT,
    referral_number TEXT,
    price_adjustment DECIMAL(5,2) NOT NULL DEFAULT 0,
    notes TEXT,
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES profiles(id),
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT valid_dates CHECK (check_out_date > check_in_date),
    CONSTRAINT no_overlap EXCLUDE USING gist (
        bed_id WITH =,
        daterange(check_in_date, check_out_date, '[)') WITH &&
    ) WHERE (status NOT IN ('cancelled', 'expired'))
);

CREATE TABLE admissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID REFERENCES reservations(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    bed_id UUID NOT NULL REFERENCES beds(id),
    department_id UUID NOT NULL REFERENCES departments(id),
    attending_doctor_id UUID REFERENCES profiles(id),
    admitted_by UUID NOT NULL REFERENCES profiles(id),
    status admission_status NOT NULL DEFAULT 'active',
    admitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    discharged_at TIMESTAMPTZ,
    discharged_by UUID REFERENCES profiles(id),
    diagnosis TEXT,
    treatment_notes TEXT,
    discharge_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX idx_beds_status ON beds(status);
CREATE INDEX idx_beds_room ON beds(room_id);
CREATE INDEX idx_reservations_dates ON reservations(check_in_date, check_out_date);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_patient ON reservations(patient_id);
CREATE INDEX idx_reservations_bed ON reservations(bed_id);
CREATE INDEX idx_reservations_bed_active ON reservations(bed_id, check_in_date, check_out_date)
    WHERE status IN ('confirmed', 'checked_in', 'pending');
CREATE INDEX idx_admissions_status ON admissions(status);
CREATE INDEX idx_admissions_patient ON admissions(patient_id);
CREATE INDEX idx_admissions_bed ON admissions(bed_id);
CREATE INDEX idx_patients_passport ON patients(passport_number);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);

-- ==========================================
-- FUNCTIONS
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- ==========================================
-- TRIGGERS
-- ==========================================

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

-- Reservation: BEFORE (mutate cancelled_at), AFTER (recompute bed status)
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

-- Admission: BEFORE (set discharged_at), AFTER (recompute bed + mark reservation)
CREATE OR REPLACE FUNCTION on_admission_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND NEW.status = 'discharged' AND OLD.status = 'active' THEN
        NEW.discharged_at := COALESCE(NEW.discharged_at, now());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION on_admission_after()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.reservation_id IS NOT NULL THEN
        UPDATE reservations SET status = 'checked_in'
        WHERE id = NEW.reservation_id AND status <> 'checked_in';
    END IF;
    IF TG_OP = 'UPDATE' AND NEW.status = 'discharged' AND OLD.status = 'active' THEN
        IF NEW.reservation_id IS NOT NULL THEN
            UPDATE reservations
            SET status = 'cancelled', cancelled_at = now(), cancellation_reason = 'Bemor chiqarildi'
            WHERE id = NEW.reservation_id AND status NOT IN ('cancelled', 'expired');
        END IF;
    END IF;
    PERFORM recompute_bed_status(NEW.bed_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_admission_before
    BEFORE INSERT OR UPDATE ON admissions
    FOR EACH ROW EXECUTE FUNCTION on_admission_change();

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

-- ==========================================
-- pg_cron: hourly reservation expiry
-- ==========================================
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
