import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy, TrendingUp, Eye, ChevronRight, Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface RankedArticle {
  id: number;
  "Número do Artigo": string;
  Artigo: string;
  visualizacoes: number;
  ultima_visualizacao: string | null;
}

interface VadeMecumRankingProps {
  tableName: string;
  codigoNome: string;
  onArticleClick: (numeroArtigo: string) => void;
}

export const VadeMecumRanking = ({ tableName, codigoNome, onArticleClick }: VadeMecumRankingProps) => {
  const [period, setPeriod] = useState<'all' | '30days' | '7days'>('all');

  const { data: rankedArticles = [], isLoading } = useQuery({
    queryKey: ['ranking-artigos', tableName, period],
    queryFn: async () => {
      try {
        // Buscar visualizações agrupadas por artigo
        let visualizacoesQuery = supabase
          .from('artigos_visualizacoes')
          .select('numero_artigo, visualizado_em')
          .eq('tabela_codigo', tableName);

        // Filtrar por período
        if (period === '30days') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          visualizacoesQuery = visualizacoesQuery.gte('visualizado_em', thirtyDaysAgo.toISOString());
        } else if (period === '7days') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          visualizacoesQuery = visualizacoesQuery.gte('visualizado_em', sevenDaysAgo.toISOString());
        }

        const { data: visualizacoes, error: visError } = await visualizacoesQuery;

        if (visError) throw visError;
        if (!visualizacoes || visualizacoes.length === 0) return [];

        // Agrupar e contar visualizações por artigo
        const contagem = visualizacoes.reduce((acc, vis) => {
          const num = vis.numero_artigo;
          if (!acc[num]) {
            acc[num] = {
              count: 0,
              ultimaVis: vis.visualizado_em
            };
          }
          acc[num].count++;
          if (new Date(vis.visualizado_em) > new Date(acc[num].ultimaVis)) {
            acc[num].ultimaVis = vis.visualizado_em;
          }
          return acc;
        }, {} as Record<string, { count: number; ultimaVis: string }>);

        // Ordenar por número de visualizações
        const artigosOrdenados = Object.entries(contagem)
          .sort(([, a], [, b]) => b.count - a.count)
          .slice(0, 50)
          .map(([numero, data]) => ({ numero, ...data }));

        if (artigosOrdenados.length === 0) return [];

        // Buscar dados completos dos artigos
        const numerosArtigos = artigosOrdenados.map(a => a.numero);
        const { data: artigos, error: artError } = await supabase
          .from(tableName as any)
          .select('id, "Número do Artigo", Artigo')
          .in('Número do Artigo', numerosArtigos);

        if (artError) throw artError;
        if (!artigos) return [];

        // Combinar dados
        const artigosData = artigos as any[];
        const resultado = artigosOrdenados
          .map(item => {
            const artigo = artigosData.find(a => a["Número do Artigo"] === item.numero);
            if (!artigo) return null;
            return {
              id: artigo.id,
              "Número do Artigo": artigo["Número do Artigo"],
              Artigo: artigo.Artigo,
              visualizacoes: item.count,
              ultima_visualizacao: item.ultimaVis
            };
          })
          .filter((item): item is RankedArticle => item !== null);

        return resultado;
      } catch (error) {
        console.error('Erro na query de ranking:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // Cache de 5 minutos
  });

  const getMedalIcon = (position: number) => {
    if (position === 1) return <span className="text-2xl">🥇</span>;
    if (position === 2) return <span className="text-2xl">🥈</span>;
    if (position === 3) return <span className="text-2xl">🥉</span>;
    return null;
  };

  const isHot = (article: RankedArticle) => {
    if (!article.ultima_visualizacao) return false;
    const lastView = new Date(article.ultima_visualizacao);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    return lastView > twoDaysAgo;
  };

  if (isLoading) {
    return (
      <div className="space-y-4 pb-24">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (rankedArticles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <Trophy className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Nenhuma visualização registrada
        </h3>
        <p className="text-muted-foreground text-center max-w-md">
          Os artigos mais visualizados aparecerão aqui conforme você navega pelo código.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header com filtros */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-6 h-6 text-accent" />
          <h2 className="text-2xl font-bold text-foreground">
            Artigos Mais Vistos
          </h2>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={period === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('all')}
            className="whitespace-nowrap"
          >
            Todos os tempos
          </Button>
          <Button
            variant={period === '30days' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('30days')}
            className="whitespace-nowrap"
          >
            Últimos 30 dias
          </Button>
          <Button
            variant={period === '7days' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('7days')}
            className="whitespace-nowrap"
          >
            Últimos 7 dias
          </Button>
        </div>
      </div>

      {/* Lista de artigos ranqueados */}
      <div className="grid gap-3">
        {rankedArticles.map((article, index) => {
          const position = index + 1;
          const maxViews = rankedArticles[0]?.visualizacoes || 1;
          const percentage = (article.visualizacoes / maxViews) * 100;

          return (
            <Card
              key={article.id}
              className="p-4 transition-all duration-300 cursor-pointer hover:shadow-lg hover:border-accent/50 group"
              onClick={() => onArticleClick(article["Número do Artigo"])}
            >
              <div className="flex items-center gap-4">
                {/* Posição / Medalha */}
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                  {getMedalIcon(position) || (
                    <span className="text-2xl font-bold text-muted-foreground">
                      {position}
                    </span>
                  )}
                </div>

                {/* Informações do artigo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-accent transition-colors">
                      Art. {article["Número do Artigo"]}
                    </h3>
                    {isHot(article) && (
                      <div className="flex items-center gap-1 text-orange-500">
                        <Flame className="w-4 h-4 animate-pulse" />
                        <span className="text-xs font-medium">Em alta</span>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {article.Artigo.substring(0, 120)}
                    {article.Artigo.length > 120 ? '...' : ''}
                  </p>

                  {/* Barra de progresso */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all duration-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Eye className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {article.visualizacoes.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Seta */}
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors flex-shrink-0" />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
