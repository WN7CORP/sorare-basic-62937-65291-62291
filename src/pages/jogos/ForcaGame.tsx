import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Heart, Lightbulb, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ForcaVisual } from "@/components/jogos/ForcaVisual";
import { supabase } from "@/integrations/supabase/client";
const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const MAX_ERROS = 6;
interface PalavraOpcao {
  palavra: string;
  dica: string;
  exemplo: string;
  categoria: string;
}
const ForcaGame = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    area,
    tema,
    dificuldade,
    conteudo
  } = location.state || {};
  const [opcoesPalavras, setOpcoesPalavras] = useState<PalavraOpcao[]>([]);
  const [palavraAtual, setPalavraAtual] = useState<PalavraOpcao | null>(null);
  const [letrasEscolhidas, setLetrasEscolhidas] = useState<string[]>([]);
  const [erros, setErros] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [vitoria, setVitoria] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mostrarExemplo, setMostrarExemplo] = useState(false);
  const [etapa, setEtapa] = useState<'selecao' | 'jogo'>('selecao');
  useEffect(() => {
    carregarJogo();
  }, []);
  useEffect(() => {
    if (palavraAtual && !gameOver && etapa === 'jogo') {
      const letrasNaPalavra = palavraAtual.palavra.split('');
      const acertou = letrasNaPalavra.every(letra => letrasEscolhidas.includes(letra));
      if (acertou) {
        setVitoria(true);
        setGameOver(true);
        toast.success('🎉 Parabéns! Você venceu!');
      }
    }
    if (erros >= MAX_ERROS) {
      setGameOver(true);
      toast.error(`💀 Você perdeu! A palavra era: ${palavraAtual?.palavra}`);
    }
  }, [letrasEscolhidas, erros, palavraAtual, gameOver, etapa]);
  const carregarJogo = async () => {
    setLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('gerar-jogo-juridico', {
        body: {
          tipo: 'forca',
          area,
          tema,
          dificuldade,
          conteudo: conteudo || `Tema: ${tema}`
        }
      });
      if (error) throw error;
      if (data?.dados_jogo?.opcoes) {
        setOpcoesPalavras(data.dados_jogo.opcoes);
      }
    } catch (error) {
      console.error('Erro ao carregar jogo:', error);
      toast.error('Erro ao carregar jogo');
    } finally {
      setLoading(false);
    }
  };
  const selecionarPalavra = (opcao: PalavraOpcao) => {
    setPalavraAtual(opcao);
    setEtapa('jogo');
    setLetrasEscolhidas([]);
    setErros(0);
    setGameOver(false);
    setVitoria(false);
    setMostrarExemplo(false);
  };
  const voltarParaSelecao = () => {
    setEtapa('selecao');
    setPalavraAtual(null);
    setLetrasEscolhidas([]);
    setErros(0);
    setGameOver(false);
    setVitoria(false);
    setMostrarExemplo(false);
  };
  const escolherLetra = (letra: string) => {
    if (gameOver || letrasEscolhidas.includes(letra) || !palavraAtual) return;
    setLetrasEscolhidas([...letrasEscolhidas, letra]);
    if (!palavraAtual.palavra.includes(letra)) {
      setErros(erros + 1);
    }
  };
  const renderPalavra = () => {
    if (!palavraAtual) return null;
    return palavraAtual.palavra.split('').map((letra, idx) => <div key={idx} className={`w-10 h-12 border-b-4 flex items-center justify-center text-2xl font-bold mx-1 ${letrasEscolhidas.includes(letra) ? 'border-primary text-primary' : 'border-muted'}`}>
        {letrasEscolhidas.includes(letra) ? letra : ''}
      </div>);
  };
  const pedirDica = () => {
    if (mostrarExemplo) {
      toast.info('Você já usou a dica!');
      return;
    }
    setMostrarExemplo(true);
    toast.success('💡 Dica revelada!');
  };
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🎯</div>
          <p>Carregando jogo...</p>
        </div>
      </div>;
  }

  // Tela de Seleção de Palavras
  if (etapa === 'selecao') {
    return <div className="px-3 py-4 max-w-4xl mx-auto">
        

        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">🎯 Escolha uma Palavra</h1>
          <p className="text-sm text-muted-foreground">
            Selecione uma das 10 palavras para jogar. Dificuldade: {dificuldade}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {opcoesPalavras.map((opcao, idx) => <Card key={idx} className="cursor-pointer hover:scale-105 transition-all border-2 hover:border-primary" onClick={() => selecionarPalavra(opcao)}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 font-bold flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="mb-2">
                      <div className="flex gap-1 mb-2">
                        {opcao.palavra.split('').map((_, i) => <div key={i} className="w-3 h-4 border-b-2 border-muted" />)}
                      </div>
                      <p className="text-xs text-muted-foreground">{opcao.palavra.length} letras</p>
                    </div>
                    <p className="text-sm mb-2">💡 {opcao.dica}</p>
                    <p className="text-xs text-muted-foreground">📚 {opcao.categoria}</p>
                  </div>
                  <Button size="sm" className="flex-shrink-0">
                    <Play className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>)}
        </div>
      </div>;
  }

  // Tela de Jogo
  return <div className="px-3 py-4 max-w-4xl mx-auto">
      <Button variant="ghost" size="sm" onClick={voltarParaSelecao} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Escolher Outra Palavra
      </Button>

      {/* Status */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-1">
          {Array.from({
          length: MAX_ERROS
        }).map((_, idx) => <Heart key={idx} className={`w-6 h-6 ${idx < MAX_ERROS - erros ? 'fill-red-500 text-red-500' : 'fill-gray-300 text-gray-300'}`} />)}
        </div>
        <div className="text-sm text-muted-foreground">
          Erros: {erros}/{MAX_ERROS}
        </div>
      </div>

      {/* Forca Visual */}
      <Card className="mb-6 bg-gradient-to-br from-purple-500/10 to-purple-700/10">
        <CardContent className="p-8 flex justify-center">
          <ForcaVisual erros={erros} />
        </CardContent>
      </Card>

      {/* Botão de Dica */}
      <div className="mb-4 text-center">
        <Button onClick={pedirDica} variant="outline" size="sm" disabled={mostrarExemplo || gameOver} className="gap-2">
          <Lightbulb className="w-4 h-4" />
          {mostrarExemplo ? 'Dica usada' : 'Pedir dica'}
        </Button>
      </div>

      {/* Dica */}
      {palavraAtual && <div className="mb-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">💡 Dica:</p>
          <p className="text-lg font-semibold">{palavraAtual.dica}</p>
          <p className="text-xs text-muted-foreground mt-1">📚 {palavraAtual.categoria}</p>
          {mostrarExemplo && <div className="mt-4 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">{palavraAtual.exemplo}</p>
            </div>}
        </div>}

      {/* Palavra */}
      <div className="flex justify-center mb-8 flex-wrap">
        {renderPalavra()}
      </div>

      {/* Teclado */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {LETRAS.map(letra => <Button key={letra} onClick={() => escolherLetra(letra)} disabled={letrasEscolhidas.includes(letra) || gameOver} variant={letrasEscolhidas.includes(letra) ? palavraAtual?.palavra.includes(letra) ? 'default' : 'destructive' : 'outline'} className="aspect-square">
            {letra}
          </Button>)}
      </div>

      {/* Game Over */}
      {gameOver && <div className="text-center space-y-4">
          {vitoria ? <>
              <p className="text-2xl font-bold text-green-500">🎉 Vitória!</p>
              <p>Você acertou a palavra!</p>
            </> : <>
              <p className="text-2xl font-bold text-red-500">💀 Game Over</p>
              <p>A palavra era: <span className="font-bold">{palavraAtual?.palavra}</span></p>
            </>}
          <div className="space-y-2">
            <Button onClick={voltarParaSelecao} className="w-full">
              Escolher Outra Palavra
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
              Gerar Novas Palavras
            </Button>
          </div>
        </div>}
    </div>;
};
export default ForcaGame;