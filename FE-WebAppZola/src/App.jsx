"use client"

import { useEffect, useState } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Landing from "./pages/Landing"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import Home from "./pages/Home"
import ResetPassword from "./pages/ResetPassword"
import Profile from "./pages/Profile"
import socket from "./services/socket"

// Private Route component để bảo vệ các trang cần xác thực
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token")
  if (!token) {
    // Chuyển hướng đến trang đăng nhập nếu chưa xác thực
    return <Navigate to="/login" replace />
  }
  return children
}

function App() {
  const [showSplash, setShowSplash] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const splashShown = localStorage.getItem("splash-shown")

    if (!splashShown) {
      setShowSplash(true)
      setTimeout(() => {
        setShowSplash(false)
        localStorage.setItem("splash-shown", "true")
        setLoading(false)
      }, 2000)
    } else {
      setLoading(false)
    }

    // Khởi tạo socket khi có token
    const token = localStorage.getItem("token")
    if (token) {
      socket.auth = { token }

      // Kết nối socket nếu chưa kết nối
      if (!socket.connected) {
        socket.connect()
      }
    }

    // Cleanup khi component unmount
    return () => {
      if (socket.connected) {
        socket.disconnect()
      }
    }
  }, [])

  if (loading) {
    return showSplash ? (
      <div id="splash-screen">
        <h1>Zola</h1>
      </div>
    ) : null
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
