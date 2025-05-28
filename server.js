import { WebSocketServer } from 'ws'

const PORT = 3000
const wss = new WebSocketServer({ port: PORT })

const clients = new Map()

console.log(`✅ WebSocket server is running at PORT :${PORT}`)

wss.on('connection', ws => {
  const userId = `user_${Math.random().toString(36).substring(2, 9)}`
  const isAdmin = clients.size === 0 // First connection is admin

  clients.set(userId, { ws, admin: isAdmin })

  console.log(`🟢 User connected: ${userId} ${isAdmin ? '(Admin)' : ''}`)

  ws.on('message', message => {
    try {
      console.log('📩 Message received (RAW Buffer):', message)

      const msgStr = message.toString()
      console.log('📩 Message received (String):', msgStr)

      const data = JSON.parse(msgStr)
      console.log('📩 Parsed Message:', data)

      if (!data || typeof data !== 'object') {
        console.warn('⚠️ Invalid message format received:', data)
        return
      }

      if (!data.type) {
        console.warn("⚠️ No 'type' field found in message:", data)
        return
      }

      console.log('🔍 Data Type:', typeof data.type, 'Value:', data.type)

      switch (data.type) {
        case 'joinRequest':
          console.log("➡️ Handling 'joinRequest'...")
          clients.forEach((client, clientId) => {
            if (client.admin) {
              console.log(`📢 Sending joinRequest to admin (${clientId})`)
              client.ws.send(
                JSON.stringify({ type: 'joinRequest', payload: data.payload })
              )
            }
          })
          break

        case 'joinResponse':
          console.log("🔔 Broadcasting 'joinResponse'")
          clients.forEach(client => {
            if (client.ws.readyState === 1) {
              client.ws.send(
                JSON.stringify({ type: 'joinResponse', payload: data.payload })
              )
            }
          })
          break

        case 'approveResponse':
          console.log("🔥 'approveResponse' CASE ENTERED 🔥") // 🚨 CONFIRM CASE IS ENTERING
          clients.forEach(client => {
            console.log(
              `📡 Sending approveResponse to ${
                client.ws.readyState === 1 ? 'Active Client' : 'Inactive Client'
              }`
            )
            if (client.ws.readyState === 1) {
              client.ws.send(
                JSON.stringify({
                  type: 'approveResponse',
                  payload: data.payload,
                })
              )
            }
          })
          break

        default:
          console.warn('⚠️ Unknown message type received:', data.type)
      }
    } catch (err) {
      console.error('❌ Error parsing message:', err)
    }
  })

  ws.on('close', () => {
    clients.delete(userId)
    console.log(`🔴 User disconnected: ${userId}`)
  })

  ws.on('pong', () => {
    console.log(`💓 Pong received from ${userId}`)
  })
})

// 🔄 Keep Connections Alive (Heartbeat)
setInterval(() => {
  clients.forEach((client, userId) => {
    if (client.ws.readyState === 1) {
      client.ws.ping()
    } else {
      console.log(`🔴 Removing inactive client: ${userId}`)
      clients.delete(userId)
    }
  })
}, 10000)
