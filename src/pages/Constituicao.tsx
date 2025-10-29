import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Search, MessageSquare, GraduationCap, Lightbulb, BookOpen, Bookmark, Plus, Minus, ArrowUp, BookMarked, FileQuestion, ChevronDown, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllRows } from "@/lib/fetchAllRows";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import InlineAudioButton from "@/components/InlineAudioButton";
import AudioCommentButton from "@/components/AudioCommentButton";
import StickyAudioPlayer from "@/components/StickyAudioPlayer";
import ExplicacaoModal from "@/components/ExplicacaoModal";
import VideoAulaModal from "@/components/VideoAulaModal";
import QuestoesModal from "@/components/QuestoesModal";
import TermosModal from "@/components/TermosModal";
import PerguntaModal from "@/components/PerguntaModal";
import FlashcardsArtigoModal from "@/components/FlashcardsArtigoModal";
import { formatTextWithUppercase } from "@/lib/textFormatter";
import { CopyButton } from "@/components/CopyButton";
import { VadeMecumTabs } from "@/components/VadeMecumTabs";
import { VadeMecumPlaylist } from "@/components/VadeMecumPlaylist";
import { VadeMecumRanking } from "@/components/VadeMecumRanking";
interface Article {
  id: number;
  "Número do Artigo": string | null;
  "Artigo": string | null;
  "Narração": string | null;
  "Comentario": string | null;
  "Aula": string | null;
}
interface Article {
  id: number;
  "Número do Artigo": string;
  Artigo: string;
  Narração: string;
  Comentario: string;
  Aula: string;
}
const Constituicao = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const contentRef = useRef<HTMLDivElement>(null);
  const firstResultRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(15);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [displayLimit, setDisplayLimit] = useState(50);

  // Auto-search based on URL parameter
  useEffect(() => {
    const artigoParam = searchParams.get('artigo');
    if (artigoParam) {
      setSearchQuery(artigoParam);
    }
  }, [searchParams]);
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
  const [questoesModalOpen, setQuestoesModalOpen] = useState(false);
  const [questoesModalData, setQuestoesModalData] = useState({
    artigo: "",
    numeroArtigo: ""
  });
  const [termosModalOpen, setTermosModalOpen] = useState(false);
  const [termosModalData, setTermosModalData] = useState({
    artigo: "",
    numeroArtigo: ""
  });
  const [flashcardsModalOpen, setFlashcardsModalOpen] = useState(false);
  const [flashcardsModalData, setFlashcardsModalData] = useState({
    artigo: "",
    numeroArtigo: ""
  });
  const [perguntaModalOpen, setPerguntaModalOpen] = useState(false);
  const [perguntaData, setPerguntaData] = useState({ artigo: "", numeroArtigo: "" });
  
  // Tabs state
  const [activeTab, setActiveTab] = useState<'artigos' | 'playlist' | 'ranking'>('artigos');
  
  const tableName = "CF - Constituição Federal";
  const codeName = "Constituição Federal";

  // Fetch articles with React Query for caching
  const {
    data: articles = [],
    isLoading
  } = useQuery({
    queryKey: ['constituicao-articles-v2'],
    queryFn: async () => {
      const data = await fetchAllRows<Article>("CF - Constituição Federal", "id");
      return data as any[];
    },
    staleTime: 1000 * 60 * 30,
    // Cache válido por 30 minutos
    gcTime: 1000 * 60 * 60 // Manter em cache por 1 hora
  });

  // Filter and limit articles with useMemo
  const filteredArticles = useMemo(() => {
    if (!searchQuery) return articles;
    const searchLower = searchQuery.toLowerCase().trim();
    const isNumericSearch = /^\d+$/.test(searchLower);
    const normalizeDigits = (s: string) => s.replace(/\D/g, "");

    const filtered = articles.filter(article => {
      const numeroArtigoRaw = article["Número do Artigo"] || "";
      const numeroArtigo = numeroArtigoRaw.toLowerCase().trim();
      const conteudoArtigo = article["Artigo"]?.toLowerCase() || "";

      if (isNumericSearch) {
        const numeroDigits = normalizeDigits(numeroArtigo);
        if (numeroDigits === searchLower) return true;
      } else {
        if (numeroArtigo === searchLower || numeroArtigo.includes(searchLower)) return true;
      }

      return conteudoArtigo.includes(searchLower);
    });

    return filtered.sort((a, b) => {
      const aNum = (a["Número do Artigo"] || "").toLowerCase().trim();
      const bNum = (b["Número do Artigo"] || "").toLowerCase().trim();
      const aExato = isNumericSearch ? normalizeDigits(aNum) === searchLower : aNum === searchLower;
      const bExato = isNumericSearch ? normalizeDigits(bNum) === searchLower : bNum === searchLower;
      if (aExato && !bExato) return -1;
      if (!aExato && bExato) return 1;
      return 0;
    });
  }, [articles, searchQuery]);
  const displayedArticles = useMemo(() => {
    return searchQuery ? filteredArticles : filteredArticles.slice(0, displayLimit);
  }, [filteredArticles, displayLimit, searchQuery]);

  // Filter articles with audio for playlist
  const articlesWithAudio = useMemo(() => {
    return articles.filter(article => 
      article["Narração"] && 
      article["Narração"].trim() !== "" &&
      article["Número do Artigo"] &&
      article["Número do Artigo"].trim() !== ""
    ) as any[];
  }, [articles]);

  // Auto-scroll to first result when searching
  useEffect(() => {
    if (searchQuery && filteredArticles.length > 0 && firstResultRef.current) {
      setTimeout(() => {
        firstResultRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  }, [searchQuery, filteredArticles]);

  // Infinite scroll handler
  useEffect(() => {
    const element = contentRef.current;
    if (!searchQuery && element) {
      const handleScroll = () => {
        if (!element) return;
        const scrollTop = element.scrollTop;
        const scrollHeight = element.scrollHeight;
        const clientHeight = element.clientHeight;
        if (scrollTop + clientHeight >= scrollHeight - 500 && displayLimit < filteredArticles.length) {
          setDisplayLimit(prev => Math.min(prev + 30, filteredArticles.length));
        }
      };
      element.addEventListener('scroll', handleScroll);
      return () => element.removeEventListener('scroll', handleScroll);
    }
  }, [displayLimit, filteredArticles.length, searchQuery]);
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
  const handleOpenAula = (article: Article) => {
    if (article.Aula && article["Artigo"] && article["Número do Artigo"]) {
      setVideoModalData({
        videoUrl: article.Aula,
        artigo: article["Artigo"],
        numeroArtigo: article["Número do Artigo"]
      });
      setVideoModalOpen(true);
    }
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
  
  // Formata o conteúdo do artigo aplicando negrito (sem amarelo) a parágrafos, incisos e alíneas
  const formatArticleContent = (content: string): string => {
    if (!content) return "Conteúdo não disponível";
    
    let result = content;
    
    // Aplicar negrito (sem amarelo) APENAS a parágrafos no início da linha
    result = result.replace(/(^|\n)(§\s*\d+º)/gm, '$1<strong class="font-bold">$2</strong>');
    
    // Aplicar negrito (sem amarelo) a "Parágrafo único" no início da linha
    result = result.replace(/(^|\n)(Parágrafo único)/gim, '$1<strong class="font-bold">$2</strong>');
    
    // Aplicar negrito (sem amarelo) a incisos APENAS quando estão no início da linha
    result = result.replace(/(^|\n)(\s*)(I{1,3}|IV|V|VI{0,3}|IX|X{1,3}|XL|L|XC|C)\s*[-–—]/gm, '$1$2<strong class="font-bold">$3</strong> -');
    
    // Aplicar negrito (sem amarelo) a alíneas APENAS quando estão no início da linha
    result = result.replace(/(^|\n)(\s*)([a-z])\)/gm, '$1$2<strong class="font-bold">$3)</strong>');
    
    return result;
  };
  
  const scrollToTop = () => {
    contentRef.current?.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const handleArticleClick = (numeroArtigo: string) => {
    setActiveTab('artigos');
    setSearchQuery(numeroArtigo);
  };
  return <div className="min-h-screen bg-background text-foreground">
      {/* Tabs */}
      <div className="sticky top-0 z-30">
        <VadeMecumTabs 
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab as any)}
        />
      </div>

      {/* Search Bar - only show on artigos tab */}
      {activeTab === 'artigos' && (
        <div className="sticky top-[60px] bg-background border-b border-border z-20">
          <div className="px-4 pt-4 pb-2 max-w-4xl mx-auto">
            <div className="space-y-2">
              <div className="relative animate-fade-in flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="Buscar por artigo ou conteúdo..." 
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setSearchQuery(searchInput);
                      }
                    }}
                    className="w-full bg-input text-foreground pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-ring transition-all" 
                  />
                </div>
                
                <Button
                  onClick={() => setSearchQuery(searchInput)}
                  disabled={!searchInput.trim()}
                  size="lg"
                  className="px-6 shrink-0"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Buscar
                </Button>
                
                {searchQuery && (
                  <Button
                    onClick={() => {
                      setSearchInput("");
                      setSearchQuery("");
                    }}
                    variant="outline"
                    size="lg"
                    className="px-4 shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                )}
              </div>
              
              {searchQuery && (
                <p className="text-xs text-muted-foreground text-center">
                  {filteredArticles.length} {filteredArticles.length === 1 ? 'artigo encontrado' : 'artigos encontrados'}
                </p>
              )}
              
              {/* Controles de Texto e Navegação */}
              <div className="flex items-center justify-center gap-4 py-3 border-t border-border/50 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Tamanho:</span>
                  <Button
                    onClick={decreaseFontSize}
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0"
                    disabled={fontSize <= 12}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="text-xs font-medium text-foreground min-w-[3rem] text-center">
                    {fontSize}px
                  </span>
                  <Button
                    onClick={increaseFontSize}
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0"
                    disabled={fontSize >= 24}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                
                <div className="h-4 w-px bg-border" />
                
                <Button
                  onClick={scrollToTop}
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1.5"
                >
                  <ArrowUp className="w-3 h-3" />
                  <span className="text-xs">Topo</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Audio Player for Comments */}
      <StickyAudioPlayer isOpen={stickyPlayerOpen} onClose={() => setStickyPlayerOpen(false)} audioUrl={currentAudio.url} title={currentAudio.title} />

      {/* Explicacao Modal */}
      <ExplicacaoModal isOpen={modalOpen} onClose={() => setModalOpen(false)} artigo={modalData.artigo} numeroArtigo={modalData.numeroArtigo} tipo={modalData.tipo} nivel={modalData.nivel} />

      {/* Video Aula Modal */}
      <VideoAulaModal isOpen={videoModalOpen} onClose={() => setVideoModalOpen(false)} videoUrl={videoModalData.videoUrl} artigo={videoModalData.artigo} numeroArtigo={videoModalData.numeroArtigo} />

      {/* Questoes Modal */}
      <QuestoesModal 
        isOpen={questoesModalOpen} 
        onClose={() => setQuestoesModalOpen(false)} 
        artigo={questoesModalData.artigo} 
        numeroArtigo={questoesModalData.numeroArtigo}
        codigoTabela="CF - Constituição Federal"
      />

      {/* Termos Modal */}
      <TermosModal 
        isOpen={termosModalOpen} 
        onClose={() => setTermosModalOpen(false)} 
        artigo={termosModalData.artigo} 
        numeroArtigo={termosModalData.numeroArtigo}
        codigoTabela="CF - Constituição Federal"
      />

      {/* Flashcards Modal */}
      <FlashcardsArtigoModal 
        isOpen={flashcardsModalOpen} 
        onClose={() => setFlashcardsModalOpen(false)} 
        artigo={flashcardsModalData.artigo} 
        numeroArtigo={flashcardsModalData.numeroArtigo}
        codigoTabela="CF - Constituição Federal"
      />

      {/* Pergunta Modal */}
      <PerguntaModal isOpen={perguntaModalOpen} onClose={() => setPerguntaModalOpen(false)} artigo={perguntaData.artigo} numeroArtigo={perguntaData.numeroArtigo} />

      {/* Content */}
      <div ref={contentRef} className="px-4 max-w-4xl mx-auto pb-0 overflow-y-auto" style={{ 
        height: activeTab === 'artigos' ? 'calc(100vh - 184px)' : 'calc(100vh - 60px)' 
      }}>
        
        {/* Playlist Tab */}
        {activeTab === 'playlist' && (
          <VadeMecumPlaylist 
            articles={articlesWithAudio}
            codigoNome={codeName}
          />
        )}

        {/* Ranking Tab */}
        {activeTab === 'ranking' && (
          <VadeMecumRanking 
            tableName={tableName}
            codigoNome={codeName}
            onArticleClick={handleArticleClick}
          />
        )}

        {/* Articles Tab */}
        {activeTab === 'artigos' && (
          <>
        {isLoading ? <div className="space-y-6">
            {[1, 2, 3].map(i => <div key={i} className="bg-card rounded-2xl p-6 border border-border">
                <Skeleton className="h-8 w-32 mb-3" />
                <Skeleton className="h-6 w-48 mb-4" />
                <Skeleton className="h-24 w-full mb-6" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map(j => <Skeleton key={j} className="h-10 w-full" />)}
                </div>
              </div>)}
          </div> : displayedArticles.length === 0 ? <div className="text-center text-muted-foreground py-12">
            {searchQuery ? "Nenhum artigo encontrado para sua busca." : "Nenhum artigo disponível."}
          </div> : displayedArticles.map((article, index) => {
        const hasNumber = article["Número do Artigo"] && article["Número do Artigo"].trim() !== "";

        // Se não tem número, renderiza como cabeçalho de seção
        if (!hasNumber) {
          return <div key={article.id} className="text-center mb-8 space-y-1 font-serif-content">
                  <div className="whitespace-pre-line" dangerouslySetInnerHTML={{
              __html: formatTextWithUppercase(article["Artigo"] || "")
            }} />
                </div>;
        }

        // Se tem número, renderiza como card normal
        return <div key={article.id} ref={index === 0 && searchQuery ? firstResultRef : null} className="relative bg-card/80 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-border/50 hover:border-accent/30 transition-all duration-300 animate-fade-in hover:shadow-lg hover:shadow-accent/5 scroll-mt-4" style={{
          animationDelay: `${index * 0.05}s`,
          animationFillMode: 'backwards'
        }}>
                {/* Copy Button */}
                <CopyButton 
                  text={article["Artigo"] || ""}
                  articleNumber={article["Número do Artigo"] || ""}
                />
                
                {/* Article Header */}
                <h2 className="text-accent font-bold text-xl md:text-2xl mb-3 animate-scale-in">
                  Art. {article["Número do Artigo"]}
                </h2>

                {/* Article Content */}
                <div 
                  className="article-content text-foreground/90 mb-6 whitespace-pre-line leading-relaxed font-serif-content" 
                  style={{
                    fontSize: `${fontSize}px`,
                    lineHeight: "1.7"
                  }}
                  dangerouslySetInnerHTML={{
                    __html: formatArticleContent(article["Artigo"] || "Conteúdo não disponível")
                  }}
                />

                {/* Action Buttons */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                  {article["Narração"] && <InlineAudioButton audioUrl={article["Narração"]!} articleNumber={article["Número do Artigo"]!} />}
                  {article["Comentario"] && (
                    <AudioCommentButton 
                      isPlaying={stickyPlayerOpen && currentAudio.isComment && currentAudio.title.includes(article["Número do Artigo"]!)}
                      onClick={() => handlePlayComment(article["Comentario"]!, `Comentário - Art. ${article["Número do Artigo"]}`)}
                    />
                  )}
                  {article["Aula"] && <button onClick={() => handleOpenAula(article)} className="flex items-center justify-center gap-2 bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-border text-foreground px-4 py-2.5 rounded-lg transition-all text-sm font-medium hover:scale-105 animate-fade-in">
                      <GraduationCap className="w-4 h-4" />
                      Aula
                    </button>}
                  
                  <button 
                    onClick={() => handleOpenExplicacao(article["Artigo"]!, article["Número do Artigo"]!, "explicacao")}
                    className="flex items-center justify-center gap-2 bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-border text-foreground px-4 py-2.5 rounded-lg transition-all text-sm font-medium hover:scale-105 animate-fade-in"
                  >
                    <Lightbulb className="w-4 h-4" />
                    Explicar
                  </button>

                  <button onClick={() => handleOpenExplicacao(article["Artigo"]!, article["Número do Artigo"]!, "exemplo")} className="flex items-center justify-center gap-2 bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-border text-foreground px-4 py-2.5 rounded-lg transition-all text-sm font-medium hover:scale-105 animate-fade-in">
                    <BookOpen className="w-4 h-4" />
                    Exemplo
                  </button>
                  <button 
                    onClick={() => {
                      setFlashcardsModalData({
                        artigo: article["Artigo"]!,
                        numeroArtigo: article["Número do Artigo"]!
                      });
                      setFlashcardsModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-border text-foreground px-4 py-2.5 rounded-lg transition-all text-sm font-medium hover:scale-105 animate-fade-in">
                    <Bookmark className="w-4 h-4" />
                    Flashcards
                  </button>
                  <button 
                    onClick={() => {
                      setTermosModalData({ artigo: article["Artigo"]!, numeroArtigo: article["Número do Artigo"]! });
                      setTermosModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-border text-foreground px-4 py-2.5 rounded-lg transition-all text-sm font-medium hover:scale-105 animate-fade-in"
                  >
                    <BookMarked className="w-4 h-4" />
                    Termos
                  </button>
                  <button 
                    onClick={() => {
                      setQuestoesModalData({ artigo: article["Artigo"]!, numeroArtigo: article["Número do Artigo"]! });
                      setQuestoesModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-border text-foreground px-4 py-2.5 rounded-lg transition-all text-sm font-medium hover:scale-105 animate-fade-in"
                  >
                    <FileQuestion className="w-4 h-4" />
                    Questões
                  </button>
                  <button 
                    onClick={() => {
                      setPerguntaData({ artigo: article["Artigo"]!, numeroArtigo: article["Número do Artigo"]! });
                      setPerguntaModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-border text-foreground px-4 py-2.5 rounded-lg transition-all text-sm font-medium hover:scale-105 animate-fade-in"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Perguntar
                  </button>
                 </div>
               </div>;
      })}
          </>
        )}
      </div>
    </div>;
};
export default Constituicao;