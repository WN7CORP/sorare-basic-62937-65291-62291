import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, BookOpen, ArrowLeft } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { BibliotecaIntro } from "@/components/BibliotecaIntro";
import { LivroCard } from "@/components/LivroCard";
import { AreaLivrosCarousel } from "@/components/AreaLivrosCarousel";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
const BibliotecaEstudos = () => {
  const navigate = useNavigate();
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [mostrarIntro, setMostrarIntro] = useState(true);

  const { data: capa } = useQuery({
    queryKey: ["capa-biblioteca-estudos"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("CAPA-BIBILIOTECA")
        .select("*")
        .eq("Biblioteca", "Biblioteca de Estudos")
        .single();

      if (error) throw error;
      return data;
    },
  });

  const {
    data: items,
    isLoading
  } = useQuery({
    queryKey: ["biblioteca-estudos"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("BIBLIOTECA-ESTUDOS").select("*").order("Ordem", {
        ascending: true
      });
      if (error) throw error;
      return data as BibliotecaItem[];
    }
  });

  // Agrupar por área com useMemo para otimização
  const areaGroups = useMemo(() => {
    return items?.reduce((acc, item) => {
      const area = item.Área || "Sem Área";
      if (!acc[area]) {
        acc[area] = {
          capa: item["Capa-area"],
          livros: []
        };
      }
      acc[area].livros.push(item);
      return acc;
    }, {} as Record<string, {
      capa: string | null;
      livros: BibliotecaItem[];
    }>);
  }, [items]);

  // Função para remover acentuação
  const removerAcentuacao = (texto: string) => {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  // Filtrar áreas e livros com useMemo - DEVE vir ANTES dos returns condicionais
  const areasFiltradas = useMemo(() => {
    if (!areaGroups) return [];
    
    const searchLower = removerAcentuacao(searchTerm.toLowerCase());
    
    return Object.entries(areaGroups)
      .map(([area, data]) => {
        // Filtrar livros que correspondem à busca (sem acentuação)
        const livrosFiltrados = data.livros.filter(livro =>
          removerAcentuacao(livro.Tema?.toLowerCase() || '').includes(searchLower)
        );
        
        // Incluir área se nome da área OU algum livro corresponder (sem acentuação)
        const incluirArea = 
          removerAcentuacao(area.toLowerCase()).includes(searchLower) ||
          livrosFiltrados.length > 0;
        
        return incluirArea 
          ? [area, { ...data, livros: searchTerm ? livrosFiltrados : data.livros }] as const
          : null;
      })
      .filter((item): item is [string, typeof areaGroups[string]] => item !== null)
      .sort(([a], [b]) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
  }, [areaGroups, searchTerm]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>;
  }

  // Mostrar tela de introdução primeiro
  if (mostrarIntro && capa) {
    return (
      <BibliotecaIntro
        titulo="Biblioteca de Estudos"
        sobre={capa.sobre || "Explore uma vasta coleção de livros organizados por área do Direito. Encontre materiais de estudo essenciais para sua formação jurídica, desde conceitos fundamentais até tópicos avançados. Nossa biblioteca digital oferece acesso rápido e fácil aos melhores conteúdos para estudantes, professores e profissionais do Direito."}
        capaUrl={capa.capa}
        onAcessar={() => setMostrarIntro(false)}
      />
    );
  }

  // Se uma área foi selecionada, mostrar os livros dessa área
  if (selectedArea && areaGroups) {
    const areaData = areaGroups[selectedArea];
    const livrosFiltrados = areaData.livros.filter(livro => 
      removerAcentuacao((livro.Tema || "").toLowerCase()).includes(removerAcentuacao(searchTerm.toLowerCase()))
    );
    return <div className="px-3 py-4 max-w-4xl mx-auto pb-20 animate-fade-in">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => {
              setSelectedArea(null);
              setSearchTerm("");
            }} 
            className="mb-4"
          >
            ← Voltar
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
          {livrosFiltrados.map((livro, idx) => <LivroCard key={idx} titulo={livro.Tema || "Sem título"} subtitulo={selectedArea} capaUrl={livro["Capa-livro"]} sobre={livro.Sobre} onClick={() => navigate(`/biblioteca-estudos/${livro.id}`)} />)}
        </div>
      </div>;
  }

  // Mostrar tela principal com carrosséis de todas as áreas
  return (
    <div className="min-h-screen pb-20">
      {/* Header com Capa */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        {/* Imagem de fundo */}
        {capa?.capa && (
          <img
            src={capa.capa}
            alt="Biblioteca de Estudos"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        
        {/* Gradiente escuro para legibilidade */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/80" />
        
        {/* Botão Voltar */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 text-white hover:bg-white/20 z-10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        {/* Conteúdo sobre a imagem */}
        <div className="absolute bottom-6 left-6 right-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/90 rounded-lg">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Biblioteca de Estudos</h1>
              <p className="text-sm text-white/90 mt-1">
                Explore livros por área do Direito
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="px-2 py-6 max-w-7xl mx-auto animate-fade-in">
        {/* Barra de Pesquisa Global */}
        <Card className="mb-6 mx-1">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input 
                placeholder="Buscar área ou livro..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="text-base" 
              />
              <Button variant="outline" size="icon" className="shrink-0">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de seções com carrosséis */}
        <div className="space-y-8">
          {areasFiltradas.length > 0 ? (
            areasFiltradas.map(([area, data]) => (
              <AreaLivrosCarousel
                key={area}
                area={area}
                livros={data.livros}
                onVerTodos={(area) => setSelectedArea(area)}
                onLivroClick={(id) => navigate(`/biblioteca-estudos/${id}`)}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Nenhum resultado encontrado para "{searchTerm}"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default BibliotecaEstudos;