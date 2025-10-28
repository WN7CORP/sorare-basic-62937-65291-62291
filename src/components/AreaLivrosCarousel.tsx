import { useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";
import { LivroCarouselCard } from "@/components/LivroCarouselCard";
import { ChevronRight } from "lucide-react";

interface BibliotecaItem {
  id: number;
  Tema: string | null;
  "Capa-livro": string | null;
}

interface AreaLivrosCarouselProps {
  area: string;
  livros: BibliotecaItem[];
  onVerTodos: (area: string) => void;
  onLivroClick: (id: number) => void;
}

export const AreaLivrosCarousel = ({
  area,
  livros,
  onVerTodos,
  onLivroClick,
}: AreaLivrosCarouselProps) => {
  const [emblaRef] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
  });

  return (
    <div className="space-y-3">
      {/* Header with area name and "Ver Todos" button */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg md:text-xl font-bold text-foreground">
          {area}
        </h2>
        <Button
          variant="secondary"
          onClick={() => onVerTodos(area)}
          className="bg-accent/20 hover:bg-accent/30 text-accent font-medium text-sm group shrink-0"
        >
          Ver Todos
          <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>

      {/* Carousel of books */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-3 pl-1">
          {livros.map((livro, index) => (
            <LivroCarouselCard
              key={livro.id}
              titulo={livro.Tema || "Sem título"}
              capaUrl={livro["Capa-livro"]}
              onClick={() => onLivroClick(livro.id)}
              numero={index + 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
