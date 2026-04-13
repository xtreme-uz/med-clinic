# Klinika Statsionar Joy Booking Tizimi — Claude Code Specification

## Loyiha haqida

Med klinika statsionari uchun yotib davolanish joylarini oldindan band qilish (booking) web ilovasi.
**Faqat klinika xodimlari uchun** — bemorlar bu tizimdan foydalanmaydi.
Asosiy foydalanuvchi: registratura xodimi — bemorni qabul qiladi, bo'sh joy topadi, band qiladi.
Shifokor o'z bo'limi bo'yicha holatni ko'radi. Admin hammani boshqaradi.
Real-time yangilanish bilan barcha xodimlar bir vaqtda haqiqiy holatni ko'radi.

### Foydalanuvchi rollari (faqat xodimlar)

| Rol | Vazifalari |
|---|---|
| **Admin** | Bo'limlar, xonalar, karavotlar, xodimlar boshqaruvi. To'liq nazorat |
| **Registratura** | Bemorni qabul qilish, joy qidirish, band qilish, check-in/check-out. Asosiy foydalanuvchi |
| **Shifokor** | O'z bo'limi karavotlari holatini ko'rish, bemorlar ro'yxati, reservation tasdiqlash |

---

## Tech Stack

| Texnologiya | Maqsad |
|---|---|
| React 18+ | Frontend UI |
| TypeScript | Type safety |
| Vite | Build tool |
| Tailwind CSS 3 | Styling |
| React Router v6 | Routing |
| @supabase/supabase-js | Backend SDK |
| Supabase (cloud) | Auth, DB, Realtime, Edge Functions, Storage |
| PostgreSQL (Supabase) | Database |
| Electron + electron-builder | Desktop app packaging |
| Zustand | State management |
| React Query (TanStack Query) | Server state / caching |
| date-fns | Sanalar bilan ishlash |
| react-hot-toast | Notifications |
| Lucide React | Ikonkalar |

---

## Loyiha strukturasi

```
clinic-bed-booking/
├── public/
├── electron/
│   ├── main.ts                  # Electron main process
│   └── preload.ts               # Preload script
├── src/
│   ├── main.tsx                 # React entry point
│   ├── App.tsx                  # Root component + Router
│   ├── vite-env.d.ts
│   │
│   ├── config/
│   │   └── supabase.ts          # Supabase client init
│   │
│   ├── types/
│   │   ├── database.ts          # Supabase generated types
│   │   ├── auth.ts              # Auth related types
│   │   └── index.ts             # Shared types & enums
│   │
│   ├── hooks/
│   │   ├── useAuth.ts           # Auth hook (login, logout, session)
│   │   ├── useDepartments.ts    # CRUD departments
│   │   ├── useRooms.ts          # CRUD rooms
│   │   ├── useBeds.ts           # CRUD beds + realtime status
│   │   ├── usePatients.ts       # CRUD patients
│   │   ├── useReservations.ts   # CRUD reservations + realtime
│   │   ├── useAdmissions.ts     # CRUD admissions
│   │   └── useAuditLog.ts       # Read audit log
│   │
│   ├── store/
│   │   ├── authStore.ts         # Zustand: user session, role
│   │   └── uiStore.ts           # Zustand: sidebar, theme, filters
│   │
│   ├── lib/
│   │   ├── supabaseClient.ts    # Singleton Supabase client
│   │   ├── permissions.ts       # Role-based permission helpers
│   │   ├── dateUtils.ts         # Date formatting, range helpers
│   │   └── constants.ts         # App-wide constants
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── MainLayout.tsx   # Sidebar + Header + Outlet
│   │   │   └── ProtectedRoute.tsx
│   │   │
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx    # Xodimlar uchun login (email+password)
│   │   │   └── RoleGuard.tsx    # Role-based component visibility
│   │   │
│   │   ├── departments/
│   │   │   ├── DepartmentList.tsx
│   │   │   └── DepartmentForm.tsx
│   │   │
│   │   ├── rooms/
│   │   │   ├── RoomList.tsx
│   │   │   └── RoomForm.tsx
│   │   │
│   │   ├── beds/
│   │   │   ├── BedGrid.tsx          # Visual grid of beds (color-coded)
│   │   │   ├── BedCard.tsx          # Single bed status card
│   │   │   ├── BedStatusBadge.tsx   # free/reserved/occupied badge
│   │   │   └── BedForm.tsx
│   │   │
│   │   ├── patients/
│   │   │   ├── PatientList.tsx
│   │   │   ├── PatientForm.tsx
│   │   │   └── PatientSearch.tsx
│   │   │
│   │   ├── reservations/
│   │   │   ├── ReservationCalendar.tsx  # Calendar view of bookings
│   │   │   ├── ReservationForm.tsx      # New booking form
│   │   │   ├── ReservationList.tsx      # Table list
│   │   │   └── ReservationDetails.tsx   # Single booking detail
│   │   │
│   │   ├── admissions/
│   │   │   ├── AdmissionList.tsx
│   │   │   ├── CheckInForm.tsx      # Reservation → Admission
│   │   │   └── CheckOutForm.tsx     # Discharge
│   │   │
│   │   ├── dashboard/
│   │   │   ├── StatsCards.tsx       # Occupancy %, free beds, etc.
│   │   │   ├── OccupancyChart.tsx   # Bar/pie chart
│   │   │   └── RecentActivity.tsx   # Latest bookings/admissions
│   │   │
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Select.tsx
│   │       ├── Modal.tsx
│   │       ├── Table.tsx
│   │       ├── Badge.tsx
│   │       ├── DatePicker.tsx
│   │       ├── Spinner.tsx
│   │       ├── EmptyState.tsx
│   │       └── ConfirmDialog.tsx
│   │
│   └── pages/
│       ├── LoginPage.tsx
│       ├── DashboardPage.tsx
│       ├── DepartmentsPage.tsx
│       ├── RoomsPage.tsx
│       ├── BedsPage.tsx          # Asosiy ish ekrani (registratura)
│       ├── PatientsPage.tsx
│       ├── ReservationsPage.tsx
│       ├── AdmissionsPage.tsx
│       ├── StaffPage.tsx         # Xodimlar boshqaruvi (admin only)
│       ├── AuditLogPage.tsx
│       └── NotFoundPage.tsx
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_create_tables.sql
│   │   ├── 002_create_rls_policies.sql
│   │   ├── 003_create_functions.sql
│   │   ├── 004_create_triggers.sql
│   │   └── 005_seed_data.sql
│   └── config.toml
│
├── .env                         # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── electron-builder.yml
└── README.md
```

