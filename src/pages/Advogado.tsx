import { useNavigate } from "react-router-dom";
import { FileText, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Advogado = () => {
  const navigate = useNavigate();

  const opcoes = [
    {
      id: "modelos",
      titulo: "Modelos de Petições",
      descricao: "Acesse mais de 30 mil modelos prontos",
      icon: FileText,
      path: "/advogado/modelos",
      iconBg: "bg-amber-600 shadow-lg shadow-amber-500/50",
      glowColor: "rgb(217, 119, 6)",
    },
    {
      id: "criar",
      titulo: "Criar Petição com IA",
      descricao: "Crie petições fundamentadas com inteligência artificial",
      icon: Sparkles,
      path: "/advogado/criar",
      iconBg: "bg-violet-600 shadow-lg shadow-violet-500/50",
      glowColor: "rgb(124, 58, 237)",
    },
  ];

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1">Ferramentas do Advogado</h1>
        <p className="text-sm text-muted-foreground">
          Modelos prontos e criação inteligente de petições
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {opcoes.map((opcao) => {
          const Icon = opcao.icon;
          return (
            <Card
              key={opcao.id}
              className="cursor-pointer hover:scale-105 hover:shadow-2xl hover:-translate-y-1 transition-all border-2 border-transparent hover:border-accent/50 bg-gradient-to-br from-gray-900/95 to-gray-800/95 group shadow-xl overflow-hidden relative"
            >
              <div 
                className="absolute top-0 left-0 right-0 h-1 opacity-80"
                style={{
                  background: `linear-gradient(90deg, transparent, ${opcao.glowColor}, transparent)`,
                  boxShadow: `0 0 20px ${opcao.glowColor}`
                }}
              />
              
              <CardContent className="p-6 flex flex-col items-center text-center min-h-[200px] justify-center"
                onClick={() => navigate(opcao.path)}
              >
                <div className={`flex items-center justify-center w-16 h-16 rounded-full ${opcao.iconBg} transition-transform group-hover:scale-110 mb-4`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-white">{opcao.titulo}</h3>
                <p className="text-sm text-gray-300">{opcao.descricao}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Advogado;
