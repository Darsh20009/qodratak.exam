import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Database is now optional - app can run without it
let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

// Build connection string with port if needed
let connectionString = process.env.DATABASE_URL;
if (connectionString && process.env.PGPORT && !connectionString.includes(':' + process.env.PGPORT)) {
  // Add port to connection string if missing
  connectionString = connectionString.replace(
    /postgresql:\/\/([^@]+)@([^/]+)\//,
    `postgresql://$1@$2:${process.env.PGPORT}/`
  );
  console.log('Added port to DATABASE_URL');
}

if (connectionString) {
  console.log('Database found - using PostgreSQL for persistence');
  try {
    pool = new Pool({ 
      connectionString: connectionString,
      // Disable SSL verification in development
      ssl: process.env.NODE_ENV === 'development' ? false : { rejectUnauthorized: false }
    });
    db = drizzle(pool, { schema });
    console.log('✅ PostgreSQL connection configured successfully');
  } catch (error) {
    console.error('❌ Error configuring PostgreSQL:', error);
    pool = null;
    db = null;
  }
} else {
  console.log('No database configured - using in-memory storage');
}

export { pool, db };