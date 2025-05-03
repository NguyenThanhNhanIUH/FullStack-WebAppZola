// Hàm tiện ích để xử lý tin nhắn
const messageUtils = {
    // Định dạng thời gian từ timestamp
    formatMessageTime: (timestamp) => {
      try {
        if (!timestamp)
          return new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
  
        const time = new Date(timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
  
        return time === "Invalid Date" ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : time
      } catch (error) {
        console.error("Error formatting time:", error)
        return new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      }
    },
  
    // Định dạng ngày từ timestamp
    formatMessageDate: (timestamp) => {
      try {
        if (!timestamp) return new Date().toLocaleDateString()
  
        const date = new Date(timestamp).toLocaleDateString()
  
        return date === "Invalid Date" ? new Date().toLocaleDateString() : date
      } catch (error) {
        console.error("Error formatting date:", error)
        return new Date().toLocaleDateString()
      }
    },
  
    // Chuyển đổi dữ liệu tin nhắn từ API sang định dạng hiển thị
    mapApiMessageToDisplayMessage: (msg, userId, contactName) => {
      // Tạo thời gian hợp lệ
      const messageTime = messageUtils.formatMessageTime(msg.createdAt)
      const messageDate = messageUtils.formatMessageDate(msg.createdAt)
  
      return {
        id: msg.messageId || `generated-${Date.now()}-${Math.random()}`,
        sender: msg.senderId === userId ? "Me" : msg.senderId === "system" ? "System" : contactName || "Unknown",
        content:
          msg.isRecalled || msg.isDeleted
            ? "Tin nhắn đã bị thu hồi/xóa"
            : msg.type === "text" || msg.type === "emoji" || msg.type === "system"
              ? msg.content
              : msg.attachments?.[0]?.url || msg.content,
        time: messageTime,
        senderId: msg.senderId,
        isImage: msg.type === "image" || msg.type === "imageGroup",
        isVideo: msg.type === "video",
        isFile: msg.type === "file",
        isUnsent: msg.isRecalled || msg.isDeleted,
        isSystemMessage: msg.isSystemMessage || msg.senderId === "system",
        fileUrl: msg.type === "file" && msg.attachments?.length > 0 ? msg.attachments[0]?.url : null,
        fileName: msg.type === "file" && msg.attachments?.length > 0 ? msg.attachments[0]?.name : null,
        fileType: msg.type === "file" && msg.attachments?.length > 0 ? msg.attachments[0]?.type : null,
        duration: msg.type === "video" && msg.attachments?.length > 0 ? msg.attachments[0]?.duration : null,
        messageDate: messageDate,
      }
    },
  
    // Lọc media từ danh sách tin nhắn
    filterMediaFromMessages: (messages) => {
      return messages
        .filter((msg) => msg.type === "image" || msg.type === "video")
        .map((msg) => {
          const messageDate = messageUtils.formatMessageDate(msg.createdAt)
  
          return {
            id: msg.messageId,
            type: msg.type,
            url: msg.attachments?.[0]?.url || "",
            name: msg.attachments?.[0]?.name || "",
            date: messageDate,
            size: msg.attachments?.[0]?.size || 0,
            duration: msg.type === "video" ? msg.attachments?.[0]?.duration : null,
          }
        })
    },
  
    // Lọc files từ danh sách tin nhắn
    filterFilesFromMessages: (messages) => {
      return messages
        .filter((msg) => msg.type === "file")
        .map((msg) => {
          const messageDate = messageUtils.formatMessageDate(msg.createdAt)
  
          return {
            id: msg.messageId,
            type: msg.attachments?.[0]?.name?.split(".").pop().toLowerCase() || "",
            url: msg.attachments?.[0]?.url || "",
            name: msg.attachments?.[0]?.name || "",
            date: messageDate,
            size: msg.attachments?.[0]?.size || 0,
          }
        })
    },
  }
  
  export default messageUtils
  