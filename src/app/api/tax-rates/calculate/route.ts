import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

interface TaxRateRow {
  id: string;
  name: string;
  rate: number;
  country: string | null;
  state: string | null;
  city: string | null;
  zipCode: string | null;
  isCompound: number | boolean;
  priority: number;
  isActive: number | boolean;
  storeId: string;
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { storeId, subtotal, shippingAddress } = body;

    if (!storeId || subtotal === undefined) {
      return NextResponse.json(
        { error: 'storeId and subtotal are required' },
        { status: 400 }
      );
    }

    if (subtotal < 0) {
      return NextResponse.json(
        { error: 'Subtotal must be non-negative' },
        { status: 400 }
      );
    }

    // Verify user owns this store
    const store = await db.store.findFirst({
      where: { id: storeId, ownerId: user.id },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Parse shipping address
    const address = shippingAddress || {};
    const country = address.country || null;
    const state = address.state || null;
    const city = address.city || null;
    const zipCode = address.zipCode || address.zip || null;

    // Get applicable tax rates for this store
    let taxRates: TaxRateRow[];
    try {
      taxRates = await db.taxRate.findMany({
        where: {
          storeId,
          isActive: true,
        },
        orderBy: { priority: 'desc' },
      }) as TaxRateRow[];
    } catch {
      // Fallback to raw SQL
      taxRates = await db.$queryRawUnsafe(
        `SELECT * FROM TaxRate WHERE storeId = ? AND isActive = 1 ORDER BY priority DESC`,
        storeId
      ) as TaxRateRow[];
    }

    // Filter tax rates that match the shipping address
    const applicableRates = taxRates.filter((taxRate) => {
      // If no region specified, it's a global tax rate that applies everywhere
      if (!taxRate.country && !taxRate.state && !taxRate.city && !taxRate.zipCode) {
        return true;
      }

      // Match by country
      if (taxRate.country && taxRate.country !== country) {
        return false;
      }

      // Match by state
      if (taxRate.state && taxRate.state !== state) {
        return false;
      }

      // Match by city
      if (taxRate.city && taxRate.city !== city) {
        return false;
      }

      // Match by zip code
      if (taxRate.zipCode && taxRate.zipCode !== zipCode) {
        return false;
      }

      return true;
    });

    // Calculate tax amount
    let totalTax = 0;
    const appliedTaxes: Array<{
      id: string;
      name: string;
      rate: number;
      amount: number;
      isCompound: boolean;
    }> = [];

    // Sort by priority (highest first) - already done by query
    // First pass: non-compound taxes
    const nonCompoundRates = applicableRates.filter((r) => !r.isCompound);
    const compoundRates = applicableRates.filter((r) => r.isCompound);

    // Calculate non-compound taxes based on subtotal
    let runningBase = subtotal;
    for (const taxRate of nonCompoundRates) {
      const isCompound = typeof taxRate.isCompound === 'number'
        ? Number(taxRate.isCompound) === 1
        : taxRate.isCompound;

      if (!isCompound) {
        const amount = (subtotal * taxRate.rate) / 100;
        totalTax += amount;
        appliedTaxes.push({
          id: taxRate.id,
          name: taxRate.name,
          rate: taxRate.rate,
          amount: Math.round(amount * 100) / 100,
          isCompound: false,
        });
      }
    }

    // Calculate compound taxes based on subtotal + previous taxes
    for (const taxRate of compoundRates) {
      const compoundBase = subtotal + totalTax;
      const amount = (compoundBase * taxRate.rate) / 100;
      totalTax += amount;
      appliedTaxes.push({
        id: taxRate.id,
        name: taxRate.name,
        rate: taxRate.rate,
        amount: Math.round(amount * 100) / 100,
        isCompound: true,
      });
    }

    return NextResponse.json({
      subtotal,
      appliedTaxes,
      totalTax: Math.round(totalTax * 100) / 100,
      total: Math.round((subtotal + totalTax) * 100) / 100,
    }, { status: 200 });
  } catch (error) {
    console.error('Calculate tax error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
