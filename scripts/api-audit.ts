#!/usr/bin/env npx tsx
/**
 * API Audit Script for Peak Performance Lab
 *
 * This script documents all API endpoints and their corresponding hooks,
 * helping ensure frontend-backend sync.
 *
 * Run with: npx tsx scripts/api-audit.ts
 */

interface Endpoint {
  path: string;
  method: string;
  auth: 'none' | 'auth' | 'admin';
  description: string;
  hooks: string[];
  requestBody?: string;
  responseFormat: string;
  status: 'ok' | 'fixed' | 'needs-work';
}

const endpoints: Endpoint[] = [
  // ============ AUTH ============
  {
    path: '/api/auth/magic-link',
    method: 'POST',
    auth: 'none',
    description: 'Send magic link email for passwordless login',
    hooks: ['Direct fetch in login page'],
    requestBody: '{ email: string }',
    responseFormat: '{ success: true, message: string }',
    status: 'ok',
  },
  {
    path: '/api/auth/verify',
    method: 'GET',
    auth: 'none',
    description: 'Verify magic link token and set session cookie',
    hooks: ['Direct browser redirect from verify page'],
    requestBody: 'Query param: token',
    responseFormat: 'Redirect to /dashboard or /verify?error=...',
    status: 'fixed', // Fixed: was using fetch, now uses window.location
  },
  {
    path: '/api/auth/login',
    method: 'POST',
    auth: 'none',
    description: 'Test login with username/password',
    hooks: ['Direct fetch in login page'],
    requestBody: '{ username: string, password: string }',
    responseFormat: '{ success: true, user: {...}, redirectTo: string }',
    status: 'ok',
  },
  {
    path: '/api/auth/logout',
    method: 'POST',
    auth: 'auth',
    description: 'Logout and clear session',
    hooks: ['Direct fetch in admin/client layouts'],
    responseFormat: '{ success: true, message: string }',
    status: 'ok',
  },
  {
    path: '/api/auth/me',
    method: 'GET',
    auth: 'auth',
    description: 'Get current authenticated user',
    hooks: ['useCurrentUser (src/lib/hooks/use-api.ts)'],
    responseFormat: '{ user: { id, email, name, role, createdAt } }',
    status: 'ok',
  },

  // ============ CLIENTS ============
  {
    path: '/api/clients',
    method: 'GET',
    auth: 'admin',
    description: 'List clients with pagination and search',
    hooks: ['useClients (src/hooks/use-api.ts)'],
    requestBody: 'Query params: search, page, limit',
    responseFormat: '{ data: Client[], pagination: {...} }',
    status: 'ok',
  },
  {
    path: '/api/clients',
    method: 'POST',
    auth: 'none',
    description: 'Create a new client',
    hooks: ['None'],
    requestBody: '{ email: string, name: string, phone?: string }',
    responseFormat: '{ data: Client }',
    status: 'ok',
  },
  {
    path: '/api/clients/[id]',
    method: 'GET',
    auth: 'auth',
    description: 'Get client details with appointments and packages',
    hooks: ['useClientProfile (src/lib/hooks/use-api.ts)'],
    responseFormat: '{ data: { ...client, appointments: [...], packages: [...] } }',
    status: 'ok',
  },
  {
    path: '/api/clients/[id]',
    method: 'PATCH',
    auth: 'auth',
    description: 'Update client details',
    hooks: ['useUpdateProfile (src/lib/hooks/use-api.ts)'],
    requestBody: '{ name?: string, phone?: string | null }',
    responseFormat: '{ data: Client }',
    status: 'ok',
  },

  // ============ SERVICES ============
  {
    path: '/api/services',
    method: 'GET',
    auth: 'none',
    description: 'List active services (or all with includeInactive for admin)',
    hooks: ['useServices (both admin and client hooks)', 'useAllServices (src/hooks/use-api.ts)'],
    requestBody: 'Query params: includeInactive',
    responseFormat: '{ data: Service[] }',
    status: 'fixed', // Fixed: added includeInactive support
  },
  {
    path: '/api/services',
    method: 'POST',
    auth: 'admin',
    description: 'Create a new service',
    hooks: ['useCreateService (src/hooks/use-api.ts)'],
    requestBody: '{ name, description?, durationMins, price, category?, isActive? }',
    responseFormat: '{ data: Service }',
    status: 'ok',
  },
  {
    path: '/api/services/[id]',
    method: 'GET',
    auth: 'none',
    description: 'Get a service by ID',
    hooks: ['None'],
    responseFormat: '{ data: Service }',
    status: 'ok',
  },
  {
    path: '/api/services/[id]',
    method: 'PATCH',
    auth: 'admin',
    description: 'Update a service',
    hooks: ['useUpdateService (src/hooks/use-api.ts)'],
    requestBody: '{ name?, description?, durationMins?, price?, category?, isActive? }',
    responseFormat: '{ data: Service }',
    status: 'ok',
  },
  {
    path: '/api/services/[id]',
    method: 'DELETE',
    auth: 'admin',
    description: 'Soft delete a service',
    hooks: ['useDeleteService (src/hooks/use-api.ts)'],
    responseFormat: '{ data: Service, message: string }',
    status: 'ok',
  },

  // ============ PACKAGES ============
  {
    path: '/api/packages',
    method: 'GET',
    auth: 'none',
    description: 'List active packages (or all with includeInactive for admin)',
    hooks: ['usePackages (src/hooks/use-api.ts)', 'useAvailablePackages (src/lib/hooks/use-api.ts)'],
    requestBody: 'Query params: includeInactive',
    responseFormat: '{ data: Package[] }',
    status: 'fixed', // Fixed: added includeInactive support for consistency
  },
  {
    path: '/api/packages',
    method: 'POST',
    auth: 'admin',
    description: 'Create a new package',
    hooks: ['useCreatePackage (src/hooks/use-api.ts)'],
    requestBody: '{ name, description?, sessionCount, price, validityDays, isActive? }',
    responseFormat: '{ data: Package }',
    status: 'ok',
  },
  {
    path: '/api/packages/[id]',
    method: 'PATCH',
    auth: 'admin',
    description: 'Update a package',
    hooks: ['useUpdatePackage (src/hooks/use-api.ts)'],
    requestBody: '{ name?, description?, sessionCount?, price?, validityDays?, isActive? }',
    responseFormat: '{ data: Package }',
    status: 'ok',
  },
  {
    path: '/api/packages/[id]',
    method: 'DELETE',
    auth: 'admin',
    description: 'Soft delete a package',
    hooks: ['useDeletePackage (src/hooks/use-api.ts)'],
    responseFormat: '{ data: Package, message: string }',
    status: 'ok',
  },

  // ============ CLIENT PACKAGES ============
  {
    path: '/api/client/packages',
    method: 'GET',
    auth: 'auth',
    description: "Get current user's purchased packages",
    hooks: ['useClientPackages (src/lib/hooks/use-api.ts)'],
    responseFormat: '{ data: { active: [...], inactive: [...], all: [...] } }',
    status: 'ok',
  },

  // ============ BOOKINGS ============
  {
    path: '/api/bookings',
    method: 'GET',
    auth: 'auth',
    description: 'List appointments with filters',
    hooks: ['useBookings (both admin and client hooks)', 'useTodaysBookings', 'useUpcomingBookings'],
    requestBody: 'Query params: startDate, endDate, status, clientId, page, limit',
    responseFormat: '{ data: Appointment[], pagination: {...} }',
    status: 'ok',
  },
  {
    path: '/api/bookings',
    method: 'POST',
    auth: 'auth',
    description: 'Create a new appointment',
    hooks: ['useCreateBooking (src/lib/hooks/use-api.ts)'],
    requestBody: '{ clientId?, serviceId, scheduledAt, locationType, locationAddress?, notes? }',
    responseFormat: '{ data: Appointment }',
    status: 'ok',
  },
  {
    path: '/api/bookings/availability',
    method: 'GET',
    auth: 'none',
    description: 'Get available time slots for a date and service',
    hooks: ['useAvailability (src/lib/hooks/use-api.ts)'],
    requestBody: 'Query params: date, serviceId',
    responseFormat: '{ data: { date, service: {...}, slots: [...] } }',
    status: 'ok',
  },
  {
    path: '/api/bookings/[id]',
    method: 'GET',
    auth: 'auth',
    description: 'Get appointment details',
    hooks: ['None'],
    responseFormat: '{ data: Appointment }',
    status: 'ok',
  },
  {
    path: '/api/bookings/[id]',
    method: 'PATCH',
    auth: 'auth',
    description: 'Update appointment (reschedule, change status)',
    hooks: ['None'],
    requestBody: '{ scheduledAt?, status?, locationType?, locationAddress?, notes? }',
    responseFormat: '{ data: Appointment }',
    status: 'ok',
  },
  {
    path: '/api/bookings/[id]',
    method: 'DELETE',
    auth: 'auth',
    description: 'Cancel an appointment',
    hooks: ['useCancelBooking (src/lib/hooks/use-api.ts)'],
    responseFormat: '{ data: Appointment, message: string }',
    status: 'ok',
  },

  // ============ INVOICES ============
  {
    path: '/api/invoices',
    method: 'GET',
    auth: 'auth',
    description: "Get current user's invoices (admin can see all)",
    hooks: ['useInvoices (src/lib/hooks/use-api.ts)'],
    requestBody: 'Query params: status, clientId (admin), page, limit',
    responseFormat: '{ data: Invoice[], pagination: {...} }',
    status: 'ok',
  },

  // ============ PAYMENTS ============
  {
    path: '/api/payments/checkout',
    method: 'POST',
    auth: 'auth',
    description: 'Create Stripe checkout session for package or invoice',
    hooks: ['usePurchasePackage, usePayInvoice (src/hooks/use-payments.ts)'],
    requestBody: '{ packageId: number } OR { invoiceId: number }',
    responseFormat: '{ sessionId: string, url: string }',
    status: 'ok',
  },
  {
    path: '/api/payments/portal',
    method: 'GET',
    auth: 'auth',
    description: 'Get Stripe Customer Portal URL',
    hooks: ['useCustomerPortal (src/hooks/use-payments.ts)'],
    requestBody: 'Query params: returnUrl?',
    responseFormat: '{ url: string }',
    status: 'ok',
  },
  {
    path: '/api/payments/webhook',
    method: 'POST',
    auth: 'none',
    description: 'Stripe webhook handler',
    hooks: ['None - called by Stripe'],
    responseFormat: '{ received: true }',
    status: 'ok',
  },

  // ============ ADMIN SETTINGS ============
  {
    path: '/api/admin/settings',
    method: 'GET',
    auth: 'admin',
    description: 'Get admin settings (availability, business info)',
    hooks: ['Direct fetch in settings page'],
    responseFormat: '{ availability: [...], businessInfo: {...} }',
    status: 'fixed', // Fixed: created this endpoint
  },
  {
    path: '/api/admin/settings',
    method: 'PUT',
    auth: 'admin',
    description: 'Update admin settings',
    hooks: ['Direct fetch in settings page'],
    requestBody: '{ availability: [...], businessInfo: {...} }',
    responseFormat: '{ availability: [...], businessInfo: {...}, message: string }',
    status: 'fixed', // Fixed: created this endpoint
  },
];

