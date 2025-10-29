import { useNavigate } from "react-router-dom";
import { Clock, Globe, Users, Building2, FileText, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

const MeuBrasil = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const categorias = [
    {
      id: "historia",
      titulo: "História Jurídica",
      descricao: "Linha do tempo do direito no Brasil",
      icon: Clock,
      path: "/meu-brasil/historia",
      gradient: "from-amber-600 to-amber-700",
      shadow: "shadow-amber-500/50"
    },
    {
      id: "sistemas",
      titulo: "Sistemas Jurídicos",
      descricao: "Compare Brasil com outros países",
      icon: Globe,
      path: "/meu-brasil/sistemas",
      gradient: "from-blue-600 to-blue-700",
      shadow: "shadow-blue-500/50"
    },
    {
      id: "juristas",
      titulo: "Juristas Brasileiros",
      descricao: "Grandes nomes do direito",
      icon: Users,
      path: "/meu-brasil/juristas",
      gradient: "from-purple-600 to-purple-700",
      shadow: "shadow-purple-500/50"
    },
    {
      id: "instituicoes",
      titulo: "Instituições",
      descricao: "Órgãos do sistema jurídico",
      icon: Building2,
      path: "/meu-brasil/instituicoes",
      gradient: "from-green-600 to-green-700",
      shadow: "shadow-green-500/50"
    },
    {
      id: "casos",
      titulo: "Casos Famosos",
      descricao: "Casos históricos marcantes",
      icon: FileText,
      path: "/meu-brasil/casos",
      gradient: "from-red-600 to-red-700",
      shadow: "shadow-red-500/50"
    }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/meu-brasil/busca?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1 flex items-center gap-2">
          🇧🇷 Meu Brasil
        </h1>
        <p className="text-sm text-muted-foreground">
          Conheça o Brasil através da Wikipedia
        </p>
      </div>

      {/* Busca Global */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar em todas as categorias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </form>

      {/* Grid de Categorias - 2 colunas */}
      <div className="grid grid-cols-2 gap-3">
        {categorias.map((categoria) => {
          const Icon = categoria.icon;
          return (
            <button
              key={categoria.id}
              onClick={() => navigate(categoria.path)}
              className="bg-card border border-border rounded-lg p-4 text-left transition-all hover:border-primary hover:shadow-md group"
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className="bg-muted rounded-lg p-3">
                  <Icon className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-bold mb-1 group-hover:text-primary transition-colors">
                    {categoria.titulo}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {categoria.descricao}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Informação sobre a fonte */}
      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <p className="text-xs text-muted-foreground text-center">
          📚 Conteúdo fornecido pela Wikipedia em português
        </p>
      </div>
    </div>
  );
};

export default MeuBrasil;
