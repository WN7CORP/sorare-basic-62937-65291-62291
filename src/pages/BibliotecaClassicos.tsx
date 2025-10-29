import { useNavigate } from "react-router-dom";
import { Loader2, Search, BookOpen, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LivroCard } from "@/components/LivroCard";
import { BibliotecaIntro } from "@/components/BibliotecaIntro";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
interface BibliotecaItem {
  id: number;
  area: string | null;
  livro: string | null;
  autor: string | null;
  link: string | null;
  imagem: string | null;
  sobre: string | null;
  beneficios: string | null;
  download: string | null;
  "Capa-area": string | null;
}
const BibliotecaClassicos = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [mostrarIntro, setMostrarIntro] = useState(true);
  const {
    data: capa
  } = useQuery({
    queryKey: ["capa-biblioteca-classicos"],
    queryFn: async () => {
      const {
        data,
        error
      } = await (supabase as any).from("CAPA-BIBILIOTECA").select("*").eq("Biblioteca", "Biblioteca Clássicos").single();
      if (error) throw error;
      return data;
    }
  });
  const {
    data: items,
    isLoading
  } = useQuery({
    queryKey: ["biblioteca-classicos"],
    queryFn: async () => {
      const {
        data,
        error
      } = await (supabase as any).from("BIBLIOTECA-CLASSICOS").select("*").order("id");
      if (error) throw error;
      return data as any as BibliotecaItem[];
    }
  });
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  // Mostrar tela de introdução primeiro
  if (mostrarIntro && capa) {
    return (
      <BibliotecaIntro
        titulo="Biblioteca Clássicos"
        sobre={capa.sobre || "Descubra os grandes clássicos da literatura jurídica e geral. Uma seleção especial de obras atemporais que enriquecem seu conhecimento e cultura."}
        capaUrl={capa.capa}
        totalLivros={items?.length}
        onAcessar={() => setMostrarIntro(false)}
      />
    );
  }

  const livrosFiltrados = items?.filter(
    (livro) =>
      (livro.livro || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (livro.autor || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-20">
      {/* Header com Capa */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        {/* Imagem de fundo */}
        {capa?.capa && (
          <img
            src={capa.capa}
            alt="Biblioteca Clássicos"
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
              <h1 className="text-2xl md:text-3xl font-bold">Biblioteca Clássicos</h1>
              <p className="text-sm text-white/90 mt-1">
                {items?.length} {items?.length === 1 ? "livro disponível" : "livros disponíveis"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="px-3 py-6 max-w-4xl mx-auto animate-fade-in">
        {/* Barra de Pesquisa */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Buscar livro..."
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

        {/* Lista de Livros */}
        <div className="space-y-4">
          {livrosFiltrados?.map((livro) => (
            <LivroCard
              key={livro.id}
              titulo={livro.livro || "Sem título"}
              autor={livro.autor || undefined}
              capaUrl={livro.imagem}
              sobre={livro.sobre}
              onClick={() => navigate(`/biblioteca-classicos/${livro.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
export default BibliotecaClassicos;