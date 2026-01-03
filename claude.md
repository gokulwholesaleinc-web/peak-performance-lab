# Peak Performance Lab - Business Management System

## Project Overview
A modern business management platform for Peak Performance Lab, a mobile fitness/wellness practice in Chicago offering personal training, golf fitness, and therapeutic services (dry needling, IASTM, cupping, stretching, kinesio taping).

## Tech Stack
- **Frontend**: Next.js 14 (App Router) with React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes (single server on port 3000)
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Auth**: Magic link + session-based authentication
- **Payments**: Stripe (Checkout, Webhooks, Customer Portal)
- **Notifications**: Email (Resend/SendGrid), SMS (Twilio - future)

## Architecture
```
/app
  /(auth)          # Auth pages (login, magic-link)
  /(client)        # Client portal pages
  /(admin)         # Admin portal pages
  /api             # API routes
/components        # Shared React components
/lib               # Utilities, database, auth
/db                # Drizzle schema & migrations
```

## Core Modules
1. **Client Portal** - Booking, packages, invoices, profile
2. **Admin Portal** - Dashboard, calendar, clients, services, payments
3. **Booking System** - Availability, appointments, confirmations
4. **Payment System** - Stripe integration, packages, invoices

## Database Entities
- users, clients, services, packages
- availability, blocked_times, appointments
- invoices, payments, client_packages
- leads, follow_ups

---

## Development Guidelines

### 1. Feature Branches
Create feature branches named `<name_of_feature>/features` and merge before starting new features.
```bash
git checkout -b booking-system/features
# work on feature
git checkout main && git merge booking-system/features
```

### 2. DRY Code
Keep code DRY (Don't Repeat Yourself). Always search for related methods before creating new ones.
- Check `/lib` for existing utilities
- Check `/components` for existing UI components
- Use shared types from `/types`

### 3. Testing
ALL new endpoints and methods MUST have test cases that validate functionality with **NO MOCKING**.
- Use Vitest for unit/integration tests
- Test against real database (use test database)
- Place tests in `__tests__` folders or `.test.ts` files

### 4. Git Push
Always push on feature completion.
```bash
git add .
git commit -m "feat(module): detailed description of changes"
git push origin <branch-name>
```

### 5. KISS Principles
Follow KISS (Keep It Simple, Stupid) to avoid spaghetti code.
- Prefer simple solutions over clever ones
- Avoid premature optimization
- Break complex functions into smaller, testable units

### 6. Commit Messages
Keep them detailed. Follow conventional commits:
- `feat(scope): add new feature`
- `fix(scope): fix bug description`
- `refactor(scope): refactor description`
- `test(scope): add tests for feature`

### 7. No Unnecessary MD Files
Don't create unnecessary markdown files for commits/features. Use this claude.md for project documentation.

### 8. New Services
Always ask permission before adding services like Redis, Celery, external APIs, etc.

---

## API Endpoints Structure

### Auth
- `POST /api/auth/magic-link` - Send magic link
- `GET /api/auth/verify` - Verify magic link token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Clients
- `GET /api/clients` - List clients (admin)
- `GET /api/clients/:id` - Get client details
- `POST /api/clients` - Create client
- `PATCH /api/clients/:id` - Update client

### Services
- `GET /api/services` - List services
- `POST /api/services` - Create service (admin)
- `PATCH /api/services/:id` - Update service (admin)
- `DELETE /api/services/:id` - Delete service (admin)

### Packages
- `GET /api/packages` - List packages
- `POST /api/packages` - Create package (admin)
- `PATCH /api/packages/:id` - Update package (admin)

### Bookings
- `GET /api/bookings` - List bookings
- `GET /api/bookings/availability` - Get available slots
- `POST /api/bookings` - Create booking
- `PATCH /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

### Payments
- `POST /api/payments/checkout` - Create Stripe checkout
- `POST /api/payments/webhook` - Stripe webhook handler
- `GET /api/invoices` - List invoices
- `GET /api/invoices/:id` - Get invoice details

---

## Environment Variables
```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
RESEND_API_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Quick Commands
```bash
npm run dev          # Start dev server
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio
npm run test         # Run tests
npm run build        # Production build
```
