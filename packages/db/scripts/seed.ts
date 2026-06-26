import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding KasiEats database...');

  const adminPassword = await argon2.hash('Admin123!');
  const customerPassword = await argon2.hash('Customer123!');
  const vendorPassword = await argon2.hash('Vendor123!');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@kasieats.co.za' },
    update: {},
    create: {
      email: 'admin@kasieats.co.za',
      phone: '+27821234567',
      password_hash: adminPassword,
      user_type: 'ADMIN',
      email_verified: true,
      phone_verified: true,
      preferred_language: 'en',
    },
  });

  const customerUser = await prisma.user.upsert({
    where: { email: 'amahle@example.co.za' },
    update: {},
    create: {
      email: 'amahle@example.co.za',
      phone: '+27829876543',
      password_hash: customerPassword,
      user_type: 'CUSTOMER',
      email_verified: true,
      phone_verified: true,
      preferred_language: 'zu',
      customer: {
        create: {
          first_name: 'Amahle',
          last_name: 'Nkosi',
          loyalty_tier: 'bronze',
        },
      },
    },
  });

  const customer = await prisma.customer.findUniqueOrThrow({
    where: { user_id: customerUser.id },
  });

  await prisma.address.upsert({
    where: { id: 'seed-address-1' },
    update: {},
    create: {
      id: 'seed-address-1',
      customer_id: customer.id,
      label: 'home',
      address_line_1: '123 Tlhabane Main Road',
      city: 'Rustenburg',
      postal_code: '0299',
      latitude: -25.6675,
      longitude: 27.2423,
      is_default: true,
      delivery_instructions: 'Blue gate, call when arriving',
    },
  });

  const vendorUser = await prisma.user.upsert({
    where: { email: 'lindiwe@shisanyama.co.za' },
    update: {},
    create: {
      email: 'lindiwe@shisanyama.co.za',
      phone: '+27831112222',
      password_hash: vendorPassword,
      user_type: 'VENDOR_OWNER',
      email_verified: true,
      phone_verified: true,
      preferred_language: 'tn',
      vendor: {
        create: {
          store_name: "Mama Lindiwe's Shisanyama",
          store_description: 'Authentic township braai and pap. Best wors in Rustenburg!',
          store_category: 'shisanyama',
          phone: '+27831112222',
          email: 'lindiwe@shisanyama.co.za',
          address: '45 Boitekong Section, Rustenburg',
          city: 'Rustenburg',
          latitude: -25.6712,
          longitude: 27.2389,
          status: 'approved',
          approved_at: new Date(),
          commission_rate: 12,
          is_open_now: true,
          operating_hours: {
            monday: { open: '10:00', close: '22:00' },
            tuesday: { open: '10:00', close: '22:00' },
            wednesday: { open: '10:00', close: '22:00' },
            thursday: { open: '10:00', close: '22:00' },
            friday: { open: '10:00', close: '23:00' },
            saturday: { open: '09:00', close: '23:00' },
            sunday: { open: '11:00', close: '20:00' },
          },
        },
      },
    },
  });

  const vendor = await prisma.vendor.findUniqueOrThrow({
    where: { user_id: vendorUser.id },
  });

  const menu = await prisma.menu.upsert({
    where: { id: 'seed-menu-1' },
    update: {},
    create: {
      id: 'seed-menu-1',
      vendor_id: vendor.id,
      category: 'Main Menu',
    },
  });

  const menuItems = [
    {
      name: 'Full Plate Braai',
      description: 'Wors, chicken, pap, chakalaka and salad',
      price: 85.0,
      category: 'Plates',
      preparation_time_minutes: 25,
    },
    {
      name: 'Kota Special',
      description: 'Quarter loaf with polony, chips, cheese and atchar',
      price: 35.0,
      category: 'Kota',
      preparation_time_minutes: 10,
    },
    {
      name: 'Pap & Wors',
      description: 'Traditional pap with boerewors and gravy',
      price: 55.0,
      category: 'Plates',
      preparation_time_minutes: 15,
    },
    {
      name: 'Cooldrink 500ml',
      description: 'Coke, Fanta or Sprite',
      price: 15.0,
      category: 'Drinks',
      preparation_time_minutes: 2,
    },
  ];

  for (const [index, item] of menuItems.entries()) {
    await prisma.menuItem.upsert({
      where: { id: `seed-item-${index + 1}` },
      update: {},
      create: {
        id: `seed-item-${index + 1}`,
        menu_id: menu.id,
        vendor_id: vendor.id,
        ...item,
        display_order: index,
      },
    });
  }

  const vendor2User = await prisma.user.upsert({
    where: { email: 'sipho@kotahouse.co.za' },
    update: {},
    create: {
      email: 'sipho@kotahouse.co.za',
      phone: '+27834445555',
      password_hash: vendorPassword,
      user_type: 'VENDOR_OWNER',
      email_verified: true,
      phone_verified: true,
      vendor: {
        create: {
          store_name: 'Sipho Kota House',
          store_description: 'The best kotas in Tlhabane. Fresh daily!',
          store_category: 'kota',
          phone: '+27834445555',
          address: '78 Tlhabane Plaza, Rustenburg',
          city: 'Rustenburg',
          latitude: -25.6698,
          longitude: 27.241,
          status: 'approved',
          approved_at: new Date(),
          commission_rate: 12,
          is_open_now: true,
        },
      },
    },
  });

  console.log('Seed complete:');
  console.log(`  Admin:    admin@kasieats.co.za / Admin123!`);
  console.log(`  Customer: amahle@example.co.za / Customer123!`);
  console.log(`  Vendor:   lindiwe@shisanyama.co.za / Vendor123!`);
  console.log(`  Vendor 2: sipho@kotahouse.co.za / Vendor123!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
