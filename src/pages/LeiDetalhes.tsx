import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ExternalLink, FileDown, Share2, Sparkles, Calendar, Scale, BookOpen, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import ExplicacaoSimpleModal from "@/components/ExplicacaoSimpleModal";

const LeiDetalhes = () => {
  const { idNorma } = useParams<{ idNorma: string }>();
  const navigate = useNavigate();
  const [showExplicacao, setShowExplicacao] = useState(false);

  const { data: lei, isLoading } = useQuery({
    queryKey: ['lei-detalhes', idNorma],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cache_leis_recentes')
        .select('*')
        .eq('id_norma', decodeURIComponent(idNorma || ''))
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!idNorma,
  });

  const formatarData = (data: string) => {
    try {
      return format(new Date(data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return data;
    }
  };

  const handleCompartilhar = () => {
    const texto = `${lei?.tipo} nº ${lei?.numero}/${lei?.ano}\n\n${lei?.titulo_gerado_ia}\n\nVeja mais em: ${window.location.href}`;
    
    if (navigator.share) {
      navigator.share({
        title: `${lei?.tipo} nº ${lei?.numero}/${lei?.ano}`,
        text: texto,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(texto);
      toast.success("Link copiado para a área de transferência!");
    }
  };

  const getBadgeColor = () => {
    if (lei?.tipo.includes('Lei')) return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    if (lei?.tipo.includes('Decreto')) return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    if (lei?.tipo.includes('Medida')) return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    return 'bg-accent/10 text-accent border-accent/20';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando detalhes da lei...</p>
        </div>
      </div>
    );
  }

  if (!lei) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Lei não encontrada</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Detalhes da Lei</h1>
      </div>

      {/* Card principal */}
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={getBadgeColor()}>
              {lei.tipo}
            </Badge>
            {lei.autoridade && (
              <Badge variant="outline" className="bg-muted">
                {lei.autoridade}
              </Badge>
            )}
            {lei.codigo_relacionado && lei.codigo_relacionado !== 'Outro' && (
              <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                {lei.codigo_relacionado}
              </Badge>
            )}
          </div>

          <CardTitle className="text-xl md:text-2xl flex items-start gap-3">
            <Scale className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
            <span>{lei.tipo} nº {lei.numero}/{lei.ano}</span>
          </CardTitle>

          <h2 className="text-lg font-semibold text-foreground leading-tight">
            {lei.titulo_gerado_ia}
          </h2>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Publicada em {formatarData(lei.data_publicacao)}</span>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="space-y-6 pt-6">
          {/* Ementa completa */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent" />
              Ementa Oficial
            </h3>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {lei.ementa}
            </p>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setShowExplicacao(true)}
              className="flex-1 min-w-[200px]"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Explicar com IA
            </Button>

            {lei.link_texto_integral && (
              <Button
                variant="outline"
                onClick={() => window.open(lei.link_texto_integral, '_blank')}
                className="flex-1 min-w-[200px]"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Texto Integral
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {lei.link_pdf && (
              <Button
                variant="outline"
                onClick={() => window.open(lei.link_pdf, '_blank')}
                className="flex-1 min-w-[200px]"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Baixar PDF
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handleCompartilhar}
              className="flex-1 min-w-[200px]"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Compartilhar
            </Button>
          </div>

          {/* Informações adicionais */}
          <Card className="bg-muted/30">
            <CardContent className="pt-6 space-y-3">
              <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-accent" />
                Informações Adicionais
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Identificador:</span>
                  <span className="font-mono text-foreground">{lei.id_norma}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo de norma:</span>
                  <span className="text-foreground">{lei.tipo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Esfera:</span>
                  <span className="text-foreground">{lei.autoridade}</span>
                </div>
                {lei.codigo_relacionado && lei.codigo_relacionado !== 'Outro' && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Área relacionada:</span>
                    <span className="text-foreground font-medium">{lei.codigo_relacionado}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Modal de Explicação */}
      <ExplicacaoSimpleModal
        isOpen={showExplicacao}
        onClose={() => setShowExplicacao(false)}
        conteudo={`${lei.tipo} nº ${lei.numero}/${lei.ano}\n\nEmenta: ${lei.ementa}`}
        titulo={lei.titulo_gerado_ia}
      />
    </div>
  );
};

export default LeiDetalhes;