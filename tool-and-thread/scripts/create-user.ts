import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@toolandthread.com'
  const password = 'admin123'
  const name = 'Admin'

  try {
    const hashedPassword = await hash(password, 10)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    })

    console.log('Admin user created successfully:', {
      id: user.id,
      email: user.email,
      name: user.name,
    })
  } catch (error) {
    console.error('Error creating user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
