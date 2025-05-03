import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/global.css";

const Landing = () => {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    const hasSeenSplash = localStorage.getItem("hasSeenSplash");
    if (!hasSeenSplash) {
      setShowSplash(true);
      localStorage.setItem("hasSeenSplash", "true");
      setTimeout(() => setShowSplash(false), 700);
    }
  }, []);

  if (showSplash) {
    return (
      <div id="splash-screen">
        <h1>Zola</h1>
      </div>
    );
  }

  return (
    <div className="vh-100 vw-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: "#f0f4f8", margin: "0", overflow: "hidden" }}>
      <div className="card text-center text-dark p-5" style={{ 
        width: "500px", 
        height: "600px", 
        borderRadius: "20px", 
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)", 
        backgroundColor: "#ffffff" 
      }}>
        <div className="position-fixed top-0 end-0 m-3">
          <select id="language-select" className="form-select bg-light text-dark border-0" style={{ borderRadius: "20px" }}>
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </div>
        <div className="mb-4">
          <h1 className="fw-bold text-primary" style={{ fontSize: "130px" }}>Zola</h1>
        </div>
        <div className="d-flex flex-column gap-3 mt-auto">
          <Link to="/login" className="btn btn-primary btn-lg rounded-pill" style={{ fontSize: "1.25rem", padding: "0.75rem 1.5rem" }}> 
            Đăng nhập
          </Link>
          <Link to="/signup" className="btn btn-lg rounded-pill" style={{ fontSize: "1.25rem", padding: "0.75rem 1.5rem", backgroundColor: "#f8fafc", color: "#3182ce", border: "1px solid #e8edf2" }}>
            Tạo tài khoản mới
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Landing;
