import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Palavra {
  palavra: string;
  dica: string;
  linha: number;
  coluna: number;
  horizontal: boolean;
  numero: number;
}

interface CelulaGrid {
  letra: string | null;
  numero?: number;
  horizontal?: boolean;
  vertical?: boolean;
}

const CruzadasGame = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { area, tema, dificuldade, conteudo } = location.state || {};

  const [palavras, setPalavras] = useState<Palavra[]>([]);
  const [grid, setGrid] = useState<CelulaGrid[][]>([]);
  const [respostas, setRespostas] = useState<string[][]>([]);
  const [loading, setLoading] = useState(true);
  const [completo, setCompleto] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);

  useEffect(() => {
    carregarJogo();
  }, []);

  const carregarJogo = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('gerar-jogo-juridico', {
        body: {
          tipo: 'cruzadas',
          area,
          tema,
          dificuldade,
          conteudo: conteudo || `Tema: ${tema}`
        }
      });

      if (error) throw error;

      if (data?.dados_jogo?.palavras) {
        const palavrasComNumero = data.dados_jogo.palavras.map((p: Palavra, i: number) => ({
          ...p,
          numero: i + 1
        }));
        setPalavras(palavrasComNumero);
        criarGrid(palavrasComNumero);
      }
    } catch (error) {
      console.error('Erro ao carregar jogo:', error);
      toast.error('Erro ao carregar jogo');
    } finally {
      setLoading(false);
    }
  };

  const criarGrid = (palavrasList: Palavra[]) => {
    // Determinar tamanho do grid
    let maxLinha = 0;
    let maxColuna = 0;
    palavrasList.forEach(p => {
      maxLinha = Math.max(maxLinha, p.linha + (p.horizontal ? 1 : p.palavra.length));
      maxColuna = Math.max(maxColuna, p.coluna + (p.horizontal ? p.palavra.length : 1));
    });

    // Criar grid vazio
    const novoGrid: CelulaGrid[][] = Array(maxLinha + 2).fill(null).map(() => 
      Array(maxColuna + 2).fill(null).map(() => ({ letra: null }))
    );

    const novasRespostas: string[][] = Array(maxLinha + 2).fill(null).map(() => 
      Array(maxColuna + 2).fill('')
    );

    // Preencher grid com as palavras
    palavrasList.forEach(palavra => {
      for (let i = 0; i < palavra.palavra.length; i++) {
        const linha = palavra.horizontal ? palavra.linha : palavra.linha + i;
        const coluna = palavra.horizontal ? palavra.coluna + i : palavra.coluna;
        
        novoGrid[linha][coluna] = {
          letra: palavra.palavra[i],
          numero: i === 0 ? palavra.numero : novoGrid[linha][coluna].numero,
          horizontal: palavra.horizontal || novoGrid[linha][coluna].horizontal,
          vertical: !palavra.horizontal || novoGrid[linha][coluna].vertical
        };
      }
    });

    setGrid(novoGrid);
    setRespostas(novasRespostas);
  };

  const handleCellInput = (row: number, col: number, value: string) => {
    const novasRespostas = [...respostas];
    novasRespostas[row][col] = value.toUpperCase().slice(-1);
    setRespostas(novasRespostas);
  };

  const verificarRespostas = () => {
    let todasCorretas = true;
    
    grid.forEach((linha, rowIndex) => {
      linha.forEach((celula, colIndex) => {
        if (celula.letra) {
          if (respostas[rowIndex][colIndex] !== celula.letra.toUpperCase()) {
            todasCorretas = false;
          }
        }
      });
    });

    if (todasCorretas) {
      setCompleto(true);
      toast.success('🏆 Parabéns! Você completou as palavras cruzadas!');
    } else {
      toast.error('Algumas respostas estão incorretas. Continue tentando!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">📝</div>
          <p>Carregando jogo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-4 max-w-6xl mx-auto pb-20">
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
        <h1 className="text-2xl font-bold mb-2">📝 Palavras Cruzadas</h1>
        <p className="text-sm text-muted-foreground">{tema}</p>
      </div>

      <div className="grid lg:grid-cols-[1fr,300px] gap-6">
        {/* Grid de Palavras Cruzadas */}
        <Card>
          <CardContent className="p-4 overflow-x-auto">
            <div className="inline-block min-w-full">
              <div className="grid gap-0" style={{ 
                gridTemplateColumns: `repeat(${grid[0]?.length || 0}, 40px)`,
                gridTemplateRows: `repeat(${grid.length}, 40px)`
              }}>
                {grid.map((linha, rowIndex) => 
                  linha.map((celula, colIndex) => {
                    if (!celula.letra) {
                      return (
                        <div 
                          key={`${rowIndex}-${colIndex}`} 
                          className="w-10 h-10 bg-muted/30"
                        />
                      );
                    }
                    
                    return (
                      <div 
                        key={`${rowIndex}-${colIndex}`} 
                        className="relative w-10 h-10 border border-border bg-card"
                      >
                        {celula.numero && (
                          <span className="absolute top-0 left-0 text-[10px] font-bold text-muted-foreground px-0.5">
                            {celula.numero}
                          </span>
                        )}
                        <input
                          type="text"
                          maxLength={1}
                          value={respostas[rowIndex]?.[colIndex] || ''}
                          onChange={(e) => handleCellInput(rowIndex, colIndex, e.target.value)}
                          className="w-full h-full text-center uppercase font-bold text-lg bg-transparent border-none outline-none focus:bg-accent/10"
                          disabled={completo}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dicas */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-bold mb-3">📋 Dicas</h3>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {palavras.map((palavra) => (
                  <div key={palavra.numero} className="text-sm">
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-accent flex-shrink-0">
                        {palavra.numero}. {palavra.horizontal ? '→' : '↓'}
                      </span>
                      <p className="text-muted-foreground">{palavra.dica}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {!completo ? (
            <Button onClick={verificarRespostas} className="w-full" size="lg">
              <Check className="w-4 h-4 mr-2" />
              Verificar Respostas
            </Button>
          ) : (
            <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
              Jogar Novamente
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CruzadasGame;
