import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, artigo, codigo, numeroArtigo, aprofundar, termoEspecifico } = await req.json();
    const textoParaAnalise = artigo || content;

    const DIREITO_PREMIUM_API_KEY = Deno.env.get("DIREITO_PREMIUM_API_KEY");
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error("DIREITO_PREMIUM_API_KEY não configurada");
    }

    // Importar createClient do Supabase
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.75.1');
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Mapeamento COMPLETO de códigos - Cache Universal
    const tableMap: { [key: string]: string } = {
      'cpp': 'CP - Código Penal',
      'cc': 'CC - Código Civil',
      'cf': 'CF - Constituição Federal',
      'cpc': 'CPC – Código de Processo Civil',
      'cppenal': 'CPP – Código de Processo Penal',
      'cdc': 'CDC – Código de Defesa do Consumidor',
      'clt': 'CLT – Consolidação das Leis do Trabalho',
      'ctn': 'CTN – Código Tributário Nacional',
      'ctb': 'CTB Código de Trânsito Brasileiro',
      'ce': 'CE – Código Eleitoral',
      'ca': 'CA - Código de Águas',
      'cba': 'CBA Código Brasileiro de Aeronáutica',
      'ccom': 'CCOM – Código Comercial',
      'cdm': 'CDM – Código de Minas',
      'eca': 'ESTATUTO - ECA',
      'idoso': 'ESTATUTO - IDOSO',
      'oab': 'ESTATUTO - OAB',
      'pcd': 'ESTATUTO - PESSOA COM DEFICIÊNCIA',
      'racial': 'ESTATUTO - IGUALDADE RACIAL',
      'cidade': 'ESTATUTO - CIDADE',
      'torcedor': 'ESTATUTO - TORCEDOR'
    };

    const tableName = tableMap[codigo];

    // Verificar se já existe termos em cache - UNIVERSAL
    if (tableName && numeroArtigo) {
      const { data: cached } = await supabase
        .from(tableName)
        .select('termos, termos_aprofundados')
        .eq('Número do Artigo', numeroArtigo)
        .maybeSingle();

      if (!aprofundar && cached?.termos && Array.isArray(cached.termos) && cached.termos.length > 0) {
        console.log('✅ Retornando termos do cache - 0 tokens gastos');
        return new Response(
          JSON.stringify({ termos: cached.termos, cached: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Se for aprofundar, verificar cache de aprofundamento
      if (aprofundar && termoEspecifico && cached?.termos_aprofundados) {
        const aprofundamentoCache = (cached.termos_aprofundados as any)?.[termoEspecifico];
        if (aprofundamentoCache) {
          console.log('✅ Retornando aprofundamento do cache - 0 tokens gastos');
          return new Response(
            JSON.stringify({ aprofundamento: aprofundamentoCache, cached: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    let systemPrompt = '';
    let userPrompt = '';
    
    if (aprofundar && termoEspecifico) {
      systemPrompt = `Você é um especialista em terminologia jurídica brasileira.
Aprofunde a explicação do termo jurídico de forma extremamente detalhada.

Retorne no formato JSON estruturado.`;
      
      userPrompt = `Aprofunde a explicação do termo jurídico "${termoEspecifico}" no contexto deste artigo:

${textoParaAnalise}

Retorne APENAS um JSON válido no formato:
{
  "termo": "${termoEspecifico}",
  "pontos": [
    {
      "titulo": "Conceito Fundamental",
      "explicacao": "Explicação detalhada de 4-5 linhas sobre o conceito básico"
    },
    {
      "titulo": "Origem e Fundamento Legal",
      "explicacao": "Explicação de 4-5 linhas sobre origem histórica e base legal"
    },
    {
      "titulo": "Aplicação Prática",
      "explicacao": "Explicação de 4-5 linhas com exemplos concretos"
    },
    {
      "titulo": "Distinções Importantes",
      "explicacao": "Explicação de 4-5 linhas sobre diferenças com termos similares"
    },
    {
      "titulo": "Consequências Jurídicas",
      "explicacao": "Explicação de 4-5 linhas sobre efeitos práticos"
    },
    {
      "titulo": "Cuidados e Observações",
      "explicacao": "Explicação de 4-5 linhas sobre pontos de atenção"
    }
  ]
}`;
    } else {
      systemPrompt = `Você é um especialista em terminologia jurídica brasileira.
Extraia os principais termos jurídicos e forneça definições claras e objetivas.

Retorne no formato JSON estruturado usando tool calling.`;
      
      userPrompt = `${systemPrompt}\n\nExtraia e defina os 5-8 principais termos jurídicos deste conteúdo:\n\n${textoParaAnalise}\n\nRetorne APENAS um JSON válido no formato:\n{\n  "termos": [\n    {"termo": "nome do termo", "significado": "definição"},\n    ...\n  ]\n}`;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: userPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: aprofundar ? 2000 : 1500,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro da API:", response.status, errorText);
      throw new Error(`Erro da API de IA: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Extract JSON from markdown code blocks if present
    let jsonText = text;
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }
    
    const parsed = JSON.parse(jsonText);
    
    if (aprofundar && termoEspecifico) {
      const aprofundamento = parsed;
      
      // Salvar aprofundamento no banco - UNIVERSAL
      if (tableName && numeroArtigo && aprofundamento) {
        try {
          // Buscar aprofundamentos existentes
          const { data: existing } = await supabase
            .from(tableName)
            .select('termos_aprofundados')
            .eq('Número do Artigo', numeroArtigo)
            .maybeSingle();
          
          const termosAprofundados = existing?.termos_aprofundados || {};
          termosAprofundados[termoEspecifico] = aprofundamento;
          
          await supabase
            .from(tableName)
            .update({ 
              termos_aprofundados: termosAprofundados,
              ultima_atualizacao: new Date().toISOString()
            })
            .eq('Número do Artigo', numeroArtigo);
          console.log(`💾 Aprofundamento salvo no banco (${tableName}) - próximos requests usarão cache (0 tokens)`);
        } catch (e) {
          console.error(`❌ Erro ao salvar aprofundamento no banco (${tableName}):`, e);
        }
      }
      
      return new Response(
        JSON.stringify({ aprofundamento, cached: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      const termos = parsed.termos;

    // Salvar termos no banco - UNIVERSAL
    if (tableName && numeroArtigo && termos && termos.length > 0) {
      try {
        await supabase
          .from(tableName)
          .update({ 
            termos: termos,
            ultima_atualizacao: new Date().toISOString()
          })
          .eq('Número do Artigo', numeroArtigo);
        console.log(`💾 Termos salvos no banco (${tableName}) - próximos requests usarão cache (0 tokens)`);
      } catch (e) {
        console.error(`❌ Erro ao salvar termos no banco (${tableName}):`, e);
      }
    }

      return new Response(
        JSON.stringify({ termos, cached: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro desconhecido" 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
