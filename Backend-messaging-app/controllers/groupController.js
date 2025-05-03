import Group from "../models/groupModel.js"
import User from "../models/userModel.js"
import Message from "../models/messageModel.js"
import Conversation from "../models/conversationModel.js" // Thêm import này
import { v4 as uuidv4 } from "uuid"
import { connectedUsers } from "../app.js"

// Tạo nhóm mới
export const createGroup = async (req, res) => {
  try {
    const { name, members } = req.body
    const userId = req.user.userId

    if (!name || !members || !Array.isArray(members)) {
      return res.status(400).json({ message: "Tên nhóm và danh sách thành viên là bắt buộc" })
    }

    // Thêm người tạo vào danh sách thành viên nếu chưa có
    if (!members.includes(userId)) {
      members.push(userId)
    }

    // Kiểm tra xem tất cả thành viên có tồn tại không
    const users = await User.find({ userId: { $in: members } })
    if (users.length !== members.length) {
      return res.status(400).json({ message: "Một số thành viên không tồn tại" })
    }

    // Tạo conversation cho nhóm
    const conversationId = uuidv4()
    console.log(`Creating new conversation with ID: ${conversationId} for group`)

    const newConversation = new Conversation({
      conversationId,
      type: "group",
      participants: members,
      lastMessageId: null, // Không có tin nhắn cuối cùng khi mới tạo
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessageAt: new Date(),
    })

    try {
      await newConversation.save()
      console.log(`Successfully created conversation: ${conversationId}`)
    } catch (convError) {
      console.error("Error creating conversation:", convError)
      return res.status(500).json({ message: "Lỗi khi tạo cuộc trò chuyện cho nhóm" })
    }

    // Tạo nhóm mới
    const groupId = uuidv4()
    const newGroup = new Group({
      groupId,
      name,
      conversationId,
      admin: userId,
      members,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    await newGroup.save()

    // Tạo tin nhắn hệ thống thông báo nhóm được tạo
    const messageId = uuidv4()
    console.log(`Creating system message with ID: ${messageId} for group conversation: ${conversationId}`)

    try {
      const systemMessage = new Message({
        messageId,
        conversationId,
        senderId: "system",
        receiverId: "all", // Đánh dấu tất cả thành viên đều nhận
        type: "system",
        content: `Nhóm "${name}" đã được tạo bởi ${req.user.fullName || req.user.email}`,
        isSystemMessage: true,
        createdAt: new Date(),
      })
      await systemMessage.save()
      console.log(`Successfully created system message: ${messageId}`)

      // Cập nhật lastMessageId trong conversation
      await Conversation.findOneAndUpdate(
        { conversationId },
        {
          lastMessageId: messageId,
          lastMessageAt: new Date()
        }
      )
      console.log(`Updated conversation ${conversationId} with lastMessageId: ${messageId}`)
    } catch (msgError) {
      console.error("Error creating system message:", msgError)
      // Không return ở đây, tiếp tục xử lý
    }

    // Lấy thông tin chi tiết của các thành viên
    const memberDetails = await User.find({ userId: { $in: members } }).select("userId fullName email avatarUrl")

    // Thông báo cho tất cả thành viên qua socket
    const io = req.app.get("io")
    members.forEach((memberId) => {
      if (connectedUsers && connectedUsers.has(memberId)) {
        const memberSocketId = connectedUsers.get(memberId)
        io.to(memberSocketId).emit("group_created", {
          group: {
            groupId: newGroup.groupId,
            name: newGroup.name,
            conversationId: newGroup.conversationId,
            admin: newGroup.admin,
            members: memberDetails,
            createdAt: newGroup.createdAt,
          },
        })
      }
    })

    return res.status(201).json({
      message: "Nhóm đã được tạo thành công",
      group: {
        groupId: newGroup.groupId,
        name: newGroup.name,
        conversationId: newGroup.conversationId,
        admin: newGroup.admin,
        members: memberDetails,
        createdAt: newGroup.createdAt,
      },
    })
  } catch (error) {
    console.error("Error creating group:", error)
    return res.status(500).json({ message: "Lỗi server khi tạo nhóm" })
  }
}

// Lấy danh sách nhóm của người dùng
export const getUserGroups = async (req, res) => {
  try {
    const userId = req.user.userId

    // Tìm tất cả các nhóm mà người dùng là thành viên
    const groups = await Group.find({ members: userId })

    // Lấy thông tin chi tiết của các thành viên trong mỗi nhóm
    const groupsWithDetails = await Promise.all(
      groups.map(async (group) => {
        const memberDetails = await User.find({ userId: { $in: group.members } }).select(
          "userId fullName email avatarUrl",
        )

        // Lấy tin nhắn cuối cùng của nhóm
        const lastMessage = await Message.findOne({ conversationId: group.conversationId })
          .sort({ createdAt: -1 })
          .limit(1)

        return {
          groupId: group.groupId,
          name: group.name,
          conversationId: group.conversationId,
          admin: group.admin,
          members: memberDetails,
          createdAt: group.createdAt,
          updatedAt: group.updatedAt,
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                senderId: lastMessage.senderId,
                type: lastMessage.type,
                createdAt: lastMessage.createdAt,
              }
            : null,
        }
      }),
    )

    return res.status(200).json({
      groups: groupsWithDetails,
    })
  } catch (error) {
    console.error("Error getting user groups:", error)
    return res.status(500).json({ message: "Lỗi server khi lấy danh sách nhóm" })
  }
}

// Lấy thông tin chi tiết của một nhóm
export const getGroupDetails = async (req, res) => {
  try {
    const { groupId } = req.params
    const userId = req.user.userId

    const group = await Group.findOne({ groupId })
    if (!group) {
      return res.status(404).json({ message: "Không tìm thấy nhóm" })
    }

    // Kiểm tra xem người dùng có phải là thành viên của nhóm không
    if (!group.members.includes(userId)) {
      return res.status(403).json({ message: "Bạn không phải là thành viên của nhóm này" })
    }

    // Lấy thông tin chi tiết của các thành viên
    const memberDetails = await User.find({ userId: { $in: group.members } }).select("userId fullName email avatarUrl")

    return res.status(200).json({
      group: {
        groupId: group.groupId,
        name: group.name,
        conversationId: group.conversationId,
        admin: group.admin,
        members: memberDetails,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
      },
    })
  } catch (error) {
    console.error("Error getting group details:", error)
    return res.status(500).json({ message: "Lỗi server khi lấy thông tin nhóm" })
  }
}

// Thêm thành viên vào nhóm
export const addMember = async (req, res) => {
  try {
    const { groupId } = req.params
    const { memberId } = req.body
    const userId = req.user.userId

    if (!memberId) {
      return res.status(400).json({ message: "ID thành viên là bắt buộc" })
    }

    const group = await Group.findOne({ groupId })
    if (!group) {
      return res.status(404).json({ message: "Không tìm thấy nhóm" })
    }

    // Kiểm tra xem người dùng có phải là admin của nhóm không
    if (group.admin !== userId) {
      return res.status(403).json({ message: "Chỉ admin mới có thể thêm thành viên" })
    }

    // Kiểm tra xem thành viên đã có trong nhóm chưa
    if (group.members.includes(memberId)) {
      return res.status(400).json({ message: "Thành viên đã có trong nhóm" })
    }

    // Kiểm tra xem thành viên có tồn tại không
    const member = await User.findOne({ userId: memberId })
    if (!member) {
      return res.status(404).json({ message: "Không tìm thấy thành viên" })
    }

    // Thêm thành viên vào nhóm
    group.members.push(memberId)
    group.updatedAt = new Date()
    await group.save()

    // Cập nhật conversation
    await Conversation.updateOne(
      { conversationId: group.conversationId },
      { $addToSet: { participants: memberId }, $set: { updatedAt: new Date() } },
    )

    // Tạo tin nhắn hệ thống thông báo thành viên mới
    const systemMessage = new Message({
      messageId: uuidv4(),
      conversationId: group.conversationId,
      senderId: "system",
      type: "system",
      content: `${member.fullName || member.email} đã được thêm vào nhóm bởi ${req.user.fullName || req.user.email}`,
      isSystemMessage: true,
      createdAt: new Date(),
    })
    await systemMessage.save()

    // Thông báo cho tất cả thành viên qua socket
    const io = req.app.get("io")
    group.members.forEach((memberId) => {
      io.to(memberId).emit("group_member_added", {
        groupId: group.groupId,
        newMember: {
          userId: member.userId,
          fullName: member.fullName,
          email: member.email,
          avatarUrl: member.avatarUrl,
        },
        addedBy: userId,
      })
    })

    return res.status(200).json({
      message: "Thành viên đã được thêm vào nhóm",
      member: {
        userId: member.userId,
        fullName: member.fullName,
        email: member.email,
        avatarUrl: member.avatarUrl,
      },
    })
  } catch (error) {
    console.error("Error adding member to group:", error)
    return res.status(500).json({ message: "Lỗi server khi thêm thành viên" })
  }
}

// Xóa thành viên khỏi nhóm
export const removeMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.params
    const userId = req.user.userId

    const group = await Group.findOne({ groupId })
    if (!group) {
      return res.status(404).json({ message: "Không tìm thấy nhóm" })
    }

    // Kiểm tra xem người dùng có phải là admin của nhóm không
    if (group.admin !== userId) {
      return res.status(403).json({ message: "Chỉ admin mới có thể xóa thành viên" })
    }

    // Không thể xóa admin
    if (memberId === group.admin) {
      return res.status(400).json({ message: "Không thể xóa admin khỏi nhóm" })
    }

    // Kiểm tra xem thành viên có trong nhóm không
    if (!group.members.includes(memberId)) {
      return res.status(400).json({ message: "Thành viên không có trong nhóm" })
    }

    // Lấy thông tin thành viên
    const member = await User.findOne({ userId: memberId })
    if (!member) {
      return res.status(404).json({ message: "Không tìm thấy thành viên" })
    }

    // Xóa thành viên khỏi nhóm
    group.members = group.members.filter((id) => id !== memberId)
    group.updatedAt = new Date()
    await group.save()

    // Cập nhật conversation
    await Conversation.updateOne(
      { conversationId: group.conversationId },
      { $pull: { participants: memberId }, $set: { updatedAt: new Date() } },
    )

    // Tạo tin nhắn hệ thống thông báo thành viên bị xóa
    const systemMessage = new Message({
      messageId: uuidv4(),
      conversationId: group.conversationId,
      senderId: "system",
      type: "system",
      content: `${member.fullName || member.email} đã bị xóa khỏi nhóm bởi ${req.user.fullName || req.user.email}`,
      isSystemMessage: true,
      createdAt: new Date(),
    })
    await systemMessage.save()

    // Thông báo cho tất cả thành viên qua socket
    const io = req.app.get("io")
    ;[...group.members, memberId].forEach((id) => {
      io.to(id).emit("group_member_removed", {
        groupId: group.groupId,
        removedMember: {
          userId: member.userId,
          fullName: member.fullName,
          email: member.email,
        },
        removedBy: userId,
      })
    })

    return res.status(200).json({
      message: "Thành viên đã bị xóa khỏi nhóm",
      removedMember: {
        userId: member.userId,
        fullName: member.fullName,
        email: member.email,
      },
    })
  } catch (error) {
    console.error("Error removing member from group:", error)
    return res.status(500).json({ message: "Lỗi server khi xóa thành viên" })
  }
}

