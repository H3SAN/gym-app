import { PrismaClient, Difficulty } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const adminHash = await bcrypt.hash('admin1234', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@avengersgym.com' },
    update: {},
    create: {
      email: 'admin@avengersgym.com',
      name: 'Admin User',
      passwordHash: adminHash,
      role: 'ADMIN',
      memberships: {
        create: {
          tier: 'ELITE',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          isActive: true,
          autoRenew: true,
        },
      },
    },
  })
  console.log('Created admin:', admin.email)

  // Create demo user
  const userHash = await bcrypt.hash('user1234', 10)
  const user = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      name: 'John Doe',
      passwordHash: userHash,
      memberships: {
        create: {
          tier: 'PRO',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isActive: true,
          autoRenew: true,
        },
      },
      goals: {
        create: [
          {
            title: 'Lose 5kg',
            targetValue: 5,
            currentValue: 2,
            unit: 'kg',
            targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          },
          {
            title: 'Run 100km this month',
            targetValue: 100,
            currentValue: 38,
            unit: 'km',
            targetDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
          },
        ],
      },
    },
  })
  console.log('Created user:', user.email)

  // Create classes
  const instructors = [
    { name: 'Marcus Johnson', photo: null },
    { name: 'Sarah Chen', photo: null },
    { name: 'Rafael Torres', photo: null },
    { name: 'Emma Williams', photo: null },
  ]

  const classTemplates = [
    {
      name: 'Morning HIIT Blast',
      description: 'High-intensity interval training to kickstart your metabolism. This class alternates between intense bursts of activity and short recovery periods.',
      difficulty: Difficulty.ADVANCED,
      isPro: false,
      location: 'Main Studio',
      duration: 45,
    },
    {
      name: 'Yoga Flow',
      description: 'A calming yoga session focusing on breath and flexibility. Suitable for all levels.',
      difficulty: Difficulty.BEGINNER,
      isPro: false,
      location: 'Yoga Room',
      duration: 60,
    },
    {
      name: 'Strength & Conditioning',
      description: 'Build functional strength with compound movements and progressive overload. Equipment provided.',
      difficulty: Difficulty.INTERMEDIATE,
      isPro: true,
      location: 'Weight Room',
      duration: 60,
    },
    {
      name: 'Spin Class',
      description: 'Indoor cycling class with motivating music and varied terrain simulations.',
      difficulty: Difficulty.INTERMEDIATE,
      isPro: false,
      location: 'Cycle Studio',
      duration: 45,
    },
    {
      name: 'Elite CrossFit',
      description: 'Forged for champions. Our most demanding class combining Olympic lifting, gymnastics, and metabolic conditioning.',
      difficulty: Difficulty.ADVANCED,
      isPro: true,
      location: 'CrossFit Box',
      duration: 60,
    },
    {
      name: 'Pilates Core',
      description: 'Strengthen your core, improve posture and flexibility with classic pilates movements.',
      difficulty: Difficulty.BEGINNER,
      isPro: false,
      location: 'Yoga Room',
      duration: 50,
    },
  ]

  const baseDate = new Date()
  baseDate.setHours(6, 0, 0, 0)

  for (let i = 0; i < classTemplates.length; i++) {
    const template = classTemplates[i]
    const instructor = instructors[i % instructors.length]
    const startTime = new Date(baseDate.getTime() + i * 2 * 60 * 60 * 1000)
    const endTime = new Date(startTime.getTime() + template.duration * 60 * 1000)

    await prisma.class.create({
      data: {
        name: template.name,
        description: template.description,
        instructorName: instructor.name,
        instructorPhoto: instructor.photo,
        startTime,
        endTime,
        capacity: 20,
        bookedCount: Math.floor(Math.random() * 15),
        difficulty: template.difficulty,
        isPro: template.isPro,
        location: template.location,
      },
    })
  }
  console.log(`Created ${classTemplates.length} classes`)

  // Create products
  const products = [
    {
      name: 'Whey Protein Isolate',
      description: 'Premium whey protein isolate with 25g protein per serving. Available in chocolate, vanilla, and strawberry flavors. Zero sugar, low fat.',
      price: 49.99,
      category: 'Supplements',
      stock: 50,
    },
    {
      name: 'Pre-Workout Energy',
      description: 'Explosive pre-workout formula with caffeine, beta-alanine, and citrulline. Maximize your training performance.',
      price: 34.99,
      category: 'Supplements',
      stock: 30,
    },
    {
      name: 'Resistance Band Set',
      description: 'Set of 5 resistance bands with varying tension levels (10-50 lbs). Includes carry bag and exercise guide.',
      price: 24.99,
      category: 'Equipment',
      stock: 20,
    },
    {
      name: 'Gym Gloves Pro',
      description: 'Padded palm grip gloves with wrist support. Anti-slip design for barbells, dumbbells, and pull-up bars.',
      price: 19.99,
      category: 'Accessories',
      stock: 40,
    },
    {
      name: 'Performance Tank Top',
      description: 'Moisture-wicking fabric, four-way stretch. Lightweight and breathable for intense workouts.',
      price: 29.99,
      category: 'Apparel',
      stock: 35,
    },
    {
      name: 'Creatine Monohydrate',
      description: 'Pure micronized creatine monohydrate. Supports strength, power, and muscle growth.',
      price: 22.99,
      category: 'Supplements',
      stock: 45,
    },
    {
      name: 'Foam Roller',
      description: 'High-density EVA foam roller for myofascial release and recovery. 36 inch professional length.',
      price: 29.99,
      category: 'Equipment',
      stock: 15,
    },
    {
      name: 'Shaker Bottle',
      description: '28oz BPA-free shaker with BlenderBall wire whisk. Leak-proof lid. Perfect for protein shakes.',
      price: 12.99,
      category: 'Accessories',
      stock: 60,
    },
    {
      name: 'BCAA Amino Acids',
      description: 'Branch-chain amino acids in 2:1:1 ratio. Supports muscle recovery and reduces soreness.',
      price: 28.99,
      category: 'Supplements',
      stock: 25,
    },
  ]

  for (const product of products) {
    await prisma.product.create({ data: product })
  }
  console.log(`Created ${products.length} products`)

  // Add some workout logs for the demo user
  const exercises = [
    { name: 'Bench Press', sets: 4, reps: 8, weight: 80, unit: 'KG' as const },
    { name: 'Squat', sets: 4, reps: 10, weight: 100, unit: 'KG' as const },
    { name: 'Deadlift', sets: 3, reps: 6, weight: 120, unit: 'KG' as const },
    { name: 'Pull-ups', sets: 3, reps: 12, weight: 0, unit: 'KG' as const },
    { name: 'Shoulder Press', sets: 3, reps: 10, weight: 50, unit: 'KG' as const },
  ]

  for (let i = 6; i >= 0; i--) {
    if (Math.random() > 0.3) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const numExercises = Math.floor(Math.random() * 3) + 2

      await prisma.workoutLog.create({
        data: {
          userId: user.id,
          date,
          notes: i === 0 ? 'Great session today!' : null,
          exercises: {
            create: exercises.slice(0, numExercises).map((ex) => ({
              name: ex.name,
              sets: ex.sets,
              reps: ex.reps,
              weight: ex.weight,
              unit: ex.unit,
            })),
          },
        },
      })
    }
  }
  console.log('Created workout logs')

  console.log('Seed complete!')
  console.log('\nTest credentials:')
  console.log('  Admin: admin@avengersgym.com / admin1234')
  console.log('  User:  john@example.com / user1234')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
