import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { ano, cargo, estado } = await req.json();
    
    console.log('Buscando resultados:', { ano, cargo, estado });

    const estadosBrasileiros = [
      { uf: "AC", nome: "Acre" },
      { uf: "AL", nome: "Alagoas" },
      { uf: "AP", nome: "Amapá" },
      { uf: "AM", nome: "Amazonas" },
      { uf: "BA", nome: "Bahia" },
      { uf: "CE", nome: "Ceará" },
      { uf: "DF", nome: "Distrito Federal" },
      { uf: "ES", nome: "Espírito Santo" },
      { uf: "GO", nome: "Goiás" },
      { uf: "MA", nome: "Maranhão" },
      { uf: "MT", nome: "Mato Grosso" },
      { uf: "MS", nome: "Mato Grosso do Sul" },
      { uf: "MG", nome: "Minas Gerais" },
      { uf: "PA", nome: "Pará" },
      { uf: "PB", nome: "Paraíba" },
      { uf: "PR", nome: "Paraná" },
      { uf: "PE", nome: "Pernambuco" },
      { uf: "PI", nome: "Piauí" },
      { uf: "RJ", nome: "Rio de Janeiro" },
      { uf: "RN", nome: "Rio Grande do Norte" },
      { uf: "RS", nome: "Rio Grande do Sul" },
      { uf: "RO", nome: "Rondônia" },
      { uf: "RR", nome: "Roraima" },
      { uf: "SC", nome: "Santa Catarina" },
      { uf: "SP", nome: "São Paulo" },
      { uf: "SE", nome: "Sergipe" },
      { uf: "TO", nome: "Tocantins" }
    ];

    const candidatosPorCargo: Record<string, any[]> = {
      'governador': [
        { nome: "Tarcísio de Freitas", partido: "REPUBLICANOS", foto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" },
        { nome: "Eduardo Leite", partido: "PSDB", foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
        { nome: "Romeu Zema", partido: "NOVO", foto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" },
        { nome: "Cláudio Castro", partido: "PL", foto: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop" },
      ],
      'presidente': [
        { nome: "Luiz Inácio Lula da Silva", partido: "PT", foto: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop" }
      ],
      'senador': [
        { nome: "Marina Silva", partido: "REDE", foto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop" }
      ]
    };

    const vicesPorCargo: Record<string, any[]> = {
      'governador': [
        { nome: "Felicio Ramuth", partido: "PSD", foto: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop" },
        { nome: "Gabriel Souza", partido: "MDB", foto: "https://images.unsplash.com/photo-1542345812-d98b5cd6cf98?w=100&h=100&fit=crop" },
        { nome: "Paulo Brant", partido: "NOVO", foto: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop" },
        { nome: "Washington Reis", partido: "MDB", foto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" },
      ],
      'presidente': [
        { nome: "Geraldo Alckmin", partido: "PSB", foto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" }
      ]
    };

    // Se for consulta nacional (Brasil)
    if (!estado || estado === "" || estado === "BR") {
      const candidatosEleicao = candidatosPorCargo[cargo] || candidatosPorCargo['governador'];
      const vicesEleicao = vicesPorCargo[cargo] || vicesPorCargo['governador'];
      
      const resultadosPorEstado = estadosBrasileiros.map((est, index) => {
        const candidatoIndex = index % candidatosEleicao.length;
        const viceIndex = index % vicesEleicao.length;
        const baseVotos = 5000000 + Math.floor(Math.random() * 10000000);
        const totalVotosEstado = baseVotos + Math.floor(Math.random() * 2000000);
        
        return {
          uf: est.uf,
          nomeEstado: est.nome,
          vencedor: {
            nome: candidatosEleicao[candidatoIndex].nome,
            foto: candidatosEleicao[candidatoIndex].foto,
            partido: candidatosEleicao[candidatoIndex].partido,
            votos: baseVotos,
            percentual: (baseVotos / totalVotosEstado) * 100
          },
          vice: cargo !== 'senador' ? {
            nome: vicesEleicao[viceIndex].nome,
            foto: vicesEleicao[viceIndex].foto,
            partido: vicesEleicao[viceIndex].partido
          } : undefined,
          totalVotos: totalVotosEstado
        };
      });

      return new Response(
        JSON.stringify({
          tipo: 'nacional',
          ano,
          cargo,
          estados: resultadosPorEstado,
          totalVotos: resultadosPorEstado.reduce((acc, e) => acc + e.totalVotos, 0),
          comparecimento: 79.5,
          abstencao: 20.5,
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Consulta por estado específico
    const candidatosEleicao = candidatosPorCargo[cargo] || candidatosPorCargo['governador'];
    const totalVotos = 25456789;
    
    const votacao = candidatosEleicao.map((candidato, index) => {
      const basePercentual = index === 0 ? 55 : 45 / (candidatosEleicao.length - 1);
      const votos = Math.floor(totalVotos * (basePercentual / 100));
      return {
        nome: candidato.nome,
        foto: candidato.foto,
        votos,
        partido: candidato.partido,
        percentual: basePercentual
      };
    });

    return new Response(
      JSON.stringify({
        tipo: 'estadual',
        ano,
        cargo,
        estado,
        totalVotos,
        comparecimento: 79.5,
        abstencao: 20.5,
        candidatos: candidatosEleicao.length,
        votacao,
        distribuicao: votacao.map(v => ({
          nome: v.nome,
          votos: v.votos,
          percentual: v.percentual
        }))
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Erro ao buscar resultados:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao buscar resultados',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