// Rời khỏi nhóm
export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params
    const userId = req.user.userId

    console.log(`User ${userId} attempting to leave group ${groupId}`)

    const group = await Group.findOne({ groupId })
    if (!group) {
      console.log(`Group ${groupId} not found`)
      return res.status(404).json({ message: "Không tìm thấy nhóm" })
    }

    console.log(`Group found: ${group.name}, admin: ${group.admin}, members: ${group.members.length}`)

    // Kiểm tra xem người dùng có trong nhóm không
    if (!group.members.includes(userId)) {
      console.log(`User ${userId} is not a member of group ${groupId}`)
      return res.status(400).json({ message: "Bạn không phải là thành viên của nhóm này" })
    }

    // Xử lý trường hợp người dùng là admin
    if (group.admin === userId) {
      console.log(`User ${userId} is the admin of group ${groupId}`)

      if (group.members.length > 1) {
        // Chọn thành viên khác làm admin mới
        const newAdmin = group.members.find((id) => id !== userId)
        console.log(`Assigning new admin: ${newAdmin} for group ${groupId}`)
        group.admin = newAdmin

        // Xóa người dùng khỏi nhóm
        group.members = group.members.filter((id) => id !== userId)
        group.updatedAt = new Date()
        await group.save()

        // Cập nhật conversation
        await Conversation.updateOne(
          { conversationId: group.conversationId },
          { $pull: { participants: userId }, $set: { updatedAt: new Date() } }
        )

        // Tạo tin nhắn hệ thống thông báo thay đổi admin và rời nhóm
        const systemMessage = new Message({
          messageId: uuidv4(),
          conversationId: group.conversationId,
          senderId: "system",
          receiverId: "all",
          type: "system",
          content: `${req.user.fullName || req.user.email} đã rời khỏi nhóm và chuyển quyền admin cho thành viên khác`,
          isSystemMessage: true,
          createdAt: new Date(),
        })
        await systemMessage.save()
      } else {
        // Nếu admin là thành viên duy nhất, xóa nhóm
        console.log(`Admin is the only member, deleting group ${groupId}`)
        await Group.deleteOne({ groupId })
        await Conversation.deleteOne({ conversationId: group.conversationId })

        return res.status(200).json({
          message: "Nhóm đã bị xóa vì không còn thành viên nào",
        })
      }
    } else {
      // Người dùng không phải admin, chỉ cần rời nhóm
      console.log(`Regular member ${userId} leaving group ${groupId}`)

      // Xóa người dùng khỏi nhóm
      group.members = group.members.filter((id) => id !== userId)
      group.updatedAt = new Date()
      await group.save()

      // Cập nhật conversation
      await Conversation.updateOne(
        { conversationId: group.conversationId },
        { $pull: { participants: userId }, $set: { updatedAt: new Date() } }
      )

      // Tạo tin nhắn hệ thống thông báo người dùng rời nhóm
      const systemMessage = new Message({
        messageId: uuidv4(),
        conversationId: group.conversationId,
        senderId: "system",
        receiverId: "all",
        type: "system",
        content: `${req.user.fullName || req.user.email} đã rời khỏi nhóm`,
        isSystemMessage: true,
        createdAt: new Date(),
      })
      await systemMessage.save()
    }

    // Thông báo cho tất cả thành viên qua socket
    const io = req.app.get("io")
    group.members.forEach((memberId) => {
      io.to(memberId).emit("group_member_left", {
        groupId: group.groupId,
        member: {
          userId: req.user.userId,
          fullName: req.user.fullName,
          email: req.user.email,
        },
      })
    })

    // Thông báo cho người dùng đã rời nhóm
    if (io && connectedUsers && connectedUsers.has(userId)) {
      const userSocketId = connectedUsers.get(userId)
      io.to(userSocketId).emit("left_group", {
        groupId: group.groupId,
        name: group.name
      })
    }

    return res.status(200).json({
      message: "Bạn đã rời khỏi nhóm thành công",
    })
  } catch (error) {
    console.error("Error leaving group:", error)
    return res.status(500).json({ message: "Lỗi server khi rời nhóm" })
  }
}

