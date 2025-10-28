import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Search, MessageSquare, GraduationCap, Lightbulb, BookOpen, Bookmark, Plus, Minus, ArrowUp, BookMarked, FileQuestion } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import InlineAudioButton from "@/components/InlineAudioButton";
import AudioCommentButton from "@/components/AudioCommentButton";
import StickyAudioPlayer from "@/components/StickyAudioPlayer";
import ExplicacaoModal from "@/components/ExplicacaoModal";
import VideoAulaModal from "@/components/VideoAulaModal";
import TermosModal from "@/components/TermosModal";
import QuestoesModal from "@/components/QuestoesModal";
import PerguntaModal from "@/components/PerguntaModal";
import { FlashcardViewer } from "@/components/FlashcardViewer";
import { formatTextWithUppercase } from "@/lib/textFormatter";
import { CopyButton } from "@/components/CopyButton";
import { VadeMecumTabs } from "@/components/VadeMecumTabs";
import { VadeMecumPlaylist } from "@/components/VadeMecumPlaylist";
import { VadeMecumRanking } from "@/components/VadeMecumRanking";
import { useArticleTracking } from "@/hooks/useArticleTracking";
interface Article {
  id: number;
  "Número do Artigo": string | null;
  "Artigo": string | null;
  "Narração": string | null;
  "Comentario": string | null;
  "Aula": string | null;
}
const CodigoView = () => {
  const navigate = useNavigate();
  const {
    id
  } = useParams();
  const [searchParams] = useSearchParams();
  const contentRef = useRef<HTMLDivElement>(null);
  const firstResultRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(15);
  const [searchQuery, setSearchQuery] = useState("");

  // Auto-search based on URL parameter
  useEffect(() => {
    const artigoParam = searchParams.get('artigo');
    if (artigoParam) {
      setSearchQuery(artigoParam);
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
  const [perguntaModalOpen, setPerguntaModalOpen] = useState(false);
  const [perguntaData, setPerguntaData] = useState({ artigo: "", numeroArtigo: "" });
  
  // Tabs state
  const [activeTab, setActiveTab] = useState<'artigos' | 'playlist' | 'ranking'>('artigos');
  const codeNames: {
    [key: string]: string;
  } = {
    cc: "Código Civil",
    cp: "Código Penal",
    cpc: "Código de Processo Civil",
    cpp: "Código de Processo Penal",
    cf: "Constituição Federal",
    clt: "Consolidação das Leis do Trabalho",
    cdc: "Código de Defesa do Consumidor",
    ctn: "Código Tributário Nacional",
    ctb: "Código de Trânsito Brasileiro",
    ce: "Código Eleitoral",
    ca: "Código de Águas",
    cba: "Código Brasileiro de Aeronáutica",
    cbt: "Código Brasileiro de Telecomunicações",
    ccom: "Código Comercial",
    cdm: "Código de Minas"
  };
  
  const tableNames: {
    [key: string]: string;
  } = {
    cc: "CC - Código Civil",
    cp: "CP - Código Penal",
    cpc: "CPC – Código de Processo Civil",
    cpp: "CPP – Código de Processo Penal",
    cf: "CF - Constituição Federal",
    clt: "CLT – Consolidação das Leis do Trabalho",
    cdc: "CDC – Código de Defesa do Consumidor",
    ctn: "CTN – Código Tributário Nacional",
    ctb: "CTB Código de Trânsito Brasileiro",
    ce: "CE – Código Eleitoral",
    ca: "CA - Código de Águas",
    cba: "CBA Código Brasileiro de Aeronáutica",
    cbt: "CBT Código Brasileiro de Telecomunicações",
    ccom: "CCOM – Código Comercial",
    cdm: "CDM – Código de Minas"
  };
  
  const codeName = codeNames[id as string] || "Código";
  const tableName = tableNames[id as string] || "CP - Código Penal";
  const abbreviation = id?.toUpperCase() || "";

  // Fetch articles with React Query for caching
  const {
    data: articles = [],
    isLoading
  } = useQuery({
    queryKey: ['codigo-articles', id],
    queryFn: async () => {
      const tableMap: { [key: string]: string } = {
        'cc': 'CC - Código Civil',
        'cp': 'CP - Código Penal',
        'cpc': 'CPC – Código de Processo Civil',
        'cpp': 'CPP – Código de Processo Penal',
        'clt': 'CLT – Consolidação das Leis do Trabalho',
        'cdc': 'CDC – Código de Defesa do Consumidor',
        'ctn': 'CTN – Código Tributário Nacional',
        'ce': 'CE – Código Eleitoral',
        'cf': 'CF - Constituição Federal',
        'ca': 'CA - Código de Águas',
        'cba': 'CBA Código Brasileiro de Aeronáutica',
        'cbt': 'CBT Código Brasileiro de Telecomunicações',
        'ccom': 'CCOM – Código Comercial',
        'cdm': 'CDM – Código de Minas',
        'ctb': 'CTB Código de Trânsito Brasileiro'
      };

      const tableName = tableMap[id as string];
      
      if (!tableName) {
        console.error("Tabela não encontrada para código:", id);
        return [];
      }

      const {
        data,
        error
      } = await supabase.from(tableName as any).select("*").order("id", {
        ascending: true
      });
      
      if (error) {
        console.error("Erro ao buscar artigos:", error);
        throw error;
      }
      
      return (data || []) as any as Article[];
    },
    staleTime: 1000 * 60 * 30,
    // Cache válido por 30 minutos
    gcTime: 1000 * 60 * 60 // Manter em cache por 1 hora
  });
  // Filter and limit articles with useMemo
  const filteredArticles = useMemo(() => {
    if (!searchQuery) return articles;
    
    const searchLower = searchQuery.toLowerCase().trim();
    
    const filtered = articles.filter(article => {
      const numeroArtigo = article["Número do Artigo"]?.toLowerCase().trim();
      const conteudoArtigo = article["Artigo"]?.toLowerCase();
      
      // Busca exata pelo número do artigo
      if (numeroArtigo === searchLower) {
        return true;
      }
      
      // Busca por número que começa com o termo buscado (ex: buscar "78" não deve pegar "7")
      if (/^\d+$/.test(searchQuery) && numeroArtigo && /^\d+/.test(numeroArtigo)) {
        return numeroArtigo === searchLower;
      }
      
      // Busca pelo conteúdo do artigo
      return conteudoArtigo?.includes(searchLower);
    });
    
    // Ordenar para que artigos com número exato apareçam primeiro
    return filtered.sort((a, b) => {
      const aExato = a["Número do Artigo"]?.toLowerCase().trim() === searchLower;
      const bExato = b["Número do Artigo"]?.toLowerCase().trim() === searchLower;
      
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
  // Formata conteúdo do artigo usando formatador da Constituição
  const formatArticleContent = (content: string) => {
    return formatTextWithUppercase(content || "Conteúdo não disponível");
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
  
  const handleGenerateFlashcards = async (artigo: string, numeroArtigo: string) => {
    setLoadingFlashcards(true);
    try {
      const response = await supabase.functions.invoke('gerar-flashcards', {
        body: { content: `Art. ${numeroArtigo}\n${artigo}` }
      });
      
      if (response.error) throw response.error;
      
      setFlashcardsData(response.data.flashcards || []);
      setFlashcardsModalOpen(true);
      
      // Salvar flashcards na tabela
      if (response.data.flashcards && Array.isArray(response.data.flashcards)) {
        try {
          const { error: updateError } = await supabase
            .from(tableName as any)
            .update({ 
              flashcards: response.data.flashcards,
              ultima_atualizacao: new Date().toISOString()
            })
            .eq('Número do Artigo', numeroArtigo);
          
          if (updateError) {
            console.error('Erro ao salvar flashcards:', updateError);
          }
        } catch (saveError) {
          console.error('Erro ao salvar flashcards:', saveError);
        }
      }
    } catch (error) {
      console.error('Erro ao gerar flashcards:', error);
    } finally {
      setLoadingFlashcards(false);
    }
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

  // Registrar visualização quando buscar um artigo
  const registrarVisualizacao = async (numeroArtigo: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase
        .from('artigos_visualizacoes')
        .insert({
          tabela_codigo: tableName,
          numero_artigo: numeroArtigo,
          user_id: user?.id || null,
          origem: 'busca'
        });
    } catch (error) {
      console.error('Erro ao registrar visualização:', error);
    }
  };

  // Registrar visualização quando buscar um artigo específico
  useEffect(() => {
    if (searchQuery && filteredArticles.length > 0) {
      const primeiroArtigo = filteredArticles[0];
      if (primeiroArtigo["Número do Artigo"]) {
        registrarVisualizacao(primeiroArtigo["Número do Artigo"]);
      }
    }
  }, [searchQuery]);

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
            <div className="relative animate-fade-in">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input type="text" placeholder="Buscar por artigo ou conteúdo..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-input text-foreground pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-ring transition-all" />
            </div>
          </div>
        </div>
      )}

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
      <TermosModal 
        isOpen={termosModalOpen} 
        onClose={() => setTermosModalOpen(false)} 
        artigo={termosData.artigo} 
        numeroArtigo={termosData.numeroArtigo}
        codigoTabela={tableName}
      />

      {/* Questoes Modal */}
      <QuestoesModal 
        isOpen={questoesModalOpen} 
        onClose={() => setQuestoesModalOpen(false)} 
        artigo={questoesData.artigo} 
        numeroArtigo={questoesData.numeroArtigo}
        codigoTabela={tableName}
      />

      {/* Pergunta Modal */}
      <PerguntaModal isOpen={perguntaModalOpen} onClose={() => setPerguntaModalOpen(false)} artigo={perguntaData.artigo} numeroArtigo={perguntaData.numeroArtigo} />

      {/* Flashcards Modal */}
      {flashcardsModalOpen && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-accent">Flashcards</h2>
              <button onClick={() => setFlashcardsModalOpen(false)} className="p-2 hover:bg-secondary rounded-lg">
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <FlashcardViewer flashcards={flashcardsData} />
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div ref={contentRef} className="px-4 max-w-4xl mx-auto pb-0 overflow-y-auto" style={{ 
        height: activeTab === 'artigos' ? 'calc(100vh-126px)' : 'calc(100vh - 60px)' 
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

        // Destacar artigo se for resultado de busca
        const isHighlighted = searchQuery && article["Número do Artigo"]?.toLowerCase().trim() === searchQuery.toLowerCase().trim();

        // Se tem número, renderiza como card normal
        return <div key={article.id} ref={index === 0 && searchQuery ? firstResultRef : null} className={`relative bg-card/80 backdrop-blur-sm rounded-2xl p-6 mb-6 border transition-all duration-300 animate-fade-in hover:shadow-lg scroll-mt-4 ${
            isHighlighted 
              ? 'border-accent shadow-lg shadow-accent/20 ring-2 ring-accent/20' 
              : 'border-border/50 hover:border-accent/30 hover:shadow-accent/5'
          }`} style={{
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
                    onClick={() => {
                      setModalData({
                        artigo: article["Artigo"]!,
                        numeroArtigo: article["Número do Artigo"]!,
                        tipo: "explicacao",
                        nivel: "tecnico"
                      });
                      setModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 bg-[hsl(var(--secondary)/0.7)] hover:bg-[hsl(var(--secondary)/0.9)] text-foreground px-4 py-2.5 rounded-lg transition-all text-sm shadow-md hover:shadow-lg hover:scale-105 animate-fade-in"
                  >
                    <Lightbulb className="w-4 h-4" />
                    Explicar
                  </button>
                  <button onClick={() => handleOpenExplicacao(article["Artigo"]!, article["Número do Artigo"]!, "exemplo")} className="flex items-center justify-center gap-2 bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-border text-foreground px-4 py-2.5 rounded-lg transition-all text-sm font-medium hover:scale-105 animate-fade-in">
                    <BookOpen className="w-4 h-4" />
                    Exemplo
                  </button>
                  <button 
                    onClick={() => handleGenerateFlashcards(article["Artigo"]!, article["Número do Artigo"]!)} 
                    disabled={loadingFlashcards}
                    className="flex items-center justify-center gap-2 bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-border text-foreground px-4 py-2.5 rounded-lg transition-all text-sm font-medium hover:scale-105 animate-fade-in disabled:opacity-50"
                  >
                    <Bookmark className="w-4 h-4" />
                    {loadingFlashcards ? "Gerando..." : "Flashcards"}
                  </button>
                  <button 
                    onClick={() => {
                      setTermosData({ artigo: article["Artigo"]!, numeroArtigo: article["Número do Artigo"]! });
                      setTermosModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-border text-foreground px-4 py-2.5 rounded-lg transition-all text-sm font-medium hover:scale-105 animate-fade-in"
                  >
                    <BookMarked className="w-4 h-4" />
                    Termos
                  </button>
                  <button 
                    onClick={() => {
                      setQuestoesData({ artigo: article["Artigo"]!, numeroArtigo: article["Número do Artigo"]! });
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
              </div>
        })}
          </>
        )}
      </div>

      {/* Floating Controls - Only visible when content is showing on artigos tab */}
      {activeTab === 'artigos' && displayedArticles.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[60rem] px-4 flex justify-between z-30 pointer-events-none">
          {/* Font size controls on the left */}
          <div className="flex flex-col gap-2 animate-fade-in pointer-events-auto">
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

          {/* Scroll to top button on the right */}
          <div className="animate-fade-in pointer-events-auto">
            <button onClick={scrollToTop} className="bg-accent hover:bg-accent/90 text-accent-foreground w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110">
              <ArrowUp className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>;
};

export default CodigoView;