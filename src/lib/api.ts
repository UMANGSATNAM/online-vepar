'use client'

import { useAppStore } from '@/lib/store'

/**
 * Authenticated fetch wrapper that includes user ID header as a fallback
 * for sandbox environments where cookies may not work properly.
 * 
 * This wraps the native fetch to automatically add the X-User-Id header
 * for all API calls to our backend (/api/...), ensuring authentication
 * works even in sandbox/iframe environments where cookies may be blocked.
 */
export function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const { currentUser } = useAppStore.getState()
  
  const headers = new Headers(options.headers || {})
  
  // Add user ID header as fallback for sandbox environments
  // Only for our API calls (relative URLs starting with /api/)
  if (currentUser?.id && typeof url === 'string' && url.startsWith('/api/')) {
    headers.set('X-User-Id', currentUser.id)
  }
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'same-origin',
  })
}

// Override global fetch to include auth headers automatically
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : undefined
    
    // Only intercept our API calls
    if (url?.startsWith('/api/')) {
      const { currentUser } = useAppStore.getState()
      if (currentUser?.id) {
        const headers = new Headers(init?.headers || {})
        if (!headers.has('X-User-Id')) {
          headers.set('X-User-Id', currentUser.id)
        }
        init = { ...init, headers, credentials: 'same-origin' }
      }
    }
    
    return originalFetch.call(this, input, init)
  }
}
