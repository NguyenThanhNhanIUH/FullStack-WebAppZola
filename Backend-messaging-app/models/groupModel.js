import mongoose from "mongoose"
import { v4 as uuidv4 } from "uuid"

const groupSchema = new mongoose.Schema({
  groupId: {
    type: String,
    required: true,
    unique: true,
    default: () => uuidv4(),
  },
  name: {
    type: String,
    required: true,
  },
  conversationId: {
    type: String,
    required: true,
    ref: "Conversation",
  },
  admin: {
    type: String,
    required: true,
    ref: "User",
  },
  members: [
    {
      type: String,
      ref: "User",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.model("Group", groupSchema)
