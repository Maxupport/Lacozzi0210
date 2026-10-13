import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const username = (process.env.INITIAL_OWNER_USERNAME || 'lacozzi0210@gmail.com').trim().toLowerCase();
  const password = process.env.INITIAL_OWNER_PASSWORD || 'hatepop0210';
  const displayName = process.env.INITIAL_OWNER_DISPLAY_NAME || 'Max (管理員)';

  console.log(`[Seed] Checking for initial owner: ${username}`);

  const existing = await prisma.user.findUnique({
    where: { username },
  });

  if (existing) {
    console.log(`[Seed] Owner account ${username} already exists (ID: ${existing.id}).`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const created = await prisma.user.create({
    data: {
      username,
      displayName,
      passwordHash,
      role: 'OWNER',
      isActive: true,
    },
  });

  console.log(`[Seed] ✅ Created initial owner: ${created.username} (${created.displayName})`);
}

main()
  .catch((e) => {
    console.error('[Seed] Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
