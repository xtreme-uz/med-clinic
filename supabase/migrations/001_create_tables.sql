-- ==========================================
-- Extensions
-- ==========================================
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- ENUMs
-- ==========================================
CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'registrar');
CREATE TYPE bed_status AS ENUM ('free', 'reserved', 'occupied', 'maintenance');
CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'cancelled', 'expired', 'checked_in');
CREATE TYPE admission_status AS ENUM ('active', 'discharged', 'transferred');
CREATE TYPE gender_type AS ENUM ('male', 'female');

-- ==========================================
-- 1. DEPARTMENTS (created first because profiles references it)
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

-- ==========================================
-- 2. PROFILES (extends auth.users)
-- ==========================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'registrar',
    phone TEXT,
    department_id UUID REFERENCES departments(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- 3. ROOMS
-- ==========================================
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

-- ==========================================
-- 4. BEDS
-- ==========================================
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

-- ==========================================
-- 5. PATIENTS
-- ==========================================
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

-- ==========================================
-- 6. RESERVATIONS
-- ==========================================
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
    notes TEXT,
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES profiles(id),
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT valid_dates CHECK (check_out_date > check_in_date),
    -- DB-level concurrent booking prevention. Requires btree_gist for the `=` operator on uuid.
    CONSTRAINT no_overlap EXCLUDE USING gist (
        bed_id WITH =,
        daterange(check_in_date, check_out_date, '[)') WITH &&
    ) WHERE (status NOT IN ('cancelled', 'expired'))
);

-- ==========================================
-- 7. ADMISSIONS
-- ==========================================
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

-- ==========================================
-- 8. AUDIT LOG
-- ==========================================
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
