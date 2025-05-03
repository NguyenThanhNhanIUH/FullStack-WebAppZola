// models/Conversation.js
import mongoose from "mongoose"

const conversationSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: true,
    unique: true,
  },
  participants: [
    {
      type: String,
      ref: "User",
    },
  ],
  lastMessageId: {
    type: String,
    required: false, // Không bắt buộc vì khi tạo conversation mới chưa có tin nhắn
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
})

const Conversation = mongoose.models.Conversation || mongoose.model("Conversation", conversationSchema);
export default Conversation;