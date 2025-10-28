import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumoId, area, tema, subtema, conteudo } = await req.json();

    if (!resumoId || !conteudo) {
      throw new Error('resumoId e conteudo são obrigatórios');
    }

    console.log(`Gerando resumo para ${area} > ${tema} > ${subtema}`);

    // Inicializar Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se já existe conteúdo gerado
    const { data: existingData, error: checkError } = await supabase
      .from('RESUMO')
      .select('conteudo_gerado')
      .eq('id', resumoId)
      .single();

    if (checkError) {
      console.error('Erro ao verificar conteúdo existente:', checkError);
    }

    // Se já existe, retornar o cache
    if (existingData?.conteudo_gerado?.markdown) {
      console.log('Retornando resumo do cache');
      return new Response(
        JSON.stringify({ 
          resumo: existingData.conteudo_gerado.markdown,
          exemplos: existingData.conteudo_gerado.exemplos || '',
          termos: existingData.conteudo_gerado.termos || '',
          fromCache: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gerar novo resumo com Gemini Premium
    const DIREITO_PREMIUM_API_KEY = Deno.env.get('DIREITO_PREMIUM_API_KEY');
    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error('DIREITO_PREMIUM_API_KEY não configurada');
    }

          const promptResumo = `Você é um professor de direito criando material educacional em formato de artigo/blog. Crie um texto COMPLETO e DETALHADO sobre "${subtema}" dentro do tema "${tema}" na área de "${area}".

REGRAS CRÍTICAS:
- NÃO escreva introduções como "Aqui está o resumo" ou "Com certeza"
- NÃO use saudações ou conclusões
- Vá DIRETO ao conteúdo
- Escreva em formato de BLOG/ARTIGO com parágrafos corridos e fluidos
- Use ## para seções principais (ex: ## Conceito e Fundamentos, ## Aspectos Relevantes)
- Use ### apenas quando necessário para subdivisões importantes
- Use **negrito** APENAS para termos técnicos essenciais (máximo 3-4 por parágrafo)
- Use > (blockquote) para destacar pontos importantes, citações legais e artigos de lei
- Prefira parágrafos narrativos ao invés de listas excessivas
- Use listas SOMENTE quando realmente necessário (máximo 3-4 itens por lista)
- NÃO use tabelas, converta TODAS as tabelas em texto corrido
- NÃO use linhas horizontais/divisórias (--- ou ***)
- Escreva de forma didática, clara e profissional

ESTRUTURA EXEMPLO:

## Conceito e Fundamentos

O **termo técnico** refere-se a... [explicação em parágrafo corrido]. Este conceito é fundamental porque...

> Art. XX da Lei YYYY estabelece que: "citação legal importante"

A aplicação deste instituto no ordenamento jurídico brasileiro tem como base... [continuar em parágrafo].

## Características e Aplicação

Ao analisar este tema, observamos que... [parágrafo explicativo]. A doutrina majoritária entende que...

> "Citação doutrinária ou jurisprudencial relevante"

Na prática forense, este conceito se manifesta quando... [parágrafo com exemplos práticos].`;

          const promptExemplos = `INSTRUÇÃO CRÍTICA: Sua primeira palavra DEVE ser "##". NÃO escreva absolutamente NADA antes de "## Exemplo 1:".

EXEMPLOS DO QUE VOCÊ NÃO PODE FAZER:
❌ "Com certeza! Aqui estão 3 exemplos práticos sobre..."
❌ "Com certeza! Aqui estão os três exemplos..."
❌ "Claro! Vou apresentar..."
❌ "Seguem os exemplos..."
❌ Qualquer palavra, letra ou caractere antes de "##"

A PRIMEIRA LINHA DA SUA RESPOSTA DEVE SER:
## Exemplo 1: [Título]

Você é um professor de direito criando 3-4 EXEMPLOS PRÁTICOS detalhados sobre "${subtema}" no contexto de "${tema}" e "${area}".

FORMATO OBRIGATÓRIO:

## Exemplo 1: [Título Descritivo do Caso]

João, empresário do ramo... [descrição narrativa completa da situação]. O conflito surgiu quando... A questão jurídica central envolvia o **conceito técnico**...

> Conforme jurisprudência do STJ: "citação relevante se houver"

Ao analisar o caso, verificou-se que... A solução encontrada foi... Este exemplo demonstra como...

REGRAS:
- Usar formato narrativo com parágrafos corridos
- Usar **negrito** APENAS para pontos-chave (máximo 2-3 por exemplo)
- Usar > para citações de jurisprudência quando aplicável
- Evitar listas, prefira texto corrido
- NÃO usar tabelas
- NÃO usar linhas horizontais/divisórias (--- ou ***)`;

          const promptTermos = `INSTRUÇÃO CRÍTICA: Sua primeira linha DEVE ser "## Glossário Jurídico". NÃO escreva NADA antes disso.

Você é um professor de direito criando um glossário completo. Analise o tema "${subtema}" e liste de 10 a 15 TERMOS JURÍDICOS, EXPRESSÕES TÉCNICAS e CONCEITOS FUNDAMENTAIS relacionados.

Para CADA termo, forneça:
1. Nome do termo em **negrito** dentro de ###
2. Definição completa em parágrafo corrido (2-4 frases)
3. Contexto de aplicação prática quando relevante
4. Relação com outros conceitos se aplicável

PROIBIDO:
❌ "Aqui estão os termos"
❌ "Com certeza"
❌ Qualquer introdução
❌ Numerar os termos
❌ Agrupar em categorias
❌ Usar listas com marcadores
❌ Usar tabelas
❌ Usar linhas horizontais (---)

OBRIGATÓRIO:
✅ Primeira linha: "## Glossário Jurídico"
✅ Usar ### **Nome do Termo** para cada termo
✅ Escrever 10-15 termos
✅ Explicações em parágrafo corrido
✅ Definições completas e didáticas
✅ Ordem lógica de complexidade (do mais básico ao mais complexo)

FORMATO EXATO:

## Glossário Jurídico

### **Termo Jurídico 1**

Definição completa e didática do termo em parágrafo corrido (2-4 frases), explicando o que significa, quando é usado no direito brasileiro e sua relevância prática. Este conceito se relaciona com...

### **Termo Jurídico 2**

Definição completa em formato narrativo...`;

    console.log('Chamando Gemini Premium para gerar conteúdo completo...');
    
    // Gerar resumo
    const aiResponseResumo = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: promptResumo
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4000,
          },
        }),
      }
    );

    if (!aiResponseResumo.ok) {
      throw new Error(`Erro ao gerar resumo: ${aiResponseResumo.status}`);
    }

    const aiDataResumo = await aiResponseResumo.json();
    const resumoGerado = aiDataResumo.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Gerar exemplos
    const aiResponseExemplos = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: promptExemplos
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4000,
          },
        }),
      }
    );

    const aiDataExemplos = await aiResponseExemplos.json();
    const exemplosGerados = aiDataExemplos.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Gerar termos
    const aiResponseTermos = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: promptTermos
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4000,
          },
        }),
      }
    );

    const aiDataTermos = await aiResponseTermos.json();
    const termosGerados = aiDataTermos.candidates?.[0]?.content?.parts?.[0]?.text || '';

    console.log('Conteúdo completo gerado com sucesso');

    // Salvar no banco
    const { error: updateError } = await supabase
      .from('RESUMO')
      .update({ 
        conteudo_gerado: { 
          markdown: resumoGerado,
          exemplos: exemplosGerados,
          termos: termosGerados,
          gerado_em: new Date().toISOString(),
          versao: 1
        },
        ultima_atualizacao: new Date().toISOString()
      })
      .eq('id', resumoId);

    if (updateError) {
      console.error('Erro ao salvar resumo:', updateError);
    } else {
      console.log('Resumo salvo no banco com sucesso');
    }

    return new Response(
      JSON.stringify({ 
        resumo: resumoGerado,
        exemplos: exemplosGerados,
        termos: termosGerados,
        fromCache: false 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro em gerar-resumo-pronto:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});