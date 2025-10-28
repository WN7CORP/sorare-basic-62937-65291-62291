import { useState } from "react";
import { ArrowLeft, ExternalLink, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const BuscarJurisprudencia = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUrl, setCurrentUrl] = useState("https://corpus927.enfam.jus.br/legislacao/cp-40");

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    // Atualizar URL com busca
    const searchUrl = `https://corpus927.enfam.jus.br/legislacao/cp-40?q=${encodeURIComponent(searchQuery)}`;
    setCurrentUrl(searchUrl);
  };

  const openInNewTab = () => {
    window.open(currentUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex-1 max-w-2xl">
            <h1 className="text-sm font-bold mb-1">Buscar Jurisprudência</h1>
            <p className="text-xs text-muted-foreground">
              Corpus de Jurisprudência - ENFAM
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={openInNewTab}
          className="gap-2 hidden sm:flex"
        >
          <ExternalLink className="w-4 h-4" />
          Abrir em nova aba
        </Button>
      </div>

      {/* Search Bar */}
      <div className="bg-card/50 border-b border-border px-4 py-3">
        <div className="max-w-4xl mx-auto flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar na jurisprudência..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} className="shrink-0">
            Buscar
          </Button>
        </div>
      </div>

      {/* WebView Container */}
      <div className="flex-1 relative">
        <iframe
          src={currentUrl}
          className="w-full h-full absolute inset-0 border-0"
          title="Buscar Jurisprudência - ENFAM"
          allow="fullscreen"
        />
      </div>
    </div>
  );
};

export default BuscarJurisprudencia;
