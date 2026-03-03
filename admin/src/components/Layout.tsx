import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/clubs", label: "클럽 관리" },
  { to: "/audit-logs", label: "Audit Logs" },
  { to: "/batch", label: "배치 작업" },
  { to: "/award-winners", label: "어워드 수상자" },
  { to: "/inquiries", label: "문의 관리" },
  { to: "/push-send", label: "알림 발송" },
  { to: "/notification-history", label: "알림 이력" },
  { to: "/dm", label: "DM 관리" },
];

function NavItems({ onItemClick }: { onItemClick?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5 p-3">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onItemClick}
          className={({ isActive }) =>
            cn(
              "block px-3 py-2 rounded-md text-sm transition-colors",
              isActive
                ? "bg-primary text-primary-foreground font-medium"
                : "text-foreground hover:bg-muted"
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  const { adminUser, signOut } = useAuth();
  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <h1 className="text-lg font-bold text-primary">OpenRun Admin</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <NavItems onItemClick={onItemClick} />
      </div>
      {adminUser && (
        <>
          <Separator />
          <div className="p-4 flex flex-col gap-2">
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{adminUser.name}</span>
              <span className="text-xs text-muted-foreground truncate">{adminUser.email}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
              onClick={signOut}
            >
              로그아웃
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function Layout() {
  return (
    <div className="flex min-h-screen">
      {/* 데스크톱 고정 사이드바 */}
      <aside className="hidden md:flex w-60 flex-col bg-card border-r border-border shrink-0">
        <SidebarContent />
      </aside>

      {/* 모바일 Sheet 사이드바 */}
      <div className="md:hidden fixed top-3 left-3 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9 shadow-sm">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-60 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>메뉴</SheetTitle>
            </SheetHeader>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-y-auto p-4 pt-14 md:p-6 md:pt-6">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
