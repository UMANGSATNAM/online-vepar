import { NextResponse } from 'next/server';
// Shopify-compatible /cart/add.js endpoint
// In a real environment, cart token is managed via cookies.

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, quantity = 1, properties = {} } = body;

    if (!id) {
      return NextResponse.json({ status: 400, message: "Parameter Missing", description: "id is required" }, { status: 400 });
    }

    // Mock returning a Line Item like Shopify
    const mockLineItem = {
      id: parseInt(String(id).replace(/\D/g, '') || '1001'),
      properties,
      quantity,
      variant_id: id,
      key: `${id}:123456`,
      title: "Added Product",
      price: 1000,
      original_price: 1000,
      discounted_price: 1000,
      line_price: 1000 * quantity,
      original_line_price: 1000 * quantity,
      total_discount: 0,
      discounts: [],
      sku: "SKU-123",
      grams: 0,
      vendor: "Mock Vendor",
      taxable: true,
      product_id: 9999,
      product_has_only_default_variant: false,
      gift_card: false,
      final_price: 1000,
      final_line_price: 1000 * quantity,
      url: `/products/mock-product?variant=${id}`,
      featured_image: {
        aspect_ratio: 1,
        alt: "Product Image",
        height: 500,
        url: "https://via.placeholder.com/500",
        width: 500
      },
      image: "https://via.placeholder.com/500",
      handle: "mock-product",
      requires_shipping: true,
      product_type: "Merchandise",
      product_title: "Added Product",
      product_description: "Added product description",
      variant_title: "Default",
      variant_options: ["Default"]
    };

    return NextResponse.json(mockLineItem, { status: 200 });
  } catch (error) {
    console.error('Cart Add Error:', error);
    return NextResponse.json({ status: 500, message: "Internal Server Error" }, { status: 500 });
  }
}
