import { getUserById, updateUser, verifyPassword } from "../models/userModel.js"
import {
  uploadAvatar,
  getAvatarUrl,
  deleteAvatar,
  generatePresignedUploadUrl,
} from "../services/supabaseStorageService.js"
import { validateEmail } from "../services/emailService.js"
import { checkFriendship, getFriendRequests, getSentFriendRequests } from "../models/friendModel.js"
import mongoose from "mongoose";
import User from "../models/userModel.js";

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId

    const user = await getUserById(userId)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    let avatarUrl = user.avatarUrl || null
    if (user.avatarUrl) {
      try {
        if (user.avatarUrl.startsWith("http")) {
          avatarUrl = user.avatarUrl
        } else {
          avatarUrl = await getAvatarUrl(user.avatarUrl)
        }
      } catch (avatarError) {
        console.warn("Error fetching avatar URL:", avatarError)
        avatarUrl = user.avatarUrl
      }
    }

    let birthdate = user.birthdate
    if (birthdate) {
      birthdate = birthdate.toISOString()
    }

    res.status(200).json({
      userId: user.userId,
      email: user.email,
      fullName: user.fullName,
      birthdate: birthdate,
      gender: user.gender,
      avatarUrl: avatarUrl,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    })
  } catch (error) {
    console.error("Error in getUserProfile:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}


export const searchUsers = async (req, res) => {
  try {
    res.set("Cache-Control", "no-store"); // Tắt cache
    const { query } = req.query;
    console.log(`Searching for user with query: ${query}`);
    console.log(`Current userId: ${req.user.userId}`);
    const users = await User.find({
      email: { $regex: `^${query}$`, $options: "i" }, // Tìm kiếm chính xác email
      // Bỏ điều kiện userId: { $ne: req.user.userId } nếu muốn tìm cả chính mình
    }).select("userId email fullName avatarUrl");
    console.log(`Found ${users.length} users:`, users);
    if (!users.length) {
      console.log(`No user found for query: ${query}`);
      return res.status(404).json({ message: "Không tìm thấy người dùng với email này" });
    }
    res.status(200).json({ data: users });
  } catch (error) {
    console.error(`Error searching users: ${error.message}`);
    res.status(500).json({ message: "Lỗi khi tìm kiếm người dùng", error: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId
    const { fullName, birthdate, gender, email } = req.body

    const updateData = {
      fullName,
      birthdate,
      gender
    }

    if (email) {
      if (!validateEmail(email)) {
        return res.status(400).json({ message: "Invalid email format" })
      }
      updateData.email = email
    }

    const updatedUser = await updateUser(userId, updateData)

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" })
    }

    let avatarUrl = updatedUser.avatarUrl || null
    if (updatedUser.avatarUrl) {
      try {
        if (updatedUser.avatarUrl.startsWith("http")) {
          avatarUrl = updatedUser.avatarUrl
        } else {
          avatarUrl = await getAvatarUrl(updatedUser.avatarUrl)
        }
      } catch (avatarError) {
        console.warn("Error fetching avatar URL:", avatarError)
      }
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        userId: updatedUser.userId,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        birthdate: updatedUser.birthdate,
        gender: updatedUser.gender,
        avatarUrl,
      },
    })
  } catch (error) {
    console.error("Error in updateUserProfile:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

export const uploadUserAvatar = async (req, res) => {
  try {
    const userId = req.user.userId

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    const user = await getUserById(userId)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (user.avatarUrl) {
      await deleteAvatar(user.avatarUrl)
    }
    const key = await uploadAvatar(userId, req.file.buffer, req.file.mimetype)
    const updatedUser = await updateUser(userId, { avatarUrl: key })
    const avatarUrl = await getAvatarUrl(key)

    res.status(200).json({
      message: "Avatar uploaded successfully",
      avatarUrl,
    })
  } catch (error) {
    console.error("Error in uploadUserAvatar:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

export const getAvatarUploadUrl = async (req, res) => {
  try {
    const userId = req.user.userId
    const { fileType } = req.body

    if (!fileType) {
      return res.status(400).json({ message: "File type is required" })
    }

    const { url, key, headers } = await generatePresignedUploadUrl(userId, fileType)

    res.status(200).json({
      uploadUrl: url,
      key,
      headers,
    })
  } catch (error) {
    console.error("Error in getAvatarUploadUrl:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

export const confirmAvatarUpload = async (req, res) => {
  try {
    const userId = req.user.userId
    const { key } = req.body

    if (!key) {
      return res.status(400).json({ message: "Avatar key is required" })
    }
    const user = await getUserById(userId)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    if (user.avatarUrl) {
      await deleteAvatar(user.avatarUrl)
    }

    const updatedUser = await updateUser(userId, { avatarUrl: key })

    const avatarUrl = await getAvatarUrl(key)

    res.status(200).json({
      message: "Avatar updated successfully",
      avatarUrl,
    })
  } catch (error) {
    console.error("Error in confirmAvatarUpload:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

export const updatePassword = async (req, res) => {
  try {
    const userId = req.user.userId
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required",
      })
    }

    const user = await getUserById(userId)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Verify current password
    const isMatch = await verifyPassword(currentPassword, user.password)

    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" })
    }

    // Update with new password
    await updateUser(userId, { password: newPassword })

    res.status(200).json({ message: "Password updated successfully" })
  } catch (error) {
    console.error("Error in updatePassword:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}
