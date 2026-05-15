const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanDatabase() {
  try {
    console.log('Cleaning database...');
    
    // We need to delete in the correct order to respect foreign key constraints
    await prisma.notification.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.merchantStore.deleteMany({});
    await prisma.subscription.deleteMany({});
    await prisma.user.deleteMany({});

    console.log('Database completely cleaned!');
  } catch (error) {
    console.error('Error cleaning database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase();
