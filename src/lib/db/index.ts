import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { env } from '$env/dynamic/private'; // <--- Import dynamic environment variables
import * as schema from './schema';

// This function gets called by your API endpoints
export function getDb() {
  // Use the env variables from your newly created .env file
  const url = env.TURSO_DATABASE_URL;
  const token = env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error('TURSO_DATABASE_URL environment variable is not set');
  }

  const client = createClient({
    url: url,
    authToken: token // It's okay if this is empty for local file.db setups
  });

  return drizzle(client, { schema });
}