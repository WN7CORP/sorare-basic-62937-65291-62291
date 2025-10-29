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
          className="w-full flex items-center justify-center gap-2 bg-secondary/30 hover:bg-secondary/50 text-foreground border-border/50 font-medium transition-all"
        >
          <Sparkles className="w-4 h-4" />
          Recursos do Artigo
          <ChevronDown className={`w-4 h-4 ml-auto transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
        <div className="pt-3 space-y-2">
          {/* Áudio Section */}
          {hasAudio && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground px-2 mb-2">
                🎵 Áudio
              </p>
              
              {article["Narração"] && onPlayNarration && (
                <button
                  onClick={() => onPlayNarration(article["Narração"]!)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 bg-secondary/50 hover:bg-secondary text-foreground rounded-lg transition-all text-sm font-medium hover:scale-[1.02] animate-fade-in"
                  style={{ animationDelay: '0ms' }}
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Ouvir Narração</span>
                </button>
              )}

              {article["Comentario"] && onPlayComment && (
                <button
                  onClick={() => onPlayComment(
                    article["Comentario"]!,
                    `Comentário - Art. ${article["Número do Artigo"]}`
                  )}
                  className="w-full flex items-center gap-3 px-3 py-2.5 bg-secondary/50 hover:bg-secondary text-foreground rounded-lg transition-all text-sm font-medium hover:scale-[1.02] animate-fade-in"
                  style={{ animationDelay: '50ms' }}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{isCommentPlaying ? "Pausar Comentário" : "Ouvir Comentário"}</span>
                </button>
              )}
            </div>
          )}

          {/* Aprendizado Section */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground px-2 mb-2 mt-3">
              🎓 Aprendizado
            </p>

            {hasAula && onOpenAula && (
              <button
                onClick={onOpenAula}
                className="w-full flex items-center gap-3 px-3 py-2.5 bg-secondary/50 hover:bg-secondary text-foreground rounded-lg transition-all text-sm font-medium hover:scale-[1.02] animate-fade-in"
                style={{ animationDelay: '100ms' }}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Assistir Aula</span>
              </button>
            )}

            {onOpenExplicacao && (
              <>
                <button
                  onClick={() => onOpenExplicacao("explicacao")}
                  className="w-full flex items-center gap-3 px-3 py-2.5 bg-secondary/50 hover:bg-secondary text-foreground rounded-lg transition-all text-sm font-medium hover:scale-[1.02] animate-fade-in"
                  style={{ animationDelay: '150ms' }}
                >
                  <Lightbulb className="w-4 h-4" />
                  <span>Explicar Artigo</span>
                </button>

                <button
                  onClick={() => onOpenExplicacao("exemplo")}
                  className="w-full flex items-center gap-3 px-3 py-2.5 bg-secondary/50 hover:bg-secondary text-foreground rounded-lg transition-all text-sm font-medium hover:scale-[1.02] animate-fade-in"
                  style={{ animationDelay: '200ms' }}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Ver Exemplo Prático</span>
                </button>
              </>
            )}
          </div>

          {/* Recursos de Estudo Section */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground px-2 mb-2 mt-3">
              📚 Recursos de Estudo
            </p>

            {onGenerateFlashcards && (
              <button
                onClick={onGenerateFlashcards}
                disabled={loadingFlashcards}
                className="w-full flex items-center gap-3 px-3 py-2.5 bg-secondary/50 hover:bg-secondary text-foreground rounded-lg transition-all text-sm font-medium hover:scale-[1.02] animate-fade-in disabled:opacity-50"
                style={{ animationDelay: '250ms' }}
              >
                <Bookmark className="w-4 h-4" />
                <span>{loadingFlashcards ? "Gerando..." : "Gerar Flashcards"}</span>
              </button>
            )}

            {onOpenTermos && (
              <button
                onClick={onOpenTermos}
                className="w-full flex items-center gap-3 px-3 py-2.5 bg-secondary/50 hover:bg-secondary text-foreground rounded-lg transition-all text-sm font-medium hover:scale-[1.02] animate-fade-in"
                style={{ animationDelay: '300ms' }}
              >
                <BookMarked className="w-4 h-4" />
                <span>Ver Termos Jurídicos</span>
              </button>
            )}

            {onOpenQuestoes && (
              <button
                onClick={onOpenQuestoes}
                className="w-full flex items-center gap-3 px-3 py-2.5 bg-secondary/50 hover:bg-secondary text-foreground rounded-lg transition-all text-sm font-medium hover:scale-[1.02] animate-fade-in"
                style={{ animationDelay: '350ms' }}
              >
                <FileQuestion className="w-4 h-4" />
                <span>Gerar Questões</span>
              </button>
            )}

            {onPerguntar && (
              <button
                onClick={onPerguntar}
                className="w-full flex items-center gap-3 px-3 py-2.5 bg-secondary/50 hover:bg-secondary text-foreground rounded-lg transition-all text-sm font-medium hover:scale-[1.02] animate-fade-in"
                style={{ animationDelay: '400ms' }}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Fazer uma Pergunta</span>
              </button>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
