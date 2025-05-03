import {
    createFriendRequest,
    getFriendRequestById,
    getFriendRequests,
    getSentFriendRequests,
    updateFriendRequestStatus,
    getFriendships,
    deleteFriendship,
    checkFriendship,
    createFriendship,
    FriendRequest
  } from "../models/friendModel.js"
  import { getUserById } from "../models/userModel.js"
  import { connectedUsers, io } from "../app.js"
  import { getOrCreateConversation } from "../models/messageModel.js"

  export const sendFriendRequest = async (req, res) => {
    try {
      const { receiverId, message } = req.body
      const senderId = req.user.userId

      if (senderId === receiverId) {
        return res.status(400).json({ message: "You cannot send a friend request to yourself" })
      }

      const receiver = await getUserById(receiverId)
      if (!receiver) {
        return res.status(404).json({ message: "User not found" })
      }

      const friendRequest = await createFriendRequest(senderId, receiverId, message)

      // Gửi thông báo qua Socket.IO nếu người nhận đang online
      if (connectedUsers.has(receiverId)) {
        const receiverSocketId = connectedUsers.get(receiverId)
        console.log(`Gửi thông báo lời mời kết bạn đến ${receiverId} qua socket ${receiverSocketId}`)

        // Lấy thông tin người gửi để hiển thị
        const sender = await getUserById(senderId)

        io.to(receiverSocketId).emit("friend_request", {
          requestId: friendRequest.requestId,
          sender: {
            userId: senderId,
            fullName: sender.fullName,
            email: sender.email,
            avatarUrl: sender.avatarUrl
          },
          message: friendRequest.message,
          createdAt: friendRequest.createdAt
        })
      } else {
        console.log(`Người dùng ${receiverId} không online, không gửi được thông báo trực tiếp`)
      }

      res.status(201).json({
        message: "Friend request sent successfully",
        friendRequest: {
          requestId: friendRequest.requestId,
          senderId: friendRequest.senderId,
          receiverId: friendRequest.receiverId,
          status: friendRequest.status,
          message: friendRequest.message,
          createdAt: friendRequest.createdAt,
        },
      })
    } catch (error) {
      console.error("Error in sendFriendRequest:", error)

      if (
        error.message === "Friend request already sent" ||
        error.message === "You already have a pending request from this user" ||
        error.message === "Users are already friends"
      ) {
        return res.status(400).json({ message: error.message })
      }

      res.status(500).json({ message: "Server error", error: error.message })
    }
  }

  export const getReceivedFriendRequests = async (req, res) => {
    try {
      const userId = req.user.userId
      const status = req.query.status || "pending"

      console.log(`Fetching friend requests for userId: ${userId}`)
      const friendRequests = await getFriendRequests(userId, status)
      console.log(`Found ${friendRequests.length} ${status} requests:`, friendRequests)

      const requestsWithSenderDetails = await Promise.all(
        friendRequests.map(async (request) => {
          const sender = await getUserById(request.senderId)
          return {
            requestId: request.requestId,
            sender: {
              userId: sender.userId,
              fullName: sender.fullName,
              email: sender.email,
              avatarUrl: sender.avatarUrl,
            },
            message: request.message,
            status: request.status,
            createdAt: request.createdAt,
          }
        })
      )

      console.log(`Filtered requests:`, requestsWithSenderDetails)

      res.status(200).json({
        message: "Friend requests retrieved successfully",
        data: requestsWithSenderDetails,
      })
    } catch (error) {
      console.error("Error in getReceivedFriendRequests:", error)
      res.status(500).json({ message: "Server error", error: error.message })
    }
  }

  export const getSentRequests = async (req, res) => {
    try {
      const userId = req.user.userId
      const status = req.query.status || "pending"

      const friendRequests = await getSentFriendRequests(userId, status)

      const requestsWithReceiverDetails = await Promise.all(
        friendRequests.map(async (request) => {
          const receiver = await getUserById(request.receiverId)
          return {
            requestId: request.requestId,
            receiver: {
              userId: receiver.userId,
              fullName: receiver.fullName,
              avatarUrl: receiver.avatarUrl,
            },
            message: request.message,
            status: request.status,
            createdAt: request.createdAt,
          }
        }),
      )

      res.status(200).json({
        message: "Sent friend requests retrieved successfully",
        friendRequests: requestsWithReceiverDetails,
      })
    } catch (error) {
      console.error("Error in getSentRequests:", error)
      res.status(500).json({ message: "Server error", error: error.message })
    }
  }

  export const respondToFriendRequest = async (req, res) => {
    try {
      const { requestId, action } = req.body
      const userId = req.user.userId

      if (!["accept", "reject"].includes(action)) {
        return res.status(400).json({ message: "Invalid action. Use 'accept' or 'reject'" })
      }

      const friendRequest = await getFriendRequestById(requestId)

      if (!friendRequest) {
        return res.status(404).json({ message: "Friend request not found" })
      }

      if (friendRequest.receiverId !== userId) {
        return res.status(403).json({ message: "You can only respond to your own friend requests" })
      }
      if (friendRequest.status !== "pending") {
        return res.status(400).json({ message: "This friend request has already been processed" })
      }

      const status = action === "accept" ? "accepted" : "rejected"
      const updatedRequest = await updateFriendRequestStatus(requestId, status)

      // Nếu chấp nhận lời mời, tạo conversation mới và thông báo realtime
      let conversation = null
      if (action === "accept") {
        try {
          // Lấy thông tin người nhận (người chấp nhận lời mời)
          const receiver = await getUserById(userId)
          // Lấy thông tin người gửi lời mời
          const sender = await getUserById(friendRequest.senderId)

          // Tạo conversation mới giữa 2 người dùng
          conversation = await getOrCreateConversation(userId, friendRequest.senderId)
          console.log("Created new conversation:", conversation)

          // Tạo tin nhắn hệ thống đầu tiên
          try {
            // Import các module cần thiết cho việc tạo tin nhắn
            const { Message } = await import("../models/messageModel.js")
            const { v4: uuidv4 } = await import("uuid")

            // Tạo tin nhắn hệ thống
            const systemMessage = new Message({
              messageId: uuidv4(),
              conversationId: conversation.conversationId,
              senderId: "system", // Sử dụng "system" để đánh dấu đây là tin nhắn hệ thống
              receiverId: "all", // Đánh dấu cả hai người đều nhận
              type: "text",
              content: "Các bạn đã trở thành bạn bè, hãy bắt đầu cuộc trò chuyện!",
            })

            // Lưu tin nhắn vào database
            await systemMessage.save()
            console.log("Created system message for new friendship:", systemMessage)

            // Cập nhật lastMessageId của conversation
            conversation.lastMessageId = systemMessage.messageId
            conversation.lastMessageAt = new Date()
            await conversation.save()

          } catch (messageError) {
            console.error("Error creating system message:", messageError)
            // Không ảnh hưởng đến quy trình chính nếu không tạo được tin nhắn
          }

          // Tạo mối quan hệ bạn bè nếu chưa tồn tại
          try {
            const friendship = await createFriendship(userId, friendRequest.senderId)
            console.log("Created friendship:", friendship)

            if (!friendship) {
              console.error("Failed to create friendship")
              return res.status(500).json({ message: "Failed to create friendship" })
            }
          } catch (friendshipError) {
            console.error("Error creating friendship:", friendshipError)
            return res.status(500).json({ message: "Error creating friendship", error: friendshipError.message })
          }

          // Gửi thông báo cho người gửi lời mời
          if (connectedUsers.has(friendRequest.senderId)) {
            const senderSocketId = connectedUsers.get(friendRequest.senderId)

            // 1. Thông báo lời mời được chấp nhận
            io.to(senderSocketId).emit("friend_request_accepted", {
              requestId: updatedRequest.requestId,
              status: updatedRequest.status,
              friend: {
                userId: receiver.userId,
                fullName: receiver.fullName,
                email: receiver.email,
                avatarUrl: receiver.avatarUrl
              },
              conversation: {
                conversationId: conversation.conversationId,
                participants: conversation.participants,
                lastMessageAt: conversation.lastMessageAt
              }
            })

            // 2. Thông báo về conversation mới
            io.to(senderSocketId).emit("conversation_created", {
              conversation: {
                conversationId: conversation.conversationId,
                participants: conversation.participants,
                lastMessageAt: conversation.lastMessageAt
              },
              otherUser: {
                userId: receiver.userId,
                fullName: receiver.fullName,
                email: receiver.email,
                avatarUrl: receiver.avatarUrl
              }
            })

            // 3. Thông báo cập nhật danh sách bạn bè
            io.to(senderSocketId).emit("friend_list_updated")

            // 4. Thông báo màu xanh cho người gửi lời mời
            io.to(senderSocketId).emit("notification", {
              type: "success",
              message: `${receiver.fullName || "Người dùng"} đã chấp nhận lời mời kết bạn của bạn`
            })
          }

          // Gửi thông báo cho người chấp nhận lời mời
          if (connectedUsers.has(userId)) {
            const receiverSocketId = connectedUsers.get(userId)

            // 1. Thông báo về conversation mới
            io.to(receiverSocketId).emit("conversation_created", {
              conversation: {
                conversationId: conversation.conversationId,
                participants: conversation.participants,
                lastMessageAt: conversation.lastMessageAt
              },
              otherUser: {
                userId: sender.userId,
                fullName: sender.fullName,
                email: sender.email,
                avatarUrl: sender.avatarUrl
              }
            })

            // 2. Thông báo cập nhật danh sách bạn bè
            io.to(receiverSocketId).emit("friend_list_updated")

            // 3. Thông báo màu xanh cho người chấp nhận lời mời
            io.to(receiverSocketId).emit("notification", {
              type: "success",
              message: `Bạn và ${sender.fullName || "người dùng"} đã trở thành bạn bè`
            })

            // 4. Gửi thông báo friend_request_accepted cho người chấp nhận lời mời
            io.to(receiverSocketId).emit("friend_request_accepted", {
              requestId: updatedRequest.requestId,
              status: updatedRequest.status,
              friend: {
                userId: sender.userId,
                fullName: sender.fullName,
                email: sender.email,
                avatarUrl: sender.avatarUrl
              },
              conversation: {
                conversationId: conversation.conversationId,
                participants: conversation.participants,
                lastMessageAt: conversation.lastMessageAt
              }
            })
          }

          // Broadcast sự kiện mới cho tất cả các user liên quan
          io.emit("friendship_updated", {
            users: [userId, friendRequest.senderId],
            action: "new_friendship"
          })

        } catch (error) {
          console.error("Error in accept friend request:", error)
        }
      }

      // Gửi response về cho client
      res.status(200).json({
        message: `Friend request ${status} successfully`,
        friendRequest: {
          requestId: updatedRequest.requestId,
          senderId: updatedRequest.senderId,
          receiverId: updatedRequest.receiverId,
          status: updatedRequest.status,
        },
        conversation: conversation ? {
          conversationId: conversation.conversationId,
          participants: conversation.participants,
          lastMessageAt: conversation.lastMessageAt
        } : null
      })
    } catch (error) {
      console.error("Error in respondToFriendRequest:", error)
      res.status(500).json({ message: "Server error", error: error.message })
    }
  }

  export const getFriends = async (req, res) => {
    try {
      const userId = req.user.userId
      console.log(`Getting friends for user: ${userId}`)

      // Mảng để lưu trữ bạn bè hợp lệ
      const validFriends = []

      // Tìm tất cả các lời mời kết bạn đã được chấp nhận
      const acceptedRequests = await FriendRequest.find({
        $or: [
          { senderId: userId, status: "accepted" },
          { receiverId: userId, status: "accepted" }
        ]
      })

      console.log(`Found ${acceptedRequests.length} accepted friend requests`)

      // Lấy danh sách ID của bạn bè từ các lời mời đã chấp nhận
      for (const request of acceptedRequests) {
        try {
          // Lấy ID của người bạn
          const friendId = request.senderId === userId ? request.receiverId : request.senderId

          // Kiểm tra xem friendId có hợp lệ không
          if (!friendId) {
            console.log(`Invalid friend ID in request:`, request)
            continue
          }

          // Kiểm tra xem đã thêm vào danh sách chưa (tránh trùng lặp)
          const alreadyAdded = validFriends.some(friend => friend.userId === friendId)
          if (alreadyAdded) {
            console.log(`Friend ${friendId} already added to list`)
            continue
          }

          // Kiểm tra xem người bạn có tồn tại không
          const friend = await getUserById(friendId)
          if (!friend) {
            console.log(`Friend with ID ${friendId} not found`)
            continue
          }

          // Kiểm tra xem mối quan hệ bạn bè có thực sự tồn tại không
          const friendship = await getFriendships(userId, friendId)

          if (!friendship) {
            console.log(`No friendship record found between ${userId} and ${friendId} despite accepted request`)
            continue
          }

          // Nếu tất cả các kiểm tra đều thành công, thêm vào danh sách bạn bè hợp lệ
          validFriends.push({
            userId: friend.userId,
            fullName: friend.fullName,
            email: friend.email,
            avatarUrl: friend.avatarUrl,
            lastInteractionAt: friendship.lastInteractionAt,
          })
        } catch (friendError) {
          console.error(`Error processing friend request:`, friendError)
          continue
        }
      }

      console.log(`Returning ${validFriends.length} valid friends`)
      res.status(200).json({
        message: "Friends retrieved successfully",
        friends: validFriends,
      })
    } catch (error) {
      console.error("Error in getFriends:", error)
      res.status(500).json({ message: "Server error", error: error.message })
    }
  }
  export const removeFriend = async (req, res) => {
    try {
      const { friendId } = req.params
      if (!friendId) {
        return res.status(400).json({ message: "Friend ID is required" })
      }

      const userId = req.user.userId
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated properly" })
      }

      console.log(`Removing friend: ${friendId} from user: ${userId}`)

      if (userId === friendId) {
        return res.status(400).json({ message: "Invalid operation" })
      }

      // Kiểm tra xem có phải là bạn bè không trước khi xóa
      try {
        const isFriend = await checkFriendship(userId, friendId)
        console.log(`Friendship check result: ${isFriend}`)

        if (!isFriend) {
          console.log(`Users ${userId} and ${friendId} are not friends`)
          return res.status(404).json({ message: "Friendship not found" })
        }
      } catch (checkError) {
        console.error("Error checking friendship:", checkError)
        return res.status(500).json({ message: "Error checking friendship status", error: checkError.message })
      }

      // Xóa mối quan hệ bạn bè
      try {
        // Xóa tất cả các friend request giữa hai người dùng
        const { FriendRequest } = await import("../models/friendModel.js")
        await FriendRequest.deleteMany({
          $or: [
            { senderId: userId, receiverId: friendId },
            { senderId: friendId, receiverId: userId }
          ]
        })
        console.log(`Deleted all friend requests between ${userId} and ${friendId}`)

        // Xóa mối quan hệ bạn bè
        const deletedFriendship = await deleteFriendship(userId, friendId)
        console.log(`Deleted friendship result:`, deletedFriendship)

        if (!deletedFriendship) {
          console.log(`No friendship was deleted between ${userId} and ${friendId}`)
          return res.status(404).json({ message: "Friendship not found or already deleted" })
        }
      } catch (deleteError) {
        console.error("Error deleting friendship:", deleteError)
        return res.status(500).json({ message: "Error deleting friendship", error: deleteError.message })
      }

      // Xóa tất cả các conversation giữa hai người dùng
      try {
        const { Conversation } = await import("../models/messageModel.js")
        const deleteResult = await Conversation.deleteMany({
          participants: { $all: [userId, friendId], $size: 2 }
        })
        console.log(`Deleted ${deleteResult.deletedCount} conversations between ${userId} and ${friendId}`)
      } catch (convError) {
        console.error("Error deleting conversations:", convError)
        // Không return ở đây, tiếp tục xử lý
      }

      // Thông báo qua socket nếu người dùng online
      try {
        if (connectedUsers && connectedUsers.has(friendId)) {
          const friendSocketId = connectedUsers.get(friendId)
          console.log(`Sending socket notification to friend ${friendId} with socket ID ${friendSocketId}`)
          if (io) {
            io.to(friendSocketId).emit("friend_removed", {
              userId: userId,
            })
            io.to(friendSocketId).emit("friend_list_updated")
          }
        }

        // Thông báo cho người dùng hiện tại
        if (connectedUsers && connectedUsers.has(userId)) {
          const userSocketId = connectedUsers.get(userId)
          console.log(`Sending socket notification to user ${userId} with socket ID ${userSocketId}`)
          if (io) {
            io.to(userSocketId).emit("friend_list_updated")
          }
        }
      } catch (socketError) {
        console.error("Error sending socket notifications:", socketError)
        // Không return ở đây, tiếp tục xử lý
      }

      return res.status(200).json({
        message: "Friend removed successfully",
      })
    } catch (error) {
      console.error("Error in removeFriend:", error)
      return res.status(500).json({ message: "Server error", error: error.message })
    }
  }

  export const checkFriendshipStatus = async (req, res) => {
    try {
      const { userId } = req.params
      const currentUserId = req.user.userId

      console.log(`Checking friendship status between ${currentUserId} and ${userId}`)

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" })
      }

      if (currentUserId === userId) {
        return res.status(400).json({ message: "Cannot check friendship status with yourself" })
      }

      const user = await getUserById(userId)
      if (!user) {
        return res.status(404).json({ message: "User not found" })
      }

      // Kiểm tra xem có phải là bạn bè không
      try {
        const areFriends = await checkFriendship(currentUserId, userId)
        console.log(`Friendship check result: ${areFriends}`)

        if (areFriends) {
          return res.status(200).json({
            status: "friends",
          })
        }
      } catch (checkError) {
        console.error("Error checking friendship:", checkError)
        // Tiếp tục kiểm tra các trạng thái khác
      }

      // Kiểm tra xem có lời mời kết bạn đã gửi không
      try {
        const sentRequest = await getSentFriendRequests(currentUserId)
        const sentPending = sentRequest.find((req) => req.receiverId === userId && req.status === "pending")

        if (sentPending) {
          return res.status(200).json({
            status: "request_sent",
            requestId: sentPending.requestId,
          })
        }
      } catch (sentError) {
        console.error("Error checking sent requests:", sentError)
        // Tiếp tục kiểm tra các trạng thái khác
      }

      // Kiểm tra xem có lời mời kết bạn đã nhận không
      try {
        const receivedRequest = await getFriendRequests(currentUserId)
        const receivedPending = receivedRequest.find((req) => req.senderId === userId && req.status === "pending")

        if (receivedPending) {
          return res.status(200).json({
            status: "request_received",
            requestId: receivedPending.requestId,
          })
        }
      } catch (receivedError) {
        console.error("Error checking received requests:", receivedError)
        // Tiếp tục trả về trạng thái mặc định
      }

      // Nếu không có mối quan hệ nào, trả về not_friends
      console.log(`No relationship found between ${currentUserId} and ${userId}`)
      res.status(200).json({
        status: "not_friends",
      })
    } catch (error) {
      console.error("Error in checkFriendshipStatus:", error)
      res.status(500).json({ message: "Server error", error: error.message })
    }
  }
