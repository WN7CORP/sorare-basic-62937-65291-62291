import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const JurisprudenciaTemas = () => {
  const navigate = useNavigate();

  const temas = [
    {
      id: "civil",
      titulo: "Direito Civil",
      icon: "📜",
      descricao: "Contratos, Família, Sucessões, Propriedade",
      subtemas: ["Contratos", "Família", "Sucessões", "Responsabilidade Civil"],
      glowColor: "rgb(59, 130, 246)",
      query: "responsabilidade civil OR contratos OR família"
    },
    {
      id: "penal",
      titulo: "Direito Penal",
      icon: "⚖️",
      descricao: "Crimes contra a pessoa, patrimônio, drogas",
      subtemas: ["Crimes contra a pessoa", "Crimes contra o patrimônio", "Lei de Drogas", "Execução Penal"],
      glowColor: "rgb(239, 68, 68)",
      query: "crime OR penal OR homicídio OR furto"
    },
    {
      id: "trabalhista",
      titulo: "Direito Trabalhista",
      icon: "💼",
      descricao: "CLT, Relações de trabalho, Processuais",
      subtemas: ["CLT", "Relações de Trabalho", "Processo Trabalhista", "Direito Sindical"],
      glowColor: "rgb(16, 185, 129)",
      query: "CLT OR vínculo empregatício OR trabalhista"
    },
    {
      id: "tributario",
      titulo: "Direito Tributário",
      icon: "💰",
      descricao: "ICMS, ISS, IR, Processo tributário",
      subtemas: ["ICMS", "ISS", "Imposto de Renda", "Processo Tributário"],
      glowColor: "rgb(245, 158, 11)",
      query: "tributário OR ICMS OR ISS OR imposto"
    },
    {
      id: "constitucional",
      titulo: "Direito Constitucional",
      icon: "🏛️",
      descricao: "Direitos fundamentais, Controle de constitucionalidade",
      subtemas: ["Direitos Fundamentais", "Controle de Constitucionalidade", "Organização do Estado"],
      glowColor: "rgb(139, 92, 246)",
      query: "direitos fundamentais OR constitucionalidade OR ADI"
    },
    {
      id: "administrativo",
      titulo: "Direito Administrativo",
      icon: "📋",
      descricao: "Licitações, Servidores públicos, Responsabilidade",
      subtemas: ["Licitações", "Servidores Públicos", "Responsabilidade do Estado", "Contratos Administrativos"],
      glowColor: "rgb(236, 72, 153)",
      query: "licitações OR responsabilidade do Estado OR servidor público"
    },
    {
      id: "empresarial",
      titulo: "Direito Empresarial",
      icon: "🏢",
      descricao: "Sociedades, Falência, Títulos de crédito",
      subtemas: ["Sociedades", "Falência e Recuperação", "Títulos de Crédito", "Propriedade Industrial"],
      glowColor: "rgb(14, 165, 233)",
      query: "falência OR recuperação judicial OR sociedade"
    },
    {
      id: "consumidor",
      titulo: "Direito do Consumidor",
      icon: "👥",
      descricao: "CDC, Relações de consumo",
      subtemas: ["CDC", "Relações de Consumo", "Responsabilidade do Fornecedor", "Defesa do Consumidor"],
      glowColor: "rgb(34, 197, 94)",
      query: "CDC OR consumidor OR fornecedor"
    },
    {
      id: "ambiental",
      titulo: "Direito Ambiental",
      icon: "🌍",
      descricao: "Infrações, Licenciamento",
      subtemas: ["Infrações Ambientais", "Licenciamento", "Recursos Naturais", "Responsabilidade Ambiental"],
      glowColor: "rgb(132, 204, 22)",
      query: "licenciamento ambiental OR infrações ambientais"
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="border-b border-border bg-card/95 backdrop-blur-lg px-3 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/jurisprudencia")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-sm font-bold">Temas Jurídicos</h1>
            <p className="text-xs text-muted-foreground">Navegue por área do direito</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {temas.map((tema) => (
            <Card
              key={tema.id}
              className="cursor-pointer hover:scale-105 hover:shadow-xl hover:-translate-y-1 transition-all border-2 border-transparent hover:border-primary/50 bg-gradient-to-br from-card to-card/80 group overflow-hidden relative"
              onClick={() => navigate(`/jurisprudencia/resultados?q=${encodeURIComponent(tema.query)}&tribunal=stj`)}
            >
              <div 
                className="absolute top-0 left-0 right-0 h-1 opacity-80"
                style={{
                  background: `linear-gradient(90deg, transparent, ${tema.glowColor}, transparent)`,
                  boxShadow: `0 0 20px ${tema.glowColor}`
                }}
              />
              
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{tema.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-base">{tema.titulo}</h3>
                    <p className="text-xs text-muted-foreground">{tema.descricao}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {tema.subtemas.slice(0, 3).map((subtema, index) => (
                    <span key={index} className="text-xs bg-muted px-2 py-1 rounded">
                      {subtema}
                    </span>
                  ))}
                  {tema.subtemas.length > 3 && (
                    <span className="text-xs text-muted-foreground px-2 py-1">
                      +{tema.subtemas.length - 3}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default JurisprudenciaTemas;
