import { useState, useEffect, useMemo } from "react";
import type { ClubMemberInfo } from "../services/notificationService";
import { getClubMembers } from "../services/notificationService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface MemberSelectModalProps {
  clubId: number;
  initialSelectedIds: number[];
  onConfirm: (selectedIds: number[]) => void;
  onClose: () => void;
}

function MemberSelectModal({
  clubId,
  initialSelectedIds,
  onConfirm,
  onClose,
}: MemberSelectModalProps) {
  const [members, setMembers] = useState<ClubMemberInfo[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    new Set(initialSelectedIds)
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getClubMembers(clubId)
      .then(setMembers)
      .catch(() => setError("멤버 목록 조회에 실패했습니다."))
      .finally(() => setLoading(false));
  }, [clubId]);

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const query = searchQuery.trim().toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        String(m.id).includes(query)
    );
  }, [members, searchQuery]);

  const handleToggle = (userId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredMembers.map((m) => m.id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      allFilteredIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleDeselectAll = () => {
    const allFilteredIds = new Set(filteredMembers.map((m) => m.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      allFilteredIds.forEach((id) => next.delete(id));
      return next;
    });
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selectedIds));
  };

  const allFilteredSelected =
    filteredMembers.length > 0 && filteredMembers.every((m) => selectedIds.has(m.id));

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>클럽원 선택</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            type="text"
            placeholder="이름 또는 ID로 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={allFilteredSelected ? handleDeselectAll : handleSelectAll}
            >
              {allFilteredSelected ? "전체 해제" : "전체 선택"}
            </Button>
            <span className="text-sm text-muted-foreground">{selectedIds.size}명 선택됨</span>
          </div>
        </div>

        <ScrollArea className="h-64 rounded-md border border-border">
          {loading && (
            <p className="text-center text-sm text-muted-foreground py-8">로딩 중...</p>
          )}
          {error && (
            <p className="text-center text-sm text-destructive py-8">{error}</p>
          )}
          {!loading && !error && filteredMembers.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              {searchQuery ? "검색 결과가 없습니다." : "활성 멤버가 없습니다."}
            </p>
          )}
          {!loading && !error && filteredMembers.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>이름</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow
                    key={member.id}
                    className={cn("cursor-pointer", selectedIds.has(member.id) && "bg-primary/5")}
                    onClick={() => handleToggle(member.id)}
                  >
                    <TableCell className="w-10">
                      <Checkbox
                        checked={selectedIds.has(member.id)}
                        onCheckedChange={() => handleToggle(member.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                    <TableCell>{member.id}</TableCell>
                    <TableCell>{member.name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleConfirm} disabled={selectedIds.size === 0}>
            선택 완료 ({selectedIds.size}명)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default MemberSelectModal;
