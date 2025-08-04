import React, { useState } from "react";

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginBottom: 12 }}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        style={{
          all: "unset",
          cursor: "pointer",
          fontWeight: 700,
          color: "#396fda",
          fontSize: "1rem",
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          padding: "6px 0",
          borderBottom: "1.5px solid #ddd",
        }}
        aria-expanded={open}
        aria-controls={`faq-answer-${question}`}
        id={`faq-question-${question}`}
      >
        {question}
        <span style={{ fontSize: "1.2rem" }}>{open ? "▲" : "▼"}</span>
      </button>
      <div
        id={`faq-answer-${question}`}
        role="region"
        aria-labelledby={`faq-question-${question}`}
        style={{
          marginTop: 10,
          maxHeight: open ? "1000px" : "0",
          opacity: open ? 1 : 0,
          overflow: "hidden",
          transition: "all 0.3s ease",
          whiteSpace: "pre-wrap",
          color: "#333",
          fontSize: "0.95rem",
          userSelect: "text",
        }}
      >
        {answer}
      </div>
    </div>
  );
};

export default FAQItem;