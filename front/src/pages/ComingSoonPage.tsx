import React from "react";
import "./ComingSoonPage.css";

interface Props {
  title: string;
}

const ComingSoonPage: React.FC<Props> = ({ title }) => {
  return (
    <div className="coming-soon-page">
      <div className="coming-soon-content">
        <h1>{title}</h1>
        <p>준비 중인 기능입니다.</p>
      </div>
    </div>
  );
};

export default ComingSoonPage;
