-- Master user追加
INSERT INTO users (id, name, email, role, password_changed, initial_password, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Master User',
  'tatsuya.vito.nakano@gmail.com',
  'admin',
  false,
  'garo0122',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;