// Đổi tên nhóm
export const renameGroup = async (req, res) => {
  try {
    const { groupId } = req.params
    const { name } = req.body
    const userId = req.user.userId

    if (!name) {
      return res.status(400).json({ message: "Tên nhóm là bắt buộc" })
    }

    const group = await Group.findOne({ groupId })
    if (!group) {
      return res.status(404).json({ message: "Không tìm thấy nhóm" })
    }

    // Kiểm tra xem người dùng có phải là admin của nhóm không
    if (group.admin !== userId) {
      return res.status(403).json({ message: "Chỉ admin mới có thể đổi tên nhóm" })
    }

    // Lưu tên cũ để thông báo
    const oldName = group.name

    // Đổi tên nhóm
    group.name = name
    group.updatedAt = new Date()
    await group.save()

    // Tạo tin nhắn hệ thống thông báo đổi tên nhóm
    const systemMessage = new Message({
      messageId: uuidv4(),
      conversationId: group.conversationId,
      senderId: "system",
      type: "system",
      content: `Nhóm đã được đổi tên từ "${oldName}" thành "${name}" bởi ${req.user.fullName || req.user.email}`,
      isSystemMessage: true,
      createdAt: new Date(),
    })
    await systemMessage.save()

    // Thông báo cho tất cả thành viên qua socket
    const io = req.app.get("io")
    group.members.forEach((memberId) => {
      io.to(memberId).emit("group_renamed", {
        groupId: group.groupId,
        oldName,
        newName: name,
        updatedBy: userId,
      })
    })

    return res.status(200).json({
      message: "Đổi tên nhóm thành công",
      group: {
        groupId: group.groupId,
        name: group.name,
        updatedAt: group.updatedAt,
      },
    })
  } catch (error) {
    console.error("Error renaming group:", error)
    return res.status(500).json({ message: "Lỗi server khi đổi tên nhóm" })
  }
}

