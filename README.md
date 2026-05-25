# Store

A secure web store built with Next.js 16, Prisma 7, and TypeScript.

## Stack

- **Framework**: Next.js 16.2 (App Router, proxy.ts, Server Actions)
- **Database**: SQLite via Prisma 7 (swappable to PostgreSQL)
- **Auth**: JWT sessions (jose) + bcrypt password hashing
- **Validation**: Zod 4
- **Styling**: Tailwind CSS v4

## Features

- Signup / login with Server Actions and `useActionState`
- JWT session management (HttpOnly, Secure, SameSite cookies)
- Protected routes via proxy.ts (`/account`, `/checkout`)
- CSP, rate limiting, SSRF protection, request validation
- File upload with type/size validation
- Audit logging for auth and checkout events

## Prerequisites

- Node.js 22.5+ (built-in `node:sqlite` support)
- npm

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Generate Prisma client and create the database
npm run db:push

# Seed sample data
npm run db:seed

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production

```bash
# Generate a session secret (32+ bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Set SESSION_SECRET in .env

# Build
npm run build

# Start
npm start
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Generate Prisma client + build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Run database seed |
