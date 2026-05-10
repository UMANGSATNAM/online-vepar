const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')
const Redis = require('ioredis')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

// Fallback to memory if Redis is not configured
const REDIS_URL = process.env.REDIS_URL
let pubClient, subClient

if (REDIS_URL) {
  pubClient = new Redis(REDIS_URL)
  subClient = new Redis(REDIS_URL)
  console.log('🔗 Redis connected for Pub/Sub')
} else {
  console.warn('⚠️ REDIS_URL not set. Falling back to local Socket.io adapter (Single node only)')
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  })

  // ✅ Expose io globally so Next.js API routes can emit real-time events
  global._io = io

  // Setup Redis Adapter if available
  if (pubClient && subClient) {
    const { createAdapter } = require('@socket.io/redis-adapter')
    io.adapter(createAdapter(pubClient, subClient))
  }

  // Socket namespaces and logic
  io.on('connection', (socket) => {
    console.log(`⚡ Socket connected: ${socket.id}`)

    socket.on('join_store', (data) => {
      if (data?.storeId) {
        socket.join(`store_${data.storeId}`)
        console.log(`Socket ${socket.id} joined store_${data.storeId}`)
      }
    })

    socket.on('editor_update', (data) => {
      socket.to(`storefront_${data.storeId}`).emit('theme_sync', data.payload)
    })

    socket.on('join_storefront', (data) => {
      if (data?.storeId) {
        socket.join(`storefront_${data.storeId}`)
      }
    })

    socket.on('disconnect', () => {
      console.log(`🔴 Socket disconnected: ${socket.id}`)
    })
  })

  // Helper for API routes to emit new_order event via global._io
  global.emitNewOrder = (storeId, orderData) => {
    io.to(`store_${storeId}`).emit('new_order', orderData)
    console.log(`🛍️ Cha-ching! New order emitted to store_${storeId}`)
  }

  const PORT = process.env.PORT || 3000
  server.listen(PORT, (err) => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${PORT}`)
  })
})
