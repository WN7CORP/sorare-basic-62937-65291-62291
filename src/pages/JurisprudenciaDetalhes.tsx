import { useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, Star, Share2, Download, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DotLottiePlayer } from "@dotlottie/react-player";

const JurisprudenciaDetalhes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { numeroProcesso } = useParams();
  const jurisprudencia = location.state?.jurisprudencia;

  const [explicacao, setExplicacao] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [nivelSelecionado, setNivelSelecionado] = useState<"tecnico" | "simples" | null>(null);
  const [progress, setProgress] = useState(0);

  if (!jurisprudencia) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Jurisprudência não encontrada</p>
          <Button onClick={() => navigate("/jurisprudencia")}>
            Voltar para Busca
          </Button>
        </div>
      </div>
    );
  }

  const gerarExplicacao = async (nivel: "tecnico" | "simples") => {
    setNivelSelecionado(nivel);
    setIsGenerating(true);
    setProgress(0);
    setExplicacao("");

    try {
      const response = await fetch(
        `https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/explicar-jurisprudencia`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y`
          },
          body: JSON.stringify({
            jurisprudencia,
            nivel
          })
        }
      );

      if (!response.ok || !response.body) {
        throw new Error('Falha na requisição');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        setProgress(Math.min(95, progress + 5));

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                accumulatedContent += content;
                setExplicacao(accumulatedContent);
              }
            } catch (e) {
              console.error('Erro ao parsear chunk:', e);
            }
          }
        }
      }

      setProgress(100);
      toast({
        title: "Explicação gerada!",
        description: "A explicação foi gerada com sucesso",
      });
    } catch (error) {
      console.error("Erro ao gerar explicação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar a explicação",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const compartilharWhatsApp = () => {
    const mensagem = `*Jurisprudência: ${jurisprudencia.numeroProcesso}*\n\n*Tribunal:* ${jurisprudencia.tribunal}\n\n*Ementa:*\n${jurisprudencia.ementa}\n\nConsulte: ${jurisprudencia.link}`;
    const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="border-b border-border bg-card/95 backdrop-blur-lg px-3 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-sm font-bold">Detalhes da Jurisprudência</h1>
            <p className="text-xs text-muted-foreground">{jurisprudencia.numeroProcesso}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={compartilharWhatsApp}>
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-4xl mx-auto px-3 py-4">
        <Card className="mb-4">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{jurisprudencia.tribunal}</Badge>
              {jurisprudencia.temaJuridico && (
                <Badge variant="outline">{jurisprudencia.temaJuridico}</Badge>
              )}
            </div>

            <div>
              <h2 className="font-bold mb-1">{jurisprudencia.numeroProcesso}</h2>
              <p className="text-sm text-muted-foreground">{jurisprudencia.orgaoJulgador}</p>
              {jurisprudencia.dataJulgamento && (
                <p className="text-sm text-muted-foreground">
                  {new Date(jurisprudencia.dataJulgamento).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => window.open(jurisprudencia.link, '_blank')}
                className="flex-1 gap-1"
              >
                <ExternalLink className="w-4 h-4" />
                Ver no Tribunal
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="ementa" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ementa">Ementa</TabsTrigger>
            <TabsTrigger value="explicacao">Explicação IA</TabsTrigger>
          </TabsList>

          <TabsContent value="ementa" className="mt-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-bold mb-3">Ementa Completa</h3>
                <p className="text-sm text-justify leading-relaxed whitespace-pre-wrap">
                  {jurisprudencia.ementa}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="explicacao" className="mt-4">
            <Card>
              <CardContent className="p-4">
                {!nivelSelecionado && !isGenerating && !explicacao && (
                  <div className="text-center py-8 space-y-4">
                    <Sparkles className="w-12 h-12 mx-auto text-primary" />
                    <div>
                      <h3 className="font-bold mb-2">Escolha o nível de explicação</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Selecione como deseja que a IA explique esta jurisprudência
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                      <Button
                        onClick={() => gerarExplicacao("tecnico")}
                        className="flex-1"
                      >
                        🎓 Técnico
                      </Button>
                      <Button
                        onClick={() => gerarExplicacao("simples")}
                        variant="outline"
                        className="flex-1"
                      >
                        💡 Simplificado
                      </Button>
                    </div>
                  </div>
                )}

                {isGenerating && (
                  <div className="text-center py-8">
                    <DotLottiePlayer
                      src="https://lottie.host/542f6e8e-cbf1-4d80-ad7a-ed9584c815c6/yfYXOPUtbr.lottie"
                      autoplay
                      loop
                      style={{ width: 200, height: 200, margin: '0 auto' }}
                    />
                    <p className="text-sm font-medium mb-2">Gerando explicação...</p>
                    <div className="w-48 mx-auto h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {explicacao && (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {explicacao}
                    </ReactMarkdown>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default JurisprudenciaDetalhes;
