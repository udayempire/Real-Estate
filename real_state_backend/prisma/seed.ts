import { prisma } from '../src/config/prisma.js';
import { hashPassword } from '../src/utils/password.js';
import { generateReferralCode } from '../src/utils/generateReferralCode.js';

async function main() {
  console.log('🌱 Seeding database...');

  // create super admin
  const superAdminEmail = "owner@realbro.com";
  const superAdminPassword = "Owner@123";
  const superAdmin = await prisma.superAdmin.upsert({
    where: { email: superAdminEmail },
    update: {
      isActive: true,
    },
    create: {
      firstName: "Super",
      lastName: "Admin",
      email: superAdminEmail,
      passwordHash: await hashPassword(superAdminPassword),
      isActive: true,
      isTwoFactorEnabled: false,
    },
  });

  // Check if first user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      email: 'admin@realbro.com'
    }
  });

  if (existingUser) {
    console.log('❌ First user already exists!');
    return;
  }

  // Create the first user without a referrer
  const firstUser = await prisma.user.create({
    data: {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@realbro.com',
      phone: '+919999999999', // Change this to desired phone
      password: await hashPassword('Admin@123'), // Change this password
      referralCode: generateReferralCode('Admin'),
      referrerId: null, // No referrer for the first user
      isEmailVerified: true,
      points: 0,
    }
  });
  // create property for first user
  const property = await prisma.property.create({
    data: {
      title: "Test Property",
      description: "Test Description",
      status: "ACTIVE",
      propertyType: "FLAT",
      userId: firstUser.id,
      amenities: [],
      locationAdvantages: [],
      listingPrice: 2500000,
      city: "Bhopal",
      state: "Madhya Pradesh",
    },
  });

  console.log('✅ First user created successfully!');
  console.log('📧 Email:', firstUser.email);
  console.log('📱 Phone:', firstUser.phone);
  console.log('🔑 Referral Code:', firstUser.referralCode);
  console.log('⚠️  Remember to change the password after first login!');
  console.log("✅ SuperAdmin ready:", superAdmin.email);
  console.log("✅ Property created successfully:", property.id);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
