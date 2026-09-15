import { neon } from '@neondatabase/serverless'

const connectionString =
  process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? process.env.DATABASE_URL_UNPOOLED

if (!connectionString) {
  throw new Error(
    'Missing DATABASE_URL (or POSTGRES_URL) environment variable. Connect a Postgres database to this Vercel project.',
  )
}

export const sql = neon(connectionString)

let schemaReady: Promise<void> | null = null

export function ensureSchema(): Promise<void> {
  if (!schemaReady) schemaReady = migrate()
  return schemaReady
}

async function migrate() {
  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      gender TEXT NOT NULL,
      goal TEXT NOT NULL,
      weight_kg DOUBLE PRECISION NOT NULL,
      height_cm DOUBLE PRECISION NOT NULL,
      age INTEGER NOT NULL,
      activity_level TEXT NOT NULL,
      subscription_tier TEXT NOT NULL DEFAULT 'free',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS weight_entries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      kg DOUBLE PRECISION NOT NULL,
      logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS food_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      food_id TEXT NOT NULL,
      grams DOUBLE PRECISION NOT NULL,
      meal TEXT NOT NULL,
      logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS water_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ml INTEGER NOT NULL,
      logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS completed_workouts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      workout_id TEXT NOT NULL,
      duration_min INTEGER NOT NULL,
      calories INTEGER NOT NULL,
      completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS personal_records (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      exercise_name_en TEXT NOT NULL,
      exercise_name_ar TEXT NOT NULL,
      value TEXT NOT NULL,
      logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS rate_limit_hits (
      id BIGSERIAL PRIMARY KEY,
      bucket_key TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS rate_limit_hits_key_time ON rate_limit_hits (bucket_key, created_at)`

  await sql`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
}
