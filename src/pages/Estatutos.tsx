import { useNavigate } from "react-router-dom";
import { FileText, Scale, Users, Accessibility, Shield, Gavel, ScrollText, Flag, Search, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";

const Estatutos = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const estatutos = [
    { 
      id: "oab", 
      abbr: "EOAB", 
      title: "Estatuto da OAB",
      description: "Lei 8.906/1994",
      icon: Gavel,
      borderColor: "border-l-[hsl(160,84%,39%)]",
      iconBg: "bg-[hsl(160,84%,39%)]/10",
      iconColor: "text-[hsl(160,84%,39%)]",
      shadowColor: "hover:shadow-[hsl(160,84%,39%)]/10"
    },
    { 
      id: "cidade", 
      abbr: "EC", 
      title: "Estatuto da Cidade",
      description: "Lei 10.257/2001",
      icon: Scale,
      borderColor: "border-l-[hsl(217,91%,60%)]",
      iconBg: "bg-[hsl(217,91%,60%)]/10",
      iconColor: "text-[hsl(217,91%,60%)]",
      shadowColor: "hover:shadow-[hsl(217,91%,60%)]/10"
    },
    { 
      id: "desarmamento", 
      abbr: "ED", 
      title: "Estatuto do Desarmamento",
      description: "Lei 10.826/2003",
      icon: Shield,
      borderColor: "border-l-[hsl(24,95%,53%)]",
      iconBg: "bg-[hsl(24,95%,53%)]/10",
      iconColor: "text-[hsl(24,95%,53%)]",
      shadowColor: "hover:shadow-[hsl(24,95%,53%)]/10"
    },
    { 
      id: "eca", 
      abbr: "ECA", 
      title: "Estatuto da Criança e do Adolescente",
      description: "Lei 8.069/1990",
      icon: Users,
      borderColor: "border-l-[hsl(262,83%,58%)]",
      iconBg: "bg-[hsl(262,83%,58%)]/10",
      iconColor: "text-[hsl(262,83%,58%)]",
      shadowColor: "hover:shadow-[hsl(262,83%,58%)]/10"
    },
    { 
      id: "idoso", 
      abbr: "EI", 
      title: "Estatuto do Idoso",
      description: "Lei 10.741/2003",
      icon: Accessibility,
      borderColor: "border-l-[hsl(271,76%,53%)]",
      iconBg: "bg-[hsl(271,76%,53%)]/10",
      iconColor: "text-[hsl(271,76%,53%)]",
      shadowColor: "hover:shadow-[hsl(271,76%,53%)]/10"
    },
    { 
      id: "igualdade-racial", 
      abbr: "EIR", 
      title: "Estatuto da Igualdade Racial",
      description: "Lei 12.288/2010",
      icon: Flag,
      borderColor: "border-l-[hsl(43,96%,56%)]",
      iconBg: "bg-[hsl(43,96%,56%)]/10",
      iconColor: "text-[hsl(43,96%,56%)]",
      shadowColor: "hover:shadow-[hsl(43,96%,56%)]/10"
    },
    { 
      id: "pessoa-deficiencia", 
      abbr: "EPD", 
      title: "Estatuto da Pessoa com Deficiência",
      description: "Lei 13.146/2015",
      icon: Accessibility,
      borderColor: "border-l-[hsl(38,92%,50%)]",
      iconBg: "bg-[hsl(38,92%,50%)]/10",
      iconColor: "text-[hsl(38,92%,50%)]",
      shadowColor: "hover:shadow-[hsl(38,92%,50%)]/10"
    },
    { 
      id: "torcedor", 
      abbr: "ET", 
      title: "Estatuto do Torcedor",
      description: "Lei 10.671/2003",
      icon: ScrollText,
      borderColor: "border-l-[hsl(330,81%,60%)]",
      iconBg: "bg-[hsl(330,81%,60%)]/10",
      iconColor: "text-[hsl(330,81%,60%)]",
      shadowColor: "hover:shadow-[hsl(330,81%,60%)]/10"
    },
  ];

  const filteredEstatutos = useMemo(() => {
    if (!searchQuery.trim()) return estatutos;
    
    const query = searchQuery.toLowerCase();
    return estatutos.filter(estatuto => 
      estatuto.abbr.toLowerCase().includes(query) || 
      estatuto.title.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Mapeamento de cores baseado no ID do estatuto
  const getGlowColor = (id: string) => {
    const colorMap: Record<string, string> = {
      "cidade": "hsl(217,91%,60%)",           // Azul
      "desarmamento": "hsl(24,95%,53%)",      // Laranja
      "eca": "hsl(262,83%,58%)",              // Roxo
      "idoso": "hsl(271,76%,53%)",            // Roxo escuro
      "igualdade-racial": "hsl(43,96%,56%)",  // Amarelo
      "oab": "hsl(160,84%,39%)",              // Verde
      "pessoa-deficiencia": "hsl(38,92%,50%)",// Dourado
      "torcedor": "hsl(330,81%,60%)"          // Rosa
    };
    return colorMap[id] || "hsl(217,91%,60%)";
  };

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-600 shadow-lg shadow-purple-500/50">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Estatutos</h1>
            <p className="text-sm text-muted-foreground">
              Acesse os principais estatutos brasileiros
            </p>
          </div>
        </div>
      </div>

      {/* Campo de Busca */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar por abreviação ou nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-base"
            />
            <Button variant="outline" size="icon" className="shrink-0">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estatutos */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Estatutos Disponíveis
        </h2>
        
        {filteredEstatutos.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary mb-3">
              <Search className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Nenhum estatuto encontrado
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredEstatutos.map((estatuto, index) => {
              const Icon = estatuto.icon;
              return (
                <Card
                  key={estatuto.id}
                  className="cursor-pointer hover:scale-105 hover:shadow-xl hover:-translate-y-1 transition-all border-2 border-transparent hover:border-primary/50 bg-gradient-to-br from-card to-card/80 group overflow-hidden relative"
                  onClick={() => navigate(`/estatuto/${estatuto.id}`)}
                >
                  <div 
                    className="absolute top-0 left-0 right-0 h-1 opacity-80"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${getGlowColor(estatuto.id)}, transparent)`,
                      boxShadow: `0 0 20px ${getGlowColor(estatuto.id)}`
                    }}
                  />
                  
                  <CardContent className="p-4 flex flex-col items-center text-center min-h-[140px] justify-center">
                    <div className={`${estatuto.iconBg} rounded-full p-3 mb-2`}>
                      <Icon className={`w-6 h-6 ${estatuto.iconColor}`} />
                    </div>
                    <h3 className="font-bold text-base mb-1">{estatuto.abbr}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {estatuto.title}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Estatutos;
