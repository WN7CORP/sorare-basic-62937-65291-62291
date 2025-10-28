import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scale, Search, Calendar, FileText, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Jurisprudencia = () => {
  const navigate = useNavigate();
  const [termoBusca, setTermoBusca] = useState("");
  const [tribunal, setTribunal] = useState("stj");

  const handleBuscar = () => {
    if (termoBusca.trim()) {
      navigate(`/jurisprudencia/resultados?q=${encodeURIComponent(termoBusca)}&tribunal=${tribunal}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBuscar();
    }
  };

  const temas = [
    {
      id: "civil",
      titulo: "Direito Civil",
      icon: "📜",
      descricao: "Contratos, Família, Sucessões",
      glowColor: "rgb(59, 130, 246)",
    },
    {
      id: "penal",
      titulo: "Direito Penal",
      icon: "⚖️",
      descricao: "Crimes e Contravenções",
      glowColor: "rgb(239, 68, 68)",
    },
    {
      id: "trabalhista",
      titulo: "Direito Trabalhista",
      icon: "💼",
      descricao: "CLT e Relações de Trabalho",
      glowColor: "rgb(16, 185, 129)",
    },
    {
      id: "tributario",
      titulo: "Direito Tributário",
      icon: "💰",
      descricao: "Impostos e Tributos",
      glowColor: "rgb(245, 158, 11)",
    },
    {
      id: "constitucional",
      titulo: "Direito Constitucional",
      icon: "🏛️",
      descricao: "Direitos Fundamentais",
      glowColor: "rgb(139, 92, 246)",
    },
    {
      id: "administrativo",
      titulo: "Direito Administrativo",
      icon: "📋",
      descricao: "Licitações e Servidores",
      glowColor: "rgb(236, 72, 153)",
    },
  ];

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-600 shadow-lg shadow-indigo-500/50">
            <Scale className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Jurisprudência</h1>
            <p className="text-sm text-muted-foreground">
              Busque decisões dos tribunais brasileiros
            </p>
          </div>
        </div>
      </div>

      {/* Campo de Busca */}
      <Card className="mb-6">
        <CardContent className="p-4 space-y-3">
          <div className="space-y-2">
            <Input
              placeholder="Digite palavras-chave ou número do processo..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              onKeyPress={handleKeyPress}
              className="text-base"
            />
            
            <div className="flex gap-2">
              <Select value={tribunal} onValueChange={setTribunal}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Tribunal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stj">STJ - Superior Tribunal de Justiça</SelectItem>
                  <SelectItem value="stf">STF - Supremo Tribunal Federal</SelectItem>
                  <SelectItem value="tst">TST - Tribunal Superior do Trabalho</SelectItem>
                  <SelectItem value="tjsp">TJSP - Tribunal de Justiça de SP</SelectItem>
                  <SelectItem value="tjrj">TJRJ - Tribunal de Justiça do RJ</SelectItem>
                </SelectContent>
              </Select>
              
              <Button onClick={handleBuscar} className="shrink-0">
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </Button>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/jurisprudencia/resultados?periodo=30d")}
              className="gap-1"
            >
              <Calendar className="w-3 h-3" />
              Últimos 30 dias
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Temas Populares */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Temas Populares
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {temas.map((tema) => (
            <Card
              key={tema.id}
              className="cursor-pointer hover:scale-105 hover:shadow-xl hover:-translate-y-1 transition-all border-2 border-transparent hover:border-primary/50 bg-gradient-to-br from-card to-card/80 group overflow-hidden relative"
              onClick={() => navigate(`/jurisprudencia/temas/${tema.id}`)}
            >
              <div 
                className="absolute top-0 left-0 right-0 h-1 opacity-80"
                style={{
                  background: `linear-gradient(90deg, transparent, ${tema.glowColor}, transparent)`,
                  boxShadow: `0 0 20px ${tema.glowColor}`
                }}
              />
              
              <CardContent className="p-4 flex flex-col items-center text-center min-h-[140px] justify-center">
                <div className="text-3xl mb-2">{tema.icon}</div>
                <h3 className="font-bold text-sm mb-1">{tema.titulo}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{tema.descricao}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Acesso Rápido */}
      <div className="grid grid-cols-1 gap-3">
        <Button
          variant="outline"
          className="h-auto py-4 flex-col gap-2"
          onClick={() => navigate("/jurisprudencia/temas")}
        >
          <FileText className="w-5 h-5" />
          <span className="text-xs">Todos os Temas</span>
        </Button>
      </div>
    </div>
  );
};

export default Jurisprudencia;
