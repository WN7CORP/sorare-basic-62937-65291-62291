import { useNavigate } from "react-router-dom";
import { Gavel, Film, Scale, ScanText, Newspaper, GraduationCap, MessageCircle } from "lucide-react";

const Ferramentas = () => {
  const navigate = useNavigate();

  const ferramentas = [
    {
      id: "assistente-pessoal",
      titulo: "Assistente Pessoal",
      descricao: "Assistente jurídica no WhatsApp para te ajudar no dia a dia",
      icon: MessageCircle,
      path: "/assistente-pessoal",
      iconColor: "bg-green-500",
    },
    {
      id: "noticias-juridicas",
      titulo: "Notícias Jurídicas",
      descricao: "Fique por dentro das últimas notícias",
      icon: Newspaper,
      path: "/noticias-juridicas",
      iconColor: "bg-red-500",
    },
    {
      id: "dicionario",
      titulo: "Dicionário Jurídico",
      descricao: "Consulte termos e definições do direito",
      icon: Gavel,
      path: "/dicionario",
      iconColor: "bg-gray-500",
    },
    {
      id: "juriflix",
      titulo: "JuriFlix",
      descricao: "Filmes e séries jurídicas",
      icon: Film,
      path: "/juriflix",
      iconColor: "bg-red-500",
    },
    {
      id: "ranking-faculdades",
      titulo: "Ranking Faculdades",
      descricao: "Melhores faculdades de Direito do Brasil",
      icon: GraduationCap,
      path: "/ranking-faculdades",
      iconColor: "bg-gray-600",
    },
    {
      id: "advogado",
      titulo: "Advogado",
      descricao: "Modelos e criação de petições com IA",
      icon: Scale,
      path: "/advogado",
      iconColor: "bg-blue-500",
    },
    {
      id: "analisar",
      titulo: "Analisar",
      descricao: "Analise documentos com IA",
      icon: ScanText,
      path: "/analisar",
      iconColor: "bg-amber-500",
    },
  ];

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1">Ferramentas</h1>
        <p className="text-sm text-muted-foreground">
          Recursos úteis para seus estudos
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ferramentas.map((ferramenta) => {
          const Icon = ferramenta.icon;
          return (
            <button
              key={ferramenta.id}
              onClick={() => navigate(ferramenta.path)}
              className="bg-card rounded-2xl md:rounded-xl p-5 md:p-4 text-left transition-all hover:scale-105 hover:shadow-xl min-h-[180px] md:min-h-[160px] flex flex-col border border-border shadow-lg"
            >
              <div className={`${ferramenta.iconColor} rounded-full p-3 md:p-2.5 w-fit mb-4 md:mb-3`}>
                <Icon className="w-6 h-6 md:w-5 md:h-5 text-white" />
              </div>
              <h3 className="text-sm md:text-sm font-bold text-foreground mb-2 md:mb-1.5">
                {ferramenta.titulo}
              </h3>
              <p className="text-muted-foreground text-xs md:text-[11px] line-clamp-3">
                {ferramenta.descricao}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Ferramentas;
