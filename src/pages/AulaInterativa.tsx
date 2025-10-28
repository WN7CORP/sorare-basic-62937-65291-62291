import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AulaIntro } from "@/components/aula/AulaIntro";
import { AulaModuloNav } from "@/components/aula/AulaModuloNav";
import { AulaTeoriaEnhanced } from "@/components/aula/AulaTeoriaEnhanced";
import { ModuloTransitionCard } from "@/components/aula/ModuloTransitionCard";
import { MatchingGame } from "@/components/aula/MatchingGame";
import { FlashcardViewer } from "@/components/FlashcardViewer";
import { QuizViewerEnhanced } from "@/components/QuizViewerEnhanced";
import { AulaProvaFinal } from "@/components/aula/AulaProvaFinal";
import { AulaResultado } from "@/components/aula/AulaResultado";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface AulaEstrutura {
  titulo: string;
  descricao: string;
  area?: string;
  modulos: Array<{
    id: number;
    nome: string;
    icone?: string;
    teoria: string;
    exemploPratico?: {
      cenario: string;
      analise: string;
      solucao: string;
    };
    quizRapido?: Array<any>;
    resumo?: string[];
    matching: Array<{ termo: string; definicao: string }>;
    flashcards: Array<{ frente: string; verso: string; exemplo?: string }>;
    questoes: Array<any>;
  }>;
  provaFinal: Array<any>;
}

type Etapa = 'intro' | 'transicao' | 'teoria' | 'matching' | 'flashcards' | 'questoes' | 'provaFinal' | 'resultado';

