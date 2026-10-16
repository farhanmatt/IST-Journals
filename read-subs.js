const { PrismaClient } = require('./src/generated/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

async function main() {
  const url = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_3RFlc2iMwKvk@ep-still-star-azoztacj-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require";
  const pool = new Pool({ connectionString: url, ssl: true });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const authorId = "cmv0kfi9w0003k8u1ms0dvdzj"; // Dummy author, wait I need a valid authorId. Let's find one.
    const user = await prisma.user.findFirst({ where: { roles: { some: { role: 'AUTHOR' } } } });
    if (!user) throw new Error("No author");

    const newSubmission = await prisma.submission.create({
      data: {
        title: "Test Draft",
        abstract: "Test abstract",
        keywords: "Test",
        sectionId: null,
        currentStep: 2,
        status: "DRAFT",
        authorId: user.id,
        submissionId: "JMAS-2026-0001",
      },
    });
    console.log("Created:", newSubmission);
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
