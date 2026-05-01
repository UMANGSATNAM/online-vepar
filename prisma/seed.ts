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
  await prisma.activityLog.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.page.deleteMany();
  await prisma.discount.deleteMany();
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
        images: JSON.stringify(['https://placehold.co/600x800/10b981/white?text=Banarasi+Silk+Saree', 'https://placehold.co/600x800/059669/white?text=Saree+Detail']),
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
        images: JSON.stringify(['https://placehold.co/600x800/10b981/white?text=Cotton+Printed+Kurta']),
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
        images: JSON.stringify(['https://placehold.co/600x800/10b981/white?text=Bridal+Lehenga', 'https://placehold.co/600x800/059669/white?text=Lehenga+Detail', 'https://placehold.co/600x800/047857/white?text=Lehenga+Closeup']),
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
        images: JSON.stringify(['https://placehold.co/600x800/10b981/white?text=Jhumka+Earrings']),
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
        images: JSON.stringify(['https://placehold.co/600x800/10b981/white?text=Party+Wear+Gown', 'https://placehold.co/600x800/059669/white?text=Gown+Detail']),
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
        images: JSON.stringify(['https://placehold.co/600x800/10b981/white?text=Palazzo+Kurta+Set']),
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
        images: JSON.stringify(['https://placehold.co/600x800/10b981/white?text=Kanchipuram+Saree']),
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
        images: JSON.stringify(['https://placehold.co/600x800/10b981/white?text=Designer+Clutch']),
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
        images: JSON.stringify(['https://placehold.co/600x800/10b981/white?text=Anarkali+Kurta', 'https://placehold.co/600x800/059669/white?text=Kurta+Detail']),
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
        images: JSON.stringify(['https://placehold.co/600x800/10b981/white?text=Mangalsutra']),
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
    prisma.product.create({
      data: {
        name: 'Zari Work Dupatta',
        slug: 'zari-work-dupatta',
        description: 'Elegant zari work dupatta perfect for special occasions. Lightweight and beautifully crafted.',
        price: 999,
        comparePrice: 1499,
        cost: 400,
        images: JSON.stringify(['https://placehold.co/600x800/10b981/white?text=Zari+Dupatta']),
        category: 'Accessories',
        tags: JSON.stringify(['dupatta', 'zari', 'wedding']),
        sku: 'ACC-004',
        stock: 3,
        trackInventory: true,
        weight: 0.3,
        status: 'active',
        featured: false,
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

  // 8. Create discounts
  const now = new Date();
  const discounts = await Promise.all([
    prisma.discount.create({
      data: {
        code: 'WELCOME10',
        name: 'Welcome Discount',
        description: '10% off for new customers on their first order',
        type: 'percentage',
        value: 10,
        minOrderAmount: 500,
        maxDiscount: 1000,
        usageLimit: 100,
        usedCount: 23,
        perCustomerLimit: 1,
        appliesTo: 'all',
        startsAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        endsAt: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
        isActive: true,
        storeId: store.id,
      },
    }),
    prisma.discount.create({
      data: {
        code: 'SUMMER500',
        name: 'Summer Sale',
        description: 'Flat ₹500 off on orders above ₹2000',
        type: 'fixed_amount',
        value: 500,
        minOrderAmount: 2000,
        usageLimit: 50,
        usedCount: 12,
        perCustomerLimit: 2,
        appliesTo: 'all',
        startsAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        endsAt: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
        isActive: true,
        storeId: store.id,
      },
    }),
    prisma.discount.create({
      data: {
        code: 'BRIDAL20',
        name: 'Bridal Collection Discount',
        description: '20% off on all bridal collection items',
        type: 'percentage',
        value: 20,
        minOrderAmount: 5000,
        maxDiscount: 3000,
        usageLimit: 30,
        usedCount: 8,
        perCustomerLimit: 1,
        appliesTo: 'specific_categories',
        applicableIds: JSON.stringify(['Lehengas', 'Sarees']),
        startsAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        endsAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
        storeId: store.id,
      },
    }),
    prisma.discount.create({
      data: {
        code: 'FLASH25',
        name: 'Flash Sale',
        description: '25% off flash sale - limited time only!',
        type: 'percentage',
        value: 25,
        maxDiscount: 2000,
        usageLimit: 20,
        usedCount: 20,
        perCustomerLimit: 1,
        appliesTo: 'all',
        startsAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        endsAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        isActive: false,
        storeId: store.id,
      },
    }),
    prisma.discount.create({
      data: {
        code: 'DIWALI15',
        name: 'Diwali Special',
        description: '15% off for Diwali celebrations',
        type: 'percentage',
        value: 15,
        minOrderAmount: 1000,
        maxDiscount: 1500,
        usageLimit: 200,
        usedCount: 0,
        perCustomerLimit: 3,
        appliesTo: 'all',
        startsAt: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
        endsAt: new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000),
        isActive: true,
        storeId: store.id,
      },
    }),
  ]);
  console.log('✅ Created', discounts.length, 'discounts');

  // 9. Create reviews
  const reviews = await Promise.all([
    prisma.review.create({
      data: {
        productId: products[0].id,
        storeId: store.id,
        customerName: 'Priya Sharma',
        customerEmail: 'priya.sharma@email.com',
        rating: 5,
        title: 'Absolutely gorgeous saree!',
        content: 'The Banarasi silk is of exceptional quality. The zari work is intricate and the draping is perfect. I received so many compliments at my friend\'s wedding. Worth every penny!',
        isVerified: true,
        isApproved: true,
        response: 'Thank you so much, Priya! We\'re thrilled you loved the saree. The Banarasi silk collection is one of our proudest offerings.',
        respondedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.review.create({
      data: {
        productId: products[1].id,
        storeId: store.id,
        customerName: 'Kavita Nair',
        customerEmail: 'kavita.nair@email.com',
        rating: 4,
        title: 'Comfortable and stylish',
        content: 'The cotton quality is great and the print is beautiful. Very comfortable for daily wear. Only giving 4 stars because the color is slightly different from what\'s shown in the pictures, but still lovely.',
        isVerified: true,
        isApproved: true,
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.review.create({
      data: {
        productId: products[2].id,
        storeId: store.id,
        customerName: 'Meera Reddy',
        customerEmail: 'meera.reddy@email.com',
        rating: 5,
        title: 'Dream lehenga for my wedding!',
        content: 'This lehenga exceeded all my expectations. The embroidery is breathtaking and the fit is perfect. The dupatta is lightweight yet rich looking. I felt like a queen on my wedding day. Thank you Vepar Fashion!',
        isVerified: true,
        isApproved: true,
        response: 'Congratulations on your wedding, Meera! We\'re honored you chose our lehenga for your special day. Wishing you a lifetime of happiness!',
        respondedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.review.create({
      data: {
        productId: products[3].id,
        storeId: store.id,
        customerName: 'Sneha Gupta',
        customerEmail: 'sneha.gupta@email.com',
        rating: 3,
        title: 'Good but clasp is delicate',
        content: 'The jhumka design is beautiful and looks exactly like the photo. However, the clasp feels a bit delicate. I\'m being very careful while wearing them. Otherwise, the kundan work is impressive for this price.',
        isVerified: true,
        isApproved: true,
        createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.review.create({
      data: {
        productId: products[0].id,
        storeId: store.id,
        customerName: 'Ananya Patel',
        customerEmail: 'ananya.patel@email.com',
        rating: 5,
        title: 'Best saree purchase online',
        content: 'I was skeptical about buying a Banarasi saree online, but Vepar Fashion delivered exactly what was promised. The packaging was premium and the saree came with a certificate of authenticity. Will definitely buy again!',
        isVerified: true,
        isApproved: true,
        createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.review.create({
      data: {
        productId: products[5].id,
        storeId: store.id,
        customerName: 'Rahul Verma',
        customerEmail: 'rahul.verma@email.com',
        rating: 4,
        title: 'Great kurta set for the price',
        content: 'Bought this for my wife and she absolutely loves it. The embroidery work is detailed and the palazzo fit is great. The dupatta could be a bit longer, but overall an excellent purchase.',
        isVerified: true,
        isApproved: true,
        response: 'Thank you for the feedback, Rahul! We appreciate your note about the dupatta length and will take it into consideration for future designs.',
        respondedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.review.create({
      data: {
        productId: products[4].id,
        storeId: store.id,
        customerName: 'Divya Kapoor',
        customerEmail: 'divya.kapoor@email.com',
        rating: 2,
        title: 'Not what I expected',
        content: 'The gown looks nice in photos but the chiffon quality is not great. The sequin work started coming off after one wash. Disappointed with the quality at this price point.',
        isVerified: false,
        isApproved: false,
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.review.create({
      data: {
        productId: products[9].id,
        storeId: store.id,
        customerName: 'Lakshmi Iyer',
        customerEmail: 'lakshmi.iyer@email.com',
        rating: 5,
        title: 'Stunning mangalsutra',
        content: 'This mangalsutra is a perfect blend of traditional and modern design. The black beads are genuine and the gold pendant has a beautiful shine. It came in a lovely velvet box too. Highly recommend!',
        isVerified: true,
        isApproved: true,
        createdAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.review.create({
      data: {
        productId: products[6].id,
        storeId: store.id,
        customerName: 'Arun Kumar',
        customerEmail: 'arun.kumar@email.com',
        rating: 5,
        title: 'Authentic Kanchipuram',
        content: 'My mother has been wearing Kanchipuram sarees for decades and she confirmed this is the real deal. The temple border design is traditional and the silk is heavy and lustrous. Fast delivery too!',
        isVerified: true,
        isApproved: false,
        createdAt: new Date(now.getTime() - 0.5 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.review.create({
      data: {
        productId: products[7].id,
        storeId: store.id,
        customerName: 'Pooja Mehta',
        customerEmail: 'pooja.mehta@email.com',
        rating: 1,
        title: 'Very cheap quality',
        content: 'The mirror work is coming apart and the bag smells like chemicals. Not worth ₹1599 at all. Returning this immediately.',
        isVerified: false,
        isApproved: false,
        createdAt: new Date(now.getTime() - 0.2 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);
  console.log('✅ Created', reviews.length, 'reviews');

  // 11. Create product variants
  const productVariants = await Promise.all([
    // Banarasi Silk Saree (products[0]) - Color variants
    prisma.productVariant.create({
      data: {
        productId: products[0].id,
        storeId: store.id,
        name: 'Red / Free Size',
        sku: 'SAR-001-RED',
        price: 5999,
        comparePrice: 8999,
        stock: 20,
        options: JSON.stringify({ Color: 'Red', Size: 'Free Size' }),
        position: 0,
        isActive: true,
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: products[0].id,
        storeId: store.id,
        name: 'Blue / Free Size',
        sku: 'SAR-001-BLUE',
        price: 6499,
        comparePrice: 9499,
        stock: 15,
        options: JSON.stringify({ Color: 'Blue', Size: 'Free Size' }),
        position: 1,
        isActive: true,
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: products[0].id,
        storeId: store.id,
        name: 'Maroon / Free Size',
        sku: 'SAR-001-MAROON',
        price: 5999,
        comparePrice: 8999,
        stock: 15,
        options: JSON.stringify({ Color: 'Maroon', Size: 'Free Size' }),
        position: 2,
        isActive: true,
      },
    }),
    // Cotton Printed Kurta (products[1]) - Size variants
    prisma.productVariant.create({
      data: {
        productId: products[1].id,
        storeId: store.id,
        name: 'Size S',
        sku: 'KUR-001-S',
        price: null,
        stock: 25,
        options: JSON.stringify({ Size: 'S' }),
        position: 0,
        isActive: true,
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: products[1].id,
        storeId: store.id,
        name: 'Size M',
        sku: 'KUR-001-M',
        price: null,
        stock: 35,
        options: JSON.stringify({ Size: 'M' }),
        position: 1,
        isActive: true,
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: products[1].id,
        storeId: store.id,
        name: 'Size L',
        sku: 'KUR-001-L',
        price: null,
        stock: 25,
        options: JSON.stringify({ Size: 'L' }),
        position: 2,
        isActive: true,
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: products[1].id,
        storeId: store.id,
        name: 'Size XL',
        sku: 'KUR-001-XL',
        price: 1399,
        comparePrice: 2099,
        stock: 15,
        options: JSON.stringify({ Size: 'XL' }),
        position: 3,
        isActive: true,
      },
    }),
    // Bridal Lehenga (products[2]) - Color/Size combos
    prisma.productVariant.create({
      data: {
        productId: products[2].id,
        storeId: store.id,
        name: 'Red / Small',
        sku: 'LEH-001-RED-S',
        price: 15999,
        comparePrice: 24999,
        stock: 5,
        options: JSON.stringify({ Color: 'Red', Size: 'Small' }),
        position: 0,
        isActive: true,
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: products[2].id,
        storeId: store.id,
        name: 'Red / Medium',
        sku: 'LEH-001-RED-M',
        price: 15999,
        comparePrice: 24999,
        stock: 5,
        options: JSON.stringify({ Color: 'Red', Size: 'Medium' }),
        position: 1,
        isActive: true,
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: products[2].id,
        storeId: store.id,
        name: 'Maroon / Medium',
        sku: 'LEH-001-MAR-M',
        price: 16499,
        comparePrice: 25999,
        stock: 3,
        options: JSON.stringify({ Color: 'Maroon', Size: 'Medium' }),
        position: 2,
        isActive: true,
      },
    }),
    // Embroidered Palazzo Kurta Set (products[5]) - Color/Size combos
    prisma.productVariant.create({
      data: {
        productId: products[5].id,
        storeId: store.id,
        name: 'White / M',
        sku: 'KUR-002-WH-M',
        price: null,
        stock: 20,
        options: JSON.stringify({ Color: 'White', Size: 'M' }),
        position: 0,
        isActive: true,
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: products[5].id,
        storeId: store.id,
        name: 'White / L',
        sku: 'KUR-002-WH-L',
        price: null,
        stock: 20,
        options: JSON.stringify({ Color: 'White', Size: 'L' }),
        position: 1,
        isActive: true,
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: products[5].id,
        storeId: store.id,
        name: 'Pink / M',
        sku: 'KUR-002-PK-M',
        price: 2299,
        comparePrice: 3699,
        stock: 10,
        options: JSON.stringify({ Color: 'Pink', Size: 'M' }),
        position: 2,
        isActive: true,
      },
    }),
    // Chiffon Party Wear Gown (products[4]) - Size variants
    prisma.productVariant.create({
      data: {
        productId: products[4].id,
        storeId: store.id,
        name: 'Size S',
        sku: 'WES-001-S',
        price: null,
        stock: 10,
        options: JSON.stringify({ Size: 'S' }),
        position: 0,
        isActive: true,
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: products[4].id,
        storeId: store.id,
        name: 'Size M',
        sku: 'WES-001-M',
        price: null,
        stock: 12,
        options: JSON.stringify({ Size: 'M' }),
        position: 1,
        isActive: true,
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: products[4].id,
        storeId: store.id,
        name: 'Size L',
        sku: 'WES-001-L',
        price: null,
        stock: 8,
        options: JSON.stringify({ Size: 'L' }),
        position: 2,
        isActive: true,
      },
    }),
  ]);
  console.log('✅ Created', productVariants.length, 'product variants');

  // 12. Create activity logs
  const activityLogsData = [
    { action: 'product.created', entity: 'product', entityId: products[0].id, entityName: 'Banarasi Silk Saree', details: { price: 5999, status: 'active' }, daysAgo: 6 },
    { action: 'product.created', entity: 'product', entityId: products[1].id, entityName: 'Cotton Printed Kurta', details: { price: 1299, status: 'active' }, daysAgo: 6 },
    { action: 'product.created', entity: 'product', entityId: products[2].id, entityName: 'Bridal Lehenga Set', details: { price: 15999, status: 'active' }, daysAgo: 5 },
    { action: 'customer.created', entity: 'customer', entityId: customers[0].id, entityName: 'Priya Sharma', details: { email: 'priya.sharma@email.com', city: 'Gurugram' }, daysAgo: 5 },
    { action: 'customer.created', entity: 'customer', entityId: customers[1].id, entityName: 'Ananya Patel', details: { email: 'ananya.patel@email.com', city: 'Mumbai' }, daysAgo: 5 },
    { action: 'order.created', entity: 'order', entityId: undefined, entityName: 'OV-20250301-0001', details: { customerName: 'Priya Sharma', total: 8139.64 }, daysAgo: 4 },
    { action: 'order.status_updated', entity: 'order', entityId: undefined, entityName: 'OV-20250301-0001', details: { from: 'pending', to: 'confirmed' }, daysAgo: 3 },
    { action: 'discount.created', entity: 'discount', entityId: discounts[0].id, entityName: 'WELCOME10 - Welcome Discount', details: { type: 'percentage', value: 10 }, daysAgo: 4 },
    { action: 'discount.created', entity: 'discount', entityId: discounts[1].id, entityName: 'SUMMER500 - Summer Sale', details: { type: 'fixed_amount', value: 500 }, daysAgo: 3 },
    { action: 'product.updated', entity: 'product', entityId: products[0].id, entityName: 'Banarasi Silk Saree', details: { updatedFields: ['price', 'stock'] }, daysAgo: 2 },
    { action: 'order.status_updated', entity: 'order', entityId: undefined, entityName: 'OV-20250301-0001', details: { from: 'confirmed', to: 'shipped' }, daysAgo: 2 },
    { action: 'order.fulfillment_updated', entity: 'order', entityId: undefined, entityName: 'OV-20250301-0001', details: { from: 'unfulfilled', to: 'fulfilled' }, daysAgo: 1 },
    { action: 'discount.created', entity: 'discount', entityId: discounts[2].id, entityName: 'BRIDAL20 - Bridal Collection Discount', details: { type: 'percentage', value: 20 }, daysAgo: 1 },
    { action: 'product.created', entity: 'product', entityId: products[5].id, entityName: 'Embroidered Palazzo Kurta Set', details: { price: 2199, status: 'active' }, daysAgo: 0.5 },
    { action: 'customer.created', entity: 'customer', entityId: customers[2].id, entityName: 'Rahul Verma', details: { email: 'rahul.verma@email.com', city: 'Delhi' }, daysAgo: 0.3 },
    { action: 'order.created', entity: 'order', entityId: undefined, entityName: 'OV-20250304-0002', details: { customerName: 'Rahul Verma', total: 5759.46 }, daysAgo: 0.2 },
    { action: 'discount.deactivated', entity: 'discount', entityId: discounts[3].id, entityName: 'FLASH25 - Flash Sale', details: { isActive: false }, daysAgo: 0.1 },
    { action: 'product.updated', entity: 'product', entityId: products[9].id, entityName: 'Mangalsutra Necklace', details: { updatedFields: ['stock'] }, daysAgo: 0.05 },
  ];

  for (const logData of activityLogsData) {
    await prisma.activityLog.create({
      data: {
        storeId: store.id,
        userId: user.id,
        userName: user.name,
        action: logData.action,
        entity: logData.entity,
        entityId: logData.entityId || null,
        entityName: logData.entityName,
        details: logData.details ? JSON.stringify(logData.details) : null,
        createdAt: new Date(now.getTime() - logData.daysAgo * 24 * 60 * 60 * 1000),
      },
    });
  }
  console.log('✅ Created', activityLogsData.length, 'activity logs');

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
