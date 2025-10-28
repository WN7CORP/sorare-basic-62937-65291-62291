import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Headphones } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AudioAula } from "@/types/database.types";

const Audioaulas = () => {
  const navigate = useNavigate();

  const { data: areas, isLoading } = useQuery({
    queryKey: ["audioaulas-areas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("AUDIO-AULA" as any)
        .select("area")
        .order("area");

      if (error) throw error;

      const typedData = data as unknown as Pick<AudioAula, "area">[];

      // Agrupar por área e contar áudios
      const areasMap = new Map<string, number>();
      typedData?.forEach((item) => {
        areasMap.set(item.area, (areasMap.get(item.area) || 0) + 1);
      });

      return Array.from(areasMap.entries()).map(([area, count]) => ({
        area,
        count,
      }));
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(var(--gradient-purple-start))] to-[hsl(var(--gradient-purple-end))] flex items-center justify-center">
            <Headphones className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Audioaulas</h1>
            <p className="text-sm text-muted-foreground">
              Aprenda ouvindo em qualquer lugar
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {areas?.map((item: any, index: number) => {
          const gradientColors = [
            { from: "from-purple-600", to: "to-purple-800", glow: "rgb(147, 51, 234)" },
            { from: "from-blue-600", to: "to-blue-800", glow: "rgb(37, 99, 235)" },
            { from: "from-cyan-600", to: "to-cyan-800", glow: "rgb(8, 145, 178)" },
            { from: "from-green-600", to: "to-green-800", glow: "rgb(22, 163, 74)" },
            { from: "from-orange-600", to: "to-orange-800", glow: "rgb(234, 88, 12)" },
          ];
          const colors = gradientColors[index % gradientColors.length];
          
          return (
            <Card
              key={item.area}
              className="cursor-pointer hover:scale-105 hover:shadow-2xl hover:-translate-y-1 transition-all border-2 border-transparent hover:border-accent/50 bg-gradient-to-br from-gray-900/95 to-gray-800/95 group shadow-xl overflow-hidden relative"
              onClick={() => navigate(`/audioaulas/${encodeURIComponent(item.area)}`)}
            >
              {/* Brilho colorido no topo */}
              <div 
                className="absolute top-0 left-0 right-0 h-1 opacity-80"
                style={{
                  background: `linear-gradient(90deg, transparent, ${colors.glow}, transparent)`,
                  boxShadow: `0 0 20px ${colors.glow}`
                }}
              />
              
              <CardContent className="p-5 flex flex-col items-center text-center min-h-[180px] justify-center">
                <div className={`flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br ${colors.from} ${colors.to} transition-transform group-hover:scale-110 mb-3 shadow-lg`}>
                  <Headphones className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-base mb-2 text-white line-clamp-2">
                  {item.area}
                </h3>
                <p className="text-xs text-gray-300">
                  {item.count} {item.count === 1 ? "áudio" : "áudios"}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Audioaulas;
