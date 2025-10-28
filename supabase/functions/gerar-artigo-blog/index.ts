import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { numero } = await req.json();

    if (!numero) {
      throw new Error('Número do artigo não fornecido');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar artigo da tabela
    const { data: artigo, error: fetchError } = await supabase
      .from('ESTAGIO-BLOG')
      .select('*')
      .eq('Nº', numero)
      .single();

    if (fetchError || !artigo) {
      throw new Error('Artigo não encontrado');
    }

    // Verificar se já tem artigo gerado e cache válido
    if (artigo.artigo_melhorado && artigo.cache_validade) {
      const cacheValido = new Date(artigo.cache_validade) > new Date();
      if (cacheValido) {
        console.log('Retornando artigo do cache');
        return new Response(
          JSON.stringify({ 
            artigo: artigo.artigo_melhorado,
            fromCache: true,
            titulo: artigo['Título'],
            capa: artigo['Capa']
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('Gerando novo artigo para:', artigo['Link']);

    // Fazer scraping do link original
    const scrapingResponse = await fetch(
      `${supabaseUrl}/functions/v1/buscar-conteudo-noticia`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ url: artigo['Link'] })
      }
    );

    if (!scrapingResponse.ok) {
      const errorText = await scrapingResponse.text();
      console.error('Erro no scraping:', errorText);
      
      // Se falhar o scraping, retornar mensagem amigável
      return new Response(
        JSON.stringify({ 
          error: 'Não foi possível acessar o conteúdo original. Por favor, tente novamente mais tarde.',
          details: errorText
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { conteudo: conteudoOriginal } = await scrapingResponse.json();

    // Usar Gemini para melhorar o artigo
    const apiKey = Deno.env.get('DIREITO_PREMIUM_API_KEY');
    if (!apiKey) {
      throw new Error('DIREITO_PREMIUM_API_KEY não configurada');
    }

    const prompt = `Você é um especialista em redação de conteúdo educacional para estudantes de Direito.

Recrie o seguinte artigo sobre estágios jurídicos, melhorando significativamente a qualidade, clareza e utilidade para estudantes de Direito.

TÍTULO ORIGINAL: ${artigo['Título']}

CONTEÚDO ORIGINAL:
${conteudoOriginal}

INSTRUÇÕES PARA REESCRITA:
1. **Introdução atraente**: Comece com um parágrafo que capte a atenção e contextualize o tema

2. **Desenvolvimento estruturado**: Organize as informações em seções claras com subtítulos

3. **Dicas práticas**: Adicione orientações acionáveis para estudantes

4. **Linguagem profissional mas acessível**: Mantenha tom formal sem ser excessivamente técnico

5. **Conclusão motivadora**: Termine com insights valiosos e próximos passos

FORMATO DE SAÍDA:
- Use Markdown para formatação
- Inclua subtítulos com ## e ###
- Use listas quando apropriado
- Destaque pontos importantes em **negrito**
- **IMPORTANTE**: Adicione DUAS quebras de linha entre parágrafos (\n\n)
- **IMPORTANTE**: Adicione espaçamento generoso entre seções
- Mantenha parágrafos curtos e escaneáveis (3-4 linhas no máximo)

NÃO inclua o título principal (# H1) pois será adicionado separadamente.

Escreva o artigo completo em português com espaçamento adequado:`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8000,
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Erro Gemini:', errorText);
      throw new Error('Erro ao gerar artigo com Gemini');
    }

    const geminiData = await geminiResponse.json();
    const artigoMelhorado = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!artigoMelhorado) {
      throw new Error('Gemini não retornou conteúdo');
    }

    // Salvar artigo melhorado na tabela
    const { error: updateError } = await supabase
      .from('ESTAGIO-BLOG')
      .update({
        artigo_melhorado: artigoMelhorado,
        gerado_em: new Date().toISOString(),
        cache_validade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias
      })
      .eq('Nº', numero);

    if (updateError) {
      console.error('Erro ao salvar artigo:', updateError);
      throw updateError;
    }

    console.log('Artigo gerado e salvo com sucesso');

    return new Response(
      JSON.stringify({ 
        artigo: artigoMelhorado,
        fromCache: false,
        titulo: artigo['Título'],
        capa: artigo['Capa']
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro em gerar-artigo-blog:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});