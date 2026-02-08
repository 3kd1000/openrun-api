import { useState, useEffect } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./Layout.css";

function Layout() {
  const { adminUser, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // 모바일에서는 기본으로 닫힘
    return window.innerWidth > 768;
  });

  // 화면 크기 변경 시 사이드바 상태 조정
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 모바일에서 메뉴 클릭 시 사이드바 닫기
  const handleNavClick = () => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className={`admin-layout ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      {/* 모바일 오버레이 */}
      {sidebarOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 햄버거 버튼 */}
      <button
        className="admin-sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label={sidebarOpen ? "메뉴 닫기" : "메뉴 열기"}
      >
        {sidebarOpen ? "✕" : "☰"}
      </button>

      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="admin-sidebar__header">
          <h1>OpenRun Admin</h1>
        </div>
        <nav className="admin-sidebar__nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? "active" : ""} onClick={handleNavClick}>
            Dashboard
          </NavLink>
          <NavLink to="/audit-logs" className={({ isActive }) => isActive ? "active" : ""} onClick={handleNavClick}>
            Audit Logs
          </NavLink>
          <NavLink to="/batch" className={({ isActive }) => isActive ? "active" : ""} onClick={handleNavClick}>
            배치 작업
          </NavLink>
          <NavLink to="/award-winners" className={({ isActive }) => isActive ? "active" : ""} onClick={handleNavClick}>
            어워드 수상자
          </NavLink>
          <NavLink to="/inquiries" className={({ isActive }) => isActive ? "active" : ""} onClick={handleNavClick}>
            문의 관리
          </NavLink>
          <NavLink to="/push-send" className={({ isActive }) => isActive ? "active" : ""} onClick={handleNavClick}>
            알림 발송
          </NavLink>
          <NavLink to="/notification-history" className={({ isActive }) => isActive ? "active" : ""} onClick={handleNavClick}>
            알림 이력
          </NavLink>
        </nav>
        <div className="admin-sidebar__footer">
          {adminUser && (
            <>
              <div className="admin-user-info">
                <span className="admin-user-name">{adminUser.name}</span>
                <span className="admin-user-email">{adminUser.email}</span>
              </div>
              <button className="admin-logout-btn" onClick={signOut}>
                로그아웃
              </button>
            </>
          )}
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
