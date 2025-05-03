import express from "express"
import {
  requestVerificationCode,
  verifyEmailAddress,
  completeRegistration,
  login,
  requestPasswordResetCode,
  verifyPasswordResetCode,
  completePasswordReset,
} from "../controllers/authController.js"
import { validateRequest } from "../middleware/validationMiddleware.js"

const router = express.Router()

router.post("/request-verification", validateRequest(["email"]), requestVerificationCode)

router.post("/verify-email", validateRequest(["code", "email"]), verifyEmailAddress)

router.post("/register", validateRequest(["email", "password", "userId","fullName","birthdate","gender","avatarUrl"]), completeRegistration)

router.post("/login", validateRequest(["email", "password"]), login)

router.post("/request-password-reset-code", validateRequest(["email"]), requestPasswordResetCode)
router.post("/verify-reset-code", validateRequest(["code", "email"]), verifyPasswordResetCode)
router.post("/complete-password-reset", validateRequest(["resetToken", "newPassword"]), completePasswordReset)

export default router
