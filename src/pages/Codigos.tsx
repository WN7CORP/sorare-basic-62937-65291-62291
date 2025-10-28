import { useNavigate } from "react-router-dom";
import { Scale, Gavel, FileText, Sword, Briefcase, Shield, DollarSign, Droplets, Plane, Radio, Building2, Mountain, BookOpen, Car, Search, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";

const Codigos = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  
  const codes = [{
    id: "cc",
    abbr: "CC",
    title: "Código Civil",
    description: "Lei 10.406/2002",
    icon: Scale,
    borderColor: "border-l-[hsl(217,91%,60%)]",
    iconBg: "bg-[hsl(217,91%,60%)]/10",
    iconColor: "text-[hsl(217,91%,60%)]",
    shadowColor: "hover:shadow-[hsl(217,91%,60%)]/10"
  }, {
    id: "cp",
    abbr: "CP",
    title: "Código Penal",
    description: "Decreto-Lei 2.848/1940",
    icon: Gavel,
    borderColor: "border-l-[hsl(24,95%,53%)]",
    iconBg: "bg-[hsl(24,95%,53%)]/10",
    iconColor: "text-[hsl(24,95%,53%)]",
    shadowColor: "hover:shadow-[hsl(24,95%,53%)]/10"
  }, {
    id: "cpc",
    abbr: "CPC",
    title: "Código de Processo Civil",
    description: "Lei 13.105/2015",
    icon: FileText,
    borderColor: "border-l-[hsl(262,83%,58%)]",
    iconBg: "bg-[hsl(262,83%,58%)]/10",
    iconColor: "text-[hsl(262,83%,58%)]",
    shadowColor: "hover:shadow-[hsl(262,83%,58%)]/10"
  }, {
    id: "cpp",
    abbr: "CPP",
    title: "Código de Processo Penal",
    description: "Decreto-Lei 3.689/1941",
    icon: Sword,
    borderColor: "border-l-[hsl(271,76%,53%)]",
    iconBg: "bg-[hsl(271,76%,53%)]/10",
    iconColor: "text-[hsl(271,76%,53%)]",
    shadowColor: "hover:shadow-[hsl(271,76%,53%)]/10"
  }, {
    id: "clt",
    abbr: "CLT",
    title: "Consolidação das Leis do Trabalho",
    description: "Decreto-Lei 5.452/1943",
    icon: Briefcase,
    borderColor: "border-l-[hsl(43,96%,56%)]",
    iconBg: "bg-[hsl(43,96%,56%)]/10",
    iconColor: "text-[hsl(43,96%,56%)]",
    shadowColor: "hover:shadow-[hsl(43,96%,56%)]/10"
  }, {
    id: "cdc",
    abbr: "CDC",
    title: "Código de Defesa do Consumidor",
    description: "Lei 8.078/1990",
    icon: Shield,
    borderColor: "border-l-[hsl(160,84%,39%)]",
    iconBg: "bg-[hsl(160,84%,39%)]/10",
    iconColor: "text-[hsl(160,84%,39%)]",
    shadowColor: "hover:shadow-[hsl(160,84%,39%)]/10"
  }, {
    id: "ctn",
    abbr: "CTN",
    title: "Código Tributário Nacional",
    description: "Lei 5.172/1966",
    icon: DollarSign,
    borderColor: "border-l-[hsl(38,92%,50%)]",
    iconBg: "bg-[hsl(38,92%,50%)]/10",
    iconColor: "text-[hsl(38,92%,50%)]",
    shadowColor: "hover:shadow-[hsl(38,92%,50%)]/10"
  }, {
    id: "ctb",
    abbr: "CTB",
    title: "Código de Trânsito Brasileiro",
    description: "Lei 9.503/1997",
    icon: Car,
    borderColor: "border-l-[hsl(330,81%,60%)]",
    iconBg: "bg-[hsl(330,81%,60%)]/10",
    iconColor: "text-[hsl(330,81%,60%)]",
    shadowColor: "hover:shadow-[hsl(330,81%,60%)]/10"
  }, {
    id: "ce",
    abbr: "CE",
    title: "Código Eleitoral",
    description: "Lei 4.737/1965",
    icon: Scale,
    borderColor: "border-l-[hsl(239,84%,67%)]",
    iconBg: "bg-[hsl(239,84%,67%)]/10",
    iconColor: "text-[hsl(239,84%,67%)]",
    shadowColor: "hover:shadow-[hsl(239,84%,67%)]/10"
  }, {
    id: "ca",
    abbr: "CA",
    title: "Código de Águas",
    description: "Decreto 24.643/1934",
    icon: Droplets,
    borderColor: "border-l-[hsl(189,94%,43%)]",
    iconBg: "bg-[hsl(189,94%,43%)]/10",
    iconColor: "text-[hsl(189,94%,43%)]",
    shadowColor: "hover:shadow-[hsl(189,94%,43%)]/10"
  }, {
    id: "cba",
    abbr: "CBA",
    title: "Código Brasileiro de Aeronáutica",
    description: "Lei 7.565/1986",
    icon: Plane,
    borderColor: "border-l-[hsl(199,89%,48%)]",
    iconBg: "bg-[hsl(199,89%,48%)]/10",
    iconColor: "text-[hsl(199,89%,48%)]",
    shadowColor: "hover:shadow-[hsl(199,89%,48%)]/10"
  }, {
    id: "cbt",
    abbr: "CBT",
    title: "Código Brasileiro de Telecomunicações",
    description: "Lei 4.117/1962",
    icon: Radio,
    borderColor: "border-l-[hsl(258,90%,66%)]",
    iconBg: "bg-[hsl(258,90%,66%)]/10",
    iconColor: "text-[hsl(258,90%,66%)]",
    shadowColor: "hover:shadow-[hsl(258,90%,66%)]/10"
  }, {
    id: "ccom",
    abbr: "CCOM",
    title: "Código Comercial",
    description: "Lei 556/1850",
    icon: Building2,
    borderColor: "border-l-[hsl(160,84%,39%)]",
    iconBg: "bg-[hsl(160,84%,39%)]/10",
    iconColor: "text-[hsl(160,84%,39%)]",
    shadowColor: "hover:shadow-[hsl(160,84%,39%)]/10"
  }, {
    id: "cdm",
    abbr: "CDM",
    title: "Código de Minas",
    description: "Decreto-Lei 227/1967",
    icon: Mountain,
    borderColor: "border-l-[hsl(66,70%,54%)]",
    iconBg: "bg-[hsl(66,70%,54%)]/10",
    iconColor: "text-[hsl(66,70%,54%)]",
    shadowColor: "hover:shadow-[hsl(66,70%,54%)]/10"
  }];

  const filteredCodes = useMemo(() => {
    if (!searchQuery.trim()) return codes;
    
    const query = searchQuery.toLowerCase();
    return codes.filter(code => 
      code.abbr.toLowerCase().includes(query) || 
      code.title.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Mapeamento de cores baseado no ID do código
  const getGlowColor = (id: string) => {
    const colorMap: Record<string, string> = {
      "cc": "hsl(217,91%,60%)",     // Azul
      "cp": "hsl(24,95%,53%)",      // Laranja
      "cpc": "hsl(142,76%,36%)",    // Verde
      "cpp": "hsl(271,76%,53%)",    // Roxo
      "clt": "hsl(43,96%,56%)",     // Amarelo
      "cdc": "hsl(160,84%,39%)",    // Verde água
      "ctn": "hsl(38,92%,50%)",     // Dourado
      "ctb": "hsl(330,81%,60%)",    // Rosa
      "ce": "hsl(239,84%,67%)",     // Azul claro
      "ca": "hsl(189,94%,43%)",     // Ciano
      "cba": "hsl(199,89%,48%)",    // Azul celeste
      "cbt": "hsl(258,90%,66%)",    // Violeta
      "ccom": "hsl(160,84%,39%)",   // Verde água
      "cdm": "hsl(66,70%,54%)"      // Amarelo esverdeado
    };
    return colorMap[id] || "hsl(217,91%,60%)";
  };

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 shadow-lg shadow-blue-500/50">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Códigos & Leis</h1>
            <p className="text-sm text-muted-foreground">
              Acesse os principais códigos do direito brasileiro
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

      {/* Códigos */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Códigos Disponíveis
        </h2>
        
        {filteredCodes.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary mb-3">
              <Search className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Nenhum código encontrado
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredCodes.map((code, index) => {
              const Icon = code.icon;
              return (
                <Card
                  key={code.id}
                  className="cursor-pointer hover:scale-105 hover:shadow-xl hover:-translate-y-1 transition-all border-2 border-transparent hover:border-primary/50 bg-gradient-to-br from-card to-card/80 group overflow-hidden relative"
                  onClick={() => navigate(`/codigo/${code.id}`)}
                >
                  <div 
                    className="absolute top-0 left-0 right-0 h-1 opacity-80"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${getGlowColor(code.id)}, transparent)`,
                      boxShadow: `0 0 20px ${getGlowColor(code.id)}`
                    }}
                  />
                  
                  <CardContent className="p-4 flex flex-col items-center text-center min-h-[140px] justify-center">
                    <div className={`${code.iconBg} rounded-full p-3 mb-2`}>
                      <Icon className={`w-6 h-6 ${code.iconColor}`} />
                    </div>
                    <h3 className="font-bold text-base mb-1">{code.abbr}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {code.title}
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

export default Codigos;