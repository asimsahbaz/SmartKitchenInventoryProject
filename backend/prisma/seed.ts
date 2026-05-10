import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const categories = await Promise.all([
    prisma.category.upsert({ where: { name: 'Dairy' }, update: {}, create: { name: 'Dairy', icon: '🥛' } }),
    prisma.category.upsert({ where: { name: 'Vegetables' }, update: {}, create: { name: 'Vegetables', icon: '🥦' } }),
    prisma.category.upsert({ where: { name: 'Fruits' }, update: {}, create: { name: 'Fruits', icon: '🍎' } }),
    prisma.category.upsert({ where: { name: 'Meat & Fish' }, update: {}, create: { name: 'Meat & Fish', icon: '🥩' } }),
    prisma.category.upsert({ where: { name: 'Grains & Pasta' }, update: {}, create: { name: 'Grains & Pasta', icon: '🌾' } }),
    prisma.category.upsert({ where: { name: 'Condiments' }, update: {}, create: { name: 'Condiments', icon: '🧴' } }),
    prisma.category.upsert({ where: { name: 'Snacks' }, update: {}, create: { name: 'Snacks', icon: '🍿' } }),
    prisma.category.upsert({ where: { name: 'Beverages' }, update: {}, create: { name: 'Beverages', icon: '🧃' } }),
    prisma.category.upsert({ where: { name: 'Frozen' }, update: {}, create: { name: 'Frozen', icon: '🧊' } }),
    prisma.category.upsert({ where: { name: 'Other' }, update: {}, create: { name: 'Other', icon: '📦' } }),
  ]);
  console.log(`✅ Created ${categories.length} categories`);

  const adminPassword = await bcrypt.hash('admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pantrypal.local' },
    update: {},
    create: { email: 'admin@pantrypal.local', passwordHash: adminPassword, role: UserRole.ADMIN },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  const userPassword = await bcrypt.hash('user123!', 12);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@pantrypal.local' },
    update: {},
    create: { email: 'demo@pantrypal.local', passwordHash: userPassword, role: UserRole.REGULAR_USER },
  });
  console.log(`✅ Demo user: ${demoUser.email}`);

  const tomatoSoup = await prisma.recipe.create({
    data: {
      title: 'Classic Tomato Soup',
      description: 'A warming simple tomato soup.',
      instructions: '1. Dice onion and garlic.\n2. Sauté in olive oil for 5 min.\n3. Add tomatoes and stock.\n4. Simmer 20 min.\n5. Blend and serve.',
      servings: 4,
      prepTimeMinutes: 30,
      ingredients: {
        create: [
          { ingredientName: 'Tomatoes', quantity: 6, unit: 'pcs' },
          { ingredientName: 'Onion', quantity: 1, unit: 'pcs' },
          { ingredientName: 'Garlic', quantity: 3, unit: 'pcs' },
          { ingredientName: 'Olive Oil', quantity: 2, unit: 'tbsp' },
          { ingredientName: 'Vegetable Stock', quantity: 500, unit: 'ml' },
        ],
      },
    },
  });

  await prisma.recipe.create({
    data: {
      title: 'Pasta Aglio e Olio',
      description: 'Classic Italian pasta with garlic and olive oil.',
      instructions: '1. Cook pasta.\n2. Sauté garlic in olive oil.\n3. Toss with pasta and parsley.\n4. Serve immediately.',
      servings: 2,
      prepTimeMinutes: 20,
      ingredients: {
        create: [
          { ingredientName: 'Spaghetti', quantity: 200, unit: 'g' },
          { ingredientName: 'Garlic', quantity: 4, unit: 'pcs' },
          { ingredientName: 'Olive Oil', quantity: 4, unit: 'tbsp' },
          { ingredientName: 'Parsley', quantity: 1, unit: 'tbsp' },
          { ingredientName: 'Chili Flakes', quantity: 0.5, unit: 'tsp' },
        ],
      },
    },
  });
  console.log(`✅ Created 2 sample recipes`);

  const today = new Date();
  const in2Days = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
  const in10Days = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  await prisma.pantryItem.createMany({
    data: [
      { userId: demoUser.id, categoryId: categories[0].id, name: 'Whole Milk', quantity: 1, unit: 'l', expiryDate: in2Days },
      { userId: demoUser.id, categoryId: categories[1].id, name: 'Tomatoes', quantity: 6, unit: 'pcs', expiryDate: in10Days },
      { userId: demoUser.id, categoryId: categories[1].id, name: 'Onion', quantity: 3, unit: 'pcs', expiryDate: in10Days },
      { userId: demoUser.id, categoryId: categories[1].id, name: 'Garlic', quantity: 1, unit: 'pcs', expiryDate: in10Days },
      { userId: demoUser.id, categoryId: categories[4].id, name: 'Spaghetti', quantity: 500, unit: 'g' },
      { userId: demoUser.id, categoryId: categories[5].id, name: 'Olive Oil', quantity: 750, unit: 'ml' },
      { userId: demoUser.id, categoryId: categories[0].id, name: 'Yogurt', quantity: 500, unit: 'g', expiryDate: yesterday },
    ],
  });
  console.log(`✅ Created demo pantry items`);

  console.log('\n🎉 Seed complete!');
  console.log('   Admin: admin@pantrypal.local / admin123!');
  console.log('   Demo:  demo@pantrypal.local / user123!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
