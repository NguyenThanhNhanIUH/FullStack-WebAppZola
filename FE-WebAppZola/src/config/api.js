// Cấu hình API cho toàn bộ ứng dụng
const API_BASE_URL = "http://localhost:5000/api"

// Các endpoint API được nhóm theo chức năng
const API = {
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    register: `${API_BASE_URL}/auth/register`,
    requestVerification: `${API_BASE_URL}/auth/request-verification`,
    verifyEmail: `${API_BASE_URL}/auth/verify-email`,
    requestPasswordReset: `${API_BASE_URL}/auth/request-password-reset-code`,
    verifyResetCode: `${API_BASE_URL}/auth/verify-reset-code`,
    completePasswordReset: `${API_BASE_URL}/auth/complete-password-reset`,
  },
  users: {
    profile: `${API_BASE_URL}/users/profile`,
    avatar: `${API_BASE_URL}/users/avatar`,
    avatarUploadUrl: `${API_BASE_URL}/users/avatar-upload-url`,
    confirmAvatar: `${API_BASE_URL}/users/confirm-avatar`,
    search: `${API_BASE_URL}/users/search`,
  },
  friends: {
    list: `${API_BASE_URL}/friends`,
    requests: `${API_BASE_URL}/friends/requests`,
    receivedRequests: `${API_BASE_URL}/friends/requests/received`,
    sentRequests: `${API_BASE_URL}/friends/requests/sent`,
    respond: `${API_BASE_URL}/friends/requests/respond`,
    check: (userId) => `${API_BASE_URL}/friends/check/${userId}`,
    remove: (userId) => `${API_BASE_URL}/friends/${userId}`,
  },
  messages: {
    conversations: `${API_BASE_URL}/messages/conversations`,
    getConversation: (userId) => `${API_BASE_URL}/messages/conversations/user/${userId}`,
    getMessages: (conversationId) => `${API_BASE_URL}/messages/conversations/${conversationId}/messages`,
    sendText: `${API_BASE_URL}/messages/send/text`,
    sendImage: `${API_BASE_URL}/messages/send/image`,
    sendVideo: `${API_BASE_URL}/messages/send/video`,
    sendFile: `${API_BASE_URL}/messages/send/file`,
    delete: (messageId) => `${API_BASE_URL}/messages/${messageId}`,
  },
}

// Hàm tiện ích để thực hiện các request API với xử lý token
const apiClient = {
  // GET request
  get: async (url) => {
    const token = localStorage.getItem("token")
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token")
          window.location.href = "/login"
          throw new Error("Phiên đăng nhập hết hạn")
        }
        const errorData = await response.json()
        throw new Error(errorData.message || "Đã xảy ra lỗi")
      }

      return await response.json()
    } catch (error) {
      console.error("API Error:", error)
      throw error
    }
  },

  // POST request với JSON data
  post: async (url, data) => {
    const token = localStorage.getItem("token")
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token")
          window.location.href = "/login"
          throw new Error("Phiên đăng nhập hết hạn")
        }
        const errorData = await response.json()
        throw new Error(errorData.message || "Đã xảy ra lỗi")
      }

      return await response.json()
    } catch (error) {
      console.error("API Error:", error)
      throw error
    }
  },

  // POST request với FormData (cho upload file)
  postFormData: async (url, formData) => {
    const token = localStorage.getItem("token")
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: formData,
      })

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token")
          window.location.href = "/login"
          throw new Error("Phiên đăng nhập hết hạn")
        }
        const errorData = await response.json()
        throw new Error(errorData.message || "Đã xảy ra lỗi")
      }

      return await response.json()
    } catch (error) {
      console.error("API Error:", error)
      throw error
    }
  },

  // PUT request
  put: async (url, data) => {
    const token = localStorage.getItem("token")
    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token")
          window.location.href = "/login"
          throw new Error("Phiên đăng nhập hết hạn")
        }
        const errorData = await response.json()
        throw new Error(errorData.message || "Đã xảy ra lỗi")
      }

      return await response.json()
    } catch (error) {
      console.error("API Error:", error)
      throw error
    }
  },

  // DELETE request
  delete: async (url) => {
    const token = localStorage.getItem("token")
    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token")
          window.location.href = "/login"
          throw new Error("Phiên đăng nhập hết hạn")
        }
        const errorData = await response.json()
        throw new Error(errorData.message || "Đã xảy ra lỗi")
      }

      return await response.json()
    } catch (error) {
      console.error("API Error:", error)
      throw error
    }
  },
}

export { API, apiClient }
