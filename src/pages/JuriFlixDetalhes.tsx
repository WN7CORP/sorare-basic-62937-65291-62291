import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, Play, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { JuriFlixTitulo } from "@/types/database.types";

const JuriFlixDetalhes = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: titulo, isLoading } = useQuery({
    queryKey: ["juriflix-detalhe", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("JURIFLIX" as any)
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as unknown as JuriFlixTitulo;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-accent"></div>
      </div>
    );
  }

  if (!titulo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <p className="text-muted-foreground mb-4">Título não encontrado</p>
        <Button onClick={() => navigate("/juriflix")}>Voltar para JuriFlix</Button>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Header com Capa */}
      <div className="relative">
        <div
          className="h-[300px] md:h-[400px] bg-cover bg-center"
          style={{
            backgroundImage: `url(${titulo.capa})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 -mt-20">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-48 h-72 rounded-lg overflow-hidden shrink-0 bg-secondary shadow-xl">
              <img
                src={titulo.capa}
                alt={titulo.nome}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <Badge className="mb-2">{titulo.tipo}</Badge>
              <h1 className="text-3xl font-bold mb-3">{titulo.nome}</h1>
              <div className="flex items-center gap-4 mb-4 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{titulo.nota}</span>
                </div>
                <span>{titulo.ano}</span>
                {titulo.plataforma && (
                  <Badge variant="outline">{titulo.plataforma}</Badge>
                )}
              </div>
              <div className="flex gap-3">
                {titulo.link && (
                  <Button asChild>
                    <a href={titulo.link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Assistir na {titulo.plataforma}
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-4xl mx-auto px-4 mt-8 space-y-8">
        {/* Sinopse */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-3">Sinopse</h2>
          <p className="text-muted-foreground leading-relaxed">{titulo.sinopse}</p>
        </Card>

        {/* Benefícios Acadêmicos */}
        {titulo.beneficios && (
          <Card className="p-6 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
            <h2 className="text-xl font-bold mb-3 text-accent">
              Por que assistir? 🎓
            </h2>
            <p className="leading-relaxed">{titulo.beneficios}</p>
          </Card>
        )}

        {/* Trailer */}
        {titulo.trailer && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Trailer</h2>
            <div className="aspect-video rounded-lg overflow-hidden bg-secondary">
              <iframe
                width="100%"
                height="100%"
                src={titulo.trailer}
                title="Trailer"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default JuriFlixDetalhes;
