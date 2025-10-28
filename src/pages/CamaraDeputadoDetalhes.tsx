import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Phone, User, MapPin, Flag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ContentGenerationLoader } from "@/components/ContentGenerationLoader";
import { DespesaCard } from "@/components/DespesaCard";

const CamaraDeputadoDetalhes = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadingDespesas, setLoadingDespesas] = useState(false);
  const [deputado, setDeputado] = useState<any>(null);
  const [despesas, setDespesas] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      carregarDetalhes();
    }
  }, [id]);

  const carregarDetalhes = async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "detalhes-deputado",
        { body: { idDeputado: id } }
      );

      if (error) throw error;
      setDeputado(data.deputado);
    } catch (error: any) {
      console.error("Erro ao carregar:", error);
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const carregarDespesas = async () => {
    if (!id) return;
    
    setLoadingDespesas(true);
    try {
      const anoAtual = new Date().getFullYear();
      const { data, error } = await supabase.functions.invoke(
        "deputado-despesas",
        { body: { idDeputado: id, ano: anoAtual } }
      );

      if (error) throw error;
      setDespesas(data.despesas || []);
    } catch (error: any) {
      console.error("Erro ao carregar despesas:", error);
      toast({
        title: "Erro ao carregar despesas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingDespesas(false);
    }
  };

  if (loading) {
    return <ContentGenerationLoader message="Carregando dados do deputado..." />;
  }

  if (!deputado) {
    return (
      <div className="px-3 py-4 max-w-4xl mx-auto">
        <p className="text-center text-muted-foreground">Deputado não encontrado</p>
      </div>
    );
  }

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <Button
        variant="ghost"
        onClick={() => navigate("/camara-deputados/deputados")}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>

      <Card className="bg-card border-border mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {deputado.ultimoStatus?.urlFoto ? (
              <img
                src={deputado.ultimoStatus.urlFoto}
                alt={deputado.nomeCivil}
                className="w-32 h-32 rounded-lg object-cover shadow-lg"
              />
            ) : (
              <div className="w-32 h-32 rounded-lg bg-gray-700 flex items-center justify-center">
                <User className="w-16 h-16 text-gray-400" />
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{deputado.nomeCivil}</h1>
              <p className="text-lg text-muted-foreground mb-4">
                {deputado.ultimoStatus?.nomeEleitoral}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-green-500" />
                  <span>{deputado.ultimoStatus?.siglaPartido}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <span>{deputado.ultimoStatus?.siglaUf}</span>
                </div>
                {deputado.ultimoStatus?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-amber-500" />
                    <a href={`mailto:${deputado.ultimoStatus.email}`} className="hover:underline text-sm">
                      {deputado.ultimoStatus.email}
                    </a>
                  </div>
                )}
                {deputado.ultimoStatus?.gabinete?.telefone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">{deputado.ultimoStatus.gabinete.telefone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {deputado.cpf && (
        <Card className="bg-card border-border mb-6">
          <CardHeader>
            <CardTitle>Informações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                <p className="font-medium">{new Date(deputado.dataNascimento).toLocaleDateString('pt-BR')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Município de Nascimento</p>
                <p className="font-medium">{deputado.municipioNascimento} - {deputado.ufNascimento}</p>
              </div>
              {deputado.escolaridade && (
                <div>
                  <p className="text-sm text-muted-foreground">Escolaridade</p>
                  <p className="font-medium">{deputado.escolaridade}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card border-border mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Despesas (Ano Atual)</CardTitle>
            {despesas.length === 0 && (
              <Button 
                onClick={carregarDespesas} 
                disabled={loadingDespesas}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Carregar Despesas
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loadingDespesas && <ContentGenerationLoader message="Carregando despesas..." />}
          
          {despesas.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                Total: {despesas.reduce((sum, d) => sum + d.valorLiquido, 0).toLocaleString('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                })}
              </p>
              {despesas.slice(0, 10).map((despesa, index) => (
                <DespesaCard key={index} despesa={despesa} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CamaraDeputadoDetalhes;
