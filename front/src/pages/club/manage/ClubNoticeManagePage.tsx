import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { clubService } from "../../../services/clubService";
import type {
  ClubNotice,
  ClubRule,
  CreateClubNoticeRequest,
  CreateClubRuleRequest,
  UpdateClubNoticeRequest,
  UpdateClubRuleRequest,
} from "../../../types/club";
import { ArrowLeftIcon, PlusIcon, EditIcon, Trash2Icon } from "../../../components/common/Icons";
import { getErrorMessage, logError } from "../../../utils/errorHandler";
import { useToast } from "../../../contexts/ToastContext";

type Tab = "NOTICES" | "RULES";

const ClubNoticeManagePage: React.FC = () => {
  const { showToast } = useToast();
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
      showToast("제목과 내용을 모두 입력해주세요", "warning");
      return;
    }
    try {
      const created = await clubService.createClubNotice(Number(clubId), newNotice);
      setNotices((prev) => [...prev, created]);
      setNewNotice({ title: "", content: "" });
      setIsAddingNotice(false);
    } catch (e: unknown) {
      logError("공지사항 생성", e);
      showToast(getErrorMessage(e), "error");
    }
  };

  const handleEditNotice = (n: ClubNotice) => {
    setEditingNoticeId(n.id);
    setEditingNotice({ title: n.title, content: n.content });
  };

  const handleSaveNotice = async () => {
    if (!clubId || !editingNoticeId) return;
    if (!editingNotice.title.trim() || !editingNotice.content.trim()) {
      showToast("제목과 내용을 모두 입력해주세요", "warning");
      return;
    }
    try {
      const updated = await clubService.updateClubNotice(Number(clubId), editingNoticeId, editingNotice);
      setNotices((prev) => prev.map((x) => (x.id === editingNoticeId ? updated : x)));
      setEditingNoticeId(null);
    } catch (e: unknown) {
      logError("공지사항 수정", e);
      showToast(getErrorMessage(e), "error");
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
      showToast(getErrorMessage(e), "error");
    }
  };

  // rules handlers
  const handleAddRule = async () => {
    if (!clubId) return;
    if (!newRule.title.trim() || !newRule.content.trim()) {
      showToast("제목과 내용을 모두 입력해주세요", "warning");
      return;
    }
    try {
      const created = await clubService.createClubRule(Number(clubId), newRule);
      setRules((prev) => [...prev, created]);
      setNewRule({ title: "", content: "" });
      setIsAddingRule(false);
    } catch (e: unknown) {
      logError("회칙 생성", e);
      showToast(getErrorMessage(e), "error");
    }
  };

  const handleEditRule = (r: ClubRule) => {
    setEditingRuleId(r.id);
    setEditingRule({ title: r.title, content: r.content });
  };

  const handleSaveRule = async () => {
    if (!clubId || !editingRuleId) return;
    if (!editingRule.title.trim() || !editingRule.content.trim()) {
      showToast("제목과 내용을 모두 입력해주세요", "warning");
      return;
    }
    try {
      const updated = await clubService.updateClubRule(Number(clubId), editingRuleId, editingRule);
      setRules((prev) => prev.map((x) => (x.id === editingRuleId ? updated : x)));
      setEditingRuleId(null);
    } catch (e: unknown) {
      logError("회칙 수정", e);
      showToast(getErrorMessage(e), "error");
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
      showToast(getErrorMessage(e), "error");
    }
  };

  if (loading) {
    return (
      <div className="page-container px-3 py-2 min-h-screen">
        <p className="py-6 text-sm text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="page-container px-3 py-2 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between py-2 mb-3">
        <button
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-foreground"
          onClick={handleBack}
          type="button"
        >
          <ArrowLeftIcon size={20} />
        </button>
        <span className="flex-1 text-center text-sm font-bold text-foreground">공지/회칙 관리</span>
        <div className="w-9 h-9" />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-3 px-3 py-2 text-sm rounded-xl bg-red-50 border border-red-200 text-red-600">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-3 border-b border-border px-1">
        <button
          className={[
            "flex-none border-none bg-transparent py-3 px-2 text-base font-extrabold relative",
            "transition-colors",
            tab === "NOTICES"
              ? "text-primary after:absolute after:left-0 after:right-0 after:-bottom-px after:h-[3px] after:bg-primary after:rounded-full"
              : "text-muted-foreground hover:text-primary",
          ].join(" ")}
          onClick={() => setTab("NOTICES")}
          type="button"
        >
          공지사항
        </button>
        <button
          className={[
            "flex-none border-none bg-transparent py-3 px-2 text-base font-extrabold relative",
            "transition-colors",
            tab === "RULES"
              ? "text-primary after:absolute after:left-0 after:right-0 after:-bottom-px after:h-[3px] after:bg-primary after:rounded-full"
              : "text-muted-foreground hover:text-primary",
          ].join(" ")}
          onClick={() => setTab("RULES")}
          type="button"
        >
          회칙
        </button>
      </div>

      {/* Notices Section */}
      {tab === "NOTICES" ? (
        <div className="border border-border rounded-2xl bg-white p-4">
          {/* Add Notice Button */}
          {!isAddingNotice && (
            <button
              className="w-full border border-dashed border-border bg-gray-50 rounded-xl py-3 px-4
                         inline-flex items-center justify-center gap-2 text-sm font-bold mb-4
                         hover:border-primary hover:text-primary transition-colors"
              onClick={() => setIsAddingNotice(true)}
              type="button"
            >
              <PlusIcon size={16} /> 공지사항 추가
            </button>
          )}

          {/* Add Notice Form */}
          {isAddingNotice && (
            <div className="border border-border bg-gray-50 rounded-2xl p-4 mb-4">
              <input
                className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-white mb-2 outline-none focus:border-primary"
                placeholder="공지 제목"
                value={newNotice.title}
                onChange={(e) => setNewNotice((p) => ({ ...p, title: e.target.value }))}
              />
              <textarea
                className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-white mb-2 outline-none focus:border-primary resize-y"
                placeholder="공지 내용"
                value={newNotice.content}
                onChange={(e) => setNewNotice((p) => ({ ...p, content: e.target.value }))}
                rows={4}
              />
              <div className="flex gap-2">
                <button
                  className="flex-1 rounded-xl py-3 px-4 text-sm font-extrabold bg-black/[0.06] text-foreground"
                  onClick={() => {
                    setIsAddingNotice(false);
                    setNewNotice({ title: "", content: "" });
                  }}
                  type="button"
                >
                  취소
                </button>
                <button
                  className="flex-1 rounded-xl py-3 px-4 text-sm font-extrabold bg-primary text-white"
                  onClick={handleAddNotice}
                  type="button"
                >
                  추가
                </button>
              </div>
            </div>
          )}

          {/* Notices List */}
          <div className="flex flex-col gap-2">
            {notices.length === 0 && !isAddingNotice ? (
              <p className="py-6 text-sm text-muted-foreground">등록된 공지사항이 없습니다.</p>
            ) : (
              notices.map((n) => (
                <div
                  key={n.id}
                  className="border border-border bg-gray-50 rounded-2xl p-4 flex items-start justify-between gap-4 max-[359px]:flex-col"
                >
                  {editingNoticeId === n.id ? (
                    <div className="flex flex-col gap-2 w-full">
                      <input
                        className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-primary"
                        value={editingNotice.title}
                        onChange={(e) => setEditingNotice((p) => ({ ...p, title: e.target.value }))}
                      />
                      <textarea
                        className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-primary resize-y"
                        value={editingNotice.content}
                        onChange={(e) => setEditingNotice((p) => ({ ...p, content: e.target.value }))}
                        rows={4}
                      />
                      <div className="flex gap-2">
                        <button
                          className="flex-1 rounded-xl py-3 px-4 text-sm font-extrabold bg-black/[0.06] text-foreground"
                          onClick={() => setEditingNoticeId(null)}
                          type="button"
                        >
                          취소
                        </button>
                        <button
                          className="flex-1 rounded-xl py-3 px-4 text-sm font-extrabold bg-primary text-white"
                          onClick={handleSaveNotice}
                          type="button"
                        >
                          저장
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <div className="font-extrabold text-sm mb-1.5">{n.title}</div>
                        <div className="text-xs text-muted-foreground whitespace-pre-wrap">{n.content}</div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          className="w-9 h-9 border border-border bg-white rounded-xl inline-flex items-center justify-center
                                     hover:border-primary hover:text-primary transition-colors"
                          onClick={() => handleEditNotice(n)}
                          type="button"
                          title="수정"
                        >
                          <EditIcon size={16} />
                        </button>
                        <button
                          className="w-9 h-9 border border-border bg-white rounded-xl inline-flex items-center justify-center
                                     hover:border-red-400 hover:text-red-500 transition-colors"
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
        /* Rules Section */
        <div className="border border-border rounded-2xl bg-white p-4">
          {/* Add Rule Button */}
          {!isAddingRule && (
            <button
              className="w-full border border-dashed border-border bg-gray-50 rounded-xl py-3 px-4
                         inline-flex items-center justify-center gap-2 text-sm font-bold mb-4
                         hover:border-primary hover:text-primary transition-colors"
              onClick={() => setIsAddingRule(true)}
              type="button"
            >
              <PlusIcon size={16} /> 회칙 추가
            </button>
          )}

          {/* Add Rule Form */}
          {isAddingRule && (
            <div className="border border-border bg-gray-50 rounded-2xl p-4 mb-4">
              <input
                className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-white mb-2 outline-none focus:border-primary"
                placeholder="회칙 제목"
                value={newRule.title}
                onChange={(e) => setNewRule((p) => ({ ...p, title: e.target.value }))}
              />
              <textarea
                className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-white mb-2 outline-none focus:border-primary resize-y"
                placeholder="회칙 내용"
                value={newRule.content}
                onChange={(e) => setNewRule((p) => ({ ...p, content: e.target.value }))}
                rows={4}
              />
              <div className="flex gap-2">
                <button
                  className="flex-1 rounded-xl py-3 px-4 text-sm font-extrabold bg-black/[0.06] text-foreground"
                  onClick={() => {
                    setIsAddingRule(false);
                    setNewRule({ title: "", content: "" });
                  }}
                  type="button"
                >
                  취소
                </button>
                <button
                  className="flex-1 rounded-xl py-3 px-4 text-sm font-extrabold bg-primary text-white"
                  onClick={handleAddRule}
                  type="button"
                >
                  추가
                </button>
              </div>
            </div>
          )}

          {/* Rules List */}
          <div className="flex flex-col gap-2">
            {rules.length === 0 && !isAddingRule ? (
              <p className="py-6 text-sm text-muted-foreground">등록된 회칙이 없습니다.</p>
            ) : (
              rules.map((r) => (
                <div
                  key={r.id}
                  className="border border-border bg-gray-50 rounded-2xl p-4 flex items-start justify-between gap-4 max-[359px]:flex-col"
                >
                  {editingRuleId === r.id ? (
                    <div className="flex flex-col gap-2 w-full">
                      <input
                        className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-primary"
                        value={editingRule.title}
                        onChange={(e) => setEditingRule((p) => ({ ...p, title: e.target.value }))}
                      />
                      <textarea
                        className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-primary resize-y"
                        value={editingRule.content}
                        onChange={(e) => setEditingRule((p) => ({ ...p, content: e.target.value }))}
                        rows={4}
                      />
                      <div className="flex gap-2">
                        <button
                          className="flex-1 rounded-xl py-3 px-4 text-sm font-extrabold bg-black/[0.06] text-foreground"
                          onClick={() => setEditingRuleId(null)}
                          type="button"
                        >
                          취소
                        </button>
                        <button
                          className="flex-1 rounded-xl py-3 px-4 text-sm font-extrabold bg-primary text-white"
                          onClick={handleSaveRule}
                          type="button"
                        >
                          저장
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <div className="font-extrabold text-sm mb-1.5">{r.title}</div>
                        <div className="text-xs text-muted-foreground whitespace-pre-wrap">{r.content}</div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          className="w-9 h-9 border border-border bg-white rounded-xl inline-flex items-center justify-center
                                     hover:border-primary hover:text-primary transition-colors"
                          onClick={() => handleEditRule(r)}
                          type="button"
                          title="수정"
                        >
                          <EditIcon size={16} />
                        </button>
                        <button
                          className="w-9 h-9 border border-border bg-white rounded-xl inline-flex items-center justify-center
                                     hover:border-red-400 hover:text-red-500 transition-colors"
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

export default ClubNoticeManagePage;
