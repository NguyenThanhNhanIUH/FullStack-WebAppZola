import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import { v4 as uuidv4 } from "uuid"
import { USERS_COLLECTION } from "../config/mongodbConfig.js"

const parseDateString = (dateString) => {
  if (!dateString) return null

  const parts = dateString.split("/")
  if (parts.length !== 3) return null

  const day = Number.parseInt(parts[0], 10)
  const month = Number.parseInt(parts[1], 10) - 1
  const year = Number.parseInt(parts[2], 10)

  const date = new Date(Date.UTC(year, month, day))

  if (date.getUTCDate() !== day || date.getUTCMonth() !== month || date.getUTCFullYear() !== year) {
    return null
  }

  return date
}

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  birthdate: { type: Date, required: true },
  gender: { type: String, required: true },
  avatarUrl: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

const User = mongoose.model(USERS_COLLECTION, userSchema)

export const createUser = async (userData) => {
  try {
    const userId = userData.userId || uuidv4()
    if (userData.password) {
      const salt = await bcrypt.genSalt(10)
      userData.password = await bcrypt.hash(userData.password, salt)
    }

    let birthdate = null
    if (userData.birthdate) {
      if (typeof userData.birthdate === "string") {
        birthdate = parseDateString(userData.birthdate)
        if (!birthdate) {
          console.warn(`Invalid birthdate format: ${userData.birthdate}. Expected format: DD/MM/YYYY`)
        }
      } else if (userData.birthdate instanceof Date) {
        birthdate = userData.birthdate
      }
    }

    const user = new User({
      userId,
      email: userData.email.toLowerCase(),
      password: userData.password || null,
      fullName: userData.fullName || null,
      birthdate: birthdate,
      gender: userData.gender || null,
      avatarUrl: userData.avatarUrl || null,
    })

    await user.save()
    return user.toObject()
  } catch (error) {
    console.error("Error creating user in MongoDB:", error)
    throw error
  }
}

export const getUserByEmail = async (email) => {
  try {
    const user = await User.findOne({ email: email.toLowerCase() }).lean()
    return user
  } catch (error) {
    console.error("Error getting user by email from MongoDB:", error)
    throw error
  }
}

export const getUserById = async (userId) => {
  try {
    const user = await User.findOne({ userId }).lean()
    return user
  } catch (error) {
    console.error("Error getting user by ID from MongoDB:", error)
    throw error
  }
}

export const updateUser = async (userId, updateData) => {
  try {
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10)
      updateData.password = await bcrypt.hash(updateData.password, salt)
    }

    if (updateData.birthdate) {
      if (typeof updateData.birthdate === "string") {
        if (updateData.birthdate.match(/^\d{4}-\d{2}-\d{2}/)) {
          updateData.birthdate = new Date(updateData.birthdate)
        } else {
          const birthdate = parseDateString(updateData.birthdate)
          if (birthdate) {
            updateData.birthdate = birthdate
          } else {
            console.warn(`Invalid birthdate format: ${updateData.birthdate}`)
            delete updateData.birthdate
          }
        }
      }
    }

    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase()
    }

    updateData.updatedAt = new Date()

    const updatedUser = await User.findOneAndUpdate(
      { userId }, 
      { $set: updateData }, 
      { new: true }
    ).lean()

    return updatedUser
  } catch (error) {
    console.error("Error updating user in MongoDB:", error)
    throw error
  }
}

export const verifyPassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword)
}

export default User
