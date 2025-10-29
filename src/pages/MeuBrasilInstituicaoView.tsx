import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JuristaArtigoCompleto } from "@/components/JuristaArtigoCompleto";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const MeuBrasilInstituicaoView = () => {
  const { nome } = useParams<{ nome: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [instituicao, setInstituicao] = useState<any>(null);

  useEffect(() => {
    if (nome) {
      carregarInstituicao();
    }
  }, [nome]);

  const carregarInstituicao = async () => {
    try {
      setLoading(true);
      const nomeDecodificado = decodeURIComponent(nome!);

      const { data: instDb, error: errorDb } = await supabase
        .from('meu_brasil_instituicoes')
        .select('*')
        .eq('nome', nomeDecodificado)
        .single();

      if (instDb && !errorDb) {
        setInstituicao(instDb);
        setLoading(false);
        return;
      }

      const { data: wikiData, error: wikiError } = await supabase.functions.invoke(
        'buscar-artigo-wikipedia',
        {
          body: {
            action: 'article',
            titulo: nomeDecodificado,
            categoria: 'instituicao'
          }
        }
      );

      if (wikiError) throw wikiError;

      const { data: enrichData, error: enrichError } = await supabase.functions.invoke(
        'enriquecer-conteudo-meu-brasil',
        {
          body: {
            tipo: 'instituicao',
            nome: nomeDecodificado,
            conteudo_original: wikiData,
            contexto: `Instituição jurídica brasileira`
          }
        }
      );

      if (enrichError) throw enrichError;

      const { data: savedInst, error: saveError } = await supabase
        .from('meu_brasil_instituicoes')
        .upsert({
          nome: nomeDecodificado,
          foto_url: wikiData?.foto_url || wikiData?.imagens?.[0] || null,
          conteudo_original: wikiData,
          conteudo_melhorado: enrichData.conteudo_melhorado
        })
        .select()
        .single();

      if (saveError) throw saveError;

      setInstituicao(savedInst);
    } catch (error: any) {
      console.error('Erro ao carregar instituição:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as informações da instituição.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportarPDF = async () => {
    try {
      toast({
        title: "Gerando PDF",
        description: "Aguarde enquanto preparamos seu documento...",
      });

      const { data, error } = await supabase.functions.invoke(
        'exportar-pdf-educacional',
        {
          body: {
            titulo: instituicao.nome,
            conteudo: instituicao.conteudo_melhorado,
            tipo: 'instituicao'
          }
        }
      );

      if (error) throw error;

      const blob = new Blob([Uint8Array.from(atob(data.pdf), c => c.charCodeAt(0))], {
        type: 'application/pdf'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${instituicao.nome}.pdf`;
      a.click();

      toast({
        title: "PDF gerado com sucesso!",
      });
    } catch (error: any) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive"
      });
    }
  };

  const handleCompartilhar = async () => {
    try {
      await navigator.share({
        title: instituicao.nome,
        text: `Conheça a instituição: ${instituicao.nome}`,
        url: window.location.href
      });
    } catch (error) {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para a área de transferência.",
      });
    }
  };

  if (loading) {
    return (
      <div className="px-3 py-4 max-w-4xl mx-auto pb-20 space-y-4">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!instituicao) {
    return (
      <div className="px-3 py-4 max-w-4xl mx-auto pb-20 text-center">
        <p className="text-muted-foreground">Instituição não encontrada.</p>
        <Button onClick={() => navigate('/meu-brasil/instituicoes')} className="mt-4">
          Voltar para Instituições
        </Button>
      </div>
    );
  }

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/meu-brasil/instituicoes')}
        className="mb-4"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Voltar para Instituições
      </Button>

      <JuristaArtigoCompleto
        nome={instituicao.nome}
        categoria={instituicao.tipo || "Instituição Jurídica"}
        area={instituicao.sigla}
        foto_url={instituicao.foto_url}
        conteudo_melhorado={instituicao.conteudo_melhorado}
        onExportarPDF={handleExportarPDF}
        onCompartilhar={handleCompartilhar}
      />
    </div>
  );
};

export default MeuBrasilInstituicaoView;
