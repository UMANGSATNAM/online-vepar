import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { updates, line, quantity } = body;

    // Simulate Shopify's /cart/update.js behavior
    const mockCart = {
      token: "cart_token_12345",
      note: null,
      attributes: {},
      original_total_price: 2000,
      total_price: 2000,
      total_discount: 0,
      total_weight: 0,
      item_count: 2,
      items: [
        {
          id: 1001,
          quantity: quantity !== undefined ? quantity : 2,
          variant_id: 1001,
          key: "1001:123456",
          title: "Updated Product",
          price: 1000,
          original_price: 1000,
          line_price: 1000 * (quantity !== undefined ? quantity : 2),
          url: "/products/mock-product",
          image: "https://via.placeholder.com/500",
          handle: "mock-product",
        }
      ],
      requires_shipping: true,
      currency: "INR",
      items_subtotal_price: 2000,
      cart_level_discount_applications: []
    };

    return NextResponse.json(mockCart, { status: 200 });
  } catch (error) {
    console.error('Cart Update Error:', error);
    return NextResponse.json({ status: 500, message: "Internal Server Error" }, { status: 500 });
  }
}
