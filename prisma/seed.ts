import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@snt.local' },
    update: {},
    create: {
      email: 'admin@snt.local',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      name: 'Администратор СНТ',
      isActive: true,
    },
  });

  console.log(`✅ Created admin user: ${admin.email}`);

  // Create member user
  const member = await prisma.user.upsert({
    where: { email: 'member@snt.local' },
    update: {},
    create: {
      email: 'member@snt.local',
      passwordHash: hashedPassword,
      role: 'MEMBER',
      name: 'Иван Иванов',
      isActive: true,
    },
  });

  console.log(`✅ Created member user: ${member.email}`);

  // Create member record
  const sntMember = await prisma.member.create({
    data: {
      userId: member.id,
      surname: 'Иванов',
      firstName: 'Иван',
      patronymic: 'Иванович',
      address: 'ул. Садовая, д. 1, кв. 1',
      snn: '123456',
    },
  });

  console.log(`✅ Created member record for: ${sntMember.surname} ${sntMember.firstName}`);

  // Create plots
  const plot1 = await prisma.plot.create({
    data: {
      number: '1',
      area: 6.0,
      address: 'ул. Садовая',
      cadastralNum: '50:01:001001:1',
      status: 'ACTIVE',
    },
  });

  const plot2 = await prisma.plot.create({
    data: {
      number: '2',
      area: 6.5,
      address: 'ул. Садовая',
      cadastralNum: '50:01:001001:2',
      status: 'ACTIVE',
    },
  });

  const plot3 = await prisma.plot.create({
    data: {
      number: '3',
      area: 5.5,
      address: 'ул. Центральная',
      cadastralNum: '50:01:001001:3',
      status: 'INACTIVE',
    },
  });

  console.log(`✅ Created ${3} plots`);

  // Create plot memberships
  await prisma.plotMembership.create({
    data: {
      plotId: plot1.id,
      memberId: sntMember.id,
      role: 'OWNER',
      share: 1.0,
    },
  });

  console.log(`✅ Created plot membership: ${sntMember.surname} owns plot ${plot1.number}`);

  // Create info pages
  const aboutPage = await prisma.infoPage.create({
    data: {
      slug: 'about',
      title: 'О нашем СНТ',
      content: 'Добро пожаловать в наше садоводческое товарищество...',
      isPublic: true,
    },
  });

  const rulesPage = await prisma.infoPage.create({
    data: {
      slug: 'rules',
      title: 'Правила внутреннего распорядка',
      content: 'Правила поведения в садоводческом товариществе...',
      isPublic: true,
    },
  });

  console.log(`✅ Created ${2} info pages`);

  console.log('🌱 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
