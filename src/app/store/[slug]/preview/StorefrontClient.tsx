'use client'

import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

export default function StorefrontClient({ 
  initialHtml, 
  storeId 
}: { 
  initialHtml: string
  storeId: string 
}) {
  const [html, setHtml] = useState(initialHtml)

  useEffect(() => {
    // Connect to global socket server
    const socket = io({ path: '/socket.io', autoConnect: true })
    
    socket.on('connect', () => {
      console.log('Storefront connected to Live Editor Sockets')
      socket.emit('join_storefront', { storeId })
    })

    // Listen for live updates from Admin Editor
    socket.on('theme_sync', async (payload: any) => {
      console.log('Received live theme update from editor:', payload)
      // In a real implementation, the storefront would hit a lightweight API 
      // with this payload to re-render the Liquid string, or we'd have a 
      // client-side Liquid parser. For now, we'll just log it to prove it works.
      
      // Hit a fast Next.js API route that renders Liquid on the fly
      try {
        const res = await fetch(`/api/liquid/render`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storeId, sections: payload })
        })
        if (res.ok) {
          const data = await res.json()
          setHtml(data.html)
        }
      } catch (e) {
        console.error('Failed to hot-swap Liquid rendering', e)
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [storeId])

  return (
    <div dangerouslySetInnerHTML={{ __html: html }} />
  )
}
