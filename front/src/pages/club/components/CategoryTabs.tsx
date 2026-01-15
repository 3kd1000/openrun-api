import React from "react";
import { PostType, type PostType as PostTypeT } from "../../../types/post";
import "./CategoryTabs.css";

interface CategoryTabsProps {
  selectedPostType: PostTypeT | null;
  onSelectPostType: (postType: PostTypeT | null) => void;
  /**
   * 노출할 탭 목록(전체 탭은 별도 옵션)
   * 기본값: [GENERAL, INQUIRY]
   */
  allowedPostTypes?: PostTypeT[];
  /**
   * "전체" 탭 노출 여부
   * 기본값: true
   */
  showAllTab?: boolean;
}

const POST_TYPE_LABELS: Record<PostTypeT, string> = {
  [PostType.NOTICE]: "공지사항", // legacy (UI에서는 기본적으로 숨김)
  [PostType.GENERAL]: "자유",
  [PostType.INQUIRY]: "문의",
};

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  selectedPostType,
  onSelectPostType,
  allowedPostTypes = [PostType.GENERAL, PostType.INQUIRY],
  showAllTab = true,
}) => {
  return (
    <div className="category-tabs">
      {showAllTab && (
        <button
          className={`category-tabs__tab ${
            selectedPostType === null ? "category-tabs__tab--active" : ""
          }`}
          onClick={() => onSelectPostType(null)}
        >
          전체
        </button>
      )}

      {allowedPostTypes.map((postType) => (
        <button
          key={postType}
          className={`category-tabs__tab ${
            selectedPostType === postType ? "category-tabs__tab--active" : ""
          }`}
          onClick={() => onSelectPostType(postType)}
        >
          {POST_TYPE_LABELS[postType]}
        </button>
      ))}
    </div>
  );
};