---

## Database Schema (Supabase PostgreSQL)

### ENUMs

```sql
CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'registrar');
CREATE TYPE bed_status AS ENUM ('free', 'reserved', 'occupied', 'maintenance');
CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'cancelled', 'expired', 'checked_in');
CREATE TYPE admission_status AS ENUM ('active', 'discharged', 'transferred');
CREATE TYPE gender_type AS ENUM ('male', 'female');
```

### Tables

```sql
-- ==========================================
-- 1. PROFILES (extends Supabase auth.users)
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
-- 2. DEPARTMENTS (bo'limlar)
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
-- 3. ROOMS (xonalar)
-- ==========================================
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    room_number TEXT NOT NULL,
    room_type TEXT NOT NULL DEFAULT 'standard',  -- standard, vip, icu, isolation
    floor INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(department_id, room_number)
);

-- ==========================================
-- 4. BEDS (karavotlar)
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
-- 5. PATIENTS (bemorlar)
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
    blood_type TEXT,            -- A+, A-, B+, B-, AB+, AB-, O+, O-
    allergies TEXT,
    chronic_conditions TEXT,
    notes TEXT,
    created_by UUID REFERENCES profiles(id),  -- qaysi xodim yaratdi
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- 6. RESERVATIONS (bandlov / booking)
-- ==========================================
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    bed_id UUID NOT NULL REFERENCES beds(id),
    department_id UUID NOT NULL REFERENCES departments(id),
    doctor_id UUID REFERENCES profiles(id),       -- tavsiya qilgan shifokor
    reserved_by UUID NOT NULL REFERENCES profiles(id),  -- kim band qildi
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    status reservation_status NOT NULL DEFAULT 'pending',
    diagnosis_preliminary TEXT,          -- dastlabki tashxis
    referral_number TEXT,                -- yo'llanma raqami
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

-- ==========================================
-- 7. ADMISSIONS (yotqizish)
-- ==========================================
CREATE TABLE admissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID REFERENCES reservations(id),  -- nullable: walk-in possible
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
-- 8. AUDIT LOG (o'zgarishlar tarixi)
-- ==========================================
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,           -- 'reservation.created', 'bed.status_changed', etc.
    entity_type TEXT NOT NULL,      -- 'reservation', 'admission', 'bed', etc.
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
CREATE INDEX idx_admissions_status ON admissions(status);
CREATE INDEX idx_admissions_patient ON admissions(patient_id);
CREATE INDEX idx_admissions_bed ON admissions(bed_id);
CREATE INDEX idx_patients_passport ON patients(passport_number);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);
```

