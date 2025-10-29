import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar cache primeiro
    const { data: cacheData } = await supabaseClient
      .from('cache_leis_recentes')
      .select('*')
      .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('data_publicacao', { ascending: false })
      .limit(1);

    if (cacheData && cacheData.length > 0) {
      console.log('Retornando dados do cache');
      const { data: todasLeis } = await supabaseClient
        .from('cache_leis_recentes')
        .select('*')
        .order('data_publicacao', { ascending: false });
      
      return new Response(JSON.stringify(todasLeis || []), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Cache expirado ou vazio, buscando da API LexML');

    // Calcular data de 90 dias atrás
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - 90);
    const ano = dataInicio.getFullYear();
    const mes = String(dataInicio.getMonth() + 1).padStart(2, '0');
    const dia = String(dataInicio.getDate()).padStart(2, '0');
    const dataInicioStr = `${ano}-${mes}-${dia}`;

    // Buscar documentos recentes do LexML usando a API de busca
    // A API do LexML aceita queries CQL (Contextual Query Language)
    const lexmlUrl = `https://www.lexml.gov.br/busca/SRU?version=1.1&operation=searchRetrieve&query=urn.tipoDocumento=lei OR urn.tipoDocumento=decreto OR urn.tipoDocumento=medida.provisoria&maximumRecords=50&sortKeys=dataPublicacao,,1`;

    console.log('Buscando de LexML:', lexmlUrl);

    const lexmlResponse = await fetch(lexmlUrl);
    
    if (!lexmlResponse.ok) {
      const errorText = await lexmlResponse.text();
      console.error('Erro LexML - Status:', lexmlResponse.status);
      throw new Error(`Erro na API LexML: ${lexmlResponse.status}`);
    }

    const xmlText = await lexmlResponse.text();
    
    // Parse XML usando regex
    const recordMatches = xmlText.matchAll(/<srw:record[^>]*>([\s\S]*?)<\/srw:record>/g);
    const records = Array.from(recordMatches);
    console.log(`Encontrados ${records.length} registros do LexML`);

    const leis = [];
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    let processados = 0;
    let descartados = 0;

    for (const [, recordXml] of records) {
      try {
        // Extrair URN
        const urnMatch = recordXml.match(/<urn[^>]*>([^<]+)<\/urn>/i);
        if (!urnMatch) {
          descartados++;
          continue;
        }
        const urn = urnMatch[1].trim();
        
        // Parse URN para extrair informações
        // Formato: urn:lex:br:federal:lei:2025-01-15;15199
        const urnParts = urn.split(':');
        if (urnParts.length < 6) {
          descartados++;
          continue;
        }

        const autoridade = urnParts[3]; // federal, estadual, municipal
        let tipoDocumento = urnParts[4]; // lei, decreto, etc
        const dataENumero = urnParts[5]; // 2025-01-15;15199
        
        // Extrair data de publicação da URN
        let dataPublicacao = '';
        const dataMatch = dataENumero.match(/(\d{4}-\d{2}-\d{2})/);
        if (dataMatch) {
          dataPublicacao = dataMatch[1];
        } else {
          // Tentar extrair do XML
          const dataPubMatch = recordXml.match(/<dataPublicacao[^>]*>([^<]+)<\/dataPublicacao>/i);
          if (dataPubMatch) {
            const dataPub = dataPubMatch[1].trim();
            // Validar formato YYYY-MM-DD
            if (/^\d{4}-\d{2}-\d{2}$/.test(dataPub)) {
              dataPublicacao = dataPub;
            }
          }
        }

        // Descartar se não tem data válida
        if (!dataPublicacao || !/^\d{4}-\d{2}-\d{2}$/.test(dataPublicacao)) {
          descartados++;
          continue;
        }

        // Filtrar apenas últimos 90 dias
        const dataLei = new Date(dataPublicacao);
        if (dataLei < dataInicio) {
          descartados++;
          continue;
        }

        // Extrair número da lei
        const numeroMatch = dataENumero.match(/;(\d+)/);
        const numero = numeroMatch ? numeroMatch[1] : '';
        
        // Extrair ano
        const ano = dataPublicacao.split('-')[0];

        // Buscar ementa/descrição
        const ementaMatch = recordXml.match(/<ementa[^>]*>([\s\S]*?)<\/ementa>/i) || 
                           recordXml.match(/<descricao[^>]*>([\s\S]*?)<\/descricao>/i);
        let ementa = ementaMatch ? ementaMatch[1].replace(/<[^>]+>/g, '').trim() : '';
        
        if (!ementa) {
          descartados++;
          continue;
        }

        // Limpar ementa de caracteres especiais XML
        ementa = ementa.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

        // Gerar título atrativo com IA
        let tituloGerado = ementa.substring(0, 60);
        let codigoRelacionado = null;

        if (lovableApiKey) {
          try {
            const prompt = `Baseado nesta ementa de lei brasileira, gere:
1. Um título CURTO e ATRATIVO (máximo 60 caracteres) focado no IMPACTO PRÁTICO para o cidadão
2. O código jurídico mais relacionado (apenas UM): Constituição Federal, Código Civil, Código Penal, CLT, CDC, CPC, CPP, CTN, ECA, ou "Nenhum"

Ementa: "${ementa}"

Responda APENAS no formato JSON:
{"titulo": "seu título aqui", "codigo": "nome do código"}`;

            const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${lovableApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'google/gemini-2.5-flash',
                messages: [
                  { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 150,
              }),
            });

            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              const content = aiData.choices?.[0]?.message?.content || '';
              
              // Extrair JSON da resposta
              const jsonMatch = content.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.titulo) {
                  tituloGerado = parsed.titulo.substring(0, 60);
                }
                if (parsed.codigo && parsed.codigo !== 'Nenhum') {
                  codigoRelacionado = parsed.codigo;
                }
              }
            }
          } catch (error) {
            console.log('Erro ao gerar título com IA:', error);
          }
        }

        // Mapear tipo de documento para formato legível
        const tiposMap: Record<string, string> = {
          'lei': 'Lei',
          'decreto': 'Decreto',
          'medida.provisoria': 'Medida Provisória',
          'emenda.constitucional': 'Emenda Constitucional',
        };
        const tipoFormatado = tiposMap[tipoDocumento] || tipoDocumento;

        // Mapear autoridade
        const autoridadeMap: Record<string, string> = {
          'federal': 'Federal',
          'estadual': 'Estadual',
          'municipal': 'Municipal',
        };
        const autoridadeFormatada = autoridadeMap[autoridade] || autoridade;

        // Extrair link PDF se disponível
        const urlMatch = recordXml.match(/<url[^>]*>([\s\S]*?)<\/url>/i);
        const linkPdf = urlMatch ? urlMatch[1].replace(/<[^>]+>/g, '').trim() : null;

        // Construir link para texto integral
        const linkTextoIntegral = `https://www.lexml.gov.br/urn/${urn}`;

        const lei = {
          id_norma: urn,
          tipo: tipoFormatado,
          numero,
          ano,
          titulo_gerado_ia: tituloGerado,
          ementa,
          data_publicacao: dataPublicacao,
          autoridade: autoridadeFormatada,
          codigo_relacionado: codigoRelacionado,
          link_texto_integral: linkTextoIntegral,
          link_pdf: linkPdf,
          urn,
        };

        leis.push(lei);
        processados++;

      } catch (error) {
        console.error('Erro ao processar registro:', error);
        descartados++;
      }
    }

    console.log(`Processados: ${processados}, Descartados: ${descartados}`);
    console.log(`Total de leis válidas para salvar: ${leis.length}`);

    // Salvar no cache
    if (leis.length > 0) {
      const { error: cacheError } = await supabaseClient
        .from('cache_leis_recentes')
        .upsert(leis, { onConflict: 'id_norma' });

      if (cacheError) {
        console.error('Erro ao salvar no cache:', cacheError);
      } else {
        console.log(`${leis.length} leis salvas no cache com sucesso`);
      }
    }

    return new Response(JSON.stringify(leis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na função buscar-leis-recentes:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
