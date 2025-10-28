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
    const { messages, files, mode, extractedText } = await req.json();
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

    // Preparar o prompt do sistema baseado no modo
    let systemPrompt = '';
    
    if (mode === 'lesson') {
      systemPrompt = `Você é uma professora de direito didática e direta.

REGRAS:
1. Cite artigos/leis primeiro
2. Explique em linguagem simples
3. Use # apenas para título principal, ## para seções (max 4)
4. Use [COMPARAÇÃO] para comparar 2-3 conceitos (sempre em carrossel)
5. Use [INFOGRÁFICO] para processos/etapas sequenciais
6. Seja BREVE mas completa (max 400 palavras)

FORMATO CARROSSEL (use SEMPRE ao comparar):
[COMPARAÇÃO: Título]
{"cards": [{"title": "...", "description": "...", "example": "...", "icon": "⚖️"}]}
[/COMPARAÇÃO]

FORMATO INFOGRÁFICO (use para processos):
[INFOGRÁFICO: Título]
{"steps": [{"number": 1, "title": "...", "description": "...", "icon": "📝"}]}
[/INFOGRÁFICO]

[SUGESTÕES] no final com 3 perguntas.${cfContext ? `\n\nCONTEXTO CF:${cfContext}` : ''}`;
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
      systemPrompt = `Você é uma assistente jurídica rápida e prática.

REGRAS:
1. Cite lei/artigo PRIMEIRO
2. Linguagem clara e direta
3. Use [COMPARAÇÃO] para comparar 2-3 conceitos
4. Use [INFOGRÁFICO] para etapas/processos
5. [ATENÇÃO] apenas se CRÍTICO
6. Máximo 300 palavras

CARROSSEL (ao comparar institutos, tipos, diferenças):
[COMPARAÇÃO: Título]
{"cards": [{"title": "...", "description": "...", "example": "...", "icon": "⚖️"}]}
[/COMPARAÇÃO]

INFOGRÁFICO (processos passo a passo):
[INFOGRÁFICO: Título]
{"steps": [{"number": 1, "title": "...", "description": "...", "icon": "📝"}]}
[/INFOGRÁFICO]

ESTATÍSTICAS (dados numéricos):
[ESTATÍSTICAS]
{"stats": [{"label": "...", "value": "...", "icon": "⏰"}]}
[/ESTATÍSTICAS]

[SUGESTÕES] ao final com 3 perguntas.${cfContext ? `\n\nCONTEXTO CF:${cfContext}` : ''}
${fileAnalysisPrefix}`;
    }

    // Construir mensagens no formato Gemini com suporte multimodal
    let geminiContents: any[] = [];
    
    // Adicionar system prompt como primeira mensagem do usuário
    geminiContents.push({
      role: 'user',
      parts: [{ text: systemPrompt }]
    });
    
    // Comprimir histórico: enviar apenas últimas 5 mensagens + system prompt
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
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: mode === 'lesson' ? 2500 : 1500,
        topP: 0.95,
        topK: 40,
      },
    };

    // Função auxiliar para fazer requisição à API
    const fetchGemini = async (apiKey: string) => {
      return await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${apiKey}&alt=sse`,
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
    console.log('📊 [CHAT-PROFESSORA] Modo:', mode);
    console.log('💬 [CHAT-PROFESSORA] Número de mensagens:', messages.length);
    console.log('📎 [CHAT-PROFESSORA] Arquivos anexados:', files?.length || 0);
    
    const startTime = Date.now();
    const payloadSize = JSON.stringify(payload).length;
    console.log(`📦 [CHAT-PROFESSORA] Tamanho do payload: ${payloadSize} bytes (${messages.length} mensagens)`);
    console.log('🤖 [CHAT-PROFESSORA] Iniciando chamada à API Gemini 2.5 Flash...');
    
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
                  const totalTime = Date.now() - startTime;
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
      flush() {
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
