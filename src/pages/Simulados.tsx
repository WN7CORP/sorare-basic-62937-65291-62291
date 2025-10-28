import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Gavel, ArrowRight } from "lucide-react";

const Simulados = () => {
  const navigate = useNavigate();

  const opcoes = [
    {
      id: "exames",
      titulo: "Exames Completos da OAB",
      descricao: "Pratique com exames reais organizados por edição",
      icon: Gavel,
      path: "/simulados/exames",
      gradient: "from-[hsl(260,80%,60%)] to-[hsl(240,90%,55%)]",
    },
    {
      id: "personalizado",
      titulo: "Simulado Personalizado",
      descricao: "Escolha áreas específicas e crie seu simulado",
      icon: Gavel,
      path: "/simulados/personalizado",
      gradient: "from-[hsl(320,75%,55%)] to-[hsl(280,80%,60%)]",
    },
  ];

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1">Simulados OAB</h1>
        <p className="text-sm text-muted-foreground">
          Escolha o tipo de simulado que deseja realizar
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {opcoes.map((opcao) => {
          const Icon = opcao.icon;
          return (
            <Card
              key={opcao.id}
              className="cursor-pointer hover:scale-[1.02] transition-all bg-card border-border overflow-hidden group"
              onClick={() => navigate(opcao.path)}
            >
              <CardContent className="p-4 flex flex-col items-center text-center gap-3 min-h-[140px]">
                <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${opcao.gradient}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-foreground mb-1">
                    {opcao.titulo}
                  </h3>
                  <p className="text-xs text-muted-foreground">{opcao.descricao}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all" />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Simulados;
