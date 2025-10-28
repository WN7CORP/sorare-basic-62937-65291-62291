import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Film, Play, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import useEmblaCarousel from "embla-carousel-react";
import { JuriFlixTitulo } from "@/types/database.types";

const JuriFlix = () => {
  const navigate = useNavigate();
  const [emblaRefFilmes] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps", dragFree: true });
  const [emblaRefSeries] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps", dragFree: true });
  const [emblaRefDocumentarios] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps", dragFree: true });

  const { data: titulos, isLoading } = useQuery({
    queryKey: ["juriflix"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("JURIFLIX" as any)
        .select("*")
        .order("nota", { ascending: false });

      if (error) throw error;
      return data as unknown as JuriFlixTitulo[];
    },
  });

  const destaque = titulos?.[0];
  const filmes = titulos?.filter((t) => t.tipo?.toLowerCase().includes("filme"));
  const series = titulos?.filter((t) => t.tipo?.toLowerCase().includes("série"));
  const documentarios = titulos?.filter((t) => t.tipo?.toLowerCase().includes("documentário"));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-accent"></div>
      </div>
    );
  }

  const TituloCard = ({ titulo }: { titulo: JuriFlixTitulo }) => (
    <div
      className="flex-[0_0_140px] cursor-pointer group"
      onClick={() => navigate(`/juriflix/${titulo.id}`)}
    >
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-secondary mb-2">
        {titulo.capa ? (
          <img
            src={titulo.capa}
            alt={titulo.nome}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-2 left-2 right-2">
            <div className="flex items-center gap-1 text-xs text-white mb-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>{titulo.nota}</span>
            </div>
            <p className="text-xs text-white/90 line-clamp-2">{titulo.sinopse}</p>
          </div>
        </div>
        <Badge className="absolute top-2 left-2 text-xs" variant="secondary">
          {titulo.tipo}
        </Badge>
      </div>
      <h3 className="font-medium text-sm line-clamp-2">{titulo.nome}</h3>
      <p className="text-xs text-muted-foreground">{titulo.ano}</p>
    </div>
  );

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

      {/* Seções por Categoria */}
      <div className="max-w-4xl mx-auto px-3 py-6 space-y-8">
        {/* Filmes */}
        {filmes && filmes.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Filmes Jurídicos</h2>
            <div className="overflow-hidden" ref={emblaRefFilmes}>
              <div className="flex gap-3">
                {filmes.map((titulo) => (
                  <TituloCard key={titulo.id} titulo={titulo} />
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
                {series.map((titulo) => (
                  <TituloCard key={titulo.id} titulo={titulo} />
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
                {documentarios.map((titulo) => (
                  <TituloCard key={titulo.id} titulo={titulo} />
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
