import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, Share2, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JuristaArtigoCompleto } from "@/components/JuristaArtigoCompleto";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const MeuBrasilCasoView = () => {
  const { nome } = useParams<{ nome: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [caso, setCaso] = useState<any>(null);

  useEffect(() => {
    if (nome) {
      carregarCaso();
    }
  }, [nome]);

  const carregarCaso = async () => {
    try {
      setLoading(true);
      const nomeDecodificado = decodeURIComponent(nome!);

      // Tentar buscar do banco primeiro
      const { data: casoDb, error: errorDb } = await supabase
        .from('meu_brasil_casos')
        .select('*')
        .eq('nome', nomeDecodificado)
        .single();

      if (casoDb && !errorDb) {
        setCaso(casoDb);
        setLoading(false);
        return;
      }

      // Se não existir, buscar da Wikipedia e enriquecer
      console.log('Buscando caso da Wikipedia:', nomeDecodificado);

      const { data: wikiData, error: wikiError } = await supabase.functions.invoke(
        'buscar-artigo-wikipedia',
        {
          body: {
            action: 'article',
            titulo: nomeDecodificado,
            categoria: 'caso'
          }
        }
      );

      if (wikiError) throw wikiError;

      // Enriquecer com Gemini
      const { data: enrichData, error: enrichError } = await supabase.functions.invoke(
        'enriquecer-conteudo-meu-brasil',
        {
          body: {
            tipo: 'caso',
            nome: nomeDecodificado,
            conteudo_original: wikiData,
            contexto: `Caso jurídico brasileiro famoso`
          }
        }
      );

      if (enrichError) throw enrichError;

      // Salvar no banco
      const { data: savedCaso, error: saveError } = await supabase
        .from('meu_brasil_casos')
        .upsert({
          nome: nomeDecodificado,
          foto_url: wikiData?.foto_url || wikiData?.imagens?.[0] || null,
          conteudo_original: wikiData,
          conteudo_melhorado: enrichData.conteudo_melhorado,
          imagens: wikiData?.imagens || [],
          timeline: [],
          pessoas_envolvidas: []
        })
        .select()
        .single();

      if (saveError) throw saveError;

      setCaso(savedCaso);
    } catch (error: any) {
      console.error('Erro ao carregar caso:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as informações do caso.",
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
            titulo: caso.nome,
            conteudo: caso.conteudo_melhorado,
            tipo: 'caso'
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
      a.download = `${caso.nome}.pdf`;
      a.click();

      toast({
        title: "PDF gerado com sucesso!",
        description: "O download começou automaticamente.",
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
        title: caso.nome,
        text: `Conheça o caso jurídico: ${caso.nome}`,
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

  if (!caso) {
    return (
      <div className="px-3 py-4 max-w-4xl mx-auto pb-20 text-center">
        <p className="text-muted-foreground">Caso não encontrado.</p>
        <Button onClick={() => navigate('/meu-brasil/casos')} className="mt-4">
          Voltar para Casos Famosos
        </Button>
      </div>
    );
  }

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/meu-brasil/casos')}
        className="mb-4"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Voltar para Casos Famosos
      </Button>

      <JuristaArtigoCompleto
        nome={caso.nome}
        categoria="Caso Jurídico"
        periodo={caso.ano?.toString()}
        area={caso.area}
        foto_url={caso.foto_url}
        conteudo_melhorado={caso.conteudo_melhorado}
        onExportarPDF={handleExportarPDF}
        onCompartilhar={handleCompartilhar}
      />
    </div>
  );
};

export default MeuBrasilCasoView;
