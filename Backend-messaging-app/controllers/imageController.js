import { uploadImage, generatePresignedUploadUrl } from "../services/supabaseStorageService.js"

export const uploadImageAndGetUrl = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    const folder = req.body.folder || "images"

    const result = await uploadImage(req.file.buffer, req.file.mimetype, folder)

    res.status(200).json({
      message: "Image uploaded successfully",
      key: result.key,
      imageUrl: result.url,
    })
  } catch (error) {
    console.error("Error in uploadImageAndGetUrl:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

export const getImageUploadUrl = async (req, res) => {
  try {
    const { fileType, folder } = req.body

    if (!fileType) {
      return res.status(400).json({ message: "File type is required" })
    }

    const { url, key, headers } = await generatePresignedUploadUrl(req.user ? req.user.userId : "anonymous", fileType)

    res.status(200).json({
      uploadUrl: url,
      key,
      headers,
      message: "Upload URL generated successfully",
    })
  } catch (error) {
    console.error("Error in getImageUploadUrl:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}
