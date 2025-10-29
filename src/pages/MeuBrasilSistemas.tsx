import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MeuBrasilSistemas = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const sistemas = [
    {
      pais: "Estados Unidos",
      bandeira: "🇺🇸",
      sistema: "Common Law",
      descricao: "Sistema baseado em precedentes judiciais",
      caracteristicas: ["Júri popular", "Precedentes vinculantes", "Adversarial"]
    },
    {
      pais: "Reino Unido",
      bandeira: "🇬🇧",
      sistema: "Common Law",
      descricao: "Berço do sistema Common Law",
      caracteristicas: ["Direito consuetudinário", "Case law", "Parlamento soberano"]
    },
    {
      pais: "França",
      bandeira: "🇫🇷",
      sistema: "Civil Law",
      descricao: "Sistema romano-germânico codificado",
      caracteristicas: ["Código Napoleônico", "Inquisitorial", "Direito codificado"]
    },
    {
      pais: "Alemanha",
      bandeira: "🇩🇪",
      sistema: "Civil Law",
      descricao: "Sistema jurídico germânico",
      caracteristicas: ["BGB (Código Civil)", "Tribunal Constitucional", "Federalismo"]
    },
    {
      pais: "Portugal",
      bandeira: "🇵🇹",
      sistema: "Civil Law",
      descricao: "Influência direta no direito brasileiro",
      caracteristicas: ["Ordenações", "Código Civil português", "Tradição ibérica"]
    },
    {
      pais: "Espanha",
      bandeira: "🇪🇸",
      sistema: "Civil Law",
      descricao: "Sistema romano-germânico ibérico",
      caracteristicas: ["Código Civil espanhol", "Direito autonômico", "Tradição romana"]
    },
    {
      pais: "Argentina",
      bandeira: "🇦🇷",
      sistema: "Civil Law",
      descricao: "Sistema similar ao brasileiro",
      caracteristicas: ["Código Civil e Comercial", "Federalismo", "Influência francesa"]
    },
    {
      pais: "China",
      bandeira: "🇨🇳",
      sistema: "Socialista",
      descricao: "Sistema socialista com características próprias",
      caracteristicas: ["Partido único", "Socialismo de mercado", "Código Civil de 2020"]
    },
    {
      pais: "Japão",
      bandeira: "🇯🇵",
      sistema: "Civil Law (híbrido)",
      descricao: "Mistura de tradições ocidentais e orientais",
      caracteristicas: ["Influência alemã", "Constituição pacifista", "Mediação"]
    }
  ];

  const filteredSistemas = sistemas.filter(s =>
    s.pais.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.sistema.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/meu-brasil")}
        className="mb-4"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Voltar
      </Button>

      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1 flex items-center gap-2">
          <Globe className="w-6 h-6" />
          Sistemas Jurídicos
        </h1>
        <p className="text-sm text-muted-foreground">
          Compare o direito brasileiro com outros países
        </p>
      </div>

      {/* Busca */}
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Buscar país ou sistema..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid de países - Estilo cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSistemas.map((item) => (
          <button
            key={item.pais}
            onClick={() => navigate(`/meu-brasil/sistema/${encodeURIComponent(`Sistema Jurídico - ${item.pais}`)}`)}
            className="group bg-card border border-border rounded-lg overflow-hidden hover:border-primary hover:shadow-xl transition-all duration-300 hover:scale-[1.02] text-left"
          >
            {/* Header com bandeira */}
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 text-center">
              <div className="text-7xl mb-2">{item.bandeira}</div>
              <h3 className="font-bold text-xl">{item.pais}</h3>
            </div>
            
            {/* Conteúdo */}
            <div className="p-4 space-y-3">
              <div className="flex justify-center">
                <span className="text-sm bg-accent/20 text-accent px-3 py-1 rounded-full font-medium">
                  {item.sistema}
                </span>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                {item.descricao}
              </p>

              <div className="border-t border-border pt-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Características:
                </p>
                {item.caracteristicas.map((carac, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-1">•</span>
                    <span>{carac}</span>
                  </div>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>

      {filteredSistemas.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum país encontrado</p>
        </div>
      )}
    </div>
  );
};

export default MeuBrasilSistemas;
