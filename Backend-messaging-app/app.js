import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import dotenv from "dotenv"
import { createServer } from "http"
import { Server } from "socket.io"
import authRoutes from "./routes/authRoutes.js"
import userRoutes from "./routes/userRoutes.js"
import imageRoutes from "./routes/imageRoutes.js"
import friendRoutes from "./routes/friendRoutes.js"
import messageRoutes from "./routes/messageRoutes.js"
import groupRoutes from "./routes/groupRoutes.js"
import { errorHandler } from "./middleware/errorMiddleware.js"
import { initializeStorage } from "./config/supabaseConfig.js"
import { connectDB } from "./config/mongodbConfig.js"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
})

// Socket.IO connection handling
const connectedUsers = new Map() // Map để lưu trữ socket id theo userId

io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  // Lưu thông tin user khi kết nối
  socket.on("user_connected", (userId) => {
    console.log(`User ${userId} connected with socket ${socket.id}`)
    connectedUsers.set(userId, socket.id)

    // Thông báo cho tất cả user khác biết user này online
    socket.broadcast.emit("user_online", userId)

    // Gửi danh sách user đang online cho user mới kết nối
    const onlineUsers = Array.from(connectedUsers.keys())
    socket.emit("online_users", onlineUsers)
  })

  // Xử lý khi user ngắt kết nối
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id)

    // Tìm và xóa user khỏi danh sách online
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId)
        // Thông báo cho tất cả user khác biết user này offline
        socket.broadcast.emit("user_offline", userId)
        break
      }
    }
  })

  // Xử lý khi user gửi lời mời kết bạn
  socket.on("send_friend_request", (data) => {
    const { receiverId } = data
    if (connectedUsers.has(receiverId)) {
      const receiverSocketId = connectedUsers.get(receiverId)
      io.to(receiverSocketId).emit("receive_friend_request", data)
    }
  })

  // Xử lý khi user chấp nhận/từ chối lời mời kết bạn
  socket.on("friend_request_response", (data) => {
    const { senderId, status } = data
    if (connectedUsers.has(senderId)) {
      const senderSocketId = connectedUsers.get(senderId)
      io.to(senderSocketId).emit("friend_request_responded", data)
    }
  })

  // Xử lý khi có conversation mới được tạo
  socket.on("new_conversation_created", (data) => {
    const { participants, conversation } = data
    participants.forEach(userId => {
      if (connectedUsers.has(userId)) {
        const userSocketId = connectedUsers.get(userId)
        io.to(userSocketId).emit("conversation_created", conversation)
      }
    })
  })

  // Xử lý khi user tham gia conversation
  socket.on("join_conversation", (conversationId) => {
    socket.join(conversationId)
    console.log(`User ${socket.id} joined conversation ${conversationId}`)
  })

  // Xử lý khi user rời conversation
  socket.on("leave_conversation", (conversationId) => {
    socket.leave(conversationId)
    console.log(`User ${socket.id} left conversation ${conversationId}`)
  })

  // Xử lý khi user gửi tin nhắn mới
  socket.on("new_message", async (data) => {
    const { conversationId, receiverId } = data

    // Gửi tin nhắn cho tất cả user trong conversation
    io.to(conversationId).emit("receive_message", data)

    // Gửi thông báo cho người nhận nếu đang online
    if (connectedUsers.has(receiverId)) {
      const receiverSocketId = connectedUsers.get(receiverId)
      io.to(receiverSocketId).emit("new_message_notification", data)
    }
  })

  // Xử lý khi user đang nhập tin nhắn
  socket.on("typing", (data) => {
    const { conversationId, userId, isTyping } = data
    socket.broadcast.to(conversationId).emit("user_typing", {
      conversationId,
      userId,
      isTyping
    })
  })

  // Xử lý khi user đọc tin nhắn
  socket.on("read_messages", (data) => {
    const { conversationId, userId } = data
    socket.broadcast.to(conversationId).emit("messages_read", {
      conversationId,
      userId
    })
  })

  // Xử lý khi user tham gia nhóm
  socket.on("join_group", (groupId) => {
    socket.join(`group:${groupId}`)
    console.log(`User ${socket.id} joined group ${groupId}`)
  })

  // Xử lý khi user rời nhóm
  socket.on("leave_group", (groupId) => {
    socket.leave(`group:${groupId}`)
    console.log(`User ${socket.id} left group ${groupId}`)
  })

  // Xử lý khi người dùng chấp nhận lời mời kết bạn
  socket.on("friend_request_accepted", (data) => {
    try {
      console.log("Received friend_request_accepted event:", data);

      if (!data || !data.receiverId) {
        console.error("Invalid friend_request_accepted data (missing receiverId):", data);
        return;
      }

      const receiverId = data.receiverId;

      // Kiểm tra xem người nhận có online không
      if (connectedUsers.has(receiverId)) {
        const receiverSocketId = connectedUsers.get(receiverId);
        console.log(`Forwarding friend_request_accepted to user ${receiverId} (socket: ${receiverSocketId})`);

        // Gửi sự kiện cho người nhận
        io.to(receiverSocketId).emit("friend_request_accepted", data);
      } else {
        console.log(`User ${receiverId} is not connected, cannot forward friend_request_accepted notification`);
      }

      // Kiểm tra xem người gửi lời mời kết bạn có online không
      const senderId = data.accepter?.userId;
      if (senderId && connectedUsers.has(senderId)) {
        const senderSocketId = connectedUsers.get(senderId);
        console.log(`Forwarding friend_request_accepted to self ${senderId} (socket: ${senderSocketId})`);

        // Gửi sự kiện cho chính người gửi để cập nhật UI ngay lập tức
        io.to(senderSocketId).emit("friend_request_accepted", data);
      }
    } catch (error) {
      console.error("Error handling friend_request_accepted event:", error);
    }
  });

  // Xử lý refresh contacts
  socket.on("refresh_contacts", (data) => {
    try {
      if (!data || !data.userId) {
        console.error("Invalid refresh_contacts data (missing userId):", data);
        return;
      }

      const userId = data.userId;

      // Gửi sự kiện refresh_contacts cho người dùng cụ thể
      if (connectedUsers.has(userId)) {
        const userSocketId = connectedUsers.get(userId);
        console.log(`Sending refresh_contacts event to user ${userId} (socket: ${userSocketId})`);
        io.to(userSocketId).emit("refresh_contacts");
      } else {
        console.log(`User ${userId} is not connected, cannot send refresh_contacts notification`);
      }

      // Gửi sự kiện refresh_contacts cho người gửi (để tránh trường hợp lỗi UI)
      console.log(`Sending refresh_contacts event to self ${socket.id}`);
      socket.emit("refresh_contacts");
    } catch (error) {
      console.error("Error handling refresh_contacts event:", error);
    }
  });
})

// Xuất connectedUsers và io để sử dụng trong các controller khác
export { connectedUsers, io }

app.set("io", io)

connectDB().catch(console.error)
initializeStorage().catch(console.error)

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan("dev"))

app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/images", imageRoutes)
app.use("/api/friends", friendRoutes)
app.use("/api/messages", messageRoutes)
app.use("/api/groups", groupRoutes)

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" })
})

app.use(errorHandler)

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app
