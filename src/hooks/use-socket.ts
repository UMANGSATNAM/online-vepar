'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAppStore } from '@/lib/store'

let socketInstance: Socket | null = null

export interface OrderNotification {
  orderId: string
  orderNumber: string
  customerName: string
  total: number
  storeId: string
}

type EventCallback = (data: OrderNotification) => void

export function useSocket(onNewOrder?: EventCallback) {
  const [connected, setConnected] = useState(false)
  const { currentStore } = useAppStore()
  const callbackRef = useRef(onNewOrder)
  callbackRef.current = onNewOrder

  useEffect(() => {
    if (!socketInstance) {
      socketInstance = io({
        path: '/socket.io',
        autoConnect: true,
      })
    }

    const s = socketInstance

    const handleConnect = () => {
      setConnected(true)
      if (currentStore?.id) {
        s.emit('join_store', { storeId: currentStore.id })
      }
    }

    const handleDisconnect = () => {
      setConnected(false)
    }

    const handleNewOrder = (data: OrderNotification) => {
      callbackRef.current?.(data)
    }

    s.on('connect', handleConnect)
    s.on('disconnect', handleDisconnect)
    s.on('new_order', handleNewOrder)

    // If already connected, join store immediately
    if (s.connected && currentStore?.id) {
      s.emit('join_store', { storeId: currentStore.id })
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConnected(true)
    }

    return () => {
      s.off('connect', handleConnect)
      s.off('disconnect', handleDisconnect)
      s.off('new_order', handleNewOrder)
    }
  }, [currentStore?.id])

  const emit = useCallback((event: string, data: unknown) => {
    socketInstance?.emit(event, data)
  }, [])

  return { connected, emit }
}