### RLS Policies

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES: users can read all, update own
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL USING (get_user_role() = 'admin');

-- DEPARTMENTS: all can read, admin can write
CREATE POLICY "departments_select" ON departments FOR SELECT USING (true);
CREATE POLICY "departments_admin" ON departments FOR ALL USING (get_user_role() = 'admin');

-- ROOMS: all can read, admin can write
CREATE POLICY "rooms_select" ON rooms FOR SELECT USING (true);
CREATE POLICY "rooms_admin" ON rooms FOR ALL USING (get_user_role() = 'admin');

-- BEDS: all staff can read, admin/registrar can write
CREATE POLICY "beds_select" ON beds FOR SELECT USING (true);
CREATE POLICY "beds_write" ON beds FOR ALL USING (
    get_user_role() IN ('admin', 'registrar')
);

-- PATIENTS: all staff can read/write (bemorlar tizimga kirmaydi)
CREATE POLICY "patients_staff" ON patients FOR SELECT USING (true);
CREATE POLICY "patients_write" ON patients FOR ALL USING (
    get_user_role() IN ('admin', 'registrar', 'doctor')
);

-- RESERVATIONS:
-- admin, registrar can do everything
-- doctor can read all, create for own department
CREATE POLICY "reservations_staff" ON reservations FOR ALL USING (
    get_user_role() IN ('admin', 'registrar')
);
CREATE POLICY "reservations_doctor_read" ON reservations FOR SELECT USING (
    get_user_role() = 'doctor'
);
CREATE POLICY "reservations_doctor_write" ON reservations FOR INSERT WITH CHECK (
    get_user_role() = 'doctor' AND doctor_id = auth.uid()
);

-- ADMISSIONS: admin, registrar, doctor can read/write
CREATE POLICY "admissions_staff" ON admissions FOR ALL USING (
    get_user_role() IN ('admin', 'registrar', 'doctor')
);

-- AUDIT LOG: admin can read all, others can read own actions
CREATE POLICY "audit_admin" ON audit_log FOR SELECT USING (
    get_user_role() = 'admin'
);
CREATE POLICY "audit_own" ON audit_log FOR SELECT USING (
    user_id = auth.uid()
);
CREATE POLICY "audit_insert" ON audit_log FOR INSERT WITH CHECK (true);
```

### Database Functions & Triggers

```sql
-- ==========================================
-- Auto-update updated_at timestamp
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
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
-- Auto-update bed status on reservation confirm
-- ==========================================
CREATE OR REPLACE FUNCTION on_reservation_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Reservation confirmed -> bed reserved
    IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
        UPDATE beds SET status = 'reserved' WHERE id = NEW.bed_id;
    END IF;

    -- Reservation cancelled -> bed free (if no other active reservation)
    IF NEW.status = 'cancelled' AND OLD.status IN ('pending', 'confirmed') THEN
        IF NOT EXISTS (
            SELECT 1 FROM reservations
            WHERE bed_id = NEW.bed_id
            AND id != NEW.id
            AND status IN ('confirmed', 'checked_in')
            AND check_in_date <= CURRENT_DATE
            AND check_out_date > CURRENT_DATE
        ) THEN
            UPDATE beds SET status = 'free' WHERE id = NEW.bed_id;
        END IF;
    END IF;

    -- Reservation checked_in -> bed occupied
    IF NEW.status = 'checked_in' AND OLD.status = 'confirmed' THEN
        UPDATE beds SET status = 'occupied' WHERE id = NEW.bed_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_reservation_status
    AFTER UPDATE OF status ON reservations
    FOR EACH ROW EXECUTE FUNCTION on_reservation_status_change();

