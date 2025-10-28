import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, FileUp, ChevronRight, ChevronLeft, CheckCircle2, FileText, Upload } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { exportPeticaoPDF } from "@/components/PeticaoPDFExporter";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface Jurisprudencia {
  numeroProcesso: string;
  tribunal: string;
  orgaoJulgador: string;
  dataJulgamento: string;
  ementa: string;
  link: string;
}

const AdvogadoCriar = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [metodoDescricao, setMetodoDescricao] = useState<"digitar" | "importar" | null>(null);
  const [descricaoCaso, setDescricaoCaso] = useState("");
  const [areaDireito, setAreaDireito] = useState("");
  const [tipoPeticao, setTipoPeticao] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [peticaoGerada, setPeticaoGerada] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [jurisprudenciasSugeridas, setJurisprudenciasSugeridas] = useState<Jurisprudencia[]>([]);
  const [jurisprudenciasSelecionadas, setJurisprudenciasSelecionadas] = useState<number[]>([]);
  const [isBuscandoJuris, setIsBuscandoJuris] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 5MB",
          variant: "destructive",
        });
        return;
      }
      setUploadedFile(file);
      setMetodoDescricao("importar");
      toast({
        title: "Arquivo carregado",
        description: file.name,
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
  });

  const gerarPeticaoCompleta = async () => {
    setIsGenerating(true);
    
    try {
      // Gerar todas as 3 etapas em sequência
      const resultados = [];
      
      for (let etapa = 1; etapa <= 3; etapa++) {
        const contextoAnterior = resultados.join('\n\n');
        
        const { data, error } = await supabase.functions.invoke("gerar-peticao", {
          body: {
            descricaoCaso,
            areaDireito,
            tipoPeticao,
            pdfTexto: uploadedFile ? "Documento PDF anexado" : "",
            etapa,
            contextoAnterior,
          },
        });

        if (error) throw error;
        resultados.push(data.conteudo);
      }

      setPeticaoGerada(resultados.join('\n\n'));
      setCurrentStep(4);
      
      toast({
        title: "Petição gerada com sucesso!",
        description: "Revise o conteúdo antes de finalizar",
      });
    } catch (error) {
      console.error("Erro ao gerar petição:", error);
      toast({
        title: "Erro ao gerar petição",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const buscarJurisprudencias = async () => {
    setIsBuscandoJuris(true);
    
    try {
      const termoBusca = `${areaDireito} ${tipoPeticao}`;
      const { data, error } = await supabase.functions.invoke("buscar-jurisprudencia", {
        body: { termo: termoBusca, limite: 3 },
      });

      if (error) throw error;

      setJurisprudenciasSugeridas(data.jurisprudencias || []);
      
      if (!data.jurisprudencias || data.jurisprudencias.length === 0) {
        toast({
          title: "Nenhuma jurisprudência encontrada",
          description: "Continue mesmo assim ou refine os termos",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar jurisprudências:", error);
      toast({
        title: "Erro ao buscar jurisprudências",
        description: "Você pode continuar sem jurisprudências",
      });
    } finally {
      setIsBuscandoJuris(false);
    }
  };

  const toggleJurisprudencia = (index: number) => {
    if (jurisprudenciasSelecionadas.includes(index)) {
      setJurisprudenciasSelecionadas(jurisprudenciasSelecionadas.filter(i => i !== index));
    } else {
      setJurisprudenciasSelecionadas([...jurisprudenciasSelecionadas, index]);
    }
  };

  const handleProximoPasso = () => {
    if (currentStep === 1 && !metodoDescricao) {
      toast({
        title: "Escolha um método",
        description: "Selecione como deseja descrever o caso",
        variant: "destructive",
      });
      return;
    }

    if (currentStep === 1 && metodoDescricao === "digitar" && !descricaoCaso.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Digite a descrição do caso",
        variant: "destructive",
      });
      return;
    }

    if (currentStep === 1 && metodoDescricao === "importar" && !uploadedFile) {
      toast({
        title: "Arquivo não importado",
        description: "Faça upload do PDF com a descrição",
        variant: "destructive",
      });
      return;
    }

    if (currentStep === 2 && !areaDireito) {
      toast({
        title: "Campo obrigatório",
        description: "Selecione a área do direito",
        variant: "destructive",
      });
      return;
    }

    if (currentStep === 3 && !tipoPeticao) {
      toast({
        title: "Campo obrigatório",
        description: "Selecione o tipo de petição",
        variant: "destructive",
      });
      return;
    }

    if (currentStep === 3) {
      // Ao finalizar passo 3, gerar a petição
      gerarPeticaoCompleta();
      return;
    }

    if (currentStep === 4) {
      // Ao avançar do passo 4, buscar jurisprudências
      buscarJurisprudencias();
    }

    setCurrentStep(currentStep + 1);
  };

  const handleExportarPDF = () => {
    const jurisprudenciasPDF = jurisprudenciasSelecionadas.map(i => jurisprudenciasSugeridas[i]);
    
    exportPeticaoPDF({
      titulo: `${tipoPeticao} - ${areaDireito}`,
      conteudo: {
        etapa1: peticaoGerada.split('\n\n')[0] || "",
        etapa2: peticaoGerada.split('\n\n')[1] || "",
        etapa3: peticaoGerada.split('\n\n')[2] || "",
      },
      jurisprudencias: jurisprudenciasPDF,
    });
  };

  const steps = [
    { numero: 1, titulo: "Descrição do Caso", concluido: currentStep > 1 },
    { numero: 2, titulo: "Área do Direito", concluido: currentStep > 2 },
    { numero: 3, titulo: "Tipo de Petição", concluido: currentStep > 3 },
    { numero: 4, titulo: "Preview da Petição", concluido: currentStep > 4 },
    { numero: 5, titulo: "Jurisprudências", concluido: currentStep > 5 },
    { numero: 6, titulo: "Finalizar", concluido: false },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header com Progresso */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold mb-4">Criar Petição com IA</h1>
          
          {/* Stepper */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.numero} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    step.concluido 
                      ? "bg-green-600 text-white" 
                      : currentStep === step.numero
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}>
                    {step.concluido ? <CheckCircle2 className="w-4 h-4" /> : step.numero}
                  </div>
                  <span className="text-xs mt-1 hidden md:block text-center">{step.titulo}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 transition-colors ${
                    step.concluido ? "bg-green-600" : "bg-muted"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Conteúdo dos Passos */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Passo 1: Descrição do Caso */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Como você deseja descrever o caso?</CardTitle>
              <CardDescription>Escolha a forma mais conveniente para você</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card 
                  className={`cursor-pointer transition-all border-2 ${
                    metodoDescricao === "digitar" 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setMetodoDescricao("digitar")}
                >
                  <CardContent className="p-6 text-center">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-primary" />
                    <h3 className="font-semibold mb-2">Digitar Descrição</h3>
                    <p className="text-sm text-muted-foreground">
                      Descreva o caso diretamente no campo de texto
                    </p>
                  </CardContent>
                </Card>

                <Card 
                  className={`cursor-pointer transition-all border-2 ${
                    metodoDescricao === "importar" 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setMetodoDescricao("importar")}
                >
                  <CardContent className="p-6 text-center">
                    <Upload className="w-12 h-12 mx-auto mb-3 text-primary" />
                    <h3 className="font-semibold mb-2">Importar PDF</h3>
                    <p className="text-sm text-muted-foreground">
                      Faça upload de um documento com a descrição
                    </p>
                  </CardContent>
                </Card>
              </div>

              {metodoDescricao === "digitar" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Descrição Detalhada do Caso *</label>
                  <Textarea
                    placeholder="Descreva os fatos relevantes, partes envolvidas, histórico do caso e objetivo da petição..."
                    value={descricaoCaso}
                    onChange={(e) => setDescricaoCaso(e.target.value)}
                    className="min-h-[200px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Quanto mais detalhes, melhor será a petição gerada
                  </p>
                </div>
              )}

              {metodoDescricao === "importar" && (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                  }`}
                >
                  <input {...getInputProps()} />
                  <FileUp className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  {uploadedFile ? (
                    <div>
                      <p className="font-medium mb-1">{uploadedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(uploadedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium mb-1">
                        Arraste um PDF ou clique para selecionar
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Máximo 5MB
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Passo 2: Área do Direito */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Selecione a Área do Direito</CardTitle>
              <CardDescription>Escolha a área jurídica relacionada ao caso</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={areaDireito} onValueChange={setAreaDireito}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a área..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="civil">Direito Civil</SelectItem>
                  <SelectItem value="penal">Direito Penal</SelectItem>
                  <SelectItem value="trabalhista">Direito Trabalhista</SelectItem>
                  <SelectItem value="tributario">Direito Tributário</SelectItem>
                  <SelectItem value="administrativo">Direito Administrativo</SelectItem>
                  <SelectItem value="consumidor">Direito do Consumidor</SelectItem>
                  <SelectItem value="familia">Direito de Família</SelectItem>
                  <SelectItem value="empresarial">Direito Empresarial</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Passo 3: Tipo de Petição */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Selecione o Tipo de Petição</CardTitle>
              <CardDescription>Escolha qual documento você precisa gerar</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={tipoPeticao} onValueChange={setTipoPeticao}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o tipo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Petição Inicial">Petição Inicial</SelectItem>
                  <SelectItem value="Contestação">Contestação</SelectItem>
                  <SelectItem value="Recurso">Recurso</SelectItem>
                  <SelectItem value="Agravo">Agravo</SelectItem>
                  <SelectItem value="Apelação">Apelação</SelectItem>
                  <SelectItem value="Embargos de Declaração">Embargos de Declaração</SelectItem>
                  <SelectItem value="Mandado de Segurança">Mandado de Segurança</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Passo 4: Preview da Petição */}
        {currentStep === 4 && (
          <Card className="min-h-[70vh]">
            <CardHeader>
              <CardTitle>Preview da Petição</CardTitle>
              <CardDescription>Revise o documento gerado antes de adicionar jurisprudências</CardDescription>
            </CardHeader>
            <CardContent>
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                  <p className="text-lg font-medium mb-2">Gerando sua petição...</p>
                  <p className="text-sm text-muted-foreground">Isso pode levar alguns instantes</p>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{peticaoGerada}</ReactMarkdown>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Passo 5: Jurisprudências */}
        {currentStep === 5 && (
          <Card>
            <CardHeader>
              <CardTitle>Jurisprudências Sugeridas</CardTitle>
              <CardDescription>
                Selecionamos jurisprudências relacionadas ao seu caso. Escolha as que deseja incluir (opcional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isBuscandoJuris ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                  <p className="text-sm text-muted-foreground">Buscando jurisprudências relevantes...</p>
                </div>
              ) : jurisprudenciasSugeridas.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">Nenhuma jurisprudência encontrada</p>
                  <p className="text-sm text-muted-foreground">Você pode continuar sem jurisprudências</p>
                </div>
              ) : (
                jurisprudenciasSugeridas.map((juris, index) => (
                  <Card 
                    key={index}
                    className={`cursor-pointer transition-all border-2 ${
                      jurisprudenciasSelecionadas.includes(index)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                    onClick={() => toggleJurisprudencia(index)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox 
                          checked={jurisprudenciasSelecionadas.includes(index)}
                          onCheckedChange={() => toggleJurisprudencia(index)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <Badge variant="secondary" className="mb-2">{juris.tribunal}</Badge>
                              <p className="font-semibold text-sm">{juris.numeroProcesso}</p>
                              <p className="text-xs text-muted-foreground">{juris.orgaoJulgador}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(juris.link, "_blank");
                              }}
                            >
                              Ver completo
                            </Button>
                          </div>
                          <p className="text-sm line-clamp-3">{juris.ementa}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* Passo 6: Finalizar */}
        {currentStep === 6 && (
          <Card>
            <CardHeader>
              <CardTitle>Petição Concluída!</CardTitle>
              <CardDescription>Sua petição está pronta. Exporte em PDF ou copie o texto.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Tipo:</span>
                  <span className="text-sm">{tipoPeticao}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Área:</span>
                  <span className="text-sm">{areaDireito}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Jurisprudências:</span>
                  <span className="text-sm">{jurisprudenciasSelecionadas.length} selecionadas</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => {
                    navigator.clipboard.writeText(peticaoGerada);
                    toast({ title: "Texto copiado!" });
                  }}
                  className="w-full"
                >
                  Copiar Texto
                </Button>
                <Button 
                  size="lg"
                  onClick={handleExportarPDF}
                  className="w-full"
                >
                  Exportar PDF
                </Button>
              </div>

              <Button 
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setCurrentStep(1);
                  setMetodoDescricao(null);
                  setDescricaoCaso("");
                  setAreaDireito("");
                  setTipoPeticao("");
                  setUploadedFile(null);
                  setPeticaoGerada("");
                  setJurisprudenciasSugeridas([]);
                  setJurisprudenciasSelecionadas([]);
                }}
              >
                Criar Nova Petição
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Botões de Navegação */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1 || isGenerating || isBuscandoJuris}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          {currentStep < 6 && (
            <Button
              onClick={handleProximoPasso}
              disabled={isGenerating || isBuscandoJuris}
            >
              {isGenerating || isBuscandoJuris ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  {currentStep === 3 ? "Gerar Petição" : "Próximo"}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvogadoCriar;