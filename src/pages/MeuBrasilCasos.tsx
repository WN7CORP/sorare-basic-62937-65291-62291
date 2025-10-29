import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MeuBrasilCasos = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const casos = [
    {
      nome: "Operação Lava Jato",
      ano: 2014,
      area: "Corrupção e Lavagem de Dinheiro",
      importancia: "Maior investigação de corrupção da história do Brasil",
      foto: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80"
    },
    {
      nome: "Mensalão",
      ano: 2005,
      area: "Corrupção Política",
      importancia: "Primeiro grande julgamento de políticos pelo STF",
      foto: "https://images.unsplash.com/photo-1541872703-74c34d9d2b31?w=800&q=80"
    },
    {
      nome: "Caso Nardoni",
      ano: 2008,
      area: "Criminal",
      importancia: "Caso de grande repercussão midiática",
      foto: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&q=80"
    },
    {
      nome: "Caso Mariana (Samarco)",
      ano: 2015,
      area: "Ambiental",
      importancia: "Maior desastre ambiental do Brasil",
      foto: "https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=800&q=80"
    },
    {
      nome: "Caso Cesare Battisti",
      ano: 2011,
      area: "Direito Internacional",
      importancia: "Extradição de ativista italiano",
      foto: "https://images.unsplash.com/photo-1589391886645-d51941baf7fb?w=800&q=80"
    },
    {
      nome: "ADI 4277 - União Homoafetiva",
      ano: 2011,
      area: "Constitucional",
      importancia: "Reconhecimento de união estável entre pessoas do mesmo sexo",
      foto: "https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=800&q=80"
    },
    {
      nome: "ADPF 54 - Anencefalia",
      ano: 2012,
      area: "Constitucional",
      importancia: "Descriminalização do aborto de fetos anencéfalos",
      foto: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80"
    },
    {
      nome: "Caso Eliza Samudio",
      ano: 2010,
      area: "Criminal",
      importancia: "Caso de feminicídio com grande repercussão",
      foto: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&q=80"
    },
    {
      nome: "Caso Escola Base",
      ano: 1994,
      area: "Criminal - Erro Judiciário",
      importancia: "Marco sobre responsabilidade da imprensa e presunção de inocência",
      foto: "https://images.unsplash.com/photo-1588072432836-e10032774350?w=800&q=80"
    }
  ];

  const filteredCasos = casos.filter(c =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.area.toLowerCase().includes(searchTerm.toLowerCase())
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
          <FileText className="w-6 h-6" />
          Casos Famosos
        </h1>
        <p className="text-sm text-muted-foreground">
          Casos históricos e marcantes do direito brasileiro
        </p>
      </div>

      {/* Busca */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar caso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Grid de casos - Estilo cards com capas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCasos.map((caso) => (
          <button
            key={caso.nome}
            onClick={() => navigate(`/meu-brasil/caso/${encodeURIComponent(caso.nome)}`)}
            className="group bg-card border border-border rounded-lg overflow-hidden hover:border-primary hover:shadow-xl transition-all duration-300 hover:scale-[1.02] text-left"
          >
            {/* Imagem de capa */}
            <div className="relative h-48 overflow-hidden">
              <img
                src={caso.foto}
                alt={caso.nome}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
              
              {/* Ano no canto superior direito */}
              <div className="absolute top-3 right-3 bg-red-600/90 text-white text-xs font-bold px-2 py-1 rounded">
                📅 {caso.ano}
              </div>
            </div>
            
            {/* Conteúdo */}
            <div className="p-4 space-y-2">
              <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                {caso.nome}
              </h3>
              
              <div className="flex gap-2">
                <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">
                  {caso.area}
                </span>
              </div>
              
              <p className="text-sm text-muted-foreground line-clamp-2">
                {caso.importancia}
              </p>
            </div>
          </button>
        ))}
      </div>

      {filteredCasos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum caso encontrado</p>
        </div>
      )}
    </div>
  );
};

export default MeuBrasilCasos;
