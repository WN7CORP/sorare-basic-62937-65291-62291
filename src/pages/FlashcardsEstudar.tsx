import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { FlashcardViewer } from "@/components/FlashcardViewer";
const FlashcardsEstudar = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const area = searchParams.get("area");
  const tema = searchParams.get("tema");
  const {
    data: flashcards,
    isLoading
  } = useQuery({
    queryKey: ["flashcards-estudar", area, tema],
    queryFn: async () => {
      if (!area) return [];

      // Fetch all flashcards using pagination to avoid truncation
      const pageSize = 1000;
      let offset = 0;
      let allData: any[] = [];
      let hasMore = true;
      while (hasMore) {
        let query = supabase.from("FLASHCARDS").select("*").eq("area", area).not("pergunta", "is", null).not("resposta", "is", null).range(offset, offset + pageSize - 1);
        if (tema) {
          query = query.eq("tema", tema);
        }
        const {
          data,
          error
        } = await query;
        if (error) throw error;
        if (data && data.length > 0) {
          allData = allData.concat(data);
          hasMore = data.length === pageSize;
          offset += pageSize;
        } else {
          hasMore = false;
        }
      }
      return allData.map(card => ({
        front: card.pergunta || "",
        back: card.resposta || "",
        exemplo: card.exemplo || ""
      }));
    },
    enabled: !!area
  });
  if (!area) {
    navigate("/flashcards");
    return null;
  }
  return <div className="min-h-screen bg-gradient-to-br from-[hsl(260,40%,15%)] via-[hsl(250,35%,18%)] to-[hsl(240,30%,20%)] pb-24">
      

      <div className="max-w-4xl mx-auto px-3 py-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">{area}</h1>
          {tema && <p className="text-sm text-white/60">Tema: {tema}</p>}
        </div>

        {isLoading ? <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-white mb-4" />
            <p className="text-white/60">Carregando flashcards...</p>
          </div> : flashcards && flashcards.length > 0 ? <FlashcardViewer flashcards={flashcards} tema={tema || ""} /> : <div className="text-center py-20">
            <p className="text-white/60">
              Nenhum flashcard encontrado para esta seleção.
            </p>
          </div>}
      </div>
    </div>;
};
export default FlashcardsEstudar;