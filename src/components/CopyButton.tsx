import { Share2, Volume2, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatForWhatsApp } from "@/lib/formatWhatsApp";
import { useNarration } from "@/contexts/NarrationContext";

interface CopyButtonProps {
  text: string;
  articleNumber: string;
  narrationUrl?: string;
}

export const CopyButton = ({ text, articleNumber, narrationUrl }: CopyButtonProps) => {
  const { toast } = useToast();
  const { narrationState, playNarration } = useNarration();

  const isCurrentlyPlaying = narrationState.isPlaying && 
    narrationState.articleNumber === articleNumber;

  const progress = narrationState.articleNumber === articleNumber 
    ? narrationState.progress 
    : 0;

  const handlePlayNarration = () => {
    if (narrationUrl) {
      playNarration(narrationUrl, articleNumber);
    }
  };

  if (!narrationUrl) {
    return null;
  }

  return (
    <div className="mb-4">
      <button
        onClick={handlePlayNarration}
        className="relative w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-foreground border border-red-500/30 rounded-lg transition-all font-medium shadow-2xl shadow-red-500/30 overflow-hidden"
      >
        {/* Barra de progresso */}
        <div 
          className="absolute inset-0 bg-red-500/30 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
        
        {/* Conteúdo do botão */}
        <div className="relative z-10 flex items-center gap-2">
          {isCurrentlyPlaying ? (
            <>
              <Pause className="w-4 h-4" />
              <span className="text-sm font-medium">Narrando</span>
              {/* Animação de onda sonora */}
              <div className="flex items-center gap-0.5 ml-1">
                <div className="w-0.5 h-3 bg-current animate-pulse" style={{ animationDelay: '0ms', animationDuration: '0.6s' }} />
                <div className="w-0.5 h-4 bg-current animate-pulse" style={{ animationDelay: '0.1s', animationDuration: '0.6s' }} />
                <div className="w-0.5 h-2 bg-current animate-pulse" style={{ animationDelay: '0.2s', animationDuration: '0.6s' }} />
                <div className="w-0.5 h-5 bg-current animate-pulse" style={{ animationDelay: '0.3s', animationDuration: '0.6s' }} />
                <div className="w-0.5 h-3 bg-current animate-pulse" style={{ animationDelay: '0.4s', animationDuration: '0.6s' }} />
              </div>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4" />
              <span className="text-sm font-medium">Narração</span>
            </>
          )}
        </div>
      </button>
    </div>
  );
};
