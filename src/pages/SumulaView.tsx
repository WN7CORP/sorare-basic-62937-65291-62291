import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Search, Plus, Minus, Lightbulb, BookOpen, Bookmark, BookMarked, FileQuestion, Share2, MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import InlineAudioButton from "@/components/InlineAudioButton";
import AudioCommentButton from "@/components/AudioCommentButton";
import StickyAudioPlayer from "@/components/StickyAudioPlayer";
import ExplicacaoModal from "@/components/ExplicacaoModal";
import VideoAulaModal from "@/components/VideoAulaModal";
import TermosModal from "@/components/TermosModal";
import QuestoesModal from "@/components/QuestoesModal";
import { FlashcardViewer } from "@/components/FlashcardViewer";
import { formatTextWithUppercase } from "@/lib/textFormatter";

interface Sumula {
  id: number;
  "Título da Súmula": string | null;
  "Texto da Súmula": string | null;
  "Narração": string | null;
  "Data de Aprovação": string | null;
}

const SumulaView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const contentRef = useRef<HTMLDivElement>(null);
  const firstResultRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(15);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Auto-search based on URL parameter
  useEffect(() => {
    const sumulaParam = searchParams.get('numero');
    if (sumulaParam) {
      setSearchQuery(sumulaParam);
    }
  }, [searchParams]);

  const [displayLimit, setDisplayLimit] = useState(50);
  const [stickyPlayerOpen, setStickyPlayerOpen] = useState(false);
  const [currentAudio, setCurrentAudio] = useState({
    url: "",
    title: "",
    isComment: false
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    artigo: "",
    numeroArtigo: "",
    tipo: "explicacao" as "explicacao" | "exemplo",
    nivel: "tecnico" as "tecnico" | "simples"
  });
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoModalData, setVideoModalData] = useState({
    videoUrl: "",
    artigo: "",
    numeroArtigo: ""
  });
  const [flashcardsModalOpen, setFlashcardsModalOpen] = useState(false);
  const [flashcardsData, setFlashcardsData] = useState<any[]>([]);
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);
  const [termosModalOpen, setTermosModalOpen] = useState(false);
  const [termosData, setTermosData] = useState({ artigo: "", numeroArtigo: "" });
  const [questoesModalOpen, setQuestoesModalOpen] = useState(false);
  const [questoesData, setQuestoesData] = useState({ artigo: "", numeroArtigo: "" });

  const categoryNames: { [key: string]: string } = {
    vinculantes: "Súmulas Vinculantes",
    sumulas: "Súmulas"
  };

  const categoryName = categoryNames[id as string] || "Súmulas";

  // Fetch sumulas with React Query for caching
  const { data: sumulas = [], isLoading } = useQuery({
    queryKey: ['sumulas', id],
    queryFn: async () => {
      const tableMap: { [key: string]: string } = {
        'vinculantes': 'SUMULAS VINCULANTES',
        'sumulas': 'SUMULAS'
      };

      const tableName = tableMap[id as string];
      
      if (!tableName) {
        console.error("Tabela não encontrada para categoria:", id);
        return [];
      }

      const { data, error } = await supabase
        .from(tableName as any)
        .select("*")
        .order("id", { ascending: true });
      
      if (error) {
        console.error("Erro ao buscar súmulas:", error);
        throw error;
      }
      
      return (data || []) as any as Sumula[];
    },
    staleTime: 1000 * 60 * 30, // Cache válido por 30 minutos
    gcTime: 1000 * 60 * 60 // Manter em cache por 1 hora
  });

  // Filter and limit sumulas with useMemo
  const filteredSumulas = useMemo(() => {
    if (!searchQuery) return sumulas;
    
    const searchLower = searchQuery.toLowerCase().trim();
    
    return sumulas.filter(sumula => {
      const titulo = sumula["Título da Súmula"]?.toLowerCase();
      const texto = sumula["Texto da Súmula"]?.toLowerCase();
      const numero = sumula.id?.toString();
      
      return numero?.includes(searchLower) ||
             titulo?.includes(searchLower) ||
             texto?.includes(searchLower);
    });
  }, [sumulas, searchQuery]);

  const displayedSumulas = useMemo(() => {
    return searchQuery ? filteredSumulas : filteredSumulas.slice(0, displayLimit);
  }, [filteredSumulas, displayLimit, searchQuery]);

  // Auto-scroll to first result when searching
  useEffect(() => {
    if (searchQuery && filteredSumulas.length > 0 && firstResultRef.current) {
      setTimeout(() => {
        firstResultRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  }, [searchQuery, filteredSumulas]);

  // Infinite scroll handler
  useEffect(() => {
    const element = contentRef.current;
    if (!searchQuery && element) {
      const handleScroll = () => {
        if (!element) return;
        const scrollTop = element.scrollTop;
        const scrollHeight = element.scrollHeight;
        const clientHeight = element.clientHeight;
        if (scrollTop + clientHeight >= scrollHeight - 500 && displayLimit < filteredSumulas.length) {
          setDisplayLimit(prev => Math.min(prev + 30, filteredSumulas.length));
        }
      };
      element.addEventListener('scroll', handleScroll);
      return () => element.removeEventListener('scroll', handleScroll);
    }
  }, [displayLimit, filteredSumulas.length, searchQuery]);

  const increaseFontSize = () => {
    if (fontSize < 24) setFontSize(fontSize + 2);
  };

  const decreaseFontSize = () => {
    if (fontSize > 12) setFontSize(fontSize - 2);
  };

  const handlePlayComment = (audioUrl: string, title: string) => {
    setCurrentAudio({
      url: audioUrl,
      title,
      isComment: true
    });
    setStickyPlayerOpen(true);
  };

  const handleOpenExplicacao = (artigo: string, numeroArtigo: string, tipo: "explicacao" | "exemplo", nivel?: "tecnico" | "simples") => {
    setModalData({
      artigo,
      numeroArtigo,
      tipo,
      nivel: nivel || "tecnico"
    });
    setModalOpen(true);
  };
  
  const handleGenerateFlashcards = async (artigo: string, numeroArtigo: string) => {
    setLoadingFlashcards(true);
    try {
      const response = await supabase.functions.invoke('gerar-flashcards', {
        body: { content: `Súmula ${numeroArtigo}\n${artigo}` }
      });
      
      if (response.error) throw response.error;
      
      setFlashcardsData(response.data.flashcards || []);
      setFlashcardsModalOpen(true);
    } catch (error) {
      console.error('Erro ao gerar flashcards:', error);
    } finally {
      setLoadingFlashcards(false);
    }
  };

  const handleShare = async (sumula: Sumula) => {
    const text = `Súmula ${sumula.id}\n\n${sumula["Texto da Súmula"]}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Súmula ${sumula.id}`,
          text: text,
        });
      } catch (error) {
        console.error('Erro ao compartilhar:', error);
      }
    } else {
      // Fallback: copiar para clipboard
      try {
        await navigator.clipboard.writeText(text);
        toast({
          title: "Copiado!",
          description: "Texto copiado para a área de transferência",
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível copiar o texto",
          variant: "destructive",
        });
      }
    }
  };

  const handleAskQuestion = (sumula: Sumula) => {
    const text = `Súmula ${sumula.id}: ${sumula["Texto da Súmula"]}`;
    navigate(`/professora?contexto=${encodeURIComponent(text)}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b border-border z-20">
        <div className="flex items-center gap-3 px-4 py-4 max-w-4xl mx-auto animate-fade-in">
          <button
            onClick={() => navigate("/sumulas")}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg md:text-xl font-bold flex-1">
            Súmulas
          </h1>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4 max-w-4xl mx-auto">
          <div className="relative animate-fade-in">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por número ou conteúdo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-input text-foreground pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>
        </div>
      </div>

      {/* Sticky Audio Player for Comments */}
      <StickyAudioPlayer 
        isOpen={stickyPlayerOpen} 
        onClose={() => setStickyPlayerOpen(false)} 
        audioUrl={currentAudio.url} 
        title={currentAudio.title}
      />

      {/* Explicacao Modal */}
      <ExplicacaoModal isOpen={modalOpen} onClose={() => setModalOpen(false)} artigo={modalData.artigo} numeroArtigo={modalData.numeroArtigo} tipo={modalData.tipo} nivel={modalData.nivel} />

      {/* Video Aula Modal */}
      <VideoAulaModal isOpen={videoModalOpen} onClose={() => setVideoModalOpen(false)} videoUrl={videoModalData.videoUrl} artigo={videoModalData.artigo} numeroArtigo={videoModalData.numeroArtigo} />

      {/* Termos Modal */}
      <TermosModal isOpen={termosModalOpen} onClose={() => setTermosModalOpen(false)} artigo={termosData.artigo} numeroArtigo={termosData.numeroArtigo} />

      {/* Questoes Modal */}
      <QuestoesModal isOpen={questoesModalOpen} onClose={() => setQuestoesModalOpen(false)} artigo={questoesData.artigo} numeroArtigo={questoesData.numeroArtigo} />

      {/* Flashcards Modal */}
      {flashcardsModalOpen && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-accent">Flashcards</h2>
              <button onClick={() => setFlashcardsModalOpen(false)} className="p-2 hover:bg-secondary rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <FlashcardViewer flashcards={flashcardsData} />
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div ref={contentRef} className="px-4 max-w-4xl mx-auto py-0 overflow-y-auto h-[calc(100vh-116px)]">
        {/* Sumulas */}
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl p-6 border border-border">
                <Skeleton className="h-8 w-32 mb-3" />
                <Skeleton className="h-6 w-48 mb-4" />
                <Skeleton className="h-24 w-full" />
              </div>
            ))}
          </div>
        ) : displayedSumulas.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            {searchQuery ? "Nenhuma súmula encontrada para sua busca." : "Nenhuma súmula disponível."}
          </div>
        ) : (
          displayedSumulas.map((sumula, index) => {
            // Destacar súmula se for resultado de busca
            const isHighlighted = searchQuery && sumula.id?.toString() === searchQuery.trim();

            return (
              <div
                key={sumula.id}
                ref={index === 0 && searchQuery ? firstResultRef : null}
                className={`bg-card rounded-2xl p-6 mb-6 border transition-all animate-fade-in hover:shadow-lg scroll-mt-4 ${
                  isHighlighted 
                    ? 'border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/20' 
                    : 'border-border hover:border-border/60 hover:shadow-primary/10'
                }`}
                style={{
                  animationDelay: `${index * 0.05}s`,
                  animationFillMode: 'backwards'
                }}
              >
                {/* Sumula Header */}
                <h2 className="text-article-highlight font-bold text-xl md:text-2xl mb-3 animate-scale-in">
                  Súmula {sumula.id}
                </h2>

                {/* Sumula Content */}
                <div 
                  className="article-content text-foreground/90 mb-4 whitespace-pre-line leading-relaxed font-serif-content" 
                  style={{
                    fontSize: `${fontSize}px`,
                    lineHeight: "1.7"
                  }}
                  dangerouslySetInnerHTML={{
                    __html: formatTextWithUppercase(sumula["Texto da Súmula"] || "Texto não disponível")
                  }}
                />

                {/* Data de Aprovação */}
                {sumula["Data de Aprovação"] && (
                  <p className="text-sm text-muted-foreground mb-6">
                    Aprovada em: {sumula["Data de Aprovação"]}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                  {sumula["Narração"] && <InlineAudioButton audioUrl={sumula["Narração"]!} articleNumber={sumula.id?.toString() || ""} />}
                  
                  <button 
                    onClick={() => handleOpenExplicacao(sumula["Texto da Súmula"]!, sumula.id?.toString() || "", "explicacao")}
                    className="flex items-center justify-center gap-2 bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-border text-foreground px-4 py-2.5 rounded-lg transition-all text-sm font-medium hover:scale-105 animate-fade-in"
                  >
                    <Lightbulb className="w-4 h-4" />
                    Explicar
                  </button>
                  <button onClick={() => handleOpenExplicacao(sumula["Texto da Súmula"]!, sumula.id?.toString() || "", "exemplo")} className="flex items-center justify-center gap-2 bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-border text-foreground px-4 py-2.5 rounded-lg transition-all text-sm font-medium hover:scale-105 animate-fade-in">
                    <BookOpen className="w-4 h-4" />
                    Exemplo
                  </button>
                  <button 
                    onClick={() => handleGenerateFlashcards(sumula["Texto da Súmula"]!, sumula.id?.toString() || "")} 
                    disabled={loadingFlashcards}
                    className="flex items-center justify-center gap-2 bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-border text-foreground px-4 py-2.5 rounded-lg transition-all text-sm font-medium hover:scale-105 animate-fade-in disabled:opacity-50"
                  >
                    <Bookmark className="w-4 h-4" />
                    {loadingFlashcards ? "Gerando..." : "Flashcards"}
                  </button>
                  <button 
                    onClick={() => {
                      setTermosData({ artigo: sumula["Texto da Súmula"]!, numeroArtigo: sumula.id?.toString() || "" });
                      setTermosModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-border text-foreground px-4 py-2.5 rounded-lg transition-all text-sm font-medium hover:scale-105 animate-fade-in"
                  >
                    <BookMarked className="w-4 h-4" />
                    Termos
                  </button>
                  <button 
                    onClick={() => {
                      setQuestoesData({ artigo: sumula["Texto da Súmula"]!, numeroArtigo: sumula.id?.toString() || "" });
                      setQuestoesModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-border text-foreground px-4 py-2.5 rounded-lg transition-all text-sm font-medium hover:scale-105 animate-fade-in"
                  >
                    <FileQuestion className="w-4 h-4" />
                    Questões
                  </button>
                  <button 
                    onClick={() => handleShare(sumula)}
                    className="flex items-center justify-center gap-2 bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-border text-foreground px-4 py-2.5 rounded-lg transition-all text-sm font-medium hover:scale-105 animate-fade-in"
                  >
                    <Share2 className="w-4 h-4" />
                    Compartilhar
                  </button>
                  <button 
                    onClick={() => handleAskQuestion(sumula)}
                    className="flex items-center justify-center gap-2 bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-border text-foreground px-4 py-2.5 rounded-lg transition-all text-sm font-medium hover:scale-105 animate-fade-in"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Perguntar
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Font Size Controls */}
      <div className="fixed bottom-4 left-4 flex flex-col gap-2 z-30 animate-fade-in">
        <button onClick={increaseFontSize} className="bg-accent hover:bg-accent/90 text-accent-foreground w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110">
          <Plus className="w-4 h-4" />
        </button>
        <button onClick={decreaseFontSize} className="bg-accent hover:bg-accent/90 text-accent-foreground w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110">
          <Minus className="w-4 h-4" />
        </button>
        <div className="bg-card border border-border text-foreground text-xs font-medium px-2 py-1.5 rounded-full text-center shadow-lg">
          {fontSize}px
        </div>
      </div>
    </div>
  );
};

export default SumulaView;
