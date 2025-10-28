import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Video, Target, Loader2, Gavel } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const OAB = () => {
  const navigate = useNavigate();

  const { data: videoaulas, isLoading: loadingVideos } = useQuery({
    queryKey: ["videoaulas-oab"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("VIDEO AULAS-NOVO" as any)
        .select("*")
        .or('categoria.eq.OAB,area.ilike.%2ª Fase%,area.ilike.%Segunda Fase%,area.ilike.%segunda fase%');

      if (error) throw error;
      
      // Agrupar por área
      const areaGroups = data?.reduce((acc: any, curr: any) => {
        const area = curr.area || 'Outros';
        if (!acc[area]) acc[area] = [];
        acc[area].push(curr);
        return acc;
      }, {});
      
      // Retornar número de áreas únicas
      return areaGroups ? Object.keys(areaGroups).length : 0;
    },
  });

  const oabCategories = [
    {
      id: "biblioteca",
      title: "Biblioteca da OAB",
      description: "Materiais oficiais da Ordem",
      icon: BookOpen,
      route: "/biblioteca-oab",
      gradient: "from-[hsl(0,75%,55%)] to-[hsl(350,70%,45%)]",
    },
    {
      id: "videoaulas",
      title: "Videoaulas 2ª Fase",
      description: `${videoaulas || 0} área${videoaulas !== 1 ? 's' : ''} disponíve${videoaulas !== 1 ? 'is' : 'l'}`,
      icon: Video,
      route: "/videoaulas-oab",
      gradient: "from-[hsl(0,75%,55%)] to-[hsl(350,70%,45%)]",
      disabled: loadingVideos,
    },
    {
      id: "questoes",
      title: "Questões OAB",
      description: "Simulado personalizado por tema",
      icon: Target,
      route: "/simulados/personalizado",
      gradient: "from-[hsl(0,75%,55%)] to-[hsl(350,70%,45%)]",
    },
    {
      id: "simulado",
      title: "Simulado OAB",
      description: "Exames completos da OAB",
      icon: Gavel,
      route: "/simulados/exames",
      gradient: "from-[hsl(0,75%,55%)] to-[hsl(350,70%,45%)]",
    },
  ];

  if (loadingVideos) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-5 md:space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            OAB
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Tudo que você precisa para sua aprovação na Ordem dos Advogados do Brasil
          </p>
        </div>

        {/* Categories Grid - Estilo Vade Mecum */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {oabCategories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => !category.disabled && navigate(category.route)}
                disabled={category.disabled}
                className={`bg-gradient-to-br ${category.gradient} rounded-2xl p-4 md:p-5 text-left transition-all hover:scale-105 hover:shadow-xl flex flex-col items-center justify-center gap-3 min-h-[140px] md:min-h-[160px] relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
              >
                <div className="absolute inset-0 bg-gradient-to-tl from-black/60 via-black/30 to-transparent pointer-events-none" />
                
                {/* Ícone pequeno centralizado */}
                <div className="bg-white/20 rounded-lg p-2.5 md:p-3 w-fit relative z-10 shadow-lg">
                  <Icon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                </div>
                
                {/* Título e descrição centralizados */}
                <div className="text-center relative z-10 space-y-1">
                  <h3
                    className="text-base md:text-lg font-bold text-white"
                    style={{
                      textShadow: '2px 2px 4px rgba(0,0,0,0.6)',
                    }}
                  >
                    {category.title}
                  </h3>
                  <p
                    className="text-white/90 text-xs md:text-sm line-clamp-2"
                    style={{
                      textShadow: '1px 1px 3px rgba(0,0,0,0.5)',
                    }}
                  >
                    {category.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardContent className="p-4 md:p-5">
            <h3 className="font-bold text-foreground mb-2">
              Sobre esta seção
            </h3>
            <p className="text-sm text-muted-foreground">
              A seção OAB reúne todos os recursos essenciais para sua preparação: 
              biblioteca oficial com materiais da OAB, videoaulas específicas para 
              a segunda fase, e simulados completos baseados nos exames anteriores. 
              Organize seus estudos e aumente suas chances de aprovação!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OAB;
