import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema';
import { services, packages, availability } from '../db/schema';

// Load environment variables from .env file (for standalone script execution)
function loadEnv() {
  const envPaths = [
    resolve(process.cwd(), '.env.local'),
    resolve(process.cwd(), '.env'),
  ];

  for (const envPath of envPaths) {
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, 'utf-8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            let value = valueParts.join('=');
            // Remove surrounding quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
              value = value.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = value;
            }
          }
        }
      });
      console.log(`Loaded environment from: ${envPath}`);
      break;
    }
  }
}

loadEnv();

if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is not set.');
  console.error('Please ensure you have a .env or .env.local file with DATABASE_URL defined.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

// Seed data definitions
const servicesData = [
  {
    name: 'Personal Training',
    description: 'One-on-one personal training session tailored to your fitness goals.',
    durationMins: 60,
    price: '85.00',
    category: 'Fitness',
    isActive: true,
  },
  {
    name: 'Golf Fitness',
    description: 'Specialized fitness training to improve your golf performance.',
    durationMins: 60,
    price: '95.00',
    category: 'Fitness',
    isActive: true,
  },
  {
    name: 'Dry Needling',
    description: 'Therapeutic dry needling treatment for muscle tension and pain relief.',
    durationMins: 45,
    price: '75.00',
    category: 'Therapeutic',
    isActive: true,
  },
  {
    name: 'IASTM',
    description: 'Instrument-Assisted Soft Tissue Mobilization for muscle recovery.',
    durationMins: 30,
    price: '65.00',
    category: 'Therapeutic',
    isActive: true,
  },
  {
    name: 'Cupping Therapy',
    description: 'Traditional cupping therapy for improved circulation and muscle relief.',
    durationMins: 30,
    price: '55.00',
    category: 'Therapeutic',
    isActive: true,
  },
  {
    name: 'Assisted Stretching',
    description: 'Professional assisted stretching session for improved flexibility.',
    durationMins: 30,
    price: '50.00',
    category: 'Therapeutic',
    isActive: true,
  },
];

const packagesData = [
  {
    name: '5 Session Pack',
    description: 'Package of 5 training sessions at a discounted rate.',
    sessionCount: 5,
    price: '375.00',
    validityDays: 90,
    isActive: true,
  },
  {
    name: '10 Session Pack',
    description: 'Package of 10 training sessions with significant savings.',
    sessionCount: 10,
    price: '700.00',
    validityDays: 180,
    isActive: true,
  },
  {
    name: 'Monthly Unlimited',
    description: 'Unlimited sessions for one month - best value for committed clients.',
    sessionCount: 30,
    price: '599.00',
    validityDays: 30,
    isActive: true,
  },
];

// dayOfWeek: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
const availabilityData = [
  // Monday-Friday: 8:00 AM - 6:00 PM
  { dayOfWeek: 1, startTime: '08:00:00', endTime: '18:00:00', isActive: true },
  { dayOfWeek: 2, startTime: '08:00:00', endTime: '18:00:00', isActive: true },
  { dayOfWeek: 3, startTime: '08:00:00', endTime: '18:00:00', isActive: true },
  { dayOfWeek: 4, startTime: '08:00:00', endTime: '18:00:00', isActive: true },
  { dayOfWeek: 5, startTime: '08:00:00', endTime: '18:00:00', isActive: true },
  // Saturday: 9:00 AM - 2:00 PM
  { dayOfWeek: 6, startTime: '09:00:00', endTime: '14:00:00', isActive: true },
  // Sunday: closed (no entry or inactive entry)
  { dayOfWeek: 0, startTime: '00:00:00', endTime: '00:00:00', isActive: false },
];

async function seedServices() {
  console.log('Seeding services...');

  for (const serviceData of servicesData) {
    // Check if service with same name already exists
    const existing = await db
      .select()
      .from(services)
      .where(eq(services.name, serviceData.name))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  Service "${serviceData.name}" already exists, skipping...`);
    } else {
      await db.insert(services).values(serviceData);
      console.log(`  Created service: ${serviceData.name}`);
    }
  }
}

async function seedPackages() {
  console.log('Seeding packages...');

  for (const packageData of packagesData) {
    // Check if package with same name already exists
    const existing = await db
      .select()
      .from(packages)
      .where(eq(packages.name, packageData.name))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  Package "${packageData.name}" already exists, skipping...`);
    } else {
      await db.insert(packages).values(packageData);
      console.log(`  Created package: ${packageData.name}`);
    }
  }
}

async function seedAvailability() {
  console.log('Seeding availability...');

  for (const availData of availabilityData) {
    // Check if availability for this day already exists
    const existing = await db
      .select()
      .from(availability)
      .where(eq(availability.dayOfWeek, availData.dayOfWeek))
      .limit(1);

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[availData.dayOfWeek];

    if (existing.length > 0) {
      console.log(`  Availability for ${dayName} already exists, skipping...`);
    } else {
      await db.insert(availability).values(availData);
      if (availData.isActive) {
        console.log(`  Created availability: ${dayName} ${availData.startTime} - ${availData.endTime}`);
      } else {
        console.log(`  Created availability: ${dayName} (closed)`);
      }
    }
  }
}

async function main() {
  console.log('Starting seed script...\n');

  try {
    await seedServices();
    console.log('');
    await seedPackages();
    console.log('');
    await seedAvailability();
    console.log('\nSeed completed successfully!');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

main();
