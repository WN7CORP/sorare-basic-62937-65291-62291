import { useNavigate } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowRight } from "lucide-react";

interface CapaBiblioteca {
  Biblioteca: string | null;
  capa: string | null;
}

const BibliotecasCarousel = () => {
  const navigate = useNavigate();
  const [emblaRef] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true
  });

  const { data: capas, isLoading } = useQuery({
    queryKey: ["capas-biblioteca"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("CAPA-BIBILIOTECA")
        .select("*");

      if (error) throw error;
      return data as any as CapaBiblioteca[];
    },
  });

  const normalize = (s: string) =>
    s
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .trim();

  const getCapaUrl = (bibliotecaName: string) => {
    const target = normalize(bibliotecaName);
    const match = capas?.find(
      (c) => c.Biblioteca && normalize(c.Biblioteca) === target
    ) || capas?.find(
      (c) => c.Biblioteca && normalize(c.Biblioteca).includes(target)
    ) || capas?.find(
      (c) => c.Biblioteca && target.includes(normalize(c.Biblioteca))
    );
    return match?.capa || null;
  };

  const bibliotecas = [
    {
      title: "Biblioteca de Estudos",
      path: "/biblioteca-estudos",
      bibliotecaName: "Biblioteca de Estudos",
    },
    {
      title: "Biblioteca Clássicos",
      path: "/biblioteca-classicos",
      bibliotecaName: "Biblioteca Clássicos",
    },
    {
      title: "Biblioteca da OAB",
      path: "/biblioteca-oab",
      bibliotecaName: "Biblioteca da OAB",
    },
    {
      title: "Biblioteca de Oratória",
      path: "/biblioteca-oratoria",
      bibliotecaName: "Biblioteca de Oratória",
    },
    {
      title: "Biblioteca de Liderança",
      path: "/biblioteca-lideranca",
      bibliotecaName: "Biblioteca de Liderança",
    },
    {
      title: "Biblioteca Fora da Toga",
      path: "/biblioteca-fora-da-toga",
      bibliotecaName: "Biblioteca Fora da Toga",
    }
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 md:w-5 md:h-5 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden" ref={emblaRef}>
      <div className="flex gap-4 md:gap-5">
        {bibliotecas.map((biblioteca) => {
          const capaUrl = getCapaUrl(biblioteca.bibliotecaName);
          
          return (
            <button
              key={biblioteca.path}
              onClick={() => navigate(biblioteca.path)}
              className="flex-[0_0_80%] md:flex-[0_0_55%] lg:flex-[0_0_25%] min-w-0 bg-card rounded-2xl overflow-hidden text-left transition-all hover:scale-[1.02] hover:shadow-2xl group shadow-xl"
            >
              <div className="aspect-[16/10] relative bg-gradient-to-br from-accent/20 to-accent/5">
                {capaUrl ? (
                  <img
                    src={capaUrl}
                    alt={biblioteca.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/20 to-accent/5">
                    <span className="text-5xl">📚</span>
                  </div>
                )}
                
                {/* Gradient overlay de baixo para cima */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                
                {/* Botão Acessar no topo direito */}
                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full flex items-center gap-2 font-semibold text-sm shadow-lg group-hover:bg-white/30 transition-colors border border-white/30">
                  Acessar
                  <ArrowRight className="w-4 h-4" />
                </div>
                
                {/* Título em negrito embaixo */}
                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-4">
                  <h3 className="text-xl md:text-lg font-bold text-white drop-shadow-2xl leading-tight">
                    {biblioteca.title}
                  </h3>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BibliotecasCarousel;
