const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

const DESTINATIONS = [
  'Bali, Indonesia', 'Maldives', 'Vietnam · Da Nang', 'Thailand · Phuket',
  'Sri Lanka', 'New Zealand', 'Japan · Tokyo', 'Dubai, UAE', 'Singapore',
  'Europe · Paris', 'Bali · Ubud', 'Thailand · Krabi', 'Vietnam · Hoi An',
  'Indonesia · Lombok', 'Malaysia · Langkawi', 'Cambodia · Siem Reap',
  'Nepal · Kathmandu', 'Bhutan', 'Mauritius', 'Seychelles',
  'Greece · Santorini', 'Italy · Amalfi', 'Switzerland', 'Turkey · Istanbul',
  'Spain · Barcelona', 'Portugal · Lisbon', 'Croatia · Dubrovnik',
  'Australia · Sydney', 'New Zealand · Queenstown', 'Canada · Banff'
]

const HOTELS = {
  'Bali, Indonesia': ['The Layar Seminyak', 'Alila Villas Uluwatu', 'COMO Uma Ubud', 'Four Seasons Jimbaran'],
  'Maldives': ['Cinnamon Hakuraa Huraa', 'Soneva Fushi', 'One&Only Reethi Rah', 'Gili Lankanfushi'],
  'Vietnam · Da Nang': ['Fusion Maia Resort', 'Naman Retreat', 'Hyatt Regency Da Nang', 'Intercontinental Sun Peninsula'],
  'Thailand · Phuket': ['Trisara Resort', 'Amanpuri', 'Sala Phuket', 'Paresa Resort'],
  'Sri Lanka': ['Amanwella', 'Cape Weligama', 'Galle Face Hotel', 'Heritance Kandalama'],
  'New Zealand': ['QT Auckland', 'Blanket Bay', 'The Rees Hotel', 'Huka Lodge'],
  'Japan · Tokyo': ['Park Hyatt Tokyo', 'Aman Tokyo', 'The Peninsula Tokyo', 'Mandarin Oriental Tokyo'],
  'Dubai, UAE': ['Burj Al Arab', 'Atlantis The Palm', 'One&Only Royal Mirage', 'Jumeirah Beach Hotel'],
  'Singapore': ['Marina Bay Sands', 'Capella Singapore', 'The Fullerton Bay', 'Raffles Hotel'],
  'Europe · Paris': ['Le Meurice', 'Hotel Lutetia', 'The Peninsula Paris', 'Four Seasons George V'],
}

const COUPLE_NAMES = [
  'Priya & Arjun Mehta', 'Sneha & Rahul Gupta', 'Ananya & Karthik Rajan',
  'Meera & Vivek Sinha', 'Divya & Neeraj Kapoor', 'Pooja & Suresh Tiwari',
  'Kavya & Rohit Sharma', 'Swati & Amit Verma', 'Neha & Vikram Malhotra',
  'Ria & Siddharth Joshi', 'Aisha & Zaid Khan', 'Tara & Dev Patel',
  'Shreya & Kunal Bose', 'Ishita & Aryan Singh', 'Naina & Kabir Nair',
  'Rekha & Sunil Reddy', 'Pallavi & Nikhil Desai', 'Smita & Rajesh Iyer',
  'Deepa & Mohan Pillai', 'Sunita & Anil Kumar', 'Geeta & Rakesh Pandey',
  'Lakshmi & Venkat Rao', 'Anjali & Pranav Shah', 'Ritu & Saurabh Saxena',
  'Komal & Yash Bansal', 'Shalini & Gaurav Mishra', 'Bhavna & Mihir Trivedi',
  'Heena & Varun Chawla', 'Poornima & Sriram Menon', 'Archana & Deepak Jain',
  'Madhuri & Rajiv Pillai', 'Sonia & Manish Tomar', 'Kritika & Aakash Dubey',
  'Tanvi & Hardik Parekh', 'Nidhi & Rohan Agarwal', 'Charu & Nilesh Patil',
  'Simran & Gurpreet Singh', 'Jasmine & Harjot Bedi', 'Manpreet & Amrit Gill',
  'Poonam & Dinesh Thakur'
]

const DEPARTURE_CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Hyderabad', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Kochi']

const VISA_STATUSES = ['Not required', 'Visa on arrival', 'e-Visa approved', 'Visa approved', 'NZeTA approved', 'ETA approved']

const TRIP_TYPES = ['Honeymoon', 'Anniversary', 'Birthday getaway', 'Leisure vacation', 'Babymoon', 'First international trip']