-- ==========================================
-- Auto-update bed status on admission/discharge
-- ==========================================
CREATE OR REPLACE FUNCTION on_admission_change()
RETURNS TRIGGER AS $$
BEGIN
    -- New admission -> bed occupied
    IF TG_OP = 'INSERT' THEN
        UPDATE beds SET status = 'occupied' WHERE id = NEW.bed_id;
    END IF;

    -- Discharge -> bed free
    IF TG_OP = 'UPDATE' AND NEW.status = 'discharged' AND OLD.status = 'active' THEN
        UPDATE beds SET status = 'free' WHERE id = NEW.bed_id;
        NEW.discharged_at = now();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_admission_change
    AFTER INSERT OR UPDATE OF status ON admissions
    FOR EACH ROW EXECUTE FUNCTION on_admission_change();

-- ==========================================
-- Expire old pending reservations (cron yoki Edge Function orqali chaqiriladi)
-- ==========================================
CREATE OR REPLACE FUNCTION expire_old_reservations()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE reservations
    SET status = 'expired', updated_at = now()
    WHERE status = 'pending'
    AND check_in_date < CURRENT_DATE;

    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- Audit log trigger (generic)
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

CREATE TRIGGER tr_audit_reservations AFTER INSERT OR UPDATE OR DELETE ON reservations
    FOR EACH ROW EXECUTE FUNCTION log_audit();
CREATE TRIGGER tr_audit_admissions AFTER INSERT OR UPDATE OR DELETE ON admissions
    FOR EACH ROW EXECUTE FUNCTION log_audit();
CREATE TRIGGER tr_audit_beds AFTER UPDATE ON beds
    FOR EACH ROW EXECUTE FUNCTION log_audit();

