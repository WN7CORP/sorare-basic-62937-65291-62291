import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Verificar cache (válido por 24h)
    const { data: cacheData, error: cacheError } = await supabaseClient
      .from('cache_leis_recentes')
      .select('*')
      .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('data_publicacao', { ascending: false });

    if (!cacheError && cacheData && cacheData.length > 0) {
      console.log('Retornando leis do cache');
      return new Response(
        JSON.stringify({ leis: cacheData, fonte: 'cache' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Cache expirado ou vazio, buscando da API LexML');

    // Calcular data de 90 dias atrás
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - 90);
    const dataInicioStr = dataInicio.toISOString().split('T')[0];

    // Construir query para API LexML
    const lexmlUrl = `https://www.lexml.gov.br/busca/SRU?operation=searchRetrieve&query=tipoDocumento:lei AND dataPublicacao>=${dataInicioStr}&sortBy=dataPublicacao/sort.descending&maximumRecords=30`;

    console.log('Buscando de LexML:', lexmlUrl);

    const lexmlResponse = await fetch(lexmlUrl);
    if (!lexmlResponse.ok) {
      throw new Error(`Erro na API LexML: ${lexmlResponse.status}`);
    }

    const xmlText = await lexmlResponse.text();
    
    // Parse XML usando DOMParser
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    
    if (!xmlDoc) {
      throw new Error('Erro ao fazer parse do XML');
    }
    
    const records = xmlDoc.getElementsByTagName("srw:record");
    console.log(`Encontrados ${records.length} registros`);

    const leis = [];
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    for (let i = 0; i < Math.min(records.length, 20); i++) {
      const record = records[i];
      
      try {
        // Extrair URN e metadados
        const recordData = record.getElementsByTagName("srw:recordData")[0];
        const urn = recordData.getElementsByTagName("urn")[0]?.textContent || '';
        
        // Parse URN para extrair informações
        // Formato exemplo: urn:lex:br:federal:lei:2025-01-15;15199
        const urnParts = urn.split(':');
        const autoridade = urnParts[3] || 'Federal'; // federal, estadual, municipal
        const tipoDocumento = urnParts[4] || 'lei';
        const dataInfo = urnParts[5]?.split(';') || ['', ''];
        const dataPublicacao = dataInfo[0] || '';
        const numero = dataInfo[1] || '';
        
        // Extrair ano da data
        const ano = dataPublicacao.split('-')[0] || '';

        // Buscar ementa no XML
        const ementa = recordData.getElementsByTagName("ementa")[0]?.textContent || 
                       recordData.getElementsByTagName("descricao")[0]?.textContent || 
                       'Ementa não disponível';

        // Gerar título atrativo com IA
        let tituloGerado = ementa.substring(0, 80) + '...';
        
        if (lovableApiKey && ementa !== 'Ementa não disponível') {
          try {
            const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${lovableApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'google/gemini-2.5-flash',
                messages: [{
                  role: 'user',
                  content: `Você é um redator especializado em direito. Com base nesta ementa jurídica:

"${ementa}"

Crie um título jornalístico impactante e claro (MÁXIMO 60 caracteres) que explique o que esta lei faz. Use linguagem simples e direta que qualquer pessoa entenda. Foque no IMPACTO PRÁTICO da lei.

EXEMPLOS DE BONS TÍTULOS:
- "Nova lei regulamenta trabalho remoto no país"
- "Benefícios previdenciários aumentam 5%"
- "Proibida venda de cigarro para menores de 21"

Retorne APENAS o título, sem aspas, sem pontuação final.`
                }],
                max_tokens: 50
              }),
            });

            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              const titulo = aiData.choices[0]?.message?.content?.trim() || tituloGerado;
              tituloGerado = titulo.substring(0, 60);
            }
          } catch (aiError) {
            console.error('Erro ao gerar título com IA:', aiError);
          }
        }

        // Identificar código relacionado com IA
        let codigoRelacionado = null;
        
        if (lovableApiKey) {
          try {
            const codigoResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${lovableApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'google/gemini-2.5-flash',
                messages: [{
                  role: 'user',
                  content: `Analise esta ementa de lei e identifique qual código ou área jurídica está relacionada:

"${ementa}"

Retorne APENAS UMA das seguintes opções (exatamente como está escrito):
- Código Civil
- Código Penal
- Código de Processo Civil
- Código de Processo Penal
- CLT
- Código de Defesa do Consumidor
- Código Tributário Nacional
- Código de Trânsito
- Constituição Federal
- Estatuto da Criança e do Adolescente
- Estatuto do Idoso
- Lei das Estatais
- Lei Anticorrupção
- Outro

Se não tiver certeza, retorne "Outro".`
                }],
                max_tokens: 20
              }),
            });

            if (codigoResponse.ok) {
              const codigoData = await codigoResponse.json();
              codigoRelacionado = codigoData.choices[0]?.message?.content?.trim() || null;
            }
          } catch (codigoError) {
            console.error('Erro ao identificar código relacionado:', codigoError);
          }
        }

        // Construir links
        const linkTextoIntegral = `https://www.lexml.gov.br/urn/${urn}`;
        const linkPdf = recordData.getElementsByTagName("url")[0]?.textContent || null;

        // Formatar tipo
        const tipoFormatado = tipoDocumento === 'lei' ? 'Lei Ordinária' : 
                             tipoDocumento === 'decreto' ? 'Decreto' :
                             tipoDocumento === 'medida-provisoria' ? 'Medida Provisória' :
                             tipoDocumento.toUpperCase();

        const lei = {
          id_norma: `${tipoDocumento}-${numero}-${ano}`,
          tipo: tipoFormatado,
          numero: numero,
          ano: ano,
          ementa: ementa,
          titulo_gerado_ia: tituloGerado,
          data_publicacao: dataPublicacao,
          autoridade: autoridade.charAt(0).toUpperCase() + autoridade.slice(1),
          codigo_relacionado: codigoRelacionado,
          link_texto_integral: linkTextoIntegral,
          link_pdf: linkPdf,
          updated_at: new Date().toISOString()
        };

        leis.push(lei);

      } catch (recordError) {
        console.error(`Erro ao processar registro ${i}:`, recordError);
        continue;
      }
    }

    console.log(`Processadas ${leis.length} leis`);

    // Salvar no cache (upsert)
    if (leis.length > 0) {
      const { error: upsertError } = await supabaseClient
        .from('cache_leis_recentes')
        .upsert(leis, { onConflict: 'id_norma' });

      if (upsertError) {
        console.error('Erro ao salvar no cache:', upsertError);
      } else {
        console.log('Cache atualizado com sucesso');
      }
    }

    return new Response(
      JSON.stringify({ leis, fonte: 'api' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função buscar-leis-recentes:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        leis: [],
        fonte: 'erro' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});