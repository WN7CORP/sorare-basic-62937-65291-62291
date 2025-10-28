import { useState, useRef, useEffect } from "react";
import { X, Play, Pause, Volume2, VolumeX, List, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import AudioVisualization from "./AudioVisualization";
import AudioPlaylistModal from "./AudioPlaylistModal";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";

interface SpotifyLikePlayerProps {
  isOpen: boolean;
  onClose: () => void;
  audioUrl: string;
  title: string;
  area: string;
  tema: string;
  descricao: string;
  tag?: string;
  imagem_miniatura?: string;
  onPlaylistClick?: () => void;
}

const SpotifyLikePlayer = ({
  isOpen,
  onClose,
  audioUrl,
  title,
  area,
  tema,
  descricao,
  tag,
  onPlaylistClick,
}: SpotifyLikePlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { playNext, playlist } = useAudioPlayer();

  useEffect(() => {
    if (!isOpen) {
      audioRef.current?.pause();
      setIsPlaying(false);
      setCurrentTime(0);
    } else if (audioRef.current && audioUrl) {
      audioRef.current.src = audioUrl;
      audioRef.current.load();
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setIsPlaying(true);
        }).catch(error => {
          console.error('Error playing audio:', error);
          setIsPlaying(false);
        });
      }
    }
  }, [isOpen, audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    const time = value[0];
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    handleSeek([percent * duration]);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    if (value[0] > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const formatTime = (time: number) => {
    if (!isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={`fixed inset-0 z-50 bg-gradient-to-br from-gray-900 to-gray-800 transition-all duration-300 ${
        isOpen ? "translate-y-0" : "translate-y-full"
      } overflow-y-auto`}>
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => {
            setIsPlaying(false);
            // Auto-play próximo áudio se houver playlist
            if (playlist.length > 0) {
              console.log('🎵 Áudio finalizado, tocando próximo da playlist');
              playNext();
            }
          }}
        />

        <div className="max-w-2xl mx-auto p-6 space-y-8">
          {/* Header com botão fechar */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm text-gray-400">Tocando Agora</h3>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Ícone grande centralizado */}
          <div className="flex justify-center py-8">
            <div className="w-48 h-48 rounded-3xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center shadow-2xl shadow-purple-500/50 relative">
              <Music2 className="w-24 h-24 text-white" />
              {isPlaying && (
                <div className="absolute inset-0 bg-purple-400/20 rounded-3xl animate-pulse" />
              )}
            </div>
          </div>

          {/* Título, área e volume */}
          <div className="text-center space-y-4">
            <div>
              <h2 className="text-3xl font-bold text-white">{title}</h2>
              <p className="text-base text-gray-300">
                {area} {tema && `• ${tema}`}
              </p>
            </div>
            
            {/* Controles de volume */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={toggleMute}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-gray-400" />
                ) : (
                  <Volume2 className="w-5 h-5 text-gray-400" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-48 h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              />
            </div>
          </div>

          {/* Barra de Progresso */}
          <div className="space-y-2">
            <div className="cursor-pointer" onClick={handleProgressClick}>
              <Progress 
                value={(currentTime / duration) * 100 || 0} 
                className="h-2 bg-white/10"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Visualização e Play/Pause */}
          <div className="flex items-center justify-center gap-8">
            <AudioVisualization isPlaying={isPlaying} />
            
            <Button
              onClick={togglePlayPause}
              size="icon"
              className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 shadow-2xl shadow-purple-500/50 transition-all hover:scale-110"
            >
              {isPlaying ? (
                <Pause className="h-8 w-8 text-white" fill="white" />
              ) : (
                <Play className="h-8 w-8 text-white ml-1" fill="white" />
              )}
            </Button>

            <AudioVisualization isPlaying={isPlaying} />
          </div>

          {/* Sobre o áudio */}
          {descricao && (
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3">Sobre o áudio</h3>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{descricao}</p>
            </div>
          )}

          {/* Botão de playlist */}
          <div className="flex items-center justify-center pt-4 border-t border-white/10">
            <button
              onClick={() => setShowPlaylist(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 transition-colors"
            >
              <List className="w-5 h-5 text-white" />
              <span className="text-sm font-medium text-white">Ver Playlist</span>
            </button>
          </div>

          {/* Espaço extra no final para evitar corte */}
          <div className="h-8"></div>
        </div>
      </div>

      {/* Modal de Playlist */}
      <AudioPlaylistModal
        isOpen={showPlaylist}
        onClose={() => setShowPlaylist(false)}
      />
    </>
  );
};

export default SpotifyLikePlayer;
