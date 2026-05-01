import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Simple hash function (same as in src/lib/auth.ts)
function hashPassword(password: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'ov_salt_2024');
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36) + '_' + Buffer.from(password + 'ov_salt_2024').toString('base64');
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function generateOrderNumber(): string {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `OV-${dateStr}-${random}`;
}

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.page.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create demo user
  const user = await prisma.user.create({
    data: {
      email: 'demo@onlinevepar.com',
      password: hashPassword('demo123'),
      name: 'Demo User',
      role: 'owner',
    },
  });
  console.log('✅ Created demo user:', user.email);

  // 2. Create demo store
  const store = await prisma.store.create({
    data: {
      name: 'Vepar Fashion Store',
      slug: 'vepar-fashion-store',
      description: 'A premium fashion store showcasing the latest trends in Indian and Western wear.',
      theme: 'modern',
      primaryColor: '#10b981',
      currency: 'INR',
      domain: 'vepar-fashion.onlinevepar.com',
      isActive: true,
      ownerId: user.id,
    },
  });
  console.log('✅ Created demo store:', store.name);

  // 3. Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Sarees',
        slug: 'sarees',
        storeId: store.id,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Kurtas',
        slug: 'kurtas',
        storeId: store.id,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Lehengas',
        slug: 'lehengas',
        storeId: store.id,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Accessories',
        slug: 'accessories',
        storeId: store.id,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Western Wear',
        slug: 'western-wear',
        storeId: store.id,
      },
    }),
  ]);
  console.log('✅ Created', categories.length, 'categories');

  // 4. Create products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Banarasi Silk Saree',
        slug: 'banarasi-silk-saree',
        description: 'Exquisite Banarasi silk saree with intricate gold zari work. Perfect for weddings and special occasions.',
        price: 5999,
        comparePrice: 8999,
        cost: 2500,
        images: JSON.stringify(['/images/saree-1.jpg', '/images/saree-1-alt.jpg']),
        category: 'Sarees',
        tags: JSON.stringify(['silk', 'wedding', 'banarasi', 'premium']),
        sku: 'SAR-001',
        stock: 50,
        trackInventory: true,
        weight: 0.8,
        status: 'active',
        featured: true,
        storeId: store.id,
        categoryId: categories[0].id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Cotton Printed Kurta',
        slug: 'cotton-printed-kurta',
        description: 'Comfortable cotton kurta with beautiful print patterns. Ideal for daily wear and casual outings.',
        price: 1299,
        comparePrice: 1999,
        cost: 500,
        images: JSON.stringify(['/images/kurta-1.jpg']),
        category: 'Kurtas',
        tags: JSON.stringify(['cotton', 'casual', 'printed']),
        sku: 'KUR-001',
        stock: 100,
        trackInventory: true,
        weight: 0.4,
        status: 'active',
        featured: true,
        storeId: store.id,
        categoryId: categories[1].id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Bridal Lehenga Set',
        slug: 'bridal-lehenga-set',
        description: 'Stunning bridal lehenga with heavy embroidery and dupatta. A masterpiece for your special day.',
        price: 15999,
        comparePrice: 24999,
        cost: 7000,
        images: JSON.stringify(['/images/lehenga-1.jpg', '/images/lehenga-1-alt.jpg', '/images/lehenga-1-detail.jpg']),
        category: 'Lehengas',
        tags: JSON.stringify(['bridal', 'embroidered', 'premium', 'wedding']),
        sku: 'LEH-001',
        stock: 15,
        trackInventory: true,
        weight: 2.5,
        status: 'active',
        featured: true,
        storeId: store.id,
        categoryId: categories[2].id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Gold Plated Jhumka Earrings',
        slug: 'gold-plated-jhumka-earrings',
        description: 'Beautiful gold plated jhumka earrings with kundan work. Traditional yet elegant.',
        price: 899,
        comparePrice: 1499,
        cost: 300,
        images: JSON.stringify(['/images/jhumka-1.jpg']),
        category: 'Accessories',
        tags: JSON.stringify(['jhumka', 'gold-plated', 'traditional']),
        sku: 'ACC-001',
        stock: 200,
        trackInventory: true,
        weight: 0.05,
        status: 'active',
        featured: false,
        storeId: store.id,
        categoryId: categories[3].id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Chiffon Party Wear Gown',
        slug: 'chiffon-party-wear-gown',
        description: 'Elegant chiffon gown for parties and events. Flowy design with sequin work.',
        price: 3499,
        comparePrice: 4999,
        cost: 1500,
        images: JSON.stringify(['/images/gown-1.jpg', '/images/gown-1-alt.jpg']),
        category: 'Western Wear',
        tags: JSON.stringify(['party', 'chiffon', 'sequin', 'gown']),
        sku: 'WES-001',
        stock: 30,
        trackInventory: true,
        weight: 0.6,
        status: 'active',
        featured: false,
        storeId: store.id,
        categoryId: categories[4].id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Embroidered Palazzo Kurta Set',
        slug: 'embroidered-palazzo-kurta-set',
        description: 'Beautiful embroidered kurta with palazzo pants and dupatta set.',
        price: 2199,
        comparePrice: 3499,
        cost: 900,
        images: JSON.stringify(['/images/kurta-set-1.jpg']),
        category: 'Kurtas',
        tags: JSON.stringify(['embroidered', 'palazzo', 'set']),
        sku: 'KUR-002',
        stock: 60,
        trackInventory: true,
        weight: 0.7,
        status: 'active',
        featured: true,
        storeId: store.id,
        categoryId: categories[1].id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Kanchipuram Silk Saree',
        slug: 'kanchipuram-silk-saree',
        description: 'Authentic Kanchipuram silk saree with temple border design. South Indian tradition at its best.',
        price: 8499,
        comparePrice: 12999,
        cost: 4000,
        images: JSON.stringify(['/images/saree-2.jpg']),
        category: 'Sarees',
        tags: JSON.stringify(['silk', 'kanchipuram', 'traditional']),
        sku: 'SAR-002',
        stock: 25,
        trackInventory: true,
        weight: 1.0,
        status: 'active',
        featured: false,
        storeId: store.id,
        categoryId: categories[0].id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Designer Clutch Bag',
        slug: 'designer-clutch-bag',
        description: 'Premium designer clutch with mirror work and tassel detail. Perfect for weddings.',
        price: 1599,
        comparePrice: 2499,
        cost: 600,
        images: JSON.stringify(['/images/clutch-1.jpg']),
        category: 'Accessories',
        tags: JSON.stringify(['clutch', 'designer', 'mirror-work']),
        sku: 'ACC-002',
        stock: 80,
        trackInventory: true,
        weight: 0.2,
        status: 'active',
        featured: false,
        storeId: store.id,
        categoryId: categories[3].id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Georgette Anarkali Kurta',
        slug: 'georgette-anarkali-kurta',
        description: 'Flowing georgette anarkali kurta with delicate embroidery. Graceful and elegant.',
        price: 2899,
        comparePrice: 3999,
        cost: 1200,
        images: JSON.stringify(['/images/anarkali-1.jpg', '/images/anarkali-1-alt.jpg']),
        category: 'Kurtas',
        tags: JSON.stringify(['anarkali', 'georgette', 'embroidered']),
        sku: 'KUR-003',
        stock: 40,
        trackInventory: true,
        weight: 0.5,
        status: 'draft',
        featured: false,
        storeId: store.id,
        categoryId: categories[1].id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Mangalsutra Necklace',
        slug: 'mangalsutra-necklace',
        description: 'Traditional mangalsutra necklace with black beads and gold pendant.',
        price: 4999,
        comparePrice: 6999,
        cost: 2000,
        images: JSON.stringify(['/images/mangalsutra-1.jpg']),
        category: 'Accessories',
        tags: JSON.stringify(['mangalsutra', 'traditional', 'gold']),
        sku: 'ACC-003',
        stock: 35,
        trackInventory: true,
        weight: 0.03,
        status: 'active',
        featured: true,
        storeId: store.id,
        categoryId: categories[3].id,
      },
    }),
  ]);
  console.log('✅ Created', products.length, 'products');

  // 5. Create customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: 'Priya Sharma',
        email: 'priya.sharma@email.com',
        phone: '+91 98765 43210',
        address: '42, MG Road, Sector 15',
        city: 'Gurugram',
        state: 'Haryana',
        zip: '122001',
        totalOrders: 3,
        totalSpent: 15297,
        storeId: store.id,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Ananya Patel',
        email: 'ananya.patel@email.com',
        phone: '+91 87654 32109',
        address: '15, Park Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        zip: '400001',
        totalOrders: 5,
        totalSpent: 32495,
        storeId: store.id,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Rahul Verma',
        email: 'rahul.verma@email.com',
        phone: '+91 76543 21098',
        address: '78, Civil Lines',
        city: 'Delhi',
        state: 'Delhi',
        zip: '110054',
        totalOrders: 2,
        totalSpent: 8998,
        storeId: store.id,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Meera Reddy',
        email: 'meera.reddy@email.com',
        phone: '+91 65432 10987',
        address: '23, Jubilee Hills',
        city: 'Hyderabad',
        state: 'Telangana',
        zip: '500033',
        totalOrders: 1,
        totalSpent: 15999,
        storeId: store.id,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Kavita Nair',
        email: 'kavita.nair@email.com',
        phone: '+91 54321 09876',
        address: '56, MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        zip: '560001',
        totalOrders: 4,
        totalSpent: 21696,
        storeId: store.id,
      },
    }),
  ]);
  console.log('✅ Created', customers.length, 'customers');

  // 6. Create orders
  const ordersData = [
    {
      customerName: 'Priya Sharma',
      customerEmail: 'priya.sharma@email.com',
      customerPhone: '+91 98765 43210',
      status: 'delivered',
      paymentStatus: 'paid',
      fulfillmentStatus: 'fulfilled',
      items: [
        { productId: products[0].id, name: 'Banarasi Silk Saree', price: 5999, quantity: 1, total: 5999 },
        { productId: products[3].id, name: 'Gold Plated Jhumka Earrings', price: 899, quantity: 1, total: 899 },
      ],
      subtotal: 6898,
      tax: 1241.64,
      shipping: 0,
      discount: 0,
      total: 8139.64,
    },
    {
      customerName: 'Ananya Patel',
      customerEmail: 'ananya.patel@email.com',
      customerPhone: '+91 87654 32109',
      status: 'shipped',
      paymentStatus: 'paid',
      fulfillmentStatus: 'fulfilled',
      items: [
        { productId: products[2].id, name: 'Bridal Lehenga Set', price: 15999, quantity: 1, total: 15999 },
      ],
      subtotal: 15999,
      tax: 2879.82,
      shipping: 0,
      discount: 1000,
      total: 17878.82,
    },
    {
      customerName: 'Rahul Verma',
      customerEmail: 'rahul.verma@email.com',
      customerPhone: '+91 76543 21098',
      status: 'confirmed',
      paymentStatus: 'paid',
      fulfillmentStatus: 'unfulfilled',
      items: [
        { productId: products[1].id, name: 'Cotton Printed Kurta', price: 1299, quantity: 2, total: 2598 },
        { productId: products[5].id, name: 'Embroidered Palazzo Kurta Set', price: 2199, quantity: 1, total: 2199 },
      ],
      subtotal: 4797,
      tax: 863.46,
      shipping: 99,
      discount: 0,
      total: 5759.46,
    },
    {
      customerName: 'Meera Reddy',
      customerEmail: 'meera.reddy@email.com',
      customerPhone: '+91 65432 10987',
      status: 'pending',
      paymentStatus: 'unpaid',
      fulfillmentStatus: 'unfulfilled',
      items: [
        { productId: products[2].id, name: 'Bridal Lehenga Set', price: 15999, quantity: 1, total: 15999 },
      ],
      subtotal: 15999,
      tax: 2879.82,
      shipping: 0,
      discount: 0,
      total: 18878.82,
    },
    {
      customerName: 'Kavita Nair',
      customerEmail: 'kavita.nair@email.com',
      customerPhone: '+91 54321 09876',
      status: 'processing',
      paymentStatus: 'paid',
      fulfillmentStatus: 'partial',
      items: [
        { productId: products[4].id, name: 'Chiffon Party Wear Gown', price: 3499, quantity: 1, total: 3499 },
        { productId: products[7].id, name: 'Designer Clutch Bag', price: 1599, quantity: 1, total: 1599 },
        { productId: products[9].id, name: 'Mangalsutra Necklace', price: 4999, quantity: 1, total: 4999 },
      ],
      subtotal: 10097,
      tax: 1817.46,
      shipping: 0,
      discount: 500,
      total: 11414.46,
    },
    {
      customerName: 'Ananya Patel',
      customerEmail: 'ananya.patel@email.com',
      customerPhone: '+91 87654 32109',
      status: 'delivered',
      paymentStatus: 'paid',
      fulfillmentStatus: 'fulfilled',
      items: [
        { productId: products[0].id, name: 'Banarasi Silk Saree', price: 5999, quantity: 1, total: 5999 },
      ],
      subtotal: 5999,
      tax: 1079.82,
      shipping: 0,
      discount: 0,
      total: 7078.82,
    },
    {
      customerName: 'Priya Sharma',
      customerEmail: 'priya.sharma@email.com',
      customerPhone: '+91 98765 43210',
      status: 'cancelled',
      paymentStatus: 'refunded',
      fulfillmentStatus: 'unfulfilled',
      items: [
        { productId: products[6].id, name: 'Kanchipuram Silk Saree', price: 8499, quantity: 1, total: 8499 },
      ],
      subtotal: 8499,
      tax: 1529.82,
      shipping: 0,
      discount: 0,
      total: 10028.82,
    },
    {
      customerName: 'Kavita Nair',
      customerEmail: 'kavita.nair@email.com',
      customerPhone: '+91 54321 09876',
      status: 'delivered',
      paymentStatus: 'paid',
      fulfillmentStatus: 'fulfilled',
      items: [
        { productId: products[1].id, name: 'Cotton Printed Kurta', price: 1299, quantity: 1, total: 1299 },
        { productId: products[8].id, name: 'Georgette Anarkali Kurta', price: 2899, quantity: 1, total: 2899 },
      ],
      subtotal: 4198,
      tax: 755.64,
      shipping: 49,
      discount: 0,
      total: 5002.64,
    },
  ];

  for (const orderData of ordersData) {
    const orderNumber = generateOrderNumber();
    await prisma.order.create({
      data: {
        orderNumber,
        status: orderData.status,
        paymentStatus: orderData.paymentStatus,
        fulfillmentStatus: orderData.fulfillmentStatus,
        subtotal: orderData.subtotal,
        tax: orderData.tax,
        shipping: orderData.shipping,
        discount: orderData.discount,
        total: orderData.total,
        currency: 'INR',
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone,
        storeId: store.id,
        userId: user.id,
        items: {
          create: orderData.items.map(item => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            total: item.total,
          })),
        },
      },
    });
  }
  console.log('✅ Created', ordersData.length, 'orders');

  // 7. Create pages
  const pages = await Promise.all([
    prisma.page.create({
      data: {
        title: 'About Us',
        slug: 'about-us',
        content: 'Welcome to Vepar Fashion Store! We bring you the finest collection of Indian ethnic wear and accessories. Our curated selection features handcrafted sarees, kurtas, lehengas, and more from skilled artisans across India.',
        type: 'page',
        published: true,
        storeId: store.id,
      },
    }),
    prisma.page.create({
      data: {
        title: 'Contact Us',
        slug: 'contact-us',
        content: 'Get in touch with us:\n\nEmail: hello@veparfashion.com\nPhone: +91 12345 67890\nAddress: 42, Fashion Street, Mumbai, Maharashtra 400001',
        type: 'page',
        published: true,
        storeId: store.id,
      },
    }),
    prisma.page.create({
      data: {
        title: 'Shipping Policy',
        slug: 'shipping-policy',
        content: 'We offer free shipping on orders above ₹2000. Standard delivery takes 5-7 business days. Express delivery is available at an additional cost.',
        type: 'page',
        published: true,
        storeId: store.id,
      },
    }),
    prisma.page.create({
      data: {
        title: 'Return Policy',
        slug: 'return-policy',
        content: 'We accept returns within 7 days of delivery. Items must be unused and in original packaging. Refunds are processed within 5-7 business days.',
        type: 'page',
        published: true,
        storeId: store.id,
      },
    }),
    prisma.page.create({
      data: {
        title: 'Wedding Season Collection 2024',
        slug: 'wedding-season-collection-2024',
        content: 'Discover our exclusive wedding season collection featuring the latest trends in bridal wear. From traditional Banarasi sarees to modern bridal lehengas, we have everything to make your special day unforgettable.',
        type: 'blog',
        published: true,
        storeId: store.id,
      },
    }),
    prisma.page.create({
      data: {
        title: 'Festive Kurta Guide',
        slug: 'festive-kurta-guide',
        content: 'Not sure which kurta to pick for the upcoming festive season? Our comprehensive guide covers everything from fabric choices to color trends for Diwali, Navratri, and more.',
        type: 'blog',
        published: false,
        storeId: store.id,
      },
    }),
  ]);
  console.log('✅ Created', pages.length, 'pages');

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📋 Demo credentials:');
  console.log('   Email: demo@onlinevepar.com');
  console.log('   Password: demo123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
