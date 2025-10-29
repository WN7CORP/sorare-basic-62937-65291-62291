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

    // Verificar cache primeiro (últimas 24 horas)
    const { data: cacheData } = await supabaseClient
      .from('cache_leis_recentes')
      .select('*')
      .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('data_publicacao', { ascending: false })
      .limit(1);

    if (cacheData && cacheData.length > 0) {
      console.log('✅ Retornando dados do cache');
      const { data: todasLeis } = await supabaseClient
        .from('cache_leis_recentes')
        .select('*')
        .order('data_publicacao', { ascending: false });
      
      return new Response(JSON.stringify(todasLeis || []), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('📥 Cache expirado, buscando da API LexML...');

    // Calcular data de 90 dias atrás
    const hoje = new Date();
    const data90DiasAtras = new Date(hoje);
    data90DiasAtras.setDate(hoje.getDate() - 90);

    // URL da API LexML com query correta
    const lexmlUrl = `https://www.lexml.gov.br/busca/SRU?` + 
      `version=1.1&` +
      `operation=searchRetrieve&` +
      `query=urn.autoridade:federal AND urn.tipoDocumento:(lei OR decreto OR medida.provisoria)&` +
      `sortKeys=dataPublicacao/sort.descending&` +
      `maximumRecords=100&` +
      `startRecord=1`;

    console.log(`🔗 URL: ${lexmlUrl}`);

    const response = await fetch(lexmlUrl);
    console.log(`📡 Status API LexML: ${response.status}`);

    if (!response.ok) {
      throw new Error(`Erro na API LexML: ${response.status}`);
    }

    const xmlText = await response.text();
    console.log(`📄 Tamanho XML recebido: ${xmlText.length} bytes`);

    // Extrair registros usando regex (Dublin Core format)
    const recordMatches = Array.from(xmlText.matchAll(/<srw:record[^>]*>([\s\S]*?)<\/srw:record>/g));
    console.log(`🔍 Registros XML encontrados: ${recordMatches.length}`);

    const leis: any[] = [];
    let processados = 0;
    let descartados = 0;

    // Mapeamento de tipos de documento
    const tiposMap: { [key: string]: string } = {
      'lei': 'Lei',
      'decreto': 'Decreto',
      'medida.provisoria': 'Medida Provisória',
      'emenda.constitucional': 'Emenda Constitucional',
      'lei.complementar': 'Lei Complementar'
    };

    // Processar cada registro
    for (const match of recordMatches) {
      try {
        const recordXml = match[1];

        // 1. Extrair URN (Dublin Core: dc:identifier)
        const urnMatch = recordXml.match(/<dc:identifier[^>]*>([^<]+)<\/dc:identifier>/i);
        if (!urnMatch) {
          descartados++;
          continue;
        }
        const urn = urnMatch[1].trim();

        // Validar formato URN
        if (!urn.startsWith('urn:lex:br:')) {
          descartados++;
          continue;
        }

        // 2. Extrair ementa (Dublin Core: dc:description ou dc:title)
        const ementaMatch = recordXml.match(/<dc:description[^>]*>([\s\S]*?)<\/dc:description>/i) 
          || recordXml.match(/<dc:title[^>]*>([\s\S]*?)<\/dc:title>/i);
        
        if (!ementaMatch) {
          descartados++;
          continue;
        }
        const ementa = ementaMatch[1].trim().replace(/<[^>]+>/g, '');

        // 3. Extrair data de publicação (Dublin Core: dc:date)
        const dataPubMatch = recordXml.match(/<dc:date[^>]*>([^<]+)<\/dc:date>/i);
        if (!dataPubMatch) {
          descartados++;
          continue;
        }
        let dataPublicacao = dataPubMatch[1].trim();

        // Validar formato de data (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dataPublicacao)) {
          // Tentar extrair apenas a parte da data se vier com timestamp
          const dateOnly = dataPublicacao.split('T')[0];
          if (dateRegex.test(dateOnly)) {
            dataPublicacao = dateOnly;
          } else {
            console.log(`⚠️ Data inválida para URN ${urn}: ${dataPublicacao}`);
            descartados++;
            continue;
          }
        }

        // Filtrar apenas últimos 90 dias
        const dataPub = new Date(dataPublicacao);
        const diffDias = Math.floor((hoje.getTime() - dataPub.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDias > 90) {
          descartados++;
          continue;
        }

        // 4. Extrair título para pegar número da lei
        const tituloMatch = recordXml.match(/<dc:title[^>]*>([\s\S]*?)<\/dc:title>/i);
        const titulo = tituloMatch ? tituloMatch[1].trim().replace(/<[^>]+>/g, '') : '';

        // Extrair metadados da URN
        // Formato: urn:lex:br:federal:lei:2024-12-20;14956
        const urnParts = urn.split(':');
        const autoridade = urnParts[3] || 'federal';
        const tipoDoc = urnParts[4] || 'lei';
        const dataParte = urnParts[5] || '';

        // Extrair número da lei da URN ou do título
        let numeroLei = '';
        let anoLei = '';

        if (dataParte.includes(';')) {
          const [dataUrn, numero] = dataParte.split(';');
          numeroLei = numero;
          anoLei = dataUrn.split('-')[0];
        } else {
          // Tentar extrair do título (ex: "Lei nº 14.897, de 20 de dezembro de 2024")
          const numeroMatch = titulo.match(/nº?\s*(\d+\.?\d*)/i);
          const anoMatch = titulo.match(/de\s+(\d{4})/);
          numeroLei = numeroMatch ? numeroMatch[1] : '';
          anoLei = anoMatch ? anoMatch[1] : dataPublicacao.split('-')[0];
        }

        // Tipo de documento formatado
        const tipo = tiposMap[tipoDoc] || tipoDoc.charAt(0).toUpperCase() + tipoDoc.slice(1);

        // Autoridade formatada
        const autoridadeFormatada = autoridade === 'federal' ? 'Federal' : 
                                   autoridade === 'estadual' ? 'Estadual' : 
                                   autoridade === 'municipal' ? 'Municipal' : 'Distrital';

        // Gerar título atrativo com IA (com fallback)
        let tituloGerado = ementa.substring(0, 80) + (ementa.length > 80 ? '...' : '');
        let codigoRelacionado = null;

        try {
          const { GoogleGenerativeAI } = await import('https://esm.sh/@google/generative-ai@0.1.3');
          const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') ?? '');
          const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

          const prompt = `Com base na ementa: "${ementa}", crie um título atrativo e curto (máximo 10 palavras) para uma lei brasileira. Também identifique se esta lei está relacionada a algum código jurídico importante (Código Civil, Código Penal, CLT, Código de Processo Civil, etc.). Responda no formato JSON: {"titulo": "seu título", "codigo": "nome do código ou null"}`;

          const result = await model.generateContent(prompt);
          const responseText = result.response.text();
          
          // Tentar extrair JSON da resposta
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.titulo) tituloGerado = parsed.titulo;
            if (parsed.codigo && parsed.codigo !== 'null') codigoRelacionado = parsed.codigo;
          }
        } catch (aiError) {
          console.warn(`⚠️ Falha na geração de título IA para ${urn}:`, aiError);
          // Manter fallback já definido
        }

        // Construir objeto da lei
        const lei = {
          id_norma: urn,
          tipo: tipo,
          numero: numeroLei || 'S/N',
          ano: anoLei,
          titulo_gerado_ia: tituloGerado,
          ementa: ementa,
          data_publicacao: dataPublicacao,
          autoridade: autoridadeFormatada,
          codigo_relacionado: codigoRelacionado,
          link_texto_integral: `https://www.lexml.gov.br/urn/${urn}`,
          link_pdf: null
        };

        leis.push(lei);
        processados++;

      } catch (recordError) {
        console.error('❌ Erro ao processar registro:', recordError);
        descartados++;
      }
    }

    console.log(`✅ Processamento concluído:`);
    console.log(`   - Leis válidas: ${processados}`);
    console.log(`   - Registros descartados: ${descartados}`);

    // Salvar no cache
    if (leis.length > 0) {
      const { error: cacheError } = await supabaseClient
        .from('cache_leis_recentes')
        .upsert(leis, { onConflict: 'id_norma' });

      if (cacheError) {
        console.error('❌ Erro ao salvar no cache:', cacheError);
      } else {
        console.log(`💾 ${leis.length} leis salvas no cache com sucesso`);
      }
    }

    return new Response(JSON.stringify(leis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro na função buscar-leis-recentes:', error);
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
