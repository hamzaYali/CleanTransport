# Transport Dashboard

This is a transportation management dashboard built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui components, using Supabase as the backend.

## Features

- Schedule management for transportation services
- Staff assignment and tracking
- Client information management
- Announcements system
- User authentication and authorization
- Responsive design for all devices

## Supabase Integration

This project uses the latest Supabase SSR (Server-Side Rendering) approach for authentication and data management.

### Authentication Flow

The application handles authentication using the following components:

- `@supabase/ssr` for server and client-side Supabase clients
- Middleware for session refreshing
- AuthContext for client-side authentication state management

### Server vs Client Components

- **Server Components**: Use the server-side Supabase client for data fetching
- **Client Components**: Use the browser-side Supabase client for interactive features

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env.local` file with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Start the development server:
   ```
   npm run dev
   ```

## Database Setup

See the `SUPABASE.md` file for detailed instructions on setting up your Supabase database.

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


## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.




Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
