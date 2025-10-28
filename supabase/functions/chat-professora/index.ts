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
    const { messages, files, mode, extractedText, deepMode = false, responseLevel = 'complete' } = await req.json();
    const DIREITO_PREMIUM_API_KEY = Deno.env.get('DIREITO_PREMIUM_API_KEY');
    const DIREITO_PREMIUM_API_KEY_RESERVA = Deno.env.get('DIREITO_PREMIUM_API_KEY_RESERVA');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error('DIREITO_PREMIUM_API_KEY não configurada');
    }

    // Criar cliente Supabase para buscar dados da CF
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Detectar menções a artigos da CF
    const lastUserMessage = messages[messages.length - 1];
    let cfContext = '';
    const hasFiles = files && files.length > 0;
    
    // Se há arquivos anexados, adicionar instrução especial de análise
    let fileAnalysisPrefix = '';
    if (hasFiles) {
      fileAnalysisPrefix = `\n\n**IMPORTANTE - ARQUIVO ANEXADO:**
Você recebeu um arquivo real (imagem ou PDF). Você DEVE analisar o CONTEÚDO REAL do arquivo.

${extractedText ? `**TEXTO EXTRAÍDO DO PDF:**\n${extractedText}\n\n` : ''}

Sua resposta DEVE:
1. Descrever EXATAMENTE o que você vê/lê no arquivo (não invente nada)
2. Extrair textos visíveis se for imagem
3. Resumir os pontos principais encontrados NO ARQUIVO
4. Perguntar à pessoa o que ela gostaria de fazer com esse conteúdo
5. Nas sugestões [SUGESTÕES], oferecer perguntas específicas baseadas no CONTEÚDO REAL analisado

**NUNCA invente conteúdo que não está no arquivo!**\n`;
    }
    
    // Regex para detectar artigos (art. 5º, artigo 5, art 5, etc)
    const articleRegex = /art(?:igo)?\.?\s*(\d+)/gi;
    const articleMatches = lastUserMessage?.content?.match(articleRegex);
    
    if (articleMatches) {
      console.log('Artigos detectados:', articleMatches);
      
      // Buscar cada artigo mencionado
      for (const match of articleMatches) {
        const articleNum = match.replace(/art(?:igo)?\.?\s*/gi, '').trim();
        
        const { data: articles } = await supabase
          .from('CF - Constituição Federal')
          .select('*')
          .ilike('Número do Artigo', `%${articleNum}%`)
          .limit(1);
        
        if (articles && articles.length > 0) {
          const article = articles[0];
          cfContext += `\n\n[ARTIGO ${article['Número do Artigo']} DA CF]\n`;
          cfContext += `${article.Artigo}\n`;
          if (article.Narração) cfContext += `Narração: ${article.Narração}\n`;
          if (article.Comentario) cfContext += `Comentário: ${article.Comentario}\n`;
        }
      }
    }

    // Preparar o prompt do sistema baseado no modo e nível de resposta
    let systemPrompt = '';
    
    if (mode === 'lesson') {
      if (responseLevel === 'basic') {
        systemPrompt = `Professora de direito didática.

**OBJETIVO:** Explicação CLARA e COMPLETA dos conceitos fundamentais (~400 palavras).

**ESTRUTURA OBRIGATÓRIA:**
1. 📖 **Lei/Artigo** (cite primeiro)
2. 💡 **Conceito Principal** (defina de forma simples)
3. 📝 **Explicação** (desenvolva os pontos-chave)
4. 🔍 [COMPARAÇÃO] (2-3 cards comparando conceitos relacionados)
5. 📊 [INFOGRÁFICO] (etapas/processo quando aplicável)
6. 💭 [SUGESTÕES] (4 perguntas para aprofundar)

**FORMATAÇÃO:**
- Use # apenas para título principal
- Use ## para seções (máx 4)
- Use [ATENÇÃO], [IMPORTANTE], [DICA], [NOTA] para destaques
- **Negrito** em termos-chave
- Listas numeradas para processos
- Exemplos concretos em cada seção

**SUGESTÕES:** Termine SEMPRE com:
[SUGESTÕES]
- Pergunta sobre aplicação prática?
- Pergunta sobre casos específicos?
- Pergunta sobre diferenças conceituais?
- Pergunta sobre jurisprudência?
[/SUGESTÕES]

**COMPONENTES AVANÇADOS DISPONÍVEIS:**
- [TABS: Título] para organizar conteúdo em abas
- [ACCORDION] para FAQ ou tópicos expansíveis
- [SLIDES: Título] para apresentação passo a passo
- [COMPARAÇÃO] para diferenciar institutos similares
- [INFOGRÁFICO] para fluxogramas e etapas visuais

${cfContext || ''}`;

      } else if (responseLevel === 'deep') {
        systemPrompt = `Professora de direito - MODO APROFUNDADO.

**OBJETIVO:** Análise COMPLETA e DETALHADA com fundamentação jurídica sólida (~1500 palavras).

**ESTRUTURA OBRIGATÓRIA:**
1. 📖 **Lei/Artigo** (cite e contextualize)
2. 💡 **Conceito e Definição Doutrinária**
3. 📝 **Análise Detalhada**:
   - Origem histórica
   - Interpretação doutrinária (cite autores)
   - Jurisprudência relevante (STF/STJ)
   - Casos práticos e precedentes
   - Debates e controvérsias
   - Aplicação prática atual
4. 🔍 [COMPARAÇÃO] (3-4 cards comparando institutos similares)
5. 📊 [INFOGRÁFICO] (fluxogramas de processos)
6. 📈 [ESTATÍSTICAS] (quando aplicável - dados jurídicos)
7. 💭 [SUGESTÕES] (4-5 perguntas avançadas)

**FORMATAÇÃO:**
- # Título principal
- ## Seções (até 6)
- ### Subseções
- [ATENÇÃO], [IMPORTANTE], [DICA], [NOTA]
- **Negrito** em conceitos-chave
- > Citações de doutrina e jurisprudência
- Tabelas comparativas quando útil

**SUGESTÕES:** Termine SEMPRE com:
[SUGESTÕES]
- Pergunta sobre tese avançada?
- Pergunta sobre caso específico complexo?
- Pergunta sobre posição minoritária?
- Pergunta sobre evolução jurisprudencial?
- Pergunta sobre aplicação em casos limite?
[/SUGESTÕES]

**COMPONENTES AVANÇADOS:**
Use [TABS], [ACCORDION], [SLIDES] para organizar conteúdo complexo.
Exemplo [TABS]:
[TABS: Interpretações Doutrinárias]
{"tabs": [
  {"title": "Doutrina Majoritária", "content": "Conteúdo em Markdown", "icon": "📖"},
  {"title": "Posição Minoritária", "content": "Outro ponto de vista", "icon": "⚖️"}
]}
[/TABS]

${cfContext || ''}`;

      } else { // 'complete' (padrão)
        systemPrompt = `Professora de direito didática e completa.

**OBJETIVO:** Explicação COMPLETA preenchendo TODAS as lacunas necessárias para compreensão total (~800 palavras).

**ESTRUTURA OBRIGATÓRIA:**
1. 📖 **Lei/Artigo** (cite primeiro com contexto)
2. 💡 **Conceito Principal** (defina de forma clara)
3. 📝 **Explicação Completa**:
   - O que é (definição)
   - Por que existe (fundamento)
   - Como funciona (aplicação)
   - Quando se aplica (hipóteses)
   - Exemplos práticos (3-4 exemplos)
   - Jurisprudência relevante (1-2 precedentes)
4. 🔍 [COMPARAÇÃO] (2-3 cards comparando com institutos similares)
5. 📊 [INFOGRÁFICO] (processo/etapas quando aplicável)
6. 💭 [SUGESTÕES] (4 perguntas relevantes)

**FORMATAÇÃO:**
- Use # para título principal
- Use ## para seções (máx 5)
- Use [ATENÇÃO], [IMPORTANTE], [DICA], [NOTA] para destaques
- **Negrito** em conceitos-chave
- > Citações quando relevante
- Listas para organizar informações

**SUGESTÕES:** Termine SEMPRE com:
[SUGESTÕES]
- Pergunta sobre exemplo prático?
- Pergunta sobre comparação?
- Pergunta sobre exceções?
- Pergunta sobre jurisprudência?
[/SUGESTÕES]

**COMPONENTES AVANÇADOS:**
- [TABS: Título] para organizar conteúdo em abas
- [ACCORDION] para FAQ ou tópicos expansíveis
- [SLIDES: Título] para apresentação passo a passo
- [COMPARAÇÃO] para diferenciar institutos
- [INFOGRÁFICO] para fluxogramas

${cfContext || ''}`;
      }
    } else if (mode === 'recommendation') {
      const { data: livrosEstudos } = await supabase.from('BIBLIOTECA-ESTUDOS').select('*').limit(100);
      const { data: livrosOAB } = await supabase.from('BIBILIOTECA-OAB').select('*').limit(100);
      const { data: videoAulas } = await supabase.from('VIDEO AULAS-NOVO' as any).select('*').limit(100);
      
      const areasEstudos = [...new Set(livrosEstudos?.map(l => l['Área']).filter(Boolean))];
      const areasOAB = [...new Set(livrosOAB?.map(l => l['Área']).filter(Boolean))];
      const areasVideos = [...new Set(videoAulas?.map((v: any) => v.area).filter(Boolean))];
      
      systemPrompt = `Assistente de materiais jurídicos.

MATERIAIS: Estudos (${areasEstudos.join(', ')}), OAB (${areasOAB.join(', ')}), Vídeos (${areasVideos.join(', ')})

Use funções para retornar materiais diretamente. Sem texto explicativo.${cfContext ? `\n\nCONTEXTO CF:${cfContext}` : ''}`;
    } else {
      systemPrompt = deepMode
        ? `Assistente jurídica: análise DETALHADA com fundamentação completa, jurisprudência e exemplos práticos.
**ORDEM:** Explicação → [COMPARAÇÃO] → [INFOGRÁFICO] → [SUGESTÕES]
- Envie cada bloco ASSIM QUE estiver pronto
- [SUGESTÕES] com 3-4 perguntas curtas terminando com "?"${cfContext || ''}
${fileAnalysisPrefix}`
        : `Assistente jurídica: cite lei/artigo PRIMEIRO.
**ORDEM:** Explicação → [COMPARAÇÃO] → [INFOGRÁFICO] → [SUGESTÕES]
- Envie cada bloco ASSIM QUE estiver pronto
- [SUGESTÕES] com 3-4 perguntas curtas terminando com "?"
Max 250 palavras.${cfContext || ''}
${fileAnalysisPrefix}`;
    }

    // Construir mensagens no formato Gemini com suporte multimodal
    let geminiContents: any[] = [];
    
    // Comprimir histórico: enviar apenas últimas 5 mensagens (sem system prompt no contents)
    const recentMessages = messages.slice(-5);
    
    // Processar mensagens incluindo arquivos
    for (let i = 0; i < recentMessages.length; i++) {
      const m: any = recentMessages[i];
      const isLastUserMessage = i === recentMessages.length - 1 && m.role === 'user';
      
      if (m.role === 'user') {
        const parts: any[] = [{ text: m.content }];
        
        // Se for a última mensagem do usuário e houver arquivos, adicionar
        if (isLastUserMessage && files && files.length > 0) {
          for (const file of files) {
            const base64Data = file.data.includes('base64,') 
              ? file.data.split('base64,')[1] 
              : file.data;
            
            if (file.type.startsWith('image/')) {
              parts.push({
                inline_data: {
                  mime_type: file.type,
                  data: base64Data
                }
              });
            } else if (file.type === 'application/pdf') {
              // Enviar o PDF inteiro como inline_data para análise real do conteúdo
              parts.push({
                inline_data: {
                  mime_type: 'application/pdf',
                  data: base64Data
                }
              });
            }
          }
        }
        
        geminiContents.push({ role: 'user', parts });
      } else if (m.role === 'assistant') {
        geminiContents.push({
          role: 'model',
          parts: [{ text: m.content }]
        });
      }
    }

    const payload = {
      contents: geminiContents,
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        temperature: deepMode ? 0.7 : 0.6,
        maxOutputTokens: responseLevel === 'basic' ? 2000 :
                         responseLevel === 'deep' ? 8000 : 
                         4000, // complete
        topP: 0.95,
        topK: 40,
        stopSequences: [],
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
      ]
    };

    // Escolher modelo baseado em deepMode
    const model = deepMode ? 'gemini-2.5-flash' : 'gemini-2.0-flash-exp';
    
    // Função auxiliar para fazer requisição à API
    const fetchGemini = async (apiKey: string) => {
      return await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );
    };

    console.log('🚀 [CHAT-PROFESSORA] Requisição recebida');
    console.log('📊 [CHAT-PROFESSORA] Modo:', mode, deepMode ? '(PROFUNDO)' : '(RÁPIDO)');
    console.log('🤖 [CHAT-PROFESSORA] Modelo:', model);
    console.log('💬 [CHAT-PROFESSORA] Número de mensagens:', messages.length);
    console.log('📎 [CHAT-PROFESSORA] Arquivos anexados:', files?.length || 0);
    
    const startTime = Date.now();
    const payloadSize = JSON.stringify(payload).length;
    console.log(`📦 [CHAT-PROFESSORA] Tamanho do payload: ${payloadSize} bytes`);
    console.log(`🎯 [CHAT-PROFESSORA] MaxTokens: ${payload.generationConfig.maxOutputTokens}`);
    
    // Tentar com a chave principal
    let response = await fetchGemini(DIREITO_PREMIUM_API_KEY);

    // Se der erro 429 e houver chave reserva, tentar com ela
    if (!response.ok && response.status === 429 && DIREITO_PREMIUM_API_KEY_RESERVA) {
      console.log('⚠️ Quota excedida na chave principal, tentando chave reserva...');
      response = await fetchGemini(DIREITO_PREMIUM_API_KEY_RESERVA);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro da API Gemini:', response.status, errorText);
      
      // Tratamento específico para erro de quota
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'quota_exceeded',
            message: 'A quota diária da API foi excedida em todas as chaves disponíveis. Por favor, tente novamente amanhã ou contate o suporte.'
          }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      throw new Error(`Erro da API Gemini: ${response.status}`);
    }

    const apiLatency = Date.now() - startTime;
    console.log(`✅ [CHAT-PROFESSORA] Resposta HTTP OK em ${apiLatency}ms, iniciando streaming...`);
    let firstTokenReceived = false;
    let tokenCount = 0;
    let chunksSent = 0;
    
    // Transformar o stream do Gemini para formato compatível
    const stream = new TransformStream({
      async transform(chunk, controller) {
        try {
          const text = new TextDecoder().decode(chunk);
          const lines = text.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonData = line.slice(6).trim();
              if (!jsonData) continue;
              
              try {
                const parsed = JSON.parse(jsonData);
                
                // Extrair o texto do formato Gemini
                const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                if (content) {
                  if (!firstTokenReceived) {
                    const elapsedTime = Date.now() - startTime;
                    console.log(`🎉 [CHAT-PROFESSORA] Primeiro token recebido após ${elapsedTime}ms`);
                    firstTokenReceived = true;
                  }
                  
                  tokenCount++;
                  
                  // Converter para formato SSE esperado pelo frontend
                  const sseData = `data: ${JSON.stringify({
                    choices: [{
                      delta: { content }
                    }]
                  })}\n\n`;
                  
                  controller.enqueue(new TextEncoder().encode(sseData));
                  chunksSent++;
                  
                  if (chunksSent % 10 === 0) {
                    console.log(`📤 [CHAT-PROFESSORA] ${chunksSent} chunks enviados (${tokenCount} tokens)`);
                  }
                }
                
                // Verificar se finalizou
                if (parsed.candidates?.[0]?.finishReason) {
                  const finishReason = parsed.candidates[0].finishReason;
                  const safetyRatings = parsed.candidates[0].safetyRatings;
                  const totalTime = Date.now() - startTime;
                  
                  console.log(`🏁 [CHAT-PROFESSORA] FinishReason: ${finishReason}`);
                  
                  if (finishReason === 'SAFETY') {
                    console.warn(`⚠️ [CHAT-PROFESSORA] Bloqueado por filtro de segurança!`);
                    console.warn(`⚠️ [CHAT-PROFESSORA] Safety ratings:`, JSON.stringify(safetyRatings));
                  } else if (finishReason === 'MAX_TOKENS') {
                    console.warn(`⚠️ [CHAT-PROFESSORA] Atingiu limite de tokens (${tokenCount})`);
                  } else if (finishReason === 'STOP') {
                    console.log(`✅ [CHAT-PROFESSORA] Finalização normal`);
                  }
                  
                  console.log(`✅ [CHAT-PROFESSORA] Streaming finalizado após ${totalTime}ms`);
                  console.log(`📊 [CHAT-PROFESSORA] Total: ${tokenCount} tokens, ${chunksSent} chunks enviados`);
                  controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                }
              } catch (e) {
                console.warn('⚠️ [CHAT-PROFESSORA] Erro ao parsear JSON (chunk incompleto):', e);
              }
            }
          }
        } catch (transformError) {
          console.error('❌ [CHAT-PROFESSORA] Erro no transform:', transformError);
        }
      },
      flush(controller) {
        // Garantir envio de [DONE] se ainda não foi enviado
        if (firstTokenReceived && chunksSent > 0) {
          console.log(`✨ [CHAT-PROFESSORA] Flush: enviando [DONE] final`);
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        }
        
        if (!firstTokenReceived) {
          console.error('⚠️ [CHAT-PROFESSORA] Streaming finalizado sem receber nenhum token!');
          console.error('⚠️ [CHAT-PROFESSORA] Possível problema: API não retornou dados ou CORS bloqueou');
        } else {
          console.log(`✨ [CHAT-PROFESSORA] Stream concluído com sucesso: ${tokenCount} tokens, ${chunksSent} chunks`);
        }
      }
    });

    // Retornar o stream processado
    return new Response(response.body?.pipeThrough(stream), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('❌ [CHAT-PROFESSORA] Erro fatal:', error);
    console.error('❌ [CHAT-PROFESSORA] Stack:', error instanceof Error ? error.stack : 'N/A');
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: 'Desculpe, ocorreu um erro. Por favor, tente novamente.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
