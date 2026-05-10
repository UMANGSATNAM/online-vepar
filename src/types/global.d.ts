// Global Socket.io helper injected by server.js for use in Next.js API routes
declare global {
  var emitNewOrder: ((storeId: string, orderData: {
    orderId: string
    orderNumber: string
    customerName: string
    total: number
    storeId: string
  }) => void) | undefined

  var _io: import('socket.io').Server | undefined
}

export {}
