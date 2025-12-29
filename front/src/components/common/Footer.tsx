import React from "react";
import { Link } from "react-router-dom";

const footerStyle: React.CSSProperties = {
  textAlign: "center",
  padding: "20px",
  marginTop: "40px",
  color: "#888",
  borderTop: "1px solid #eee",
};

const linkStyle: React.CSSProperties = {
  color: "#888",
  textDecoration: "none",
  margin: "0 12px",
  fontSize: "14px",
};

const Footer: React.FC = () => {
  return (
    <footer style={footerStyle}>
      <div style={{ marginBottom: "8px" }}>
        <Link to="/terms" style={linkStyle}>
          서비스 이용약관
        </Link>
        <span style={{ color: "#ccc" }}>|</span>
        <a href="mailto:dev.openrun@gmail.com" style={linkStyle}>
          문의하기
        </a>
      </div>
      <p style={{ margin: 0 }}>&copy; 2025 OpenRun. All Rights Reserved.</p>
    </footer>
  );
};

export default Footer;
