// Cập nhật socket handler để hỗ trợ chat nhóm
export default (io) => {
    // Map để lưu trữ kết nối socket của người dùng
    const userSocketMap = new Map()
  
    io.on("connection", (socket) => {
      console.log("New socket connection:", socket.id)
  
      // Xử lý khi người dùng kết nối
      socket.on("user_connected", (userId) => {
        console.log(`User ${userId} connected with socket ${socket.id}`)
  
        // Lưu socket ID của người dùng
        userSocketMap.set(userId, socket.id)
  
        // Thêm socket vào room của người dùng
        socket.join(userId)
  
        // Thông báo cho bạn bè rằng người dùng đã online
        socket.broadcast.emit("user_status_change", {
          userId,
          status: "online",
        })
      })
  
      // Xử lý khi người dùng tham gia vào một cuộc trò chuyện
      socket.on("join_conversation", (conversationId) => {
        console.log(`Socket ${socket.id} joining conversation ${conversationId}`)
        socket.join(conversationId)
      })
  
      // Xử lý khi người dùng rời khỏi một cuộc trò chuyện
      socket.on("leave_conversation", (conversationId) => {
        console.log(`Socket ${socket.id} leaving conversation ${conversationId}`)
        socket.leave(conversationId)
      })
  
      // Xử lý khi người dùng gửi tin nhắn mới
      socket.on("new_message", (messageData) => {
        console.log(`New message in conversation ${messageData.conversationId}`)
  
        // Gửi tin nhắn đến tất cả người dùng trong cuộc trò chuyện
        socket.to(messageData.conversationId).emit("new_message", messageData)
  
        // Nếu có receiverId cụ thể (chat 1-1), gửi thông báo trực tiếp
        if (messageData.receiverId) {
          const receiverSocketId = userSocketMap.get(messageData.receiverId)
          if (receiverSocketId) {
            io.to(receiverSocketId).emit("receive_message", messageData)
          }
        }
      })
  
      // Xử lý khi người dùng tạo nhóm mới
      socket.on("group_created", (groupData) => {
        console.log(`New group created: ${groupData.name}`)
  
        // Thông báo cho tất cả thành viên trong nhóm
        groupData.members.forEach((memberId) => {
          if (memberId !== groupData.admin) {
            // Không gửi lại cho người tạo nhóm
            const memberSocketId = userSocketMap.get(memberId)
            if (memberSocketId) {
              io.to(memberSocketId).emit("group_created", groupData)
            }
          }
        })
      })
  
      // Xử lý khi người dùng thêm thành viên vào nhóm
      socket.on("group_member_added", (data) => {
        console.log(`Member ${data.newMember.userId} added to group ${data.groupId}`)
  
        // Thông báo cho thành viên mới
        const newMemberSocketId = userSocketMap.get(data.newMember.userId)
        if (newMemberSocketId) {
          io.to(newMemberSocketId).emit("added_to_group", data)
        }
      })
  
      // Xử lý khi người dùng ngắt kết nối
      socket.on("disconnect", () => {
        console.log(`Socket ${socket.id} disconnected`)
  
        // Tìm userId từ socket ID
        let disconnectedUserId = null
        for (const [userId, socketId] of userSocketMap.entries()) {
          if (socketId === socket.id) {
            disconnectedUserId = userId
            break
          }
        }
  
        if (disconnectedUserId) {
          // Xóa socket ID của người dùng
          userSocketMap.delete(disconnectedUserId)
  
          // Thông báo cho bạn bè rằng người dùng đã offline
          socket.broadcast.emit("user_status_change", {
            userId: disconnectedUserId,
            status: "offline",
          })
        }
      })
    })
  }
  