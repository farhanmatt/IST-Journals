import { PrismaClient } from '../generated/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const prismaClientSingleton = () => {
  const url = process.env.DATABASE_URL;

  // Handle Prisma Postgres (Accelerate) connection string
  if (url?.startsWith('prisma+postgres://')) {
    return new PrismaClient({ accelerateUrl: url });
  }

  // Handle standard PostgreSQL connection string using the pg driver adapter
  if (url) {
    // Explicitly enable SSL since the pg driver does not always parse sslmode=require from Neon URLs
    const pool = new Pool({ 
      connectionString: url,
      ssl: true,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  }

  return new PrismaClient();
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

globalForPrisma.prisma = prisma;