// Lấy danh sách bạn bè cho việc tạo nhóm
export const getFriendsForGroupCreation = async (req, res) => {
  try {
    const userId = req.user.userId
    console.log(`Getting friends for group creation for user: ${userId}`)

    // Lấy danh sách bạn bè đã chấp nhận
    const friendships = await Friendship.find({
      $or: [
        { user1Id: userId },
        { user2Id: userId }
      ]
    })

    if (!friendships || friendships.length === 0) {
      return res.status(200).json({
        message: "Không có bạn bè nào",
        friends: []
      })
    }

    // Lấy danh sách ID của bạn bè
    const friendIds = friendships.map(friendship =>
      friendship.user1Id === userId ? friendship.user2Id : friendship.user1Id
    )

    // Lấy thông tin chi tiết của bạn bè
    const friends = await User.find({ userId: { $in: friendIds } })
      .select("userId fullName email avatarUrl")

    return res.status(200).json({
      message: "Danh sách bạn bè lấy thành công",
      friends: friends.map(friend => ({
        userId: friend.userId,
        fullName: friend.fullName,
        email: friend.email,
        avatarUrl: friend.avatarUrl
      }))
    })
  } catch (error) {
    console.error("Error getting friends for group creation:", error)
    return res.status(500).json({ message: "Lỗi server khi lấy danh sách bạn bè" })
  }
}

