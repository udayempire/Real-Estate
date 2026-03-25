import { prisma } from '../src/config/prisma.js';
import { hashPassword } from '../src/utils/password.js';
import { generateReferralCode } from '../src/utils/generateReferralCode.js';

async function main() {
  console.log('🌱 Seeding database...');

  // create super admin
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD as string;
  if (!superAdminEmail || !superAdminPassword) {
    throw new Error("SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD are required");
  }
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

  const adminPasswordHash = await hashPassword('Admin@123');
  const buyerPasswordHash = await hashPassword('Buyer@123');

  // Seed user #1 without a referrer
  const firstUser = await prisma.user.upsert({
    where: {
      email: 'admin@realbro.com',
    },
    update: {
      firstName: 'Admin',
      lastName: 'User',
      phone: '+919999999999',
      password: adminPasswordHash,
      age: 30,
      gender: 'MALE',
      avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=300&q=80',
      avatarKey: 'seed/users/admin-avatar.jpg',
      isEmailVerified: true,
      blueTick: false,
      isVerifiedSeller: false,
      points: 100,
      referrerId: null,
    },
    create: {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@realbro.com',
      phone: '+919999999999',
      password: adminPasswordHash,
      age: 30,
      gender: 'MALE',
      avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=300&q=80',
      avatarKey: 'seed/users/admin-avatar.jpg',
      referralCode: generateReferralCode('Admin'),
      referrerId: null,
      isEmailVerified: true,
      blueTick: false,
      isVerifiedSeller: false,
      points: 100,
    },
  });

  // Seed user #2 referred by user #1
  const secondUser = await prisma.user.upsert({
    where: {
      email: 'buyer@realbro.com',
    },
    update: {
      firstName: 'Buyer',
      lastName: 'User',
      phone: '+919999999998',
      password: buyerPasswordHash,
      age: 27,
      gender: 'FEMALE',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
      avatarKey: 'seed/users/buyer-avatar.jpg',
      isEmailVerified: true,
      blueTick: false,
      isVerifiedSeller: false,
      points: 25,
      referrerId: firstUser.id,
    },
    create: {
      firstName: 'Buyer',
      lastName: 'User',
      email: 'buyer@realbro.com',
      phone: '+919999999998',
      password: buyerPasswordHash,
      age: 27,
      gender: 'FEMALE',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
      avatarKey: 'seed/users/buyer-avatar.jpg',
      referralCode: generateReferralCode('Buyer'),
      referrerId: firstUser.id,
      isEmailVerified: true,
      blueTick: false,
      isVerifiedSeller: false,
      points: 25,
    },
  });

  await prisma.kyc.upsert({
    where: {
      userId_type: {
        userId: firstUser.id,
        type: 'AADHARCARD',
      },
    },
    update: {
      docNo: '123412341234',
      imageUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=600&q=80',
      imageKey: 'seed/kyc/admin-aadhar.jpg',
      status: 'VERIFIED',
      rejectionReason: null,
    },
    create: {
      userId: firstUser.id,
      type: 'AADHARCARD',
      docNo: '123412341234',
      imageUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=600&q=80',
      imageKey: 'seed/kyc/admin-aadhar.jpg',
      status: 'VERIFIED',
    },
  });

  await prisma.kyc.upsert({
    where: {
      userId_type: {
        userId: firstUser.id,
        type: 'PANCARD',
      },
    },
    update: {
      docNo: 'ABCDE1234F',
      imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80',
      imageKey: 'seed/kyc/admin-pan.jpg',
      status: 'VERIFIED',
      rejectionReason: null,
    },
    create: {
      userId: firstUser.id,
      type: 'PANCARD',
      docNo: 'ABCDE1234F',
      imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80',
      imageKey: 'seed/kyc/admin-pan.jpg',
      status: 'VERIFIED',
    },
  });

  await prisma.kyc.upsert({
    where: {
      userId_type: {
        userId: secondUser.id,
        type: 'AADHARCARD',
      },
    },
    update: {
      docNo: '567856785678',
      imageUrl: 'https://images.unsplash.com/photo-1554224155-3a589877462f?auto=format&fit=crop&w=600&q=80',
      imageKey: 'seed/kyc/buyer-aadhar.jpg',
      status: 'PENDING',
      rejectionReason: null,
    },
    create: {
      userId: secondUser.id,
      type: 'AADHARCARD',
      docNo: '567856785678',
      imageUrl: 'https://images.unsplash.com/photo-1554224155-3a589877462f?auto=format&fit=crop&w=600&q=80',
      imageKey: 'seed/kyc/buyer-aadhar.jpg',
      status: 'PENDING',
    },
  });

  await prisma.kyc.upsert({
    where: {
      userId_type: {
        userId: secondUser.id,
        type: 'PANCARD',
      },
    },
    update: {
      docNo: 'PQRST6789L',
      imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=600&q=80',
      imageKey: 'seed/kyc/buyer-pan.jpg',
      status: 'PENDING',
      rejectionReason: null,
    },
    create: {
      userId: secondUser.id,
      type: 'PANCARD',
      docNo: 'PQRST6789L',
      imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=600&q=80',
      imageKey: 'seed/kyc/buyer-pan.jpg',
      status: 'PENDING',
    },
  });

  console.log('✅ Seed user #1 ready:', firstUser.email, '| Referral:', firstUser.referralCode);
  console.log('✅ Seed user #2 ready:', secondUser.email, '| Referral:', secondUser.referralCode);
  console.log('🔗 User #2 referrerId:', secondUser.referrerId);
  console.log('⚠️  Remember to change seeded passwords after first login!');
  console.log("✅ SuperAdmin ready:", superAdmin.email);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
