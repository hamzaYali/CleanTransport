# Transport Dashboard

This is a transportation management dashboard built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui components, using Supabase for authentication and data persistence.

## Features

- User authentication and authorization
- Schedule management for transportation services
- Staff assignment and tracking
- Client information management
- Announcements system
- Responsive design for all devices
- Database-backed persistence with Supabase

## Supabase Integration

This project uses Supabase for authentication and database functionality:
- User authentication with email/password
- PostgreSQL database for data storage
- Row-level security for data protection
- Real-time updates (optional)

### Data Model

The application uses the following database tables:
- `profiles`: Extended user information
- `transports`: Transportation schedule records
- `announcements`: System announcements

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a project in Supabase (https://supabase.com)
4. Run the SQL migrations in `src/lib/migrations` in your Supabase SQL editor
5. Create a `.env.local` file with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
6. Start the development server:
   ```
   npm run dev
   ```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Data Structure

The application maintains the following data structures in localStorage:

- `transports`: List of all transport records
- `announcements`: System announcements
- `lastAnnouncementView`: Timestamp for tracking unread announcements

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deployment

The application can be deployed to any static hosting service since it doesn't require a backend server.

Check out [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
