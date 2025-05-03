import express from "express"
import multer from "multer"
import {
  getConversations,
  getMessages,
  getOrStartConversation,
  sendTextMessage,
  sendEmojiMessage,
  sendImageMessage,
  sendFileMessage,
  sendVideoMessage,
  markAsRead,
  deleteUserMessage,
  recallUserMessage,
  forwardUserMessage,
  getUnreadCount,
  markConversationMessagesAsRead,
} from "../controllers/messageController.js"
import { authenticate } from "../middleware/authMiddleware.js"
import { validateRequest } from "../middleware/validationMiddleware.js"

const router = express.Router()


const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
})

router.use(authenticate)

router.get("/conversations", getConversations)
router.get("/conversations/:conversationId/messages", getMessages)
router.get("/conversations/user/:userId", getOrStartConversation)


router.post("/send/text", validateRequest(["conversationId", "content"]), sendTextMessage)
router.post("/send/emoji", validateRequest(["conversationId", "emoji"]), sendEmojiMessage)
router.post("/send/image", upload.array("images", 10), sendImageMessage)
router.post("/send/file", upload.single("file"), sendFileMessage)
router.post("/send/video", upload.single("video"), sendVideoMessage)


router.put("/messages/:messageId/read", markAsRead)
router.put("/conversations/:conversationId/read", markConversationMessagesAsRead)
router.delete("/messages/:messageId", deleteUserMessage)
router.put("/messages/:messageId/recall", recallUserMessage)
router.post("/messages/forward", validateRequest(["messageId", "conversationId"]), forwardUserMessage)


router.get("/unread", getUnreadCount)

export default router
