-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table to extend user data
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'driver', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transports table
CREATE TABLE IF NOT EXISTS transports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_name TEXT NOT NULL,
  client_phone TEXT,
  pickup_location TEXT NOT NULL,
  pickup_time TEXT,
  pickup_date DATE NOT NULL,
  dropoff_location TEXT,
  dropoff_time TEXT,
  dropoff_date DATE,
  requested_by UUID REFERENCES profiles(id),
  driver_id UUID REFERENCES profiles(id) NOT NULL,
  assistant_id UUID REFERENCES profiles(id),
  client_count INTEGER DEFAULT 1,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('completed', 'in-progress', 'scheduled')),
  notes TEXT,
  vehicle TEXT,
  car_seats INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date DATE NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('high', 'medium', 'low')),
  author_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Setup Row Level Security (RLS) policies

-- Enable row level security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transports ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE USING (auth.uid() = id);

-- Transport policies
CREATE POLICY "Transports are viewable by authenticated users" 
ON transports FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert transports" 
ON transports FOR INSERT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update transports" 
ON transports FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete transports" 
ON transports FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Announcement policies
CREATE POLICY "Announcements are viewable by authenticated users" 
ON announcements FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert announcements" 
ON announcements FOR INSERT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update announcements" 
ON announcements FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete announcements" 
ON announcements FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_modtime
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_transports_modtime
BEFORE UPDATE ON transports
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_announcements_modtime
BEFORE UPDATE ON announcements
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Trigger to create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new sign-ups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 