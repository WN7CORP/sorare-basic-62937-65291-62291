import { 
  Volume2, 
  MessageSquare, 
  GraduationCap, 
  Lightbulb, 
  BookOpen, 
  Bookmark, 
  BookMarked, 
  FileQuestion, 
  Sparkles,
  ChevronDown,
  Share2
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Article {
  "Número do Artigo": string | null;
  "Artigo": string | null;
  "Narração": string | null;
  "Comentario": string | null;
  "Aula": string | null;
}

interface ArtigoActionsMenuProps {
  article: Article;
  onPlayNarration?: (audioUrl: string) => void;
  onPlayComment?: (audioUrl: string, title: string) => void;
  onOpenAula?: () => void;
  onOpenExplicacao?: (tipo: "explicacao" | "exemplo") => void;
  onGenerateFlashcards?: () => void;
  onOpenTermos?: () => void;
  onOpenQuestoes?: () => void;
  onPerguntar?: () => void;
  onShareWhatsApp?: () => void;
  loadingFlashcards?: boolean;
  isCommentPlaying?: boolean;
}

export const ArtigoActionsMenu = ({
  article,
  onPlayNarration,
  onPlayComment,
  onOpenAula,
  onOpenExplicacao,
  onGenerateFlashcards,
  onOpenTermos,
  onOpenQuestoes,
  onPerguntar,
  onShareWhatsApp,
  loadingFlashcards = false,
  isCommentPlaying = false,
}: ArtigoActionsMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasAula = article["Aula"];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button 
          variant="outline"
          className="w-full flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-foreground border-red-500/30 font-medium transition-all"
        >
          <Sparkles className="w-4 h-4" />
          Recursos do Artigo
          <ChevronDown className={`w-4 h-4 ml-auto transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
        <div className="pt-3 grid grid-cols-2 gap-2">
          {/* Explicar */}
          {onOpenExplicacao && (
            <button
              onClick={() => onOpenExplicacao("explicacao")}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-black/80 hover:bg-black text-white rounded-lg transition-all text-sm font-medium hover:scale-[1.02] animate-fade-in shadow-lg shadow-black/50"
              style={{ animationDelay: '0ms' }}
            >
              <Lightbulb className="w-4 h-4" />
              <span>Explicar</span>
            </button>
          )}

          {/* Exemplo */}
          {onOpenExplicacao && (
            <button
              onClick={() => onOpenExplicacao("exemplo")}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-black/80 hover:bg-black text-white rounded-lg transition-all text-sm font-medium hover:scale-[1.02] animate-fade-in shadow-lg shadow-black/50"
              style={{ animationDelay: '50ms' }}
            >
              <BookOpen className="w-4 h-4" />
              <span>Exemplo</span>
            </button>
          )}

          {/* Termos */}
          {onOpenTermos && (
            <button
              onClick={onOpenTermos}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-black/80 hover:bg-black text-white rounded-lg transition-all text-sm font-medium hover:scale-[1.02] animate-fade-in shadow-lg shadow-black/50"
              style={{ animationDelay: '100ms' }}
            >
              <BookMarked className="w-4 h-4" />
              <span>Termos</span>
            </button>
          )}

          {/* Questões */}
          {onOpenQuestoes && (
            <button
              onClick={onOpenQuestoes}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-black/80 hover:bg-black text-white rounded-lg transition-all text-sm font-medium hover:scale-[1.02] animate-fade-in shadow-lg shadow-black/50"
              style={{ animationDelay: '150ms' }}
            >
              <FileQuestion className="w-4 h-4" />
              <span>Questões</span>
            </button>
          )}

          {/* Flashcards */}
          {onGenerateFlashcards && (
            <button
              onClick={onGenerateFlashcards}
              disabled={loadingFlashcards}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-black/80 hover:bg-black text-white rounded-lg transition-all text-sm font-medium hover:scale-[1.02] animate-fade-in shadow-lg shadow-black/50 disabled:opacity-50"
              style={{ animationDelay: '200ms' }}
            >
              <Bookmark className="w-4 h-4" />
              <span>{loadingFlashcards ? "Gerando..." : "Flashcards"}</span>
            </button>
          )}

          {/* Comentário */}
          {article["Comentario"] && onPlayComment && (
            <button
              onClick={() => onPlayComment(
                article["Comentario"]!,
                `Comentário - Art. ${article["Número do Artigo"]}`
              )}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-black/80 hover:bg-black text-white rounded-lg transition-all text-sm font-medium hover:scale-[1.02] animate-fade-in shadow-lg shadow-black/50"
              style={{ animationDelay: '6250ms' }}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Comentário</span>
            </button>
          )}

          {/* Aula (se disponível) */}
          {hasAula && onOpenAula && (
            <button
              onClick={onOpenAula}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-black/80 hover:bg-black text-white rounded-lg transition-all text-sm font-medium hover:scale-[1.02] animate-fade-in shadow-lg shadow-black/50"
              style={{ animationDelay: '6300ms' }}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Aula</span>
            </button>
          )}

          {/* Perguntar */}
          {onPerguntar && (
            <button
              onClick={onPerguntar}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-black/80 hover:bg-black text-white rounded-lg transition-all text-sm font-medium hover:scale-[1.02] animate-fade-in shadow-lg shadow-black/50"
              style={{ animationDelay: '6350ms' }}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Perguntar</span>
            </button>
          )}

          {/* WhatsApp - último */}
          {onShareWhatsApp && (
            <button
              onClick={onShareWhatsApp}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-black/80 hover:bg-black text-white rounded-lg transition-all text-sm font-medium hover:scale-[1.02] animate-fade-in shadow-lg shadow-black/50"
              style={{ animationDelay: '6400ms' }}
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
