'use client'

import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAppStore } from '@/lib/store'

let socketInstance: Socket | null = null

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(socketInstance)
  const { currentStore } = useAppStore()

  useEffect(() => {
    if (!socketInstance) {
      socketInstance = io({
        path: '/socket.io',
        autoConnect: true,
      })
      setSocket(socketInstance)
    }

    const s = socketInstance

    s.on('connect', () => {
      console.log('🔌 Socket connected')
      if (currentStore?.id) {
        s.emit('join_store', { storeId: currentStore.id })
      }
    })

    s.on('disconnect', () => {
      console.log('🔌 Socket disconnected')
    })

    return () => {
      // Don't disconnect here if we want persistent global connection
      // s.disconnect()
    }
  }, [currentStore?.id])

  return socket
}
