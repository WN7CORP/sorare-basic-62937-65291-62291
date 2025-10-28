import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Play, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
interface Video {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
}
const VideoaulasPlayer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    toast
  } = useToast();
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const playerRef = useRef<HTMLDivElement>(null);
  const playlistLink = searchParams.get('link');
  const areaParam = searchParams.get('area');
  const startVideoId = searchParams.get('videoId') || searchParams.get('startVideo');
  const fromSearch = searchParams.get('fromSearch') === 'true';
  useEffect(() => {
    if (playlistLink || areaParam) {
      fetchVideos();
    }
  }, [playlistLink, areaParam]);
  const extractVideoId = (url: string): string => {
    if (!url) return '';
    const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?&]+)/);
    return match ? match[1] : '';
  };
  const fetchVideos = async () => {
    try {
      let videosData: Video[] = [];
      if (areaParam) {
        // Buscar vídeos por área do Supabase (busca flexível)
        console.log('📹 [VIDEOAULAS] Buscando vídeos da área:', areaParam);
        const {
          data,
          error
        } = await supabase.from('VIDEO AULAS-NOVO' as any).select('*').ilike('area', `%${areaParam}%`).order('titulo', {
          ascending: true
        });
        if (error) {
          console.error('❌ [VIDEOAULAS] Erro ao buscar do Supabase:', error);
          toast({
            title: "Erro",
            description: `Erro ao carregar vídeos: ${error.message}`,
            variant: "destructive"
          });
          throw error;
        }
        console.log('✅ [VIDEOAULAS] Vídeos encontrados:', data?.length || 0);
        if (data && data.length > 0) {
          videosData = data.map((videoItem: any) => ({
            videoId: extractVideoId(videoItem.link),
            title: videoItem.titulo,
            description: '',
            thumbnail: videoItem.thumb,
            rawData: videoItem
          })).filter((v: any) => {
            if (!v.videoId) {
              console.warn('⚠️ [VIDEOAULAS] Vídeo sem ID válido:', v.title, 'Link:', v.rawData?.link);
            }
            return v.videoId;
          });
        } else {
          console.warn('⚠️ [VIDEOAULAS] Nenhum vídeo encontrado para área:', areaParam);
        }
      } else if (playlistLink) {
        // Buscar vídeos de playlist do YouTube
        const {
          data,
          error
        } = await supabase.functions.invoke('buscar-videos-playlist', {
          body: {
            playlistLink
          }
        });
        if (error) throw error;
        videosData = data?.videos || [];
      }
      if (videosData.length > 0) {
        setVideos(videosData);

        // Se há um vídeo inicial especificado, começar por ele
        if (startVideoId) {
          const startVideo = videosData.find((v: Video) => v.videoId === startVideoId);
          setCurrentVideo(startVideo || videosData[0]);

          // Se veio da busca, scroll até o player após um delay
          if (fromSearch && playerRef.current) {
            setTimeout(() => {
              playerRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
              });
            }, 500);
          }
        } else {
          setCurrentVideo(videosData[0]);
        }
      } else {
        throw new Error('Nenhum vídeo encontrado');
      }
    } catch (error) {
      console.error('Erro ao buscar vídeos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os vídeos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return <div className="px-3 py-4 max-w-6xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <p className="text-muted-foreground">Carregando vídeos...</p>
      </div>;
  }
  if (!currentVideo) {
    return <div className="px-3 py-4 max-w-6xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <p className="text-muted-foreground">Nenhum vídeo encontrado.</p>
      </div>;
  }
  const filteredVideos = videos.filter(video => video.videoId !== currentVideo.videoId && (searchTerm === "" || video.title.toLowerCase().includes(searchTerm.toLowerCase()) || video.description?.toLowerCase().includes(searchTerm.toLowerCase())));
  return <div className="px-3 py-4 max-w-6xl mx-auto pb-20">
      {fromSearch && currentVideo && <div className="bg-accent/10 border-b border-accent/20 py-2 px-4 mb-4 text-sm text-muted-foreground animate-fade-in rounded-lg">
          🔍 Busca → Videoaulas → {currentVideo.title}
        </div>}
      
      

      {/* Barra de Pesquisa */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input type="text" placeholder="Pesquisar nesta playlist..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-10" />
          {searchTerm && <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>}
        </div>
        {searchTerm && <p className="text-sm text-muted-foreground mt-2">
            {filteredVideos.length} {filteredVideos.length === 1 ? "vídeo encontrado" : "vídeos encontrados"}
          </p>}
      </div>

      {/* Player */}
      <div ref={playerRef} className={`mb-6 transition-all duration-500 ${fromSearch ? 'ring-4 ring-accent/50 rounded-lg' : ''}`}>
        <div className="aspect-video w-full bg-black rounded-lg overflow-hidden shadow-2xl">
          <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${currentVideo.videoId}?autoplay=1`} title={currentVideo.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full" />
        </div>
        <div className="mt-4">
          <h1 className="text-xl md:text-2xl font-bold mb-2">{currentVideo.title}</h1>
          {currentVideo.description && <p className="text-sm text-muted-foreground line-clamp-3">
              {currentVideo.description}
            </p>}
        </div>
      </div>

      {/* Lista de vídeos */}
      <div>
        <h2 className="text-lg font-bold mb-4">
          {searchTerm ? "Resultados da busca" : `Outros vídeos ${areaParam ? `de ${areaParam}` : 'da playlist'}`}
        </h2>
        {filteredVideos.length === 0 ? <p className="text-muted-foreground text-center py-8">
            {searchTerm ? "Nenhum vídeo encontrado com esse termo" : "Nenhum outro vídeo disponível"}
          </p> : <div className="space-y-3">
            {filteredVideos.map(video => <Card key={video.videoId} className="cursor-pointer hover:scale-[1.02] hover:shadow-lg transition-all border border-border hover:border-accent/50 bg-card group animate-fade-in" onClick={() => {
          setCurrentVideo(video);
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        }}>
                <CardContent className="p-3 flex gap-3">
                  <div className="relative w-40 min-w-40 aspect-video bg-secondary rounded overflow-hidden">
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Play className="w-8 h-8 text-white drop-shadow-lg" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1 text-foreground break-words leading-tight">
                      {video.title}
                    </h3>
                    {video.description && <p className="text-xs text-muted-foreground line-clamp-2">
                        {video.description}
                      </p>}
                  </div>
                </CardContent>
              </Card>)}
          </div>}
      </div>
    </div>;
};
export default VideoaulasPlayer;