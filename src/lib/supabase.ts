import { createClient } from '@supabase/supabase-js';

// These should be updated with your Supabase project details
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ydsezshcjwneqrakwnhu.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlkc2V6c2hjanduZXFyYWt3bmh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NzQ0NzksImV4cCI6MjA2MzM1MDQ3OX0.DbDy8uJ8jIf0Q8LE3eSM7ZU695CW5l6zjsUM6dWo0wU';

// Log to check if we're using the fallback
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn('Using fallback SUPABASE_URL - environment variable is missing');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('Using fallback SUPABASE_ANON_KEY - environment variable is missing');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database table names
export const TABLES = {
  TRANSPORTS: 'transports',
  ANNOUNCEMENTS: 'announcements',
  USERS: 'users',
}; 