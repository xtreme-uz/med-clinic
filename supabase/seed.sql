-- Local dev seed: creates three test users with matching profiles.
-- Password for all: "password123"
-- Emails: admin@clinic.local / doctor@clinic.local / registrar@clinic.local

DO $$
DECLARE
  v_admin_id UUID := '11111111-1111-1111-1111-111111111111';
  v_doctor_id UUID := '22222222-2222-2222-2222-222222222222';
  v_registrar_id UUID := '33333333-3333-3333-3333-333333333333';
  v_hash TEXT := crypt('password123', gen_salt('bf'));
BEGIN
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, reauthentication_token, phone_change, phone_change_token
  ) VALUES
    (v_admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'admin@clinic.local', v_hash, now(), now(), now(),
     '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false,
     '', '', '', '', '', '', '', ''),
    (v_doctor_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'doctor@clinic.local', v_hash, now(), now(), now(),
     '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false,
     '', '', '', '', '', '', '', ''),
    (v_registrar_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'registrar@clinic.local', v_hash, now(), now(), now(),
     '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false,
     '', '', '', '', '', '', '', '')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
  VALUES
    (gen_random_uuid(), v_admin_id, v_admin_id::text,
     jsonb_build_object('sub', v_admin_id::text, 'email', 'admin@clinic.local'),
     'email', now(), now(), now()),
    (gen_random_uuid(), v_doctor_id, v_doctor_id::text,
     jsonb_build_object('sub', v_doctor_id::text, 'email', 'doctor@clinic.local'),
     'email', now(), now(), now()),
    (gen_random_uuid(), v_registrar_id, v_registrar_id::text,
     jsonb_build_object('sub', v_registrar_id::text, 'email', 'registrar@clinic.local'),
     'email', now(), now(), now())
  ON CONFLICT DO NOTHING;

  INSERT INTO profiles (id, full_name, role, phone, is_active) VALUES
    (v_admin_id, 'Admin User', 'admin', '+998900000001', true),
    (v_doctor_id, 'Test Doctor', 'doctor', '+998900000002', true),
    (v_registrar_id, 'Test Registrar', 'registrar', '+998900000003', true)
  ON CONFLICT (id) DO NOTHING;
END $$;
