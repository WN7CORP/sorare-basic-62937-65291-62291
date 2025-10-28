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
    const { idProposicao, dataInicio, dataFim } = await req.json();
    
    console.log('Buscando votações com filtros:', { idProposicao, dataInicio, dataFim });

    // Validar formato de datas (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dataInicio && !dateRegex.test(dataInicio)) {
      throw new Error('Data início inválida. Use formato YYYY-MM-DD');
    }
    if (dataFim && !dateRegex.test(dataFim)) {
      throw new Error('Data fim inválida. Use formato YYYY-MM-DD');
    }

    // Construir URL com parâmetros
    const params = new URLSearchParams();
    if (idProposicao) params.append('idProposicao', idProposicao.toString());
    if (dataInicio) params.append('dataInicio', dataInicio);
    if (dataFim) params.append('dataFim', dataFim);
    params.append('ordem', 'DESC');
    params.append('ordenarPor', 'dataHoraRegistro');
    params.append('itens', '100'); // Limitar a 100 itens

    const url = `https://dadosabertos.camara.leg.br/api/v2/votacoes?${params.toString()}`;
    console.log('URL da API:', url);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da API:', response.status, errorText);
      throw new Error(`API retornou status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log(`${data.dados?.length || 0} votações encontradas`);

    return new Response(JSON.stringify({ votacoes: data.dados || [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao buscar votações:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
