import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  serial,
  integer,
  decimal,
  pgEnum,
  time,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'client']);
export const appointmentStatusEnum = pgEnum('appointment_status', [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
]);
export const locationTypeEnum = pgEnum('location_type', ['mobile', 'virtual']);
export const invoiceStatusEnum = pgEnum('invoice_status', [
  'draft',
  'sent',
  'paid',
  'cancelled',
]);
export const leadStatusEnum = pgEnum('lead_status', [
  'new',
  'contacted',
  'qualified',
  'converted',
  'lost',
]);

// Users table
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }),
    role: userRoleEnum('role').notNull().default('client'),
    passwordHash: text('password_hash'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('users_email_idx').on(table.email),
    index('users_role_idx').on(table.role),
  ]
);

// Sessions table
export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('sessions_user_id_idx').on(table.userId),
    index('sessions_token_idx').on(table.token),
    index('sessions_expires_at_idx').on(table.expiresAt),
  ]
);

// Magic links table
export const magicLinks = pgTable(
  'magic_links',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    used: boolean('used').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('magic_links_email_idx').on(table.email),
    index('magic_links_token_idx').on(table.token),
  ]
);

// Services table
export const services = pgTable(
  'services',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    durationMins: integer('duration_mins').notNull(),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    category: varchar('category', { length: 100 }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('services_category_idx').on(table.category),
    index('services_is_active_idx').on(table.isActive),
  ]
);

// Packages table
export const packages = pgTable(
  'packages',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    sessionCount: integer('session_count').notNull(),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    validityDays: integer('validity_days').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('packages_is_active_idx').on(table.isActive)]
);

// Availability table
export const availability = pgTable(
  'availability',
  {
    id: serial('id').primaryKey(),
    dayOfWeek: integer('day_of_week').notNull(), // 0-6 (Sunday-Saturday)
    startTime: time('start_time').notNull(),
    endTime: time('end_time').notNull(),
    isActive: boolean('is_active').notNull().default(true),
  },
  (table) => [
    index('availability_day_of_week_idx').on(table.dayOfWeek),
    index('availability_is_active_idx').on(table.isActive),
  ]
);

// Blocked times table
export const blockedTimes = pgTable(
  'blocked_times',
  {
    id: serial('id').primaryKey(),
    startDatetime: timestamp('start_datetime').notNull(),
    endDatetime: timestamp('end_datetime').notNull(),
    reason: text('reason'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('blocked_times_start_datetime_idx').on(table.startDatetime),
    index('blocked_times_end_datetime_idx').on(table.endDatetime),
  ]
);

// Appointments table
export const appointments = pgTable(
  'appointments',
  {
    id: serial('id').primaryKey(),
    clientId: uuid('client_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    serviceId: integer('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'restrict' }),
    scheduledAt: timestamp('scheduled_at').notNull(),
    durationMins: integer('duration_mins').notNull(),
    status: appointmentStatusEnum('status').notNull().default('pending'),
    locationType: locationTypeEnum('location_type').notNull(),
    locationAddress: text('location_address'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('appointments_client_id_idx').on(table.clientId),
    index('appointments_service_id_idx').on(table.serviceId),
    index('appointments_scheduled_at_idx').on(table.scheduledAt),
    index('appointments_status_idx').on(table.status),
  ]
);

// Client packages table
export const clientPackages = pgTable(
  'client_packages',
  {
    id: serial('id').primaryKey(),
    clientId: uuid('client_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    packageId: integer('package_id')
      .notNull()
      .references(() => packages.id, { onDelete: 'restrict' }),
    remainingSessions: integer('remaining_sessions').notNull(),
    purchasedAt: timestamp('purchased_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at').notNull(),
  },
  (table) => [
    index('client_packages_client_id_idx').on(table.clientId),
    index('client_packages_package_id_idx').on(table.packageId),
    index('client_packages_expires_at_idx').on(table.expiresAt),
  ]
);

// Invoices table
export const invoices = pgTable(
  'invoices',
  {
    id: serial('id').primaryKey(),
    clientId: uuid('client_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    status: invoiceStatusEnum('status').notNull().default('draft'),
    stripeInvoiceId: varchar('stripe_invoice_id', { length: 255 }),
    dueDate: timestamp('due_date'),
    paidAt: timestamp('paid_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('invoices_client_id_idx').on(table.clientId),
    index('invoices_status_idx').on(table.status),
    index('invoices_stripe_invoice_id_idx').on(table.stripeInvoiceId),
  ]
);

// Payments table
export const payments = pgTable(
  'payments',
  {
    id: serial('id').primaryKey(),
    invoiceId: integer('invoice_id')
      .notNull()
      .references(() => invoices.id, { onDelete: 'cascade' }),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    method: varchar('method', { length: 50 }),
    stripePaymentId: varchar('stripe_payment_id', { length: 255 }),
    paidAt: timestamp('paid_at').defaultNow().notNull(),
  },
  (table) => [
    index('payments_invoice_id_idx').on(table.invoiceId),
    index('payments_stripe_payment_id_idx').on(table.stripePaymentId),
  ]
);

// Leads table
export const leads = pgTable(
  'leads',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 20 }),
    source: varchar('source', { length: 100 }),
    status: leadStatusEnum('status').notNull().default('new'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('leads_email_idx').on(table.email),
    index('leads_status_idx').on(table.status),
    index('leads_source_idx').on(table.source),
  ]
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  appointments: many(appointments),
  clientPackages: many(clientPackages),
  invoices: many(invoices),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const servicesRelations = relations(services, ({ many }) => ({
  appointments: many(appointments),
}));

export const packagesRelations = relations(packages, ({ many }) => ({
  clientPackages: many(clientPackages),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  client: one(users, {
    fields: [appointments.clientId],
    references: [users.id],
  }),
  service: one(services, {
    fields: [appointments.serviceId],
    references: [services.id],
  }),
}));

export const clientPackagesRelations = relations(clientPackages, ({ one }) => ({
  client: one(users, {
    fields: [clientPackages.clientId],
    references: [users.id],
  }),
  package: one(packages, {
    fields: [clientPackages.packageId],
    references: [packages.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  client: one(users, {
    fields: [invoices.clientId],
    references: [users.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type MagicLink = typeof magicLinks.$inferSelect;
export type NewMagicLink = typeof magicLinks.$inferInsert;

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;

export type Package = typeof packages.$inferSelect;
export type NewPackage = typeof packages.$inferInsert;

export type Availability = typeof availability.$inferSelect;
export type NewAvailability = typeof availability.$inferInsert;

export type BlockedTime = typeof blockedTimes.$inferSelect;
export type NewBlockedTime = typeof blockedTimes.$inferInsert;

export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;

export type ClientPackage = typeof clientPackages.$inferSelect;
export type NewClientPackage = typeof clientPackages.$inferInsert;

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
