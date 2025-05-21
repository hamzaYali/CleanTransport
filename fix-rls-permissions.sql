-- Drop existing RLS policies for users table
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON users;
DROP POLICY IF EXISTS "Allow access to own user data" ON users;
DROP POLICY IF EXISTS "Allow anyone to read users" ON users;
DROP POLICY IF EXISTS "Allow insert from authenticated users" ON users;
DROP POLICY IF EXISTS "Allow user to update own record" ON users;

-- Create new policies for the users table
-- Allow anyone (auth or anon) to read from users table
CREATE POLICY "Allow anyone to read users"
ON users FOR SELECT
TO anon, authenticated
USING (true);

-- Allow authenticated users to insert their own user records
CREATE POLICY "Allow insert from authenticated users"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow user to update their own user record
CREATE POLICY "Allow user to update own record"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Make sure enable_row_level_security is on for users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for transports
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON transports;
DROP POLICY IF EXISTS "Allow anyone to read transports" ON transports;
DROP POLICY IF EXISTS "Allow authenticated users to insert transports" ON transports;
DROP POLICY IF EXISTS "Allow authenticated users to update transports" ON transports;
DROP POLICY IF EXISTS "Allow authenticated users to delete transports" ON transports;

-- Create policies for transports
-- Allow anyone to read transports
CREATE POLICY "Allow anyone to read transports"
ON transports FOR SELECT
TO anon, authenticated
USING (true);

-- Allow authenticated users to insert transports - with a simpler check
CREATE POLICY "Allow authenticated users to insert transports" 
ON transports FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update transports"
ON transports FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to delete transports"
ON transports FOR DELETE  
TO authenticated
USING (true);

-- Make sure enable_row_level_security is on for transports
ALTER TABLE transports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for announcements
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON announcements;
DROP POLICY IF EXISTS "Allow all users to read announcements" ON announcements;
DROP POLICY IF EXISTS "Allow authenticated users to create/update/delete announcements" ON announcements;
DROP POLICY IF EXISTS "Allow authenticated users to insert announcements" ON announcements;
DROP POLICY IF EXISTS "Allow authenticated users to update announcements" ON announcements;
DROP POLICY IF EXISTS "Allow authenticated users to delete announcements" ON announcements;

-- Create policies for announcements
-- Allow anyone to read announcements 
CREATE POLICY "Allow all users to read announcements"
ON announcements FOR SELECT
TO anon, authenticated
USING (true);

-- Allow authenticated users to modify announcements - create separate policies for each operation
CREATE POLICY "Allow authenticated users to insert announcements"
ON announcements FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update announcements"
ON announcements FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to delete announcements"
ON announcements FOR DELETE
TO authenticated
USING (true);

-- Make sure enable_row_level_security is on for announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY; 