import React, { useState } from "react";
import { FileDown, Sparkles, HelpCircle, Lightbulb, Share2, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ExplicacaoDetalhadaModal from "./ExplicacaoDetalhadaModal";

interface MessageActionsChatProps {
  content: string;
  onCreateLesson: () => void;
  onSummarize: () => void;
  onGenerateFlashcards: () => void;
  onGenerateQuestions: () => void;
}

export const MessageActionsChat = ({
  content,
  onCreateLesson,
  onSummarize,
  onGenerateFlashcards,
  onGenerateQuestions,
}: MessageActionsChatProps) => {
  const { toast } = useToast();
  const [exportingPDF, setExportingPDF] = useState(false);
  const [showExplicacaoDetalhada, setShowExplicacaoDetalhada] = useState(false);

  const shareViaWhatsApp = () => {
    // Remove markdown formatting for plain text WhatsApp sharing
    const plainText = content
      .replace(/[#*_`~]/g, '') // Remove markdown symbols
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to plain text
      .trim();
    
    const whatsappText = encodeURIComponent(plainText);
    const whatsappUrl = `https://wa.me/?text=${whatsappText}`;
    window.open(whatsappUrl, '_blank');
  };

  const exportToPDF = async () => {
    setExportingPDF(true);
    try {
      const { data, error } = await supabase.functions.invoke('exportar-pdf-educacional', {
        body: { 
          content: content,
          filename: `professora-juridica-${Date.now()}`,
          title: "Professora Jurídica",
        }
      });
      
      if (error) throw error;
      
      window.open(data.pdfUrl, '_blank');
      
      toast({
        title: "PDF gerado!",
        description: "O PDF foi aberto em uma nova aba.",
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o PDF",
        variant: "destructive",
      });
    } finally {
      setExportingPDF(false);
    }
  };

  return (
    <>
      <ExplicacaoDetalhadaModal
        isOpen={showExplicacaoDetalhada}
        onClose={() => setShowExplicacaoDetalhada(false)}
        conteudo={content}
      />
      
      <div className="mt-4 space-y-2">
        {/* Botão destacado - Aprofundar */}
        <Button
          onClick={onCreateLesson}
          className="w-full bg-gradient-to-r from-accent to-primary hover:opacity-90"
          size="sm"
        >
          <Brain className="w-4 h-4 mr-2" />
          Aprofundar
        </Button>

        {/* Grid de ações - 2x3 */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSummarize}
            className="text-xs h-9"
          >
            <Lightbulb className="w-3.5 h-3.5 mr-1" />
            Resumir
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onGenerateFlashcards}
            className="text-xs h-9"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Flashcards
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onGenerateQuestions}
            className="text-xs h-9"
          >
            <HelpCircle className="w-3.5 h-3.5 mr-1" />
            Questões
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={shareViaWhatsApp}
            className="text-xs h-9 col-span-2"
          >
            <Share2 className="w-3.5 h-3.5 mr-1" />
            WhatsApp
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportToPDF}
            disabled={exportingPDF}
            className="text-xs h-9"
          >
            <FileDown className="w-3.5 h-3.5 mr-1" />
            {exportingPDF ? "..." : "PDF"}
          </Button>
        </div>
      </div>
    </>
  );
};
