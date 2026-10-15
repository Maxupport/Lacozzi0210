import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const username = process.env.INITIAL_OWNER_USERNAME?.trim().toLowerCase();
  const password = process.env.INITIAL_OWNER_PASSWORD;
  const displayName = process.env.INITIAL_OWNER_DISPLAY_NAME?.trim();

  const missing = [
    !username && 'INITIAL_OWNER_USERNAME',
    !password && 'INITIAL_OWNER_PASSWORD',
    !displayName && 'INITIAL_OWNER_DISPLAY_NAME',
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(`缺少必要環境變數：${missing.join(', ')}`);
  }

  if (!username || !password || !displayName) {
    throw new Error('初始管理員設定不完整');
  }

  if (password.length < 12) {
    throw new Error('INITIAL_OWNER_PASSWORD 至少需要 12 個字元');
  }

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
