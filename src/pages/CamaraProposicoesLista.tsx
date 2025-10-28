import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ContentGenerationLoader } from "@/components/ContentGenerationLoader";
import { ProposicaoCard } from "@/components/ProposicaoCard";

const CamaraProposicoesLista = () => {
  const { tipo } = useParams();
  const navigate = useNavigate();
  const [ano, setAno] = useState(new Date().getFullYear().toString());
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [proposicoes, setProposicoes] = useState<any[]>([]);
  const { toast } = useToast();

  const anos = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    if (tipo) {
      handleBuscar();
    }
  }, [tipo]);

  const handleBuscar = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "buscar-proposicoes",
        {
          body: { 
            siglaTipo: tipo,
            ano: ano || undefined,
            keywords: keywords || undefined
          },
        }
      );

      if (error) throw error;
      setProposicoes(data.proposicoes || []);
      
      if (data.proposicoes?.length === 0) {
        toast({
          title: "Nenhuma proposição encontrada",
          description: "Tente ajustar os filtros",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro na busca",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1">{tipo}</h1>
        <p className="text-sm text-muted-foreground">Lista de proposições do tipo {tipo}</p>
      </div>

      <Card className="bg-card border-border mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ano</Label>
              <select
                value={ano}
                onChange={(e) => setAno(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {anos.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="keywords">Palavras-chave</Label>
              <Input
                id="keywords"
                placeholder="Digite palavras-chave"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={handleBuscar} className="w-full bg-yellow-600 hover:bg-yellow-700" disabled={loading}>
            <Search className="w-4 h-4 mr-2" />
            Buscar
          </Button>
        </CardContent>
      </Card>

      {loading && <ContentGenerationLoader message="Buscando proposições..." />}

      {proposicoes.length > 0 && !loading && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{proposicoes.length} proposição(ões) encontrada(s)</p>
          {proposicoes.map((proposicao) => (
            <ProposicaoCard 
              key={proposicao.id} 
              proposicao={proposicao}
              onClick={() => navigate(`/camara-deputados/proposicao/${proposicao.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CamaraProposicoesLista;