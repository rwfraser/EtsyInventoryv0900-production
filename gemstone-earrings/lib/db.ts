import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../drizzle/schema';

const connectionString = process.env.POSTGRES_PRISMA_URL!;

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
