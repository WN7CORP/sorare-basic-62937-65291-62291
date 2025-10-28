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
  imagem: string | null;
  sobre: string | null;
  beneficios: string | null;
  download: string | null;
  "Capa-area": string | null;
}

const BibliotecaOratoria = () => {
  const navigate = useNavigate();
  const [mostrarIntro, setMostrarIntro] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: capa } = useQuery({
    queryKey: ["capa-biblioteca-oratoria"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("CAPA-BIBILIOTECA")
        .select("*")
        .eq("Biblioteca", "Biblioteca de Oratória")
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ["biblioteca-oratoria"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("BIBLIOTECA-ORATORIA")
        .select("*")
        .order("id");

      if (error) throw error;
      return data as BibliotecaItem[];
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
        titulo="Biblioteca de Oratória"
        sobre="Desenvolva suas habilidades de comunicação e oratória com uma seleção de obras especializadas. Esta biblioteca reúne os melhores livros sobre técnicas de discurso, persuasão e comunicação efetiva, essenciais para advogados que desejam aprimorar sua capacidade de argumentação em tribunais, apresentações e negociações. Domine a arte de falar em público e influenciar com propriedade."
        capaUrl={capa?.capa || null}
        onAcessar={() => setMostrarIntro(false)}
      />
    );
  }

  const livrosFiltrados = items?.filter((item) =>
    (item.livro || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.autor || "").toLowerCase().includes(searchTerm.toLowerCase())
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
        <h1 className="text-xl md:text-2xl font-bold mb-1">Biblioteca de Oratória</h1>
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
        {livrosFiltrados?.map((item) => (
          <LivroCard
            key={item.id}
            titulo={item.livro || "Sem título"}
            autor={item.autor || undefined}
            capaUrl={item.imagem}
            sobre={item.sobre}
            onClick={() => navigate(`/biblioteca-oratoria/${item.id}`)}
          />
        ))}
      </div>
    </div>
  );
};

export default BibliotecaOratoria;