const STATUSES = ['ON_TRACK', 'ON_TRACK', 'ON_TRACK', 'NEEDS_ATTENTION', 'ISSUE_FLAGGED']

const CHECKIN_MESSAGES = [
  "Good morning! Hope you both had a wonderful night at {hotel}! Today's transfer to {activity} is confirmed for {time}. Enjoy every moment — you deserve it! 🌴",
  "Hey {name1} & {name2}! Quick check-in — how's everything going? Your hotel check-in today should be smooth. Room is ready from 2 PM. Let me know if you need anything! 😊",
  "Good morning from the 30Sundays team! Day {day} of your {dest} adventure begins! Today is all about relaxation — enjoy the pool and spa. Your dinner reservation is at 7:30 PM. 🌅",
  "Hi {name1}! Hope the flight was smooth. Welcome to {dest}! Your driver Ravi is waiting at Gate 3. He'll take you straight to {hotel}. Call me if there are any issues! ✈️",
  "Happy {day}th anniversary! 🎉 Today we've arranged something special — a private beach dinner at sunset. The team at {hotel} has been informed. Enjoy every moment!",
  "Morning check-in! Today's snorkelling trip departs at 8 AM from the hotel jetty. Please carry sunscreen, water shoes and your camera — the coral reefs are stunning! 🐠",
  "Hi there! Just checking in on Day {day}. Today is your free day — perfect for exploring the local markets. Recommended: the night market starts at 6 PM. Let me know how it goes!",
  "Good morning! Your checkout today is at 12 PM. I've arranged a late checkout until 2 PM so you can enjoy one last swim. Transfer to airport at 3 PM. Safe travels! 🙏",
]

const FLIGHT_OPTIONS = [
  'AI 344 · 06:40 AM', 'SG 104 · 08:15 AM', 'UK 981 · 11:30 AM',
  '6E 234 · 14:45 PM', 'QR 551 · 03:20 AM', 'EK 508 · 21:00 PM',
  'SQ 423 · 09:45 AM', 'TG 312 · 13:20 PM', 'MH 191 · 07:30 AM'
]

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
function randomDate(daysFromNow, spread) {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow + randomInt(0, spread))
  return d
}

function getHotel(destination) {
  const hotels = HOTELS[destination]
  if (hotels) return randomFrom(hotels)
  return 'Grand Resort & Spa'
}

function generateCheckinMessage(coupleNames, hotel, dest, day) {
  const names = coupleNames.split(' & ')
  const name1 = names[0].split(' ')[0]
  const name2 = names[1] ? names[1].split(' ')[0] : name1
  const activities = ['Uluwatu sunset tour', 'snorkelling excursion', 'city tour', 'cooking class', 'island hopping', 'temple visit', 'sunset cruise']
  const times = ['9 AM', '10 AM', '2 PM', '4 PM', '8 AM']
  let msg = randomFrom(CHECKIN_MESSAGES)
  return msg
    .replace('{hotel}', hotel)
    .replace('{activity}', randomFrom(activities))
    .replace('{time}', randomFrom(times))
    .replace('{name1}', name1)
    .replace('{name2}', name2)
    .replace('{day}', day)
    .replace('{dest}', dest.split(' · ')[0])
}

