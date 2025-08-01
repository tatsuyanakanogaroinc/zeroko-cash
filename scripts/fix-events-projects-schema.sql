-- Fix events table schema
-- 1. Add description column if it doesn't exist
ALTER TABLE events ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Make department_id nullable (allow events without departments)
ALTER TABLE events ALTER COLUMN department_id DROP NOT NULL;

-- Fix projects table schema
-- 3. Add missing columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS end_date DATE;

-- 4. Remove the code column constraint if it exists (not used in our form)
ALTER TABLE projects ALTER COLUMN code DROP NOT NULL;

-- Update sample events to include department_id properly
UPDATE events SET department_id = '550e8400-e29b-41d4-a716-446655440001' WHERE department_id IS NULL;
