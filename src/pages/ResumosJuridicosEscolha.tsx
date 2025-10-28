import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

const ResumosJuridicosEscolha = () => {
  const navigate = useNavigate();

  const opcoes = [
    {
      id: "prontos",
      titulo: "Resumos Prontos",
      descricao: "Acesse resumos estruturados de todas as áreas do Direito",
      emoji: "📚",
      rota: "/resumos-juridicos/prontos",
      cor: "from-blue-500/20 to-cyan-500/20",
    },
    {
      id: "personalizado",
      titulo: "Resumo Personalizado",
      descricao: "Crie resumos personalizados de textos, PDFs ou imagens",
      emoji: "✍️",
      rota: "/resumos-juridicos/personalizado",
      cor: "from-purple-500/20 to-pink-500/20",
    },
  ];

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto animate-fade-in pb-24">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1">Resumos Jurídicos</h1>
        <p className="text-sm text-muted-foreground">
          Escolha como deseja criar ou acessar seus resumos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {opcoes.map((opcao) => (
          <Card
            key={opcao.id}
            className="cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg overflow-hidden group"
            onClick={() => navigate(opcao.rota)}
          >
            <div className={`h-2 bg-gradient-to-r ${opcao.cor}`} />
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="text-5xl">{opcao.emoji}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{opcao.titulo}</h3>
                  <p className="text-sm text-muted-foreground">
                    {opcao.descricao}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ResumosJuridicosEscolha;