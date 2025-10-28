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
    const { estado } = await req.json();
    
    console.log('Buscando dados do eleitorado:', { estado });

    // Simulação de dados do eleitorado
    // Em produção, integrar com dados abertos do TSE
    
    const dadosMock = {
      totalEleitores: 156454011,
      aptos: 154000000,
      biometria: 87.5,
      zonas: 2850,
      porGenero: [
        { genero: "Feminino", quantidade: 82345678, percentual: 52.6 },
        { genero: "Masculino", quantidade: 74108333, percentual: 47.4 },
      ],
      porFaixaEtaria: [
        { faixa: "16-17 anos", quantidade: 1523456 },
        { faixa: "18-24 anos", quantidade: 18234567 },
        { faixa: "25-34 anos", quantidade: 32456789 },
        { faixa: "35-44 anos", quantidade: 28345678 },
        { faixa: "45-59 anos", quantidade: 38234567 },
        { faixa: "60-69 anos", quantidade: 22456789 },
        { faixa: "70+ anos", quantidade: 15202165 },
      ],
      porEscolaridade: [
        { nivel: "Analfabeto", quantidade: 4234567 },
        { nivel: "Lê e escreve", quantidade: 8345678 },
        { nivel: "Fundamental incompleto", quantidade: 32456789 },
        { nivel: "Fundamental completo", quantidade: 18234567 },
        { nivel: "Médio incompleto", quantidade: 12345678 },
        { nivel: "Médio completo", quantidade: 48234567 },
        { nivel: "Superior incompleto", quantidade: 15234567 },
        { nivel: "Superior completo", quantidade: 17367598 },
      ],
    };

    // Ajustar dados se for um estado específico (reduzir proporcionalmente)
    if (estado && estado !== "BR") {
      const fator = 0.22; // Aproximadamente 22% do total (SP como exemplo)
      dadosMock.totalEleitores = Math.floor(dadosMock.totalEleitores * fator);
      dadosMock.aptos = Math.floor(dadosMock.aptos * fator);
      dadosMock.zonas = Math.floor(dadosMock.zonas * fator);
      dadosMock.porGenero = dadosMock.porGenero.map(g => ({
        ...g,
        quantidade: Math.floor(g.quantidade * fator)
      }));
      dadosMock.porFaixaEtaria = dadosMock.porFaixaEtaria.map(f => ({
        ...f,
        quantidade: Math.floor(f.quantidade * fator)
      }));
      dadosMock.porEscolaridade = dadosMock.porEscolaridade.map(e => ({
        ...e,
        quantidade: Math.floor(e.quantidade * fator)
      }));
    }

    return new Response(
      JSON.stringify(dadosMock),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Erro ao buscar dados do eleitorado:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao buscar dados do eleitorado',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
