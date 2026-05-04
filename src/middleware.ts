import { NextRequest, NextResponse } from 'next/server'

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}

export function middleware(request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get('host') || ''

  // Platform domain - e.g. onlinevepar.com or localhost
  const platformDomain = process.env.PLATFORM_DOMAIN || 'onlinevepar.com'
  const isDev = hostname.includes('localhost') || hostname.includes('127.0.0.1')
  const isPlatformHost = hostname === platformDomain || hostname.includes('.up.railway.app')

  // Admin panel - let it through
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  if (isDev) {
    // Check if it's a local subdomain (e.g., myshop.localhost:3000)
    const [domainPart] = hostname.split(':')
    if (domainPart.endsWith('.localhost') && domainPart !== 'localhost') {
      const subdomain = domainPart.replace('.localhost', '')
      const rewriteUrl = url.clone()
      rewriteUrl.pathname = `/store/${subdomain}${url.pathname}`
      return NextResponse.rewrite(rewriteUrl)
    }

    // In dev, also allow subdomain simulation via ?store=slug query param
    const storeSlug = url.searchParams.get('store')
    if (storeSlug && !url.pathname.startsWith('/store/')) {
      const rewriteUrl = url.clone()
      rewriteUrl.pathname = `/store/${storeSlug}${url.pathname}`
      return NextResponse.rewrite(rewriteUrl)
    }
  }

  // Check if it's a subdomain of our platform (e.g. myshop.onlinevepar.com)
  const [domainWithoutPort] = hostname.split(':')
  if (domainWithoutPort.endsWith(`.${platformDomain}`)) {
    const subdomain = domainWithoutPort.replace(`.${platformDomain}`, '')
    // Skip www
    if (subdomain && subdomain !== 'www') {
      const rewriteUrl = url.clone()
      rewriteUrl.pathname = `/store/${subdomain}${url.pathname}`
      return NextResponse.rewrite(rewriteUrl)
    }
    return NextResponse.next()
  }

  // Custom domain - not our platform domain
  if (!isPlatformHost) {
    const rewriteUrl = url.clone()
    rewriteUrl.pathname = `/store-domain/${hostname}${url.pathname}`
    return NextResponse.rewrite(rewriteUrl)
  }

  return NextResponse.next()
}
