import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding KasiEats database...');

  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const adminUser = await prisma.user.upsert({
    where: { phone: '+27820000001' },
    update: {},
    create: {
      email: 'admin@kasieats.co.za',
      phone: '+27820000001',
      password_hash: adminPassword,
      user_type: 'admin',
      phone_verified: true,
      email_verified: true,
    },
  });

  const customerUser = await prisma.user.upsert({
    where: { phone: '+27761234567' },
    update: {},
    create: {
      phone: '+27761234567',
      user_type: 'customer',
      phone_verified: true,
    },
  });

  const customer = await prisma.customer.upsert({
    where: { user_id: customerUser.id },
    update: {},
    create: {
      user_id: customerUser.id,
      first_name: 'Amahle',
      last_name: 'Nkosi',
    },
  });

  await prisma.address.upsert({
    where: { id: 'seed-address-home' },
    update: {},
    create: {
      id: 'seed-address-home',
      customer_id: customer.id,
      label: 'home',
      address_line_1: '123 Zuma Street',
      city: 'Rustenburg',
      postal_code: '0300',
      latitude: -25.6544,
      longitude: 27.2389,
      is_default: true,
      delivery_instructions: 'Gate code 1234',
    },
  });

  const vendorUser = await prisma.user.upsert({
    where: { phone: '+27831234567' },
    update: {},
    create: {
      phone: '+27831234567',
      user_type: 'vendor',
      phone_verified: true,
    },
  });

  const vendor = await prisma.vendor.upsert({
    where: { user_id: vendorUser.id },
    update: {},
    create: {
      user_id: vendorUser.id,
      store_name: "Mama Lindiwe's Kota Stand",
      store_description: 'Authentic township kotas, mogodu and shisanyama since 2015.',
      store_category: 'Kota',
      phone: '+27831234567',
      address: '45 Tlhabane Main Road',
      city: 'Rustenburg',
      latitude: -25.6712,
      longitude: 27.241,
      is_open_now: true,
      status: 'active',
      approved_at: new Date(),
      average_rating: 4.8,
      rating_count: 42,
    },
  });

  const menu = await prisma.menu.upsert({
    where: { id: 'seed-menu-main' },
    update: {},
    create: {
      id: 'seed-menu-main',
      vendor_id: vendor.id,
      category: 'Main',
    },
  });

  const menuItems = [
    {
      id: 'seed-item-kota',
      name: 'Cheese Kota',
      description: 'Fresh kota with cheese, chips and atchar',
      category: 'Kota',
      price: 35,
    },
    {
      id: 'seed-item-mogodu',
      name: 'Mogodu with Pap',
      description: 'Traditional tripe stew served with pap',
      category: 'Mogodu',
      price: 40,
    },
    {
      id: 'seed-item-russian',
      name: 'Russian Roll',
      description: 'Double russian with chips and sauce',
      category: 'Kota',
      price: 28,
    },
    {
      id: 'seed-item-drink',
      name: 'Soft Drink 500ml',
      description: 'Coke, Fanta or Sprite',
      category: 'Drinks',
      price: 15,
    },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        menu_id: menu.id,
        vendor_id: vendor.id,
        name: item.name,
        description: item.description,
        category: item.category,
        price: item.price,
        is_available: true,
      },
    });
  }

  const vendor2User = await prisma.user.upsert({
    where: { phone: '+27841234567' },
    update: {},
    create: {
      phone: '+27841234567',
      user_type: 'vendor',
      phone_verified: true,
    },
  });

  await prisma.vendor.upsert({
    where: { user_id: vendor2User.id },
    update: {},
    create: {
      user_id: vendor2User.id,
      store_name: "Joe's Shisanyama",
      store_description: 'Weekend braai and shisanyama platters',
      store_category: 'Shisanyama',
      phone: '+27841234567',
      address: '12 Boitekong Plaza',
      city: 'Rustenburg',
      latitude: -25.689,
      longitude: 27.255,
      is_open_now: true,
      status: 'active',
      approved_at: new Date(),
      average_rating: 4.5,
      rating_count: 18,
    },
  });

  const driverUser = await prisma.user.upsert({
    where: { phone: '+27851234567' },
    update: {},
    create: {
      phone: '+27851234567',
      user_type: 'driver',
      phone_verified: true,
    },
  });

  await prisma.driver.upsert({
    where: { user_id: driverUser.id },
    update: {},
    create: {
      user_id: driverUser.id,
      first_name: 'Thabiso',
      last_name: 'Molefe',
      vehicle_type: 'motorcycle',
      vehicle_plate: 'NW 123 GP',
      status: 'active',
      is_online: true,
      approved_at: new Date(),
      average_rating: 4.9,
      rating_count: 67,
    },
  });

  console.log('Seed complete.');
  console.log(`Admin user: ${adminUser.phone}`);
  console.log(`Customer: ${customerUser.phone}`);
  console.log(`Vendor: ${vendor.store_name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
