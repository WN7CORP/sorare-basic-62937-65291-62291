import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaCard } from "@/components/jogos/AreaCard";
interface TemasAgrupados {
  [area: string]: string[];
}
type Etapa = 'area' | 'selecao-tema';
const JogoConfig = () => {
  const navigate = useNavigate();
  const {
    tipo
  } = useParams<{
    tipo: string;
  }>();
  const [etapa, setEtapa] = useState<Etapa>('area');
  const [dificuldade, setDificuldade] = useState<'facil' | 'medio' | 'dificil'>('medio');
  const [temasAgrupados, setTemasAgrupados] = useState<TemasAgrupados>({});
  const [selectedTema, setSelectedTema] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingFontes, setLoadingFontes] = useState(false);
  const nomeJogos: Record<string, string> = {
    forca: 'Jogo da Forca',
    cruzadas: 'Palavras Cruzadas',
    caca_palavras: 'Caça-Palavras',
    stop: 'Stop Jurídico'
  };
  useEffect(() => {
    carregarAreas();
  }, []);
  const carregarAreas = async () => {
    setLoadingFontes(true);
    try {
      const {
        data,
        error
      } = await supabase.from('BIBLIOTECA-ESTUDOS').select('Área, Tema').order('Área');
      if (error) throw error;
      const agrupados = data?.reduce((acc, item) => {
        const area = item['Área'] || '';
        const tema = item['Tema'] || '';
        if (!acc[area]) {
          acc[area] = [];
        }
        if (!acc[area].includes(tema)) {
          acc[area].push(tema);
        }
        return acc;
      }, {} as TemasAgrupados) || {};
      setTemasAgrupados(agrupados);
    } catch (error) {
      console.error('Erro ao carregar áreas:', error);
      toast.error('Erro ao carregar opções');
    } finally {
      setLoadingFontes(false);
    }
  };
  const selecionarArea = (area: string) => {
    setSelectedArea(area);
    setEtapa('selecao-tema');
  };
  const selecionarTema = (tema: string) => {
    setSelectedTema(tema);
  };
  const voltarEtapa = () => {
    if (etapa === 'selecao-tema') {
      setEtapa('area');
      setSelectedArea('');
      setSelectedTema('');
    } else if (etapa === 'area') {
      navigate('/jogos-juridicos');
    }
  };
  const iniciarJogo = () => {
    if (!selectedTema || !selectedArea) {
      toast.error('Selecione um tema para o jogo');
      return;
    }
    if (!tipo) {
      toast.error('Tipo de jogo não identificado');
      navigate('/jogos-juridicos');
      return;
    }
    const conteudo = `Tema: ${selectedTema} - Área: ${selectedArea}`;
    console.log('Iniciando jogo:', {
      tipo,
      area: selectedArea,
      tema: selectedTema,
      dificuldade
    });
    navigate(`/jogos-juridicos/${tipo}/jogar`, {
      state: {
        area: selectedArea,
        tema: selectedTema,
        dificuldade,
        conteudo,
        tipo
      }
    });
  };
  return <div className="px-3 py-4 max-w-4xl mx-auto min-h-screen">
      {/* Header */}
      <div className="mb-6">
        
        
        <h1 className="text-2xl font-bold mb-2">{nomeJogos[tipo || ''] || 'Jogo'}</h1>
        <p className="text-sm text-muted-foreground">
          {etapa === 'area' && 'Escolha a área do direito'}
          {etapa === 'selecao-tema' && 'Selecione o tema e dificuldade'}
        </p>
      </div>

      {/* Etapa 1: Escolher Área */}
      {etapa === 'area' && <div>
          <h2 className="text-lg font-semibold mb-4">📚 Áreas do Direito</h2>
          {loadingFontes ? <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-32 w-full" />)}
            </div> : <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(temasAgrupados).map(([area, temas]) => <AreaCard key={area} area={area} temasCount={temas.length} isSelected={selectedArea === area} onClick={() => selecionarArea(area)} />)}
            </div>}
        </div>}

      {/* Etapa 2: Selecionar Tema + Dificuldade */}
      {etapa === 'selecao-tema' && <div className="space-y-6">
          {/* Dificuldade */}
          <div>
            <h2 className="text-lg font-semibold mb-3">⚡ Dificuldade</h2>
            <div className="grid grid-cols-3 gap-3">
              {(['facil', 'medio', 'dificil'] as const).map(nivel => <Card key={nivel} className={`cursor-pointer transition-all ${dificuldade === nivel ? 'border-2 border-primary shadow-lg' : 'border-2 border-transparent hover:border-accent/50'}`} onClick={() => setDificuldade(nivel)}>
                  <CardContent className="p-3 text-center">
                    <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center ${nivel === 'facil' ? 'bg-green-500/20' : nivel === 'medio' ? 'bg-yellow-500/20' : 'bg-red-500/20'}`}>
                      <Zap className={`w-4 h-4 ${nivel === 'facil' ? 'text-green-500' : nivel === 'medio' ? 'text-yellow-500' : 'text-red-500'}`} />
                    </div>
                    <p className="font-semibold capitalize">{nivel}</p>
                  </CardContent>
                </Card>)}
            </div>
          </div>

          {/* Temas com estilo de flashcard */}
          <div>
            <h2 className="text-lg font-semibold mb-3">📖 Selecione o Tema</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {temasAgrupados[selectedArea]?.map((tema, index) => {
            // Cores baseadas no índice para variar
            const cores = ['from-purple-500 to-purple-700', 'from-blue-500 to-blue-700', 'from-green-500 to-green-700', 'from-orange-500 to-orange-700', 'from-pink-500 to-pink-700', 'from-indigo-500 to-indigo-700'];
            const corGradiente = cores[index % cores.length];
            return <Card key={tema} className={`cursor-pointer transition-all relative overflow-hidden animate-fade-in ${selectedTema === tema ? 'border-2 border-primary shadow-lg scale-105' : 'border border-border hover:border-accent/50 hover:scale-102'}`} onClick={() => selecionarTema(tema)}>
                    {/* Borda colorida no topo - estilo flashcard */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${corGradiente}`} />
                    
                    <CardContent className="p-4 pt-5">
                      <p className="font-medium">{tema}</p>
                    </CardContent>
                  </Card>;
          })}
            </div>
          </div>
        </div>}

      {/* Botão Iniciar - aparece apenas quando tema está selecionado */}
      {selectedTema && etapa === 'selecao-tema' && <div className="mt-6 sticky bottom-4">
          <Button onClick={iniciarJogo} disabled={loading} className="w-full py-6 text-lg font-semibold" size="lg">
            {loading ? 'Carregando...' : '🎮 Começar Jogo'}
          </Button>
        </div>}
    </div>;
};
export default JogoConfig;