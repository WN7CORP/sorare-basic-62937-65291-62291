import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Search, Filter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { JurisprudenciaCard } from "@/components/JurisprudenciaCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Jurisprudencia {
  numeroProcesso: string;
  tribunal: string;
  orgaoJulgador: string;
  dataJulgamento: string;
  ementa: string;
  link: string;
  temaJuridico?: string;
}

interface BuscaResponse {
  jurisprudencias: Jurisprudencia[];
  total: number;
  hasMore: boolean;
  fonte: string;
}

const JurisprudenciaResultados = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [resultados, setResultados] = useState<Jurisprudencia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [termoBusca, setTermoBusca] = useState(searchParams.get("q") || "");
  const [tribunal, setTribunal] = useState(searchParams.get("tribunal") || "stj");
  const [total, setTotal] = useState(0);
  const [fonte, setFonte] = useState<string>("");

  useEffect(() => {
    buscarJurisprudencias();
  }, []);

  const buscarJurisprudencias = async () => {
    setIsLoading(true);
    try {
      const termo = searchParams.get("q") || termoBusca;
      
      if (!termo) {
        toast({
          title: "Termo vazio",
          description: "Digite um termo para buscar",
        });
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("buscar-jurisprudencia", {
        body: { 
          termo,
          tribunal: searchParams.get("tribunal") || tribunal,
          limit: 20
        },
      });

      if (error) throw error;

      const response = data as BuscaResponse;
      setResultados(response.jurisprudencias || []);
      setTotal(response.total || 0);
      setFonte(response.fonte || "");
      
      if (response.jurisprudencias?.length === 0) {
        toast({
          title: "Nenhum resultado",
          description: "Tente outros termos de busca relacionados",
        });
      } else if (response.fonte === 'public-web') {
        toast({
          title: "Busca concluída",
          description: `${response.total} jurisprudências encontradas de fontes públicas`,
        });
      }
    } catch (error) {
      console.error("Erro ao buscar jurisprudências:", error);
      toast({
        title: "Erro na busca",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNovaBusca = () => {
    const params = new URLSearchParams();
    if (termoBusca) params.set("q", termoBusca);
    if (tribunal) params.set("tribunal", tribunal);
    navigate(`/jurisprudencia/resultados?${params.toString()}`);
    buscarJurisprudencias();
  };

  const handleVerDetalhes = (juris: Jurisprudencia) => {
    navigate(`/jurisprudencia/detalhes/${encodeURIComponent(juris.numeroProcesso)}`, {
      state: { jurisprudencia: juris }
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="border-b border-border bg-card/95 backdrop-blur-lg px-3 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/jurisprudencia")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-sm font-bold">Resultados da Busca</h1>
            {!isLoading && (
              <p className="text-xs text-muted-foreground">
                {total} jurisprudências encontradas
                {fonte === 'public-web' && ' • Fonte: Pública'}
                {fonte === 'mock' && ' • Dados de exemplo'}
              </p>
            )}
          </div>
        </div>

        {/* Busca rápida */}
        <div className="flex gap-2">
          <Input
            placeholder="Nova busca..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleNovaBusca()}
            className="text-sm"
          />
          <Select value={tribunal} onValueChange={setTribunal}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stj">STJ</SelectItem>
              <SelectItem value="stf">STF</SelectItem>
              <SelectItem value="tst">TST</SelectItem>
            </SelectContent>
          </Select>
          <Button size="icon" onClick={handleNovaBusca}>
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Resultados */}
      <div className="max-w-4xl mx-auto px-3 py-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Buscando jurisprudências...</p>
          </div>
        ) : resultados.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Nenhuma jurisprudência encontrada</p>
            <Button onClick={() => navigate("/jurisprudencia")}>
              Nova Busca
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {resultados.map((juris, index) => (
              <JurisprudenciaCard
                key={index}
                jurisprudencia={juris}
                onVerDetalhes={() => handleVerDetalhes(juris)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JurisprudenciaResultados;
