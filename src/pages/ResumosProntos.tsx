import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, BookOpen, FileText, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Area {
  area: string;
  count: number;
}

interface Tema {
  tema: string;
  count: number;
}

const ResumosProntos = () => {
  const navigate = useNavigate();
  const [areaSelecionada, setAreaSelecionada] = useState<string | null>(null);
  const [searchArea, setSearchArea] = useState("");
  const [searchTema, setSearchTema] = useState("");

  // Buscar áreas únicas - COM PAGINAÇÃO para pegar TODOS os registros
  const { data: areas, isLoading: loadingAreas } = useQuery({
    queryKey: ["resumos-areas"],
    queryFn: async () => {
      let allData: any[] = [];
      let offset = 0;
      const batchSize = 1000;
      let hasMore = true;

      // Buscar em lotes de 1000 até pegar todos
      while (hasMore) {
        const { data, error } = await supabase
          .from("RESUMO")
          .select("area")
          .not("area", "is", null)
          .range(offset, offset + batchSize - 1);

        if (error) {
          console.error("Erro ao buscar áreas:", error);
          throw error;
        }

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          offset += batchSize;
          hasMore = data.length === batchSize;
        } else {
          hasMore = false;
        }
      }

      console.log(`📊 Total de registros encontrados: ${allData.length}`);

      const areaMap = new Map<string, number>();
      allData.forEach((item) => {
        if (item.area) {
          areaMap.set(item.area, (areaMap.get(item.area) || 0) + 1);
        }
      });

      const areasArray = Array.from(areaMap.entries())
        .map(([area, count]) => ({ area, count }))
        .sort((a, b) => a.area.localeCompare(b.area));

      console.log(`📚 Áreas únicas encontradas: ${areasArray.length}`);
      console.log(`✅ Total de resumos carregados: ${allData.length}`);
      
      return areasArray;
    },
  });

  // Buscar temas da área selecionada - COM PAGINAÇÃO
  const { data: temas, isLoading: loadingTemas } = useQuery({
    queryKey: ["resumos-temas", areaSelecionada],
    queryFn: async () => {
      if (!areaSelecionada) return [];

      let allData: any[] = [];
      let offset = 0;
      const batchSize = 1000;
      let hasMore = true;

      // Buscar em lotes de 1000
      while (hasMore) {
        const { data, error } = await supabase
          .from("RESUMO")
          .select("tema, \"ordem Tema\"")
          .eq("area", areaSelecionada)
          .not("tema", "is", null)
          .range(offset, offset + batchSize - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          offset += batchSize;
          hasMore = data.length === batchSize;
        } else {
          hasMore = false;
        }
      }

      const temaMap = new Map<string, { tema: string; ordem: string; count: number }>();
      allData.forEach((item: any) => {
        if (item.tema) {
          const existing = temaMap.get(item.tema);
          if (existing) {
            existing.count++;
          } else {
            temaMap.set(item.tema, {
              tema: item.tema,
              ordem: item["ordem Tema"] || "0",
              count: 1,
            });
          }
        }
      });

      return Array.from(temaMap.values()).sort((a, b) => {
        const ordemA = parseFloat(a.ordem) || 0;
        const ordemB = parseFloat(b.ordem) || 0;
        return ordemA - ordemB;
      });
    },
    enabled: !!areaSelecionada,
  });

  const areasFiltradas = areas?.filter(a => 
    a.area.toLowerCase().includes(searchArea.toLowerCase())
  );

  if (!areaSelecionada) {
    return (
      <div className="px-3 py-4 max-w-4xl mx-auto animate-fade-in pb-24">
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-bold mb-1">Resumos Prontos</h1>
          <p className="text-sm text-muted-foreground">
            Selecione uma área do Direito para ver os temas disponíveis
          </p>
        </div>

        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar área..."
            value={searchArea}
            onChange={(e) => setSearchArea(e.target.value)}
            className="pl-9"
          />
        </div>

        {loadingAreas ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {areasFiltradas?.map((area) => (
              <Card
                key={area.area}
                className="cursor-pointer hover:shadow-md transition-all hover:border-accent/50 group"
                onClick={() => setAreaSelecionada(area.area)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                        <BookOpen className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{area.area}</h3>
                        <p className="text-xs text-muted-foreground">
                          {area.count} {area.count === 1 ? "resumo" : "resumos"}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  const temasFiltrados = temas?.filter(t =>
    t.tema.toLowerCase().includes(searchTema.toLowerCase())
  );

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto animate-fade-in pb-24">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAreaSelecionada(null)}
          className="mb-2"
        >
          ← Voltar para áreas
        </Button>
        <h1 className="text-xl md:text-2xl font-bold mb-1">{areaSelecionada}</h1>
        <p className="text-sm text-muted-foreground">
          Selecione um tema para ver os resumos disponíveis
        </p>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar tema..."
          value={searchTema}
          onChange={(e) => setSearchTema(e.target.value)}
          className="pl-9"
        />
      </div>

      {loadingTemas ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {temasFiltrados?.map((tema) => (
            <Card
              key={tema.tema}
              className="cursor-pointer hover:shadow-md transition-all hover:border-accent/50 group"
              onClick={() =>
                navigate(
                  `/resumos-juridicos/prontos/${encodeURIComponent(
                    areaSelecionada
                  )}/${encodeURIComponent(tema.tema)}`
                )
              }
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                      <FileText className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{tema.tema}</h3>
                      <p className="text-xs text-muted-foreground">
                        {tema.count} {tema.count === 1 ? "subtema" : "subtemas"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResumosProntos;