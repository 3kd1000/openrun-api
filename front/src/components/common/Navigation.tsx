import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navigation.css';

const Navigation: React.FC = () => {
  const navItems = [
    { path: '/', label: '대진생성', icon: '🎯' },
    { path: '/schedules', label: '일정관리', icon: '📅' },
    { path: '/scoreboard', label: '스코어보드', icon: '🏆' },
  ];

  return (
    <nav className="navigation">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `nav-item ${isActive ? 'active' : ''}`
          }
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default Navigation;
