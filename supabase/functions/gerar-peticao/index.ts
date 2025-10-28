import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { descricaoCaso, areaDireito, tipoPeticao, pdfTexto, etapa, contextoAnterior } = await req.json();
    
    const DIREITO_PREMIUM_API_KEY = Deno.env.get('DIREITO_PREMIUM_API_KEY');
    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error('DIREITO_PREMIUM_API_KEY não configurada');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Buscar artigos relevantes do Vade Mecum
    let artigosRelevantes = '';
    try {
      const tabela = getVadeMecumTable(areaDireito);
      if (tabela) {
        const { data: artigos } = await supabase
          .from(tabela as any)
          .select('*')
          .limit(5);
        
        if (artigos && artigos.length > 0) {
          artigosRelevantes = '\n\nARTIGOS RELEVANTES DO VADE MECUM:\n';
          artigos.forEach((art: any) => {
            artigosRelevantes += `\n${art["Número do Artigo"] || art.Artigo}: ${art.Narração}\n`;
          });
        }
      }
    } catch (error) {
      console.error('Erro ao buscar artigos:', error);
    }

    // Gerar prompt baseado na etapa
    const prompt = gerarPrompt(etapa, {
      descricaoCaso,
      areaDireito,
      tipoPeticao,
      pdfTexto,
      contextoAnterior,
      artigosRelevantes
    });

    console.log(`Gerando etapa ${etapa} para ${tipoPeticao} em ${areaDireito}`);

    // Chamar Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8000,
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro Gemini API:', response.status, errorText);
      throw new Error(`Erro na API Gemini: ${response.status}`);
    }

    const data = await response.json();
    const conteudo = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    console.log(`Etapa ${etapa} gerada com sucesso (${conteudo.length} caracteres)`);

    return new Response(
      JSON.stringify({ conteudo }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao gerar petição:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getVadeMecumTable(areaDireito: string): string | null {
  const mapeamento: Record<string, string> = {
    'civil': 'CC - Código Civil',
    'penal': 'CP - Código Penal',
    'trabalhista': 'CLT – Consolidação das Leis do Trabalho',
    'tributario': 'CTN – Código Tributário Nacional',
    'consumidor': 'CDC – Código de Defesa do Consumidor',
    'administrativo': 'CF - Constituição Federal',
    'familia': 'CC - Código Civil',
    'empresarial': 'CCOM – Código Comercial'
  };
  return mapeamento[areaDireito] || 'CF - Constituição Federal';
}

function gerarPrompt(etapa: number, dados: any): string {
  const { descricaoCaso, areaDireito, tipoPeticao, pdfTexto, contextoAnterior, artigosRelevantes } = dados;

  const basePrompt = `Você é um advogado especialista em ${areaDireito}. Sua tarefa é redigir `;

  if (etapa === 1) {
    return `${basePrompt}a PRIMEIRA PARTE de uma ${tipoPeticao}.

CASO: ${descricaoCaso}
${pdfTexto ? `\nDOCUMENTOS ANEXOS:\n${pdfTexto}` : ''}
${artigosRelevantes}

INSTRUÇÕES:
- Estruture: Qualificação das partes, Dos Fatos, Fundamentação Jurídica inicial
- Cite artigos específicos da legislação brasileira
- Use linguagem técnica, formal e jurídica
- Máximo 2000 palavras
- Seja preciso e fundamentado

Inicie a petição de forma profissional.`;
  }

  if (etapa === 2) {
    return `${basePrompt}a SEGUNDA PARTE de uma ${tipoPeticao}.

CONTEXTO ANTERIOR:
${contextoAnterior}
${artigosRelevantes}

INSTRUÇÕES:
- Desenvolva análise profunda dos argumentos jurídicos
- Apresente doutrina e fundamente juridicamente
- Aborde possíveis contrapontos
- Máximo 2500 palavras
- Mantenha coerência com a parte anterior
- Continue a numeração e estrutura formal

Continue desenvolvendo os argumentos de forma sólida.`;
  }

  // Etapa 3
  return `${basePrompt}a TERCEIRA E ÚLTIMA PARTE de uma ${tipoPeticao}.

CONTEXTO COMPLETO:
${contextoAnterior}

INSTRUÇÕES:
- Seção "DOS PEDIDOS" clara e objetiva
- Liste todos os requerimentos de forma enumerada
- Encerramento formal com valor da causa (se aplicável)
- Local, data (atual) e espaço para assinatura
- Máximo 1500 palavras
- Finalize de forma profissional

Termine a petição com todos os pedidos formais necessários.`;
}
