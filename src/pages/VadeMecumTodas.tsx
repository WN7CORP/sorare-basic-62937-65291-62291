import { useNavigate } from "react-router-dom";
import { Crown, Gavel, FileText, BookText, Search, Scale, Info, Vote, Landmark } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import VadeMecumInfoModal from "@/components/VadeMecumInfoModal";
import ProposicoesRecentesCarousel from "@/components/ProposicoesRecentesCarousel";
import { VadeMecumTabs } from "@/components/VadeMecumTabs";
import LeisRecentesLista from "@/components/LeisRecentesLista";

const VadeMecumTodas = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeTab, setActiveTab] = useState("legislacao");

  const categories = [
    {
      id: "constituicao",
      title: "Constituição",
      description: "Acessa a Constituição Federal",
      icon: Crown,
      iconBg: "bg-orange-500",
      route: "/constituicao"
    },
    {
      id: "codigos",
      title: "Códigos e Leis",
      description: "Explore códigos e legislação",
      icon: Scale,
      iconBg: "bg-red-500",
      route: "/codigos"
    },
    {
      id: "estatutos",
      title: "Estatutos",
      description: "Consulte estatutos especiais",
      icon: Gavel,
      iconBg: "bg-purple-500",
      route: "/estatutos"
    },
    {
      id: "sumulas",
      title: "Súmulas",
      description: "Súmulas do STF e STJ",
      icon: BookText,
      iconBg: "bg-blue-500",
      route: "/sumulas"
    }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 1) {
      navigate(`/vade-mecum/busca?q=${encodeURIComponent(searchQuery)}`);
    } else {
      toast.error("Digite pelo menos 1 caractere para pesquisar");
    }
  };

  return (
    <div className="pb-24">
      <div className="px-4 py-6 space-y-4">
        <h1 className="text-2xl font-bold text-foreground animate-fade-in">Vade Mecum Elite</h1>
        
        {/* Caixa de Pesquisa - Só aparece quando clicada */}
        {!isSearchFocused ? (
          <button
            onClick={() => setIsSearchFocused(true)}
            className="w-full flex items-center gap-3 px-4 py-3 bg-card/50 backdrop-blur-sm border border-accent/20 rounded-xl hover:border-accent transition-all text-left animate-fade-in"
          >
            <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground text-sm">Pesquisar artigos, leis, súmulas...</span>
          </button>
        ) : (
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 animate-fade-in">
            <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-card/50 backdrop-blur-sm border border-accent/20 rounded-xl focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all">
              <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                placeholder="Pesquisar artigos, leis, súmulas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => {
                  if (!searchQuery) setIsSearchFocused(false);
                }}
                autoFocus
                className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm min-w-0"
              />
            </div>
            <button
              type="submit"
              disabled={searchQuery.trim().length < 1}
              className="px-6 py-3 bg-accent text-accent-foreground rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm whitespace-nowrap"
            >
              Pesquisar
            </button>
          </form>
        )}
      </div>

      {/* Tabs de navegação */}
      <VadeMecumTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Conteúdo baseado na tab ativa */}
      {activeTab === "legislacao" ? (
        <div className="px-4 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((category, index) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => navigate(category.route)}
              className="bg-card rounded-xl p-4 text-left transition-all hover:scale-105 hover:shadow-xl animate-fade-in"
              style={{
                animationDelay: `${index * 0.1}s`,
                animationFillMode: 'backwards'
              }}
            >
              <div className={`${category.iconBg} rounded-full p-3 w-fit mb-3 shadow-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">
                {category.title}
              </h3>
              <p className="text-muted-foreground text-xs">
                {category.description}
              </p>
            </button>
          );
        })}
      </div>

          {/* Projetos de Lei Recentes */}
          <div className="animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'backwards' }}>
            <ProposicoesRecentesCarousel />
          </div>

          {/* Seção Poder Legislativo */}
          <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.5s', animationFillMode: 'backwards' }}>
        <h2 className="text-xl font-bold text-foreground">Poder Legislativo</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate("/eleicoes")}
            className="bg-card rounded-xl p-4 text-left transition-all hover:scale-105 hover:shadow-xl animate-fade-in"
            style={{ animationDelay: '0.5s', animationFillMode: 'backwards' }}
          >
            <div className="bg-green-500 rounded-full p-3 w-fit mb-3 shadow-lg">
              <Vote className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-1">
              Eleições
            </h3>
            <p className="text-muted-foreground text-xs">
              Dados e resultados eleitorais
            </p>
          </button>

          <button
            onClick={() => navigate("/camara-deputados")}
            className="bg-card rounded-xl p-4 text-left transition-all hover:scale-105 hover:shadow-xl animate-fade-in"
            style={{ animationDelay: '0.6s', animationFillMode: 'backwards' }}
          >
            <div className="bg-green-600 rounded-full p-3 w-fit mb-3 shadow-lg">
              <Landmark className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-1">
              Câmara dos Deputados
            </h3>
            <p className="text-muted-foreground text-xs">
              Deputados e votações
            </p>
          </button>
          </div>
        </div>

        {/* Card "Sobre o Vade Mecum" */}
        <Card className="bg-accent/5 border-accent/20">
        <CardContent className="p-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Scale className="w-5 h-5 text-accent" />
            Sobre o Vade Mecum
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Sua ferramenta completa de consulta jurídica, reunindo toda a legislação brasileira essencial.
          </p>
          <Button 
            onClick={() => setIsInfoModalOpen(true)}
            variant="outline"
            className="w-full sm:w-auto gap-2"
          >
            <Info className="w-4 h-4" />
            Ver mais
          </Button>
          </CardContent>
        </Card>
        </div>
      ) : (
        <div className="px-4 py-6">
          <LeisRecentesLista />
        </div>
      )}

      <VadeMecumInfoModal 
        isOpen={isInfoModalOpen} 
        onClose={() => setIsInfoModalOpen(false)} 
      />
    </div>
  );
};

export default VadeMecumTodas;
