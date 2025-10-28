import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scale, Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PontuacaoBar } from "@/components/simulacao/PontuacaoBar";
import { TypingIndicator } from "@/components/simulacao/TypingIndicator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import juizaAvatar from "@/assets/juiza-avatar.jpg";
import advogadoReuAvatar from "@/assets/advogado-reu-avatar.jpg";
import OpcaoRespostaCard from "@/components/simulacao/OpcaoRespostaCard";
import ProvaVisualCard from "@/components/simulacao/ProvaVisualCard";
import TimelineAudiencia from "@/components/simulacao/TimelineAudiencia";
import AdversarioResponse from "@/components/simulacao/AdversarioResponse";

interface Mensagem {
  tipo: 'juiza' | 'advogado_jogador' | 'advogado_reu' | 'sistema';
  texto: string;
  timestamp: Date;
  nome?: string;
}

const SimulacaoAudiencia = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [partida, setPartida] = useState<any>(null);
  const [caso, setCaso] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [turnoAtual, setTurnoAtual] = useState(0);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [pontuacao, setPontuacao] = useState(0);
  const [typing, setTyping] = useState(false);
  const [mostrarOpcoes, setMostrarOpcoes] = useState(false);
  const [escolhasRealizadas, setEscolhasRealizadas] = useState<any[]>([]);
  const [audienciaIniciada, setAudienciaIniciada] = useState(false);

  useEffect(() => {
    carregarDados();
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [mensagens, typing]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const carregarDados = async () => {
    try {
      if (!id) return;

      const { data: partidaData, error: partidaError } = await supabase
        .from('SIMULACAO_PARTIDAS')
        .select('*')
        .eq('id', parseInt(id))
        .single();

      if (partidaError) throw partidaError;
      setPartida(partidaData);

      const { data: casoData, error: casoError } = await supabase
        .from('SIMULACAO_CASOS')
        .select('*')
        .eq('id', partidaData.caso_id)
        .single();

      if (casoError) throw casoError;
      setCaso(casoData);

      // Restaurar estado se já iniciado
      if (partidaData.historico_mensagens && Array.isArray(partidaData.historico_mensagens) && partidaData.historico_mensagens.length > 0) {
        const mensagensRestauradas: Mensagem[] = (partidaData.historico_mensagens as any[]).map((m: any) => ({
          tipo: m.tipo || 'sistema',
          texto: m.texto || '',
          timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
          nome: m.nome
        }));
        setMensagens(mensagensRestauradas);
        setPontuacao(partidaData.pontuacao_final || 0);
        setEscolhasRealizadas(Array.isArray(partidaData.argumentacoes_escolhidas) ? partidaData.argumentacoes_escolhidas : []);
        setTurnoAtual(Array.isArray(partidaData.argumentacoes_escolhidas) ? partidaData.argumentacoes_escolhidas.length : 0);
        setAudienciaIniciada(true);
      }

    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar audiência');
    } finally {
      setLoading(false);
    }
  };

  const dividirTextoLongo = (texto: string, maxLength: number = 200): string[] => {
    if (texto.length <= maxLength) return [texto];
    
    const partes: string[] = [];
    let textoRestante = texto;
    
    while (textoRestante.length > 0) {
      if (textoRestante.length <= maxLength) {
        partes.push(textoRestante);
        break;
      }
      
      let pontoCorte = textoRestante.lastIndexOf('.', maxLength);
      if (pontoCorte === -1 || pontoCorte < maxLength / 2) {
        pontoCorte = textoRestante.lastIndexOf(' ', maxLength);
      }
      
      if (pontoCorte === -1) pontoCorte = maxLength;
      
      partes.push(textoRestante.substring(0, pontoCorte + 1).trim());
      textoRestante = textoRestante.substring(pontoCorte + 1).trim();
    }
    
    return partes;
  };

  const adicionarMensagem = (mensagem: Omit<Mensagem, 'timestamp'>) => {
    setMensagens(prev => [...prev, { ...mensagem, timestamp: new Date() }]);
  };
  
  const adicionarMensagemComAnimacao = async (mensagem: Omit<Mensagem, 'timestamp'>) => {
    const partes = dividirTextoLongo(mensagem.texto);
    
    for (let i = 0; i < partes.length; i++) {
      if (i > 0) {
        await delay(800);
        setTyping(true);
        await delay(1000);
      }
      
      adicionarMensagem({
        ...mensagem,
        texto: partes[i]
      });
      
      if (i < partes.length - 1) {
        setTyping(false);
      }
    }
  };

  const iniciarAudiencia = async () => {
    if (!caso) {
      toast.error('Caso não carregado');
      return;
    }
    
    if (!caso.estrutura_audiencia?.turnos) {
      toast.error('Este caso precisa ser atualizado. Retornando...');
      await delay(2000);
      navigate('/simulacao-juridica');
      return;
    }
    
    setAudienciaIniciada(true);
    setTyping(true);
    await delay(2000);
    
    // SAUDAÇÃO DA JUÍZA (apenas uma vez)
    await adicionarMensagemComAnimacao({
      tipo: 'juiza',
      texto: `Bom dia. Sou a Juíza ${caso.nome_juiza || 'Ana Paula Costa'}. Daremos início à audiência referente ao caso: ${caso.titulo_caso}.`,
      nome: caso.nome_juiza || 'Juíza'
    });
    
    setTyping(false);
    await delay(1200);
    setTyping(true);
    await delay(1000);
    
    // APRESENTAÇÃO DO ADVERSÁRIO (Promotor ou Advogado)
    const tipoAdversario = caso.tipo_adversario || 'advogado_particular';
    const isPromotor = tipoAdversario === 'promotor';
    const nomeAdversario = caso.nome_advogado_reu || (isPromotor ? 'Promotor Carlos Santos' : 'Dr. Carlos Santos');
    const representacao = isPromotor ? 'Ministério Público' : 'parte contrária';
    
    await adicionarMensagemComAnimacao({
      tipo: 'advogado_reu',
      texto: `Presente, Excelência. ${nomeAdversario}, representando ${representacao}.`,
      nome: isPromotor ? `${nomeAdversario} (Promotor)` : nomeAdversario
    });
    
    setTyping(false);
    await delay(1000);
    setTyping(true);
    await delay(1200);
    
    // CONTEXTO DO CASO
    await adicionarMensagemComAnimacao({
      tipo: 'juiza',
      texto: caso.contexto_inicial || 'Vamos dar início à audiência.',
      nome: caso.nome_juiza || 'Juíza'
    });
    
    setTyping(false);
    await delay(1000);
    
    // INICIAR PRIMEIRO TURNO
    executarProximoTurno();
  };

  const executarProximoTurno = async () => {
    if (!caso?.estrutura_audiencia?.turnos) {
      console.error('Caso sem estrutura de audiência:', caso);
      toast.error('Este caso ainda não possui estrutura de audiência. Por favor, escolha outro caso.');
      await delay(2000);
      navigate('/simulacao-juridica');
      return;
    }
    
    const turnos = caso.estrutura_audiencia.turnos;
    if (turnoAtual >= turnos.length) {
      finalizarAudiencia();
      return;
    }

    const turno = turnos[turnoAtual];
    
    if (!turno) {
      console.error('Turno não encontrado:', turnoAtual, turnos);
      finalizarAudiencia();
      return;
    }
    
    setTyping(true);
    await delay(1000);

    // Determinar tratamento correto baseado no gênero do jogador
    const generoJogador = caso.genero_jogador || 'masculino';
    const tratamento = generoJogador === 'feminino' ? 'Doutora' : 'Doutor';
    const textoTurno = turno.texto ? turno.texto.replace(/Doutor\(a\)/g, tratamento) : '';

    switch (turno.tipo) {
      case 'juiza_pergunta':
        await adicionarMensagemComAnimacao({
          tipo: 'juiza',
          texto: textoTurno || `${tratamento}, como você responde?`,
          nome: caso.nome_juiza
        });
        setTyping(false);
        await delay(800);
        setMostrarOpcoes(true);
        break;

      case 'apresentacao_provas':
        await adicionarMensagemComAnimacao({
          tipo: 'juiza',
          texto: textoTurno || `${tratamento}, apresente suas provas.`,
          nome: caso.nome_juiza
        });
        setTyping(false);
        await delay(800);
        setMostrarOpcoes(true);
        break;

      case 'consideracoes_finais':
        await adicionarMensagemComAnimacao({
          tipo: 'juiza',
          texto: textoTurno || 'Peço que ambas as partes façam suas considerações finais.',
          nome: caso.nome_juiza
        });
        setTyping(false);
        await delay(1500);
        finalizarAudiencia();
        break;
        
      default:
        console.warn('Tipo de turno desconhecido:', turno.tipo);
        setTurnoAtual(prev => prev + 1);
        await delay(500);
        executarProximoTurno();
        break;
    }
  };

  const escolherResposta = async (resposta: any, turno: any) => {
    setMostrarOpcoes(false);
    
    // Adicionar resposta do jogador
    adicionarMensagem({
      tipo: 'advogado_jogador',
      texto: resposta.texto,
      nome: 'Você'
    });

    await delay(800);
    setTyping(true);
    await delay(1500);

    // Atualizar pontuação
    const novaPontuacao = pontuacao + resposta.pontos;
    setPontuacao(novaPontuacao);

    // Registrar escolha
    const novaEscolha = {
      turno: turnoAtual,
      texto: resposta.texto,
      pontos: resposta.pontos,
      forca: resposta.forca,
      artigos_citados: resposta.artigos_citados || []
    };
    setEscolhasRealizadas(prev => [...prev, novaEscolha]);

    // Reação da juíza (usando templates)
    const templates = caso.template_respostas_juiza || {
      forte: ["Excelente argumentação."],
      media: ["Entendo. Prossiga."],
      fraca: ["Preciso de mais fundamentação."]
    };
    
    const reacoes = templates[resposta.forca as keyof typeof templates] || templates.media;
    const reacaoTexto = reacoes[Math.floor(Math.random() * reacoes.length)];
    
    await adicionarMensagemComAnimacao({
      tipo: 'juiza',
      texto: reacaoTexto,
      nome: caso.nome_juiza
    });

    setTyping(false);
    await delay(1000);

    // Advogado da ré refuta
    if (resposta.refutacao_adversario) {
      setTyping(true);
      await delay(1200);
      
      adicionarMensagem({
        tipo: 'advogado_reu',
        texto: resposta.refutacao_adversario,
        nome: caso.nome_advogado_reu
      });
      
      setTyping(false);
      await delay(1000);
    }
    
    // Salvar progresso
    await salvarProgresso(novaPontuacao, [...escolhasRealizadas, novaEscolha]);
    
    // Próximo turno
    setTurnoAtual(prev => prev + 1);
    await delay(800);
    executarProximoTurno();
  };

  const escolherProva = async (prova: any, turno: any) => {
    setMostrarOpcoes(false);
    
    adicionarMensagem({
      tipo: 'advogado_jogador',
      texto: `Apresento como prova: ${prova.nome}. ${prova.descricao}`,
      nome: 'Você'
    });

    const novaPontuacao = pontuacao + (prova.pontos || 0);
    setPontuacao(novaPontuacao);

    await delay(1200);
    setTyping(true);
    await delay(1000);

    // Juíza comenta a prova
    const comentarios = [
      'A prova foi juntada aos autos.',
      'Prova aceita.',
      'A prova será considerada.'
    ];
    adicionarMensagem({
      tipo: 'juiza',
      texto: comentarios[Math.floor(Math.random() * comentarios.length)],
      nome: caso.nome_juiza
    });

    setTyping(false);
    await salvarProgresso(novaPontuacao, escolhasRealizadas);
    
    setTurnoAtual(prev => prev + 1);
    await delay(1000);
    executarProximoTurno();
  };

  const salvarProgresso = async (novaPontuacao: number, escolhas: any[]) => {
    try {
      await supabase
        .from('SIMULACAO_PARTIDAS')
        .update({
          historico_mensagens: mensagens as any,
          pontuacao_final: novaPontuacao,
          argumentacoes_escolhidas: escolhas as any,
        })
        .eq('id', parseInt(id!));
    } catch (error) {
      console.error('Erro ao salvar progresso:', error);
    }
  };

  const finalizarAudiencia = async () => {
    setTyping(true);
    await delay(2000);

    const pontuacaoFinal = pontuacao;
    const deferido = pontuacaoFinal >= 70;
    const deferimentoParcial = pontuacaoFinal >= 50 && pontuacaoFinal < 70;

    let resultado = deferido ? 'DEFERIDO' : (deferimentoParcial ? 'DEFERIMENTO PARCIAL' : 'INDEFERIDO');

    await adicionarMensagemComAnimacao({
      tipo: 'juiza',
      texto: `Diante do exposto, decido: ${resultado}. ${caso.sentenca_esperada_merito || 'Sentença fundamentada nos autos.'}`,
      nome: caso.nome_juiza
    });

    setTyping(false);

    // Salvar resultado final
    await supabase
      .from('SIMULACAO_PARTIDAS')
      .update({
        pontuacao_final: pontuacaoFinal,
        deferido,
        sentenca_recebida: caso.sentenca_esperada_merito || 'Sentença padrão',
        acertos: caso.feedback_positivo || [],
        erros: caso.feedback_negativo || [],
        sugestoes_melhoria: caso.dicas || []
      })
      .eq('id', parseInt(id!));

    await delay(2000);
    navigate(`/simulacao-juridica/feedback/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
      </div>
    );
  }

  const turnoAtualData = caso?.estrutura_audiencia?.turnos?.[turnoAtual];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-3 sm:px-4 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/simulacao-juridica")}
            className="text-gray-300 hover:text-white text-sm sm:text-base px-2 sm:px-4"
          >
            <ArrowLeft className="mr-1 sm:mr-2 w-4 h-4" />
            Sair
          </Button>
          
          <div className="flex items-center gap-2 text-amber-500">
            <Scale className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-bold text-sm sm:text-base">Audiência Virtual</span>
          </div>
        </div>

        {/* Card com informações do caso */}
        <Card className="bg-gray-800/90 border-amber-500/30 mb-3 sm:mb-4">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Scale className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-white text-sm sm:text-base line-clamp-2 leading-tight">{caso?.titulo_caso}</h2>
                <p className="text-xs text-gray-400 mt-1">
                  {caso?.area} • {caso?.tema}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        {audienciaIniciada && caso?.estrutura_audiencia?.turnos && (
          <div className="mb-3 sm:mb-4">
            <TimelineAudiencia 
              totalTurnos={caso.estrutura_audiencia.turnos.length}
              turnoAtual={turnoAtual}
            />
          </div>
        )}

        {/* Aviso sobre Sistema de Pontuação */}
        {audienciaIniciada && (
          <Card className="bg-amber-500/10 border-amber-500/30 mb-3 sm:mb-4 animate-fade-in">
            <CardContent className="p-2.5 sm:p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-200 leading-relaxed">
                  <strong>Sistema de Pontuação:</strong> Cada escolha afeta sua pontuação. Respostas corretas ganham pontos, escolhas inadequadas podem descontar. Você precisa atingir a pontuação mínima para conseguir o deferimento do pedido.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Barra de Pontuação */}
        <div className="mb-3 sm:mb-4">
          <PontuacaoBar pontuacao={pontuacao} pontuacaoMaxima={100} />
        </div>

        {/* Chat de Mensagens */}
        <Card className="bg-gray-800/90 border-amber-500/30 mb-3 sm:mb-4">
          <div className="bg-gradient-to-r from-amber-500/20 to-amber-700/20 p-2.5 sm:p-3 border-b border-amber-500/30">
            <h3 className="font-bold text-white flex items-center gap-2 text-xs sm:text-sm">
              <Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
              TRIBUNAL DE JUSTIÇA
            </h3>
          </div>
          <CardContent className="p-3 sm:p-4">
            <div className="space-y-3 sm:space-y-4 min-h-[250px] sm:min-h-[300px] max-h-[400px] sm:max-h-[500px] overflow-y-auto">
              {mensagens.length === 0 && !audienciaIniciada && (
                <div className="text-center py-12 text-gray-400">
                  <Scale className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="text-sm">Clique em "Iniciar Audiência" para começar</p>
                </div>
              )}
              
              <AnimatePresence>
                {mensagens.map((mensagem, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ 
                      duration: 0.4,
                      ease: "easeOut"
                    }}
                  >
                    {mensagem.tipo === 'juiza' && (
                      <motion.div 
                        className="flex gap-3"
                        whileHover={{ scale: 1.01 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Avatar className="w-10 h-10 border-2 border-amber-500/50 shadow-lg shadow-amber-500/20">
                          <AvatarImage src={juizaAvatar} alt="Juíza" />
                          <AvatarFallback>JZ</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-xs text-amber-400 mb-1 font-semibold">{mensagem.nome || 'Juíza'}</p>
                          <motion.div 
                            className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3 shadow-md"
                            initial={{ x: -10 }}
                            animate={{ x: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <p className="text-gray-200 text-sm leading-relaxed">{mensagem.texto}</p>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}

                    {mensagem.tipo === 'advogado_jogador' && (
                      <motion.div 
                        className="flex justify-end"
                        whileHover={{ scale: 1.01 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="max-w-[80%]">
                          <p className="text-xs text-blue-400 mb-1 text-right font-semibold">Você</p>
                          <motion.div 
                            className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 shadow-md"
                            initial={{ x: 10 }}
                            animate={{ x: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <p className="text-gray-200 text-sm leading-relaxed">{mensagem.texto}</p>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}

                    {mensagem.tipo === 'advogado_reu' && (
                      <AdversarioResponse 
                        texto={mensagem.texto}
                        nomeAdvogado={mensagem.nome || 'Advogado da Defesa'}
                        genero={caso?.genero_advogado_reu}
                      />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {typing && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Card>

        {/* Opções de Resposta */}
        <AnimatePresence>
          {mostrarOpcoes && turnoAtualData && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ 
                duration: 0.4,
                ease: "easeOut"
              }}
            >
              <Card className="bg-gray-800/90 border-amber-500/30 shadow-xl">
                <CardContent className="p-4">
                  <motion.h3 
                    className="text-white font-bold mb-4 text-sm sm:text-base flex items-center gap-2"
                    initial={{ x: -10 }}
                    animate={{ x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                    >
                      ⚖️
                    </motion.div>
                    {turnoAtualData.tipo === 'apresentacao_provas' ? 'Escolha uma prova para apresentar:' : 'Escolha sua resposta:'}
                  </motion.h3>
                  
                  <div className="space-y-3">
                    {turnoAtualData.tipo === 'apresentacao_provas' && turnoAtualData.provas?.map((prova: any, index: number) => (
                      <ProvaVisualCard
                        key={index}
                        prova={prova}
                        index={index}
                      />
                    ))}

                    {turnoAtualData.tipo === 'juiza_pergunta' && turnoAtualData.respostas_possiveis?.map((resposta: any, index: number) => (
                      <OpcaoRespostaCard
                        key={index}
                        opcao={resposta}
                        index={index}
                        onClick={() => escolherResposta(resposta, turnoAtualData)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botão Iniciar */}
        {!audienciaIniciada && (
          <motion.div 
            className="flex justify-center mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={iniciarAudiencia}
                className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-6 text-lg shadow-xl shadow-amber-500/30"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Scale className="w-5 h-5 mr-2" />
                </motion.div>
                Iniciar Audiência
              </Button>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SimulacaoAudiencia;
