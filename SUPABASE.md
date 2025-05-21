# Supabase Setup Guide for Transport Dashboard

This guide will help you set up Supabase as the backend for your Transport Dashboard application.

## Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Node.js and npm installed on your computer

## Step 1: Create a Supabase Project

1. Log in to your Supabase account
2. Click "New Project" and follow the setup process
3. Note your project URL and anon key (you'll need these later)

## Step 2: Set Up the Database Schema

1. In your Supabase dashboard, go to the SQL Editor
2. Create a new query
3. Copy and paste the contents of the `supabase-schema.sql` file in this project
4. Run the query to create all the necessary tables, indexes, and policies

## Step 3: Configure Environment Variables

1. In your project root, create a file named `.env.local`
2. Add the following lines:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Replace the placeholder values with your actual Supabase project details

## Step 4: Set Up Authentication

1. In your Supabase dashboard, go to Authentication > Settings
2. Under Email Auth, ensure "Enable Email Signup" is turned on
3. Optionally, configure additional providers like Google, GitHub, etc.

## Step 5: Create an Admin User

1. In your Supabase dashboard, go to Authentication > Users
2. Create a new user with email and password
3. Go to SQL Editor and run the following query to make this user an admin:

```sql
UPDATE users 
SET is_admin = true 
WHERE id = 'your-user-id';
```

## Step 6: Understanding the Supabase SSR Integration

This project uses the latest `@supabase/ssr` package for server-side rendering support:

### Client Types

1. **Server Component Client** (`@/utils/supabase/server.ts`):
   - Used in Server Components to fetch data
   - Uses cookies for session management
   - Example: `import { createClient } from '@/utils/supabase/server'`

2. **Browser Client** (`@/utils/supabase/client.ts`):
   - Used in Client Components for interactive features
   - Example: `import { createClient } from '@/utils/supabase/client'`

3. **Middleware Client** (`@/utils/supabase/middleware.ts`):
   - Used in Next.js middleware for session refreshing
   - Runs on every request to ensure sessions stay valid

### Authentication Flow

1. User logs in using the client-side Supabase client
2. Session cookies are set automatically
3. Middleware refreshes the session on each request
4. Server components can access the session via cookies
5. The AuthContext provides the authentication state to client components

## Step 7: Run the Application

1. Install dependencies:
```
npm install
```

2. Start the development server:
```
npm run dev
```

3. Navigate to `http://localhost:3000` in your browser
4. Log in with the admin credentials you created

## Database Structure

The application uses three main tables:

### Transports
- Stores all transport schedule information
- Fields include client details, pickup/dropoff information, staff assignments, etc.

### Announcements
- Stores system announcements
- Fields include title, content, priority, etc.

### Users
- Extends Supabase Auth with additional fields
- Stores user roles (admin/regular)

## Row Level Security (RLS)

The database is configured with the following security policies:

- Transports: Only authenticated users can perform operations
- Announcements: Anyone can read, only authenticated users can modify
- Users: Only authenticated users can access user information

## Making Changes to the Schema

If you need to modify the database schema:

1. Create a new migration SQL file
2. Run it in the Supabase SQL Editor
3. Update the corresponding TypeScript interfaces in the application
4. Update the database service functions as needed 