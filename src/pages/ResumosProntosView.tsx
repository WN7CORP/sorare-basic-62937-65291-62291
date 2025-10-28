import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileDown, Sparkles, Search, ChevronRight, ArrowUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { formatForWhatsApp } from "@/lib/formatWhatsApp";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDeviceType } from "@/hooks/use-device-type";
interface Resumo {
  id: number;
  subtema: string;
  conteudo: string;
  conteudo_gerado?: {
    markdown?: string;
    exemplos?: string;
    termos?: string;
    gerado_em?: string;
  };
  "ordem subtema": string;
}
const ResumosProntosView = () => {
  const {
    area,
    tema
  } = useParams<{
    area: string;
    tema: string;
  }>();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const isMobile = useIsMobile();
  const { isDesktop } = useDeviceType();
  const [searchTerm, setSearchTerm] = useState("");
  const [resumoSelecionado, setResumoSelecionado] = useState<Resumo | null>(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [resumosGerados, setResumosGerados] = useState<Map<number, any>>(new Map());
  const [gerandoResumoId, setGerandoResumoId] = useState<number | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeTab, setActiveTab] = useState("resumo");
  const decodedArea = decodeURIComponent(area || "");
  const decodedTema = decodeURIComponent(tema || "");
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Listen to sidebar events
  useEffect(() => {
    const handleSelectResumo = (e: CustomEvent) => {
      const resumo = e.detail;
      setResumoSelecionado(resumo);
      if (!resumosGerados.has(resumo.id) && gerandoResumoId === null) {
        gerarResumo(resumo);
      }
    };
    window.addEventListener('selectResumo' as any, handleSelectResumo);
    return () => window.removeEventListener('selectResumo' as any, handleSelectResumo);
  }, [resumosGerados, gerandoResumoId]);
  const {
    data: resumos,
    isLoading
  } = useQuery({
    queryKey: ["resumos-subtemas", decodedArea, decodedTema],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("RESUMO").select("*").eq("area", decodedArea).eq("tema", decodedTema).not("subtema", "is", null).order("ordem subtema", {
        ascending: true
      });
      if (error) throw error;
      if (data.length > 0 && !resumoSelecionado) {
        setResumoSelecionado(data[0] as Resumo);
        const gerados = new Map<number, any>();
        data.forEach((resumo: any) => {
          if (resumo.conteudo_gerado) {
            gerados.set(resumo.id, resumo.conteudo_gerado);
          }
        });
        setResumosGerados(gerados);
      }
      return data as Resumo[];
    }
  });
  const resumosFiltrados = useMemo(() => {
    if (!resumos) return [];
    return resumos.filter(resumo => resumo.subtema.toLowerCase().includes(searchTerm.toLowerCase())).sort((a, b) => {
      const ordemA = parseFloat(a["ordem subtema"] || "0");
      const ordemB = parseFloat(b["ordem subtema"] || "0");
      return ordemA - ordemB;
    });
  }, [resumos, searchTerm]);
  const gerarResumo = async (resumo: Resumo) => {
    setGerandoResumoId(resumo.id);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke("gerar-resumo-pronto", {
        body: {
          resumoId: resumo.id,
          area: decodedArea,
          tema: decodedTema,
          subtema: resumo.subtema,
          conteudo: resumo.conteudo
        }
      });
      if (error) throw error;
      setResumosGerados(prev => new Map(prev).set(resumo.id, {
        markdown: data.resumo,
        exemplos: data.exemplos,
        termos: data.termos
      }));
      toast({
        title: data.fromCache ? "Resumo carregado!" : "Resumo gerado!",
        description: data.fromCache ? "Resumo carregado do cache" : "Resumo estruturado gerado com sucesso"
      });
    } catch (error: any) {
      console.error("Erro ao gerar resumo:", error);
      toast({
        title: "Erro ao gerar resumo",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive"
      });
    } finally {
      setGerandoResumoId(null);
    }
  };
  const exportarPDF = async (resumo: Resumo) => {
    const resumoGerado = resumosGerados.get(resumo.id);
    if (!resumoGerado?.markdown) {
      toast({
        title: "Gere o resumo primeiro",
        description: "Aguarde a geração antes de exportar",
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Gerando PDF...",
      description: "Isso pode levar alguns segundos"
    });
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke("exportar-resumo-pdf", {
        body: {
          resumo: resumoGerado.markdown,
          titulo: resumo.subtema
        }
      });
      if (error) throw error;
      
      // Decodificar base64 e criar blob
      const pdfBlob = await fetch(`data:application/pdf;base64,${data.pdf}`).then(r => r.blob());
      
      // Criar URL temporária e forçar download
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename || `resumo-${resumo.subtema}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "PDF baixado!",
        description: "O arquivo foi salvo no seu dispositivo"
      });
    } catch (error: any) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro ao gerar PDF",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive"
      });
    }
  };
  const compartilharWhatsApp = (resumo: Resumo) => {
    const resumoGerado = resumosGerados.get(resumo.id);
    if (!resumoGerado?.markdown) {
      toast({
        title: "Gere o resumo primeiro",
        description: "Clique para gerar antes de compartilhar",
        variant: "destructive"
      });
      return;
    }
    const textoFormatado = formatForWhatsApp(resumoGerado.markdown);
    
    // Cabeçalho mais visual para WhatsApp
    const cabecalho = `╔═══════════════════╗
📚 *RESUMO JURÍDICO*
╚═══════════════════╝

🎯 *Área:* ${decodedArea}
📖 *Tema:* ${decodedTema}
📝 *Subtema:* ${resumo.subtema}

━━━━━━━━━━━━━━━━━━━━`;

    const rodape = `━━━━━━━━━━━━━━━━━━━━

✨ _Gerado pelo Direito Premium_
📱 _Seu app de estudos jurídicos_`;

    const mensagem = `${cabecalho}\n\n${textoFormatado}\n\n${rodape}`;
    const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
    window.open(url, "_blank");
    
    toast({
      title: "Abrindo WhatsApp",
      description: "Resumo formatado com emojis e pronto para compartilhar!"
    });
  };
  if (isLoading) {
    return <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>;
  }
  if (!resumos || resumos.length === 0) {
    return <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/resumos-prontos/${area}`)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <p className="text-center text-muted-foreground">
          Nenhum resumo encontrado para este tema
        </p>
      </div>;
  }
  if (isMobile && showMobilePreview && resumoSelecionado) {
    return <div className="flex flex-col min-h-screen pb-20">
        <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="px-3 py-4">
            

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMobilePreview(false)}
              className="mb-3"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>

            <div className="mb-4">
              <div className="text-xs text-muted-foreground mb-1">{decodedArea}</div>
              <h1 className="text-lg font-bold">{resumoSelecionado.subtema}</h1>
            </div>

            {resumosGerados.has(resumoSelecionado.id) && <div className="flex gap-2">
                <Button onClick={() => exportarPDF(resumoSelecionado)} variant="outline" className="flex-1" size="sm">
                  <FileDown className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button onClick={() => compartilharWhatsApp(resumoSelecionado)} variant="outline" className="flex-1" size="sm">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  WhatsApp
                </Button>
              </div>}
          </div>
        </div>

        <div className="p-4">
          {!resumosGerados.has(resumoSelecionado.id) ? <Card>
              <CardContent className="p-8">
                <div className="text-center space-y-4">
                  <div className="inline-flex p-4 rounded-full bg-primary/10">
                    <span className="text-4xl">📄</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{resumoSelecionado.subtema}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Gerando resumo completo com IA...
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                      <span className="text-sm font-medium">Aguarde</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card> : <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="resumo">Resumo</TabsTrigger>
                <TabsTrigger value="exemplos">Exemplos</TabsTrigger>
                <TabsTrigger value="termos">Termos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="resumo">
                <Card>
                  <CardContent className="p-4 resumo-content resumo-markdown">
                    <ReactMarkdown>{resumosGerados.get(resumoSelecionado.id)?.markdown}</ReactMarkdown>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="exemplos">
                <Card>
                  <CardContent className="p-4 resumo-content resumo-markdown">
                    <ReactMarkdown>{resumosGerados.get(resumoSelecionado.id)?.exemplos || "Gerando exemplos..."}</ReactMarkdown>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="termos">
                <Card>
                  <CardContent className="p-4 resumo-content resumo-markdown">
                    <ReactMarkdown>{resumosGerados.get(resumoSelecionado.id)?.termos || "Gerando termos..."}</ReactMarkdown>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>}
        </div>
      </div>;
  }
  return <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-3 py-4 max-w-7xl mx-auto">
          <div className="mb-4">
            <div className="text-xs text-muted-foreground mb-1">{decodedArea}</div>
            <h1 className="text-xl md:text-2xl font-bold">{decodedTema}</h1>
          </div>

          {!isMobile && resumoSelecionado && resumosGerados.has(resumoSelecionado.id) && <div className="flex gap-2 mb-4">
              <Button onClick={() => exportarPDF(resumoSelecionado)} variant="outline" className="flex-1">
                <FileDown className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
              <Button onClick={() => compartilharWhatsApp(resumoSelecionado)} variant="outline" className="flex-1">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                WhatsApp
              </Button>
            </div>}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Pesquisar subtema..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
        </div>
      </div>

      <div className="flex max-w-7xl mx-auto">
        {/* Apenas renderizar sidebar se não for desktop, pois o Layout já cuida disso */}
        {!isDesktop && (
          <div className={isMobile ? "w-full px-3 py-4" : "w-80 border-r px-3 py-4"}>
            <div className="space-y-2">
              {resumosFiltrados.map(resumo => <Card key={resumo.id} className={`cursor-pointer transition-all hover:shadow-md hover:border-primary ${resumoSelecionado?.id === resumo.id && !isMobile ? "border-primary bg-primary/5" : ""} ${gerandoResumoId === resumo.id ? "opacity-50" : ""}`} onClick={() => {
              setResumoSelecionado(resumo);
              if (!resumosGerados.has(resumo.id) && gerandoResumoId === null) {
                gerarResumo(resumo);
              }
              if (isMobile) {
                setShowMobilePreview(true);
              }
            }}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-bold text-primary">
                          {resumo["ordem subtema"]}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm leading-tight">
                          {resumo.subtema}
                        </h3>
                        {gerandoResumoId === resumo.id && <span className="text-xs text-muted-foreground mt-1 block">
                            Gerando...
                          </span>}
                      </div>

                      <div className="flex-shrink-0">
                        {resumosGerados.has(resumo.id) ? <div className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center">
                            <span className="text-green-600 dark:text-green-400 text-base">✓</span>
                          </div> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                      </div>
                    </div>
                  </CardContent>
                </Card>)}
            </div>
          </div>
        )}

        {!isMobile && <div className={isDesktop ? "flex-1 p-6" : "flex-1 p-6"}>
            {resumoSelecionado ? !resumosGerados.has(resumoSelecionado.id) ? <Card>
                  <CardContent className="p-8">
                    <div className="text-center space-y-4">
                      <div className="inline-flex p-4 rounded-full bg-primary/10">
                        <span className="text-4xl">📄</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2">{resumoSelecionado.subtema}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Gerando resumo completo com IA...
                        </p>
                        <div className="flex items-center justify-center gap-2">
                          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                          <span className="text-sm font-medium">Aguarde</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card> : <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="resumo">Resumo</TabsTrigger>
                    <TabsTrigger value="exemplos">Exemplos Práticos</TabsTrigger>
                    <TabsTrigger value="termos">Termos Chaves</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="resumo">
                    <Card>
                      <CardContent className="p-6 resumo-content">
                        <ReactMarkdown>{resumosGerados.get(resumoSelecionado.id)?.markdown}</ReactMarkdown>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="exemplos">
                    <Card>
                      <CardContent className="p-6 resumo-content">
                        <ReactMarkdown>{resumosGerados.get(resumoSelecionado.id)?.exemplos || "Gerando exemplos..."}</ReactMarkdown>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="termos">
                    <Card>
                      <CardContent className="p-6 resumo-content">
                        <ReactMarkdown>{resumosGerados.get(resumoSelecionado.id)?.termos || "Gerando termos..."}</ReactMarkdown>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs> : <div className="text-center text-muted-foreground py-12">
                Selecione um subtema para visualizar
              </div>}
          </div>}
      </div>

      {showScrollTop && <Button className="fixed bottom-24 right-6 rounded-full w-12 h-12 p-0 shadow-lg z-50" onClick={() => window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })}>
          <ArrowUp className="w-5 h-5" />
        </Button>}
    </div>;
};
export default ResumosProntosView;