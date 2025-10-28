import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ExternalLink } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NoticiaCardProps {
  id: string;
  titulo: string;
  capa: string;
  portal: string;
  categoria: string;
  dataHora: string;
  onClick: () => void;
}

const NoticiaCard = ({ titulo, capa, portal, categoria, dataHora, onClick }: NoticiaCardProps) => {
  const formatarDataHora = (data: string) => {
    try {
      if (!data) return 'Sem data';
      
      // Se for uma data ISO com hora
      if (data.includes('T')) {
        const date = parseISO(data);
        if (isNaN(date.getTime())) return 'Sem data';
        return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
      }
      
      // Se for uma data com hora no formato brasileiro (dd/MM/yyyy HH:mm)
      if (data.includes('/') && data.includes(':')) {
        return data; // Já está formatado
      }
      
      // Se for apenas data no formato ISO
      if (data.includes('-')) {
        const date = parseISO(data);
        if (isNaN(date.getTime())) return 'Sem data';
        return format(date, "dd/MM/yyyy", { locale: ptBR });
      }
      
      // Se for apenas data no formato brasileiro dd/MM/yyyy
      if (data.includes('/')) {
        return data;
      }
      
      return data;
    } catch {
      return 'Sem data';
    }
  };

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      'Investimentos': 'bg-red-600',
      'Direito': 'bg-red-600',
      'Concurso': 'bg-red-600',
      'Concursos': 'bg-red-600',
      'OAB': 'bg-red-600',
      'Geral': 'bg-red-600',
    };
    return colors[cat] || 'bg-red-600';
  };

  return (
    <Card 
      onClick={onClick}
      className="cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all border border-border hover:border-primary/50 bg-card group overflow-hidden"
    >
      <CardContent className="p-0">
        {/* Imagem de capa - compacta */}
        {capa && (
          <div className="relative w-full h-28 overflow-hidden bg-muted">
            <img
              src={capa}
              alt={titulo}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}
        
        {/* Conteúdo - compacto */}
        <div className="p-2.5 space-y-1.5">
          {/* Categoria */}
          <Badge className={`${getCategoryColor(categoria)} text-white text-[10px] px-1.5 py-0.5`}>
            {categoria}
          </Badge>

          {/* Título - compacto */}
          <h3 className="font-semibold text-xs text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug text-left">
            {titulo}
          </h3>

          {/* Portal e Data/Hora - compactos */}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground gap-1.5">
            <div className="flex items-center gap-1 min-w-0 flex-1">
              <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
              <span className="truncate">{portal}</span>
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <Calendar className="w-2.5 h-2.5" />
              <span className="whitespace-nowrap">{formatarDataHora(dataHora)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NoticiaCard;
