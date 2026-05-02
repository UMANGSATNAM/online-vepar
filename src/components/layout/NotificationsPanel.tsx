'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  ShoppingCart,
  AlertTriangle,
  CreditCard,
  Package,
  Check,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useAppStore, type ViewType } from '@/lib/store'

interface Notification {
  id: string
  type: 'new_order' | 'low_stock' | 'payment_received' | 'order_status'
  title: string
  description: string
  time: string
  read: boolean
  link: string
}

const NOTIFICATION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  new_order: ShoppingCart,
  low_stock: AlertTriangle,
  payment_received: CreditCard,
  order_status: Package,
}

const NOTIFICATION_COLORS: Record<string, string> = {
  new_order: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
  low_stock: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
  payment_received: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
  order_status: 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400',
}

export default function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const setView = useAppStore((s) => s.setView)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    // Refresh every 60 seconds
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read locally
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notification.id ? { ...n, read: true } : n
      )
    )
    setUnreadCount((prev) => Math.max(0, prev - (notification.read ? 0 : 1)))

    // Navigate to the appropriate view
    const viewMap: Record<string, ViewType> = {
      orders: 'orders',
      products: 'products',
    }
    const targetView = viewMap[notification.link]
    if (targetView) {
      setView(targetView)
      setOpen(false)
    }
  }

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <motion.div whileTap={{ scale: 0.9 }}>
            <Bell className="w-5 h-5 text-muted-foreground" />
          </motion.div>
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1"
              >
                <Badge className="h-5 min-w-5 p-0 flex items-center justify-center bg-emerald-600 text-[10px] text-white border-0">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 text-emerald-600 hover:text-emerald-700"
              onClick={handleMarkAllRead}
            >
              <Check className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <div
          className="notifications-scroll-list max-h-[400px] overflow-y-auto"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
              <p className="text-xs mt-1">We&apos;ll notify you when something happens</p>
            </div>
          ) : (
            <div className="divide-y">
              <AnimatePresence>
                {notifications.map((notification) => {
                  const Icon = NOTIFICATION_ICONS[notification.type] || ShoppingCart
                  const colorClass = NOTIFICATION_COLORS[notification.type] || 'bg-muted text-muted-foreground'

                  return (
                    <motion.button
                      key={notification.id}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className={`w-full text-left p-3 hover:bg-accent/50 transition-colors flex gap-3 ${
                        !notification.read ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'}`}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {notification.description}
                        </p>
                        <p className="text-[11px] text-muted-foreground/70 mt-1">
                          {notification.time}
                        </p>
                      </div>
                    </motion.button>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-emerald-600 hover:text-emerald-700"
                onClick={() => {
                  setView('orders')
                  setOpen(false)
                }}
              >
                View all activity
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
