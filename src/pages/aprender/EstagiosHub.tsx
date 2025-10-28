import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Search, BookOpen, Briefcase } from "lucide-react";

const EstagiosHub = () => {
  const navigate = useNavigate();

  const opcoes = [
    {
      id: "buscar",
      titulo: "Buscar Vagas",
      descricao: "Encontre oportunidades de estágio em Direito em todo o Brasil",
      icon: Search,
      path: "/aprender/estagios/buscar",
      iconBg: "bg-emerald-600 shadow-lg shadow-emerald-500/50",
      glowColor: "rgb(5, 150, 105)",
    },
    {
      id: "blog",
      titulo: "Blog sobre Estágios",
      descricao: "Dicas, conselhos e tudo sobre estágios em Direito",
      icon: BookOpen,
      path: "/aprender/estagios/blog",
      iconBg: "bg-blue-600 shadow-lg shadow-blue-500/50",
      glowColor: "rgb(37, 99, 235)",
    },
  ];

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-600 shadow-lg shadow-emerald-500/50">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold">Estágios em Direito</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Encontre oportunidades de estágio e aprenda tudo sobre como se destacar no mercado jurídico
          </p>
        </div>

        {/* Opções */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          {opcoes.map((opcao) => {
            const Icon = opcao.icon;
            return (
              <Card
                key={opcao.id}
                className="cursor-pointer hover:scale-105 hover:shadow-2xl hover:-translate-y-1 transition-all border-2 border-transparent bg-gradient-to-br from-card to-card/80 group shadow-xl overflow-hidden relative"
                onClick={() => navigate(opcao.path)}
              >
                {/* Brilho colorido no topo */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1 opacity-80"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${opcao.glowColor}, transparent)`,
                    boxShadow: `0 0 20px ${opcao.glowColor}`
                  }}
                />
                
                <CardContent className="p-8 flex flex-col items-center text-center min-h-[280px] justify-center">
                  <div className={`flex items-center justify-center w-16 h-16 rounded-full ${opcao.iconBg} transition-transform group-hover:scale-110 mb-6`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-2xl mb-4 text-foreground">{opcao.titulo}</h3>
                  <p className="text-muted-foreground text-base">{opcao.descricao}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EstagiosHub;
