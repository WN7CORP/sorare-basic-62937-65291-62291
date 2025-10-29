import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Sparkles, Search, Scale } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
const FlashcardsTemas = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const area = searchParams.get("area");
  const [searchTerm, setSearchTerm] = useState("");
  const {
    data: temas,
    isLoading
  } = useQuery({
    queryKey: ["flashcards-temas", area],
    queryFn: async () => {
      if (!area) return [];
      const {
        data,
        error
      } = await supabase.rpc("get_flashcard_temas", {
        p_area: area
      });
      if (error) throw error;
      return data.map(row => ({
        tema: row.tema,
        count: Number(row.count)
      }));
    },
    enabled: !!area
  });
  // Todos os ícones são vermelhos
  const getDifficultyColor = (index: number) => {
    return 'text-red-500';
  };
  const filteredTemas = temas?.filter(tema => tema.tema.toLowerCase().includes(searchTerm.toLowerCase()));
  if (!area) {
    navigate("/flashcards");
    return null;
  }
  return <div className="min-h-screen bg-background pb-20">
      

      <div className="max-w-4xl mx-auto px-3 py-4">

        {/* Campo de Busca */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input placeholder="Buscar tema..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="text-base" />
              <Button variant="outline" size="icon" className="shrink-0">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Temas */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Temas Disponíveis
          </h2>

            {isLoading ? <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-[90px] w-full rounded-lg" />)}
            </div> : <div className="space-y-3">
              {filteredTemas?.map((item, index) => {
            return <Card key={item.tema} className="cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all border border-border hover:border-accent/50 bg-gradient-to-br from-card to-card/80 group animate-fade-in" onClick={() => navigate(`/flashcards/estudar?area=${encodeURIComponent(area)}&tema=${encodeURIComponent(item.tema)}`)}>
                    <CardContent className="p-5 flex items-center gap-4 min-h-[90px]">
                      <div className="flex items-center justify-center w-10 h-10 flex-shrink-0">
                        <Scale className={`w-7 h-7 ${getDifficultyColor(index)}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base mb-1 flex items-center gap-2">
                          {item.tema}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {item.count} questõe{item.count !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </CardContent>
                  </Card>;
          })}
            </div>}
        </div>
      </div>
    </div>;
};
export default FlashcardsTemas;