import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Return empty cart or mock cart
    const mockCart = {
      token: "cart_token_12345",
      note: null,
      attributes: {},
      original_total_price: 0,
      total_price: 0,
      total_discount: 0,
      total_weight: 0,
      item_count: 0,
      items: [],
      requires_shipping: true,
      currency: "INR",
      items_subtotal_price: 0,
      cart_level_discount_applications: []
    };

    return NextResponse.json(mockCart, { status: 200 });
  } catch (error) {
    return NextResponse.json({ status: 500, message: "Internal Server Error" }, { status: 500 });
  }
}
