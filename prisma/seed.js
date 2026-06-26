const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('admin123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@30sundays.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@30sundays.com',
      password,
      role: 'ADMIN',
    },
  })

  const tm = await prisma.user.upsert({
    where: { email: 'rahul@30sundays.com' },
    update: {},
    create: {
      name: 'Rahul Kumar',
      email: 'rahul@30sundays.com',
      password: await bcrypt.hash('tm123', 10),
      role: 'TRIP_MANAGER',
    },
  })

  const trip = await prisma.trip.upsert({
    where: { id: 'seed-trip-1' },
    update: {},
    create: {
      id: 'seed-trip-1',
      coupleNames: 'Priya & Arjun Mehta',
      destination: 'Bali, Indonesia',
      hotel: 'The Layar Seminyak',
      departureCity: 'Mumbai',
      flightDetails: 'AI 344 · 06:40 AM',
      visaStatus: 'Not required',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      whatsappNumber: '+919876543210',
      status: 'ON_TRACK',
      tripManagerId: tm.id,
    },
  })

  console.log('Seed complete!')
  console.log('Admin:', admin.email, '/ password: admin123')
  console.log('TM:', tm.email, '/ password: tm123')
  console.log('Sample trip:', trip.id)
}

main().catch(console.error).finally(() => prisma.$disconnect())
