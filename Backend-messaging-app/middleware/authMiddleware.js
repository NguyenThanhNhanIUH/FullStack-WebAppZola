import jwt from "jsonwebtoken"
import { getUserById } from "../models/userModel.js"
import dotenv from "dotenv"

dotenv.config()

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization token required" })
    }

    const token = authHeader.split(" ")[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await getUserById(decoded.userId)

    if (!user) {
      return res.status(401).json({ message: "User not found" })
    }

    req.user = {
      userId: user.userId,
      email: user.email,
    }

    next()
  } catch (error) {
    console.error("Authentication error:", error)

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" })
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" })
    }

    res.status(500).json({ message: "Server error", error: error.message })
  }
}
