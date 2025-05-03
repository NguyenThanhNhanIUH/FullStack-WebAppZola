"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { API, apiClient } from "../config/api"
import "../styles/login.css"

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const navigate = useNavigate()

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    let valid = true

    if (email.trim() === "") {
      setEmailError("Email không được để trống.")
      valid = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Email không hợp lệ.")
      valid = false
    } else {
      setEmailError("")
    }

    if (password.trim() === "") {
      setPasswordError("Mật khẩu không được để trống.")
      valid = false
    } else {
      setPasswordError("")
    }

    if (!valid) return

    try {
      const response = await apiClient.post(API.auth.login, {
        email,
        password,
      })

      localStorage.setItem("token", response.token)

      // Lấy thông tin profile người dùng sau khi đăng nhập
      try {
        const userProfile = await apiClient.get(API.users.profile)
        localStorage.setItem("userProfile", JSON.stringify(userProfile))
      } catch (profileError) {
        console.error("Error fetching user profile:", profileError)
      }

      alert("Đăng nhập thành công!")
      navigate("/home")
    } catch (error) {
      setEmailError(error.message || "Email hoặc mật khẩu không đúng.")
      setPasswordError("")
    }
  }

  return (
    <div
      className="vh-100 vw-100 d-flex justify-content-center align-items-center"
      style={{ backgroundColor: "#f0f4f8", margin: "0", overflow: "hidden" }}
    >
      <div
        className="card text-center p-5"
        style={{
          width: "500px",
          borderRadius: "20px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          backgroundColor: "#ffffff",
        }}
      >
        <a
          href="/"
          className="btn btn-primary rounded-circle"
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <i className="fas fa-arrow-left"></i>
        </a>
        <div className="mb-4">
          <h1 className="fw-bold text-primary" style={{ fontSize: "80px" }}>
            Zola
          </h1>
        </div>
        <form onSubmit={handleSubmit}>
          <p className="mb-4" style={{ color: "#718096" }}>
            Vui lòng nhập email và mật khẩu để đăng nhập
          </p>
          <div className="mb-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="form-control"
              style={{
                backgroundColor: "#f8fafc",
                color: "#333",
                border: "1px solid #e8edf2",
                borderRadius: "10px",
                padding: "15px",
                fontSize: "16px",
              }}
            />
            {emailError && <div className="text-danger mt-1 text-start">{emailError}</div>}
          </div>
          <div className="mb-3 position-relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mật khẩu"
              className="form-control"
              style={{
                backgroundColor: "#f8fafc",
                color: "#333",
                border: "1px solid #e8edf2",
                borderRadius: "10px",
                padding: "15px",
                fontSize: "16px",
              }}
            />
            <button
              type="button"
              className="btn btn-primary position-absolute"
              style={{
                top: "50%",
                right: "10px",
                transform: "translateY(-50%)",
                backgroundColor: "#3182ce",
                color: "white",
                border: "none",
                borderRadius: "5px",
                padding: "5px 15px",
                fontSize: "14px",
                zIndex: 1,
              }}
              onClick={handleTogglePassword}
            >
              {showPassword ? "Ẩn" : "Hiện"}
            </button>
            <div
              className="text-danger mt-1 text-start"
              style={{ position: "absolute", top: "100%", left: "0", fontSize: "12px" }}
            >
              {passwordError}
            </div>
          </div>
          <div className="d-flex flex-column align-items-center mt-4">
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                backgroundColor: "#3182ce",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "18px",
                fontWeight: "bold",
                padding: "15px",
                width: "100%",
              }}
            >
              Đăng nhập
            </button>
            <a href="/reset-password" className="text-primary mt-3" style={{ textAlign: "center", fontSize: "14px" }}>
              Quên mật khẩu?
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login
