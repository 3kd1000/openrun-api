import React from 'react';

const footerStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '20px',
  marginTop: '40px',
  color: '#888',
  borderTop: '1px solid #eee',
};

const Footer: React.FC = () => {
  return (
    <footer style={footerStyle}>
      <p>&copy; 2025 OpenRun. All Rights Reserved.</p>
    </footer>
  );
};

export default Footer;
