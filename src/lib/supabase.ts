import { createClient } from '@supabase/supabase-js';

// These should be updated with your Supabase project details
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database table names
export const TABLES = {
  TRANSPORTS: 'transports',
  ANNOUNCEMENTS: 'announcements',
  USERS: 'users',
}; 