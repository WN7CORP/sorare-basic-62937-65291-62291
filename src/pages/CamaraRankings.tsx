import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Trophy, 
  FileText, 
  Calendar, 
  Users,
  ArrowLeft,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";

const CamaraRankings = () => {
  const navigate = useNavigate();

  const rankings = [
    {
      id: "despesas",
      titulo: "Gastos Parlamentares",
      descricao: "Deputados que mais gastaram cota parlamentar",
      icon: DollarSign,
      iconBg: "bg-red-600",
      glowColor: "rgb(220, 38, 38)",
      path: "/camara-deputados/ranking/despesas",
    },
    {
      id: "proposicoes",
      titulo: "Produtividade Legislativa",
      descricao: "Deputados que mais apresentaram proposições",
      icon: FileText,
      iconBg: "bg-green-600",
      glowColor: "rgb(22, 163, 74)",
      path: "/camara-deputados/ranking/proposicoes",
    },
    {
      id: "presenca",
      titulo: "Presença e Assiduidade",
      descricao: "Deputados com maior participação em eventos",
      icon: Calendar,
      iconBg: "bg-blue-600",
      glowColor: "rgb(37, 99, 235)",
      path: "/camara-deputados/ranking/presenca",
    },
    {
      id: "comissoes",
      titulo: "Atuação em Comissões",
      descricao: "Deputados mais ativos em órgãos e comissões",
      icon: Users,
      iconBg: "bg-purple-600",
      glowColor: "rgb(147, 51, 234)",
      path: "/camara-deputados/ranking/comissoes",
    },
  ];

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <Button
        variant="ghost"
        onClick={() => navigate("/camara-deputados")}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-lg bg-amber-600 shadow-lg shadow-amber-500/50 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Rankings e Estatísticas</h1>
            <p className="text-sm text-muted-foreground">
              Análise do desempenho dos deputados federais
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rankings.map((ranking) => {
          const Icon = ranking.icon;
          return (
            <Card
              key={ranking.id}
              className="cursor-pointer hover:scale-105 hover:shadow-2xl hover:-translate-y-1 transition-all border-2 border-transparent hover:border-accent/50 bg-gradient-to-br from-gray-900/95 to-gray-800/95 group shadow-xl overflow-hidden relative"
              onClick={() => navigate(ranking.path)}
            >
              <div 
                className="absolute top-0 left-0 right-0 h-1 opacity-80"
                style={{
                  background: `linear-gradient(90deg, transparent, ${ranking.glowColor}, transparent)`,
                  boxShadow: `0 0 20px ${ranking.glowColor}`
                }}
              />
              
              <CardContent className="p-6 flex flex-col items-center text-center min-h-[200px] justify-center">
                <div className={`flex items-center justify-center w-16 h-16 rounded-full ${ranking.iconBg} shadow-lg transition-transform group-hover:scale-110 mb-4`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-white">{ranking.titulo}</h3>
                <p className="text-sm text-gray-300">{ranking.descricao}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default CamaraRankings;
