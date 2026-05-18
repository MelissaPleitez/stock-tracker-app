import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma'; // Ensure this matches your project setup paths
import { env } from './env';

const prismaClient = () => {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  return new PrismaClient({ adapter });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClient>;
}

export const prisma = globalThis.prismaGlobal ?? prismaClient();

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
