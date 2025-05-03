import express from "express"
const router = express.Router()
import * as groupController from "../controllers/GroupController.js"
import {authenticate} from "../middleware/authMiddleware.js"

// Áp dụng middleware xác thực cho tất cả các routes
router.use(authenticate)

// Tạo nhóm mới
router.post("/", groupController.createGroup)

// Lấy danh sách nhóm của người dùng
router.get("/", groupController.getUserGroups)

// Lấy danh sách bạn bè cho việc tạo nhóm
router.get("/friends", groupController.getFriendsForGroupCreation)

// Lấy thông tin chi tiết của một nhóm
router.get("/:groupId", groupController.getGroupDetails)

// Thêm thành viên vào nhóm
router.post("/:groupId/members", groupController.addMember)

// Xóa thành viên khỏi nhóm
router.delete("/:groupId/members/:memberId", groupController.removeMember)

// Rời khỏi nhóm
router.post("/:groupId/leave", groupController.leaveGroup)

// Đổi tên nhóm
router.put("/:groupId/rename", groupController.renameGroup)

// Xóa nhóm
router.delete("/:groupId", groupController.deleteGroup)

// Gửi tin nhắn trong nhóm
router.post("/:groupId/messages", groupController.sendGroupMessage)

// Gửi ảnh trong nhóm
router.post("/:groupId/images", groupController.sendGroupImage)

// Gửi video trong nhóm
router.post("/:groupId/videos", groupController.sendGroupVideo)

// Gửi file trong nhóm
router.post("/:groupId/files", groupController.sendGroupFile)

export default router
