import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { clubService } from "../../services/clubService";
import type {
  ClubNotice,
  ClubRule,
  CreateClubNoticeRequest,
  CreateClubRuleRequest,
  UpdateClubNoticeRequest,
  UpdateClubRuleRequest,
} from "../../types/club";
import { ArrowLeftIcon, PlusIcon, EditIcon, Trash2Icon } from "../../components/common/Icons";
import { getErrorMessage, logError } from "../../utils/errorHandler";
import "./ClubContentManagePage.css";

type Tab = "NOTICES" | "RULES";

const ClubContentManagePage: React.FC = () => {
  const navigate = useNavigate();
  const { clubId } = useParams<{ clubId: string }>();

  const [tab, setTab] = useState<Tab>("NOTICES");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // notices
  const [notices, setNotices] = useState<ClubNotice[]>([]);
  const [isAddingNotice, setIsAddingNotice] = useState(false);
  const [newNotice, setNewNotice] = useState<CreateClubNoticeRequest>({ title: "", content: "" });
  const [editingNoticeId, setEditingNoticeId] = useState<number | null>(null);
  const [editingNotice, setEditingNotice] = useState<UpdateClubNoticeRequest>({ title: "", content: "" });

  // rules
  const [rules, setRules] = useState<ClubRule[]>([]);
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [newRule, setNewRule] = useState<CreateClubRuleRequest>({ title: "", content: "" });
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
  const [editingRule, setEditingRule] = useState<UpdateClubRuleRequest>({ title: "", content: "" });

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
      const [n, r] = await Promise.all([
        clubService.getClubNotices(Number(clubId)),
        clubService.getClubRules(Number(clubId)),
      ]);
      setNotices(n);
      setRules(r);
    } catch (e: unknown) {
      logError("공지/회칙 관리 조회", e);
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => navigate(`/clubs/${clubId}/manage`);

  // notices handlers
  const handleAddNotice = async () => {
    if (!clubId) return;
    if (!newNotice.title.trim() || !newNotice.content.trim()) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }
    try {
      const created = await clubService.createClubNotice(Number(clubId), newNotice);
      setNotices((prev) => [...prev, created]);
      setNewNotice({ title: "", content: "" });
      setIsAddingNotice(false);
    } catch (e: unknown) {
      logError("공지사항 생성", e);
      alert(getErrorMessage(e));
    }
  };

  const handleEditNotice = (n: ClubNotice) => {
    setEditingNoticeId(n.id);
    setEditingNotice({ title: n.title, content: n.content });
  };

  const handleSaveNotice = async () => {
    if (!clubId || !editingNoticeId) return;
    if (!editingNotice.title.trim() || !editingNotice.content.trim()) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }
    try {
      const updated = await clubService.updateClubNotice(Number(clubId), editingNoticeId, editingNotice);
      setNotices((prev) => prev.map((x) => (x.id === editingNoticeId ? updated : x)));
      setEditingNoticeId(null);
    } catch (e: unknown) {
      logError("공지사항 수정", e);
      alert(getErrorMessage(e));
    }
  };

  const handleDeleteNotice = async (noticeId: number) => {
    if (!clubId) return;
    if (!confirm("이 공지사항을 삭제하시겠습니까?")) return;
    try {
      await clubService.deleteClubNotice(Number(clubId), noticeId);
      setNotices((prev) => prev.filter((x) => x.id !== noticeId));
    } catch (e: unknown) {
      logError("공지사항 삭제", e);
      alert(getErrorMessage(e));
    }
  };

  // rules handlers
  const handleAddRule = async () => {
    if (!clubId) return;
    if (!newRule.title.trim() || !newRule.content.trim()) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }
    try {
      const created = await clubService.createClubRule(Number(clubId), newRule);
      setRules((prev) => [...prev, created]);
      setNewRule({ title: "", content: "" });
      setIsAddingRule(false);
    } catch (e: unknown) {
      logError("회칙 생성", e);
      alert(getErrorMessage(e));
    }
  };

  const handleEditRule = (r: ClubRule) => {
    setEditingRuleId(r.id);
    setEditingRule({ title: r.title, content: r.content });
  };

  const handleSaveRule = async () => {
    if (!clubId || !editingRuleId) return;
    if (!editingRule.title.trim() || !editingRule.content.trim()) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }
    try {
      const updated = await clubService.updateClubRule(Number(clubId), editingRuleId, editingRule);
      setRules((prev) => prev.map((x) => (x.id === editingRuleId ? updated : x)));
      setEditingRuleId(null);
    } catch (e: unknown) {
      logError("회칙 수정", e);
      alert(getErrorMessage(e));
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    if (!clubId) return;
    if (!confirm("이 회칙을 삭제하시겠습니까?")) return;
    try {
      await clubService.deleteClubRule(Number(clubId), ruleId);
      setRules((prev) => prev.filter((x) => x.id !== ruleId));
    } catch (e: unknown) {
      logError("회칙 삭제", e);
      alert(getErrorMessage(e));
    }
  };

  if (loading) {
    return (
      <div className="club-content-manage-page">
        <div className="club-content-manage-page__loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="club-content-manage-page">
      <div className="club-content-manage-page__header">
        <button className="club-content-manage-page__back-btn" onClick={handleBack}>
          <ArrowLeftIcon size={20} />
        </button>
        <h1 className="club-content-manage-page__title">공지/회칙 관리</h1>
        <div className="club-content-manage-page__header-spacer" />
      </div>

      {error && <div className="club-content-manage-page__error">{error}</div>}

      <div className="club-content-manage-page__tabs">
        <button
          className={`club-content-manage-page__tab ${tab === "NOTICES" ? "is-active" : ""}`}
          onClick={() => setTab("NOTICES")}
          type="button"
        >
          공지사항
        </button>
        <button
          className={`club-content-manage-page__tab ${tab === "RULES" ? "is-active" : ""}`}
          onClick={() => setTab("RULES")}
          type="button"
        >
          회칙
        </button>
      </div>

      {tab === "NOTICES" ? (
        <div className="club-content-manage-page__section">
          {!isAddingNotice && (
            <button
              className="club-content-manage-page__add-btn"
              onClick={() => setIsAddingNotice(true)}
              type="button"
            >
              <PlusIcon size={16} /> 공지사항 추가
            </button>
          )}

          {isAddingNotice && (
            <div className="club-content-manage-page__form">
              <input
                className="club-content-manage-page__input"
                placeholder="공지 제목"
                value={newNotice.title}
                onChange={(e) => setNewNotice((p) => ({ ...p, title: e.target.value }))}
              />
              <textarea
                className="club-content-manage-page__textarea"
                placeholder="공지 내용"
                value={newNotice.content}
                onChange={(e) => setNewNotice((p) => ({ ...p, content: e.target.value }))}
                rows={4}
              />
              <div className="club-content-manage-page__form-actions">
                <button
                  className="club-content-manage-page__btn club-content-manage-page__btn--cancel"
                  onClick={() => {
                    setIsAddingNotice(false);
                    setNewNotice({ title: "", content: "" });
                  }}
                  type="button"
                >
                  취소
                </button>
                <button
                  className="club-content-manage-page__btn club-content-manage-page__btn--save"
                  onClick={handleAddNotice}
                  type="button"
                >
                  추가
                </button>
              </div>
            </div>
          )}

          <div className="club-content-manage-page__list">
            {notices.length === 0 && !isAddingNotice ? (
              <div className="club-content-manage-page__empty">등록된 공지사항이 없습니다.</div>
            ) : (
              notices.map((n) => (
                <div key={n.id} className="club-content-manage-page__item">
                  {editingNoticeId === n.id ? (
                    <div className="club-content-manage-page__form">
                      <input
                        className="club-content-manage-page__input"
                        value={editingNotice.title}
                        onChange={(e) => setEditingNotice((p) => ({ ...p, title: e.target.value }))}
                      />
                      <textarea
                        className="club-content-manage-page__textarea"
                        value={editingNotice.content}
                        onChange={(e) => setEditingNotice((p) => ({ ...p, content: e.target.value }))}
                        rows={4}
                      />
                      <div className="club-content-manage-page__form-actions">
                        <button
                          className="club-content-manage-page__btn club-content-manage-page__btn--cancel"
                          onClick={() => setEditingNoticeId(null)}
                          type="button"
                        >
                          취소
                        </button>
                        <button
                          className="club-content-manage-page__btn club-content-manage-page__btn--save"
                          onClick={handleSaveNotice}
                          type="button"
                        >
                          저장
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="club-content-manage-page__item-text">
                        <div className="club-content-manage-page__item-title">{n.title}</div>
                        <div className="club-content-manage-page__item-body">{n.content}</div>
                      </div>
                      <div className="club-content-manage-page__item-actions">
                        <button
                          className="club-content-manage-page__icon-btn"
                          onClick={() => handleEditNotice(n)}
                          type="button"
                          title="수정"
                        >
                          <EditIcon size={16} />
                        </button>
                        <button
                          className="club-content-manage-page__icon-btn"
                          onClick={() => handleDeleteNotice(n.id)}
                          type="button"
                          title="삭제"
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
      ) : (
        <div className="club-content-manage-page__section">
          {!isAddingRule && (
            <button
              className="club-content-manage-page__add-btn"
              onClick={() => setIsAddingRule(true)}
              type="button"
            >
              <PlusIcon size={16} /> 회칙 추가
            </button>
          )}

          {isAddingRule && (
            <div className="club-content-manage-page__form">
              <input
                className="club-content-manage-page__input"
                placeholder="회칙 제목"
                value={newRule.title}
                onChange={(e) => setNewRule((p) => ({ ...p, title: e.target.value }))}
              />
              <textarea
                className="club-content-manage-page__textarea"
                placeholder="회칙 내용"
                value={newRule.content}
                onChange={(e) => setNewRule((p) => ({ ...p, content: e.target.value }))}
                rows={4}
              />
              <div className="club-content-manage-page__form-actions">
                <button
                  className="club-content-manage-page__btn club-content-manage-page__btn--cancel"
                  onClick={() => {
                    setIsAddingRule(false);
                    setNewRule({ title: "", content: "" });
                  }}
                  type="button"
                >
                  취소
                </button>
                <button
                  className="club-content-manage-page__btn club-content-manage-page__btn--save"
                  onClick={handleAddRule}
                  type="button"
                >
                  추가
                </button>
              </div>
            </div>
          )}

          <div className="club-content-manage-page__list">
            {rules.length === 0 && !isAddingRule ? (
              <div className="club-content-manage-page__empty">등록된 회칙이 없습니다.</div>
            ) : (
              rules.map((r) => (
                <div key={r.id} className="club-content-manage-page__item">
                  {editingRuleId === r.id ? (
                    <div className="club-content-manage-page__form">
                      <input
                        className="club-content-manage-page__input"
                        value={editingRule.title}
                        onChange={(e) => setEditingRule((p) => ({ ...p, title: e.target.value }))}
                      />
                      <textarea
                        className="club-content-manage-page__textarea"
                        value={editingRule.content}
                        onChange={(e) => setEditingRule((p) => ({ ...p, content: e.target.value }))}
                        rows={4}
                      />
                      <div className="club-content-manage-page__form-actions">
                        <button
                          className="club-content-manage-page__btn club-content-manage-page__btn--cancel"
                          onClick={() => setEditingRuleId(null)}
                          type="button"
                        >
                          취소
                        </button>
                        <button
                          className="club-content-manage-page__btn club-content-manage-page__btn--save"
                          onClick={handleSaveRule}
                          type="button"
                        >
                          저장
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="club-content-manage-page__item-text">
                        <div className="club-content-manage-page__item-title">{r.title}</div>
                        <div className="club-content-manage-page__item-body">{r.content}</div>
                      </div>
                      <div className="club-content-manage-page__item-actions">
                        <button
                          className="club-content-manage-page__icon-btn"
                          onClick={() => handleEditRule(r)}
                          type="button"
                          title="수정"
                        >
                          <EditIcon size={16} />
                        </button>
                        <button
                          className="club-content-manage-page__icon-btn"
                          onClick={() => handleDeleteRule(r.id)}
                          type="button"
                          title="삭제"
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
      )}
    </div>
  );
};

export default ClubContentManagePage;

