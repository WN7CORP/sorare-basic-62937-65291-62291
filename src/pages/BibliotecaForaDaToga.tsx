import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LivroCard } from "@/components/LivroCard";
import { BibliotecaIntro } from "@/components/BibliotecaIntro";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface BibliotecaItem {
  id: number;
  area: string | null;
  livro: string | null;
  autor: string | null;
  link: string | null;
  "capa-livro": string | null;
  sobre: string | null;
  download: string | null;
  "capa-area": string | null;
}

const BibliotecaForaDaToga = () => {
  const navigate = useNavigate();
  const [mostrarIntro, setMostrarIntro] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: capa } = useQuery({
    queryKey: ["capa-biblioteca-fora-da-toga"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("CAPA-BIBILIOTECA")
        .select("*")
        .eq("Biblioteca", "Biblioteca Fora da Toga")
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ["biblioteca-fora-da-toga"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("BIBLIOTECA-FORA-DA-TOGA")
        .select("*")
        .order("id");

      if (error) throw error;
      return data as any as BibliotecaItem[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (mostrarIntro) {
    return (
      <BibliotecaIntro
        titulo="Biblioteca Fora da Toga"
        sobre="Amplie seus horizontes além do Direito com uma seleção de livros que abordam desenvolvimento pessoal, filosofia de vida, psicologia e autoconhecimento. Esta biblioteca oferece obras inspiradoras para profissionais do Direito que buscam equilíbrio, bem-estar e crescimento pessoal. Descubra novas perspectivas que enriquecerão não apenas sua carreira, mas também sua vida pessoal."
        capaUrl={capa?.capa || null}
        onAcessar={() => setMostrarIntro(false)}
      />
    );
  }

  const livrosFiltrados = items?.filter((livro) =>
    (livro.livro || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (livro.autor || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20 animate-fade-in">
      <Button
        variant="ghost"
        onClick={() => {
          setMostrarIntro(true);
          setSearchTerm("");
        }}
        className="mb-4"
      >
        ← Voltar
      </Button>

      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1">Biblioteca Fora da Toga</h1>
        <p className="text-sm text-muted-foreground">
          {items?.length} {items?.length === 1 ? "livro disponível" : "livros disponíveis"}
        </p>
      </div>

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

      <div className="space-y-4">
        {livrosFiltrados?.map((livro) => (
          <LivroCard
            key={livro.id}
            titulo={livro.livro || "Sem título"}
            autor={livro.autor || undefined}
            capaUrl={livro["capa-livro"]}
            sobre={livro.sobre}
            onClick={() => navigate(`/biblioteca-fora-da-toga/${livro.id}`)}
          />
        ))}
      </div>
    </div>
  );
};

export default BibliotecaForaDaToga;
