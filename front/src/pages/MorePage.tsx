import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, clearLoginSession } from "../services/firebase";
import { signOut } from "firebase/auth";
import "./MorePage.css";

const MorePage: React.FC = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const name =
      localStorage.getItem("user_name") || localStorage.getItem("devUserName");
    setUserName(name);
  }, []);

  const handleLogout = async () => {
    try {
      // Firebase 로그아웃
      await signOut(auth);
    } catch (error) {
      console.error("❌ Firebase signOut 실패:", error);
    }

    // localStorage 클리어 (Firebase 세션 + 일반 세션)
    clearLoginSession();

    console.log("✅ 로그아웃 완료");

    // 로그인 페이지로 이동
    navigate("/login");
  };

  return (
    <div className="more-page">
      <div className="more-content">
        <h1>더보기</h1>

        {userName && (
          <div className="user-section">
            <div className="user-info">
              <span className="user-icon">👤</span>
              <span className="user-name">{userName}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              로그아웃
            </button>
          </div>
        )}

        <div className="more-section">
          <h2>서비스</h2>
          <div className="more-item">
            <span className="more-icon">📄</span>
            <a href="/terms" className="more-link">
              서비스 이용약관
            </a>
          </div>
          <div className="more-item">
            <span className="more-icon">✉️</span>
            <a href="mailto:dev.openrun@gmail.com" className="more-link">
              문의하기
            </a>
          </div>
        </div>

        <div className="coming-soon-section">
          <p className="coming-soon-text">추가 기능이 준비 중입니다.</p>
        </div>
      </div>
    </div>
  );
};

export default MorePage;
