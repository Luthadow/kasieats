import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface VendorSeed {
  phone: string;
  storeName: string;
  description: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  status: 'active' | 'pending_approval';
  rating: number;
  ratingCount: number;
  menuItems: Array<{ name: string; description: string; category: string; price: number }>;
}

const RUSTENBURG_VENDORS: VendorSeed[] = [
  {
    phone: '+27831234567',
    storeName: "Mama Lindiwe's Kota Stand",
    description: 'Authentic township kotas, mogodu and shisanyama since 2015.',
    category: 'Kota',
    address: '45 Tlhabane Main Road',
    latitude: -25.6712,
    longitude: 27.241,
    status: 'active',
    rating: 4.8,
    ratingCount: 42,
    menuItems: [
      { name: 'Cheese Kota', description: 'Kota with cheese, chips and atchar', category: 'Kota', price: 35 },
      { name: 'Mogodu with Pap', description: 'Traditional tripe stew with pap', category: 'Mogodu', price: 40 },
      { name: 'Russian Roll', description: 'Double russian with chips', category: 'Kota', price: 28 },
    ],
  },
  {
    phone: '+27841234567',
    storeName: "Joe's Shisanyama",
    description: 'Weekend braai and shisanyama platters.',
    category: 'Shisanyama',
    address: '12 Boitekong Plaza',
    latitude: -25.689,
    longitude: 27.255,
    status: 'active',
    rating: 4.5,
    ratingCount: 18,
    menuItems: [
      { name: 'Platter for 2', description: 'Boerewors, chicken and pap', category: 'Shisanyama', price: 120 },
      { name: 'T-Bone Steak', description: 'Grilled t-bone with chakalaka', category: 'Braai', price: 85 },
    ],
  },
  {
    phone: '+27861234567',
    storeName: "Sis Mary's Home Kitchen",
    description: 'Home-cooked meals — pap, stew and veggies daily.',
    category: 'Home Meals',
    address: '8 Extension 5, Boitekong',
    latitude: -25.682,
    longitude: 27.248,
    status: 'active',
    rating: 4.7,
    ratingCount: 31,
    menuItems: [
      { name: 'Beef Stew & Pap', description: 'Slow-cooked beef stew', category: 'Home Meals', price: 45 },
      { name: 'Chicken Curry', description: 'Mild chicken curry with rice', category: 'Home Meals', price: 50 },
    ],
  },
  {
    phone: '+27871234567',
    storeName: 'The Corner Kota',
    description: 'Late-night kotas at the taxi rank corner.',
    category: 'Kota',
    address: 'Tlhabane Taxi Rank, Stand 14',
    latitude: -25.668,
    longitude: 27.235,
    status: 'active',
    rating: 4.6,
    ratingCount: 55,
    menuItems: [
      { name: 'Full House Kota', description: 'Everything on it', category: 'Kota', price: 42 },
      { name: 'Vienna Special', description: 'Triple vienna kota', category: 'Kota', price: 38 },
    ],
  },
  {
    phone: '+27881234567',
    storeName: 'Braai Boss',
    description: 'Flame-grilled chicken and wors in Rustenburg CBD.',
    category: 'Chicken',
    address: '22 Nelson Mandela Drive',
    latitude: -25.665,
    longitude: 27.242,
    status: 'active',
    rating: 4.4,
    ratingCount: 22,
    menuItems: [
      { name: 'Half Chicken', description: 'Grilled half chicken with chips', category: 'Chicken', price: 55 },
      { name: 'Boerewors Roll', description: 'Boerewors in a fresh roll', category: 'Braai', price: 30 },
    ],
  },
  {
    phone: '+27891234567',
    storeName: 'New Kota Spot',
    description: 'Brand new kota stand — awaiting approval.',
    category: 'Kota',
    address: '3 Kanana Section',
    latitude: -25.695,
    longitude: 27.26,
    status: 'pending_approval',
    rating: 0,
    ratingCount: 0,
    menuItems: [
      { name: 'Basic Kota', description: 'Standard kota', category: 'Kota', price: 25 },
    ],
  },
  {
    phone: '+27801234568',
    storeName: 'Kasi Bunny Chow',
    description: 'Durban-style bunny chow in the kasi.',
    category: 'Home Meals',
    address: '19 Joubert Street, Tlhabane',
    latitude: -25.674,
    longitude: 27.239,
    status: 'pending_approval',
    rating: 0,
    ratingCount: 0,
    menuItems: [
      { name: 'Mince Bunny', description: 'Quarter loaf with mince', category: 'Home Meals', price: 35 },
    ],
  },
];

