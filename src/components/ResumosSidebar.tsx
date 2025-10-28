import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Search, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Resumo {
  id: number;
  subtema: string;
  "ordem subtema": string;
}

export const ResumosSidebar = () => {
  const navigate = useNavigate();
  const { area, tema } = useParams();
  const [resumos, setResumos] = useState<Resumo[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedResumoId, setSelectedResumoId] = useState<number | null>(null);

  useEffect(() => {
    const loadResumos = async () => {
      if (!area || !tema) return;

      const { data } = await supabase
        .from("RESUMO")
        .select("id, subtema, \"ordem subtema\"")
        .eq("area", decodeURIComponent(area))
        .eq("tema", decodeURIComponent(tema))
        .not("subtema", "is", null)
        .order("ordem subtema", { ascending: true });

      if (data) setResumos(data as any[]);
    };
    loadResumos();
  }, [area, tema]);

  const filteredResumos = resumos.filter(r =>
    r.subtema.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => navigate(`/resumos-juridicos/prontos/${area}`)}
            className="p-1 hover:bg-secondary rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h3 className="text-sm font-semibold">Subtemas</h3>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar subtema..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Lista de subtemas */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredResumos.map((resumo) => (
            <button
              key={resumo.id}
              onClick={() => setSelectedResumoId(resumo.id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                selectedResumoId === resumo.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary"
              )}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span className="text-sm flex-1 line-clamp-2">{resumo.subtema}</span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
