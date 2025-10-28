import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, TrendingUp, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const FlashcardsAreas = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: areas, isLoading } = useQuery({
    queryKey: ["flashcards-areas"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_flashcard_areas");

      if (error) throw error;

      return data.map((row) => ({
        area: row.area,
        count: Number(row.count),
      }));
    },
  });

  const areaIcons = ["📜", "⚖️", "💼", "💰", "🏛️", "📋"];
  const glowColors = [
    "rgb(139, 92, 246)",
    "rgb(239, 68, 68)", 
    "rgb(16, 185, 129)",
    "rgb(245, 158, 11)",
    "rgb(59, 130, 246)",
    "rgb(236, 72, 153)",
  ];

  const filteredAreas = areas?.filter((area) =>
    area.area.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-600 shadow-lg shadow-purple-500/50">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Flashcards</h1>
            <p className="text-sm text-muted-foreground">
              Escolha uma área do direito para estudar
            </p>
          </div>
        </div>
      </div>

      {/* Campo de Busca */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar área..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-base"
            />
            <Button variant="outline" size="icon" className="shrink-0">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Áreas de Flashcards */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Áreas Disponíveis
        </h2>
        
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-[140px] w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredAreas?.map((item, index) => (
              <Card
                key={item.area}
                className="cursor-pointer hover:scale-105 hover:shadow-xl hover:-translate-y-1 transition-all border-2 border-transparent hover:border-primary/50 bg-gradient-to-br from-card to-card/80 group overflow-hidden relative animate-fade-in"
                onClick={() =>
                  navigate(`/flashcards/temas?area=${encodeURIComponent(item.area)}`)
                }
              >
                <div 
                  className="absolute top-0 left-0 right-0 h-1 opacity-80"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${glowColors[index % glowColors.length]}, transparent)`,
                    boxShadow: `0 0 20px ${glowColors[index % glowColors.length]}`
                  }}
                />
                
                <CardContent className="p-4 flex flex-col items-center text-center min-h-[140px] justify-center">
                  <div className="text-3xl mb-2">{areaIcons[index % areaIcons.length]}</div>
                  <h3 className="font-bold text-sm mb-1">{item.area}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.count} flashcard{item.count !== 1 ? "s" : ""} disponíve{item.count !== 1 ? "is" : "l"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardsAreas;
