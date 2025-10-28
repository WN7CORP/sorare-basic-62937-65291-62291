import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { 
  Crown, 
  BookOpen, 
  FileText, 
  Scale,
  Handshake,
  Gavel,
  FileText as FileTextIcon,
  Sword,
  Briefcase,
  Shield,
  DollarSign,
  Droplets,
  Plane,
  Radio,
  Building2,
  Mountain,
  GraduationCap,
  Video,
  Headphones,
  Layers,
  ClipboardList,
  Library,
  Sparkles,
  Users,
  Megaphone,
  Coffee,
  Wrench,
  Briefcase as BriefcaseIcon,
  FileSearch,
  FileCheck2,
  ClipboardCheck,
  Star,
  MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AvaliarAppModal } from "./AvaliarAppModal";
import { SuporteChatModal } from "./SuporteChatModal";
import { useAppRating } from "@/hooks/useAppRating";

export const AppSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [avaliarModalOpen, setAvaliarModalOpen] = useState(false);
  const [suporteModalOpen, setSuporteModalOpen] = useState(false);
  
  const { deviceType, handleRated, handlePostpone } = useAppRating();

  const isActive = (path: string) => location.pathname === path;

  const leisSections = [
    {
      title: "Constituição",
      icon: Crown,
      path: "/constituicao",
    },
    {
      title: "Códigos & Leis",
      icon: BookOpen,
      path: "/codigos",
    },
    {
      title: "Estatutos",
      icon: FileText,
      path: "/estatutos",
    },
    {
      title: "Súmulas",
      icon: Scale,
      path: "/sumulas",
    },
  ];

  const aprenderSections = [
    { title: "Cursos", icon: GraduationCap, path: "/cursos" },
    { title: "Videoaulas", icon: Video, path: "/videoaulas" },
    { title: "Audioaulas", icon: Headphones, path: "/audioaulas" },
    { title: "Flashcards", icon: Layers, path: "/flashcards" },
    { title: "Plano de Estudos", icon: ClipboardList, path: "/plano-estudos" },
  ];

  const bibliotecasSections = [
    { title: "Biblioteca OAB", icon: Scale, path: "/biblioteca-oab" },
    { title: "Clássicos", icon: Library, path: "/biblioteca-classicos" },
    { title: "Estudos", icon: BookOpen, path: "/biblioteca-estudos" },
    { title: "Liderança", icon: Users, path: "/biblioteca-lideranca" },
    { title: "Oratória", icon: Megaphone, path: "/biblioteca-oratoria" },
    { title: "Fora da Toga", icon: Coffee, path: "/biblioteca-fora-da-toga" },
  ];

  const ferramentasSections = [
    { title: "Ferramentas", icon: Wrench, path: "/ferramentas" },
    { title: "Advogado", icon: BriefcaseIcon, path: "/advogado" },
    { title: "Analisar Documentos", icon: FileSearch, path: "/analisar" },
    { title: "Resumos Jurídicos", icon: FileCheck2, path: "/resumos-juridicos" },
  ];

  const simuladosSections = [
    { title: "Simulados", icon: ClipboardCheck, path: "/simulados" },
    { title: "Realizar Simulados", icon: FileText, path: "/simulados-exames" },
  ];


  const handleSuporteClick = () => {
    setSuporteModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="bg-primary rounded-xl p-2">
            <Scale className="w-6 h-6 text-primary-foreground" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Menu</h2>
        </div>
      </div>

      {/* Avaliar App - Destaque */}
      <div className="px-4 pt-4 pb-2">
        <button
          onClick={() => setAvaliarModalOpen(true)}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg bg-warning/10 hover:bg-warning/20 transition-all text-left border border-warning/30"
        >
          <Star className="w-5 h-5 text-warning animate-pulse" />
          <span className="text-sm font-medium text-foreground">Avaliar App</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {/* Leis Section */}
        <div className="px-4 space-y-1 mb-6">
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Leis
          </h3>
          {leisSections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.path}
                onClick={() => navigate(section.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left",
                  isActive(section.path)
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-foreground hover:bg-secondary"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{section.title}</span>
              </button>
            );
          })}
        </div>


        {/* Aprender Section */}
        <div className="px-4 space-y-1 mb-6">
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Aprender
          </h3>
          {aprenderSections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.path}
                onClick={() => navigate(section.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left",
                  isActive(section.path)
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-foreground hover:bg-secondary"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{section.title}</span>
              </button>
            );
          })}
        </div>

        {/* Bibliotecas Section */}
        <div className="px-4 space-y-1 mb-6">
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Bibliotecas
          </h3>
          {bibliotecasSections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.path}
                onClick={() => navigate(section.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left",
                  isActive(section.path)
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-foreground hover:bg-secondary"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{section.title}</span>
              </button>
            );
          })}
        </div>

        {/* Ferramentas Section */}
        <div className="px-4 space-y-1 mb-6">
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Ferramentas
          </h3>
          {ferramentasSections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.path}
                onClick={() => navigate(section.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left",
                  isActive(section.path)
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-foreground hover:bg-secondary"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{section.title}</span>
              </button>
            );
          })}
        </div>

        {/* Simulados Section */}
        <div className="px-4 space-y-1 mb-6">
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Simulados
          </h3>
          {simuladosSections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.path}
                onClick={() => navigate(section.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left",
                  isActive(section.path)
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-foreground hover:bg-secondary"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{section.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Suporte - Fixo no rodapé */}
      <div className="p-4 border-t border-border bg-card">
        <button
          onClick={handleSuporteClick}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg bg-accent/10 hover:bg-accent/20 transition-all text-left border border-accent/30"
        >
          <MessageCircle className="w-5 h-5 text-accent" />
          <span className="text-sm font-medium text-foreground">Suporte</span>
        </button>
      </div>

      <AvaliarAppModal 
        open={avaliarModalOpen} 
        onOpenChange={setAvaliarModalOpen}
        deviceType={deviceType}
        onRated={() => {
          handleRated();
          setAvaliarModalOpen(false);
        }}
        onPostpone={() => {
          handlePostpone();
          setAvaliarModalOpen(false);
        }}
      />
      <SuporteChatModal open={suporteModalOpen} onOpenChange={setSuporteModalOpen} />
    </div>
  );
};
