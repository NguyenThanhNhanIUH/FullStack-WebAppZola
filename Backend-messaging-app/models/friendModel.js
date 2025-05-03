import mongoose from "mongoose"
import { v4 as uuidv4 } from "uuid"


const friendRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      default: () => uuidv4(),
    },
    senderId: {
      type: String,
      required: true,
      ref: "User",
    },
    receiverId: {
      type: String,
      required: true,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    message: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
)

const friendshipSchema = new mongoose.Schema(
  {
    friendshipId: {
      type: String,
      required: true,
      unique: true,
      default: () => uuidv4(),
    },
    user1Id: {
      type: String,
      required: true,
      ref: "User",
    },
    user2Id: {
      type: String,
      required: true,
      ref: "User",
    },
    lastInteractionAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)


friendshipSchema.index({ user1Id: 1, user2Id: 1 }, { unique: true })

friendRequestSchema.index({ senderId: 1, receiverId: 1 }, { unique: true })

export const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema)
export const Friendship = mongoose.model("Friendship", friendshipSchema)


export const createFriendRequest = async (senderId, receiverId, message = "") => {
  try {
    console.log(`Đang tạo lời mời kết bạn từ ${senderId} đến ${receiverId}`);

    // 1. Xóa lời mời kết bạn cũ nếu có
    try {
      console.log("Xóa mọi lời mời kết bạn cũ giữa hai người dùng");
      const deleteResult = await FriendRequest.deleteMany({
        $or: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId }
        ]
      });
      console.log(`Đã xóa ${deleteResult.deletedCount} lời mời kết bạn cũ`);
    } catch (error) {
      console.log("Không thể xóa lời mời kết bạn cũ:", error.message);
    }

    // 2. Xóa mối quan hệ bạn bè nếu có
    try {
      console.log("Xóa mối quan hệ bạn bè cũ giữa hai người dùng nếu có");
      const deleteFriendResult = await Friendship.deleteMany({
        $or: [
          { user1Id: senderId, user2Id: receiverId },
          { user1Id: receiverId, user2Id: senderId }
        ]
      });
      console.log(`Đã xóa ${deleteFriendResult.deletedCount} mối quan hệ bạn bè cũ`);
    } catch (error) {
      console.log("Không thể xóa mối quan hệ bạn bè:", error.message);
    }

    // 3. Tạo lời mời kết bạn mới
    console.log("Tạo lời mời kết bạn mới");
    const friendRequest = new FriendRequest({
      requestId: uuidv4(),
      senderId,
      receiverId,
      message,
      status: "pending"
    });

    await friendRequest.save();
    console.log("Đã tạo lời mời kết bạn mới thành công:", friendRequest.requestId);
    return friendRequest;
  } catch (error) {
    console.error("Error in createFriendRequest:", error);
    throw error;
  }
};

export const getFriendRequestById = async (requestId) => {
  try {
    return await FriendRequest.findOne({ requestId })
  } catch (error) {
    console.error("Error getting friend request:", error)
    throw error
  }
}

export const getFriendRequests = async (userId, status = "pending") => {
  try {
    console.log(`Đang tìm lời mời kết bạn cho userId: ${userId} với status: ${status}`);

    // Liệt kê tất cả lời mời kết bạn trong hệ thống để debug
    const allRequests = await FriendRequest.find({});
    console.log(`Tất cả lời mời kết bạn trong hệ thống (${allRequests.length}):`,
      allRequests.map(req => ({
        id: req.requestId,
        senderId: req.senderId,
        receiverId: req.receiverId,
        status: req.status,
        createdAt: req.createdAt
      }))
    );

    // Tìm lời mời kết bạn dành cho người dùng hiện tại
    const requests = await FriendRequest.find({
      receiverId: userId,
      status,
    }).sort({ createdAt: -1 });

    console.log(`Lời mời kết bạn cho userId ${userId} với status ${status} (${requests.length}):`,
      requests.map(req => ({
        id: req.requestId,
        senderId: req.senderId,
        status: req.status,
        createdAt: req.createdAt
      }))
    );

    return requests;
  } catch (error) {
    console.error("Error getting friend requests:", error);
    throw error;
  }
};

