import { prisma } from '@/lib/db/prisma';
import type { User } from '@supabase/supabase-js';

/**
 * Ensures a user exists in the database.
 * Creates the user if they don't exist (from Supabase Auth).
 * This solves foreign key constraint errors when creating related records.
 */
export async function ensureUserExists(user: User): Promise<void> {
  await prisma.user.upsert({
    where: { id: user.id },
    update: {}, // Don't update anything if user exists
    create: {
      id: user.id,
      email: user.email!,
    },
  });
}
