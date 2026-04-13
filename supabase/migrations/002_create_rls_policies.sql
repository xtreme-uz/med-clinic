ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER bypasses RLS so this can read profiles even when called from a policy.
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL USING (get_user_role() = 'admin');

-- DEPARTMENTS
CREATE POLICY "departments_select" ON departments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "departments_admin" ON departments FOR ALL USING (get_user_role() = 'admin');

-- ROOMS
CREATE POLICY "rooms_select" ON rooms FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "rooms_admin" ON rooms FOR ALL USING (get_user_role() = 'admin');

-- BEDS
CREATE POLICY "beds_select" ON beds FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "beds_write" ON beds FOR ALL USING (
    get_user_role() IN ('admin', 'registrar')
);

-- PATIENTS
CREATE POLICY "patients_select" ON patients FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "patients_write" ON patients FOR ALL USING (
    get_user_role() IN ('admin', 'registrar', 'doctor')
);

-- RESERVATIONS
CREATE POLICY "reservations_staff_all" ON reservations FOR ALL USING (
    get_user_role() IN ('admin', 'registrar')
);
CREATE POLICY "reservations_doctor_read" ON reservations FOR SELECT USING (
    get_user_role() = 'doctor'
);
CREATE POLICY "reservations_doctor_insert" ON reservations FOR INSERT WITH CHECK (
    get_user_role() = 'doctor' AND doctor_id = auth.uid()
);
-- Doctors can update/cancel their own pending referrals
CREATE POLICY "reservations_doctor_update_own" ON reservations FOR UPDATE USING (
    get_user_role() = 'doctor' AND doctor_id = auth.uid() AND status = 'pending'
);

-- ADMISSIONS
CREATE POLICY "admissions_staff" ON admissions FOR ALL USING (
    get_user_role() IN ('admin', 'registrar', 'doctor')
);

-- AUDIT LOG
CREATE POLICY "audit_admin" ON audit_log FOR SELECT USING (
    get_user_role() = 'admin'
);
CREATE POLICY "audit_own" ON audit_log FOR SELECT USING (
    user_id = auth.uid()
);
CREATE POLICY "audit_insert" ON audit_log FOR INSERT WITH CHECK (true);
