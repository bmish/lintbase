import { prisma } from '../server/db';

export function fixAnyDatesInObject(object: object): object {
  return Object.fromEntries(
    Object.entries(object || {}).map(([key, value]) => {
      if (value instanceof Date) {
        return [key, value.toISOString()]; // Since DataTime can't be serialized by next.
      }

      if (Array.isArray(value)) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return [key, value.map((item) => fixAnyDatesInObject(item))];
      }

      if (typeof value === 'object' && value !== null) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return [key, fixAnyDatesInObject(value)];
      }

      return [key, value];
    })
  );
}

/**
 * https://www.prisma.io/docs/concepts/components/prisma-client/crud#deleting-all-data-with-raw-sql--truncate
 */
export async function deleteAllData() {
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ');

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  } catch (error) {
    console.log({ error }); // eslint-disable-line no-console
  }
}
