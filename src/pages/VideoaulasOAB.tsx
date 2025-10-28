import { useEffect, useState } from "react";
import { Video, Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Area {
  categoria: string;
  thumb?: string;
  playlists: any[];
}

const VideoaulasOAB = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    try {
      // Buscar APENAS vídeos da OAB ou Segunda Fase
      const { data, error } = await supabase
        .from('VIDEO AULAS-NOVO' as any)
        .select('*')
        .or('categoria.eq.OAB,area.ilike.%2ª Fase%,area.ilike.%Segunda Fase%,area.ilike.%segunda fase%');

      if (error) throw error;

      console.log(`Total de vídeos OAB carregados: ${data?.length || 0}`);

      // Agrupar por ÁREA
      const grouped = data.reduce((acc: { [key: string]: any[] }, curr: any) => {
        const areaName = curr.area || 'Outros';
        if (!acc[areaName]) acc[areaName] = [];
        acc[areaName].push(curr);
        return acc;
      }, {});

      // Organizar por área
      const areasWithPlaylists = Object.entries(grouped)
        .map(([categoria, playlists]) => {
          const firstPlaylist = (playlists as any[])[0];
          return {
            categoria,
            thumb: firstPlaylist?.thumb,
            playlists: (playlists as any[])
          };
        })
        .sort((a, b) => a.categoria.localeCompare(b.categoria));

      setAreas(areasWithPlaylists);
      console.log(`Total de áreas OAB encontradas: ${areasWithPlaylists.length}`);
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

  // Filtrar áreas pela busca
  const areasFiltradas = areas.filter(area =>
    area.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1">Videoaulas OAB - 2ª Fase</h1>
        <p className="text-sm text-muted-foreground">
          Selecione uma área para assistir as videoaulas
        </p>
      </div>

      {/* Barra de Pesquisa */}
      <div className="flex items-center gap-3 px-4 py-3 bg-muted rounded-xl mb-6">
        <Search className="w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar área..."
          className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid de Áreas */}
      {areasFiltradas.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {areasFiltradas.map((area, idx) => (
            <Card
              key={idx}
              className="cursor-pointer hover:scale-[1.02] hover:shadow-2xl transition-all border border-accent/20 hover:border-accent/50 bg-card group shadow-xl overflow-hidden"
              onClick={() => navigate(`/videoaulas/player?area=${encodeURIComponent(area.categoria)}`)}
            >
              <div className="relative aspect-video bg-secondary">
                {area.thumb && (
                  <img
                    src={area.thumb}
                    alt={area.categoria}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
                {!area.thumb && (
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
                <h3 className="font-semibold text-base text-foreground break-words leading-tight mb-2">
                  {area.categoria}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {area.playlists.length} playlist{area.playlists.length !== 1 ? 's' : ''}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Video className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
          <p className="text-muted-foreground">
            {searchTerm 
              ? `Nenhuma área encontrada para "${searchTerm}"`
              : "Nenhuma área disponível"
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default VideoaulasOAB;
