import { useNavigate, useLocation } from "react-router-dom";
import { Home, Monitor, Sparkles, GraduationCap, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppSidebar } from "./AppSidebar";
import { useState } from "react";

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    {
      id: "inicio",
      label: "Início",
      icon: Home,
      path: "/",
    },
    {
      id: "professora",
      label: "Professora",
      icon: GraduationCap,
      path: "/chat-professora",
    },
    {
      id: "desktop",
      label: "Desktop",
      icon: Monitor,
      path: "/acesso-desktop",
    },
    {
      id: "novidades",
      label: "Novidades",
      icon: Sparkles,
      path: "/novidades",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card">
      <div className="max-w-2xl mx-auto px-2 py-2.5">
        <div className="flex items-center justify-around gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl transition-all min-w-[60px] relative",
                  active
                    ? "text-primary bg-primary/15 ring-1 ring-primary/20"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                )}
              >
                <Icon className={cn("w-6 h-6 transition-transform", active && "scale-110")} />
                <span className="text-[11px] font-medium leading-tight">{item.label}</span>
              </button>
            );
          })}

          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl transition-all min-w-[60px] relative",
                  "text-muted-foreground hover:text-primary hover:bg-primary/10"
                )}
              >
                <Menu className="w-6 h-6 transition-transform" />
                <span className="text-[11px] font-medium leading-tight">Menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <AppSidebar />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};