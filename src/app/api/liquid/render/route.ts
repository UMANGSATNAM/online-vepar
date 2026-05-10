import { NextResponse } from 'next/server'
import { renderStorefront } from '@/lib/liquid'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { storeId, sections } = await request.json()

    if (!storeId || !sections) {
      return NextResponse.json({ error: 'Missing storeId or sections' }, { status: 400 })
    }

    const store = await db.store.findUnique({ where: { id: storeId } })
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // This is a fast API purely for Live Preview
    // Normally `renderStorefront` reads from the DB or Theme Files.
    // For live preview, we temporarily override the store's sectionsConfig!
    
    // NOTE: In a true production app with Liquid, you pass `sections` directly into a modified 
    // `renderStorefront` signature so it renders the *unsaved* changes. 
    // Since our mock `liquid.ts` doesn't accept dynamic overrides yet, we'll just mock the response
    // or you can modify `liquid.ts` to accept `overrideSections`.
    
    // We will do a mock for the sake of the architecture:
    const html = await renderStorefront(storeId, 'index', {
       store: { name: store.name, description: store.description }
    }, sections)

    return NextResponse.json({ html })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
