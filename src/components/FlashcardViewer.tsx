import React, { useState } from "react";
import ReactCardFlip from "react-card-flip";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
interface Flashcard {
  front: string;
  back: string;
  exemplo?: string;
}
interface FlashcardViewerProps {
  flashcards: Flashcard[];
  tema?: string;
}
export const FlashcardViewer = ({
  flashcards,
  tema
}: FlashcardViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev + 1) % flashcards.length);
  };
  const handlePrevious = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev - 1 + flashcards.length) % flashcards.length);
  };
  if (flashcards.length === 0) return null;
  const currentCard = flashcards[currentIndex];
  return <div className="w-full max-w-full mx-auto px-2 sm:px-4 py-4 space-y-4 overflow-hidden">
      <div className="text-center text-sm text-muted-foreground mb-2">
        Flashcard {currentIndex + 1} de {flashcards.length}
      </div>

      <ReactCardFlip isFlipped={isFlipped} flipDirection="horizontal">
        <div onClick={() => setIsFlipped(true)} className="min-h-[300px] bg-card border-2 border-[hsl(270,60%,55%)] rounded-xl p-4 sm:p-8 flex flex-col cursor-pointer hover:shadow-lg transition-shadow relative break-words">
          {tema && (
            <p className="text-xs text-[hsl(270,60%,55%)]/60 mb-3 absolute top-4 left-4">
              {tema}
            </p>
          )}
          <div className="flex-1 flex items-center justify-center text-center">
            <p className="text-lg font-semibold mb-2">{currentCard.front}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-4 text-center">Clique para ver a resposta</p>
        </div>

        <div onClick={() => setIsFlipped(false)} className="min-h-[350px] bg-card border-2 border-[hsl(270,60%,55%)] rounded-xl p-4 sm:p-8 cursor-pointer hover:shadow-lg transition-shadow relative break-words">
          {tema && (
            <p className="text-xs text-[hsl(270,60%,55%)]/60 mb-3 absolute top-4 left-4">
              {tema}
            </p>
          )}
          <div className="space-y-4 mt-6">
            <div className="text-center">
              <p className="font-semibold text-foreground leading-relaxed text-base">
                {currentCard.back}
              </p>
            </div>
            
            {currentCard.exemplo && <div className="bg-background/50 rounded-lg p-4 border border-[hsl(270,60%,55%)]/20">
                <p className="text-xs font-semibold mb-2 text-[hsl(270,60%,55%)] flex items-center gap-2">
                  <span>💡</span> Exemplo Prático:
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  {currentCard.exemplo}
                </p>
              </div>}
            
            <p className="text-xs text-muted-foreground text-center mt-4">
              Clique para voltar
            </p>
          </div>
        </div>
      </ReactCardFlip>

      <div className="flex justify-between items-center gap-4">
        <Button onClick={handlePrevious} variant="outline" disabled={flashcards.length <= 1} className="flex-1">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>

        <Button onClick={() => setIsFlipped(!isFlipped)} variant="ghost" size="icon">
          <RotateCw className="w-4 h-4" />
        </Button>

        <Button onClick={handleNext} variant="outline" disabled={flashcards.length <= 1} className="flex-1">
          Próximo
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>;
};