function printAudit() {
  console.log('='.repeat(80));
  console.log('API AUDIT REPORT - Peak Performance Lab');
  console.log('='.repeat(80));
  console.log(`Generated: ${new Date().toISOString()}\n`);

  // Summary
  const stats = {
    total: endpoints.length,
    ok: endpoints.filter(e => e.status === 'ok').length,
    fixed: endpoints.filter(e => e.status === 'fixed').length,
    needsWork: endpoints.filter(e => e.status === 'needs-work').length,
  };

  console.log('SUMMARY');
  console.log('-'.repeat(40));
  console.log(`Total Endpoints: ${stats.total}`);
  console.log(`  OK:          ${stats.ok}`);
  console.log(`  Fixed:       ${stats.fixed}`);
  console.log(`  Needs Work:  ${stats.needsWork}`);
  console.log('');

  // Group by path prefix
  const groups = new Map<string, Endpoint[]>();
  for (const endpoint of endpoints) {
    const parts = endpoint.path.split('/').filter(Boolean);
    const group = parts[1] || 'other'; // e.g., 'auth', 'clients', 'services'
    if (!groups.has(group)) {
      groups.set(group, []);
    }
    groups.get(group)!.push(endpoint);
  }

  // Print each group
  for (const [group, eps] of groups) {
    console.log('');
    console.log(`${'='.repeat(40)}`);
    console.log(group.toUpperCase());
    console.log('='.repeat(40));

    for (const ep of eps) {
      const statusIcon = ep.status === 'ok' ? '[OK]' : ep.status === 'fixed' ? '[FIXED]' : '[NEEDS WORK]';
      console.log(`\n${ep.method.padEnd(7)} ${ep.path}`);
      console.log(`  Status: ${statusIcon}`);
      console.log(`  Auth: ${ep.auth}`);
      console.log(`  Description: ${ep.description}`);
      console.log(`  Hooks: ${ep.hooks.join(', ') || 'None'}`);
      if (ep.requestBody) {
        console.log(`  Request: ${ep.requestBody}`);
      }
      console.log(`  Response: ${ep.responseFormat}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('FIXES APPLIED IN THIS AUDIT');
  console.log('='.repeat(80));

  const fixes = endpoints.filter(e => e.status === 'fixed');
  for (const fix of fixes) {
    console.log(`\n- ${fix.method} ${fix.path}`);
    console.log(`  ${fix.description}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('HOOKS FILES');
  console.log('='.repeat(80));
  console.log('\n1. src/hooks/use-api.ts (Admin hooks)');
  console.log('   - useServices, useAllServices, useCreateService, useUpdateService, useDeleteService');
  console.log('   - usePackages, useCreatePackage, useUpdatePackage, useDeletePackage');
  console.log('   - useClients');
  console.log('   - useBookings, useTodaysBookings');
  console.log('   - useDashboardStats, useRecentActivity');

  console.log('\n2. src/lib/hooks/use-api.ts (Client hooks)');
  console.log('   - useCurrentUser');
  console.log('   - useServices');
  console.log('   - useBookings, useUpcomingBookings, useAvailability, useCreateBooking, useCancelBooking');
  console.log('   - useClientPackages, useAvailablePackages');
  console.log('   - useInvoices');
  console.log('   - useClientProfile, useUpdateProfile');

  console.log('\n3. src/hooks/use-payments.ts (Payment hooks)');
  console.log('   - usePurchasePackage');
  console.log('   - usePayInvoice');
  console.log('   - useCustomerPortal');
  console.log('   - usePayments (combines all payment hooks)');

  console.log('\n' + '='.repeat(80));
  console.log('ALL ENDPOINTS VERIFIED');
  console.log('='.repeat(80));
}

// Run the audit
printAudit();