-- ==========================================
-- Dashboard stats function
-- ==========================================
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
    SELECT json_build_object(
        'total_beds', (SELECT count(*) FROM beds WHERE beds.id IS NOT NULL),
        'free_beds', (SELECT count(*) FROM beds WHERE status = 'free'),
        'reserved_beds', (SELECT count(*) FROM beds WHERE status = 'reserved'),
        'occupied_beds', (SELECT count(*) FROM beds WHERE status = 'occupied'),
        'maintenance_beds', (SELECT count(*) FROM beds WHERE status = 'maintenance'),
        'pending_reservations', (SELECT count(*) FROM reservations WHERE status = 'pending'),
        'today_checkins', (SELECT count(*) FROM reservations WHERE check_in_date = CURRENT_DATE AND status = 'confirmed'),
        'today_checkouts', (SELECT count(*) FROM admissions WHERE status = 'active' AND discharged_at IS NULL),
        'occupancy_rate', (
            SELECT ROUND(
                (count(*) FILTER (WHERE status = 'occupied'))::DECIMAL /
                NULLIF(count(*), 0) * 100, 1
            ) FROM beds
        )
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### Seed Data (test uchun)

```sql
-- Test departments
INSERT INTO departments (name, description, floor) VALUES
('Terapiya', 'Ichki kasalliklar bo''limi', 1),
('Xirurgiya', 'Jarrohlik bo''limi', 2),
('Kardiologiya', 'Yurak-qon tomir kasalliklari', 3),
('Nevrologiya', 'Nerv tizimi kasalliklari', 3),
('Pediatriya', 'Bolalar bo''limi', 1);

-- Test rooms (har bir bo'limga 2-3 xona)
-- Terapiya
INSERT INTO rooms (department_id, room_number, room_type, floor)
SELECT id, '101', 'standard', 1 FROM departments WHERE name = 'Terapiya';
INSERT INTO rooms (department_id, room_number, room_type, floor)
SELECT id, '102', 'standard', 1 FROM departments WHERE name = 'Terapiya';
INSERT INTO rooms (department_id, room_number, room_type, floor)
SELECT id, '103', 'vip', 1 FROM departments WHERE name = 'Terapiya';

-- Xirurgiya
INSERT INTO rooms (department_id, room_number, room_type, floor)
SELECT id, '201', 'standard', 2 FROM departments WHERE name = 'Xirurgiya';
INSERT INTO rooms (department_id, room_number, room_type, floor)
SELECT id, '202', 'icu', 2 FROM departments WHERE name = 'Xirurgiya';

-- Beds (har bir xonaga 2-4 karavot)
-- Bu qism dynamic: xona id lari kerak, shuning uchun script orqali
DO $$
DECLARE
    r RECORD;
    bed_count INTEGER;
    i INTEGER;
BEGIN
    FOR r IN SELECT id, room_type FROM rooms LOOP
        bed_count := CASE r.room_type
            WHEN 'vip' THEN 1
            WHEN 'icu' THEN 2
            WHEN 'isolation' THEN 1
            ELSE 4
        END;
        FOR i IN 1..bed_count LOOP
            INSERT INTO beds (room_id, bed_number, daily_price)
            VALUES (
                r.id,
                i::TEXT,
                CASE r.room_type
                    WHEN 'vip' THEN 500000
                    WHEN 'icu' THEN 300000
                    ELSE 150000
                END
            );
        END LOOP;
    END LOOP;
END $$;
```

---

## Supabase Realtime Configuration

Realtime quyidagi jadvallarga ulanishi kerak:

```typescript
// beds jadvalini realtime tinglash
const channel = supabase
  .channel('beds-realtime')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'beds' },
    (payload) => {
      // Bed status o'zgarganda UI yangilanadi
    }
  )
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'reservations' },
    (payload) => {
      // Reservation qo'shilganda/o'zgarganda UI yangilanadi
    }
  )
  .subscribe();
```

Supabase Dashboard -> Database -> Replication -> supabase_realtime publication ga qo'shilishi kerak bo'lgan jadvallar:
- `beds`
- `reservations`
- `admissions`

---

## Routing (React Router v6)

```
/login                    -> LoginPage (xodimlar uchun)
/                         -> DashboardPage (redirect if not auth)
/departments              -> DepartmentsPage (admin only)
/departments/:id/rooms    -> RoomsPage
/rooms/:id/beds           -> BedsPage
/beds                     -> BedsPage (all beds grid view — asosiy ish ekrani)
/patients                 -> PatientsPage
/patients/:id             -> PatientDetailsPage
/reservations             -> ReservationsPage
/reservations/new         -> New reservation form
/reservations/:id         -> ReservationDetailsPage
/admissions               -> AdmissionsPage
/audit-log                -> AuditLogPage (admin only)
```

---

## UI/UX Talablari

### Dashboard
- Stats kartalar: Jami karavotlar, Bo'sh, Band qilingan, Yotqizilgan, Occupancy %
- Bar chart: Bo'limlar bo'yicha bandlik
- So'nggi faoliyatlar ro'yxati (oxirgi 10 ta reservation/admission)
- Bugungi check-in / check-out sonlari

### Beds Grid (asosiy ish ekrani — registratura xodimi bu yerda ishlaydi)
- Bo'limlar bo'yicha filterlash (tab yoki dropdown)
- Xonalar bo'yicha guruhlangan karavotlar
- Rang kodlari:
  - 🟢 Yashil = bo'sh (free)
  - 🟡 Sariq = band qilingan (reserved)
  - 🔴 Qizil = yotqizilgan (occupied)
  - ⚪ Kulrang = ta'mirda (maintenance)
- Karavotni bosish -> modal: bemor info, booking yaratish, status o'zgartirish
- Realtime: boshqa registratura xodimi band qilsa, rang avtomatik o'zgaradi
- **Quick actions**: bo'sh karavotni bosish → to'g'ridan-to'g'ri booking formasi ochiladi

### Reservation Form (registratura xodimi to'ldiradi)
- Bemor tanlash (search by name/passport/phone) yoki yangi bemor yaratish (inline form)
- Bo'lim tanlash -> xona tanlash -> karavot tanlash (faqat bo'shlarni ko'rsatish)
- Sana oralig'i (check-in / check-out)
- Yo'llanma bergan shifokor tanlash
- Dastlabki tashxis
- Yo'llanma raqami
- Narx kalkulyatsiyasi (kunlik narx × kunlar soni) — avtomatik hisoblash
- "Band qilish" tugmasi — status: confirmed (registratura o'zi tasdiqlaydi)

### Reservation Status Flow
```
Registratura band qiladi:
  confirmed → checked_in → (admission yaratiladi)
  confirmed → cancelled

Shifokor orqali (yo'llanma):
  pending → confirmed (registratura tasdiqlaydi) → checked_in
  pending → cancelled
  pending → expired (auto, agar check_in_date o'tib ketsa)
```
Registratura xodimi to'g'ridan-to'g'ri "confirmed" statusda band qiladi.
Shifokor yo'llanma bersa — "pending" ga tushadi, registratura keyin tasdiqlaydi.

### Sidebar Menu
```
📊 Dashboard
🏥 Bo'limlar        (admin)
🛏️ Karavotlar       (grid view — asosiy ekran)
👤 Bemorlar         (registratura, shifokor)
📋 Bandlov          (reservations)
🏨 Yotqizish        (admissions — check-in/check-out)
📝 Audit Log        (admin)
👥 Xodimlar         (admin — foydalanuvchilar boshqaruvi)
⚙️ Sozlamalar       (admin)
```

---

## Electron Integration

### electron/main.ts
```typescript
// Electron main process
// - BrowserWindow yaratadi
// - Production'da built React app'ni yuklaydi
// - Dev mode'da localhost:5173 ga ulanadi
// - Menu bar: File, View, Help
// - Auto-update (electron-updater) - ixtiyoriy
```

### package.json scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "electron:dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && electron .\"",
    "electron:build": "vite build && electron-builder",
    "electron:build:win": "vite build && electron-builder --win",
    "electron:build:linux": "vite build && electron-builder --linux"
  }
}
```

### electron-builder.yml
```yaml
appId: com.clinic.bedbooking
productName: "Clinic Bed Booking"
directories:
  output: dist-electron
