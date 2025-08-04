import React, { useState, useEffect, useRef } from "react";

interface TooltipProps {
  label: React.ReactNode;
  content: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ label, content }) => {
  const [visible, setVisible] = useState(false);
  const tooltipRef = useRef<HTMLSpanElement>(null);

  // 문서 내 클릭 이벤트 리스너
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        setVisible(false);
      }
    };
    if (visible) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [visible]);

  return (
    <span
      ref={tooltipRef}
      style={{
        position: "relative",
        display: "inline-block",
        cursor: "pointer",
      }}
      aria-haspopup="true"
      aria-expanded={visible}
      role="button"
      tabIndex={0}
      onClick={() => setVisible((v) => !v)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setVisible((v) => !v);
        }
      }}
    >
      <span
        style={{
          color: "#396fda",
          fontWeight: "bold",
          userSelect: "none",
          padding: "0 4px",
          borderRadius: "3px",
          fontSize: "1rem",
          lineHeight: 1,
        }}
        aria-label="Tooltip toggle"
      >
        {label}
      </span>
      {visible && (
        <div
          style={{
            position: "absolute",
            bottom: "125%",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#333",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: 6,
            fontSize: "0.88rem",
            whiteSpace: "pre-wrap",
            zIndex: 1000,
            width: 220,
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
            userSelect: "text",
          }}
          onClick={(e) => e.stopPropagation()}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </span>
  );
};

export default Tooltip;
