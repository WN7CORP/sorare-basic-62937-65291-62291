import { useState, useRef, useEffect } from "react";
import { Play, Pause, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineAudioButtonProps {
  audioUrl: string;
  articleNumber: string;
  onPlay?: (audioElement: HTMLAudioElement) => void;
}

const InlineAudioButton = ({ audioUrl, articleNumber, onPlay }: InlineAudioButtonProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const togglePlay = async () => {
    if (!audioRef.current) return;
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        setLoading(true);
        if (onPlay) {
          onPlay(audioRef.current);
        } else {
          await audioRef.current.play();
        }
        setIsPlaying(true);
        setLoading(false);
      }
    } catch (error) {
      console.error('Erro ao reproduzir áudio:', error);
      setLoading(false);
      setIsPlaying(false);
    }
  };

  const handleCanPlayThrough = () => {
    setLoading(false);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const currentProgress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(currentProgress);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  return (
    <div className="relative w-full">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onCanPlayThrough={handleCanPlayThrough}
      />
      
      <button
        onClick={togglePlay}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all text-sm shadow-md hover:shadow-lg hover:scale-105 animate-fade-in relative overflow-hidden bg-secondary/50 hover:bg-secondary text-foreground"
      >
        {/* Progress Fill */}
        {isPlaying && (
          <div 
            className="absolute inset-0 bg-accent/20 transition-all duration-200 ease-linear"
            style={{ width: `${progress}%` }}
          />
        )}
        
        {/* Content */}
        <div className="relative z-10 flex items-center gap-2">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          <span className="font-medium text-xs sm:text-sm">
            {isPlaying ? "Pausar" : articleNumber}
          </span>
        </div>
      </button>
    </div>
  );
};

export default InlineAudioButton;
