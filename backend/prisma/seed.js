const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create some initial users
  const user1 = await prisma.user.upsert({
    where: { username: 'alex_test' },
    update: {},
    create: {
      tenantId: 'CAMPUS_01',
      username: 'alex_test',
      fullName: 'Alex Testing',
      isVerified: true,
      energy: 100,
      points: 500,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { username: 'sam_test' },
    update: {},
    create: {
      tenantId: 'CAMPUS_01',
      username: 'sam_test',
      fullName: 'Sam Testing',
      isVerified: true,
      energy: 100,
      points: 200,
    },
  });

  // Create a default campus event
  const event = await prisma.campusEvent.create({
    data: {
      tenantId: 'CAMPUS_01',
      title: 'Freshers Welcome Party',
      description: 'The ultimate welcome party for the new batch!',
      latitude: 28.7041,
      longitude: 77.1025,
      locationName: 'Main Campus Block',
      radiusMeters: 500,
      startTime: new Date(),
      endTime: new Date(new Date().getTime() + 4 * 60 * 60 * 1000), // 4 hours from now
      energyReward: 10,
      qrSecret: 'SECRET_123',
    }
  });

  console.log('Database seeded successfully!');
  console.log({ user1, user2, event });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