files:
  - dist/**/*
  - electron/**/*
win:
  target: nsis
  icon: public/icon.png
linux:
  target: AppImage
  icon: public/icon.png
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
```

---

## Supabase Edge Functions (ixtiyoriy)

### 1. expire-reservations (Cron: har kuni 00:00)
```
Muddati o'tgan pending reservationlarni expired ga o'zgartiradi.
SELECT expire_old_reservations();
```

### 2. send-notification (Webhook trigger)
```
Reservation confirmed bo'lganda bemorga SMS/email yuboradi.
Eskort.uz yoki PlayMobile.uz API orqali SMS.
```

---

## Environment Variables

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

---

## Muhim Business Rules

1. **Bir karavotga bir vaqtda faqat bitta active reservation** — `EXCLUDE` constraint database darajasida tekshiradi
2. **Pending reservation (shifokor yo'llanmasi) 24 soat ichida confirm bo'lmasa** — Edge Function orqali auto-expire
3. **Walk-in admission** — reservationsiz ham yotqizish mumkin (reservation_id nullable)
4. **Karavot maintenance** — admin karavotni ta'mirga chiqarsa, uni band qilib bo'lmaydi
5. **Audit log** — barcha muhim o'zgarishlar (reservation, admission, bed status) loglanadi
6. **Narx hisoblash** — `daily_price * (check_out_date - check_in_date)` = taxminiy narx
7. **Concurrent booking prevention** — Supabase RPC + database constraint: ikkita xodim bir vaqtda bir joyni band qila olmaydi
8. **Xodim accountlari** — faqat admin yaratadi, bemorlar tizimga kirmaydi
9. **Registratura to'g'ridan-to'g'ri tasdiqlaydi** — bemor kelganda joy darhol "confirmed" bo'ladi, shifokor yo'llanmasi bo'lsa "pending" dan boshlanadi

---

## Ishga tushirish tartibi

1. Supabase project yaratish (supabase.com)
2. SQL migrations ketma-ket bajarish (001 → 005)
3. Supabase Dashboard → Authentication → Email provider yoqish
4. Supabase Dashboard → Database → Replication → beds, reservations, admissions jadvallarini realtime ga qo'shish
5. `.env` faylga URL va anon key yozish
6. `npm install && npm run dev` — web versiya
7. `npm run electron:dev` — desktop versiya
8. Birinchi admin yaratish: Supabase Dashboard → Authentication → Add User, keyin profiles jadvaliga role='admin' qo'shish
9. Admin login qilib, registratura va shifokor accountlarini yaratish

---

## Kelajakdagi yaxshilanishlar (v2)

- [ ] SMS integration (PlayMobile.uz / Eskort.uz) — bemorga band qilinganlik haqida SMS
- [ ] PDF hisobot: kunlik/haftalik bandlik
- [ ] Bemor tarixini ko'rish (oldingi yotqizishlar)
- [ ] Waiting list (navbat ro'yxati) agar joy bo'lmasa
- [ ] Multi-branch (bir nechta filial) qo'llab-quvvatlash
- [ ] i18n (uz, ru) — registratura xodimlari uchun
- [ ] Dark mode
- [ ] Billing module (hisob-kitob, to'lov)
- [ ] Lab results integration
- [ ] Shifokor uchun mobile PWA (o'z bemorlar ro'yxatini ko'rish)
- [ ] Printer integration (band qilish kvitansiyasini chop etish)
