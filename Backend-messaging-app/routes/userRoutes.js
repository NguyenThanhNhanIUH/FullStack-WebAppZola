import express from "express"
import multer from "multer"
import {
  getUserProfile,
  updateUserProfile,
  uploadUserAvatar,
  getAvatarUploadUrl,
  confirmAvatarUpload,
  updatePassword,
  searchUsers
} from "../controllers/userController.js"
import { authenticate } from "../middleware/authMiddleware.js"
import { validateRequest } from "../middleware/validationMiddleware.js"

const router = express.Router()

const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
})

router.get("/profile", authenticate, getUserProfile)

router.put("/profile", authenticate, validateRequest(["fullName"]), updateUserProfile)

router.post("/avatar", authenticate, upload.single("avatar"), uploadUserAvatar)

router.post("/avatar-upload-url", authenticate, validateRequest(["fileType"]), getAvatarUploadUrl)

router.post("/confirm-avatar", authenticate, validateRequest(["key"]), confirmAvatarUpload)
router.put("/update-password", authenticate, validateRequest(["currentPassword", "newPassword"]), updatePassword)
router.get("/search", authenticate, searchUsers)
export default router

