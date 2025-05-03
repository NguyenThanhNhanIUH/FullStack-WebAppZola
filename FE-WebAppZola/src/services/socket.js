import { io } from "socket.io-client"

// Tạo instance socket.io với cấu hình phù hợp
const createSocket = () => {
  const socket = io("http://localhost:5000", {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Number.POSITIVE_INFINITY,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    transports: ["websocket"],
    upgrade: false,
    forceNew: true,
    query: {
      timestamp: Date.now(),
    },
  })

  // Xử lý các sự kiện socket
  socket.on("connect", () => {
    console.log("Socket connected successfully! ID:", socket.id)

    // Lấy thông tin người dùng từ localStorage
    const userProfile = JSON.parse(localStorage.getItem("userProfile"))
    if (userProfile?.userId) {
      socket.emit("user_connected", userProfile.userId)
    }
  })

  socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err)
  })

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason)
  })

  socket.on("error", (err) => {
    console.error("Socket error:", err)
  })

  socket.on("reconnect", (attemptNumber) => {
    console.log("Socket reconnected after", attemptNumber, "attempts")
    const userProfile = JSON.parse(localStorage.getItem("userProfile"))
    if (userProfile?.userId) {
      socket.emit("user_connected", userProfile.userId)
    }
  })

  socket.on("reconnect_error", (err) => {
    console.error("Socket reconnection error:", err)
  })

  return socket
}

// Tạo và export socket instance
const socket = createSocket()

export default socket
