-- Transport Schedule Database Schema

-- Transports Table
CREATE TABLE transports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Client Information
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  
  -- Pickup Information
  pickup_location TEXT NOT NULL,
  pickup_time TEXT NOT NULL,
  pickup_date TEXT NOT NULL,
  
  -- Dropoff Information
  dropoff_location TEXT NOT NULL,
  dropoff_time TEXT NOT NULL,
  dropoff_date TEXT NOT NULL,
  
  -- Staff Information  
  staff_requester TEXT NOT NULL,
  staff_driver TEXT NOT NULL,
  staff_assistant TEXT,
  
  -- Other Details
  client_count INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL CHECK (status IN ('completed', 'in-progress', 'scheduled')),
  notes TEXT,
  vehicle TEXT,
  car_seats INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_transports_pickup_date ON transports(pickup_date);
CREATE INDEX idx_transports_status ON transports(status);

-- Announcements Table
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Announcement Details
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  author TEXT NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_announcements_date ON announcements(date);
CREATE INDEX idx_announcements_timestamp ON announcements(timestamp);

-- Users Table (Extended from auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  is_admin BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE transports ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Transports: allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" 
ON transports FOR ALL 
TO authenticated 
USING (true);

-- Announcements: allow all to read, only authenticated to write
CREATE POLICY "Allow all users to read announcements" 
ON announcements FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to create/update/delete announcements" 
ON announcements FOR ALL 
TO authenticated 
USING (true);

-- Users: allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" 
ON users FOR ALL 
TO authenticated 
USING (true);

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, username)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Sample data for testing (optional - comment out for production)
-- INSERT INTO transports (client_name, client_phone, pickup_location, pickup_time, pickup_date, dropoff_location, dropoff_time, dropoff_date, staff_requester, staff_driver, client_count, status, vehicle)
-- VALUES ('John Doe', '555-1234', '123 Main St', '09:00 AM', '2025-05-21', '456 Oak Ave', '10:00 AM', '2025-05-21', 'Staff Member', 'Driver One', 1, 'scheduled', 'Van #101');

-- INSERT INTO announcements (title, content, date, timestamp, priority, author)
-- VALUES ('System Maintenance', 'The system will be down for maintenance on Friday evening.', '2025-05-21', '2025-05-21T12:00:00Z', 'high', 'Admin'); 