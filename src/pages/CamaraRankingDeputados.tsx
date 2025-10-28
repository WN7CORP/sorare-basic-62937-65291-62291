import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ContentGenerationLoader } from "@/components/ContentGenerationLoader";
import { RankingCard } from "@/components/RankingCard";
import { ArrowLeft, Trophy, FileText, Calendar, Users, DollarSign } from "lucide-react";
import { toast } from "sonner";

export default function CamaraRankingDeputados() {
  const { tipo } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState<any[]>([]);

  const tipoConfig = {
    despesas: {
      titulo: "Gastos Parlamentares",
      descricao: "Deputados que mais gastaram cota parlamentar no mês atual",
      icon: DollarSign,
      metricaKey: "totalGasto",
      metricaLabel: "gastos",
      metricaFormat: (valor: number) => `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    },
    proposicoes: {
      titulo: "Produtividade Legislativa",
      descricao: "Deputados que mais apresentaram proposições no ano atual",
      icon: FileText,
      metricaKey: "totalProposicoes",
      metricaLabel: "proposições",
      metricaFormat: (valor: number) => valor.toString(),
    },
    presenca: {
      titulo: "Presença e Assiduidade",
      descricao: "Deputados com maior participação em eventos nos últimos 30 dias",
      icon: Calendar,
      metricaKey: "totalEventos",
      metricaLabel: "eventos",
      metricaFormat: (valor: number) => valor.toString(),
    },
    comissoes: {
      titulo: "Atuação em Comissões",
      descricao: "Deputados mais ativos em órgãos e comissões",
      icon: Users,
      metricaKey: "totalOrgaos",
      metricaLabel: "comissões",
      metricaFormat: (valor: number) => valor.toString(),
    },
  };

  const config = tipoConfig[tipo as keyof typeof tipoConfig] as {
    titulo: string;
    descricao: string;
    icon: any;
    metricaKey: string;
    metricaLabel: string;
    metricaFormat: (valor: number) => string;
  };

  useEffect(() => {
    if (tipo && config) {
      buscarRanking();
    }
  }, [tipo]);

  const buscarRanking = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('buscar-ranking-deputados', {
        body: { tipo, limite: 100 }
      });

      if (error) throw error;

      setRanking(data.ranking || []);
    } catch (error) {
      console.error('Erro ao buscar ranking:', error);
      toast.error('Erro ao carregar ranking');
    } finally {
      setLoading(false);
    }
  };

  if (!config) {
    return (
      <div className="container mx-auto px-4 py-6 pb-20">
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">Tipo de ranking inválido</p>
          <Button onClick={() => navigate('/camara-deputados/rankings')} className="mt-4">
            Ver Rankings
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 pb-20">
        <ContentGenerationLoader message="Carregando ranking..." />
      </div>
    );
  }

  const Icon = config.icon;

  return (
    <div className="container mx-auto px-4 py-6 pb-20">
      <Button
        variant="ghost"
        onClick={() => navigate('/camara-deputados/rankings')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <Card className="p-6 mb-6 bg-gradient-to-br from-gray-900/95 to-gray-800/95 border-2 border-primary/50">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg bg-primary shadow-lg flex items-center justify-center">
            <Icon className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{config.titulo}</h1>
            <p className="text-muted-foreground">{config.descricao}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Top {ranking.length} deputados
            </p>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {ranking.map((deputado, index) => (
          <RankingCard
            key={deputado.id}
            posicao={index + 1}
            deputado={deputado}
            metrica={deputado[config.metricaKey] || 0}
            metricaLabel={config.metricaFormat ? config.metricaFormat(deputado[config.metricaKey] || 0) : `${deputado[config.metricaKey] || 0} ${config.metricaLabel}`}
            onClick={() => navigate(`/camara-deputados/deputado/${deputado.id}`)}
          />
        ))}
      </div>

      {ranking.length === 0 && (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">
            Nenhum dado disponível para este ranking
          </p>
        </Card>
      )}
    </div>
  );
}