// Xóa nhóm
export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params
    const userId = req.user.userId

    const group = await Group.findOne({ groupId })
    if (!group) {
      return res.status(404).json({ message: "Không tìm thấy nhóm" })
    }

    // Kiểm tra xem người dùng có phải là admin của nhóm không
    if (group.admin !== userId) {
      return res.status(403).json({ message: "Chỉ admin mới có thể xóa nhóm" })
    }

    // Lưu thông tin nhóm để thông báo
    const groupInfo = {
      groupId: group.groupId,
      name: group.name,
      members: [...group.members],
    }

    // Xóa nhóm
    await Group.deleteOne({ groupId })

    // Xóa conversation
    await Conversation.deleteOne({ conversationId: group.conversationId })

    // Thông báo cho tất cả thành viên qua socket
    const io = req.app.get("io")
    groupInfo.members.forEach((memberId) => {
      if (connectedUsers && connectedUsers.has(memberId)) {
        const memberSocketId = connectedUsers.get(memberId)
        io.to(memberSocketId).emit("group_deleted", {
          groupId: groupInfo.groupId,
          name: groupInfo.name,
          deletedBy: userId,
        })
      }
    })

    return res.status(200).json({
      message: "Nhóm đã được xóa thành công",
    })
  } catch (error) {
    console.error("Error deleting group:", error)
    return res.status(500).json({ message: "Lỗi server khi xóa nhóm" })
  }
}

