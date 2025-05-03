import express from "express"
import {
  sendFriendRequest,
  getReceivedFriendRequests,
  getSentRequests,
  respondToFriendRequest,
  getFriends,
  removeFriend,
  checkFriendshipStatus,
} from "../controllers/friendController.js"
import { authenticate } from "../middleware/authMiddleware.js"
import { validateRequest } from "../middleware/validationMiddleware.js"

const router = express.Router()


router.use(authenticate)


router.post("/requests", validateRequest(["receiverId"]), sendFriendRequest)
router.get("/requests/received", getReceivedFriendRequests)
router.get("/requests/sent", getSentRequests)
router.post("/requests/respond", validateRequest(["requestId", "action"]), respondToFriendRequest)
router.get("/", getFriends)
router.delete("/:friendId", removeFriend)
router.get("/status/:userId", checkFriendshipStatus)

export default router
