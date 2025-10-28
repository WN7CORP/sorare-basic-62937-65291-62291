import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, ExternalLink, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { JurisprudenciaCard } from "@/components/JurisprudenciaCard";

interface Jurisprudencia {
  numeroProcesso: string;
  tribunal: string;
  orgaoJulgador: string;
  dataJulgamento: string;
  ementa: string;
  link: string;
}

interface JurisprudenciaPanelProps {
  onAdicionarJurisprudencia: (juris: Jurisprudencia) => void;
  jurisprudencias: Jurisprudencia[];
  onRemoverJurisprudencia: (index: number) => void;
}

export const JurisprudenciaPanel = ({
  onAdicionarJurisprudencia,
  jurisprudencias,
  onRemoverJurisprudencia,
}: JurisprudenciaPanelProps) => {
  const [termoBusca, setTermoBusca] = useState("");
  const [resultados, setResultados] = useState<Jurisprudencia[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleBuscar = async () => {
    if (!termoBusca.trim()) {
      toast({
        title: "Campo vazio",
        description: "Digite um termo para buscar jurisprudências",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("buscar-jurisprudencia", {
        body: { termo: termoBusca },
      });

      if (error) throw error;

      setResultados(data.jurisprudencias || []);
      
      if (data.jurisprudencias?.length === 0) {
        toast({
          title: "Nenhum resultado",
          description: "Não foram encontradas jurisprudências para este termo",
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
      setIsSearching(false);
    }
  };

  return (
    <Card className="h-fit sticky top-4">
      <CardHeader>
        <CardTitle className="text-lg">Jurisprudências</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            placeholder="Buscar jurisprudência..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
          />
          <Button onClick={handleBuscar} disabled={isSearching} className="w-full" size="sm">
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </>
            )}
          </Button>
        </div>

        {/* Resultados da Busca */}
        {resultados.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Resultados ({resultados.length})</p>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {resultados.map((juris, index) => (
                <div key={index} className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <div>
                    <p className="font-semibold text-xs">{juris.tribunal}</p>
                    <p className="text-xs text-muted-foreground">{juris.numeroProcesso}</p>
                  </div>
                  <p className="text-xs line-clamp-2">{juris.ementa}</p>
                  <Button
                    size="sm"
                    onClick={() => onAdicionarJurisprudencia(juris)}
                    className="w-full h-7 text-xs"
                  >
                    Adicionar
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Jurisprudências Adicionadas */}
        {jurisprudencias.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <p className="text-sm font-medium">Adicionadas ({jurisprudencias.length})</p>
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {jurisprudencias.map((juris, index) => (
                <div key={index} className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{juris.tribunal}</p>
                      <p className="text-muted-foreground">{juris.numeroProcesso}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoverJurisprudencia(index)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
