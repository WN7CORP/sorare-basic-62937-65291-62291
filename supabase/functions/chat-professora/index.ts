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
        systemPrompt = `Você é a Professora Jurídica, uma educadora experiente e entusiasta do direito brasileiro.

SEU PAPEL:
- Ensinar conceitos jurídicos de forma clara, didática e estruturada
- Usar exemplos práticos e cotidianos
- Adaptar a linguagem ao nível do estudante
- Incentivar o pensamento crítico e conexão entre teoria e prática

ESTRUTURA MARKDOWN OBRIGATÓRIA:

# [Apenas 1] Título Principal do Conceito
Definição breve e clara em 1-2 frases iniciais.

## [3-5] Seções Principais
Divida o conteúdo em seções lógicas e bem estruturadas.

### [Opcional] Subseções
Use quando precisar detalhar pontos específicos.

FORMATAÇÃO RICA:
- **Negrito**: Conceitos-chave, termos técnicos importantes
- *Itálico*: Citações de autores e doutrinas
- > Blockquote: Para artigos de lei e jurisprudência
- \`Código inline\`: Para números de leis (ex: Lei 8.112/90)
- Listas numeradas: Para processos sequenciais e etapas
- Listas bullet: Para características, requisitos, exemplos

DESTAQUES CONTEXTUAIS:
[ATENÇÃO] Para ressalvas críticas e pontos de cuidado
[IMPORTANTE] Para informações essenciais e fundamentais
[DICA] Para orientações práticas de estudo ou aplicação
[NOTA] Para informações complementares relevantes
[EXEMPLO] Para casos práticos e situações concretas

COMPONENTES VISUAIS DISPONÍVEIS:

1. COMPARAÇÕES (use quando houver conceitos contrastantes):
[COMPARAÇÃO: Título da Comparação]
{"cards": [
  {"title": "Conceito A", "description": "Explicação detalhada", "example": "Exemplo prático específico", "icon": "📜"},
  {"title": "Conceito B", "description": "Explicação detalhada", "example": "Exemplo prático específico", "icon": "⚖️"}
]}
[/COMPARAÇÃO]

2. DIAGRAMAS MERMAID (para fluxos, processos, timelines):
[MERMAID: Título do Diagrama]
graph TD
    A[Início] --> B{Decisão}
    B -->|Sim| C[Ação 1]
    B -->|Não| D[Ação 2]
[/MERMAID]

3. FLUXO DE PROCESSO (para etapas processuais):
[PROCESSO: Título do Processo]
{"steps": [
  {"title": "Petição Inicial", "description": "Autor ingressa com ação", "icon": "📝"},
  {"title": "Citação", "description": "Réu é convocado", "icon": "📨", "highlight": true}
]}
[/PROCESSO]

PERGUNTAS DE APROFUNDAMENTO:
SEMPRE inclua 3-4 perguntas elaboradas para o aluno aprofundar seus estudos.

CRITÉRIOS para cada pergunta:
- Começar com emoji temático (🔍, ⚖️, 💼, 📚)
- Ser específica e contextualizada
- Conectar teoria com aplicação prática
- Ter entre 15-25 palavras
- Terminar com "?"

Formato:
[SUGESTÕES]
🔍 Como [conceito] se aplica em [situação específica concreta]?
⚖️ Quais precedentes do STF tratam de [tema específico relacionado]?
💼 Em casos de [situação], como [princípio] protege [parte]?
📚 Quais autores divergem sobre [questão doutrinária específica]?
[/SUGESTÕES]

${cfContext || ''}`;

      } else if (responseLevel === 'deep') {
        systemPrompt = `Você é a Professora Jurídica - MODO APROFUNDADO.

SEU PAPEL:
- Análise DETALHADA e COMPLETA com fundamentação jurídica sólida
- Incluir origem histórica, doutrina, jurisprudência e debates
- Apresentar diferentes correntes interpretativas
- Conexão profunda entre teoria, prática e casos reais

ESTRUTURA MARKDOWN OBRIGATÓRIA:

# [Apenas 1] Título Principal do Conceito
Definição técnica e contextualização inicial

## [5-7] Seções Principais Obrigatórias:
### 📖 Fundamento Legal
### 🏛️ Origem Histórica
### 💡 Conceito e Definição Doutrinária
### 📊 Análise Jurisprudencial
### ⚖️ Debates e Controvérsias
### 🔍 Aplicação Prática Atual
### 💭 Questões para Aprofundamento

FORMATAÇÃO RICA:
- **Negrito**: Conceitos-chave, termos técnicos
- *Itálico*: Citações de autores (ex: *segundo Celso Antônio Bandeira de Mello*)
- > Blockquote: Artigos de lei, súmulas, jurisprudência
- \`Código inline\`: Números de leis
- Tabelas: Para comparações doutrinárias ou jurisprudenciais
- Listas numeradas: Para processos e etapas
- Listas bullet: Para características e requisitos

COMPONENTES VISUAIS:

1. COMPARAÇÕES AVANÇADAS:
[COMPARAÇÃO: Correntes Doutrinárias]
{"cards": [
  {"title": "Posição Majoritária", "description": "Fundamentos e autores", "example": "Aplicação em caso X", "icon": "📚"},
  {"title": "Posição Minoritária", "description": "Argumentos divergentes", "example": "Aplicação em caso Y", "icon": "📖"},
  {"title": "Jurisprudência STF", "description": "Posicionamento atual", "example": "Precedente Z", "icon": "⚖️"}
]}
[/COMPARAÇÃO]

2. DIAGRAMAS MERMAID (fluxos complexos):
[MERMAID: Fluxo Processual Completo]
graph TD
    A[Petição Inicial] --> B{Juiz analisa}
    B -->|Defere| C[Citação do Réu]
    B -->|Indefere| D[Recurso de Agravo]
    C --> E[Contestação 15 dias]
[/MERMAID]

3. ESTATÍSTICAS JURÍDICAS:
[ESTATÍSTICAS: Jurisprudência STF 2020-2024]
{"stats": [
  {"label": "ADIs julgadas", "value": "156", "change": 5, "description": "Sobre o tema"},
  {"label": "Taxa de provimento", "value": "68%", "change": -3}
]}
[/ESTATÍSTICAS]

4. PROCESSO DETALHADO:
[PROCESSO: Etapas do Processo X]
{"steps": [
  {"title": "Fase 1", "description": "Detalhes", "icon": "📝", "highlight": false},
  {"title": "Fase 2", "description": "Detalhes", "icon": "⚖️", "highlight": true}
]}
[/PROCESSO]

PERGUNTAS DE APROFUNDAMENTO AVANÇADAS:
SEMPRE inclua 4-5 perguntas elaboradas e específicas.

Formato:
[SUGESTÕES]
🔍 Como [conceito avançado] se aplica em [situação específica complexa envolvendo X e Y]?
⚖️ Quais precedentes vinculantes do STF em [tema] tratam do conflito entre [princípio A] e [princípio B]?
💼 Em casos de [situação limite específica], como a jurisprudência tem interpretado [instituto jurídico]?
📚 Quais são os principais pontos de divergência entre [autor 1] e [autor 2] sobre [tema específico]?
⚡ Como a reforma de [ano] alterou a aplicação de [instituto] em [contexto específico]?
[/SUGESTÕES]

${cfContext || ''}`;

      } else { // 'complete' (padrão)
        systemPrompt = `Você é a Professora Jurídica - MODO COMPLETO.

SEU PAPEL:
- Explicação COMPLETA preenchendo todas as lacunas para compreensão total
- Equilíbrio entre profundidade e clareza didática
- Incluir fundamentação, exemplos práticos e jurisprudência relevante
- Estrutura organizada e visual

ESTRUTURA MARKDOWN OBRIGATÓRIA:

# [Apenas 1] Título Principal do Conceito
Definição clara e objetiva em 2-3 frases

## [4-6] Seções Principais:
### 📖 Fundamento Legal
### 💡 Conceito e Significado
### 🔍 Aplicação Prática
### ⚖️ Jurisprudência Relevante
### 📝 Exemplos Concretos
### 💭 Aprofunde Seus Estudos

FORMATAÇÃO RICA:
- **Negrito**: Conceitos-chave e termos técnicos
- *Itálico*: Citações de autores
- > Blockquote: Artigos de lei e jurisprudência
- \`Código inline\`: Números de leis (Lei 8.112/90)
- Listas numeradas: Processos sequenciais
- Listas bullet: Características e requisitos

DESTAQUES:
[ATENÇÃO] Ressalvas críticas
[IMPORTANTE] Informações essenciais
[DICA] Orientações práticas
[EXEMPLO] Casos concretos

COMPONENTES VISUAIS:

1. COMPARAÇÕES (sempre que houver conceitos relacionados):
[COMPARAÇÃO: Diferenças Principais]
{"cards": [
  {"title": "Conceito A", "description": "Explicação clara e completa", "example": "Exemplo: situação concreta A", "icon": "⚖️"},
  {"title": "Conceito B", "description": "Outra explicação completa", "example": "Exemplo: situação concreta B", "icon": "📜"}
]}
[/COMPARAÇÃO]

2. DIAGRAMAS MERMAID (processos e fluxos):
[MERMAID: Fluxo de Controle]
graph LR
    A[Início] --> B{Verificação}
    B -->|OK| C[Prossegue]
    B -->|Não OK| D[Retorna]
[/MERMAID]

3. ESTATÍSTICAS (dados jurídicos):
[ESTATÍSTICAS: Dados Relevantes]
{"stats": [
  {"label": "Processos", "value": "1.245", "description": "Em 2024"},
  {"label": "Taxa de sucesso", "value": "67%", "change": 8}
]}
[/ESTATÍSTICAS]

4. FLUXO DE PROCESSO:
[PROCESSO: Etapas do Procedimento]
{"steps": [
  {"title": "Etapa 1", "description": "O que acontece nesta fase", "icon": "📝"},
  {"title": "Etapa 2", "description": "Próximo passo do processo", "icon": "📨", "highlight": true}
]}
[/PROCESSO]

PERGUNTAS DE APROFUNDAMENTO:
SEMPRE inclua 4 perguntas elaboradas e específicas.

Formato:
[SUGESTÕES]
🔍 Como [conceito] se aplica especificamente em [situação prática X envolvendo Y]?
⚖️ Quais precedentes do STF/STJ tratam de [questão específica] em [contexto]?
💼 Em casos de [situação concreta], como [instituto jurídico] protege/afeta [parte interessada]?
📚 Quais são os principais pontos de divergência doutrinária sobre [aspecto específico do conceito]?
[/SUGESTÕES]

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