// Gửi tin nhắn văn bản trong nhóm
export const sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params
    const { content } = req.body
    const senderId = req.user.userId

    if (!content || content.trim() === "") {
      return res.status(400).json({ message: "Nội dung tin nhắn không được để trống" })
    }

    // Kiểm tra nhóm có tồn tại không
    const group = await Group.findOne({ groupId })
    if (!group) {
      return res.status(404).json({ message: "Không tìm thấy nhóm" })
    }

    // Kiểm tra người gửi có phải là thành viên của nhóm không
    if (!group.members.includes(senderId)) {
      return res.status(403).json({ message: "Bạn không phải là thành viên của nhóm này" })
    }

    // Tạo tin nhắn mới
    const messageId = uuidv4()
    const newMessage = new Message({
      messageId,
      conversationId: group.conversationId,
      senderId,
      type: "text",
      content,
      createdAt: new Date(),
    })

    await newMessage.save()

    // Cập nhật lastMessageId và lastMessageAt của conversation
    await Conversation.findOneAndUpdate(
      { conversationId: group.conversationId },
      {
        lastMessageId: messageId,
        lastMessageAt: new Date()
      }
    )

    // Lấy thông tin người gửi
    const sender = await User.findOne({ userId: senderId })

    // Gửi tin nhắn qua socket cho tất cả thành viên trong nhóm
    const io = req.app.get("io")
    group.members.forEach((memberId) => {
      if (connectedUsers.has(memberId) && memberId !== senderId) {
        const memberSocketId = connectedUsers.get(memberId)
        io.to(memberSocketId).emit("group_message", {
          messageId,
          groupId,
          senderId,
          senderName: sender.fullName || sender.email,
          content,
          type: "text",
          createdAt: newMessage.createdAt
        })
      }
    })

    return res.status(201).json({
      message: "Tin nhắn đã được gửi thành công",
      messageData: {
        messageId: newMessage.messageId,
        conversationId: newMessage.conversationId,
        senderId: newMessage.senderId,
        type: newMessage.type,
        content: newMessage.content,
        createdAt: newMessage.createdAt
      }
    })
  } catch (error) {
    console.error("Error sending group message:", error)
    return res.status(500).json({ message: "Lỗi server khi gửi tin nhắn" })
  }
}

// Gửi ảnh trong nhóm
export const sendGroupImage = async (req, res) => {
  try {
    const { groupId } = req.params
    const senderId = req.user.userId

    // Kiểm tra nhóm có tồn tại không
    const group = await Group.findOne({ groupId })
    if (!group) {
      return res.status(404).json({ message: "Không tìm thấy nhóm" })
    }

    // Kiểm tra người gửi có phải là thành viên của nhóm không
    if (!group.members.includes(senderId)) {
      return res.status(403).json({ message: "Bạn không phải là thành viên của nhóm này" })
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Không có ảnh nào được tải lên" })
    }

    const attachments = await Promise.all(
      req.files.map(async (file) => {
        const result = await uploadImage(file.buffer, file.mimetype, "messages")
        return {
          url: result.url,
          type: file.mimetype,
          name: file.originalname,
          size: file.size,
        }
      })
    )

    // Tạo tin nhắn mới
    const messageId = uuidv4()
    const newMessage = new Message({
      messageId,
      conversationId: group.conversationId,
      senderId,
      type: attachments.length > 1 ? "imageGroup" : "image",
      attachments,
      createdAt: new Date(),
    })

    await newMessage.save()

    // Cập nhật lastMessageId và lastMessageAt của conversation
    await Conversation.findOneAndUpdate(
      { conversationId: group.conversationId },
      {
        lastMessageId: messageId,
        lastMessageAt: new Date()
      }
    )

    // Lấy thông tin người gửi
    const sender = await User.findOne({ userId: senderId })

    // Gửi tin nhắn qua socket cho tất cả thành viên trong nhóm
    const io = req.app.get("io")
    group.members.forEach((memberId) => {
      if (connectedUsers.has(memberId) && memberId !== senderId) {
        const memberSocketId = connectedUsers.get(memberId)
        io.to(memberSocketId).emit("group_message", {
          messageId,
          groupId,
          senderId,
          senderName: sender.fullName || sender.email,
          type: newMessage.type,
          attachments,
          createdAt: newMessage.createdAt
        })
      }
    })

    return res.status(201).json({
      message: "Ảnh đã được gửi thành công",
      messageData: {
        messageId: newMessage.messageId,
        conversationId: newMessage.conversationId,
        senderId: newMessage.senderId,
        type: newMessage.type,
        attachments: newMessage.attachments,
        createdAt: newMessage.createdAt
      }
    })
  } catch (error) {
    console.error("Error sending group image:", error)
    return res.status(500).json({ message: "Lỗi server khi gửi ảnh" })
  }
}

