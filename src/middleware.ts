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
  const isPlatformHost = isDev || hostname === platformDomain || hostname.includes('.up.railway.app')

  // Protect Admin UI routes
  if (url.pathname.startsWith('/admin')) {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      const loginUrl = url.clone()
      loginUrl.pathname = '/login'
      return NextResponse.redirect(loginUrl)
    }
    
    // Quick JWT decode (verification happens at API level)
    try {
      const payloadBase64 = token.split('.')[1]
      const payloadString = Buffer.from(payloadBase64, 'base64').toString()
      const payload = JSON.parse(payloadString)
      
      if (payload.role !== 'superadmin' && payload.role !== 'subadmin') {
        // Merchant trying to access admin
        const dashboardUrl = url.clone()
        dashboardUrl.pathname = '/dashboard' // Assuming Flutter web or future dashboard
        return NextResponse.redirect(dashboardUrl)
      }
    } catch (e) {
      // Invalid token format
      const loginUrl = url.clone()
      loginUrl.pathname = '/login'
      return NextResponse.redirect(loginUrl)
    }

    // We defer full JWT verification to the page/API level
    return NextResponse.next()
  }

  // Protect Dashboard UI routes (merchants)
  if (url.pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      const loginUrl = url.clone()
      loginUrl.pathname = '/login'
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // Public platform routes — always pass through on platform host
  const publicPaths = ['/login', '/register', '/forgot-password', '/_next', '/favicon']
  if (publicPaths.some(p => url.pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // API routes
  if (url.pathname.startsWith('/api')) {
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
