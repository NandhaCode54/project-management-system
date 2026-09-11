const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      fullName: 'Demo User',
      email: 'demo@example.com',
      passwordHash,
      projects: {
        create: [
          {
            name: 'Website Redesign',
            description: 'Redesign the company website with a modern look',
            status: 'IN_PROGRESS',
            startDate: new Date('2026-09-01T00:00:00.000Z'),
            endDate: new Date('2026-10-15T00:00:00.000Z'),
            tasks: {
              create: [
                {
                  name: 'Design homepage mockup',
                  description: 'Create high-fidelity homepage mockups',
                  priority: 'HIGH',
                  status: 'COMPLETED',
                  dueDate: new Date('2026-09-10T00:00:00.000Z'),
                },
                {
                  name: 'Implement responsive layout',
                  description: 'Build the responsive grid and navigation',
                  priority: 'MEDIUM',
                  status: 'IN_PROGRESS',
                  dueDate: new Date('2026-09-20T00:00:00.000Z'),
                },
                {
                  name: 'Final QA pass',
                  description: 'Cross-browser and accessibility QA',
                  priority: 'LOW',
                  status: 'PENDING',
                  dueDate: new Date('2026-10-10T00:00:00.000Z'),
                },
              ],
            },
          },
          {
            name: 'Mobile App MVP',
            description: 'Launch the iOS/Android MVP',
            status: 'NOT_STARTED',
            startDate: new Date('2026-10-01T00:00:00.000Z'),
            endDate: new Date('2026-12-15T00:00:00.000Z'),
            tasks: {
              create: [
                {
                  name: 'Set up CI pipeline',
                  description: 'Configure automated builds and tests',
                  priority: 'MEDIUM',
                  status: 'PENDING',
                  dueDate: new Date('2026-10-05T00:00:00.000Z'),
                },
              ],
            },
          },
          {
            name: 'API Performance Tuning',
            description: 'Reduce p95 latency on core endpoints',
            status: 'COMPLETED',
            startDate: new Date('2026-08-01T00:00:00.000Z'),
            endDate: new Date('2026-08-28T00:00:00.000Z'),
            tasks: {
              create: [
                {
                  name: 'Profile slow queries',
                  description: 'Identify bottlenecks via profiling',
                  priority: 'HIGH',
                  status: 'COMPLETED',
                  dueDate: new Date('2026-08-10T00:00:00.000Z'),
                },
                {
                  name: 'Add query indexes',
                  description: 'Add missing indexes for hot paths',
                  priority: 'HIGH',
                  status: 'COMPLETED',
                  dueDate: new Date('2026-08-20T00:00:00.000Z'),
                },
              ],
            },
          },
        ],
      },
    },
    include: { projects: true },
  });

  console.log(`Seeded demo user: ${user.email} (password: password123)`);
  console.log(`  projects: ${user.projects.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });