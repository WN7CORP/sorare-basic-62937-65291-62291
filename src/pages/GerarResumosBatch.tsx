import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ResultadoResumo {
  id: number;
  area: string;
  tema: string;
  subtema: string;
  status: string;
  erro?: string;
}

interface ResultadoBatch {
  total: number;
  processados: number;
  jaGerados: number;
  erros: number;
  detalhes: ResultadoResumo[];
}

export default function GerarResumosBatch() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultado, setResultado] = useState<ResultadoBatch | null>(null);
  const [batchSize, setBatchSize] = useState(10);
  const [logs, setLogs] = useState<string[]>([]);

  const iniciarGeracao = async () => {
    setIsProcessing(true);
    setResultado(null);
    setLogs([]);

    const addLog = (msg: string) => {
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    try {
      addLog('🚀 Iniciando geração de resumos em lote...');
      addLog(`📦 Tamanho do lote: ${batchSize} resumos`);
      
      const { data, error } = await supabase.functions.invoke('gerar-todos-resumos', {
        body: { batchSize }
      });

      if (error) {
        addLog(`❌ Erro na chamada: ${error.message}`);
        throw error;
      }

      addLog('✅ Processamento concluído!');
      addLog(`📊 Total processado: ${data.total} resumos`);
      addLog(`✨ Gerados com sucesso: ${data.processados}`);
      addLog(`💾 Já existiam: ${data.jaGerados}`);
      addLog(`⚠️ Erros: ${data.erros}`);

      setResultado(data);
      
      if (data.processados > 0) {
        toast.success(`${data.processados} resumos gerados com sucesso!`);
      }
      
      if (data.erros > 0) {
        toast.error(`${data.erros} resumos falharam na geração`);
      }

      if (data.total === 0) {
        toast.info("Nenhum resumo pendente encontrado");
      }

    } catch (error) {
      console.error("Erro ao gerar resumos:", error);
      toast.error("Erro ao processar geração em lote");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Geração Automática de Resumos</CardTitle>
            <CardDescription>
              Processa resumos pendentes automaticamente em lote
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium">
                  Tamanho do Lote: {batchSize} resumos
                </label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={batchSize}
                  onChange={(e) => setBatchSize(Number(e.target.value))}
                  disabled={isProcessing}
                  className="w-full mt-2"
                />
              </div>
              <Button
                onClick={iniciarGeracao}
                disabled={isProcessing}
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Iniciar Geração"
                )}
              </Button>
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <Progress value={undefined} className="w-full" />
                <p className="text-sm text-muted-foreground text-center">
                  Gerando resumos... Este processo pode levar alguns minutos.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {logs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Logs de Processamento</CardTitle>
              <CardDescription>
                Acompanhe o progresso em tempo real
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] rounded-md border bg-black/95 p-4 font-mono text-sm">
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <div key={index} className="text-green-400">
                      {log}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {resultado && (
          <Card>
            <CardHeader>
              <CardTitle>Resultado do Processamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{resultado.total}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
                <div className="text-center p-4 bg-green-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {resultado.processados}
                  </div>
                  <div className="text-sm text-muted-foreground">Gerados</div>
                </div>
                <div className="text-center p-4 bg-blue-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {resultado.jaGerados}
                  </div>
                  <div className="text-sm text-muted-foreground">Já Existiam</div>
                </div>
                <div className="text-center p-4 bg-red-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {resultado.erros}
                  </div>
                  <div className="text-sm text-muted-foreground">Erros</div>
                </div>
              </div>

              <ScrollArea className="h-[400px] rounded-md border p-4">
                <div className="space-y-2">
                  {resultado.detalhes.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      {item.status === "sucesso" && (
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      )}
                      {item.status === "já_gerado" && (
                        <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      )}
                      {item.status === "erro" && (
                        <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {item.area} &gt; {item.tema}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {item.subtema}
                        </div>
                        {item.erro && (
                          <div className="text-sm text-red-600 mt-1">
                            {item.erro}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
