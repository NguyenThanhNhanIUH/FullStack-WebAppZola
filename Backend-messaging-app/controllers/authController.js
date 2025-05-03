import { createUser, getUserByEmail, verifyPassword, updateUser, getUserById } from "../models/userModel.js"
import { sendVerificationEmail, verifyEmailCode, validateEmail } from "../services/emailService.js"
import * as alternativeEmailService from "../services/alternativeEmailService.js"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import { v4 as uuidv4 } from "uuid"

dotenv.config()
const isDevelopment = process.env.NODE_ENV === "development"

export const requestVerificationCode = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ message: "Email is required" })
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" })
    }

    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" })
    }

    console.log(`Sending verification email to ${email}...`)

    let result
    try {
      result = await sendVerificationEmail(email)
      console.log(`Primary email service result:`, result)
    } catch (primaryError) {
      console.error("Primary email service failed:", primaryError)

      try {
        console.log("Trying alternative email service...")
        result = await alternativeEmailService.sendVerificationEmail(email)
        console.log(`Alternative email service result:`, result)
      } catch (alternativeError) {
        console.error("Alternative email service also failed:", alternativeError)
        if (!isDevelopment) {
          throw new Error("Failed to send verification email through both services")
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString()
        result = {
          success: false,
          verificationCode: code,
          error: "Both email services failed",
        }
      }
    }

    const responseData = {
      message: "Verification code sent successfully to your email",
      email: email.toLowerCase(),
      emailSent: result.success,
    }

    if (isDevelopment) {
      responseData.verificationCode = result.verificationCode
      responseData.devMode = true
      responseData.messageId = result.messageId
    }

    res.status(200).json(responseData)
  } catch (error) {
    console.error("Error in requestVerificationCode:", error)

    if (isDevelopment) {
      const code = Math.floor(100000 + Math.random() * 900000).toString()
      res.status(200).json({
        message: "Development mode: Verification code generated (not sent via email)",
        email: req.body.email.toLowerCase(),
        verificationCode: code,
        devMode: true,
        error: error.message,
      })
    } else {
      res.status(500).json({ message: "Server error", error: error.message })
    }
  }
}

export const verifyEmailAddress = async (req, res) => {
  try {
    const { code, email } = req.body

    if (!code || !email) {
      return res.status(400).json({ message: "Verification code and email are required" })
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" })
    }

    const verification = await verifyEmailCode(email, code)

    if (!verification.isValid) {
      return res.status(400).json({ message: verification.message || "Invalid verification code" })
    }

    const userId = uuidv4()

    const tempToken = jwt.sign({ email: email.toLowerCase(), userId }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    })

    res.status(200).json({
      message: "Email verified successfully",
      tempToken,
      userId,
    })
  } catch (error) {
    console.error("Error in verifyEmailAddress:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

export const completeRegistration = async (req, res) => {
  try {
    const { email, password, fullName, birthdate, gender, userId, avatarUrl } = req.body

    if (!email || !password || !userId) {
      return res.status(400).json({ message: "Email, password, and user ID are required" })
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" })
    }

    const user = await createUser({
      userId,
      email,
      password,
      fullName,
      birthdate,
      gender,
      avatarUrl,
    })

    const token = jwt.sign(
      { userId: user.userId, email: user.email, avatarUrl: user.avatarUrl },
      process.env.JWT_SECRET,
      { expiresIn: "30d" },
    )

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        userId: user.userId,
        email: user.email,
        fullName: user.fullName,
        birthdate: user.birthdate,
        gender: user.gender,
        avatarUrl: user.avatarUrl,
      },
    })
  } catch (error) {
    console.error("Error in completeRegistration:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" })
    }

    const user = await getUserByEmail(email)

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const isMatch = await verifyPassword(password, user.password)

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const token = jwt.sign({ userId: user.userId, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    })

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        userId: user.userId,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
      },
    })
  } catch (error) {
    console.error("Error in login:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

export const requestPasswordResetCode = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ message: "Email is required" })
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" })
    }

    const user = await getUserByEmail(email)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const result = await sendVerificationEmail(email)

    const responseData = {
      message: "Password reset code sent successfully to your email",
      email: email.toLowerCase(),
    }

    if (isDevelopment) {
      responseData.verificationCode = result.verificationCode
      responseData.devMode = true
    }

    res.status(200).json(responseData)
  } catch (error) {
    console.error("Error in requestPasswordResetCode:", error)

    if (isDevelopment) {
      const code = Math.floor(100000 + Math.random() * 900000).toString()
      res.status(200).json({
        message: "Development mode: Password reset code generated (not sent via email)",
        email: req.body.email.toLowerCase(),
        verificationCode: code,
        devMode: true,
        error: error.message,
      })
    } else {
      res.status(500).json({ message: "Server error", error: error.message })
    }
  }
}

export const verifyPasswordResetCode = async (req, res) => {
  try {
    const { code, email } = req.body

    if (!code || !email) {
      return res.status(400).json({
        message: "Verification code and email are required",
        receivedFields: {
          code: !!code,
          email: !!email,
        },
      })
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" })
    }

    const verification = await verifyEmailCode(email, code)

    if (!verification.isValid) {
      return res.status(400).json({
        message: verification.message || "Invalid verification code",
      })
    }

    const user = await getUserByEmail(email)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const resetToken = jwt.sign({ userId: user.userId, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    })

    res.status(200).json({
      message: "Email verified successfully for password reset",
      resetToken,
      userId: user.userId,
    })
  } catch (error) {
    console.error("Error in verifyPasswordResetCode:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

export const completePasswordReset = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        message: "Reset token and new password are required",
        receivedFields: {
          resetToken: !!resetToken,
          newPassword: !!newPassword,
        },
      })
    }

    let decoded
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET)
    } catch (error) {
      return res.status(401).json({
        message: "Invalid or expired reset token",
        error: error.message,
      })
    }
    const user = await getUserById(decoded.userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    await updateUser(decoded.userId, { password: newPassword })

    res.status(200).json({ message: "Password reset successfully" })
  } catch (error) {
    console.error("Error in completePasswordReset:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

export const resetPassword = async (req, res) => {
  try {
    const { code, email, newPassword } = req.body

    if (!code || !email || !newPassword) {
      return res.status(400).json({
        message: "Verification code, email, and new password are required",
        receivedFields: {
          code: !!code,
          email: !!email,
          newPassword: !!newPassword,
        },
      })
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" })
    }

    const verification = await verifyEmailCode(email, code)

    if (!verification.isValid) {
      return res.status(400).json({
        message: verification.message || "Invalid verification code",
      })
    }

    const user = await getUserByEmail(email)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    try {
      await updateUser(user.userId, { password: newPassword })

      res.status(200).json({ message: "Password reset successfully" })
    } catch (updateError) {
      console.error("Error updating password:", updateError)
      res.status(500).json({
        message: "Error updating password",
        error: updateError.error,
      })
    }
  } catch (error) {
    console.error("Error in resetPassword:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}
