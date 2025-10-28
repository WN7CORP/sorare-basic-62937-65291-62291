import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Categoria {
  nome: string;
  exemplos: string[];
}

const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const TEMPO_JOGO = 60; // 60 segundos

const StopGame = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { area, tema, dificuldade, conteudo } = location.state || {};

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [letraSorteada, setLetraSorteada] = useState('');
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [tempo, setTempo] = useState(TEMPO_JOGO);
  const [jogando, setJogando] = useState(false);
  const [finalizado, setFinalizado] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarJogo();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (jogando && tempo > 0) {
      interval = setInterval(() => {
        setTempo(t => {
          if (t <= 1) {
            finalizarJogo();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [jogando, tempo]);

  const carregarJogo = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('gerar-jogo-juridico', {
        body: {
          tipo: 'stop',
          area,
          tema,
          dificuldade,
          conteudo: conteudo || `Tema: ${tema}`
        }
      });

      if (error) throw error;

      if (data?.dados_jogo?.categorias) {
        setCategorias(data.dados_jogo.categorias);
      }
    } catch (error) {
      console.error('Erro ao carregar jogo:', error);
      toast.error('Erro ao carregar jogo');
    } finally {
      setLoading(false);
    }
  };

  const iniciarJogo = () => {
    const letra = LETRAS[Math.floor(Math.random() * LETRAS.length)];
    setLetraSorteada(letra);
    setJogando(true);
    setTempo(TEMPO_JOGO);
    setRespostas({});
    toast.info(`Letra sorteada: ${letra}!`);
  };

  const finalizarJogo = () => {
    setJogando(false);
    setFinalizado(true);
    toast.success('⏱️ Tempo esgotado! Veja suas respostas');
  };

  const validarRespostas = () => {
    let pontuacao = 0;
    categorias.forEach((categoria, index) => {
      const resposta = (respostas[`cat-${index}`] || '').toUpperCase().trim();
      if (resposta && resposta.startsWith(letraSorteada)) {
        pontuacao += 10;
      }
    });
    toast.success(`Pontuação: ${pontuacao} pontos!`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏱️</div>
          <p>Carregando jogo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto">
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
        <h1 className="text-2xl font-bold mb-2">⏱️ Stop Jurídico</h1>
        <p className="text-sm text-muted-foreground">
          Preencha as categorias com palavras que começam com a letra sorteada
        </p>
      </div>

      {/* Status do Jogo */}
      {!jogando && !finalizado && (
        <Card className="mb-6">
          <CardContent className="p-6 text-center">
            <p className="text-lg mb-4">Pronto para começar?</p>
            <Button onClick={iniciarJogo} size="lg" className="gap-2">
              <Play className="w-5 h-5" />
              Iniciar Jogo
            </Button>
          </CardContent>
        </Card>
      )}

      {jogando && (
        <>
          {/* Timer e Letra */}
          <Card className="mb-6 bg-gradient-to-br from-orange-500/10 to-orange-700/10">
            <CardContent className="p-6 text-center">
              <div className="text-6xl font-bold mb-2">{letraSorteada}</div>
              <div className="text-3xl font-bold text-orange-500">{tempo}s</div>
              <Button onClick={finalizarJogo} variant="outline" size="sm" className="mt-4 gap-2">
                <Square className="w-4 h-4" />
                Parar
              </Button>
            </CardContent>
          </Card>

          {/* Categorias */}
          <div className="space-y-3">
            {categorias.map((categoria, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <label className="text-sm font-semibold mb-2 block">
                    {categoria.nome}
                  </label>
                  <Input
                    placeholder={`Ex: ${categoria.exemplos[0]}`}
                    value={respostas[`cat-${index}`] || ''}
                    onChange={(e) => setRespostas({ ...respostas, [`cat-${index}`]: e.target.value })}
                    className="uppercase"
                    maxLength={50}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {finalizado && (
        <>
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Suas Respostas</h2>
              <div className="space-y-3">
                {categorias.map((categoria, index) => {
                  const resposta = respostas[`cat-${index}`] || '-';
                  const valida = resposta.toUpperCase().startsWith(letraSorteada);
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="text-sm font-semibold">{categoria.nome}</p>
                        <p className="text-lg">{resposta}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${valida ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                        {valida ? '✓ +10' : '✗ 0'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Button onClick={validarRespostas} className="w-full" size="lg">
              Ver Pontuação
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
              Jogar Novamente
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default StopGame;
