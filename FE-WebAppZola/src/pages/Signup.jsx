"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { API, apiClient } from "../config/api"
import "../styles/signup.css"

const Signup = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  })
  const [code, setCode] = useState("")
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [tempToken, setTempToken] = useState("")
  const [userId, setUserId] = useState("")

  const capitalizeName = (value) => {
    return value
      .split(" ")
      .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : ""))
      .join(" ")
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = "Họ và tên không được để trống."
    if (!formData.email.trim()) {
      newErrors.email = "Email không được để trống."
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ."
    }
    if (!formData.password.trim()) {
      newErrors.password = "Mật khẩu không được để trống."
    } else if (!/^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>])(?=.*[a-z])(?=.*\d).{8,}$/.test(formData.password)) {
      newErrors.password = "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ in hoa, chữ thường, số và ký tự đặc biệt."
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleStep1 = async (e) => {
    e.preventDefault()
    if (!validate()) return

    try {
      await apiClient.post(API.auth.requestVerification, {
        email: formData.email,
      })
      setStep(2)
    } catch (error) {
      setErrors({ email: error.message || "Lỗi gửi mã xác minh" })
    }
  }

  const handleStep2 = async (e) => {
    e.preventDefault()
    try {
      const verifyResponse = await apiClient.post(API.auth.verifyEmail, {
        email: formData.email,
        code,
      })

      setTempToken(verifyResponse.tempToken)
      setUserId(verifyResponse.userId)

      const completeResponse = await fetch(API.auth.register, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${verifyResponse.tempToken}`,
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.name,
          userId: verifyResponse.userId,
        }),
      })

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json()
        throw new Error(errorData.message || "Lỗi đăng ký")
      }

      alert("Đăng ký thành công!")
      navigate("/login")
    } catch (error) {
      setErrors({ code: error.message || "Mã xác minh không đúng" })
    }
  }

  return (
    <div
      className="vh-100 vw-100 d-flex justify-content-center align-items-center"
      style={{ backgroundColor: "#f0f4f8", margin: "0", overflow: "hidden" }}
    >
      <div className="signup-container" style={{ position: "relative", height: "auto", marginTop: "30px" }}>
        <a
          href="/"
          className="back-button"
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            color: "#3182ce",
            textDecoration: "none",
            fontSize: "20px",
          }}
        >
          <i className="fas fa-arrow-left"></i>
        </a>
        <div className="app-title">
          <h1 style={{ fontSize: "80px", marginTop: "50px", marginBottom: "10px", color: "#3182ce" }}>Zola</h1>
        </div>

        {step === 1 ? (
          <form className="signup-form" onSubmit={handleStep1}>
            <p className="form-title" style={{ marginTop: "40px", color: "#718096" }}>
              Vui lòng nhập thông tin để tạo tài khoản
            </p>
            <div className="input-wrapper" style={{ marginTop: "2px" }}>
              <input
                type="text"
                placeholder="Họ và tên"
                className="input-field"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: capitalizeName(e.target.value) })}
                onBlur={validate}
                style={{ backgroundColor: "#f8fafc", color: "#333", border: "1px solid #e8edf2" }}
              />
              <div className="error-message">{errors.name || "\u00A0"}</div>
            </div>
            <div className="input-wrapper" style={{ marginTop: "2px" }}>
              <input
                type="email"
                placeholder="Email"
                className="input-field"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                onBlur={validate}
                style={{ backgroundColor: "#f8fafc", color: "#333", border: "1px solid #e8edf2" }}
              />
              <div className="error-message">{errors.email || "\u00A0"}</div>
            </div>
            <div className="input-wrapper" style={{ marginTop: "2px" }}>
              <div className="password-container">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Tạo mật khẩu"
                  className="input-field"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  onBlur={validate}
                  style={{ backgroundColor: "#f8fafc", color: "#333", border: "1px solid #e8edf2" }}
                />
                <button type="button" className="show-password" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? "Ẩn" : "Hiện"}
                </button>
              </div>
              <div className="error-message">{errors.password || "\u00A0"}</div>
            </div>
            <button type="submit" className="signup-button" style={{ fontSize: "20px", padding: "12px" }}>
              Gửi mã xác minh
            </button>
          </form>
        ) : (
          <form className="signup-form" onSubmit={handleStep2}>
            <p className="form-title" style={{ marginTop: "40px", color: "#718096" }}>
              Nhập mã xác minh
            </p>
            <div className="input-wrapper" style={{ marginTop: "2px" }}>
              <input
                type="text"
                placeholder="Mã OTP"
                className="input-field"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                style={{ backgroundColor: "#f8fafc", color: "#333", border: "1px solid #e8edf2" }}
              />
              <div className="error-message">{errors.code || "\u00A0"}</div>
            </div>
            <button type="submit" className="signup-button" style={{ fontSize: "20px", padding: "12px" }}>
              Xác minh và đăng ký
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default Signup
