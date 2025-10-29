import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MeuBrasilCardProps {
  titulo: string;
  imagemUrl?: string;
  subtitulo?: string;
  ano?: string | number;
  tags?: { label: string; variant?: "default" | "secondary" | "destructive" | "outline" }[];
  onClick: () => void;
  className?: string;
}

export const MeuBrasilCard = ({ 
  titulo, 
  imagemUrl, 
  subtitulo, 
  ano,
  tags = [], 
  onClick,
  className = ""
}: MeuBrasilCardProps) => {
  return (
    <Card
      onClick={onClick}
      className={`group cursor-pointer overflow-hidden border border-border bg-card hover:border-primary hover:shadow-xl transition-all duration-300 hover:scale-[1.02] ${className}`}
    >
      {/* Imagem de capa */}
      {imagemUrl && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={imagemUrl}
            alt={titulo}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      )}
      
      {/* Conteúdo */}
      <div className="p-4 space-y-3">
        {/* Título */}
        <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
          {titulo}
        </h3>
        
        {/* Subtítulo */}
        {subtitulo && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {subtitulo}
          </p>
        )}
        
        {/* Footer com tags e ano */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {tags.map((tag, i) => (
              <Badge key={i} variant={tag.variant || "secondary"} className="text-xs">
                {tag.label}
              </Badge>
            ))}
          </div>
          
          {ano && (
            <span className="text-xs text-muted-foreground">
              📅 {ano}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};
