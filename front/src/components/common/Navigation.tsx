import React from "react";
import { NavLink } from "react-router-dom";
import "./Navigation.css";

const Navigation: React.FC = () => {
  const navItems: Array<{
    path: string;
    label: string;
    icon: string;
    comingSoon?: boolean;
  }> = [
    { path: "/home", label: "홈", icon: "🏠", comingSoon: true },
    { path: "/schedules", label: "일정관리", icon: "📅" },
    { path: "/scoreboard", label: "스코어보드", icon: "🏆" },
    { path: "/more", label: "더보기", icon: "⋯" },
  ];

  // 로그아웃은 더보기 페이지로 이동

  return (
    <nav className="navigation">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </NavLink>
      ))}

      {/* 로그아웃은 더보기 페이지로 이동 */}
    </nav>
  );
};

export default Navigation;
