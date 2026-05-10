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

  // Setup Redis Adapter if available
  if (pubClient && subClient) {
    const { createAdapter } = require('@socket.io/redis-adapter')
    io.adapter(createAdapter(pubClient, subClient))
  }

  // Socket namespaces and logic
  io.on('connection', (socket) => {
    console.log(`⚡ Socket connected: ${socket.id}`)

    // 1. Authenticate & Join Store Room
    socket.on('join_store', (data) => {
      // In production: Validate JWT token here
      if (data?.storeId) {
        socket.join(`store_${data.storeId}`)
        console.log(`Socket ${socket.id} joined store_${data.storeId}`)
      }
    })

    // 2. Theme Editor Live Updates (Visual Customizer)
    socket.on('editor_update', (data) => {
      // Broadcast to all clients viewing the storefront iframe for this store
      socket.to(`storefront_${data.storeId}`).emit('theme_sync', data.payload)
    })

    // 3. Storefront viewers join their respective room
    socket.on('join_storefront', (data) => {
      if (data?.storeId) {
        socket.join(`storefront_${data.storeId}`)
      }
    })

    socket.on('disconnect', () => {
      console.log(`🔴 Socket disconnected: ${socket.id}`)
    })
  })

  const PORT = process.env.PORT || 3000
  server.listen(PORT, (err) => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${PORT}`)
  })
})
