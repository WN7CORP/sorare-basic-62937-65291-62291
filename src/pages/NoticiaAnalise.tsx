import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, ExternalLink, Loader2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
const NoticiaAnalise = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const link = searchParams.get("link");
  const [noticia, setNoticia] = useState<any>(null);
  const [analise, setAnalise] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (link) {
      buscarDados();
    }
  }, [link]);
  const buscarDados = async () => {
    setLoading(true);
    try {
      const {
        data: noticiaData,
        error
      } = await supabase.from('noticias_juridicas_cache').select('*').eq('link', link).single();
      if (error) {
        console.error('Erro ao buscar notícia:', error);
        toast.error('Erro ao carregar notícia');
      } else {
        setNoticia(noticiaData);
        if (noticiaData?.analise_ia) {
          setAnalise(noticiaData.analise_ia);
        } else {
          toast.info('Esta notícia ainda não possui análise');
        }
      }
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };
  const formatarDataHora = (data: string) => {
    try {
      if (!data) return '';
      const date = new Date(data);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };
  return <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header fixo */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        
      </div>

      {loading ? <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-muted-foreground">Carregando notícia...</p>
        </div> : <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Capa da notícia */}
          {noticia?.imagem && <div className="aspect-video rounded-xl overflow-hidden mb-6 shadow-lg">
              <img src={noticia.imagem} alt={noticia.titulo} className="w-full h-full object-cover" />
            </div>}

          {/* Título e info */}
          <div className="mb-6 pb-6 border-b border-border">
            <h2 className="text-2xl font-bold mb-3 text-foreground">
              {noticia?.titulo}
            </h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {noticia?.portal && <span className="flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" />
                  {noticia.portal}
                </span>}
              {noticia?.data && <span>{formatarDataHora(noticia.data)}</span>}
            </div>
          </div>

          {/* Descrição da notícia */}
          {noticia?.descricao && <div className="mb-6">
              <p className="text-muted-foreground leading-relaxed">
                {noticia.descricao}
              </p>
            </div>}

          {/* Botão Ver Análise IA (se disponível) */}
          {analise && <div className="mb-6">
              
            </div>}

          {/* Análise (se disponível) */}
          {analise && <div id="analise-section" className="mb-6 pb-6 border-t border-border pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-accent" />
                <h3 className="text-xl font-bold">Análise Jurídica IA</h3>
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {analise}
                </ReactMarkdown>
              </div>
            </div>}

          {/* Botão ver original */}
          {link && <div className="pt-6 border-t border-border">
              <Button onClick={() => window.open(link, '_blank')} variant="outline" className="w-full">
                <ExternalLink className="w-4 h-4 mr-2" />
                Ver Notícia Original
              </Button>
            </div>}
        </div>}
    </div>;
};
export default NoticiaAnalise;