import { Play, Pause, Music2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useEffect } from "react";

interface Article {
  id: number;
  "Número do Artigo": string;
  Artigo: string;
  Narração: string;
}

interface VadeMecumPlaylistProps {
  articles: Article[];
  codigoNome: string;
}

export const VadeMecumPlaylist = ({ articles, codigoNome }: VadeMecumPlaylistProps) => {
  const { playAudio, setPlaylist, currentAudio, isPlaying, togglePlayPause } = useAudioPlayer();

  // Preparar playlist quando componente monta
  useEffect(() => {
    const audioItems = articles.map((article) => ({
      id: article.id,
      titulo: `Art. ${article["Número do Artigo"]} - ${codigoNome}`,
      url_audio: article.Narração,
      imagem_miniatura: "/logo.webp",
      descricao: article.Artigo, // Artigo completo sem truncar
      area: codigoNome,
      tema: `Artigo ${article["Número do Artigo"]}`
    }));
    
    setPlaylist(audioItems);
  }, [articles, codigoNome, setPlaylist]);

  const handlePlayArticle = (article: Article) => {
    playAudio({
      id: article.id,
      titulo: `Art. ${article["Número do Artigo"]} - ${codigoNome}`,
      url_audio: article.Narração,
      imagem_miniatura: "/logo.webp",
      descricao: article.Artigo, // Artigo completo sem truncar
      area: codigoNome,
      tema: `Artigo ${article["Número do Artigo"]}`
    });
  };

  const isCurrentlyPlaying = (article: Article) => {
    return currentAudio?.id === article.id && isPlaying;
  };

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <Music2 className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Nenhum áudio disponível
        </h3>
        <p className="text-muted-foreground text-center max-w-md">
          Este código ainda não possui artigos com narração em áudio. 
          Volte em breve para conferir novidades!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Playlist de Áudios
        </h2>
        <p className="text-muted-foreground">
          {articles.length} {articles.length === 1 ? 'artigo com áudio' : 'artigos com áudio'}
        </p>
      </div>

      <div className="grid gap-3">
        {articles.map((article, index) => {
          const isActive = isCurrentlyPlaying(article);
          
          return (
            <Card
              key={article.id}
              className={`p-4 transition-all duration-300 cursor-pointer hover:shadow-lg ${
                isActive 
                  ? 'bg-accent/10 border-accent shadow-accent/20' 
                  : 'bg-card hover:bg-accent/5'
              }`}
              onClick={() => handlePlayArticle(article)}
            >
              <div className="flex items-center gap-4">
                {/* Play Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isActive) {
                      togglePlayPause();
                    } else {
                      handlePlayArticle(article);
                    }
                  }}
                  className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-600/80 hover:bg-purple-600 text-white'
                  }`}
                >
                  {isActive ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </button>

                {/* Article Info */}
                <div className="flex-1 min-w-0">
                  <h3 className={`text-lg font-semibold mb-1 ${isActive ? 'text-accent' : 'text-foreground'}`}>
                    Art. {article["Número do Artigo"]}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {article.Artigo.substring(0, 120)}
                    {article.Artigo.length > 120 ? '...' : ''}
                  </p>
                </div>

                {/* Playing Indicator */}
                {isActive && (
                  <div className="flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-4 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                      <div className="w-1 h-6 bg-accent rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                      <div className="w-1 h-5 bg-accent rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