const AulaInterativa = () => {
  const [estrutura, setEstrutura] = useState<AulaEstrutura | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [etapaAtual, setEtapaAtual] = useState<Etapa>('intro');
  const [moduloAtual, setModuloAtual] = useState(1);
  const [acertosProva, setAcertosProva] = useState(0);
  const [totalProva, setTotalProva] = useState(0);
  const [aulaId, setAulaId] = useState<string | null>(null);
  const [progressoId, setProgressoId] = useState<string | null>(null);
  const [tempoInicio, setTempoInicio] = useState<Date>(new Date());

  useEffect(() => {
    if (estrutura && aulaId && !progressoId) {
      criarProgresso();
    }
  }, [estrutura, aulaId]);

  const gerarAula = async (tema: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('gerar-estrutura-aula', {
        body: { tema }
      });

      if (error) throw error;

      // Salvar aula no banco
      const aulaData = {
        area: data.area || 'Direito',
        tema: tema,
        titulo: data.titulo,
        descricao: data.descricao,
        estrutura_completa: data
      };

      const { data: aulaSalva, error: erroSalvar } = await supabase
        .from('aulas_interativas')
        .insert(aulaData)
        .select()
        .single();

      if (erroSalvar) {
        console.error('Erro ao salvar aula:', erroSalvar);
        toast.error('Aula gerada mas não foi possível salvá-la');
      } else {
        setAulaId(aulaSalva.id);
        toast.success('Aula gerada e salva com sucesso!');
      }

      setEstrutura(data);
      setModuloAtual(1);
      setEtapaAtual('transicao');
      setTempoInicio(new Date());
    } catch (error: any) {
      console.error('Erro ao gerar aula:', error);
      toast.error('Erro ao gerar aula. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const carregarAulaPronta = (estruturaAula: any, idAula: string) => {
    setEstrutura(estruturaAula);
    setAulaId(idAula);
    setModuloAtual(1);
    setEtapaAtual('transicao');
    setTempoInicio(new Date());
    toast.success('Aula carregada!');
  };

  const criarProgresso = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('aulas_progresso')
        .insert({
          user_id: user.id,
          aula_id: aulaId,
          modulo_atual: moduloAtual,
          etapa_atual: etapaAtual
        })
        .select()
        .single();

      if (error) throw error;
      setProgressoId(data.id);
    } catch (error: any) {
      console.error('Erro ao criar progresso:', error);
    }
  };

  const atualizarProgresso = async () => {
    if (!progressoId) return;

    try {
      const tempoTotal = Math.floor((new Date().getTime() - tempoInicio.getTime()) / 60000);
      
      await supabase
        .from('aulas_progresso')
        .update({
          modulo_atual: moduloAtual,
          etapa_atual: etapaAtual,
          progresso_percentual: calcularProgresso(),
          tempo_total_minutos: tempoTotal
        })
        .eq('id', progressoId);
    } catch (error: any) {
      console.error('Erro ao atualizar progresso:', error);
    }
  };

  const calcularProgresso = () => {
    if (!estrutura) return 0;
    
    const totalEtapas = estrutura.modulos.length * 4 + 1; // transicao + teoria + matching + flashcards + questoes por módulo + prova
    const etapaPorModulo = moduloAtual > 1 ? (moduloAtual - 1) * 4 : 0;
    
    let etapaAtualNum = 0;
    if (etapaAtual === 'transicao') etapaAtualNum = 0;
    else if (etapaAtual === 'teoria') etapaAtualNum = 1;
    else if (etapaAtual === 'matching') etapaAtualNum = 2;
    else if (etapaAtual === 'flashcards') etapaAtualNum = 3;
    else if (etapaAtual === 'questoes') etapaAtualNum = 4;
    else if (etapaAtual === 'provaFinal') return 95;
    
    return Math.min((etapaPorModulo + etapaAtualNum) / totalEtapas * 100, 100);
  };

  const proximaEtapa = () => {
    atualizarProgresso();
    
    if (etapaAtual === 'transicao') {
      setEtapaAtual('teoria');
    } else if (etapaAtual === 'teoria') {
      setEtapaAtual('matching');
    } else if (etapaAtual === 'matching') {
      setEtapaAtual('flashcards');
    } else if (etapaAtual === 'flashcards') {
      setEtapaAtual('questoes');
    } else if (etapaAtual === 'questoes') {
      if (estrutura && moduloAtual < estrutura.modulos.length) {
        setModuloAtual(moduloAtual + 1);
        setEtapaAtual('transicao');
      } else {
        setEtapaAtual('provaFinal');
      }
    }
  };

  const handleSair = () => {
    setEstrutura(null);
    setEtapaAtual('intro');
    setModuloAtual(0);
  };

  const handleRefazer = () => {
    setModuloAtual(1);
    setEtapaAtual('transicao');
  };

  const finalizarAula = async (acertos: number, total: number) => {
    setAcertosProva(acertos);
    setTotalProva(total);
    setEtapaAtual('resultado');

    if (progressoId && aulaId) {
      try {
        const notaFinal = (acertos / total) * 100;
        const tempoTotal = Math.floor((new Date().getTime() - tempoInicio.getTime()) / 60000);

        await supabase
          .from('aulas_progresso')
          .update({
            nota_prova_final: notaFinal,
            concluida: true,
            tempo_total_minutos: tempoTotal,
            progresso_percentual: 100
          })
          .eq('id', progressoId);

        // Atualizar aproveitamento médio da aula
        const { data: progressos } = await supabase
          .from('aulas_progresso')
          .select('nota_prova_final')
          .eq('aula_id', aulaId)
          .not('nota_prova_final', 'is', null);

        if (progressos && progressos.length > 0) {
          const media = progressos.reduce((acc, p) => acc + (p.nota_prova_final || 0), 0) / progressos.length;
          
          await supabase
            .from('aulas_interativas')
            .update({ aproveitamento_medio: media })
            .eq('id', aulaId);
        }
      } catch (error: any) {
        console.error('Erro ao finalizar aula:', error);
      }
    }
  };

  if (etapaAtual === 'intro' || !estrutura) {
    return (
      <AulaIntro 
        onIniciar={gerarAula} 
        onSelecionarAulaPronta={carregarAulaPronta}
        isLoading={isLoading} 
      />
    );
  }

  const modulo = estrutura.modulos.find(m => m.id === moduloAtual);

  if (etapaAtual === 'resultado') {
    return (
      <AulaResultado
        titulo={estrutura.titulo}
        acertos={acertosProva}
        total={totalProva}
        onRefazer={handleRefazer}
      />
    );
  }

  return (
    <>
      <AulaModuloNav
        modulos={estrutura.modulos.map(m => ({ id: m.id, nome: m.nome }))}
        moduloAtual={moduloAtual}
        progresso={calcularProgresso()}
        onSair={handleSair}
        onMudarModulo={(id) => {
          setModuloAtual(id);
          setEtapaAtual('transicao');
        }}
      />

      {etapaAtual === 'transicao' && modulo && (
        <ModuloTransitionCard
          moduloNumero={moduloAtual}
          moduloNome={modulo.nome}
          icone={modulo.icone}
          onComplete={proximaEtapa}
        />
      )}

      {etapaAtual === 'teoria' && modulo && (
        <AulaTeoriaEnhanced
          moduloNumero={moduloAtual}
          titulo={modulo.nome}
          conteudo={modulo.teoria}
          exemploPratico={modulo.exemploPratico}
          quizRapido={modulo.quizRapido}
          resumo={modulo.resumo}
          onProximo={proximaEtapa}
          proximoLabel={`Próxima Etapa: Jogo Matching`}
        />
      )}

      {etapaAtual === 'matching' && modulo && (
        <MatchingGame
          matches={modulo.matching}
          onProximo={proximaEtapa}
        />
      )}

      {etapaAtual === 'flashcards' && modulo && (
        <div className="min-h-screen pt-16 pb-8 px-3 bg-gradient-to-br from-background to-primary/5">
          <div className="max-w-2xl mx-auto space-y-4">
            <FlashcardViewer 
              flashcards={modulo.flashcards.map(f => ({
                front: f.frente,
                back: f.verso,
                exemplo: f.exemplo
              }))} 
              tema={modulo.nome} 
            />
            <div className="flex justify-end">
              <Button
                onClick={proximaEtapa}
                size="lg"
                className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                Próximo: Questões
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {etapaAtual === 'questoes' && modulo && (
        <div className="min-h-screen pt-16 pb-8 px-3 bg-gradient-to-br from-background to-primary/5">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="mb-3">
              <h2 className="text-xl md:text-2xl font-bold">Questões - {modulo.nome}</h2>
            </div>
            <QuizViewerEnhanced questions={modulo.questoes} />
            <div className="flex justify-end">
              <Button
                onClick={proximaEtapa}
                size="lg"
                className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                {moduloAtual < estrutura.modulos.length ? "Próximo Módulo" : "Prova Final"}
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {etapaAtual === 'provaFinal' && (
        <AulaProvaFinal
          questoes={estrutura.provaFinal}
          onFinalizar={finalizarAula}
        />
      )}
    </>
  );
};

export default AulaInterativa;
