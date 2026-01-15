import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { clubService } from "../../services/clubService";
import type {
  ClubNotice,
  CreateClubNoticeRequest,
  UpdateClubNoticeRequest,
} from "../../types/club";
import { getErrorMessage, logError } from "../../utils/errorHandler";
import {
  ArrowLeftIcon,
  PlusIcon,
  EditIcon,
  Trash2Icon,
} from "../../components/common/Icons";
import "./ClubNoticesManagePage.css";

const ClubNoticesManagePage: React.FC = () => {
  const navigate = useNavigate();
  const { clubId } = useParams<{ clubId: string }>();

  const [notices, setNotices] = useState<ClubNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [newNotice, setNewNotice] = useState<CreateClubNoticeRequest>({
    title: "",
    content: "",
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingNotice, setEditingNotice] = useState<UpdateClubNoticeRequest>({
    title: "",
    content: "",
  });

  useEffect(() => {
    if (!clubId) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId]);

  const load = async () => {
    if (!clubId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await clubService.getClubNotices(Number(clubId));
      setNotices(data);
    } catch (e: unknown) {
      logError("공지사항 조회", e);
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(`/clubs/${clubId}/manage`);
  };

  const handleAdd = async () => {
    if (!clubId) return;
    if (!newNotice.title.trim() || !newNotice.content.trim()) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }
    try {
      const created = await clubService.createClubNotice(Number(clubId), newNotice);
      setNotices((prev) => [...prev, created]);
      setNewNotice({ title: "", content: "" });
      setIsAdding(false);
    } catch (e: unknown) {
      logError("공지사항 생성", e);
      alert(getErrorMessage(e));
    }
  };

  const handleEdit = (notice: ClubNotice) => {
    setEditingId(notice.id);
    setEditingNotice({ title: notice.title, content: notice.content });
  };

  const handleSave = async () => {
    if (!clubId || !editingId) return;
    if (!editingNotice.title.trim() || !editingNotice.content.trim()) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }
    try {
      const updated = await clubService.updateClubNotice(
        Number(clubId),
        editingId,
        editingNotice
      );
      setNotices((prev) => prev.map((n) => (n.id === editingId ? updated : n)));
      setEditingId(null);
    } catch (e: unknown) {
      logError("공지사항 수정", e);
      alert(getErrorMessage(e));
    }
  };

  const handleDelete = async (noticeId: number) => {
    if (!clubId) return;
    if (!confirm("이 공지사항을 삭제하시겠습니까?")) return;
    try {
      await clubService.deleteClubNotice(Number(clubId), noticeId);
      setNotices((prev) => prev.filter((n) => n.id !== noticeId));
    } catch (e: unknown) {
      logError("공지사항 삭제", e);
      alert(getErrorMessage(e));
    }
  };

  if (loading) {
    return (
      <div className="club-notices-manage-page">
        <div className="club-notices-manage-page__loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="club-notices-manage-page">
      <div className="club-notices-manage-page__header">
        <button className="club-notices-manage-page__back-btn" onClick={handleBack}>
          <ArrowLeftIcon size={20} />
        </button>
        <h1 className="club-notices-manage-page__title">공지사항 관리</h1>
        <div className="club-notices-manage-page__header-spacer" />
      </div>

      {error && <div className="club-notices-manage-page__error">{error}</div>}

      {!isAdding && (
        <button
          className="club-notices-manage-page__add-btn"
          onClick={() => setIsAdding(true)}
          type="button"
        >
          <PlusIcon size={16} />
          <span>공지사항 추가</span>
        </button>
      )}

      {isAdding && (
        <div className="club-notices-manage-page__form">
          <input
            className="club-notices-manage-page__input"
            placeholder="공지 제목"
            value={newNotice.title}
            onChange={(e) => setNewNotice((p) => ({ ...p, title: e.target.value }))}
          />
          <textarea
            className="club-notices-manage-page__textarea"
            placeholder="공지 내용"
            value={newNotice.content}
            onChange={(e) => setNewNotice((p) => ({ ...p, content: e.target.value }))}
            rows={4}
          />
          <div className="club-notices-manage-page__form-actions">
            <button
              className="club-notices-manage-page__btn club-notices-manage-page__btn--cancel"
              onClick={() => {
                setIsAdding(false);
                setNewNotice({ title: "", content: "" });
              }}
              type="button"
            >
              취소
            </button>
            <button
              className="club-notices-manage-page__btn club-notices-manage-page__btn--save"
              onClick={handleAdd}
              type="button"
            >
              추가
            </button>
          </div>
        </div>
      )}

      <div className="club-notices-manage-page__list">
        {notices.length === 0 && !isAdding ? (
          <div className="club-notices-manage-page__empty">
            등록된 공지사항이 없습니다.
          </div>
        ) : (
          notices.map((n, idx) => (
            <div key={n.id} className="club-notices-manage-page__item">
              {editingId === n.id ? (
                <div className="club-notices-manage-page__form">
                  <input
                    className="club-notices-manage-page__input"
                    value={editingNotice.title}
                    onChange={(e) =>
                      setEditingNotice((p) => ({ ...p, title: e.target.value }))
                    }
                  />
                  <textarea
                    className="club-notices-manage-page__textarea"
                    value={editingNotice.content}
                    onChange={(e) =>
                      setEditingNotice((p) => ({ ...p, content: e.target.value }))
                    }
                    rows={4}
                  />
                  <div className="club-notices-manage-page__form-actions">
                    <button
                      className="club-notices-manage-page__btn club-notices-manage-page__btn--cancel"
                      onClick={() => setEditingId(null)}
                      type="button"
                    >
                      취소
                    </button>
                    <button
                      className="club-notices-manage-page__btn club-notices-manage-page__btn--save"
                      onClick={handleSave}
                      type="button"
                    >
                      저장
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="club-notices-manage-page__content">
                    <div className="club-notices-manage-page__number">
                      {idx + 1}.
                    </div>
                    <div className="club-notices-manage-page__text">
                      <div className="club-notices-manage-page__item-title">
                        {n.title}
                      </div>
                      <div className="club-notices-manage-page__item-body">
                        {n.content}
                      </div>
                    </div>
                  </div>
                  <div className="club-notices-manage-page__actions">
                    <button
                      className="club-notices-manage-page__icon-btn"
                      onClick={() => handleEdit(n)}
                      title="수정"
                      type="button"
                    >
                      <EditIcon size={16} />
                    </button>
                    <button
                      className="club-notices-manage-page__icon-btn club-notices-manage-page__icon-btn--danger"
                      onClick={() => handleDelete(n.id)}
                      title="삭제"
                      type="button"
                    >
                      <Trash2Icon size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ClubNoticesManagePage;

