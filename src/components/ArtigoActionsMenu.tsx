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
  ChevronDown 
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
  loadingFlashcards = false,
  isCommentPlaying = false,
}: ArtigoActionsMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasAudio = article["Narração"] || article["Comentario"];
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
          {article["Narração"] && onPlayNarration && (
            <button
              onClick={() => onPlayNarration(article["Narração"]!)}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-secondary/50 hover:bg-secondary text-foreground rounded-lg transition-all text-sm font-medium hover:scale-[1.02] animate-fade-in"
              style={{ animationDelay: '0ms' }}
            >
              <Volume2 className="w-4 h-4" />
              <span>Narração</span>
            </button>
          )}

          {article["Comentario"] && onPlayComment && (
            <button
              onClick={() => onPlayComment(
                article["Comentario"]!,
                `Comentário - Art. ${article["Número do Artigo"]}`
              )}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-secondary/50 hover:bg-secondary text-foreground rounded-lg transition-all text-sm font-medium hover:scale-[1.02] animate-fade-in"
              style={{ animationDelay: '50ms' }}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Comentário</span>
            </button>
          )}

          {hasAula && onOpenAula && (
            <button
              onClick={onOpenAula}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-secondary/50 hover:bg-secondary text-foreground rounded-lg transition-all text-sm font-medium hover:scale-[1.02] animate-fade-in"
              style={{ animationDelay: '100ms' }}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Aula</span>
            </button>
          )}

          {onOpenExplicacao && (
            <button
              onClick={() => onOpenExplicacao("explicacao")}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-secondary/50 hover:bg-secondary text-foreground rounded-lg transition-all text-sm font-medium hover:scale-[1.02] animate-fade-in"
              style={{ animationDelay: '150ms' }}
            >
              <Lightbulb className="w-4 h-4" />
              <span>Explicar</span>
            </button>
          )}

          {onOpenExplicacao && (
            <button
              onClick={() => onOpenExplicacao("exemplo")}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-secondary/50 hover:bg-secondary text-foreground rounded-lg transition-all text-sm font-medium hover:scale-[1.02] animate-fade-in"
              style={{ animationDelay: '200ms' }}
            >
              <BookOpen className="w-4 h-4" />
              <span>Exemplo</span>
            </button>
          )}

          {onGenerateFlashcards && (
            <button
              onClick={onGenerateFlashcards}
              disabled={loadingFlashcards}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-secondary/50 hover:bg-secondary text-foreground rounded-lg transition-all text-sm font-medium hover:scale-[1.02] animate-fade-in disabled:opacity-50"
              style={{ animationDelay: '250ms' }}
            >
              <Bookmark className="w-4 h-4" />
              <span>{loadingFlashcards ? "Gerando..." : "Flashcards"}</span>
            </button>
          )}

          {onOpenTermos && (
            <button
              onClick={onOpenTermos}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-secondary/50 hover:bg-secondary text-foreground rounded-lg transition-all text-sm font-medium hover:scale-[1.02] animate-fade-in"
              style={{ animationDelay: '300ms' }}
            >
              <BookMarked className="w-4 h-4" />
              <span>Termos</span>
            </button>
          )}

          {onOpenQuestoes && (
            <button
              onClick={onOpenQuestoes}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-secondary/50 hover:bg-secondary text-foreground rounded-lg transition-all text-sm font-medium hover:scale-[1.02] animate-fade-in"
              style={{ animationDelay: '350ms' }}
            >
              <FileQuestion className="w-4 h-4" />
              <span>Questões</span>
            </button>
          )}

          {onPerguntar && (
            <button
              onClick={onPerguntar}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-secondary/50 hover:bg-secondary text-foreground rounded-lg transition-all text-sm font-medium hover:scale-[1.02] animate-fade-in"
              style={{ animationDelay: '400ms' }}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Perguntar</span>
            </button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