// Gửi video trong nhóm
export const sendGroupVideo = async (req, res) => {
  try {
    const { groupId } = req.params
    const senderId = req.user.userId

    // Kiểm tra nhóm có tồn tại không
    const group = await Group.findOne({ groupId })
    if (!group) {
      return res.status(404).json({ message: "Không tìm thấy nhóm" })
    }

    // Kiểm tra người gửi có phải là thành viên của nhóm không
    if (!group.members.includes(senderId)) {
      return res.status(403).json({ message: "Bạn không phải là thành viên của nhóm này" })
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Không có video nào được tải lên" })
    }

    const attachments = await Promise.all(
      req.files.map(async (file) => {
        const result = await uploadVideo(file.buffer, file.mimetype, "messages")
        return {
          url: result.url,
          type: file.mimetype,
          name: file.originalname,
          size: file.size,
        }
      })
    )

    // Tạo tin nhắn mới
    const messageId = uuidv4()
    const newMessage = new Message({
      messageId,
      conversationId: group.conversationId,
      senderId,
      type: "video",
      attachments,
      createdAt: new Date(),
    })

    await newMessage.save()

    // Cập nhật lastMessageId và lastMessageAt của conversation
    await Conversation.findOneAndUpdate(
      { conversationId: group.conversationId },
      {
        lastMessageId: messageId,
        lastMessageAt: new Date()
      }
    )

    // Lấy thông tin người gửi
    const sender = await User.findOne({ userId: senderId })

    // Gửi tin nhắn qua socket cho tất cả thành viên trong nhóm
    const io = req.app.get("io")
    group.members.forEach((memberId) => {
      if (connectedUsers.has(memberId) && memberId !== senderId) {
        const memberSocketId = connectedUsers.get(memberId)
        io.to(memberSocketId).emit("group_message", {
          messageId,
          groupId,
          senderId,
          senderName: sender.fullName || sender.email,
          type: "video",
          attachments,
          createdAt: newMessage.createdAt
        })
      }
    })

    return res.status(201).json({
      message: "Video đã được gửi thành công",
      messageData: {
        messageId: newMessage.messageId,
        conversationId: newMessage.conversationId,
        senderId: newMessage.senderId,
        type: newMessage.type,
        attachments: newMessage.attachments,
        createdAt: newMessage.createdAt
      }
    })
  } catch (error) {
    console.error("Error sending group video:", error)
    return res.status(500).json({ message: "Lỗi server khi gửi video" })
  }
}

// Gửi file trong nhóm
export const sendGroupFile = async (req, res) => {
  try {
    const { groupId } = req.params
    const senderId = req.user.userId

    // Kiểm tra nhóm có tồn tại không
    const group = await Group.findOne({ groupId })
    if (!group) {
      return res.status(404).json({ message: "Không tìm thấy nhóm" })
    }

    // Kiểm tra người gửi có phải là thành viên của nhóm không
    if (!group.members.includes(senderId)) {
      return res.status(403).json({ message: "Bạn không phải là thành viên của nhóm này" })
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Không có file nào được tải lên" })
    }

    const attachments = await Promise.all(
      req.files.map(async (file) => {
        const result = await uploadFile(file.buffer, file.mimetype, "messages")
        return {
          url: result.url,
          type: file.mimetype,
          name: file.originalname,
          size: file.size,
        }
      })
    )

    // Tạo tin nhắn mới
    const messageId = uuidv4()
    const newMessage = new Message({
      messageId,
      conversationId: group.conversationId,
      senderId,
      type: "file",
      attachments,
      createdAt: new Date(),
    })

    await newMessage.save()

    // Cập nhật lastMessageId và lastMessageAt của conversation
    await Conversation.findOneAndUpdate(
      { conversationId: group.conversationId },
      {
        lastMessageId: messageId,
        lastMessageAt: new Date()
      }
    )

    // Lấy thông tin người gửi
    const sender = await User.findOne({ userId: senderId })

    // Gửi tin nhắn qua socket cho tất cả thành viên trong nhóm
    const io = req.app.get("io")
    group.members.forEach((memberId) => {
      if (connectedUsers.has(memberId) && memberId !== senderId) {
        const memberSocketId = connectedUsers.get(memberId)
        io.to(memberSocketId).emit("group_message", {
          messageId,
          groupId,
          senderId,
          senderName: sender.fullName || sender.email,
          type: "file",
          attachments,
          createdAt: newMessage.createdAt
        })
      }
    })

    return res.status(201).json({
      message: "File đã được gửi thành công",
      messageData: {
        messageId: newMessage.messageId,
        conversationId: newMessage.conversationId,
        senderId: newMessage.senderId,
        type: newMessage.type,
        attachments: newMessage.attachments,
        createdAt: newMessage.createdAt
      }
    })
  } catch (error) {
    console.error("Error sending group file:", error)
    return res.status(500).json({ message: "Lỗi server khi gửi file" })
  }
}
