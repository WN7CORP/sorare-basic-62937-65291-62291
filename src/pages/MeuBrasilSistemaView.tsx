import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JuristaArtigoCompleto } from "@/components/JuristaArtigoCompleto";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const MeuBrasilSistemaView = () => {
  const { nome } = useParams<{ nome: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sistema, setSistema] = useState<any>(null);

  useEffect(() => {
    if (nome) {
      carregarSistema();
    }
  }, [nome]);

  const carregarSistema = async () => {
    try {
      setLoading(true);
      const nomeDecodificado = decodeURIComponent(nome!);

      const { data: sysDb, error: errorDb } = await supabase
        .from('meu_brasil_sistemas')
        .select('*')
        .ilike('descricao', `%${nomeDecodificado}%`)
        .single();

      if (sysDb && !errorDb) {
        setSistema({ ...sysDb, nome: nomeDecodificado });
        setLoading(false);
        return;
      }

      const { data: wikiData, error: wikiError } = await supabase.functions.invoke(
        'buscar-artigo-wikipedia',
        {
          body: {
            action: 'article',
            titulo: nomeDecodificado,
            categoria: 'sistema'
          }
        }
      );

      if (wikiError) throw wikiError;

      const { data: enrichData, error: enrichError } = await supabase.functions.invoke(
        'enriquecer-conteudo-meu-brasil',
        {
          body: {
            tipo: 'sistema',
            nome: nomeDecodificado,
            conteudo_original: wikiData,
            contexto: `Sistema jurídico mundial`
          }
        }
      );

      if (enrichError) throw enrichError;

      const { data: savedSys, error: saveError } = await supabase
        .from('meu_brasil_sistemas')
        .insert({
          pais: nomeDecodificado.replace('Sistema Jurídico - ', ''),
          descricao: enrichData.conteudo_melhorado?.resumo_executivo || '',
          foto_url: wikiData?.foto_url || wikiData?.imagens?.[0] || null,
          conteudo_original: wikiData,
          conteudo_melhorado: enrichData.conteudo_melhorado
        })
        .select()
        .single();

      if (saveError) throw saveError;

      setSistema({ ...savedSys, nome: nomeDecodificado });
    } catch (error: any) {
      console.error('Erro ao carregar sistema:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as informações do sistema jurídico.",
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
        description: "Aguarde...",
      });

      const { data, error } = await supabase.functions.invoke(
        'exportar-pdf-educacional',
        {
          body: {
            titulo: sistema.nome,
            conteudo: sistema.conteudo_melhorado,
            tipo: 'sistema'
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
      a.download = `${sistema.nome}.pdf`;
      a.click();

      toast({
        title: "PDF gerado com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao gerar PDF",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleCompartilhar = async () => {
    try {
      await navigator.share({
        title: sistema.nome,
        text: `Conheça o sistema jurídico: ${sistema.nome}`,
        url: window.location.href
      });
    } catch (error) {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copiado!",
      });
    }
  };

  if (loading) {
    return (
      <div className="px-3 py-4 max-w-4xl mx-auto pb-20 space-y-4">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!sistema) {
    return (
      <div className="px-3 py-4 max-w-4xl mx-auto pb-20 text-center">
        <p className="text-muted-foreground">Sistema jurídico não encontrado.</p>
        <Button onClick={() => navigate('/meu-brasil/sistemas')} className="mt-4">
          Voltar para Sistemas Jurídicos
        </Button>
      </div>
    );
  }

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/meu-brasil/sistemas')}
        className="mb-4"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Voltar para Sistemas Jurídicos
      </Button>

      <JuristaArtigoCompleto
        nome={sistema.nome || sistema.pais}
        categoria="Sistema Jurídico"
        foto_url={sistema.foto_url}
        conteudo_melhorado={sistema.conteudo_melhorado}
        onExportarPDF={handleExportarPDF}
        onCompartilhar={handleCompartilhar}
      />
    </div>
  );
};

export default MeuBrasilSistemaView;
