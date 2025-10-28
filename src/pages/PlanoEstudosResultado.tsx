import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const PlanoEstudosResultado = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { plano, materia, totalHoras } = location.state || {};
  const [exportingPDF, setExportingPDF] = useState(false);

  if (!plano) {
    navigate("/plano-estudos");
    return null;
  }

  const handleExportPDF = async () => {
    setExportingPDF(true);
    try {
      const { data, error } = await supabase.functions.invoke('exportar-pdf-educacional', {
        body: { 
          content: plano,
          filename: `plano-estudos-${materia?.toLowerCase().replace(/\s+/g, '-')}`,
          title: `Plano de Estudos: ${materia}`,
          darkMode: true, // Ativar modo escuro com margens ABNT
        }
      });
      
      if (error) throw error;
      
      window.open(data.pdfUrl, '_blank');
      
      toast({
        title: "PDF gerado!",
        description: "O PDF com fundo escuro foi aberto em uma nova aba.",
      });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o PDF. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setExportingPDF(false);
    }
  };

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/plano-estudos")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Plano Criado</h1>
          <p className="text-sm text-muted-foreground">
            Seu cronograma personalizado está pronto
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Info card */}
        <Card className="bg-accent/10 border-accent/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Matéria</p>
                <p className="font-semibold text-foreground">{materia}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Carga Total</p>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-accent" />
                  <p className="font-semibold text-accent">{totalHoras}h</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botão de exportar */}
        <Button onClick={handleExportPDF} disabled={exportingPDF} className="w-full" size="lg">
          <Download className="w-4 h-4 mr-2" />
          {exportingPDF ? "Gerando PDF..." : "Exportar PDF"}
        </Button>

        {/* Conteúdo do plano */}
        <Card className="border-accent/20">
          <CardContent className="p-6">
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {plano}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>

        {/* Botão para novo plano */}
        <Button
          onClick={() => navigate("/plano-estudos")}
          variant="outline"
          className="w-full"
        >
          Criar Novo Plano
        </Button>
      </div>
    </div>
  );
};

export default PlanoEstudosResultado;
