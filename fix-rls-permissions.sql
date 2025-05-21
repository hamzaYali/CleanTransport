-- Simple RLS policy setup
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transports ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Remove all existing policies
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON users;
DROP POLICY IF EXISTS "Allow access to own user data" ON users;
DROP POLICY IF EXISTS "Allow anyone to read users" ON users;
DROP POLICY IF EXISTS "Allow insert from authenticated users" ON users;
DROP POLICY IF EXISTS "Allow user to update own record" ON users;

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON transports;
DROP POLICY IF EXISTS "Allow anyone to read transports" ON transports;
DROP POLICY IF EXISTS "Allow authenticated users to insert transports" ON transports;
DROP POLICY IF EXISTS "Allow authenticated users to update transports" ON transports;
DROP POLICY IF EXISTS "Allow authenticated users to delete transports" ON transports;

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON announcements;
DROP POLICY IF EXISTS "Allow all users to read announcements" ON announcements;
DROP POLICY IF EXISTS "Allow authenticated users to create/update/delete announcements" ON announcements;
DROP POLICY IF EXISTS "Allow authenticated users to insert announcements" ON announcements;
DROP POLICY IF EXISTS "Allow authenticated users to update announcements" ON announcements;
DROP POLICY IF EXISTS "Allow authenticated users to delete announcements" ON announcements;

-- Create simple policies

-- Users table: authenticated users can read all users, but only update their own
CREATE POLICY "users_read_policy" ON users
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "users_insert_policy" ON users
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_policy" ON users
    FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Transports table: authenticated users can do anything with transports
CREATE POLICY "transports_read_policy" ON transports
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "transports_insert_policy" ON transports
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "transports_update_policy" ON transports
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "transports_delete_policy" ON transports
    FOR DELETE TO authenticated USING (true);

-- Announcements table: authenticated users can do anything with announcements
CREATE POLICY "announcements_read_policy" ON announcements
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "announcements_insert_policy" ON announcements
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "announcements_update_policy" ON announcements
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "announcements_delete_policy" ON announcements
    FOR DELETE TO authenticated USING (true);

-- Allow public (anonymous) access to read users and public data
CREATE POLICY "public_users_read_policy" ON users
    FOR SELECT TO anon USING (true);

CREATE POLICY "public_transports_read_policy" ON transports
    FOR SELECT TO anon USING (true);

CREATE POLICY "public_announcements_read_policy" ON announcements
    FOR SELECT TO anon USING (true); 