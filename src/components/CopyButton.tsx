import { Share2, Volume2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { formatForWhatsApp } from "@/lib/formatWhatsApp";

interface CopyButtonProps {
  text: string;
  articleNumber: string;
  narrationUrl?: string;
}

export const CopyButton = ({ text, articleNumber, narrationUrl }: CopyButtonProps) => {
  const { toast } = useToast();

  const handleShareWhatsApp = () => {
    const fullText = `*Art. ${articleNumber}*\n\n${text}`;
    const formattedText = formatForWhatsApp(fullText);
    const encodedText = encodeURIComponent(formattedText);
    
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  const handlePlayNarration = () => {
    if (narrationUrl) {
      const audio = new Audio(narrationUrl);
      audio.play();
    }
  };

  return (
    <div className="absolute top-4 right-4 z-10">
      {narrationUrl && (
        <button
          onClick={handlePlayNarration}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-secondary/50 hover:bg-secondary text-foreground rounded-lg transition-all hover:scale-105 border border-border"
          title="Ouvir Narração"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Narração</span>
        </button>
      )}
    </div>
  );
};
