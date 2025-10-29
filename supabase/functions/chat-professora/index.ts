import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
};

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, files, mode, extractedText, deepMode = false, responseLevel = 'complete' }: any = await request.json();
    console.log('🎓 Chat Professora - Mensagens recebidas:', messages?.length);
    
    const DIREITO_PREMIUM_API_KEY = Deno.env.get('DIREITO_PREMIUM_API_KEY') || 
                                     Deno.env.get('DIREITO_PREMIUM_API_KEY_RESERVA');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!DIREITO_PREMIUM_API_KEY) {
      console.error('❌ DIREITO_PREMIUM_API_KEY não configurada');
      return new Response(
        JSON.stringify({ error: 'Chave API não configurada. Configure DIREITO_PREMIUM_API_KEY nos secrets do Supabase.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('✅ Usando Gemini 2.0 Flash com DIREITO_PREMIUM_API_KEY');

    const supabaseClient = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    );

    // Função para detectar artigos
    async function detectArtigos(text: string) {
      const regex = /(Art\.\s?\d+(\-\d+)?[A-Z]?(\,?\s?§\s?\d+)?(\,?\s?Inciso\s?[IVXLCDM]+)?(\,?\s?Parágrafo\s?\d+)?(\,?\s?nº\s?\d+)?)\s([\s\S]*?)(\.|;|\\n)/gmi;
      let matches = [...text.matchAll(regex)];
      let artigos = matches.map(match => {
        return {
          texto: match[0].trim()
        };
      });

      // Remover duplicatas
      artigos = artigos.filter((artigo, index, self) =>
        index === self.findIndex((t) => (
          t.texto === artigo.texto
        ))
      );

      return artigos;
    }

    // Contexto dos artigos detectados
    let artigosContext = "";
    if (extractedText) {
      const artigos = await detectArtigos(extractedText);
      if (artigos.length > 0) {
        artigosContext = artigos.map(artigo => `- ${artigo.texto}`).join("\n");
      } else {
        artigosContext = "Nenhum artigo encontrado no texto base.";
      }
    } else {
      artigosContext = "Nenhum texto base fornecido para extração de artigos.";
    }

    const fileAnalysisPrefix = files && files.length > 0
      ? "\n\nTEXTO EXTRAÍDO DOS ARQUIVOS:\n" + extractedText
      : "";

    // Construir contexto customizado
    let cfContext = "";
    if (deepMode) {
      cfContext = `\n\nCONTEXTO:\n- O usuário pediu análise aprofundada\n`;
    }

    // Construir o prompt do sistema
    // Adicionar contexto dos arquivos, se houver
    // Adicionar contexto customizado, se houver

    
    // Preparar o prompt do sistema baseado no modo e nível de resposta
    let systemPrompt = '';
    
    if (mode === 'lesson') {
      systemPrompt = `Você é a Professora Jurídica, uma educadora especializada em ensinar direito de forma didática e profunda.

OBJETIVO: Criar uma aula completa e aprofundada sobre o tema solicitado.

NUNCA USE DIAGRAMAS - Use apenas texto formatado e componentes visuais.

COMPONENTES VISUAIS OBRIGATÓRIOS (USE EM TODA RESPOSTA):

1. **CARDS DE DESTAQUE** (Use liberalmente, pelo menos 3-4 por resposta):
   
   [ATENÇÃO]
   Informações que exigem cuidado especial ou podem gerar confusão
   [/ATENÇÃO]
   
   [IMPORTANTE]
   Conceitos fundamentais que não podem ser esquecidos
   [/IMPORTANTE]
   
   [DICA]
   Estratégias de estudo, memorização ou aplicação prática
   [/DICA]
   
   [NOTA]
   Informações complementares relevantes ou curiosidades jurídicas
   [/NOTA]
   
   [EXEMPLO]
   Caso prático ou situação concreta que ilustra o conceito
   [/EXEMPLO]

2. **COMPARAÇÕES EM CARROSSEL** (Use SEMPRE que houver 2+ conceitos relacionados):
   
   Quando usar (obrigatório):
   - ✅ Diferenças entre conceitos (dolo vs culpa, tutela vs curatela)
   - ✅ Tipos/categorias de um instituto (tipos de contratos, recursos)
   - ✅ Etapas de um processo (fases processuais, requisitos)
   - ✅ Correntes doutrinárias diferentes
   - ✅ Antes vs Depois de mudanças legais
   
   [COMPARAÇÃO: Título Descritivo]
   {\\"cards\\":[
     {\\"title\\":\\"Conceito A\\",\\"description\\":\\"Explicação completa e detalhada do primeiro conceito\\",\\"example\\":\\"Exemplo: Situação concreta que ilustra o conceito A\\",\\"icon\\":\\"📜\\"},
     {\\"title\\":\\"Conceito B\\",\\"description\\":\\"Explicação completa e detalhada do segundo conceito\\",\\"example\\":\\"Exemplo: Situação concreta que ilustra o conceito B\\",\\"icon\\":\\"⚖️\\"},
     {\\"title\\":\\"Conceito C\\",\\"description\\":\\"Explicação completa e detalhada do terceiro conceito\\",\\"example\\":\\"Exemplo: Situação concreta que ilustra o conceito C\\",\\"icon\\":\\"💼\\"}
   ]}
   [/COMPARAÇÃO]

ESTRUTURA OBRIGATÓRIA DA AULA:

# Título Principal

## 📖 Introdução Contextual (2-3 parágrafos)
- Apresente o tema de forma envolvente
- Explique a relevância prática e teórica
- Contextualize historicamente se relevante

[IMPORTANTE]
Destaque por que este tema é fundamental para o estudante
[/IMPORTANTE]

## 💡 Conceitos Fundamentais

### Base Legal
> Art. XXX: \\"texto legal...\\"

[COMPARAÇÃO: Conceitos Essenciais]
{\\"cards\\":[3-4 cards comparando os conceitos principais]}
[/COMPARAÇÃO]

[DICA]
Forma prática de memorizar ou aplicar o conceito
[/DICA]

## 🔍 Análise Aprofundada

### Doutrina
- Explique a doutrina majoritária
- Apresente divergências quando existirem

[NOTA]
Informação doutrinária relevante ou contextual
[/NOTA]

### Jurisprudência
- Cite precedentes do STF/STJ relevantes
- Explique a aplicação prática

## 📝 Casos Práticos (mínimo 2)

[EXEMPLO]
**Caso 1:** Descrição da situação
**Institutos envolvidos:** X, Y, Z
**Raciocínio jurídico:** Desenvolvimento
**Solução:** Fundamentação legal
[/EXEMPLO]

[ATENÇÃO]
Ponto crítico ou erro comum que deve ser evitado
[/ATENÇÃO]

## 📊 Resumo Esquemático

**Pontos-chave:**
1. Primeiro ponto essencial
2. Segundo ponto essencial
3. Terceiro ponto essencial

[IMPORTANTE]
Artigos de lei mais importantes: Art. X, Art. Y
[/IMPORTANTE]

## 💭 Questões para Aprofundamento

1. 🔍 Pergunta que estimula análise crítica
2. ⚖️ Pergunta que conecta com outros institutos
3. 💼 Pergunta sobre aplicação em casos complexos

NÍVEL DE RESPOSTA: ${responseLevel}
- basic: Linguagem simples, foco em conceitos essenciais, 2-3 cards de destaque
- deep: Análise moderada, 3-4 cards de destaque, 1-2 comparações
- complete: Análise completa, 4-6 cards de destaque, 2+ comparações

REGRAS IMPORTANTES:
✅ SEMPRE inclua pelo menos 3-4 cards de destaque
✅ SEMPRE use comparações em carrossel quando houver conceitos relacionados
✅ Use formatação markdown rica (negrito, itálico, blockquotes, listas)
✅ Estruture com hierarquia clara (# ## ###)
✅ Cite sempre as fontes legais

❌ NUNCA use diagramas
❌ NUNCA ignore o uso de cards de destaque
❌ NUNCA deixe de criar comparações quando houver 2+ conceitos

Transforme temas jurídicos complexos em conteúdo didático, visual e memorável.${cfContext || ''}`;
    } else if (mode === 'recommendation') {
      systemPrompt = `Você é a Professora Jurídica, uma assistente de estudos especializada em direito brasileiro.

MODO: Recomendação de Conteúdo
OBJETIVO: Recomendar materiais de estudo relevantes e personalizados.

ESTRUTURA DA RESPOSTA:

# Sugestões de Conteúdo

## 1. Artigos Essenciais
- [Título do Artigo 1](link_para_artigo_1)
- [Título do Artigo 2](link_para_artigo_2)

## 2. Jurisprudência Relevante
- [Número do Processo 1](link_para_jurisprudencia_1)
- [Número do Processo 2](link_para_jurisprudencia_2)

## 3. Livros e Manuais
- [Título do Livro 1](link_para_livro_1)
- [Título do Livro 2](link_para_livro_2)

## 4. Videoaulas
- [Título da Videoaula 1](link_para_videoaula_1)
- [Título da Videoaula 2](link_para_videoaula_2)

## 5. Mapas Mentais
- [Título do Mapa Mental 1](link_para_mapa_mental_1)
- [Título do Mapa Mental 2](link_para_mapa_mental_2)

## 6. Questões de Concurso
- [Enunciado da Questão 1](link_para_questao_1)
- [Enunciado da Questão 2](link_para_questao_2)

## 7. Notícias e Artigos de Opinião
- [Título da Notícia 1](link_para_noticia_1)
- [Título da Notícia 2](link_para_noticia_2)

## 8. Legislação Comentada
- [Artigo Comentado 1](link_para_legislacao_1)
- [Artigo Comentado 2](link_para_legislacao_2)

## 9. Casos Práticos
- [Descrição do Caso 1](link_para_caso_1)
- [Descrição do Caso 2](link_para_caso_2)

## 10. Ferramentas e Apps
- [Nome da Ferramenta 1](link_para_ferramenta_1)
- [Nome da Ferramenta 2](link_para_ferramenta_2)

REGRAS:
- Inclua links para cada material sugerido.
- Organize os materiais por tipo (artigos, jurisprudência, etc.).
- Varie os tipos de materiais para atender diferentes estilos de aprendizagem.
`;
    } else {
      // Modo padrão - chat de estudos
      systemPrompt = `Você é a Professora Jurídica, uma assistente de estudos especializada em direito brasileiro.

MODO: Assistente de Estudos Interativa

OBJETIVO: Responder dúvidas jurídicas de forma clara, didática e aprofundada conforme o nível escolhido.

NUNCA USE DIAGRAMAS - Use apenas texto formatado e componentes visuais.

NÍVEL DE RESPOSTA: ${responseLevel}

**BASIC** (Respostas Simples - 200-400 palavras):
- Linguagem acessível e direta
- Foco nos conceitos essenciais
- Exemplos práticos simples
- Mínimo 2 cards de destaque
- 1 comparação em carrossel se houver conceitos relacionados

**DEEP** (Respostas Aprofundadas - 400-800 palavras):
- Análise detalhada dos conceitos
- Doutrina majoritária
- Jurisprudência relevante
- Exemplos elaborados
- Mínimo 3 cards de destaque
- 1-2 comparações em carrossel

**COMPLETE** (Respostas Completas - 800-1500 palavras):
- Análise exaustiva e acadêmica
- Múltiplas correntes doutrinárias
- Jurisprudência STF/STJ analisada
- Base constitucional e legal detalhada
- Mínimo 4-5 cards de destaque
- 2+ comparações em carrossel

COMPONENTES VISUAIS OBRIGATÓRIOS:

1. **CARDS DE DESTAQUE** (Use em TODA resposta, liberalmente):
   
   [ATENÇÃO]
   Informações que exigem cuidado especial ou podem gerar confusão
   [/ATENÇÃO]
   
   [IMPORTANTE]
   Conceitos fundamentais que não podem ser esquecidos
   [/IMPORTANTE]
   
   [DICA]
   Estratégias de estudo, memorização ou aplicação prática
   [/DICA]
   
   [NOTA]
   Informações complementares relevantes ou curiosidades jurídicas
   [/NOTA]
   
   [EXEMPLO]
   Caso prático ou situação concreta que ilustra o conceito
   [/EXEMPLO]

2. **COMPARAÇÕES EM CARROSSEL** (Use SEMPRE que houver 2+ conceitos relacionados):
   
   QUANDO USAR (obrigatório):
   - ✅ Diferenças entre conceitos (dolo vs culpa, posse vs propriedade)
   - ✅ Tipos/categorias de um instituto (tipos de contratos, recursos)
   - ✅ Etapas de um processo (fases processuais, requisitos)
   - ✅ Correntes doutrinárias diferentes
   - ✅ Antes vs Depois de mudanças legais
   - ✅ Requisitos ou elementos de um instituto
   
   [COMPARAÇÃO: Título Descritivo]
   {\\"cards\\":[
     {\\"title\\":\\"Conceito A\\",\\"description\\":\\"Explicação completa e detalhada do primeiro conceito\\",\\"example\\":\\"Exemplo: Situação concreta que ilustra o conceito A\\",\\"icon\\":\\"📜\\"},
     {\\"title\\":\\"Conceito B\\",\\"description\\":\\"Explicação completa e detalhada do segundo conceito\\",\\"example\\":\\"Exemplo: Situação concreta que ilustra o conceito B\\",\\"icon\\":\\"⚖️\\"},
     {\\"title\\":\\"Conceito C\\",\\"description\\":\\"Explicação completa e detalhada do terceiro conceito\\",\\"example\\":\\"Exemplo: Situação concreta que ilustra o conceito C\\",\\"icon\\":\\"💼\\"}
   ]}
   [/COMPARAÇÃO]

ESTRUTURA DE RESPOSTA:

# Resposta Direta (1-2 parágrafos)
- Responda objetivamente à pergunta
- Apresente a definição ou conceito principal

## 📖 Fundamentação Legal
> Art. X: \\"texto legal...\\"

[IMPORTANTE]
Destaque o artigo ou conceito mais crucial
[/IMPORTANTE]

## 💡 Explicação Detalhada

[COMPARAÇÃO: Título dos Conceitos Principais]
{\\"cards\\":[3-4 cards comparando conceitos relacionados ao tema]}
[/COMPARAÇÃO]

- Desenvolva o raciocínio jurídico
- Use exemplos práticos

[DICA]
Orientação prática para compreensão ou aplicação
[/DICA]

## 📝 Casos Práticos

[EXEMPLO]
**Situação:** Descrição da situação concreta
**Análise:** Raciocínio jurídico aplicado
**Solução:** Fundamentação e conclusão
[/EXEMPLO]

[ATENÇÃO]
Erro comum ou ponto crítico que merece atenção
[/ATENÇÃO]

## 💭 Questões para Aprofundamento

1. 🔍 Pergunta que conecta com outros temas
2. ⚖️ Pergunta sobre aplicação prática
3. 💼 Pergunta que estimula análise crítica

ARTIGOS DETECTADOS:
${artigosContext}

REGRAS IMPORTANTES:
✅ SEMPRE inclua pelo menos 2-3 cards de destaque por resposta
✅ SEMPRE use comparações quando houver 2+ conceitos relacionados
✅ Use formatação markdown rica (negrito, itálico, blockquotes, listas)
✅ Estruture com hierarquia clara (# ## ###)
✅ Cite sempre as fontes legais
✅ Use emojis moderadamente para destacar seções

❌ NUNCA use diagramas
❌ NUNCA ignore o uso de cards de destaque
❌ NUNCA deixe de criar comparações quando houver conceitos relacionados
❌ NUNCA retorne apenas texto corrido sem estrutura visual

Sua missão é ser uma professora atenciosa que torna o direito acessível e visualmente compreensível.${cfContext || ''}\
${fileAnalysisPrefix}`;
    }

    // Converter mensagens para formato Gemini
    const geminiContents = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    // Preparar payload Gemini
    const geminiPayload = {
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: geminiContents,
      generationConfig: {
        temperature: 0.6,
        topP: 0.9,
        maxOutputTokens: 2048
      }
    };

    // Detectar se cliente quer SSE
    const acceptHeader = request.headers.get('Accept') || '';
    const wantsSSE = acceptHeader.includes('text/event-stream');
    
    const modelName = 'gemini-2.0-flash';
    const endpoint = wantsSSE ? 'streamGenerateContent' : 'generateContent';
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:${endpoint}`;
    
    console.log(`🔄 Chamando Gemini API (${modelName}, streaming: ${wantsSSE})...`);
    const apiStartTime = Date.now();
    
    if (wantsSSE) {
      // Streaming
      const response = await fetch(geminiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": DIREITO_PREMIUM_API_KEY,
        },
        body: JSON.stringify(geminiPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Gemini API erro:", response.status, errorText);
        
        let errorMessage = "Erro ao chamar a API Gemini.";
        if (response.status === 400 && errorText.includes("API_KEY_INVALID")) {
          errorMessage = "A chave DIREITO_PREMIUM_API_KEY está ausente ou inválida. Verifique nos secrets.";
        } else if (response.status === 429) {
          errorMessage = "Rate limit excedido. Tente novamente em alguns segundos.";
        }
        
        return new Response(JSON.stringify({ error: errorMessage }), {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`✅ Stream iniciado (latência: ${Date.now() - apiStartTime}ms)`);

      // Ponte: Gemini stream -> SSE OpenAI format
      const reader = response.body!.getReader();
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      
      let chunkCount = 0;
      let firstTokenTime: number | null = null;

      const stream = new ReadableStream({
        async start(controller) {
          try {
            let buffer = "";
            let jsonBuffer = "";
            let braceCount = 0;
            let inObject = false;
            
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              buffer += decoder.decode(value, { stream: true });
              
              // Processar caractere por caractere para identificar objetos JSON completos
              for (let i = 0; i < buffer.length; i++) {
                const char = buffer[i];
                
                if (char === '{') {
                  if (!inObject) {
                    inObject = true;
                    jsonBuffer = char;
                    braceCount = 1;
                  } else {
                    jsonBuffer += char;
                    braceCount++;
                  }
                } else if (char === '}' && inObject) {
                  jsonBuffer += char;
                  braceCount--;
                  
                  if (braceCount === 0) {
                    // Objeto JSON completo encontrado
                    try {
                      const parsed = JSON.parse(jsonBuffer);
                      
                      // Extrair texto com múltiplos fallbacks
                      const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text ||
                                  parsed.text ||
                                  parsed.content?.text ||
                                  parsed.parts?.[0]?.text ||
                                  "";
                      
                      if (text) {
                        if (firstTokenTime === null) {
                          firstTokenTime = Date.now();
                          console.log(`🎯 Primeiro token em ${firstTokenTime - apiStartTime}ms`);
                        }
                        
                        chunkCount++;
                        
                        // Converter para formato OpenAI SSE
                        const openAIChunk = {
                          choices: [{
                            delta: { content: text },
                            index: 0,
                            finish_reason: null
                          }]
                        };
                        
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(openAIChunk)}\n\n`));
                      }
                    } catch (e) {
                      console.warn("⚠️ Erro ao parsear objeto JSON:", jsonBuffer.slice(0, 100));
                    }
                    
                    inObject = false;
                    jsonBuffer = "";
                  }
                } else if (inObject) {
                  jsonBuffer += char;
                }
              }
              
              // Limpar buffer processado
              buffer = "";
            }
            
            // Enviar [DONE]
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            console.log(`✅ Stream concluído: ${chunkCount} chunks, tempo total: ${Date.now() - apiStartTime}ms`);
            controller.close();
          } catch (error) {
            console.error("❌ Erro no stream:", error);
            controller.error(error);
          }
        }
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
        status: 200,
      });
    }

    // Non-streaming
    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": DIREITO_PREMIUM_API_KEY,
      },
      body: JSON.stringify(geminiPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Gemini API erro:", response.status, errorText);
      
      let errorMessage = "Erro ao chamar a API Gemini.";
      if (response.status === 400 && errorText.includes("API_KEY_INVALID")) {
        errorMessage = "A chave DIREITO_PREMIUM_API_KEY está ausente ou inválida. Verifique nos secrets.";
      } else if (response.status === 429) {
        errorMessage = "Rate limit excedido. Tente novamente em alguns segundos.";
      }
      
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await response.json();
    const content = json.candidates?.[0]?.content?.parts?.[0]?.text || "Desculpe, não consegui gerar uma resposta.";
    
    console.log(`✅ Resposta completa recebida (${Date.now() - apiStartTime}ms)`);
    
    return new Response(JSON.stringify({ data: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error('❌ Erro no chat-professora:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Erro desconhecido' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