export const getSentFriendRequests = async (userId, status = "pending") => {
  try {
    return await FriendRequest.find({
      senderId: userId,
      status,
    }).sort({ createdAt: -1 })
  } catch (error) {
    console.error("Error getting sent friend requests:", error)
    throw error
  }
}

export const updateFriendRequestStatus = async (requestId, status) => {
  try {
    if (!requestId) {
      throw new Error("Request ID is required")
    }

    if (!["accepted", "rejected"].includes(status)) {
      throw new Error("Invalid status. Must be 'accepted' or 'rejected'")
    }

    console.log(`Updating friend request ${requestId} to status: ${status}`)

    const request = await FriendRequest.findOneAndUpdate(
      { requestId },
      { status },
      { new: true }
    )

    if (!request) {
      throw new Error("Friend request not found")
    }

    console.log(`Updated friend request:`, request)

    // Nếu chấp nhận lời mời, tạo mối quan hệ bạn bè
    if (status === "accepted") {
      console.log(`Friend request accepted, creating friendship between ${request.senderId} and ${request.receiverId}`)

      // Kiểm tra xem đã là bạn bè chưa
      try {
        const existingFriendship = await Friendship.findOne({
          $or: [
            { user1Id: request.senderId, user2Id: request.receiverId },
            { user1Id: request.receiverId, user2Id: request.senderId }
          ]
        })

        if (existingFriendship) {
          console.log(`Friendship already exists:`, existingFriendship)
        } else {
          console.log(`Creating new friendship between ${request.senderId} and ${request.receiverId}`)
          await createFriendship(request.senderId, request.receiverId)
        }
      } catch (friendshipError) {
        console.error("Error creating friendship:", friendshipError)
        // Không throw lỗi ở đây để không ảnh hưởng đến việc cập nhật trạng thái lời mời
      }
    }

    return request
  } catch (error) {
    console.error("Error updating friend request:", error)
    throw error
  }
}

export const createFriendship = async (user1Id, user2Id) => {
  try {
    if (!user1Id || !user2Id) {
      console.error("Invalid user IDs for createFriendship:", { user1Id, user2Id })
      throw new Error("Both user IDs are required to create a friendship")
    }

    // Sắp xếp ID để đảm bảo tính nhất quán
    const [sortedUser1, sortedUser2] = [user1Id, user2Id].sort()

    // Kiểm tra xem friendship đã tồn tại chưa
    const existingFriendship = await Friendship.findOne({
      $or: [
        { user1Id: sortedUser1, user2Id: sortedUser2 },
        { user1Id: sortedUser2, user2Id: sortedUser1 }
      ]
    })

    if (existingFriendship) {
      console.log("Friendship already exists:", existingFriendship)
      return existingFriendship
    }

    // Kiểm tra xem có lời mời kết bạn đã được chấp nhận không
    const acceptedRequest = await FriendRequest.findOne({
      $or: [
        { senderId: user1Id, receiverId: user2Id, status: "accepted" },
        { senderId: user2Id, receiverId: user1Id, status: "accepted" }
      ]
    })

    if (!acceptedRequest) {
      console.log(`No accepted friend request found between ${user1Id} and ${user2Id}`)

      // Kiểm tra xem có lời mời kết bạn đang chờ xử lý không
      const pendingRequest = await FriendRequest.findOne({
        $or: [
          { senderId: user1Id, receiverId: user2Id, status: "pending" },
          { senderId: user2Id, receiverId: user1Id, status: "pending" }
        ]
      })

      if (pendingRequest) {
        console.log(`Found pending friend request between ${user1Id} and ${user2Id}, cannot create friendship yet`)
        throw new Error("Cannot create friendship with pending friend request")
      } else {
        console.log(`No friend request found between ${user1Id} and ${user2Id}`)

        // Tự động tạo và chấp nhận lời mời kết bạn nếu không tìm thấy
        console.log(`Creating and accepting friend request between ${user1Id} and ${user2Id}`)

        // Tạo lời mời kết bạn mới
        const newRequestId = uuidv4()
        const newRequest = new FriendRequest({
          requestId: newRequestId,
          senderId: user1Id,
          receiverId: user2Id,
          message: "Automatic friend request",
          status: "accepted",
          createdAt: new Date()
        })

        await newRequest.save()
        console.log("Created and accepted new friend request:", newRequest)
      }
    }

    // Tạo friendship mới
    const friendship = new Friendship({
      friendshipId: uuidv4(),
      user1Id: sortedUser1,
      user2Id: sortedUser2,
      lastInteractionAt: new Date()
    })

    await friendship.save()
    console.log("Created new friendship:", friendship)
    return friendship
  } catch (error) {
    console.error("Error in createFriendship:", error)
    throw error
  }
}

