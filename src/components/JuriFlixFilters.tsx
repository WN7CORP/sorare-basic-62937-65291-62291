import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { X } from "lucide-react";

interface JuriFlixFiltersProps {
  selectedGenres: string[];
  onGenreToggle: (genre: string) => void;
  decadeRange: [number, number];
  onDecadeChange: (range: [number, number]) => void;
  minRating: number;
  onRatingChange: (rating: number) => void;
  onClearFilters: () => void;
}

const GENRES = [
  "Drama",
  "Crime",
  "Thriller",
  "Documentário",
  "Biografia",
  "História",
  "Ação",
  "Mistério"
];

const DECADES = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];

export const JuriFlixFilters = ({
  selectedGenres,
  onGenreToggle,
  decadeRange,
  onDecadeChange,
  minRating,
  onRatingChange,
  onClearFilters
}: JuriFlixFiltersProps) => {
  const hasActiveFilters = selectedGenres.length > 0 || 
    decadeRange[0] !== DECADES[0] || 
    decadeRange[1] !== DECADES[DECADES.length - 1] ||
    minRating > 0;

  return (
    <div className="space-y-6 p-4 bg-card rounded-lg border">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Filtros</h3>
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onClearFilters}
            className="h-8 gap-2"
          >
            <X className="w-4 h-4" />
            Limpar
          </Button>
        )}
      </div>

      {/* Gêneros */}
      <div>
        <label className="text-sm font-medium mb-3 block">Gêneros</label>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((genre) => (
            <Badge
              key={genre}
              variant={selectedGenres.includes(genre) ? "default" : "outline"}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onGenreToggle(genre)}
            >
              {genre}
            </Badge>
          ))}
        </div>
      </div>

      {/* Década */}
      <div>
        <label className="text-sm font-medium mb-3 block">
          Década: {decadeRange[0]}s - {decadeRange[1]}s
        </label>
        <Slider
          min={DECADES[0]}
          max={DECADES[DECADES.length - 1]}
          step={10}
          value={decadeRange}
          onValueChange={(value) => onDecadeChange(value as [number, number])}
          className="w-full"
        />
      </div>

      {/* Avaliação Mínima */}
      <div>
        <label className="text-sm font-medium mb-3 block">
          Nota mínima: {minRating > 0 ? minRating.toFixed(1) : "Qualquer"}
        </label>
        <Slider
          min={0}
          max={10}
          step={0.5}
          value={[minRating]}
          onValueChange={(value) => onRatingChange(value[0])}
          className="w-full"
        />
      </div>
    </div>
  );
};