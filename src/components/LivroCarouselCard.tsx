import { Card } from "@/components/ui/card";

interface LivroCarouselCardProps {
  titulo: string;
  capaUrl: string | null;
  onClick: () => void;
}

export const LivroCarouselCard = ({ titulo, capaUrl, onClick }: LivroCarouselCardProps) => {
  return (
    <Card
      onClick={onClick}
      className="relative flex-[0_0_40%] md:flex-[0_0_30%] lg:flex-[0_0_20%] cursor-pointer overflow-hidden rounded-xl shadow-2xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:scale-105 transition-all duration-300 group"
    >
      {/* Aspect ratio container for book cover */}
      <div className="relative aspect-[2/3] w-full">
        {capaUrl ? (
          <img
            src={capaUrl}
            alt={titulo}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
            <span className="text-4xl">📚</span>
          </div>
        )}
        
        {/* Gradient overlay - dark from bottom fading to transparent top */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        
        {/* Title overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h4 className="text-sm md:text-base font-condensed font-light text-white line-clamp-3 drop-shadow-lg leading-tight tracking-wide">
            {titulo}
          </h4>
        </div>
      </div>
    </Card>
  );
};
