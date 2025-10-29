import { useNavigate, useLocation } from "react-router-dom";
import { Home, Wrench, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { VLibrasButton } from "@/components/VLibrasButton";

export const DesktopTopNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { id: "inicio", label: "Início", icon: Home, path: "/" },
    { id: "ferramentas", label: "Ferramentas", icon: Wrench, path: "/ferramentas" },
    { id: "novidades", label: "Novidades", icon: Sparkles, path: "/novidades" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <img 
            src="/logo.webp" 
            alt="Direito Premium" 
            className="w-8 h-8 rounded-lg object-cover"
          />
          <h1 className="text-base font-bold text-foreground font-sans tracking-tight">
            Direito Premium
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium",
                    active
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
          
          <VLibrasButton />
        </div>
      </div>
    </header>
  );
};
