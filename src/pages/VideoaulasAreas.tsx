import { useEffect, useState } from "react";
import { Video, Search, Loader2, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { VideoPlaylistCarousel } from "@/components/VideoPlaylistCarousel";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface Area {
  categoria: string;
  thumb?: string;
  playlists: Playlist[];
}

interface Playlist {
  titulo: string;
  area: string;
  link: string;
  thumb?: string;
  tempo?: string;
  data?: string;
  categoria?: string;
}

const VideoaulasAreas = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState("todos");
  const [searchAreaTab, setSearchAreaTab] = useState("todos");

  useEffect(() => {
    fetchAreas();
  }, []);

  // Busca otimizada com cache e debounce reduzido
  useEffect(() => {
    if (searchTerm.length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      buscarVideos();
    }, 200); // Reduzido de 500ms para 200ms

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Não precisamos mais carregar thumbnails, elas já vêm da tabela

  const fetchAreas = async () => {
    try {
      // Buscar TODOS os vídeos - SEM LIMITE
      const { data, error } = await supabase
        .from('VIDEO AULAS-NOVO' as any)
        .select('*');

      if (error) throw error;

      console.log(`Total de vídeos carregados: ${data?.length || 0}`);

      // Agrupar por ÁREA (Direito Penal, Direito Civil, Português, etc.)
      const grouped = data.reduce((acc: { [key: string]: any[] }, curr: any) => {
        const areaName = curr.area || 'Outros';
        if (!acc[areaName]) acc[areaName] = [];
        acc[areaName].push(curr);
        return acc;
      }, {});

      // Organizar por área com thumbnails da primeira playlist de cada área
      const areasWithPlaylists = Object.entries(grouped)
        .map(([categoria, playlists]) => {
          const firstPlaylist = (playlists as any[])[0];
          return {
            categoria,
            thumb: firstPlaylist?.thumb, // Usar thumb do primeiro vídeo como capa da área
            playlists: (playlists as any[]).map((playlist) => ({
              titulo: playlist.titulo,
              area: playlist.area,
              link: playlist.link,
              thumb: playlist.thumb,
              tempo: playlist.tempo,
              data: playlist.data,
              categoria: playlist.categoria
            }))
          };
        })
        .sort((a, b) => a.categoria.localeCompare(b.categoria)); // Ordenar alfabeticamente

      setAreas(areasWithPlaylists);
      console.log(`Total de áreas encontradas: ${areasWithPlaylists.length}`);
    } catch (error) {
      console.error('Erro ao buscar áreas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as áreas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const buscarVideos = async () => {
    setSearching(true);
    try {
      // Buscar diretamente na tabela VIDEO AULAS-NOVO
      const { data, error } = await supabase
        .from('VIDEO AULAS-NOVO' as any)
        .select('*')
        .or(`titulo.ilike.%${searchTerm}%,area.ilike.%${searchTerm}%,categoria.ilike.%${searchTerm}%`)
        .limit(50);

      if (error) throw error;

      setSearchResults(data || []);
      // Reset para "todos" quando fizer nova busca
      setSearchAreaTab("todos");
    } catch (error) {
      console.error("Erro ao buscar vídeos:", error);
      toast({
        title: "Erro na busca",
        description: "Não foi possível buscar os vídeos",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  // Obter áreas únicas dos resultados de busca
  const searchAreas = ["todos", ...Array.from(new Set(searchResults.map(v => v.area)))];
  
  // Filtrar resultados pela aba ativa de busca
  const filteredSearchResults = searchAreaTab === "todos" 
    ? searchResults 
    : searchResults.filter(v => v.area === searchAreaTab);

  // Obter categorias únicas para as abas
  const categorias = ["todos", ...areas.map(a => a.categoria)];
  
  // Filtrar playlists pela categoria ativa
  const activeArea = areas.find(a => a.categoria === activeTab);
  const activePlaylists = activeArea?.playlists || [];

  if (loading) {
    return (
      <div className="px-3 py-4 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-bold mb-1">Videoaulas</h1>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1">Videoaulas</h1>
        <p className="text-sm text-muted-foreground">
          Selecione uma playlist para assistir
        </p>
      </div>

      {/* Barra de Pesquisa */}
      <div className="flex items-center gap-3 px-4 py-3 bg-muted rounded-xl mb-4">
        <Search className="w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por área ou tema..."
          className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Menu de Abas Horizontal (apenas quando não está buscando) */}
      {searchTerm.length < 3 && (
        <ScrollArea className="w-full mb-4">
          <div className="flex gap-2 pb-2">
            {categorias.map((categoria) => (
              <button
                key={categoria}
                onClick={() => setActiveTab(categoria)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                  ${activeTab === categoria 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }
                `}
              >
                {categoria === "todos" && <Home className="w-4 h-4" />}
                {categoria === "todos" ? "Todos" : categoria}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {/* Resultados da Busca ou Áreas */}
      {searchTerm.length >= 3 ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {searching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Buscando vídeos...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                {searchResults.length} vídeo{searchResults.length !== 1 ? 's' : ''} encontrado{searchResults.length !== 1 ? 's' : ''}
              </>
            )}
          </div>

          {/* Menu de Abas por Área nos Resultados de Busca */}
          {!searching && searchResults.length > 0 && searchAreas.length > 1 && (
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                {searchAreas.map((area) => {
                  const count = area === "todos" 
                    ? searchResults.length 
                    : searchResults.filter(v => v.area === area).length;
                  
                  return (
                    <button
                      key={area}
                      onClick={() => setSearchAreaTab(area)}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                        ${searchAreaTab === area 
                          ? 'bg-primary text-primary-foreground shadow-md' 
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }
                      `}
                    >
                      {area === "todos" ? "Todos" : area}
                      <Badge variant={searchAreaTab === area ? "secondary" : "outline"} className="text-xs">
                        {count}
                      </Badge>
                    </button>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}

          {searching ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filteredSearchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSearchResults.map((video, idx) => (
                <Card
                  key={idx}
                  className="cursor-pointer hover:scale-[1.02] hover:shadow-lg transition-all group"
                  onClick={() => navigate(`/videoaulas/player?link=${encodeURIComponent(video.link)}`)}
                >
                  <CardContent className="p-3 flex gap-3">
                    <div className="relative w-40 min-w-40 aspect-video bg-secondary rounded overflow-hidden">
                      {video.thumb && (
                        <img
                          src={video.thumb}
                          alt={video.titulo}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Video className="w-8 h-8 text-white drop-shadow-lg" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <h3 className="font-semibold text-sm line-clamp-2">
                        {video.titulo}
                      </h3>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {video.area}
                        </Badge>
                        {video.categoria && (
                          <Badge variant="outline" className="text-xs">
                            {video.categoria}
                          </Badge>
                        )}
                      </div>
                      {video.tempo && (
                        <p className="text-xs text-muted-foreground">
                          {video.tempo}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum vídeo encontrado para "{searchTerm}"</p>
              <p className="text-sm mt-2">Tente outros termos de busca</p>
            </div>
          )}
        </div>
      ) : (
        <>
          {searchTerm.length > 0 && searchTerm.length < 3 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Digite pelo menos 3 caracteres para buscar
            </p>
          )}
          
          {/* Conteúdo baseado na aba ativa */}
          {activeTab === "todos" ? (
            /* Mostrar carrosséis de cada área empilhados */
            <div className="space-y-12">
              {areas.map((area) => (
                <div key={area.categoria}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-600 shadow-lg shadow-red-500/50">
                        <Video className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-foreground">{area.categoria}</h2>
                        <p className="text-xs text-muted-foreground">
                          {area.playlists.length} playlist{area.playlists.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab(area.categoria)}
                      className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-medium text-sm"
                    >
                      Ver todos
                    </button>
                  </div>
                  <VideoPlaylistCarousel playlists={area.playlists} />
                </div>
              ))}
            </div>
          ) : (
            /* Lista vertical da categoria específica */
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-600 shadow-lg shadow-red-500/50">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{activeTab}</h2>
                  <p className="text-xs text-muted-foreground">
                    {activePlaylists.length} playlist{activePlaylists.length !== 1 ? 's' : ''} disponíve{activePlaylists.length !== 1 ? 'is' : 'l'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activePlaylists.map((playlist, idx) => (
                  <Card
                    key={idx}
                    className="cursor-pointer hover:scale-[1.02] hover:shadow-2xl transition-all border border-accent/20 hover:border-accent/50 bg-card group shadow-xl overflow-hidden"
                    onClick={() => navigate(`/videoaulas/player?area=${encodeURIComponent(playlist.area)}`)}
                  >
                    <div className="relative aspect-video bg-secondary">
                      {playlist.thumb && (
                        <img
                          src={playlist.thumb}
                          alt={playlist.titulo}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      )}
                      {!playlist.thumb && (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="w-12 h-12 text-accent" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="bg-red-600 rounded-full p-3 shadow-lg">
                          <Video className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-base text-foreground break-words leading-tight">
                        {playlist.titulo || playlist.area}
                      </h3>
                      {playlist.tempo && (
                        <p className="text-xs text-muted-foreground mt-1">{playlist.tempo}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VideoaulasAreas;
