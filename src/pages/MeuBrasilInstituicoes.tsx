import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Building2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MeuBrasilInstituicoes = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const instituicoes = [
    {
      nome: "Supremo Tribunal Federal",
      sigla: "STF",
      descricao: "Guardião da Constituição e última instância do Poder Judiciário",
      tipo: "Tribunal Superior",
      cor: "blue",
      logo: "⚖️"
    },
    {
      nome: "Superior Tribunal de Justiça",
      sigla: "STJ",
      descricao: "Uniformiza interpretação da lei federal",
      tipo: "Tribunal Superior",
      cor: "indigo",
      logo: "🏛️"
    },
    {
      nome: "Tribunal Superior Eleitoral",
      sigla: "TSE",
      descricao: "Regulamenta e fiscaliza eleições",
      tipo: "Tribunal Superior",
      cor: "green",
      logo: "🗳️"
    },
    {
      nome: "Tribunal Superior do Trabalho",
      sigla: "TST",
      descricao: "Julga questões trabalhistas em última instância",
      tipo: "Tribunal Superior",
      cor: "orange",
      logo: "👷"
    },
    {
      nome: "Superior Tribunal Militar",
      sigla: "STM",
      descricao: "Julga crimes militares",
      tipo: "Tribunal Superior",
      cor: "red",
      logo: "🎖️"
    },
    {
      nome: "Ordem dos Advogados do Brasil",
      sigla: "OAB",
      descricao: "Regulamenta e fiscaliza o exercício da advocacia",
      tipo: "Órgão de Classe",
      cor: "purple",
      logo: "👔"
    },
    {
      nome: "Conselho Nacional de Justiça",
      sigla: "CNJ",
      descricao: "Controla e aperfeiçoa o Poder Judiciário",
      tipo: "Órgão de Controle",
      cor: "cyan",
      logo: "🔍"
    },
    {
      nome: "Ministério Público Federal",
      sigla: "MPF",
      descricao: "Defende a ordem jurídica, democracia e interesses sociais",
      tipo: "Ministério Público",
      cor: "yellow",
      logo: "⚡"
    },
    {
      nome: "Defensoria Pública da União",
      sigla: "DPU",
      descricao: "Assistência jurídica gratuita aos necessitados",
      tipo: "Defensoria",
      cor: "teal",
      logo: "🤝"
    },
    {
      nome: "Advocacia-Geral da União",
      sigla: "AGU",
      descricao: "Representa judicialmente a União",
      tipo: "Advocacia Pública",
      cor: "amber",
      logo: "🏢"
    }
  ];

  const filteredInstituicoes = instituicoes.filter(i =>
    i.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.sigla.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.tipo.toLowerCase().includes(searchTerm.toLowerCase())
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
          <Building2 className="w-6 h-6" />
          Instituições Jurídicas
        </h1>
        <p className="text-sm text-muted-foreground">
          Órgãos do sistema jurídico brasileiro
        </p>
      </div>

      {/* Busca */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar instituição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Grid de instituições - Estilo cards com logos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInstituicoes.map((inst) => (
          <button
            key={inst.sigla}
            onClick={() => navigate(`/meu-brasil/instituicao/${encodeURIComponent(inst.nome)}`)}
            className="group bg-card border border-border rounded-lg overflow-hidden hover:border-primary hover:shadow-xl transition-all duration-300 hover:scale-[1.02] text-left"
          >
            {/* Header com logo/ícone */}
            <div className="bg-gradient-to-br from-primary/20 to-accent/10 p-6 text-center relative">
              <div className="text-6xl mb-3">{inst.logo}</div>
              <div className="text-3xl font-bold text-primary">
                {inst.sigla}
              </div>
            </div>
            
            {/* Conteúdo */}
            <div className="p-4 space-y-3">
              <h3 className="font-bold text-base line-clamp-2 group-hover:text-primary transition-colors min-h-[3rem]">
                {inst.nome}
              </h3>
              
              <div className="flex justify-center">
                <span className="text-xs bg-accent/20 text-accent px-3 py-1 rounded-full">
                  {inst.tipo}
                </span>
              </div>
              
              <p className="text-sm text-muted-foreground line-clamp-2">
                {inst.descricao}
              </p>
            </div>
          </button>
        ))}
      </div>

      {filteredInstituicoes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhuma instituição encontrada</p>
        </div>
      )}
    </div>
  );
};

export default MeuBrasilInstituicoes;
