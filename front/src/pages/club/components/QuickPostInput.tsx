import React, { useState, useRef, useEffect } from "react";
import { SendIcon } from "../../../components/common/Icons";
import "./QuickPostInput.css";

interface QuickPostInputProps {
  /**
   * 클럽 내부 글쓰기는 "자유(GENERAL)"만 지원 (카테고리 드롭다운 제거)
   */
  onSubmit: (content: string) => Promise<void>;
}

const QuickPostInput: React.FC<QuickPostInputProps> = ({ onSubmit }) => {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 자동 높이 조절
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    if (content.trim().length > 500) {
      alert("내용은 500자를 초과할 수 없습니다.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("게시글 작성 실패:", error);
      alert("게시글 작성에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="quick-post-input">
      <div className="quick-post-input__body">
        <textarea
          ref={textareaRef}
          className="quick-post-input__textarea"
          placeholder="자유 글을 작성해보세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          maxLength={500}
          disabled={isSubmitting}
        />

        <button
          type="button"
          className="quick-post-input__submit"
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
        >
          <SendIcon size={20} />
        </button>
      </div>

      {content.length > 0 && (
        <div className="quick-post-input__hint">
          <span className={`quick-post-input__count ${content.length > 500 ? 'quick-post-input__count--over' : ''}`}>
            {content.length} / 500
          </span>
        </div>
      )}
    </div>
  );
};

export default QuickPostInput;
