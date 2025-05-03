"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { API, apiClient } from "../config/api"

const Profile = () => {
  const [profile, setProfile] = useState({
    fullName: "",
    birthdate: "",
    gender: "",
    avatarUrl: null,
  })
  const [file, setFile] = useState(null)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setErrors({ form: "Vui lòng đăng nhập lại." })
        navigate("/login")
        return
      }

      const response = await apiClient.get(API.users.profile)
      setProfile(response)
    } catch (error) {
      console.error("Error fetching profile:", error)
      setErrors({ form: error.message || "Lỗi tải hồ sơ" })
      if (error.message === "Phiên đăng nhập hết hạn") navigate("/login")
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      const response = await apiClient.put(API.users.profile, {
        fullName: profile.fullName,
        birthdate: profile.birthdate,
        gender: profile.gender,
      })

      alert("Cập nhật hồ sơ thành công!")
      setProfile(response)
    } catch (error) {
      console.error("Error updating profile:", error)
      setErrors({ form: error.message || "Lỗi cập nhật hồ sơ" })
      if (error.message === "Phiên đăng nhập hết hạn") navigate("/login")
    }
  }

  const handleAvatarUpload = async (e) => {
    e.preventDefault()
    if (!file) {
      setErrors({ file: "Vui lòng chọn ảnh" })
      return
    }

    setLoading(true)
    try {
      // Gọi API để lấy URL upload
      const response = await apiClient.post(API.users.avatarUploadUrl, {
        fileType: file.type,
      })

      const { uploadUrl, key } = response

      // Upload ảnh lên Supabase
      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      })

      // Xác nhận upload
      const confirmResponse = await apiClient.post(API.users.confirmAvatar, { key })

      alert("Tải ảnh đại diện thành công!")
      fetchProfile()
    } catch (error) {
      console.error("Error uploading avatar:", error)
      setErrors({
        file: error.message || "Lỗi tải ảnh đại diện",
      })
      if (error.message === "Phiên đăng nhập hết hạn") navigate("/login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="vh-100 vw-100 d-flex justify-content-center align-items-center"
      style={{ backgroundColor: "#2d3748" }}
    >
      <div
        className="card text-center text-white p-5"
        style={{
          width: "500px",
          borderRadius: "20px",
          backgroundColor: "#2d3748",
          boxShadow: "0 6px 15px rgba(0, 0, 0, 0.4)",
        }}
      >
        <h2 className="mb-4">Hồ sơ người dùng</h2>
        {profile.avatarUrl && (
          <img
            src={profile.avatarUrl || "/placeholder.svg"}
            alt="Avatar"
            style={{ width: "100px", height: "100px", borderRadius: "50%", marginBottom: "20px" }}
          />
        )}
        <form onSubmit={handleUpdate}>
          <div className="mb-3">
            <input
              type="text"
              value={profile.fullName}
              onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
              placeholder="Họ và tên"
              className="form-control"
              style={{
                backgroundColor: "#1a202c",
                color: "#a0aec0",
                border: "1px solid #4a5568",
                borderRadius: "10px",
                padding: "15px",
              }}
            />
          </div>
          <div className="mb-3">
            <input
              type="text"
              value={profile.birthdate}
              onChange={(e) => setProfile({ ...profile, birthdate: e.target.value })}
              placeholder="Ngày sinh (DD/MM/YYYY)"
              className="form-control"
              style={{
                backgroundColor: "#1a202c",
                color: "#a0aec0",
                border: "1px solid #4a5568",
                borderRadius: "10px",
                padding: "15px",
              }}
            />
          </div>
          <div className="mb-3">
            <select
              value={profile.gender}
              onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
              className="form-control"
              style={{
                backgroundColor: "#1a202c",
                color: "#a0aec0",
                border: "1px solid #4a5568",
                borderRadius: "10px",
                padding: "15px",
              }}
            >
              <option value="">Chọn giới tính</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Không chia sẻ">Không chia sẻ</option>
            </select>
          </div>
          <button
            type="submit"
            className="btn btn-primary mb-3"
            style={{ width: "100%", borderRadius: "10px", padding: "15px" }}
          >
            Cập nhật hồ sơ
          </button>
          {errors.form && <div className="text-danger">{errors.form}</div>}
        </form>
        <form onSubmit={handleAvatarUpload}>
          <div className="mb-3">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files[0])}
              className="form-control"
              style={{
                backgroundColor: "#1a202c",
                color: "#a0aec0",
                border: "1px solid #4a5568",
                borderRadius: "10px",
                padding: "15px",
              }}
            />
            {errors.file && <div className="text-danger mt-1">{errors.file}</div>}
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", borderRadius: "10px", padding: "15px" }}
            disabled={loading}
          >
            {loading ? "Đang tải..." : "Tải ảnh đại diện"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Profile
