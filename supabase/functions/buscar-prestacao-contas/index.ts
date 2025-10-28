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
    const { busca, ano, tipo } = await req.json();
    
    console.log('Buscando prestação de contas:', { busca, ano, tipo });

    // Simulação de prestação de contas
    // Em produção, integrar com API DivulgaCandContas do TSE
    
    const contasMock = {
      receitas: 2500000.00,
      despesas: 2350000.00,
      principaisDoadores: [
        { nome: "Doador A", tipo: "Pessoa Física", valor: 450000.00 },
        { nome: "Partido Político", tipo: "Pessoa Jurídica", valor: 800000.00 },
        { nome: "Doador B", tipo: "Pessoa Física", valor: 350000.00 },
        { nome: "Fundo Partidário", tipo: "Fundo Público", valor: 900000.00 },
      ],
      principaisDespesas: [
        { categoria: "Publicidade", fornecedor: "Agência XYZ", valor: 850000.00 },
        { categoria: "Materiais de Campanha", fornecedor: "Gráfica ABC", valor: 420000.00 },
        { categoria: "Pesquisas", fornecedor: "Instituto DEF", valor: 280000.00 },
        { categoria: "Eventos", fornecedor: "Diversos", valor: 350000.00 },
        { categoria: "Transporte", fornecedor: "Locadora GHI", valor: 200000.00 },
        { categoria: "Alimentação", fornecedor: "Diversos", valor: 150000.00 },
        { categoria: "Outros", fornecedor: "Diversos", valor: 100000.00 },
      ],
    };

    return new Response(
      JSON.stringify(contasMock),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Erro ao buscar prestação de contas:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao buscar prestação de contas',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
