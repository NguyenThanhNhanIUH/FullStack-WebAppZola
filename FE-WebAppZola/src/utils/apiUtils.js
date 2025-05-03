import axios from "axios"

// Utility function for API calls
export const apiCall = async (method, url, data = null, token) => {
  try {
    console.log(`API Call: ${method.toUpperCase()} ${url}`)
    if (data) {
      console.log("Request data:", data instanceof FormData ? "FormData" : data)
    }

    const config = {
      method,
      url: `http://localhost:5000${url}`,
      headers: {
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        "If-None-Match": "", // Prevent 304 responses
      },
      data,
    }

    // Không đặt Content-Type cho FormData để axios tự xử lý boundary
    if (!(data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json"
    }

    console.log("Using config:", {
      method: config.method,
      url: config.url,
      headers: { ...config.headers, Authorization: "Bearer [HIDDEN]" },
    })

    const response = await axios(config)
    console.log(`API Response ${url}:`, response.status, response.data)
    return response.data
  } catch (error) {
    console.error(`API Error ${url}:`, error)
    if (error.response) {
      console.error("Response status:", error.response.status)
      console.error("Response data:", error.response.data)
    }

    if (error.response?.status === 401) {
      localStorage.removeItem("token")
      window.location.href = "/login"
      throw new Error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.")
    }

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message)
    }
    throw new Error(error.message || "Đã xảy ra lỗi không xác định")
  }
}