export const getFriendships = async (userId) => {
  try {
    return await Friendship.find({
      $or: [{ user1Id: userId }, { user2Id: userId }],
    }).sort({ lastInteractionAt: -1 })
  } catch (error) {
    console.error("Error getting friendships:", error)
    throw error
  }
}

export const getFriendship = async (user1Id, user2Id) => {
  try {
    return await Friendship.findOne({
      $or: [
        { user1Id: user1Id, user2Id: user2Id },
        { user1Id: user2Id, user2Id: user1Id },
      ],
    })
  } catch (error) {
    console.error("Error getting friendship:", error)
    throw error
  }
}

export const updateFriendshipLastInteraction = async (user1Id, user2Id) => {
  try {
    const [sortedUser1, sortedUser2] = [user1Id, user2Id].sort()

    return await Friendship.findOneAndUpdate(
      {
        user1Id: sortedUser1,
        user2Id: sortedUser2,
      },
      { lastInteractionAt: new Date() },
      { new: true },
    )
  } catch (error) {
    console.error("Error updating friendship last interaction:", error)
    throw error
  }
}

export const deleteFriendship = async (user1Id, user2Id) => {
  try {
    if (!user1Id || !user2Id) {
      console.error("Invalid user IDs for deleteFriendship:", { user1Id, user2Id })
      return null
    }

    console.log(`Attempting to delete friendship between ${user1Id} and ${user2Id}`)

    // Kiểm tra xem friendship có tồn tại không trước khi xóa
    try {
      const existingFriendship = await getFriendship(user1Id, user2Id)
      if (!existingFriendship) {
        console.log(`No friendship found to delete between ${user1Id} and ${user2Id}`)
        return null
      }

      console.log(`Found friendship to delete:`, existingFriendship)
    } catch (checkError) {
      console.error("Error checking existing friendship:", checkError)
      // Tiếp tục thực hiện xóa ngay cả khi kiểm tra thất bại
    }

    // Xóa friendship
    const result = await Friendship.findOneAndDelete({
      $or: [
        { user1Id: user1Id, user2Id: user2Id },
        { user1Id: user2Id, user2Id: user1Id },
      ],
    })

    if (!result) {
      console.log(`No friendship record found to delete between ${user1Id} and ${user2Id}`)
      return null
    }

    console.log(`Friendship deletion result:`, result)

    return result
  } catch (error) {
    console.error("Error deleting friendship:", error)
    // Trả về null thay vì throw lỗi để tránh crash
    return null
  }
}

export const checkFriendship = async (user1Id, user2Id) => {
  try {
    console.log(`Checking friendship between ${user1Id} and ${user2Id}`)
    const friendship = await getFriendship(user1Id, user2Id)
    console.log(`Friendship check result:`, friendship)

    // Kiểm tra xem friendship có tồn tại không
    if (!friendship) {
      console.log(`No friendship found between ${user1Id} and ${user2Id}`)
      return false
    }

    // Kiểm tra xem friendship có hợp lệ không
    if (!friendship.user1Id || !friendship.user2Id) {
      console.log(`Invalid friendship data between ${user1Id} and ${user2Id}:`, friendship)
      return false
    }

    console.log(`Valid friendship found between ${user1Id} and ${user2Id}`)
    return true
  } catch (error) {
    console.error("Error checking friendship:", error)
    return false // Trả về false thay vì throw error để tránh crash
  }
}
