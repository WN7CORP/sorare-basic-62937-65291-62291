import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { DesktopTopNav } from "./DesktopTopNav";
import { AppSidebar } from "./AppSidebar";
import { DesktopChatPanel } from "./DesktopChatPanel";
import { VideoPlaylistSidebar } from "./VideoPlaylistSidebar";
import { ResumosSidebar } from "./ResumosSidebar";
import { useDeviceType } from "@/hooks/use-device-type";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const { isMobile, isTablet, isDesktop } = useDeviceType();
  
  // Esconder BottomNav em páginas de conteúdo jurídico e simulados
  const hideBottomNav = 
    location.pathname === "/vade-mecum" ||
    location.pathname.startsWith("/codigo/") ||
    location.pathname === "/codigos" ||
    location.pathname === "/constituicao" ||
    location.pathname === "/estatutos" ||
    location.pathname.startsWith("/estatuto/") ||
    location.pathname === "/sumulas" ||
    location.pathname.startsWith("/sumula/") ||
    location.pathname === "/simulados/realizar" ||
    location.pathname === "/simulados/personalizado" ||
    location.pathname.includes("/simulacao-juridica/avatar") ||
    location.pathname.includes("/simulacao-juridica/escolha-caso") ||
    location.pathname.includes("/simulacao-juridica/caso/") ||
    location.pathname.includes("/simulacao-juridica/audiencia/") ||
    location.pathname.includes("/simulacao-juridica/feedback/") ||
    location.pathname === "/chat-professora" ||
    location.pathname === "/aula-interativa" ||
    location.pathname === "/plano-estudos" ||
    location.pathname === "/cursos/modulos" ||
    location.pathname === "/cursos/aulas" ||
    location.pathname === "/aprender/estagios/buscar" ||
    location.pathname.startsWith("/meu-brasil/jurista/");
  
  // Esconder Header em páginas com header próprio
  const hideHeader = location.pathname === "/professora" || location.pathname === "/chat-professora";

  // DESKTOP LAYOUT (>= 1024px)
  if (isDesktop) {
    // Detectar se deve mostrar sidebar de playlists
    const isVideoPlayer = location.pathname === '/videoaulas/player';
    const isResumoView = location.pathname.includes('/resumos-juridicos/prontos/') && 
                         location.pathname.split('/').length > 4;

    return (
      <div className="h-screen flex flex-col w-full bg-background text-foreground">
        <DesktopTopNav />
        
        <div className="flex-1 flex overflow-hidden w-full">
          {/* Sidebar Esquerda - CONDICIONAL */}
          <div className="w-64 flex-shrink-0">
            {isVideoPlayer ? (
              <VideoPlaylistSidebar />
            ) : isResumoView ? (
              <ResumosSidebar />
            ) : (
              <AppSidebar />
            )}
          </div>

          {/* Conteúdo Central */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>

          {/* Chat Panel Direita */}
          <DesktopChatPanel />
        </div>
      </div>
    );
  }

  // TABLET LAYOUT (640px - 1024px)
  if (isTablet) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {!hideHeader && <Header />}
        <main className={hideBottomNav ? "flex-1 w-full max-w-5xl mx-auto px-4" : "flex-1 pb-20 w-full max-w-5xl mx-auto px-4"}>
          {children}
        </main>
        {!hideBottomNav && <BottomNav />}
      </div>
    );
  }
  
  // MOBILE LAYOUT (< 640px)
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {!hideHeader && <Header />}
      <main className={hideBottomNav ? "flex-1 w-full max-w-7xl mx-auto" : "flex-1 pb-20 w-full max-w-7xl mx-auto"}>
        {children}
      </main>
      {!hideBottomNav && <BottomNav />}
    </div>
  );
};
