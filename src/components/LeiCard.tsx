import { Calendar, Scale, FileText, ExternalLink, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LeiCardProps {
  id_norma: string;
  tipo: string;
  numero: string;
  ano: string;
  titulo_gerado_ia: string;
  data_publicacao: string;
  autoridade: string;
  codigo_relacionado?: string;
  onClick: () => void;
}

const LeiCard = ({
  tipo,
  numero,
  ano,
  titulo_gerado_ia,
  data_publicacao,
  autoridade,
  codigo_relacionado,
  onClick
}: LeiCardProps) => {
  
  const formatarData = (data: string) => {
    try {
      return format(new Date(data), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return data;
    }
  };

  const getBadgeColor = () => {
    if (tipo.includes('Lei')) return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    if (tipo.includes('Decreto')) return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    if (tipo.includes('Medida')) return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    return 'bg-accent/10 text-accent border-accent/20';
  };

  const isNova = () => {
    const dataLei = new Date(data_publicacao);
    const hoje = new Date();
    const diffDias = Math.floor((hoje.getTime() - dataLei.getTime()) / (1000 * 60 * 60 * 24));
    return diffDias <= 7;
  };

  return (
    <Card 
      className="cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg border border-border/50 bg-card"
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header com badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={getBadgeColor()}>
              {tipo}
            </Badge>
            {isNova() && (
              <Badge className="bg-accent text-accent-foreground animate-pulse">
                NOVA
              </Badge>
            )}
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </div>

        {/* Número da lei */}
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-accent flex-shrink-0" />
          <span className="font-bold text-foreground text-lg">
            {tipo.split(' ')[0]} nº {numero}/{ano}
          </span>
        </div>

        {/* Título gerado por IA */}
        <h3 className="text-base font-semibold text-foreground leading-tight line-clamp-2">
          {titulo_gerado_ia}
        </h3>

        {/* Informações adicionais */}
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{formatarData(data_publicacao)}</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            <span>{autoridade}</span>
          </div>

          {codigo_relacionado && codigo_relacionado !== 'Outro' && (
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              <span className="text-accent font-medium">{codigo_relacionado}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LeiCard;