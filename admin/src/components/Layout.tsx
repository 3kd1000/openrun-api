import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./Layout.css";

function Layout() {
  const { adminUser, signOut } = useAuth();

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__header">
          <h1>OpenRun Admin</h1>
        </div>
        <nav className="admin-sidebar__nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? "active" : ""}>
            Dashboard
          </NavLink>
          <NavLink to="/audit-logs" className={({ isActive }) => isActive ? "active" : ""}>
            Audit Logs
          </NavLink>
          <NavLink to="/award-winners" className={({ isActive }) => isActive ? "active" : ""}>
            어워드 수상자
          </NavLink>
          <NavLink to="/inquiries" className={({ isActive }) => isActive ? "active" : ""}>
            문의 관리
          </NavLink>
          <NavLink to="/push-send" className={({ isActive }) => isActive ? "active" : ""}>
            알림 발송
          </NavLink>
          <NavLink to="/notification-history" className={({ isActive }) => isActive ? "active" : ""}>
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
