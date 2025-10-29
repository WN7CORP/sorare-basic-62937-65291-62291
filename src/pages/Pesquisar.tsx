import { Search, ChevronRight, BookOpen, PlayCircle, GraduationCap, Layers, Loader2, RefreshCw, Clock, Scale } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BibliotecaResult {
  id: number;
  livro: string;
  autor: string;
  imagem: string;
  biblioteca: string;
  bibliotecaId: string;
}

interface VideoResult {
  id: string;
  title: string;
  thumbnail: string;
  area?: string;
  playlistLink?: string;
}

interface CursoResult {
  id: number;
  tema: string;
  assunto: string;
  area: string;
  modulo: number;
  aula: number;
}

interface FlashcardResult {
  area: string;
  tema: string;
  count: number;
}

interface ArtigoResult {
  id: number;
  codigo: string;
  numero_artigo: string;
  artigo: string;
}

// Cache em memória para resultados
const searchCache = new Map<string, any>();

// Atalhos de pesquisa para termos comuns
const searchShortcuts: Record<string, { type: string; value: string; route?: string }> = {
  'constitucional': { type: 'area', value: 'Direito Constitucional' },
  'penal': { type: 'area', value: 'Direito Penal' },
  'civil': { type: 'area', value: 'Direito Civil' },
  'processo civil': { type: 'area', value: 'Direito Processual Civil' },
  'processo penal': { type: 'area', value: 'Direito Processual Penal' },
  'trabalho': { type: 'area', value: 'Direito do Trabalho' },
  'tributário': { type: 'area', value: 'Direito Tributário' },
  'empresarial': { type: 'area', value: 'Direito Empresarial' },
  'administrativo': { type: 'area', value: 'Direito Administrativo' },
  'oab': { type: 'biblioteca', value: 'oab', route: '/biblioteca-oab' },
  'classicos': { type: 'biblioteca', value: 'classicos', route: '/biblioteca-classicos' },
  'estudos': { type: 'biblioteca', value: 'estudos', route: '/biblioteca-estudos' },
  'simulado': { type: 'direct', value: 'simulados', route: '/simulados' },
  'flashcard': { type: 'direct', value: 'flashcards', route: '/flashcards' },
  'jurisprudencia': { type: 'direct', value: 'jurisprudencia', route: '/jurisprudencia' },
  'constituicao': { type: 'direct', value: 'constituicao', route: '/constituicao' },
};

// Helper para garantir que results sempre tenha todas as propriedades
const ensureResultsStructure = (data: any) => ({
  bibliotecas: data?.bibliotecas || [],
  livros: data?.livros || [],
  videoaulas: data?.videoaulas || [],
  cursos: data?.cursos || [],
  flashcards: data?.flashcards || [],
  artigos: data?.artigos || []
});

