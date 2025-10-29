import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Play, Star, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import useEmblaCarousel from "embla-carousel-react";
import { JuriFlixTituloEnriquecido } from "@/types/juriflix.types";
import { JuriFlixCard } from "@/components/JuriFlixCard";
import { JuriFlixFilters } from "@/components/JuriFlixFilters";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const JuriFlix = () => {
  const navigate = useNavigate();
  const [emblaRefFilmes] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps", dragFree: true });
  const [emblaRefSeries] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps", dragFree: true });
  const [emblaRefDocumentarios] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps", dragFree: true });
  
  // Filtros
  const [selectedTipos, setSelectedTipos] = useState<string[]>([]);
  const [decadeRange, setDecadeRange] = useState<[number, number]>([1950, 2020]);
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const { data: titulos, isLoading } = useQuery({
    queryKey: ["juriflix"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("JURIFLIX" as any)
        .select("*")
        .order("nota", { ascending: false });

      if (error) throw error;
      return data as unknown as JuriFlixTituloEnriquecido[];
    },
  });

  // Filtrar títulos
  const titulosFiltrados = useMemo(() => {
    if (!titulos) return [];
    
    return titulos.filter((t) => {
      // Filtro de tipo
      if (selectedTipos.length > 0) {
        if (!selectedTipos.some(tipo => t.tipo?.toLowerCase().includes(tipo.toLowerCase()))) {
          return false;
        }
      }
      
      // Filtro de década
      if (t.ano) {
        const ano = parseInt(t.ano.toString());
        if (ano < decadeRange[0] || ano > decadeRange[1] + 9) {
          return false;
        }
      }
      
      // Filtro de rating
      if (minRating > 0) {
        const rating = t.popularidade ? t.popularidade / 10 : parseFloat(t.nota?.toString() || "0");
        if (rating < minRating) {
          return false;
        }
      }
      
      return true;
    });
  }, [titulos, selectedTipos, decadeRange, minRating]);

  const destaque = titulosFiltrados[0];
  const filmes = titulosFiltrados.filter((t) => t.tipo?.toLowerCase().includes("filme"));
  const series = titulosFiltrados.filter((t) => t.tipo?.toLowerCase().includes("série"));
  const documentarios = titulosFiltrados.filter((t) => t.tipo?.toLowerCase().includes("documentário"));

  const handleTipoToggle = (tipo: string) => {
    setSelectedTipos(prev =>
      prev.includes(tipo) ? prev.filter(t => t !== tipo) : [...prev, tipo]
    );
  };

  const handleClearFilters = () => {
    setSelectedTipos([]);
    setDecadeRange([1950, 2020]);
    setMinRating(0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-accent"></div>
      </div>
    );
  }


  return (
    <div className="pb-20">
      {/* Hero Banner */}
      {destaque && (
        <div
          className="relative h-[400px] bg-cover bg-center"
          style={{
            backgroundImage: `url(${destaque.capa})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="relative h-full max-w-4xl mx-auto px-4 flex flex-col justify-end pb-8">
            <Badge className="w-fit mb-2">{destaque.tipo}</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{destaque.nome}</h1>
            <div className="flex items-center gap-3 mb-3 text-sm">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span>{destaque.nota}</span>
              </div>
              <span>{destaque.ano}</span>
              {destaque.plataforma && <span>• {destaque.plataforma}</span>}
            </div>
            <p className="text-sm md:text-base max-w-2xl mb-4 line-clamp-3">
              {destaque.sinopse}
            </p>
            <div className="flex gap-3">
              <Button onClick={() => navigate(`/juriflix/${destaque.id}`)}>
                <Play className="w-4 h-4 mr-2" />
                Ver Detalhes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filtros e Seções */}
      <div className="max-w-4xl mx-auto px-3 py-6 space-y-8">
        {/* Botão de Filtros Mobile */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Catálogo</h2>
          <Sheet open={showFilters} onOpenChange={setShowFilters}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Settings2 className="w-4 h-4" />
                Filtros
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filtros</SheetTitle>
                <SheetDescription>
                  Refine sua busca por filmes e séries jurídicas
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <JuriFlixFilters
                  selectedTipos={selectedTipos}
                  onTipoToggle={handleTipoToggle}
                  decadeRange={decadeRange}
                  onDecadeChange={setDecadeRange}
                  minRating={minRating}
                  onRatingChange={setMinRating}
                  onClearFilters={handleClearFilters}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
        {/* Filmes */}
        {filmes && filmes.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Filmes Jurídicos</h2>
            <div className="overflow-hidden" ref={emblaRefFilmes}>
              <div className="flex gap-3">
                {filmes.map((titulo, index) => (
                  <div key={titulo.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                    <JuriFlixCard 
                      titulo={titulo}
                      onClick={() => navigate(`/juriflix/${titulo.id}`)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Séries */}
        {series && series.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Séries Jurídicas</h2>
            <div className="overflow-hidden" ref={emblaRefSeries}>
              <div className="flex gap-3">
                {series.map((titulo, index) => (
                  <div key={titulo.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                    <JuriFlixCard 
                      titulo={titulo}
                      onClick={() => navigate(`/juriflix/${titulo.id}`)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Documentários */}
        {documentarios && documentarios.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Documentários</h2>
            <div className="overflow-hidden" ref={emblaRefDocumentarios}>
              <div className="flex gap-3">
                {documentarios.map((titulo, index) => (
                  <div key={titulo.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                    <JuriFlixCard 
                      titulo={titulo}
                      onClick={() => navigate(`/juriflix/${titulo.id}`)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JuriFlix;
