import { PrismaClient, UserType } from '@prisma/client';

const prisma = new PrismaClient();

async function seedUsageLimits() {
  console.log('Seeding usage limits...');

  // Default monthly limits for each user type
  const defaultLimits = [
    {
      userType: UserType.FREE,
      maxActivities: 100, // 100 activities per month
      includeFollowups: false,
    },
    {
      userType: UserType.PLUS,
      maxActivities: 500, // 500 activities per month
      includeFollowups: false,
    },
    {
      userType: UserType.ADMIN,
      maxActivities: 0, // 0 = Unlimited for admins
      includeFollowups: false,
    },
  ];

  for (const limit of defaultLimits) {
    const result = await prisma.usageLimitSettings.upsert({
      where: { userType: limit.userType },
      update: {}, // Don't update if exists
      create: limit,
    });
    const displayLimit = result.maxActivities === 0 ? 'Unlimited' : `${result.maxActivities}/month`;
    console.log(`✅ ${limit.userType}: ${displayLimit}`);
  }

  console.log('✅ Usage limits seeded successfully!');
}

seedUsageLimits()
  .catch((e) => {
    console.error('❌ Error seeding usage limits:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