async function seedVendor(v: VendorSeed) {
  const user = await prisma.user.upsert({
    where: { phone: v.phone },
    update: { user_type: 'vendor' },
    create: { phone: v.phone, user_type: 'vendor', phone_verified: true },
  });

  const vendor = await prisma.vendor.upsert({
    where: { user_id: user.id },
    update: {
      store_name: v.storeName,
      status: v.status,
      is_open_now: v.status === 'active',
    },
    create: {
      user_id: user.id,
      store_name: v.storeName,
      store_description: v.description,
      store_category: v.category,
      phone: v.phone,
      address: v.address,
      city: 'Rustenburg',
      latitude: v.latitude,
      longitude: v.longitude,
      is_open_now: v.status === 'active',
      status: v.status,
      approved_at: v.status === 'active' ? new Date() : undefined,
      average_rating: v.rating,
      rating_count: v.ratingCount,
    },
  });

  const menu = await prisma.menu.upsert({
    where: { id: `seed-menu-${vendor.id}` },
    update: {},
    create: { id: `seed-menu-${vendor.id}`, vendor_id: vendor.id, category: 'Main' },
  });

  for (const [index, item] of v.menuItems.entries()) {
    await prisma.menuItem.upsert({
      where: { id: `seed-item-${vendor.id}-${index}` },
      update: {},
      create: {
        id: `seed-item-${vendor.id}-${index}`,
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

  return vendor;
}

async function main() {
  console.log('Seeding KasiEats Rustenburg pilot data...');

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
    create: { phone: '+27761234567', user_type: 'customer', phone_verified: true },
  });

  const customer = await prisma.customer.upsert({
    where: { user_id: customerUser.id },
    update: {},
    create: { user_id: customerUser.id, first_name: 'Amahle', last_name: 'Nkosi' },
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

  const vendors = [];
  for (const v of RUSTENBURG_VENDORS) {
    vendors.push(await seedVendor(v));
  }

  const driverUser = await prisma.user.upsert({
    where: { phone: '+27851234567' },
    update: {},
    create: { phone: '+27851234567', user_type: 'driver', phone_verified: true },
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

  const pendingDriverUser = await prisma.user.upsert({
    where: { phone: '+27861234568' },
    update: {},
    create: { phone: '+27861234568', user_type: 'driver', phone_verified: true },
  });

  await prisma.driver.upsert({
    where: { user_id: pendingDriverUser.id },
    update: {},
    create: {
      user_id: pendingDriverUser.id,
      first_name: 'Sipho',
      last_name: 'Dlamini',
      vehicle_type: 'car',
      vehicle_plate: 'NW 456 GP',
      status: 'pending_approval',
    },
  });

  console.log('\n=== Rustenburg Pilot Seed Complete ===');
  console.log(`Admin: admin@kasieats.co.za / Admin123! (phone ${adminUser.phone})`);
  console.log(`Customer: 0761234567 · OTP 123456`);
  console.log(`Driver: 0851234567 · OTP 123456 (Thabiso)`);
  console.log(`Active vendors: ${vendors.filter((v) => v.status === 'active').length}`);
  console.log(`Pending vendors: ${vendors.filter((v) => v.status === 'pending_approval').length}`);
  console.log('Vendor phones: 0831234567, 0841234567, 0861234567, 0871234567, 0881234567');
  console.log('Pending vendor phones: 0891234567, 0801234568');
  console.log('Pending driver: 0861234568');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
