import useEmblaCarousel from "embla-carousel-react";
import { Card, CardContent } from "@/components/ui/card";
import { Video } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Playlist {
  titulo: string;
  area: string;
  link: string;
  thumb?: string;
  tempo?: string;
  data?: string;
  categoria?: string;
}

interface VideoPlaylistCarouselProps {
  playlists: Playlist[];
}

export const VideoPlaylistCarousel = ({ playlists }: VideoPlaylistCarouselProps) => {
  const navigate = useNavigate();
  
  const [emblaRef] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true
  });

  return (
    <div className="overflow-hidden" ref={emblaRef}>
      <div className="flex gap-3 md:gap-4">
        {playlists.map((playlist, idx) => (
          <div key={idx} className="flex-[0_0_70%] md:flex-[0_0_25%] min-w-0">
            <Card
              className="cursor-pointer hover:scale-105 hover:shadow-2xl transition-all border border-accent/20 hover:border-accent/50 bg-card group shadow-xl overflow-hidden"
              onClick={() => navigate(`/videoaulas/player?area=${encodeURIComponent(playlist.area)}`)}
            >
              <div className="relative aspect-video bg-secondary">
                {playlist.thumb ? (
                  <img
                    src={playlist.thumb}
                    alt={playlist.titulo || playlist.area}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
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
              <CardContent className="p-3">
                <h3 className="font-semibold text-sm text-foreground break-words leading-tight min-h-[2.5rem]">
                  {playlist.titulo || playlist.area}
                </h3>
                {playlist.tempo && (
                  <p className="text-xs text-muted-foreground mt-1">{playlist.tempo}</p>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};
