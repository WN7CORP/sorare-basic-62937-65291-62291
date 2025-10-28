import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";

interface RankingCardProps {
  posicao: number;
  deputado: {
    id: number;
    nome: string;
    siglaPartido: string;
    siglaUf: string;
    urlFoto?: string;
  };
  metrica: number | string;
  metricaLabel: string;
  onClick?: () => void;
}

export const RankingCard = ({ posicao, deputado, metrica, metricaLabel, onClick }: RankingCardProps) => {
  const getMedalha = () => {
    if (posicao === 1) return { icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-500/20" };
    if (posicao === 2) return { icon: Medal, color: "text-gray-400", bg: "bg-gray-400/20" };
    if (posicao === 3) return { icon: Award, color: "text-orange-500", bg: "bg-orange-500/20" };
    return null;
  };

  const medalha = getMedalha();

  return (
    <Card
      className="cursor-pointer hover:scale-102 hover:shadow-lg transition-all border-2 border-transparent hover:border-primary/50"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex gap-4 items-center">
          <div className="relative">
            {medalha && (
              <div className={`absolute -top-2 -left-2 ${medalha.bg} rounded-full p-1 z-10`}>
                <medalha.icon className={`w-4 h-4 ${medalha.color}`} />
              </div>
            )}
            {deputado.urlFoto ? (
              <img
                src={deputado.urlFoto}
                alt={deputado.nome}
                className="w-16 h-16 rounded-full object-cover border-2 border-border"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold">
                {posicao}
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="shrink-0">
                #{posicao}
              </Badge>
              <h3 className="font-bold text-sm truncate">
                {deputado.nome}
              </h3>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-xs font-medium">
                {deputado.siglaPartido}
              </span>
              <span className="px-2 py-0.5 bg-secondary/20 text-secondary-foreground rounded text-xs font-medium">
                {deputado.siglaUf}
              </span>
            </div>
            
            <div className="text-sm">
              <span className="font-bold text-primary text-lg">{typeof metrica === 'number' ? metrica : metricaLabel}</span>
              {typeof metrica === 'number' && (
                <span className="text-muted-foreground ml-1">{metricaLabel}</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
