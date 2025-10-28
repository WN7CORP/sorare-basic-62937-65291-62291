import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface CelulaSelecionada {
  linha: number;
  coluna: number;
}

const CacaPalavrasGame = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { area, tema, dificuldade, conteudo } = location.state || {};

  const [niveis, setNiveis] = useState<any[]>([]);
  const [nivelAtual, setNivelAtual] = useState(1);
  const [palavrasEncontradas, setPalavrasEncontradas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Seleção por arraste
  const [isSelecting, setIsSelecting] = useState(false);
  const [celulasPath, setCelulasPath] = useState<CelulaSelecionada[]>([]);
  const [celulasHighlight, setCelulasHighlight] = useState<Set<string>>(new Set());

  const nivelData = niveis.find(n => n.nivel === nivelAtual);
  const palavrasNivel = nivelData?.palavras || [];
  const grid = nivelData?.grid || [];
  const totalNiveis = niveis.length;

  useEffect(() => {
    carregarJogo();
  }, []);

  const carregarJogo = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('gerar-jogo-juridico', {
        body: {
          tipo: 'caca_palavras',
          area,
          tema,
          dificuldade,
          conteudo: conteudo || `Tema: ${tema}`
        }
      });

      if (error) throw error;

      if (data?.dados_jogo?.niveis) {
        setNiveis(data.dados_jogo.niveis || []);
      }
    } catch (error) {
      console.error('Erro ao carregar jogo:', error);
      toast.error('Erro ao carregar jogo');
    } finally {
      setLoading(false);
    }
  };

  const getCelulaKey = (linha: number, coluna: number) => `${linha}-${coluna}`;

  const handleMouseDown = (linha: number, coluna: number) => {
    setIsSelecting(true);
    setCelulasPath([{ linha, coluna }]);
    setCelulasHighlight(new Set([getCelulaKey(linha, coluna)]));
  };

  const handleMouseEnter = (linha: number, coluna: number) => {
    if (!isSelecting) return;
    
    const key = getCelulaKey(linha, coluna);
    if (!celulasHighlight.has(key)) {
      setCelulasPath(prev => [...prev, { linha, coluna }]);
      setCelulasHighlight(prev => new Set([...prev, key]));
    }
  };

  const handleMouseUp = () => {
    if (!isSelecting) return;
    
    // Verificar se formou alguma palavra
    const palavraFormada = celulasPath
      .map(({ linha, coluna }) => grid[linha]?.[coluna])
      .join('');
    
    const palavraInvertida = palavraFormada.split('').reverse().join('');
    
    // Verificar se encontrou alguma palavra do nível atual
    const palavraEncontrada = palavrasNivel.find(
      p => !palavrasEncontradas.includes(p) && 
           (p === palavraFormada || p === palavraInvertida)
    );

    if (palavraEncontrada) {
      setPalavrasEncontradas([...palavrasEncontradas, palavraEncontrada]);
      toast.success(`✅ Encontrou: ${palavraEncontrada}`);

      // Verificar se completou o nível
      const palavrasDoNivelEncontradas = palavrasEncontradas.filter(p => palavrasNivel.includes(p));
      if (palavrasDoNivelEncontradas.length === palavrasNivel.length) {
        if (nivelAtual < totalNiveis) {
          setTimeout(() => {
            setNivelAtual(nivelAtual + 1);
            setPalavrasEncontradas([]);
            toast.success(`🎉 Nível ${nivelAtual} completo! Avançando...`);
          }, 1000);
        } else {
          setTimeout(() => {
            toast.success('🏆 Parabéns! Você completou todos os 5 níveis!');
          }, 1000);
        }
      }
    }

    setIsSelecting(false);
    setCelulasPath([]);
    setCelulasHighlight(new Set());
  };

  const progressoNivel = (palavrasEncontradas.filter(p => palavrasNivel.includes(p)).length / palavrasNivel.length) * 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🔍</div>
          <p>Carregando jogo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto min-h-screen">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/jogos-juridicos')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">🔍 Caça-Palavras</h1>
        <p className="text-sm text-muted-foreground mb-4">
          {tema}
        </p>

        {/* Indicador de Nível */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="font-bold text-lg">Nível {nivelAtual} / {totalNiveis}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {palavrasEncontradas.filter(p => palavrasNivel.includes(p)).length} / {palavrasNivel.length} palavras
          </span>
        </div>
        
        <Progress value={progressoNivel} className="h-2" />
      </div>

      {/* Lista de Palavras do Nível Atual */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">Palavras para Encontrar (Nível {nivelAtual}):</h3>
          <div className="flex flex-wrap gap-2">
            {palavrasNivel.map((palavra, index) => (
              <Badge
                key={index}
                variant={palavrasEncontradas.includes(palavra) ? 'default' : 'outline'}
                className={palavrasEncontradas.includes(palavra) ? 'line-through' : ''}
              >
                {palavra}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Grid - Seleção por Arraste */}
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-3 text-center">
            Arraste o dedo ou mouse sobre as letras para selecionar palavras
          </p>
          <div 
            className="grid gap-1 select-none" 
            style={{ gridTemplateColumns: `repeat(${grid[0]?.length || 12}, minmax(0, 1fr))` }}
            onMouseLeave={handleMouseUp}
          >
            {grid.map((linha, i) =>
              linha.map((letra, j) => {
                const key = getCelulaKey(i, j);
                const isHighlighted = celulasHighlight.has(key);
                
                return (
                  <button
                    key={key}
                    onMouseDown={() => handleMouseDown(i, j)}
                    onMouseEnter={() => handleMouseEnter(i, j)}
                    onMouseUp={handleMouseUp}
                    onTouchStart={() => handleMouseDown(i, j)}
                    onTouchMove={(e) => {
                      const touch = e.touches[0];
                      const element = document.elementFromPoint(touch.clientX, touch.clientY);
                      if (element?.getAttribute('data-cell')) {
                        const [linha, coluna] = element.getAttribute('data-cell')!.split('-').map(Number);
                        handleMouseEnter(linha, coluna);
                      }
                    }}
                    onTouchEnd={handleMouseUp}
                    data-cell={key}
                    className={`aspect-square flex items-center justify-center text-xs md:text-sm font-bold border rounded transition-all ${
                      isHighlighted
                        ? 'bg-primary text-primary-foreground scale-110 shadow-lg'
                        : 'bg-card hover:bg-accent'
                    }`}
                  >
                    {letra}
                  </button>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {nivelAtual === totalNiveis && palavrasEncontradas.length === palavrasNivel.length && (
        <div className="mt-6 text-center">
          <div className="mb-4">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-2 animate-bounce" />
            <p className="text-xl font-bold">Parabéns! 🎉</p>
            <p className="text-muted-foreground">Você completou todos os 5 níveis!</p>
          </div>
          <Button onClick={() => window.location.reload()} className="w-full">
            Jogar Novamente
          </Button>
        </div>
      )}
    </div>
  );
};

export default CacaPalavrasGame;
