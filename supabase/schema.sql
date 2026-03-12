-- Run this in Supabase SQL Editor to set up the project

-- Enable Row Level Security (already enabled by default)
-- Pryysm uses Supabase Auth only + localStorage for workspace data
-- No additional tables required for basic operation.
-- 
-- Optional: If you want server-side data persistence in the future,
-- you can create workspace tables below:

-- Example (optional) tables for future use:
-- CREATE TABLE IF NOT EXISTS profiles (
--   id uuid REFERENCES auth.users ON DELETE CASCADE,
--   name text,
--   company_name text,
--   created_at timestamptz DEFAULT now(),
--   PRIMARY KEY (id)
-- );

-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
-- CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to auto-create profile on signup:
-- CREATE OR REPLACE FUNCTION handle_new_user()
-- RETURNS trigger AS $$
-- BEGIN
--   INSERT INTO profiles (id, name)
--   VALUES (new.id, new.raw_user_meta_data->>'full_name');
--   RETURN new;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

SELECT 'Schema ready. Supabase Auth is sufficient for Pryysm to function.' as status;
