import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, 
  FileText, 
  ThumbsUp, 
  Flag, 
  DollarSign,
  Calendar,
  Building,
  Users2,
  Landmark
} from "lucide-react";

const CamaraDeputados = () => {
  const navigate = useNavigate();

  const funcionalidades = [
    {
      id: "deputados",
      titulo: "Deputados",
      descricao: "Lista completa de deputados federais",
      icon: Users,
      path: "/camara-deputados/deputados",
      iconBg: "bg-green-600",
      glowColor: "rgb(22, 163, 74)",
    },
    {
      id: "proposicoes",
      titulo: "Proposições",
      descricao: "Projetos de lei, PECs e medidas",
      icon: FileText,
      path: "/camara-deputados/proposicoes",
      iconBg: "bg-yellow-600",
      glowColor: "rgb(202, 138, 4)",
    },
    {
      id: "votacoes",
      titulo: "Votações",
      descricao: "Resultados de votações do plenário",
      icon: ThumbsUp,
      path: "/camara-deputados/votacoes",
      iconBg: "bg-blue-600",
      glowColor: "rgb(37, 99, 235)",
    },
    {
      id: "rankings",
      titulo: "Rankings",
      descricao: "Estatísticas e desempenho dos deputados",
      icon: Landmark,
      path: "/camara-deputados/rankings",
      iconBg: "bg-amber-600",
      glowColor: "rgb(245, 158, 11)",
    },
    {
      id: "partidos",
      titulo: "Partidos",
      descricao: "Informações sobre partidos políticos",
      icon: Flag,
      path: "/camara-deputados/partidos",
      iconBg: "bg-purple-600",
      glowColor: "rgb(147, 51, 234)",
    },
    {
      id: "blocos",
      titulo: "Blocos Parlamentares",
      descricao: "Agrupamentos de partidos políticos",
      icon: Users2,
      path: "/camara-deputados/blocos",
      iconBg: "bg-rose-600",
      glowColor: "rgb(225, 29, 72)",
    },
    {
      id: "despesas",
      titulo: "Despesas",
      descricao: "Transparência nos gastos parlamentares",
      icon: DollarSign,
      path: "/camara-deputados/despesas",
      iconBg: "bg-red-600",
      glowColor: "rgb(220, 38, 38)",
    },
    {
      id: "eventos",
      titulo: "Eventos",
      descricao: "Agenda de sessões e reuniões",
      icon: Calendar,
      path: "/camara-deputados/eventos",
      iconBg: "bg-cyan-600",
      glowColor: "rgb(8, 145, 178)",
    },
    {
      id: "orgaos",
      titulo: "Órgãos e Comissões",
      descricao: "Comissões permanentes e temporárias",
      icon: Building,
      path: "/camara-deputados/orgaos",
      iconBg: "bg-indigo-600",
      glowColor: "rgb(79, 70, 229)",
    },
    {
      id: "frentes",
      titulo: "Frentes Parlamentares",
      descricao: "Frentes temáticas da Câmara",
      icon: Users2,
      path: "/camara-deputados/frentes",
      iconBg: "bg-pink-600",
      glowColor: "rgb(219, 39, 119)",
    },
  ];

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-lg bg-green-600 shadow-lg shadow-green-500/50 flex items-center justify-center">
            <Landmark className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Câmara dos Deputados</h1>
            <p className="text-sm text-muted-foreground">
              Dados oficiais da Câmara Federal
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {funcionalidades.map((func) => {
          const Icon = func.icon;
          return (
            <Card
              key={func.id}
              className="cursor-pointer hover:scale-105 hover:shadow-2xl hover:-translate-y-1 transition-all border-2 border-transparent hover:border-accent/50 bg-gradient-to-br from-gray-900/95 to-gray-800/95 group shadow-xl overflow-hidden relative"
              onClick={() => navigate(func.path)}
            >
              <div 
                className="absolute top-0 left-0 right-0 h-1 opacity-80"
                style={{
                  background: `linear-gradient(90deg, transparent, ${func.glowColor}, transparent)`,
                  boxShadow: `0 0 20px ${func.glowColor}`
                }}
              />
              
              <CardContent className="p-5 flex flex-col items-center text-center min-h-[180px] justify-center">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full ${func.iconBg} shadow-lg transition-transform group-hover:scale-110 mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-base mb-2 text-white">{func.titulo}</h3>
                <p className="text-xs text-gray-300 line-clamp-2">{func.descricao}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default CamaraDeputados;
