import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_SHEETS_API_KEY = Deno.env.get('GOOGLE_SHEETS_API_KEY');
    const DIREITO_PREMIUM_API_KEY = Deno.env.get('DIREITO_PREMIUM_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const SHEET_ID = '1tqCcr-HgmY5BMHBkLdSFaW2RoldSdFlM44Qx9xYWMLg';
    const RANGE = 'NOTICIAS';

    if (!GOOGLE_SHEETS_API_KEY) {
      throw new Error('GOOGLE_SHEETS_API_KEY não configurada');
    }
    
    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error('DIREITO_PREMIUM_API_KEY não configurada');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log('🔍 Iniciando busca de notícias jurídicas do Google Sheets...');

    // Buscar notícias do Google Sheets
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${GOOGLE_SHEETS_API_KEY}`;
    const searchResponse = await fetch(url);

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Erro ao buscar planilha:', errorText);
      throw new Error(`Erro ao buscar notícias: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    
    if (!searchData.values || searchData.values.length < 2) {
      console.log('Nenhuma notícia encontrada na planilha');
      return new Response(
        JSON.stringify({ success: true, noticiasAdicionadas: 0, message: 'Nenhuma notícia nova' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Primeira linha é cabeçalho: Categoria, Portal, Título, Capa, Link, Data/Hora
    const rows = searchData.values.slice(1);
    
    // Função para converter data brasileira para ISO
    const converterDataBrasileira = (dataBr: string): string => {
      try {
        if (!dataBr || dataBr.trim() === '') return new Date().toISOString();
        
        // Formato esperado: dd/MM/yyyy HH:mm[:ss]
        const partes = dataBr.trim().split(' ');
        if (partes.length < 2) return new Date().toISOString();
        
        const [dia, mes, ano] = partes[0].split('/');
        const horaPartes = partes[1].split(':');
        const hh = horaPartes[0]?.padStart(2, '0') ?? '00';
        const mm = horaPartes[1]?.padStart(2, '0') ?? '00';
        const ss = (horaPartes[2] ?? '00').padStart(2, '0');
        
        // Criar data ISO: yyyy-MM-ddTHH:mm:ssZ
        const dataISO = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}T${hh}:${mm}:${ss}Z`;
        return dataISO;
      } catch {
        return new Date().toISOString();
      }
    };
    
    const noticias: { categoria: string; portal: string; titulo: string; capa: string; link: string; dataHora: string; }[] = rows
      .filter((row: string[]) => row.length >= 5 && row[2] && row[4])
      .map((row: string[]) => ({
        categoria: row[0] || 'Geral',
        portal: row[1] || 'Portal Jurídico',
        titulo: row[2],
        capa: row[3] || '',
        link: row[4],
        dataHora: converterDataBrasileira(row[5]),
      }));

// Ordenar por data e pegar apenas as 3 mais recentes
noticias.sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
const selecionadas = noticias.slice(0, 3);

console.log(`📰 Encontradas ${noticias.length} notícias; processando ${selecionadas.length} mais recentes`);

let noticiasAdicionadas = 0;
let analisesFalhas = 0;

// Processar apenas as 3 mais recentes
for (const noticia of selecionadas) {
      try {
        // Verificar se a notícia já existe
        const { data: existente } = await supabase
          .from('noticias_juridicas_cache')
          .select('id')
          .eq('link', noticia.link)
          .single();

        if (existente) {
          console.log(`⏭️ Notícia já existe: ${noticia.titulo}`);
          continue;
        }

        console.log(`📝 Nova notícia encontrada: ${noticia.titulo}`);

        // Gerar análise com IA
        let analiseIA = null;
        try {
          const analisePrompt = `Analise esta notícia jurídica de forma clara e objetiva:

TÍTULO: ${noticia.titulo}
FONTE: ${noticia.portal}
CATEGORIA: ${noticia.categoria}

Forneça uma análise estruturada seguindo EXATAMENTE este formato:

# 📋 Resumo Executivo
[2-3 linhas explicando o essencial da notícia]

# 🔑 Principais Pontos
- [Ponto 1]
- [Ponto 2]
- [Ponto 3]

# ⚖️ Impacto Jurídico
[Explique as consequências jurídicas em 2-3 parágrafos]

# 📚 Legislação Relacionada
[Liste artigos, leis ou códigos relevantes se aplicável]

# 👥 Para Quem Importa
[Indique quem é afetado: cidadãos, advogados, empresas, etc.]

# 🔍 Contexto Histórico
[Breve contexto se relevante, ou "Não aplicável"]`;

          const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  parts: [{ text: analisePrompt }]
                }],
                generationConfig: {
                  temperature: 0.4,
                  maxOutputTokens: 2000,
                },
              }),
            }
          );

          if (geminiResponse.ok) {
            const geminiData = await geminiResponse.json();
            analiseIA = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || null;
            console.log(`✅ Análise gerada com sucesso`);
          } else {
            console.error(`❌ Erro ao gerar análise: ${geminiResponse.status}`);
            analisesFalhas++;
          }
        } catch (analiseError) {
          console.error('Erro ao gerar análise:', analiseError);
          analisesFalhas++;
        }

        // Salvar notícia no banco
        const { error: insertError } = await supabase
          .from('noticias_juridicas_cache')
          .insert({
            titulo: noticia.titulo,
            descricao: `${noticia.portal} - ${noticia.categoria}`,
            link: noticia.link,
            imagem: noticia.capa || null,
            fonte: noticia.portal,
            categoria: noticia.categoria,
            data_publicacao: noticia.dataHora,
            conteudo_completo: '',
            analise_ia: analiseIA,
            analise_gerada_em: analiseIA ? new Date().toISOString() : null,
          });

        if (insertError) {
          console.error('Erro ao inserir notícia:', insertError);
        } else {
          noticiasAdicionadas++;
          console.log(`✅ Notícia adicionada: ${noticia.titulo}`);
        }

        // Aguardar entre requisições de IA
        if (analiseIA) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (noticiaError) {
        console.error('Erro ao processar notícia:', noticiaError);
      }
    }

    console.log(`✨ Processamento concluído: ${noticiasAdicionadas} notícias adicionadas, ${analisesFalhas} análises falharam`);

    return new Response(
      JSON.stringify({
        success: true,
        noticiasAdicionadas,
        analisesFalhas,
        totalProcessadas: noticias.length,
        message: `${noticiasAdicionadas} notícias adicionadas com sucesso`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
