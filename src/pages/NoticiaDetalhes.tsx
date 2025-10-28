import { useLocation, useNavigate } from "react-router-dom";
import { ExternalLink, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { NoticiaConteudo } from "@/components/NoticiaConteudo";
import ExplicacaoNoticiaModal from "@/components/ExplicacaoNoticiaModal";

interface Noticia {
  id: string;
  categoria: string;
  portal: string;
  titulo: string;
  capa: string;
  link: string;
  dataHora: string;
}

const NoticiaDetalhes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const noticia = location.state?.noticia as Noticia;
  const [iframeError, setIframeError] = useState(false);
  const [useWebScraping, setUseWebScraping] = useState(false);
  const [showExplicacao, setShowExplicacao] = useState(false);

  useEffect(() => {
    if (!noticia) {
      navigate('/noticias-juridicas');
    }
  }, [noticia, navigate]);

  useEffect(() => {
    // Timeout para detectar se iframe não carregou
    const timeout = setTimeout(() => {
      const iframe = document.querySelector('iframe');
      if (iframe && !iframe.contentWindow?.document.body?.innerHTML) {
        console.log('Iframe timeout - tentando web scraping');
        setIframeError(true);
        setUseWebScraping(true);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  if (!noticia) {
    return null;
  }

  const handleIframeError = () => {
    console.log('Erro ao carregar iframe - usando web scraping');
    setIframeError(true);
    setUseWebScraping(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 bg-card border-b border-border shadow-sm">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold text-foreground line-clamp-1">
            {noticia.titulo}
          </h2>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => window.open(noticia.link, '_blank')}
          title="Abrir no navegador"
          className="shrink-0"
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>

      {/* Conteúdo - Iframe ou Web Scraping */}
      <div className="flex-1 overflow-auto">
        {useWebScraping ? (
          <NoticiaConteudo url={noticia.link} titulo={noticia.titulo} />
        ) : (
          <iframe
            src={noticia.link}
            className="w-full h-full border-0"
            title={noticia.titulo}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            onError={handleIframeError}
          />
        )}
      </div>

      {/* Botão Flutuante - Ver Análise */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setShowExplicacao(true)}
          size="lg"
          className="rounded-full shadow-2xl hover:shadow-primary/50 transition-all hover:scale-110 gap-2 px-6"
        >
          <Sparkles className="w-5 h-5" />
          Ver Análise
        </Button>
      </div>

      {/* Modal de Explicação */}
      <ExplicacaoNoticiaModal
        isOpen={showExplicacao}
        onClose={() => setShowExplicacao(false)}
        titulo={noticia.titulo}
        url={noticia.link}
      />
    </div>
  );
};

export default NoticiaDetalhes;
