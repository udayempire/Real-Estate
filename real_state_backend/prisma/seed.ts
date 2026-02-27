import { prisma } from '../src/config/prisma.js';
import { hashPassword } from '../src/utils/password.js';
import { generateReferralCode } from '../src/utils/generateReferralCode.js';

async function main() {
  console.log('🌱 Seeding database...');

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

  console.log('✅ First user created successfully!');
  console.log('📧 Email:', firstUser.email);
  console.log('📱 Phone:', firstUser.phone);
  console.log('🔑 Referral Code:', firstUser.referralCode);
  console.log('⚠️  Remember to change the password after first login!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
