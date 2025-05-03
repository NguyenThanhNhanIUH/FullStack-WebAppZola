"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { API, apiClient } from "../config/api"

const ResetPassword = () => {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [resetToken, setResetToken] = useState("")
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()

  const validateStep1 = () => {
    const newErrors = {}
    if (!email.trim()) newErrors.email = "Email không được để trống."
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Email không hợp lệ."
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors = {}
    if (!code.trim()) newErrors.code = "Mã OTP không được để trống."
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep3 = () => {
    const newErrors = {}
    if (!newPassword.trim()) newErrors.password = "Mật khẩu không được để trống."
    else if (!/^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>])(?=.*[a-z])(?=.*\d).{8,}$/.test(newPassword)) {
      newErrors.password = "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ in hoa, chữ thường, số và ký tự đặc biệt."
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleStep1 = async (e) => {
    e.preventDefault()
    if (!validateStep1()) return

    try {
      await apiClient.post(API.auth.requestPasswordReset, {
        email,
      })
      setStep(2)
    } catch (error) {
      setErrors({ email: error.message || "Lỗi gửi mã xác minh" })
    }
  }

  const handleStep2 = async (e) => {
    e.preventDefault()
    if (!validateStep2()) return

    try {
      const response = await apiClient.post(API.auth.verifyResetCode, {
        email,
        code,
      })
      setResetToken(response.resetToken)
      setStep(3)
    } catch (error) {
      setErrors({ code: error.message || "Mã xác minh không đúng" })
    }
  }

  const handleStep3 = async (e) => {
    e.preventDefault()
    if (!validateStep3()) return

    try {
      await apiClient.post(API.auth.completePasswordReset, {
        resetToken,
        newPassword,
      })
      alert("Đặt lại mật khẩu thành công!")
      navigate("/login")
    } catch (error) {
      setErrors({ password: error.message || "Lỗi đặt lại mật khẩu" })
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
        {step === 1 && (
          <form onSubmit={handleStep1}>
            <p className="mb-4" style={{ color: "#718096" }}>
              Nhập email để đặt lại mật khẩu
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
              {errors.email && <div className="text-danger mt-1 text-start">{errors.email}</div>}
            </div>
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
              Gửi mã xác minh
            </button>
          </form>
        )}
        {step === 2 && (
          <form onSubmit={handleStep2}>
            <p className="mb-4" style={{ color: "#718096" }}>
              Nhập mã OTP đã được gửi đến email của bạn
            </p>
            <div className="mb-3">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Mã OTP"
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
              {errors.code && <div className="text-danger mt-1 text-start">{errors.code}</div>}
            </div>
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
              Xác minh
            </button>
          </form>
        )}
        {step === 3 && (
          <form onSubmit={handleStep3}>
            <p className="mb-4" style={{ color: "#718096" }}>
              Nhập mật khẩu mới
            </p>
            <div className="mb-3">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mật khẩu mới"
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
              {errors.password && <div className="text-danger mt-1 text-start">{errors.password}</div>}
            </div>
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
              Đặt lại mật khẩu
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default ResetPassword
