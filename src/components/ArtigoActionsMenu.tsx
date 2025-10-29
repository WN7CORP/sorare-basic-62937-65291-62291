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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

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
  const hasAudio = article["Narração"] || article["Comentario"];
  const hasAula = article["Aula"];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="default"
          className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground font-medium"
        >
          <Sparkles className="w-4 h-4" />
          Recursos do Artigo
          <ChevronDown className="w-4 h-4 ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        className="w-64 bg-popover border-border shadow-xl z-50"
        align="start"
        sideOffset={8}
      >
        {/* Áudio Section */}
        {hasAudio && (
          <>
            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2">
              🎵 Áudio
            </DropdownMenuLabel>
            
            {article["Narração"] && onPlayNarration && (
              <DropdownMenuItem
                onClick={() => onPlayNarration(article["Narração"]!)}
                className="cursor-pointer gap-3 py-2.5"
              >
                <Volume2 className="w-4 h-4" />
                <span>Ouvir Narração</span>
              </DropdownMenuItem>
            )}

            {article["Comentario"] && onPlayComment && (
              <DropdownMenuItem
                onClick={() => onPlayComment(
                  article["Comentario"]!,
                  `Comentário - Art. ${article["Número do Artigo"]}`
                )}
                className="cursor-pointer gap-3 py-2.5"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{isCommentPlaying ? "Pausar Comentário" : "Ouvir Comentário"}</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />
          </>
        )}

        {/* Aprendizado Section */}
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2">
          🎓 Aprendizado
        </DropdownMenuLabel>

        {hasAula && onOpenAula && (
          <DropdownMenuItem
            onClick={onOpenAula}
            className="cursor-pointer gap-3 py-2.5"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Assistir Aula</span>
          </DropdownMenuItem>
        )}

        {onOpenExplicacao && (
          <>
            <DropdownMenuItem
              onClick={() => onOpenExplicacao("explicacao")}
              className="cursor-pointer gap-3 py-2.5"
            >
              <Lightbulb className="w-4 h-4" />
              <span>Explicar Artigo</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => onOpenExplicacao("exemplo")}
              className="cursor-pointer gap-3 py-2.5"
            >
              <BookOpen className="w-4 h-4" />
              <span>Ver Exemplo Prático</span>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        {/* Recursos de Estudo Section */}
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2">
          📚 Recursos de Estudo
        </DropdownMenuLabel>

        {onGenerateFlashcards && (
          <DropdownMenuItem
            onClick={onGenerateFlashcards}
            disabled={loadingFlashcards}
            className="cursor-pointer gap-3 py-2.5 disabled:opacity-50"
          >
            <Bookmark className="w-4 h-4" />
            <span>{loadingFlashcards ? "Gerando..." : "Gerar Flashcards"}</span>
          </DropdownMenuItem>
        )}

        {onOpenTermos && (
          <DropdownMenuItem
            onClick={onOpenTermos}
            className="cursor-pointer gap-3 py-2.5"
          >
            <BookMarked className="w-4 h-4" />
            <span>Ver Termos Jurídicos</span>
          </DropdownMenuItem>
        )}

        {onOpenQuestoes && (
          <DropdownMenuItem
            onClick={onOpenQuestoes}
            className="cursor-pointer gap-3 py-2.5"
          >
            <FileQuestion className="w-4 h-4" />
            <span>Gerar Questões</span>
          </DropdownMenuItem>
        )}

        {onPerguntar && (
          <DropdownMenuItem
            onClick={onPerguntar}
            className="cursor-pointer gap-3 py-2.5"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Fazer uma Pergunta</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
