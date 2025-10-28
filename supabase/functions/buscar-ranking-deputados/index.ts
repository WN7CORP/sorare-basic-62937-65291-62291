import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tipo, limite = 50, ano, mes } = await req.json();
    
    console.log('Buscando ranking de deputados:', { tipo, limite, ano, mes });

    // Obter ano e mês atual se não fornecidos
    const dataAtual = new Date();
    const anoAtual = ano || dataAtual.getFullYear();
    const mesAtual = mes || (dataAtual.getMonth() + 1);

    // Buscar deputados atuais
    const deputadosUrl = 'https://dadosabertos.camara.leg.br/api/v2/deputados?ordem=ASC&ordenarPor=nome&itens=513';
    const deputadosResponse = await fetch(deputadosUrl, {
      headers: { 'Accept': 'application/json' },
    });

    if (!deputadosResponse.ok) {
      throw new Error(`Erro ao buscar deputados: ${deputadosResponse.status}`);
    }

    const deputadosData = await deputadosResponse.json();
    const deputados = deputadosData.dados || [];

    console.log(`Total de deputados encontrados: ${deputados.length}`);

    let rankingData = [];

    if (tipo === 'despesas' || tipo === 'gastos') {
      // Buscar despesas reais dos deputados
      console.log(`Buscando despesas de ${anoAtual}/${mesAtual}`);
      
      const deputadosComDados = await Promise.all(
        deputados.slice(0, limite * 2).map(async (deputado: any) => {
          try {
            const url = `https://dadosabertos.camara.leg.br/api/v2/deputados/${deputado.id}/despesas?ano=${anoAtual}&mes=${mesAtual}&itens=100&ordem=DESC&ordenarPor=valorDocumento`;
            const response = await fetch(url, {
              headers: { 'Accept': 'application/json' },
            });
            
            if (response.ok) {
              const data = await response.json();
              const despesas = data.dados || [];
              const totalGasto = despesas.reduce((sum: number, d: any) => sum + (d.valorDocumento || 0), 0);
              
              return {
                ...deputado,
                totalGasto: Math.round(totalGasto * 100) / 100,
                quantidadeDespesas: despesas.length,
              };
            }
            return { ...deputado, totalGasto: 0, quantidadeDespesas: 0 };
          } catch (error) {
            console.error(`Erro ao buscar despesas do deputado ${deputado.id}:`, error);
            return { ...deputado, totalGasto: 0, quantidadeDespesas: 0 };
          }
        })
      );

      rankingData = deputadosComDados
        .filter(d => d.totalGasto > 0)
        .sort((a, b) => b.totalGasto - a.totalGasto)
        .slice(0, limite);

      console.log(`Ranking de despesas processado: ${rankingData.length} deputados com gastos`);

    } else if (tipo === 'proposicoes') {
      // Buscar proposições REAIS usando ano atual
      console.log(`Buscando proposições de ${anoAtual}`);
      
      const deputadosComDados = await Promise.all(
        deputados.slice(0, limite * 2).map(async (deputado: any) => {
          try {
            const url = `https://dadosabertos.camara.leg.br/api/v2/proposicoes?idDeputadoAutor=${deputado.id}&ano=${anoAtual}&itens=100&ordem=DESC`;
            const response = await fetch(url, {
              headers: { 'Accept': 'application/json' },
            });
            
            if (response.ok) {
              const data = await response.json();
              return {
                ...deputado,
                totalProposicoes: data.dados?.length || 0,
              };
            }
            return { ...deputado, totalProposicoes: 0 };
          } catch (error) {
            console.error(`Erro ao buscar proposições do deputado ${deputado.id}:`, error);
            return { ...deputado, totalProposicoes: 0 };
          }
        })
      );

      rankingData = deputadosComDados
        .filter(d => d.totalProposicoes > 0)
        .sort((a, b) => b.totalProposicoes - a.totalProposicoes)
        .slice(0, limite);

      console.log(`Ranking de proposições processado: ${rankingData.length} deputados`);

    } else if (tipo === 'presenca' || tipo === 'eventos') {
      // Buscar presença em eventos REAIS
      console.log('Buscando eventos dos últimos 30 dias');
      
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - 30);
      const dataInicioStr = dataInicio.toISOString().split('T')[0];
      const dataFimStr = dataAtual.toISOString().split('T')[0];
      
      const deputadosComDados = await Promise.all(
        deputados.slice(0, limite * 2).map(async (deputado: any) => {
          try {
            const url = `https://dadosabertos.camara.leg.br/api/v2/deputados/${deputado.id}/eventos?dataInicio=${dataInicioStr}&dataFim=${dataFimStr}&itens=100`;
            const response = await fetch(url, {
              headers: { 'Accept': 'application/json' },
            });
            
            if (response.ok) {
              const data = await response.json();
              return {
                ...deputado,
                totalEventos: data.dados?.length || 0,
              };
            }
            return { ...deputado, totalEventos: 0 };
          } catch (error) {
            console.error(`Erro ao buscar eventos do deputado ${deputado.id}:`, error);
            return { ...deputado, totalEventos: 0 };
          }
        })
      );

      rankingData = deputadosComDados
        .filter(d => d.totalEventos > 0)
        .sort((a, b) => b.totalEventos - a.totalEventos)
        .slice(0, limite);

      console.log(`Ranking de presença processado: ${rankingData.length} deputados`);

    } else if (tipo === 'orgaos' || tipo === 'comissoes') {
      // Buscar participação em órgãos/comissões
      const deputadosComDados = await Promise.all(
        deputados.slice(0, limite * 2).map(async (deputado: any) => {
          try {
            const url = `https://dadosabertos.camara.leg.br/api/v2/deputados/${deputado.id}/orgaos`;
            const response = await fetch(url, {
              headers: { 'Accept': 'application/json' },
            });
            
            if (response.ok) {
              const data = await response.json();
              return {
                ...deputado,
                totalOrgaos: data.dados?.length || 0,
              };
            }
            return { ...deputado, totalOrgaos: 0 };
          } catch (error) {
            console.error(`Erro ao buscar órgãos do deputado ${deputado.id}:`, error);
            return { ...deputado, totalOrgaos: 0 };
          }
        })
      );

      rankingData = deputadosComDados
        .filter(d => d.totalOrgaos > 0)
        .sort((a, b) => b.totalOrgaos - a.totalOrgaos)
        .slice(0, limite);

      console.log(`Ranking de comissões processado: ${rankingData.length} deputados`);

    } else {
      // Retornar apenas lista básica de deputados
      rankingData = deputados.slice(0, limite);
    }

    console.log(`✅ Ranking final: ${rankingData.length} deputados`);

    return new Response(JSON.stringify({ 
      ranking: rankingData,
      periodo: { ano: anoAtual, mes: mesAtual }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Erro ao buscar ranking:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