const Pesquisar = () => {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState<any>({ bibliotecas: [], livros: [], videoaulas: [], cursos: [], flashcards: [], artigos: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedTab, setSelectedTab] = useState("todos");
  const [cacheInfo, setCacheInfo] = useState<{ fromCache: boolean; updatedAt?: string; isUpdating?: boolean }>({ fromCache: false });
  const [searchProgress, setSearchProgress] = useState("");
  const navigate = useNavigate();

  // Pre-carregar todos os dados uma vez
  const { data: allCursos } = useQuery({
    queryKey: ["all-cursos"],
    queryFn: async () => {
      const { data } = await supabase.from('CURSOS' as any).select('*');
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos (antes cacheTime)
    refetchOnWindowFocus: false
  });

  const { data: allFlashcards } = useQuery({
    queryKey: ["all-flashcards"],
    queryFn: async () => {
      const { data } = await supabase.from('FLASHCARDS' as any).select('area, tema');
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    if (query.length >= 3) {
      const timer = setTimeout(() => handleSearch(query), 300); // Reduzido de 500ms para 300ms
      return () => clearTimeout(timer);
    } else if (query.length === 0) {
      setResults({ bibliotecas: [], livros: [], videoaulas: [], cursos: [], flashcards: [], artigos: [] });
      setHasSearched(false);
    }
  }, [query, allCursos, allFlashcards]);

  const handleSearch = async (searchQuery: string, forceRefresh = false) => {
    if (searchQuery.length < 3) return;
    
    const searchLower = searchQuery.toLowerCase().trim();
    
    // Verificar atalhos primeiro
    const shortcut = searchShortcuts[searchLower];
    if (shortcut?.route) {
      navigate(shortcut.route);
      return;
    }
    
    setIsSearching(true);
    setHasSearched(true);
    setSearchProgress("🔍 Procurando no cache...");
    
    try {
      // Verificar cache no banco de dados
      const { data: cacheData, error: cacheError } = await supabase
        .from('cache_pesquisas')
        .select('*')
        .eq('termo_pesquisado', searchLower)
        .maybeSingle();
      
      // Se existe cache e não é refresh forçado, usar o cache
      if (cacheData && !forceRefresh) {
        const cacheAge = new Date().getTime() - new Date(cacheData.updated_at).getTime();
        const isOld = cacheAge > 24 * 60 * 60 * 1000; // 24 horas
        
        setResults(ensureResultsStructure(cacheData.resultados));
        setCacheInfo({
          fromCache: true,
          updatedAt: cacheData.updated_at,
          isUpdating: false
        });
        setIsSearching(false);
        setSearchProgress("");
        
        // Se cache é antigo, atualizar em background
        if (isOld) {
          updateCacheInBackground(searchLower, cacheData.resultados, cacheData.total_resultados);
        }
        return;
      }
      
      // Busca completa
      setSearchProgress("📚 Buscando em bibliotecas...");
      const [bibliotecasData, livrosData] = await Promise.all([
        searchBibliotecas(searchLower),
        searchLivros(searchLower)
      ]);
      
      setSearchProgress("🎥 Buscando vídeos...");
      const videosData = await searchVideoaulas(searchLower);
      
      setSearchProgress("📖 Buscando cursos...");
      const cursosData = searchCursosOptimized(searchLower);
      
      setSearchProgress("⚡ Buscando flashcards...");
      const flashcardsData = searchFlashcardsOptimized(searchLower);

      setSearchProgress("⚖️ Buscando artigos...");
      const artigosData = await searchArtigos(searchLower);

      const resultData = { 
        bibliotecas: bibliotecasData,
        livros: livrosData, 
        videoaulas: videosData, 
        cursos: cursosData, 
        flashcards: flashcardsData,
        artigos: artigosData
      };
      
      const totalResults = bibliotecasData.length + livrosData.length + videosData.length + cursosData.length + flashcardsData.length + artigosData.length;
      
      // Salvar no banco de dados
      setSearchProgress("💾 Salvando resultados...");
      if (cacheData) {
        // Atualizar
        await supabase
          .from('cache_pesquisas')
          .update({
            resultados: resultData as any,
            total_resultados: totalResults
          })
          .eq('termo_pesquisado', searchLower);
      } else {
        // Inserir
        await supabase
          .from('cache_pesquisas')
          .insert({
            termo_pesquisado: searchLower,
            resultados: resultData as any,
            total_resultados: totalResults
          } as any);
      }
      
      // Atualizar cache em memória
      searchCache.set(searchLower, resultData);
      setResults(ensureResultsStructure(resultData));
      setCacheInfo({ fromCache: false });
      setSearchProgress("");
    } catch (error) {
      console.error("Erro na busca:", error);
      toast.error("Erro ao realizar a busca");
      setSearchProgress("");
    } finally {
      setIsSearching(false);
    }
  };
  
  // Atualizar cache em background
  const updateCacheInBackground = async (termo: string, oldResults: any, oldTotal: number) => {
    setCacheInfo(prev => ({ ...prev, isUpdating: true }));
    
    try {
      const [bibliotecasData, livrosData, videosData] = await Promise.all([
        searchBibliotecas(termo),
        searchLivros(termo),
        searchVideoaulas(termo)
      ]);
      
      const cursosData = searchCursosOptimized(termo);
      const flashcardsData = searchFlashcardsOptimized(termo);
      const artigosData = await searchArtigos(termo);
      
      const newResults = {
        bibliotecas: bibliotecasData,
        livros: livrosData,
        videoaulas: videosData,
        cursos: cursosData,
        flashcards: flashcardsData,
        artigos: artigosData
      };
      
      const newTotal = bibliotecasData.length + livrosData.length + videosData.length + cursosData.length + flashcardsData.length + artigosData.length;
      
      // Se houver diferença, atualizar
      if (newTotal !== oldTotal) {
        await supabase
          .from('cache_pesquisas')
          .update({
            resultados: newResults as any,
            total_resultados: newTotal
          })
          .eq('termo_pesquisado', termo);
        
        setResults(ensureResultsStructure(newResults));
        toast.success(`${newTotal - oldTotal > 0 ? 'Novo' : 'Atualizado'} conteúdo encontrado!`);
      }
    } catch (error) {
      console.error("Erro ao atualizar cache:", error);
    } finally {
      setCacheInfo(prev => ({ ...prev, isUpdating: false }));
    }
  };
  
  // Função otimizada que busca em memória quando possível
  const searchCursosOptimized = (searchTerm: string): CursoResult[] => {
    if (allCursos && allCursos.length > 0) {
      const seen = new Set<string>();
      return allCursos
        .filter((item: any) => 
          item.Area?.toLowerCase().includes(searchTerm) ||
          item.Tema?.toLowerCase().includes(searchTerm) ||
          item.Assunto?.toLowerCase().includes(searchTerm)
        )
        .filter((item: any) => {
          // Criar chave única apenas com Tema para evitar duplicação
          const key = `${item.Tema}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .slice(0, 10)
        .map((item: any) => ({
          id: item.id,
          tema: item.Tema || '',
          assunto: item.Assunto || '',
          area: item.Area || '',
          modulo: item.Modulo || 1,
          aula: item.Aula || 1
        }));
    }
    return [];
  };
  
  const searchFlashcardsOptimized = (searchTerm: string): FlashcardResult[] => {
    if (allFlashcards && allFlashcards.length > 0) {
      const filtered = allFlashcards.filter((item: any) =>
        item.area?.toLowerCase().includes(searchTerm) ||
        item.tema?.toLowerCase().includes(searchTerm)
      ).slice(0, 50);
      
      const grouped = filtered.reduce((acc: any, item: any) => {
        const key = `${item.area}|${item.tema}`;
        if (!acc[key]) acc[key] = { area: item.area, tema: item.tema, count: 0 };
        acc[key].count++;
        return acc;
      }, {});
      
      return Object.values(grouped);
    }
    return [];
  };

  const searchBibliotecas = async (searchTerm: string): Promise<BibliotecaResult[]> => {
    const bibliotecas = [
      { tabela: 'BIBLIOTECA-CLASSICOS', nome: 'Clássicos', id: 'classicos', colunas: ['livro', 'autor', 'area'] },
      { tabela: 'BIBLIOTECA-ESTUDOS', nome: 'Estudos', id: 'estudos', colunas: ['Tema', 'Área'] },
      { tabela: 'BIBILIOTECA-OAB', nome: 'OAB', id: 'oab', colunas: ['Tema', 'Área'] }
    ];

    const allResults: BibliotecaResult[] = [];
    for (const bib of bibliotecas) {
      try {
        let query;
        // Ajustar a query de acordo com as colunas da tabela
        if (bib.tabela === 'BIBLIOTECA-CLASSICOS') {
          query = supabase.from(bib.tabela as any).select('*')
            .or(`livro.ilike.%${searchTerm}%,autor.ilike.%${searchTerm}%,area.ilike.%${searchTerm}%`);
        } else {
          // Para ESTUDOS e OAB que usam Tema e Área
          query = supabase.from(bib.tabela as any).select('*')
            .or(`Tema.ilike.%${searchTerm}%,Área.ilike.%${searchTerm}%`);
        }
        
        const { data } = await query.limit(5);
        if (data) {
          allResults.push(...data.map((item: any) => ({
            id: item.id,
            livro: item.livro || item.Tema || '',
            autor: item.autor || '',
            imagem: item.imagem || item['Capa-livro'] || item['capa-livro'] || '',
            biblioteca: bib.nome,
            bibliotecaId: bib.id
          })));
        }
      } catch (err) {
        console.error(`Erro ao buscar em ${bib.tabela}:`, err);
      }
    }
    return allResults;
  };


  const searchLivros = async (searchTerm: string): Promise<BibliotecaResult[]> => {
    const bibliotecas = [
      { tabela: 'BIBLIOTECA-FORA-DA-TOGA', nome: 'Fora da Toga', id: 'fora-da-toga' },
      { tabela: 'BIBLIOTECA-LIDERANÇA', nome: 'Liderança', id: 'lideranca' },
      { tabela: 'BIBLIOTECA-ORATORIA', nome: 'Oratória', id: 'oratoria' }
    ];

    const allResults: BibliotecaResult[] = [];
    for (const bib of bibliotecas) {
      try {
        const { data } = await supabase.from(bib.tabela as any).select('*')
          .or(`livro.ilike.%${searchTerm}%,autor.ilike.%${searchTerm}%`).limit(5);
        if (data) {
          allResults.push(...data.map((item: any) => ({
            id: item.id,
            livro: item.livro || '',
            autor: item.autor || '',
            imagem: item.imagem || item['Capa-livro'] || item['capa-livro'] || '',
            biblioteca: bib.nome,
            bibliotecaId: bib.id
          })));
        }
      } catch (err) {
        console.error(`Erro ao buscar em ${bib.tabela}:`, err);
      }
    }
    return allResults;
  };

  const searchVideoaulas = async (searchTerm: string): Promise<VideoResult[]> => {
    try {
      // Buscar diretamente na tabela VIDEO AULAS-NOVO
      const { data: videos, error } = await supabase
        .from('VIDEO AULAS-NOVO' as any)
        .select('*')
        .or(`titulo.ilike.%${searchTerm}%,area.ilike.%${searchTerm}%,categoria.ilike.%${searchTerm}%`)
        .limit(20);
      
      if (error) throw error;
      
      return (videos || []).map((v: any) => ({
        id: v.link || '',
        title: v.titulo || '',
        thumbnail: v.thumb || '',
        area: v.area || '',
        playlistLink: v.link || ''
      }));
    } catch (err) {
      console.error('Erro ao buscar videoaulas:', err);
      return [];
    }
  };

  const searchArtigos = async (searchTerm: string): Promise<ArtigoResult[]> => {
    const codigos = [
      { tabela: 'CF - Constituição Federal', nome: 'Constituição Federal' },
      { tabela: 'CP - Código Penal', nome: 'Código Penal' },
      { tabela: 'CC - Código Civil', nome: 'Código Civil' },
      { tabela: 'CPC – Código de Processo Civil', nome: 'CPC' },
      { tabela: 'CPP – Código de Processo Penal', nome: 'CPP' },
      { tabela: 'CLT – Consolidação das Leis do Trabalho', nome: 'CLT' },
      { tabela: 'CTN – Código Tributário Nacional', nome: 'CTN' },
      { tabela: 'CDC – Código de Defesa do Consumidor', nome: 'CDC' }
    ];

    const allResults: ArtigoResult[] = [];
    for (const codigo of codigos) {
      try {
        const { data } = await supabase
          .from(codigo.tabela as any)
          .select('id, "Número do Artigo", Artigo')
          .or(`"Número do Artigo".ilike.%${searchTerm}%,Artigo.ilike.%${searchTerm}%`)
          .limit(5);
        
        if (data) {
          allResults.push(...data.map((item: any) => ({
            id: item.id,
            codigo: codigo.nome,
            numero_artigo: item['Número do Artigo'] || '',
            artigo: item.Artigo || ''
          })));
        }
      } catch (err) {
        console.error(`Erro ao buscar em ${codigo.tabela}:`, err);
      }
    }
    return allResults.slice(0, 10);
  };

  const totalResults = 
    (results.bibliotecas?.length || 0) + 
    (results.livros?.length || 0) + 
    (results.videoaulas?.length || 0) + 
    (results.cursos?.length || 0) + 
    (results.flashcards?.length || 0) + 
    (results.artigos?.length || 0);

  return (
      <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-bold mb-1">Pesquisar</h1>
          <p className="text-sm text-muted-foreground">Busque em bibliotecas, cursos e flashcards</p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Digite pelo menos 3 caracteres..." 
            className="pl-10 h-11" 
            value={query}
            onChange={(e) => setQuery(e.target.value)} 
            autoFocus 
          />
        </div>

        {query.length >= 3 && (
          <Button 
            onClick={() => handleSearch(query)} 
            className="w-full mb-6"
            disabled={isSearching}
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Pesquisando...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Pesquisar
              </>
            )}
          </Button>
        )}

      {isSearching && (
        <div className="text-center py-8 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto" />
          {searchProgress && (
            <p className="text-sm text-muted-foreground animate-pulse">{searchProgress}</p>
          )}
        </div>
      )}

      {!isSearching && hasSearched && totalResults === 0 && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary mb-3">
            <Search className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Nenhum resultado encontrado</p>
        </div>
      )}

      {!isSearching && !hasSearched && (
        <div className="text-center py-16">
          <Search className="w-14 h-14 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {query.length === 0 ? 'Digite algo para iniciar' : `Digite mais ${3 - query.length} caractere${3 - query.length > 1 ? 's' : ''}`}
          </p>
        </div>
      )}

      {!isSearching && totalResults > 0 && (
        <>
          {/* Informação de Cache */}
          {(cacheInfo.fromCache || cacheInfo.isUpdating) && (
            <div className="mb-4 flex items-center justify-between bg-secondary/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm">
                {cacheInfo.fromCache && (
                  <>
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Atualizado {cacheInfo.updatedAt && formatDistanceToNow(new Date(cacheInfo.updatedAt), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </span>
                  </>
                )}
                {cacheInfo.isUpdating && (
                  <Badge variant="outline" className="gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Verificando atualizações...
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSearch(query, true)}
                className="h-8 text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Atualizar
              </Button>
            </div>
          )}
        
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="w-full grid grid-cols-7 mb-6 h-auto gap-1.5 bg-secondary/50 p-2">
            <TabsTrigger value="todos" className="text-xs">Todos ({totalResults})</TabsTrigger>
            <TabsTrigger value="artigos" disabled={!(results.artigos?.length || 0)} className="text-xs">⚖️ ({results.artigos?.length || 0})</TabsTrigger>
            <TabsTrigger value="bibliotecas" disabled={!(results.bibliotecas?.length || 0)} className="text-xs">📚 ({results.bibliotecas?.length || 0})</TabsTrigger>
            <TabsTrigger value="videoaulas" disabled={!(results.videoaulas?.length || 0)} className="text-xs">🎥 ({results.videoaulas?.length || 0})</TabsTrigger>
            <TabsTrigger value="livros" disabled={!(results.livros?.length || 0)} className="text-xs">📕 ({results.livros?.length || 0})</TabsTrigger>
            <TabsTrigger value="cursos" disabled={!(results.cursos?.length || 0)} className="text-xs">📖 ({results.cursos?.length || 0})</TabsTrigger>
            <TabsTrigger value="flashcards" disabled={!(results.flashcards?.length || 0)} className="text-xs">⚡ ({results.flashcards?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="todos" className="space-y-6">
            {(results.artigos?.length || 0) > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-purple-500" />Artigos ({results.artigos.length})
                </h2>
                <div className="space-y-2">
                  {results.artigos.slice(0, 5).map((item: ArtigoResult) => (
                    <button 
                      key={item.id} 
                      onClick={() => navigate(`/vade-mecum/busca?q=${encodeURIComponent(item.numero_artigo)}`)}
                      className="w-full bg-card hover:bg-accent/10 border rounded-lg p-3 text-left transition-all group"
                    >
                      <div className="flex gap-3 items-start">
                        <Scale className="w-5 h-5 text-purple-500 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                          <p className="text-xs text-purple-500 mb-1">{item.codigo} • Art. {item.numero_artigo}</p>
                          <h3 className="font-semibold text-sm line-clamp-2">{item.artigo}</h3>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-accent flex-shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {(results.videoaulas?.length || 0) > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-red-500" />Videoaulas ({results.videoaulas.length})
                </h2>
                <div className="space-y-2">
                  {results.videoaulas.slice(0, 3).map((item: VideoResult) => (
                    <button key={item.id} onClick={() => navigate(`/videoaulas/player?link=${encodeURIComponent(item.playlistLink || '')}&videoId=${item.id}&fromSearch=true`)}
                      className="w-full bg-card hover:bg-accent/10 border rounded-lg p-3 text-left transition-all group">
                      <div className="flex gap-3">
                        <img src={item.thumbnail} alt={item.title} className="w-24 aspect-video object-cover rounded" />
                        <div className="flex-1">
                          {item.area && <p className="text-xs text-red-500 mb-1">{item.area}</p>}
                          <h3 className="font-semibold text-sm line-clamp-2">{item.title}</h3>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-accent" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(results.livros?.length || 0) > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-orange-500" />Livros ({results.livros.length})
                </h2>
                <div className="space-y-2">
                  {results.livros.slice(0, 3).map((item: BibliotecaResult) => (
                    <button key={item.id} onClick={() => navigate(`/biblioteca-${item.bibliotecaId}/${item.id}`)}
                      className="w-full bg-card hover:bg-accent/10 border rounded-lg p-3 text-left transition-all group">
                      <div className="flex gap-3">
                        {item.imagem && <img src={item.imagem} alt={item.livro} className="w-12 h-16 object-cover rounded shadow-sm" />}
                        <div className="flex-1">
                          <p className="text-xs text-orange-500 mb-1">{item.biblioteca}</p>
                          <h3 className="font-semibold text-sm">{item.livro}</h3>
                          {item.autor && <p className="text-xs text-muted-foreground">{item.autor}</p>}
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-accent" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(results.bibliotecas?.length || 0) > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />Bibliotecas ({results.bibliotecas.length})
                </h2>
                <div className="space-y-2">
                  {results.bibliotecas.slice(0, 3).map((item: BibliotecaResult) => (
                    <button key={item.id} onClick={() => navigate(`/biblioteca-${item.bibliotecaId}/${item.id}`)}
                      className="w-full bg-card hover:bg-accent/10 border rounded-lg p-3 text-left transition-all group">
                      <div className="flex gap-3">
                        {item.imagem && <img src={item.imagem} alt={item.livro} className="w-12 h-16 object-cover rounded" />}
                        <div className="flex-1">
                          <p className="text-xs text-accent mb-1">{item.biblioteca}</p>
                          <h3 className="font-semibold text-sm">{item.livro}</h3>
                          {item.autor && <p className="text-xs text-muted-foreground">{item.autor}</p>}
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-accent" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(results.cursos?.length || 0) > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />Cursos ({results.cursos.length})
                </h2>
                <div className="space-y-2">
                  {results.cursos.slice(0, 3).map((item: CursoResult) => (
                    <button key={item.id} onClick={() => navigate(`/cursos/aula?id=${item.id}&fromSearch=true`)}
                      className="w-full bg-card hover:bg-accent/10 border rounded-lg p-3 text-left transition-all group relative">
                      <p className="text-xs text-blue-500 mb-1">{item.area} • M{item.modulo} • A{item.aula}</p>
                      <h3 className="font-semibold text-sm">{item.tema}</h3>
                      <ChevronRight className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-accent" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(results.flashcards?.length || 0) > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-500" />Flashcards ({results.flashcards.length})
                </h2>
                <div className="space-y-2">
                  {results.flashcards.slice(0, 3).map((item: FlashcardResult) => (
                    <button key={`${item.area}-${item.tema}`}
                      onClick={() => navigate(`/flashcards/estudar?area=${encodeURIComponent(item.area)}&tema=${encodeURIComponent(item.tema)}&fromSearch=true`)}
                      className="w-full bg-card hover:bg-accent/10 border rounded-lg p-3 text-left transition-all">
                      <p className="text-xs text-purple-500 mb-1">{item.area}</p>
                      <h3 className="font-semibold text-sm">{item.tema}</h3>
                      <p className="text-xs text-muted-foreground">{item.count} flashcards</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="bibliotecas" className="space-y-2">
            {results.bibliotecas.map((item: BibliotecaResult) => (
              <button key={item.id} onClick={() => navigate(`/biblioteca-${item.bibliotecaId}/${item.id}`)}
                className="w-full bg-card hover:bg-accent/10 border rounded-lg p-4 text-left transition-all">
                <div className="flex gap-4">
                  {item.imagem && <img src={item.imagem} alt={item.livro} className="w-16 h-20 object-cover rounded" />}
                  <div className="flex-1">
                    <p className="text-sm text-accent font-medium">{item.biblioteca}</p>
                    <h3 className="font-bold">{item.livro}</h3>
                    {item.autor && <p className="text-sm text-muted-foreground">{item.autor}</p>}
                  </div>
                </div>
              </button>
            ))}
          </TabsContent>

          <TabsContent value="videoaulas" className="space-y-2">
            {results.videoaulas.map((item: VideoResult) => (
              <button key={item.id} onClick={() => navigate(`/videoaulas/player?link=${encodeURIComponent(item.playlistLink || '')}&videoId=${item.id}&fromSearch=true`)}
                className="w-full bg-card hover:bg-accent/10 border rounded-lg p-4 text-left transition-all">
                <div className="flex gap-4">
                  <div className="relative w-32 aspect-video flex-shrink-0 rounded overflow-hidden">
                    <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <PlayCircle className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    {item.area && <p className="text-sm text-red-500 mb-1 font-medium">{item.area}</p>}
                    <h3 className="font-bold line-clamp-3">{item.title}</h3>
                  </div>
                </div>
              </button>
            ))}
          </TabsContent>

          <TabsContent value="livros" className="space-y-2">
            {results.livros.map((item: BibliotecaResult) => (
              <button key={item.id} onClick={() => navigate(`/biblioteca-${item.bibliotecaId}/${item.id}`)}
                className="w-full bg-card hover:bg-accent/10 border rounded-lg p-4 text-left transition-all">
                <div className="flex gap-4">
                  {item.imagem && <img src={item.imagem} alt={item.livro} className="w-20 h-28 object-cover rounded shadow-md" />}
                  <div className="flex-1">
                    <p className="text-sm text-orange-500 font-medium">{item.biblioteca}</p>
                    <h3 className="font-bold">{item.livro}</h3>
                    {item.autor && <p className="text-sm text-muted-foreground">{item.autor}</p>}
                  </div>
                </div>
              </button>
            ))}
          </TabsContent>

          <TabsContent value="cursos" className="space-y-2">
            {results.cursos.map((item: CursoResult) => (
              <button key={item.id} onClick={() => navigate(`/cursos/aula?id=${item.id}&fromSearch=true`)}
                className="w-full bg-card hover:bg-accent/10 border rounded-lg p-4 text-left transition-all">
                <p className="text-sm text-blue-500 mb-2">{item.area} • Módulo {item.modulo} • Aula {item.aula}</p>
                <h3 className="font-bold">{item.tema}</h3>
                <p className="text-sm text-muted-foreground">{item.assunto}</p>
              </button>
            ))}
          </TabsContent>

          <TabsContent value="flashcards" className="space-y-2">
            {results.flashcards.map((item: FlashcardResult) => (
              <button key={`${item.area}-${item.tema}`}
                onClick={() => navigate(`/flashcards/estudar?area=${encodeURIComponent(item.area)}&tema=${encodeURIComponent(item.tema)}&fromSearch=true`)}
                className="w-full bg-card hover:bg-accent/10 border rounded-lg p-4 text-left transition-all">
                <p className="text-sm text-purple-500 mb-2">{item.area}</p>
                <h3 className="font-bold">{item.tema}</h3>
                <p className="text-sm text-muted-foreground">{item.count} flashcards disponíveis</p>
              </button>
            ))}
          </TabsContent>

          <TabsContent value="artigos" className="space-y-2">
            {results.artigos.map((item: ArtigoResult) => (
              <button 
                key={item.id} 
                onClick={() => navigate(`/vade-mecum/busca?q=${encodeURIComponent(item.numero_artigo)}`)}
                className="w-full bg-card hover:bg-accent/10 border rounded-lg p-4 text-left transition-all"
              >
                <div className="flex gap-3 items-start">
                  <Scale className="w-5 h-5 text-purple-500 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-purple-500 mb-2 font-medium">{item.codigo} • Artigo {item.numero_artigo}</p>
                    <h3 className="font-bold text-sm line-clamp-3">{item.artigo}</h3>
                  </div>
                </div>
              </button>
            ))}
          </TabsContent>
        </Tabs>
        </>
      )}
    </div>
  );
};

export default Pesquisar;
