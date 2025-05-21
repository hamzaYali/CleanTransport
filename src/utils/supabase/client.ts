import { createBrowserClient } from "@supabase/ssr";

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }
  
  if (!supabaseAnonKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  }
  
  return createBrowserClient(
    supabaseUrl || 'https://ydsezshcjwneqrakwnhu.supabase.co',
    supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlkc2V6c2hjanduZXFyYWt3bmh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NzQ0NzksImV4cCI6MjA2MzM1MDQ3OX0.DbDy8uJ8jIf0Q8LE3eSM7ZU695CW5l6zjsUM6dWo0wU'
  );
}; 