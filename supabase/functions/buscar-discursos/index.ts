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
    const { idDeputado, dataInicio, dataFim } = await req.json();
    
    console.log('Buscando discursos:', { idDeputado, dataInicio, dataFim });

    const params = new URLSearchParams();
    if (idDeputado) params.append('idDeputado', idDeputado.toString());
    if (dataInicio) params.append('dataInicio', dataInicio);
    if (dataFim) params.append('dataFim', dataFim);
    params.append('ordem', 'DESC');
    params.append('ordenarPor', 'dataHoraInicio');
    params.append('itens', '100');

    const url = `https://dadosabertos.camara.leg.br/api/v2/deputados/${idDeputado}/discursos?${params.toString()}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API retornou status ${response.status}`);
    }

    const data = await response.json();
    console.log(`${data.dados?.length || 0} discursos encontrados`);

    return new Response(JSON.stringify({ discursos: data.dados || [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao buscar discursos:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
