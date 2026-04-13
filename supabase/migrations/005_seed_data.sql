-- Test departments
INSERT INTO departments (name, description, floor) VALUES
('Terapiya', 'Ichki kasalliklar bo''limi', 1),
('Xirurgiya', 'Jarrohlik bo''limi', 2),
('Kardiologiya', 'Yurak-qon tomir kasalliklari', 3),
('Nevrologiya', 'Nerv tizimi kasalliklari', 3),
('Pediatriya', 'Bolalar bo''limi', 1);

-- Test rooms
INSERT INTO rooms (department_id, room_number, room_type, floor)
SELECT id, '101', 'standard', 1 FROM departments WHERE name = 'Terapiya';
INSERT INTO rooms (department_id, room_number, room_type, floor)
SELECT id, '102', 'standard', 1 FROM departments WHERE name = 'Terapiya';
INSERT INTO rooms (department_id, room_number, room_type, floor)
SELECT id, '103', 'vip', 1 FROM departments WHERE name = 'Terapiya';
INSERT INTO rooms (department_id, room_number, room_type, floor)
SELECT id, '201', 'standard', 2 FROM departments WHERE name = 'Xirurgiya';
INSERT INTO rooms (department_id, room_number, room_type, floor)
SELECT id, '202', 'icu', 2 FROM departments WHERE name = 'Xirurgiya';

-- Beds: standard=4, vip=1, icu=2, isolation=1
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
