import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, BookOpen, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BibliotecaIntro } from "@/components/BibliotecaIntro";
import { BibliotecaCard } from "@/components/BibliotecaCard";
import { LivroCard } from "@/components/LivroCard";
import { AreaLivrosCarousel } from "@/components/AreaLivrosCarousel";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
interface BibliotecaItem {
  id: number;
  Área: string | null;
  Ordem: number | null;
  Tema: string | null;
  Download: string | null;
  Link: string | null;
  "Capa-area": string | null;
  "Capa-livro": string | null;
  Sobre: string | null;
}
const BibliotecaOAB = () => {
  const navigate = useNavigate();
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [mostrarIntro, setMostrarIntro] = useState(true);
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data: capa } = useQuery({
    queryKey: ["capa-biblioteca-oab"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("CAPA-BIBILIOTECA")
        .select("*")
        .eq("Biblioteca", "Biblioteca da OAB")
        .single();

      if (error) throw error;
      return data;
    },
  });

  const {
    data: items,
    isLoading
  } = useQuery({
    queryKey: ["biblioteca-oab"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("BIBILIOTECA-OAB").select("*").order("Ordem", {
        ascending: true
      });
      if (error) throw error;
      return data as BibliotecaItem[];
    },
    staleTime: 1000 * 60 * 60, // 1 hora
    gcTime: 1000 * 60 * 60 * 24, // 24 horas
  });

  // Agrupar por área com useMemo e limitar para carrossel
  const areaGroups = useMemo(() => {
    return items?.reduce((acc, item) => {
      const area = item.Área || "Sem Área";
      if (!acc[area]) {
        acc[area] = {
          capa: item["Capa-area"],
          livros: [],
          livrosCarrossel: []
        };
      }
      acc[area].livros.push(item);
      return acc;
    }, {} as Record<string, {
      capa: string | null;
      livros: BibliotecaItem[];
      livrosCarrossel: BibliotecaItem[];
    }>);
  }, [items]);

  // Criar versão limitada para carrosséis (performance)
  const areaGroupsWithLimit = useMemo(() => {
    if (!areaGroups) return areaGroups;
    
    const limited = { ...areaGroups };
    Object.keys(limited).forEach(area => {
      limited[area] = {
        ...limited[area],
        livrosCarrossel: limited[area].livros.slice(0, 20) // Apenas primeiros 20
      };
    });
    return limited;
  }, [areaGroups]);

  // Filtrar áreas e livros com useMemo (usando debounced search)
  const areasFiltradas = useMemo(() => {
    if (!areaGroupsWithLimit) return [];
    
    const searchLower = debouncedSearch.toLowerCase();
    
    return Object.entries(areaGroupsWithLimit)
      .map(([area, data]) => {
        const livrosFiltrados = data.livros.filter(livro =>
          (livro.Tema?.toLowerCase() || '').includes(searchLower)
        );
        
        const incluirArea = 
          area.toLowerCase().includes(searchLower) ||
          livrosFiltrados.length > 0;
        
        return incluirArea 
          ? [area, { 
              ...data, 
              livros: debouncedSearch ? livrosFiltrados : data.livros,
              livrosCarrossel: debouncedSearch ? livrosFiltrados.slice(0, 20) : data.livrosCarrossel
            }] as const
          : null;
      })
      .filter((item): item is [string, typeof areaGroupsWithLimit[string]] => item !== null)
      .sort(([a], [b]) => a.localeCompare(b, 'pt-BR'));
  }, [areaGroupsWithLimit, debouncedSearch]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>;
  }

  // Mostrar tela de introdução primeiro
  if (mostrarIntro && capa) {
    return (
      <BibliotecaIntro
        titulo="Biblioteca da OAB"
        sobre={capa.sobre || "Explore uma coleção completa de livros relacionados à Ordem dos Advogados do Brasil, incluindo manuais, guias práticos e materiais essenciais para sua carreira na advocacia."}
        capaUrl={capa.capa}
        totalLivros={items?.length}
        onAcessar={() => setMostrarIntro(false)}
      />
    );
  }

  // Se uma área foi selecionada, mostrar os livros dessa área
  if (selectedArea && areaGroups) {
    const areaData = areaGroups[selectedArea];
    const livrosFiltrados = areaData.livros.filter(livro => 
      (livro.Tema || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    return <div className="px-3 py-4 max-w-4xl mx-auto pb-20 animate-fade-in">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => {
          setSelectedArea(null);
          setSearchTerm("");
        }} className="mb-4">
            ← Voltar às Áreas
          </Button>
          <h1 className="text-xl md:text-2xl font-bold mb-1">{selectedArea}</h1>
          <p className="text-sm text-muted-foreground">
            {areaData.livros.length} {areaData.livros.length === 1 ? "livro disponível" : "livros disponíveis"}
          </p>
        </div>

        {/* Barra de Pesquisa de Livros */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input placeholder="Buscar livro..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="text-base" />
              <Button variant="outline" size="icon" className="shrink-0">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {livrosFiltrados.map((livro, idx) => <LivroCard key={idx} titulo={livro.Tema || "Sem título"} subtitulo={selectedArea} capaUrl={livro["Capa-livro"]} sobre={livro.Sobre} onClick={() => navigate(`/biblioteca-oab/${livro.id}`)} />)}
        </div>
      </div>;
  }

  // Mostrar tela principal com carrosséis
  return (
    <div className="min-h-screen pb-20">
      {/* Header com Capa */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        {capa?.capa && (
          <img src={capa.capa} alt="Biblioteca da OAB" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/80" />
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="absolute top-4 left-4 text-white hover:bg-white/20 z-10">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="absolute bottom-6 left-6 right-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/90 rounded-lg">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Biblioteca da OAB</h1>
              <p className="text-sm text-white/90 mt-1">Explore livros por área do Direito</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-2 py-6 max-w-7xl mx-auto animate-fade-in">
        <Card className="mb-6 mx-1">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input placeholder="Buscar área ou livro..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="text-base" />
              <Button variant="outline" size="icon" className="shrink-0">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          {areasFiltradas.length > 0 ? (
            areasFiltradas.map(([area, data]) => (
              <AreaLivrosCarousel 
                key={area} 
                area={area} 
                livros={debouncedSearch ? data.livros : data.livrosCarrossel}
                totalLivros={data.livros.length}
                onVerTodos={(area) => setSelectedArea(area)} 
                onLivroClick={(id) => navigate(`/biblioteca-oab/${id}`)} 
              />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum resultado encontrado para "{debouncedSearch}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default BibliotecaOAB;