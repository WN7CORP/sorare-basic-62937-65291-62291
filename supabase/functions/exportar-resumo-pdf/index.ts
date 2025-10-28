import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumo, titulo, videoId } = await req.json();
    
    if (!resumo || !titulo) {
      throw new Error("Resumo e título são obrigatórios");
    }

    console.log("Gerando PDF ABNT formatado em Markdown para:", titulo);

    // Importar jsPDF dinamicamente
    const jsPDF = (await import("https://esm.sh/jspdf@2.5.1")).default;
    
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Configurações ABNT - Margens corretas
    const margemEsquerda = 30; // 3cm
    const margemDireita = 20; // 2cm
    const margemSuperior = 30; // 3cm
    const margemInferior = 20; // 2cm
    const larguraUtil = 210 - margemEsquerda - margemDireita;
    let y = margemSuperior;
    let pageNumber = 1;

    // Função para processar negrito (**texto**)
    const processarNegrito = (texto: string, x: number, maxWidth: number): { lines: string[], hasBold: boolean } => {
      const parts = texto.split(/(\*\*.*?\*\*)/g);
      let hasBold = false;
      
      // Remover os asteriscos mas manter marcação
      const cleanParts = parts.map(part => {
        if (part.startsWith('**') && part.endsWith('**')) {
          hasBold = true;
          return { text: part.replace(/\*\*/g, ''), bold: true };
        }
        return { text: part, bold: false };
      });
      
      // Juntar texto para split
      let fullText = '';
      cleanParts.forEach(p => { fullText += p.text; });
      
      return { 
        lines: pdf.splitTextToSize(fullText, maxWidth),
        hasBold 
      };
    };

    // Função para renderizar linha com negrito
    const renderizarLinhaNegrito = (texto: string, x: number, y: number) => {
      const parts = texto.split(/(\*\*.*?\*\*)/g);
      let currentX = x;
      
      for (const part of parts) {
        if (part.startsWith('**') && part.endsWith('**')) {
          pdf.setFont("times", "bold");
          const boldText = part.replace(/\*\*/g, '');
          pdf.text(boldText, currentX, y);
          currentX += pdf.getTextWidth(boldText);
        } else if (part) {
          pdf.setFont("times", "normal");
          pdf.text(part, currentX, y);
          currentX += pdf.getTextWidth(part);
        }
      }
    };

    // Função para verificar espaço e adicionar nova página
    const checkNewPage = (requiredSpace: number) => {
      if (y + requiredSpace > 297 - margemInferior) {
        pdf.addPage();
        y = margemSuperior;
        pageNumber++;
        // Adicionar número da página (ABNT - a partir da 2ª página)
        if (pageNumber > 1) {
          pdf.setFontSize(10);
          pdf.setFont("times", "normal");
          pdf.text(`${pageNumber}`, 190, 287);
        }
      }
    };

    // CAPA - Título centralizado
    pdf.setFontSize(14);
    pdf.setFont("times", "bold");
    const tituloLines = pdf.splitTextToSize(titulo, larguraUtil);
    const tituloCentroY = 100;
    
    tituloLines.forEach((line: string, i: number) => {
      pdf.text(line, 105, tituloCentroY + (i * 7), { align: "center" });
    });

    // Data
    pdf.setFontSize(12);
    pdf.setFont("times", "normal");
    const dataAtual = new Date().toLocaleDateString("pt-BR", {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    pdf.text(dataAtual, 105, tituloCentroY + (tituloLines.length * 7) + 20, { align: "center" });

    // Nova página para conteúdo
    pdf.addPage();
    y = margemSuperior;
    pageNumber = 1;

    // Processar Markdown linha por linha
    const lines = resumo.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        y += 5;
        continue;
      }

      // Remover emojis
      const cleanLine = trimmedLine.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();

      // H2 (##)
      if (cleanLine.startsWith('## ')) {
        checkNewPage(15);
        pdf.setFontSize(16);
        pdf.setFont("times", "bold");
        const text = cleanLine.replace(/^##\s*/, '');
        const textLines = pdf.splitTextToSize(text, larguraUtil);
        textLines.forEach((textLine: string) => {
          checkNewPage(9);
          pdf.text(textLine, margemEsquerda, y);
          y += 8;
        });
        y += 4;
        continue;
      }

      // H3 (###)
      if (cleanLine.startsWith('### ')) {
        checkNewPage(12);
        pdf.setFontSize(14);
        pdf.setFont("times", "bold");
        const text = cleanLine.replace(/^###\s*/, '');
        const textLines = pdf.splitTextToSize(text, larguraUtil);
        textLines.forEach((textLine: string) => {
          checkNewPage(8);
          pdf.text(textLine, margemEsquerda, y);
          y += 7;
        });
        y += 3;
        continue;
      }

      // Listas numeradas (1. 2. 3.)
      if (/^\d+\.\s/.test(cleanLine)) {
        checkNewPage(10);
        pdf.setFontSize(14);
        
        // Processar negrito em listas numeradas
        if (cleanLine.includes('**')) {
          // Remover ** antes de processar
          const cleanedLine = cleanLine.replace(/\*\*/g, '');
          pdf.setFont("times", "normal");
          const textLines = pdf.splitTextToSize(cleanedLine, larguraUtil - 5);
          textLines.forEach((textLine: string, i: number) => {
            checkNewPage(8);
            pdf.text(textLine, margemEsquerda + (i > 0 ? 8 : 0), y);
            y += 7;
          });
        } else {
          pdf.setFont("times", "normal");
          const textLines = pdf.splitTextToSize(cleanLine, larguraUtil - 5);
          textLines.forEach((textLine: string, i: number) => {
            checkNewPage(8);
            pdf.text(textLine, margemEsquerda + (i > 0 ? 8 : 0), y);
            y += 7;
          });
        }
        y += 2;
        continue;
      }

      // Listas com marcadores (- ou *)
      if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
        checkNewPage(10);
        pdf.setFontSize(14);
        const text = cleanLine.replace(/^[-*]\s*/, '');
        
        // Remover ** completamente antes de processar
        const cleanedText = text.replace(/\*\*/g, '');
        pdf.setFont("times", "normal");
        const textLines = pdf.splitTextToSize('• ' + cleanedText, larguraUtil - 5);
        textLines.forEach((textLine: string) => {
          checkNewPage(8);
          pdf.text(textLine, margemEsquerda + 5, y);
          y += 7;
        });
        y += 2;
        continue;
      }

      // Texto com negrito inline **texto**
      if (cleanLine.includes('**')) {
        checkNewPage(10);
        pdf.setFontSize(14);
        renderizarLinhaNegrito(cleanLine, margemEsquerda, y);
        y += 7;
        y += 2;
        continue;
      }

      // Texto normal
      checkNewPage(10);
      pdf.setFontSize(14);
      pdf.setFont("times", "normal");
      const textLines = pdf.splitTextToSize(cleanLine, larguraUtil);
      textLines.forEach((textLine: string) => {
        checkNewPage(8);
        pdf.text(textLine, margemEsquerda, y);
        y += 7;
      });
      y += 2;
    }

    // Adicionar numeração de páginas (a partir da página 2)
    const totalPages = pdf.getNumberOfPages();
    for (let i = 2; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(10);
      pdf.setFont("times", "normal");
      pdf.text(`${i}`, 190, 287, { align: 'right' });
    }

    // Gerar PDF como base64
    const pdfBase64 = pdf.output('datauristring').split(',')[1];

    console.log("PDF ABNT formatado com Markdown gerado com sucesso");

    return new Response(
      JSON.stringify({ 
        pdf: pdfBase64,
        filename: `resumo-${titulo.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