async function main() {
  console.log('🌱 Seeding database with ~1000 records...')

  // Hash passwords
  const adminHash = await bcrypt.hash('admin123', 10)
  const tmHash = await bcrypt.hash('tm123', 10)

  // Create admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@30sundays.com' },
    update: {},
    create: { name: 'Admin', email: 'admin@30sundays.com', password: adminHash, role: 'ADMIN' }
  })

  // Create 5 trip managers
  const tmNames = [
    { name: 'Rahul Kumar', email: 'rahul@30sundays.com' },
    { name: 'Preethi Nair', email: 'preethi@30sundays.com' },
    { name: 'Arjun Bose', email: 'arjun@30sundays.com' },
    { name: 'Kavitha Menon', email: 'kavitha@30sundays.com' },
    { name: 'Siddharth Roy', email: 'siddharth@30sundays.com' },
  ]

  const tms = []
  for (const tm of tmNames) {
    const user = await prisma.user.upsert({
      where: { email: tm.email },
      update: {},
      create: { name: tm.name, email: tm.email, password: tmHash, role: 'TRIP_MANAGER' }
    })
    tms.push(user)
  }

  console.log(`✅ Created ${tms.length + 1} users`)

  // Create 200 trips with check-ins
  let tripCount = 0
  let checkinCount = 0
  let actionCount = 0

  const couplePool = [...COUPLE_NAMES]
  // Repeat to get enough couples
  while (couplePool.length < 200) couplePool.push(...COUPLE_NAMES)

  for (let i = 0; i < 200; i++) {
    const tm = tms[i % tms.length]
    const destination = randomFrom(DESTINATIONS)
    const coupleNames = couplePool[i]
    const hotel = getHotel(destination)
    const departureCity = randomFrom(DEPARTURE_CITIES)
    const visa = randomFrom(VISA_STATUSES)
    const status = randomFrom(STATUSES)
    const tripDays = randomInt(5, 14)

    // Mix of past, current, future trips
    let startOffset
    if (i < 60) startOffset = -randomInt(1, 6) // active trips (started recently)
    else if (i < 120) startOffset = -randomInt(7, 30) // past trips
    else startOffset = randomInt(7, 60) // upcoming trips

    const startDate = randomDate(startOffset, 3)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + tripDays)

    const flight = i % 3 === 0 ? randomFrom(FLIGHT_OPTIONS) : null

    try {
      const trip = await prisma.trip.create({
        data: {
          coupleNames,
          destination,
          hotel,
          departureCity,
          flightDetails: flight,
          visaStatus: visa,
          startDate,
          endDate,
          whatsappNumber: `+9198${randomInt(10000000, 99999999)}`,
          status: status,
          notes: i % 4 === 0 ? `${randomFrom(TRIP_TYPES)} trip. Special arrangements requested.` : null,
          tripManagerId: tm.id,
        }
      })
      tripCount++

      // Add 2-8 check-ins per active/past trip
      if (startOffset <= 0) {
        const numCheckins = randomInt(2, 8)
        for (let c = 0; c < numCheckins; c++) {
          const dayNum = c + 1
          const checkinDate = new Date(startDate)
          checkinDate.setDate(checkinDate.getDate() + c)

          const message = generateCheckinMessage(coupleNames, hotel, destination, dayNum)
          const sent = Math.random() > 0.2

          const checkin = await prisma.checkIn.create({
            data: {
              tripId: trip.id,
              authorId: tm.id,
              message,
              language: randomFrom(['EN', 'EN', 'EN', 'HI', 'HINGLISH']),
              moodSignal: randomFrom(['happy', 'happy', 'excited', 'nervous', 'frustrated']),
              todayEvent: randomFrom(['hotel_checkin', 'flight', 'activity', 'free_day', 'checkout']),
              sentViaWA: sent,
              sentAt: sent ? checkinDate : null,
              createdAt: checkinDate,
            }
          })
          checkinCount++

          // Add 2-4 actions per checkin
          const numActions = randomInt(2, 4)
          const actionTemplates = [
            { priority: 'HIGH', text: 'Confirm airport transfer with local driver' },
            { priority: 'HIGH', text: 'Follow up on room upgrade request' },
            { priority: 'HIGH', text: 'Resolve hotel complaint about room cleanliness' },
            { priority: 'MEDIUM', text: 'Send activity confirmation to couple' },
            { priority: 'MEDIUM', text: 'Check visa status with embassy' },
            { priority: 'MEDIUM', text: 'Confirm dinner reservation for tonight' },
            { priority: 'MEDIUM', text: 'Arrange birthday cake surprise with hotel' },
            { priority: 'LOW', text: 'Share local restaurant recommendations' },
            { priority: 'LOW', text: 'Send weather update for next 3 days' },
            { priority: 'LOW', text: 'Remind couple about checkout time tomorrow' },
            { priority: 'LOW', text: 'Follow up on travel insurance claim' },
          ]

          const selectedActions = actionTemplates.sort(() => Math.random() - 0.5).slice(0, numActions)
          for (const action of selectedActions) {
            await prisma.action.create({
              data: {
                checkInId: checkin.id,
                priority: action.priority,
                text: action.text,
                completed: Math.random() > 0.6,
              }
            })
            actionCount++
          }
        }
      }
    } catch (e) {
      // Skip duplicate errors
      if (!e.message.includes('Unique constraint')) console.error(`Trip ${i} error:`, e.message)
    }

    if (i % 20 === 0) console.log(`  Progress: ${i}/200 trips...`)
  }

  console.log('\n✅ Seed complete!')
  console.log(`   Trips created: ${tripCount}`)
  console.log(`   Check-ins created: ${checkinCount}`)
  console.log(`   Actions created: ${actionCount}`)
  console.log('\nLogin credentials:')
  console.log('  Admin:        admin@30sundays.com / admin123')
  console.log('  Trip Manager: rahul@30sundays.com / tm123')
  console.log('  Trip Manager: preethi@30sundays.com / tm123')
  console.log('  Trip Manager: arjun@30sundays.com / tm123')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
